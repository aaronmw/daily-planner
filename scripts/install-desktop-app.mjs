import { execFileSync, spawnSync } from 'node:child_process';
import {
    existsSync,
    lstatSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDesktopInstallWorkflow } from './desktop-install-workflow.mjs';
import {
    isStableDesignatedRequirement,
    LOGIN_KEYCHAIN,
} from './macos-signing.mjs';
import {
    accessIsSafeToNormalize,
    inspectWebCryptoAccess,
} from './webcrypto-keychain.mjs';

if (process.platform !== 'darwin') {
    console.error('Desktop installation is currently supported only on macOS.');
    process.exit(1);
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tauriConfig = JSON.parse(
    readFileSync(join(projectRoot, 'src-tauri', 'tauri.conf.json'), 'utf8')
);
const targetDirectory = getCargoTargetDirectory();
const appName = tauriConfig.productName;
const bundleIdentifier = tauriConfig.identifier;
const sourceApp = join(
    targetDirectory,
    'release',
    'bundle',
    'macos',
    `${appName}.app`
);
const installedApp = join('/Applications', `${appName}.app`);
const stagingApp = join(
    '/Applications',
    `.${appName}.installing-${process.pid}.app`
);
const backupApp = join(
    '/Applications',
    `.${appName}.previous-${process.pid}.app`
);
const webCryptoAccount = `com.apple.WebKit.WebCrypto.master+${bundleIdentifier}`;

if (!existsSync(sourceApp)) {
    console.error(
        `Release app not found at ${sourceApp}. Run the Tauri build first.`
    );
    process.exit(1);
}

let sourceInspection = null;
let previousAppExisted = false;
const wasRunning = appProcessIds().length > 0;

runDesktopInstallWorkflow({
    wasRunning,
    verifySource: () => {
        sourceInspection = verifyAppBundle(sourceApp);
    },
    stopApp: stopRunningApp,
    installApp,
    registerApp,
    normalizeKeychain: normalizeWebCryptoKeychainAccess,
    commitInstall,
    rollbackInstall,
    relaunchApp,
});

console.log(`Installed ${installedApp}`);

function inspectAppBundle(appPath) {
    const inspection = spawnSync(
        '/usr/bin/codesign',
        ['-d', '--verbose=4', '-r-', appPath],
        { encoding: 'utf8' }
    );
    if (inspection.status !== 0) {
        throw new Error(`Could not inspect the signature for ${appPath}.`);
    }

    const output = `${inspection.stdout ?? ''}${inspection.stderr ?? ''}`;
    const requirement = output.match(/^designated => (.+)$/m)?.[1]?.trim();
    const identifier = output.match(/^Identifier=(.+)$/m)?.[1]?.trim();
    const teamIdentifier = output.match(/^TeamIdentifier=(.+)$/m)?.[1]?.trim();
    const cdHash = output.match(/^CDHash=(.+)$/m)?.[1]?.trim();

    if (!requirement || !identifier || !cdHash) {
        throw new Error(`The signature metadata for ${appPath} is incomplete.`);
    }

    return { cdHash, identifier, requirement, teamIdentifier };
}

function verifyAppBundle(appPath) {
    execFileSync(
        '/usr/bin/codesign',
        ['--verify', '--deep', '--strict', '--verbose=4', appPath],
        { stdio: 'inherit' }
    );

    const inspection = inspectAppBundle(appPath);
    if (inspection.identifier !== bundleIdentifier) {
        throw new Error(
            `${appPath} is signed for ${inspection.identifier}, not ${bundleIdentifier}.`
        );
    }
    if (
        !isStableDesignatedRequirement(inspection.requirement, bundleIdentifier)
    ) {
        throw new Error(
            `${appPath} does not have a stable ${bundleIdentifier} designated requirement.`
        );
    }

    return inspection;
}

function assertSameDesignatedRequirement(appInspection, stage) {
    if (appInspection.requirement !== sourceInspection?.requirement) {
        throw new Error(
            `${stage} does not preserve the verified source designated requirement.`
        );
    }
}

function getCargoTargetDirectory() {
    const metadata = execFileSync(
        'cargo',
        [
            'metadata',
            '--format-version',
            '1',
            '--no-deps',
            '--manifest-path',
            join(projectRoot, 'src-tauri', 'Cargo.toml'),
        ],
        { encoding: 'utf8' }
    );

    return JSON.parse(metadata).target_directory;
}

function appProcessIds() {
    const marker = `/${appName}.app/Contents/MacOS/`;
    const output = execFileSync('ps', ['-axo', 'pid=,command='], {
        encoding: 'utf8',
    });

    return output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.includes(marker))
        .map(line => Number.parseInt(line, 10))
        .filter(Number.isInteger);
}

function stopRunningApp() {
    try {
        execFileSync('osascript', [
            '-e',
            `tell application id "${bundleIdentifier}" to quit`,
        ]);
    } catch {
        // Fall through to terminating only Daily Planner's exact processes.
    }

    waitForExit(5000);
    terminateRemaining('SIGTERM');
    waitForExit(2000);
    terminateRemaining('SIGKILL');
    waitForExit(1000);

    const remainingProcessIds = appProcessIds();
    if (remainingProcessIds.length > 0) {
        throw new Error(
            `Could not stop ${appName} process ${remainingProcessIds.join(', ')}.`
        );
    }
}

function waitForExit(timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        if (appProcessIds().length === 0) return;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
}

function terminateRemaining(signal) {
    for (const pid of appProcessIds()) {
        try {
            process.kill(pid, signal);
        } catch (error) {
            if (error?.code !== 'ESRCH') throw error;
        }
    }
}

function installApp() {
    rmSync(stagingApp, { force: true, recursive: true });
    rmSync(backupApp, { force: true, recursive: true });
    execFileSync('ditto', [sourceApp, stagingApp]);

    const stagedInspection = verifyAppBundle(stagingApp);
    assertSameDesignatedRequirement(stagedInspection, 'The staged app');

    let previousAppMoved = false;
    let replacementMoved = false;
    previousAppExisted = existsOrIsSymlink(installedApp);

    try {
        if (previousAppExisted) {
            renameSync(installedApp, backupApp);
            previousAppMoved = true;
        }
        renameSync(stagingApp, installedApp);
        replacementMoved = true;

        const installedInspection = verifyAppBundle(installedApp);
        assertSameDesignatedRequirement(
            installedInspection,
            'The installed app'
        );
    } catch (error) {
        rmSync(stagingApp, { force: true, recursive: true });
        if (replacementMoved) {
            rmSync(installedApp, { force: true, recursive: true });
        }
        if (previousAppMoved) renameSync(backupApp, installedApp);
        throw error;
    }
}

function registerApp() {
    if (!existsOrIsSymlink(installedApp)) return;

    execFileSync('touch', [installedApp]);
    execFileSync(
        '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister',
        ['-f', installedApp],
        { stdio: 'inherit' }
    );
    execFileSync('mdimport', [installedApp], { stdio: 'inherit' });
}

function normalizeWebCryptoKeychainAccess() {
    const keychainItem = spawnSync(
        'security',
        ['find-generic-password', '-a', webCryptoAccount, LOGIN_KEYCHAIN],
        { stdio: 'ignore' }
    );
    if (keychainItem.status !== 0) {
        console.log(
            'Daily Planner WebCrypto Keychain item does not exist yet; leaving it unchanged.'
        );
        return;
    }

    const installedInspection = verifyAppBundle(installedApp);
    const preflight = inspectWebCryptoAccess(readKeychainAccessMetadata(), {
        account: webCryptoAccount,
        appPath: installedApp,
        bundleIdentifier,
        requirement: installedInspection.requirement,
    });

    if (preflight.normalized) {
        console.log(
            'Daily Planner WebCrypto access already trusts exactly the installed app.'
        );
        return;
    }

    if (
        !accessIsSafeToNormalize(preflight) ||
        preflight.trustedRequirement !== installedInspection.requirement
    ) {
        throw new Error(
            'Refusing to mutate an unexpected WebCrypto ACL:\n' +
                preflight.problems.map(problem => `- ${problem}`).join('\n')
        );
    }

    const temporaryDirectory = mkdtempSync(
        join(tmpdir(), 'daily-planner-keychain-')
    );
    const helper = join(temporaryDirectory, 'configure-keychain-access');
    const source = join(
        projectRoot,
        'scripts',
        'configure-webcrypto-keychain-access.c'
    );

    try {
        execFileSync(
            'xcrun',
            [
                'clang',
                '-Wno-deprecated-declarations',
                '-framework',
                'CoreFoundation',
                '-framework',
                'Security',
                source,
                '-o',
                helper,
            ],
            { stdio: 'inherit' }
        );
        execFileSync(helper, [webCryptoAccount, installedApp, LOGIN_KEYCHAIN], {
            stdio: 'inherit',
        });

        const persistedInspection = inspectWebCryptoAccess(
            readKeychainAccessMetadata(),
            {
                account: webCryptoAccount,
                appPath: installedApp,
                bundleIdentifier,
                requirement: installedInspection.requirement,
            }
        );
        if (!persistedInspection.normalized) {
            throw new Error(
                'WebCrypto ACL verification failed after the Keychain item was re-read:\n' +
                    persistedInspection.problems
                        .map(problem => `- ${problem}`)
                        .join('\n')
            );
        }
    } finally {
        rmSync(temporaryDirectory, { force: true, recursive: true });
    }
}

function readKeychainAccessMetadata() {
    return execFileSync('security', ['dump-keychain', '-a', LOGIN_KEYCHAIN], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

function commitInstall() {
    rmSync(backupApp, { force: true, recursive: true });
}

function rollbackInstall() {
    rmSync(stagingApp, { force: true, recursive: true });
    rmSync(installedApp, { force: true, recursive: true });
    if (previousAppExisted && existsOrIsSymlink(backupApp)) {
        renameSync(backupApp, installedApp);
    }
}

function existsOrIsSymlink(path) {
    try {
        lstatSync(path);
        return true;
    } catch (error) {
        if (error?.code === 'ENOENT') return false;
        throw error;
    }
}

function relaunchApp() {
    execFileSync('open', [installedApp]);
    console.log(`Restarted ${appName}.`);
}
