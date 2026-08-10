import test from 'node:test';
import assert from 'node:assert/strict';

import {
    canSafelyTransitionWebCryptoSigner,
    classifyWebCryptoAccess,
    inspectWebCryptoAccess,
    keychainRecordForAccount,
} from '../webcrypto-keychain.mjs';

const account =
    'com.apple.WebKit.WebCrypto.master+com.aaronwright.dailyplanner';
const appPath = '/Applications/Daily Planner.app';
const requirement =
    'identifier "com.aaronwright.dailyplanner" and certificate root = H"5ba444fc"';
const normalizedDump = `
keychain: "/Users/aaronwright/Library/Keychains/login.keychain-db"
class: "genp"
attributes:
    "acct"<blob>="${account}"
access: 5 entries
    entry 0:
        authorizations (1): encrypt
        don't-require-password
        applications: <null>
    entry 1:
        authorizations (6): decrypt derive export_clear export_wrapped mac sign
        don't-require-password
        applications (1):
            0: ${appPath} (OK)
                requirement: ${requirement}
    entry 3:
        authorizations (1): partition_id
        don't-require-password
        description: cdhash:old-build, cdhash:new-build
        applications: <null>
`;

const inspect = dump =>
    inspectWebCryptoAccess(dump, {
        account,
        appPath,
        bundleIdentifier: 'com.aaronwright.dailyplanner',
        requirement,
        cdHash: 'new-build',
        teamIdentifier: null,
    });

test('finds only the requested Keychain record', () => {
    const dump = `${normalizedDump}\nkeychain: "other"\n"acct"<blob>="other"`;
    assert.match(keychainRecordForAccount(dump, account), /access: 5 entries/);
    assert.doesNotMatch(keychainRecordForAccount(dump, account), /other/);
});

test('confirms exact password-free access for one stable installed app', () => {
    assert.deepEqual(inspect(normalizedDump), {
        found: true,
        normalized: true,
        decryptAclCount: 1,
        passwordFree: true,
        trustedApplicationCount: 1,
        trustedApplicationPath: appPath,
        trustedRequirement: requirement,
        stableRequirement: true,
        cdhashOnlyRequirement: false,
        allowsEveryApplication: false,
        decryptAccessNormalized: true,
        partitionAclCount: 1,
        partitionIdentifiers: ['cdhash:old-build', 'cdhash:new-build'],
        partitionAllowsCurrentBuild: true,
        partitionUsesStableSigner: false,
        futureBuildsRequireApproval: true,
        problems: [],
    });
});

test('rejects a changed self-signed build whose cdhash is not approved', () => {
    const inspection = inspectWebCryptoAccess(normalizedDump, {
        account,
        appPath,
        bundleIdentifier: 'com.aaronwright.dailyplanner',
        requirement,
        cdHash: 'unseen-build',
        teamIdentifier: null,
    });

    assert.equal(inspection.decryptAccessNormalized, true);
    assert.equal(inspection.partitionAllowsCurrentBuild, false);
    assert.equal(inspection.normalized, false);
    assert.match(
        inspection.problems.join('\n'),
        /partition does not allow the installed build/i
    );
});

test('accepts a stable Apple team partition across changed builds', () => {
    const inspection = inspectWebCryptoAccess(
        normalizedDump.replace(
            'cdhash:old-build, cdhash:new-build',
            'teamid:TEAM123456, cdhash:old-build'
        ),
        {
            account,
            appPath,
            bundleIdentifier: 'com.aaronwright.dailyplanner',
            requirement,
            cdHash: 'unseen-build',
            teamIdentifier: 'TEAM123456',
        }
    );

    assert.equal(inspection.partitionAllowsCurrentBuild, true);
    assert.equal(inspection.partitionUsesStableSigner, true);
    assert.equal(inspection.futureBuildsRequireApproval, false);
    assert.equal(inspection.normalized, true);
});

test('classifies build-specific and durable runtime access separately', () => {
    const buildSpecific = inspect(normalizedDump);
    const stable = inspectWebCryptoAccess(
        normalizedDump.replace(
            'cdhash:old-build, cdhash:new-build',
            'teamid:TEAM123456'
        ),
        {
            account,
            appPath,
            bundleIdentifier: 'com.aaronwright.dailyplanner',
            requirement,
            cdHash: 'unseen-build',
            teamIdentifier: 'TEAM123456',
        }
    );
    const approvalRequired = inspectWebCryptoAccess(normalizedDump, {
        account,
        appPath,
        bundleIdentifier: 'com.aaronwright.dailyplanner',
        requirement,
        cdHash: 'unseen-build',
        teamIdentifier: null,
    });

    assert.equal(classifyWebCryptoAccess(buildSpecific), 'build-specific');
    assert.equal(classifyWebCryptoAccess(stable), 'stable');
    assert.equal(
        classifyWebCryptoAccess(approvalRequired),
        'approval-required'
    );
});

test('allows an explicit transition from the exact installed app to an Apple signer', () => {
    const inspection = inspect(normalizedDump);

    assert.equal(
        canSafelyTransitionWebCryptoSigner(inspection, {
            appPath,
            teamIdentifier: 'TEAM123456',
            explicitlyAllowed: true,
        }),
        true
    );
    assert.equal(
        canSafelyTransitionWebCryptoSigner(inspection, {
            appPath,
            teamIdentifier: null,
            explicitlyAllowed: true,
        }),
        false
    );
    assert.equal(
        canSafelyTransitionWebCryptoSigner(inspection, {
            appPath,
            teamIdentifier: 'TEAM123456',
            explicitlyAllowed: false,
        }),
        false
    );
});

test('rejects password prompts, broad access, extra applications, stale paths, and cdhash requirements', () => {
    const cases = [
        normalizedDump.replace(
            "don't-require-password\n        applications (1):",
            'require-password\n        applications (1):'
        ),
        normalizedDump.replace(
            'applications (1):\n            0:',
            'applications: <null>\n            0:'
        ),
        normalizedDump.replace('applications (1):', 'applications (2):'),
        normalizedDump.replace(appPath, '/tmp/Daily Planner.app'),
        normalizedDump.replace(
            requirement,
            'identifier "com.aaronwright.dailyplanner" and cdhash H"1234"'
        ),
    ];

    for (const dump of cases) {
        assert.equal(inspect(dump).normalized, false);
    }
});
