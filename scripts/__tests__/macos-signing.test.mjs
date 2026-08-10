import test from 'node:test';
import assert from 'node:assert/strict';

import {
    LOCAL_MACOS_SIGNING_IDENTITY,
    isInstallableSigningIdentity,
    isStableDesignatedRequirement,
    parseCodeSigningIdentities,
    resolveMacosSigningIdentity,
} from '../macos-signing.mjs';

const identityOutput = `
  1) AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA "Apple Development: Aaron Wright (TEAM123456)"
  2) BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB "Mac Developer: Aaron Wright (TEAM123456)"
  3) CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC "Developer ID Application: Aaron Wright (TEAM123456)"
  4) DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD "Daily Planner Local Development Code Signing"
     4 valid identities found
`;

test('parses valid code-signing identities', () => {
    assert.deepEqual(parseCodeSigningIdentities(identityOutput), [
        {
            hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            name: 'Apple Development: Aaron Wright (TEAM123456)',
        },
        {
            hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
            name: 'Mac Developer: Aaron Wright (TEAM123456)',
        },
        {
            hash: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            name: 'Developer ID Application: Aaron Wright (TEAM123456)',
        },
        {
            hash: 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
            name: LOCAL_MACOS_SIGNING_IDENTITY,
        },
    ]);
});

test('uses explicit identity, then Developer ID, Apple Development, Mac Developer, and local identity', () => {
    assert.equal(
        resolveMacosSigningIdentity({
            configuredIdentity: 'Explicit Signing Identity',
            identityOutput,
        }),
        'Explicit Signing Identity'
    );
    assert.equal(
        resolveMacosSigningIdentity({ identityOutput }),
        'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
    );
    assert.equal(
        resolveMacosSigningIdentity({
            identityOutput: identityOutput.replace(
                /^.*Developer ID Application:.*$/m,
                ''
            ),
        }),
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    );
    assert.equal(
        resolveMacosSigningIdentity({
            identityOutput: identityOutput
                .replace(/^.*Developer ID Application:.*$/m, '')
                .replace(/^.*Apple Development:.*$/m, ''),
        }),
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    );
    assert.equal(
        resolveMacosSigningIdentity({ identityOutput: '' }),
        LOCAL_MACOS_SIGNING_IDENTITY
    );
});

test('rejects ad-hoc identities for installable builds', () => {
    assert.equal(isInstallableSigningIdentity('-'), false);
    assert.equal(isInstallableSigningIdentity('ad hoc'), false);
    assert.equal(isInstallableSigningIdentity('adhoc'), false);
    assert.equal(
        isInstallableSigningIdentity(LOCAL_MACOS_SIGNING_IDENTITY),
        true
    );
});

test('accepts only bundle-bound certificate or Team-ID requirements', () => {
    assert.equal(
        isStableDesignatedRequirement(
            'identifier "com.aaronwright.dailyplanner" and certificate root = H"5ba444fc"',
            'com.aaronwright.dailyplanner'
        ),
        true
    );
    assert.equal(
        isStableDesignatedRequirement(
            'identifier "com.aaronwright.dailyplanner" and anchor apple generic and certificate leaf[subject.OU] = "TEAM123456"',
            'com.aaronwright.dailyplanner'
        ),
        true
    );
    assert.equal(
        isStableDesignatedRequirement(
            'identifier "com.aaronwright.dailyplanner" and cdhash H"1234"',
            'com.aaronwright.dailyplanner'
        ),
        false
    );
    assert.equal(
        isStableDesignatedRequirement(
            'identifier "com.aaronwright.other" and certificate root = H"5ba444fc"',
            'com.aaronwright.dailyplanner'
        ),
        false
    );
});
