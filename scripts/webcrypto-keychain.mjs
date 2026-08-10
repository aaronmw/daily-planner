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
    decryptAccessNormalized: false,
    partitionAclCount: 0,
    partitionIdentifiers: [],
    partitionAllowsCurrentBuild: false,
    partitionUsesStableSigner: false,
    futureBuildsRequireApproval: true,
    problems: [problem],
});

const inspectWebCryptoAccess = (
    keychainDump,
    { account, appPath, bundleIdentifier, requirement, cdHash, teamIdentifier }
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
    const decryptProblems = [];

    if (decryptAclCount !== 1) {
        decryptProblems.push('Expected exactly one decrypt ACL.');
    }
    if (!passwordFree) {
        decryptProblems.push('Decrypt access still requires a password.');
    }
    if (allowsEveryApplication) {
        decryptProblems.push('Decrypt access allows every application.');
    }
    if (trustedApplicationCount !== 1) {
        decryptProblems.push('Expected exactly one trusted application.');
    }
    if (trustedApplicationPath !== appPath) {
        decryptProblems.push(
            'Trusted application path is not the stable install path.'
        );
    }
    if (trustedApplicationStatus !== 'OK') {
        decryptProblems.push(
            'The trusted application is not valid at its stored path.'
        );
    }
    if (!stableRequirement) {
        decryptProblems.push('Trusted application requirement is not stable.');
    }
    if (cdhashOnlyRequirement) {
        decryptProblems.push(
            'Trusted application requirement contains a cdhash.'
        );
    }
    if (trustedRequirement !== requirement) {
        decryptProblems.push(
            'Trusted application requirement does not match the app.'
        );
    }

    const partitionEntries = entries.filter(entry =>
        /^        authorizations .*\bpartition_id\b/m.test(entry)
    );
    const partitionIdentifiers = partitionEntries.flatMap(entry => {
        const description = entry.match(/^        description:\s*(.*)$/m)?.[1];

        return description
            ? description
                  .split(',')
                  .map(identifier => identifier.trim())
                  .filter(Boolean)
            : [];
    });
    const normalizedTeamIdentifier =
        teamIdentifier && teamIdentifier !== 'not set' ? teamIdentifier : null;
    const includesPartitionIdentifier = expected =>
        Boolean(
            expected &&
            partitionIdentifiers.some(
                identifier =>
                    identifier.toLowerCase() === expected.toLowerCase()
            )
        );
    const partitionUsesStableSigner = includesPartitionIdentifier(
        normalizedTeamIdentifier ? `teamid:${normalizedTeamIdentifier}` : null
    );
    const partitionAllowsCurrentBuild =
        partitionEntries.length === 1 &&
        (partitionUsesStableSigner ||
            includesPartitionIdentifier(cdHash ? `cdhash:${cdHash}` : null));
    const futureBuildsRequireApproval = !partitionUsesStableSigner;
    const partitionProblems = [];

    if (partitionEntries.length !== 1) {
        partitionProblems.push('Expected exactly one partition ACL.');
    }
    if (!partitionAllowsCurrentBuild) {
        partitionProblems.push(
            'The Keychain partition does not allow the installed build.'
        );
    }

    const decryptAccessNormalized = decryptProblems.length === 0;
    const problems = [...decryptProblems, ...partitionProblems];

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
        decryptAccessNormalized,
        partitionAclCount: partitionEntries.length,
        partitionIdentifiers,
        partitionAllowsCurrentBuild,
        partitionUsesStableSigner,
        futureBuildsRequireApproval,
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

const classifyWebCryptoAccess = inspection => {
    if (!inspection.found) return 'missing';
    if (!inspection.decryptAccessNormalized) return 'repair-decrypt';
    if (!inspection.partitionAllowsCurrentBuild) return 'approval-required';
    if (inspection.futureBuildsRequireApproval) return 'build-specific';
    return 'stable';
};

const canSafelyTransitionWebCryptoSigner = (
    inspection,
    { appPath, teamIdentifier, explicitlyAllowed }
) =>
    explicitlyAllowed &&
    Boolean(teamIdentifier && teamIdentifier !== 'not set') &&
    accessIsSafeToNormalize(inspection) &&
    inspection.trustedApplicationPath === appPath;

export {
    accessIsSafeToNormalize,
    canSafelyTransitionWebCryptoSigner,
    classifyWebCryptoAccess,
    inspectWebCryptoAccess,
    keychainRecordForAccount,
};
