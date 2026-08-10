import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const LOCAL_MACOS_SIGNING_IDENTITY =
    'Daily Planner Local Development Code Signing';
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
    hasCodeSigningCertificate,
    hasCodeSigningIdentity,
    isInstallableSigningIdentity,
    isStableDesignatedRequirement,
    LOCAL_MACOS_SIGNING_IDENTITY,
    LOGIN_KEYCHAIN,
    parseCodeSigningIdentities,
    resolveMacosSigningIdentity,
};
