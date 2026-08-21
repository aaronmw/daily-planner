import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const LOCAL_MACOS_SIGNING_IDENTITY =
    'Daily Planner Local Development Code Signing';
const NOTARIZATION_APPLE_ID = 'aaronmw@gmail.com';
const NOTARIZATION_KEYCHAIN_SERVICE =
    'com.aaronwright.dailyplanner.notarization';
const NOTARIZATION_TEAM_ID = 'J73G3CSYN3';
const APPLE_SIGNING_IDENTITY_PREFIXES = [
    'Developer ID Application:',
    'Apple Development:',
    'Mac Developer:',
];
const LOGIN_KEYCHAIN = join(
    homedir(),
    'Library',
    'Keychains',
    'login.keychain-db'
);

const parseCodeSigningIdentities = output =>
    [...output.matchAll(/^\s*\d+\)\s+([A-F0-9]{40})\s+"([^"]+)"/gm)].map(
        ([, hash, name]) => ({ hash, name })
    );

const getCodeSigningIdentityOutput = (keychain = null) => {
    const args = ['find-identity', '-v', '-p', 'codesigning'];
    if (keychain) args.push(keychain);

    try {
        return execFileSync('security', args, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch {
        return '';
    }
};

const getStoredNotarizationPassword = ({ runSecurity = execFileSync } = {}) => {
    try {
        return runSecurity(
            'security',
            [
                'find-generic-password',
                '-w',
                '-a',
                NOTARIZATION_APPLE_ID,
                '-s',
                NOTARIZATION_KEYCHAIN_SERVICE,
            ],
            {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            }
        ).trim();
    } catch {
        return null;
    }
};

const storeNotarizationPassword = ({ runSecurity = spawnSync } = {}) => {
    const result = runSecurity(
        'security',
        [
            'add-generic-password',
            '-a',
            NOTARIZATION_APPLE_ID,
            '-s',
            NOTARIZATION_KEYCHAIN_SERVICE,
            '-D',
            'application password',
            '-j',
            'Daily Planner Apple notarization app-specific password',
            '-U',
            '-w',
        ],
        { stdio: 'inherit' }
    );

    if (result.error) throw result.error;
    return result.status === 0;
};

const notarizeMacosDiskImage = ({
    dmgPath,
    environment,
    runCommand = spawnSync,
}) => {
    const credentialArgs = environment.APPLE_API_ISSUER
        ? [
              '--issuer',
              environment.APPLE_API_ISSUER,
              '--key-id',
              environment.APPLE_API_KEY,
              '--key',
              environment.APPLE_API_KEY_PATH,
          ]
        : [
              '--apple-id',
              environment.APPLE_ID,
              '--team-id',
              environment.APPLE_TEAM_ID,
              '--password',
              environment.APPLE_PASSWORD,
          ];
    const submitResult = runCommand(
        'xcrun',
        ['notarytool', 'submit', dmgPath, ...credentialArgs, '--wait'],
        { stdio: 'inherit' }
    );
    if (submitResult.error) throw submitResult.error;
    if (submitResult.status !== 0) return false;

    const stapleResult = runCommand('xcrun', ['stapler', 'staple', dmgPath], {
        stdio: 'inherit',
    });
    if (stapleResult.error) throw stapleResult.error;
    return stapleResult.status === 0;
};

const resolveMacosDmgPath = ({
    targetDirectory,
    productName,
    version,
    platformArch,
    buildArgs,
}) => {
    const targetIndex = buildArgs.indexOf('--target');
    const target =
        (targetIndex >= 0 ? buildArgs[targetIndex + 1] : null) ||
        buildArgs
            .find(argument => argument.startsWith('--target='))
            ?.slice('--target='.length);
    const architecture = target?.startsWith('aarch64-')
        ? 'aarch64'
        : target?.startsWith('x86_64-')
          ? 'x64'
          : platformArch === 'arm64'
            ? 'aarch64'
            : 'x64';
    const releaseDirectory = target
        ? join(targetDirectory, target, 'release')
        : join(targetDirectory, 'release');

    return join(
        releaseDirectory,
        'bundle',
        'dmg',
        `${productName}_${version}_${architecture}.dmg`
    );
};

const notarizeBuiltMacosDiskImage = ({
    targetDirectory,
    productName,
    version,
    platformArch,
    buildArgs,
    environment,
    pathExists = existsSync,
    notarize = notarizeMacosDiskImage,
}) => {
    const dmgPath = resolveMacosDmgPath({
        targetDirectory,
        productName,
        version,
        platformArch,
        buildArgs,
    });
    if (!pathExists(dmgPath)) {
        throw new Error(
            `The expected macOS disk image was not built: ${dmgPath}`
        );
    }
    if (!notarize({ dmgPath, environment })) {
        throw new Error(`Could not notarize and staple: ${dmgPath}`);
    }

    return dmgPath;
};

const resolveMacosSigningIdentity = ({
    configuredIdentity,
    identityOutput,
    localIdentity = LOCAL_MACOS_SIGNING_IDENTITY,
}) => {
    const explicitIdentity = configuredIdentity?.trim();
    if (explicitIdentity) return explicitIdentity;

    const identities = parseCodeSigningIdentities(identityOutput);
    for (const prefix of APPLE_SIGNING_IDENTITY_PREFIXES) {
        const identity = identities.find(({ name }) => name.startsWith(prefix));
        if (identity) return identity.hash;
    }

    return localIdentity;
};

const findAppleSigningIdentity = () => {
    const identityOutput = getCodeSigningIdentityOutput();
    const identities = parseCodeSigningIdentities(identityOutput);

    for (const prefix of APPLE_SIGNING_IDENTITY_PREFIXES) {
        const identity = identities.find(({ name }) => name.startsWith(prefix));
        if (identity) return identity.hash;
    }

    return null;
};

const isInstallableSigningIdentity = identity => {
    const normalizedIdentity = identity?.trim().toLowerCase();
    return Boolean(
        normalizedIdentity &&
        normalizedIdentity !== '-' &&
        normalizedIdentity !== 'adhoc' &&
        normalizedIdentity !== 'ad hoc' &&
        normalizedIdentity !== 'ad-hoc'
    );
};

const isDeveloperIdSigningIdentity = ({ identity, identityOutput }) => {
    const selectedIdentity = identity?.trim();
    if (!selectedIdentity) return false;

    return parseCodeSigningIdentities(identityOutput).some(
        ({ hash, name }) =>
            (hash === selectedIdentity || name === selectedIdentity) &&
            name.startsWith('Developer ID Application:')
    );
};

const resolveMacosNotarizationEnvironment = ({
    environment,
    identity,
    identityOutput,
    readPassword,
}) => {
    if (!isDeveloperIdSigningIdentity({ identity, identityOutput })) {
        return { ...environment };
    }

    if (
        environment.APPLE_API_ISSUER &&
        environment.APPLE_API_KEY &&
        environment.APPLE_API_KEY_PATH
    ) {
        return { ...environment };
    }

    const password = environment.APPLE_PASSWORD || readPassword();
    if (!password) {
        throw new Error(
            'Developer ID builds must be notarized. Run ' +
                '`pnpm setup:macos-notarization` once, then rebuild.'
        );
    }

    return {
        ...environment,
        APPLE_ID: environment.APPLE_ID || NOTARIZATION_APPLE_ID,
        APPLE_PASSWORD: password,
        APPLE_TEAM_ID: environment.APPLE_TEAM_ID || NOTARIZATION_TEAM_ID,
    };
};

const isStableDesignatedRequirement = (requirement, bundleIdentifier) => {
    if (!requirement || !bundleIdentifier || /\bcdhash\b/i.test(requirement)) {
        return false;
    }

    const hasExpectedIdentifier = requirement.includes(
        `identifier "${bundleIdentifier}"`
    );
    const hasPersistentCertificate =
        /certificate\s+(?:root|leaf)\s*=\s*H"[A-Fa-f0-9]+"/.test(requirement);
    const hasAppleTeamIdentifier =
        /certificate\s+leaf\[subject\.OU\]\s*=\s*"?[A-Z0-9]+"?/.test(
            requirement
        );
    const hasAppleCertificateIdentity =
        requirement.includes('anchor apple generic') &&
        /certificate\s+leaf\[subject\.CN\]\s*=\s*"(?:Apple Development|Mac Developer|Developer ID Application):[^"]+"/.test(
            requirement
        );

    return (
        hasExpectedIdentifier &&
        (hasPersistentCertificate ||
            hasAppleTeamIdentifier ||
            hasAppleCertificateIdentity)
    );
};

const hasCodeSigningCertificate = identity => {
    try {
        execFileSync(
            'security',
            ['find-certificate', '-c', identity, LOGIN_KEYCHAIN],
            { stdio: 'ignore' }
        );
        return true;
    } catch {
        return false;
    }
};

const hasCodeSigningIdentity = (identity, keychain = null) => {
    if (!isInstallableSigningIdentity(identity)) return false;

    return parseCodeSigningIdentities(
        getCodeSigningIdentityOutput(keychain)
    ).some(({ hash, name }) => hash === identity || name === identity);
};

export {
    APPLE_SIGNING_IDENTITY_PREFIXES,
    findAppleSigningIdentity,
    getCodeSigningIdentityOutput,
    getStoredNotarizationPassword,
    hasCodeSigningCertificate,
    hasCodeSigningIdentity,
    isDeveloperIdSigningIdentity,
    isInstallableSigningIdentity,
    isStableDesignatedRequirement,
    LOCAL_MACOS_SIGNING_IDENTITY,
    LOGIN_KEYCHAIN,
    NOTARIZATION_APPLE_ID,
    NOTARIZATION_KEYCHAIN_SERVICE,
    NOTARIZATION_TEAM_ID,
    notarizeBuiltMacosDiskImage,
    notarizeMacosDiskImage,
    parseCodeSigningIdentities,
    resolveMacosNotarizationEnvironment,
    resolveMacosDmgPath,
    resolveMacosSigningIdentity,
    storeNotarizationPassword,
};
