import { isStableDesignatedRequirement } from './macos-signing.mjs';

const keychainRecordForAccount = (keychainDump, account) =>
    keychainDump
        .split(/(?=^keychain:)/m)
        .find(record => record.includes(`"acct"<blob>="${account}"`)) ?? null;

const emptyInspection = problem => ({
    found: false,
    normalized: false,
    decryptAclCount: 0,
    passwordFree: false,
    trustedApplicationCount: 0,
    trustedApplicationPath: null,
    trustedRequirement: null,
    stableRequirement: false,
    cdhashOnlyRequirement: false,
    allowsEveryApplication: false,
    problems: [problem],
});

const inspectWebCryptoAccess = (
    keychainDump,
    { account, appPath, bundleIdentifier, requirement }
) => {
    const record = keychainRecordForAccount(keychainDump, account);
    if (!record) return emptyInspection('WebCrypto Keychain item not found.');

    const entries = record
        .split(/(?=^    entry \d+:)/m)
        .filter(entry => /^    entry \d+:/m.test(entry));
    const decryptEntries = entries.filter(entry =>
        /^        authorizations .*\bdecrypt\b/m.test(entry)
    );
    const decryptEntry = decryptEntries[0] ?? '';
    const applicationCountMatch = decryptEntry.match(
        /^        applications \((\d+)\):/m
    );
    const applicationMatch = decryptEntry.match(
        /^\s+\d+:\s+(.+?)\s+\(([^)]+)\)\s*$/m
    );
    const requirementMatch = decryptEntry.match(/^\s+requirement:\s+(.+)$/m);

    const decryptAclCount = decryptEntries.length;
    const passwordFree = /^        don't-require-password$/m.test(decryptEntry);
    const trustedApplicationCount = applicationCountMatch
        ? Number.parseInt(applicationCountMatch[1], 10)
        : 0;
    const trustedApplicationPath = applicationMatch?.[1] ?? null;
    const trustedApplicationStatus = applicationMatch?.[2] ?? null;
    const trustedRequirement = requirementMatch?.[1]?.trim() ?? null;
    const stableRequirement = isStableDesignatedRequirement(
        trustedRequirement,
        bundleIdentifier
    );
    const cdhashOnlyRequirement = Boolean(
        trustedRequirement && /\bcdhash\b/i.test(trustedRequirement)
    );
    const allowsEveryApplication = /^        applications: <null>$/m.test(
        decryptEntry
    );
    const problems = [];

    if (decryptAclCount !== 1) {
        problems.push('Expected exactly one decrypt ACL.');
    }
    if (!passwordFree) {
        problems.push('Decrypt access still requires a password.');
    }
    if (allowsEveryApplication) {
        problems.push('Decrypt access allows every application.');
    }
    if (trustedApplicationCount !== 1) {
        problems.push('Expected exactly one trusted application.');
    }
    if (trustedApplicationPath !== appPath) {
        problems.push(
            'Trusted application path is not the stable install path.'
        );
    }
    if (trustedApplicationStatus !== 'OK') {
        problems.push(
            'The trusted application is not valid at its stored path.'
        );
    }
    if (!stableRequirement) {
        problems.push('Trusted application requirement is not stable.');
    }
    if (cdhashOnlyRequirement) {
        problems.push('Trusted application requirement contains a cdhash.');
    }
    if (trustedRequirement !== requirement) {
        problems.push(
            'Trusted application requirement does not match the app.'
        );
    }

    return {
        found: true,
        normalized: problems.length === 0,
        decryptAclCount,
        passwordFree,
        trustedApplicationCount,
        trustedApplicationPath,
        trustedRequirement,
        stableRequirement,
        cdhashOnlyRequirement,
        allowsEveryApplication,
        problems,
    };
};

const accessIsSafeToNormalize = inspection =>
    inspection.found &&
    inspection.decryptAclCount === 1 &&
    inspection.trustedApplicationCount === 1 &&
    !inspection.allowsEveryApplication &&
    inspection.stableRequirement &&
    !inspection.cdhashOnlyRequirement;

export {
    accessIsSafeToNormalize,
    inspectWebCryptoAccess,
    keychainRecordForAccount,
};
