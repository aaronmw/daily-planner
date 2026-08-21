import test from 'node:test';
import assert from 'node:assert/strict';

import {
    LOCAL_MACOS_SIGNING_IDENTITY,
    isInstallableSigningIdentity,
    isStableDesignatedRequirement,
    parseCodeSigningIdentities,
    resolveMacosSigningIdentity,
} from '../macos-signing.mjs';
import * as macosSigning from '../macos-signing.mjs';

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

test('recognizes a selected Developer ID Application identity by hash or name', () => {
    assert.equal(
        macosSigning.isDeveloperIdSigningIdentity?.({
            identity: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            identityOutput,
        }),
        true
    );
    assert.equal(
        macosSigning.isDeveloperIdSigningIdentity?.({
            identity: 'Developer ID Application: Aaron Wright (TEAM123456)',
            identityOutput,
        }),
        true
    );
    assert.equal(
        macosSigning.isDeveloperIdSigningIdentity?.({
            identity: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            identityOutput,
        }),
        false
    );
});

test('adds stored notarization credentials to Developer ID builds', () => {
    assert.deepEqual(
        macosSigning.resolveMacosNotarizationEnvironment?.({
            environment: { PATH: '/usr/bin' },
            identity: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            identityOutput,
            readPassword: () => 'app-specific-password',
        }),
        {
            PATH: '/usr/bin',
            APPLE_ID: 'aaronmw@gmail.com',
            APPLE_PASSWORD: 'app-specific-password',
            APPLE_TEAM_ID: 'J73G3CSYN3',
        }
    );
});

test('preserves App Store Connect API-key notarization credentials', () => {
    const environment = {
        APPLE_API_ISSUER: 'issuer-id',
        APPLE_API_KEY: 'key-id',
        APPLE_API_KEY_PATH: '/secure/AuthKey_key-id.p8',
    };

    assert.deepEqual(
        macosSigning.resolveMacosNotarizationEnvironment?.({
            environment,
            identity: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
            identityOutput,
            readPassword: () => {
                throw new Error('Keychain password should not be read');
            },
        }),
        environment
    );
});

test('refuses an unnotarized Developer ID build', () => {
    assert.throws(
        () =>
            macosSigning.resolveMacosNotarizationEnvironment?.({
                environment: {},
                identity: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
                identityOutput,
                readPassword: () => null,
            }),
        /pnpm setup:macos-notarization/
    );
});

test('reads the notarization password from the project Keychain item', () => {
    let invocation;
    const password = macosSigning.getStoredNotarizationPassword?.({
        runSecurity: (executable, args, options) => {
            invocation = { executable, args, options };
            return 'secret-from-keychain\n';
        },
    });

    assert.equal(password, 'secret-from-keychain');
    assert.deepEqual(invocation, {
        executable: 'security',
        args: [
            'find-generic-password',
            '-w',
            '-a',
            'aaronmw@gmail.com',
            '-s',
            'com.aaronwright.dailyplanner.notarization',
        ],
        options: {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        },
    });
});

test('stores the notarization password through a secure Keychain prompt', () => {
    let invocation;
    const stored = macosSigning.storeNotarizationPassword?.({
        runSecurity: (executable, args, options) => {
            invocation = { executable, args, options };
            return { status: 0 };
        },
    });

    assert.equal(stored, true);
    assert.deepEqual(invocation, {
        executable: 'security',
        args: [
            'add-generic-password',
            '-a',
            'aaronmw@gmail.com',
            '-s',
            'com.aaronwright.dailyplanner.notarization',
            '-D',
            'application password',
            '-j',
            'Daily Planner Apple notarization app-specific password',
            '-U',
            '-w',
        ],
        options: { stdio: 'inherit' },
    });
});

test('notarizes and staples the completed disk image', () => {
    const invocations = [];
    const notarized = macosSigning.notarizeMacosDiskImage?.({
        dmgPath: '/release/Daily Planner.dmg',
        environment: {
            APPLE_ID: 'aaron@example.com',
            APPLE_PASSWORD: 'app-specific-password',
            APPLE_TEAM_ID: 'TEAM123456',
        },
        runCommand: (executable, args, options) => {
            invocations.push({ executable, args, options });
            return { status: 0 };
        },
    });

    assert.equal(notarized, true);
    assert.deepEqual(invocations, [
        {
            executable: 'xcrun',
            args: [
                'notarytool',
                'submit',
                '/release/Daily Planner.dmg',
                '--apple-id',
                'aaron@example.com',
                '--team-id',
                'TEAM123456',
                '--password',
                'app-specific-password',
                '--wait',
            ],
            options: { stdio: 'inherit' },
        },
        {
            executable: 'xcrun',
            args: ['stapler', 'staple', '/release/Daily Planner.dmg'],
            options: { stdio: 'inherit' },
        },
    ]);
});

test('submits a disk image with App Store Connect API credentials', () => {
    const invocations = [];
    const notarized = macosSigning.notarizeMacosDiskImage?.({
        dmgPath: '/release/Daily Planner.dmg',
        environment: {
            APPLE_API_ISSUER: 'issuer-id',
            APPLE_API_KEY: 'key-id',
            APPLE_API_KEY_PATH: '/secure/AuthKey_key-id.p8',
        },
        runCommand: (executable, args, options) => {
            invocations.push({ executable, args, options });
            return { status: 0 };
        },
    });

    assert.equal(notarized, true);
    assert.deepEqual(invocations[0], {
        executable: 'xcrun',
        args: [
            'notarytool',
            'submit',
            '/release/Daily Planner.dmg',
            '--issuer',
            'issuer-id',
            '--key-id',
            'key-id',
            '--key',
            '/secure/AuthKey_key-id.p8',
            '--wait',
        ],
        options: { stdio: 'inherit' },
    });
});

test('resolves the DMG emitted for the current or requested macOS target', () => {
    assert.equal(
        macosSigning.resolveMacosDmgPath?.({
            targetDirectory: '/cargo-target',
            productName: 'Daily Planner',
            version: '1.0.0',
            platformArch: 'arm64',
            buildArgs: [],
        }),
        '/cargo-target/release/bundle/dmg/Daily Planner_1.0.0_aarch64.dmg'
    );
    assert.equal(
        macosSigning.resolveMacosDmgPath?.({
            targetDirectory: '/cargo-target',
            productName: 'Daily Planner',
            version: '1.0.0',
            platformArch: 'arm64',
            buildArgs: ['--target', 'x86_64-apple-darwin'],
        }),
        '/cargo-target/x86_64-apple-darwin/release/bundle/dmg/Daily Planner_1.0.0_x64.dmg'
    );
});

test('notarizes the DMG emitted by a successful Tauri build', () => {
    let invocation;
    const dmgPath = macosSigning.notarizeBuiltMacosDiskImage?.({
        targetDirectory: '/cargo-target',
        productName: 'Daily Planner',
        version: '1.0.0',
        platformArch: 'arm64',
        buildArgs: [],
        environment: { APPLE_ID: 'aaron@example.com' },
        pathExists: path =>
            path ===
            '/cargo-target/release/bundle/dmg/Daily Planner_1.0.0_aarch64.dmg',
        notarize: options => {
            invocation = options;
            return true;
        },
    });

    assert.equal(
        dmgPath,
        '/cargo-target/release/bundle/dmg/Daily Planner_1.0.0_aarch64.dmg'
    );
    assert.deepEqual(invocation, {
        dmgPath,
        environment: { APPLE_ID: 'aaron@example.com' },
    });
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
            'identifier "com.aaronwright.dailyplanner" and anchor apple generic and certificate leaf[subject.CN] = "Apple Development: aaron@example.com (DEVICE1234)" and certificate 1[field.1.2.840.113635.100.6.2.1] /* exists */',
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
