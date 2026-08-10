import test from 'node:test';
import assert from 'node:assert/strict';

import {
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
        problems: [],
    });
});

test('ignores changing cdhash partition entries', () => {
    assert.equal(inspect(normalizedDump).normalized, true);
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
