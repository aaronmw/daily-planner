import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    getCodeSigningIdentityOutput,
    getStoredNotarizationPassword,
    hasCodeSigningIdentity,
    isDeveloperIdSigningIdentity,
    isInstallableSigningIdentity,
    LOCAL_MACOS_SIGNING_IDENTITY,
    notarizeBuiltMacosDiskImage,
    resolveMacosNotarizationEnvironment,
    resolveMacosSigningIdentity,
} from './macos-signing.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tauriExecutable = join(projectRoot, 'node_modules', '.bin', 'tauri');
const environment = { ...process.env };
const buildArgs = process.argv.slice(2);
let developerIdBuild = false;

if (process.platform === 'darwin') {
    const configuredSigningIdentity = environment.APPLE_SIGNING_IDENTITY;
    const identityOutput = getCodeSigningIdentityOutput();
    const signingIdentity = resolveMacosSigningIdentity({
        configuredIdentity: configuredSigningIdentity,
        identityOutput,
        localIdentity: LOCAL_MACOS_SIGNING_IDENTITY,
    });

    if (!isInstallableSigningIdentity(signingIdentity)) {
        console.error(
            'Ad-hoc signing is not supported for installable Daily Planner ' +
                "builds. Use an Apple-issued identity or Daily Planner's " +
                'project-specific local identity.'
        );
        process.exit(1);
    }

    if (!hasCodeSigningIdentity(signingIdentity)) {
        const setupMessage = configuredSigningIdentity
            ? 'Install the configured identity in an available Keychain before building.'
            : 'Run `pnpm setup:macos-signing` before building.';
        console.error(
            `Code-signing identity is unavailable: ${signingIdentity}\n` +
                setupMessage
        );
        process.exit(1);
    }

    environment.APPLE_SIGNING_IDENTITY = signingIdentity;
    developerIdBuild = isDeveloperIdSigningIdentity({
        identity: signingIdentity,
        identityOutput,
    });
    Object.assign(
        environment,
        resolveMacosNotarizationEnvironment({
            environment,
            identity: signingIdentity,
            identityOutput,
            readPassword: getStoredNotarizationPassword,
        })
    );
    console.log(`Signing the macOS app as: ${signingIdentity}`);
}

const result = spawnSync(tauriExecutable, ['build', ...buildArgs], {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

if (process.platform === 'darwin' && developerIdBuild) {
    const tauriConfig = JSON.parse(
        readFileSync(join(projectRoot, 'src-tauri', 'tauri.conf.json'), 'utf8')
    );
    const cargoMetadata = JSON.parse(
        execFileSync(
            'cargo',
            ['metadata', '--no-deps', '--format-version', '1'],
            {
                cwd: join(projectRoot, 'src-tauri'),
                encoding: 'utf8',
            }
        )
    );
    const dmgPath = notarizeBuiltMacosDiskImage({
        targetDirectory: cargoMetadata.target_directory,
        productName: tauriConfig.productName,
        version: tauriConfig.version,
        platformArch: process.arch,
        buildArgs,
        environment,
    });
    console.log(`Notarized and stapled macOS disk image: ${dmgPath}`);
}
