import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    hasCodeSigningIdentity,
    LOCAL_MACOS_SIGNING_IDENTITY,
    LOGIN_KEYCHAIN,
} from './macos-signing.mjs';

if (process.platform !== 'darwin') {
    console.error('Local macOS code signing can only be set up on macOS.');
    process.exit(1);
}

if (hasCodeSigningIdentity(LOCAL_MACOS_SIGNING_IDENTITY, LOGIN_KEYCHAIN)) {
    console.log(
        `Code-signing identity already available: ${LOCAL_MACOS_SIGNING_IDENTITY}`
    );
    process.exit(0);
}

const temporaryDirectory = mkdtempSync(
    join(tmpdir(), 'daily-planner-signing-')
);
const configPath = join(temporaryDirectory, 'openssl.cnf');
const certificatePath = join(temporaryDirectory, 'certificate.pem');
const privateKeyPath = join(temporaryDirectory, 'private-key.pem');
const identityPath = join(temporaryDirectory, 'identity.p12');
const identityPassword = randomBytes(32).toString('base64url');

try {
    writeFileSync(
        configPath,
        `[req]
distinguished_name = subject
prompt = no
x509_extensions = code_signing

[subject]
CN = ${LOCAL_MACOS_SIGNING_IDENTITY}
O = Aaron Wright Local Development

[code_signing]
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, keyCertSign
extendedKeyUsage = codeSigning
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
`,
        { mode: 0o600 }
    );

    execFileSync(
        'openssl',
        [
            'req',
            '-new',
            '-x509',
            '-newkey',
            'rsa:3072',
            '-sha256',
            '-nodes',
            '-days',
            '3650',
            '-config',
            configPath,
            '-keyout',
            privateKeyPath,
            '-out',
            certificatePath,
        ],
        { stdio: 'ignore' }
    );

    execFileSync(
        'openssl',
        [
            'pkcs12',
            '-export',
            '-inkey',
            privateKeyPath,
            '-in',
            certificatePath,
            '-out',
            identityPath,
            '-name',
            LOCAL_MACOS_SIGNING_IDENTITY,
            '-keypbe',
            'PBE-SHA1-3DES',
            '-certpbe',
            'PBE-SHA1-3DES',
            '-macalg',
            'sha1',
            '-passout',
            `pass:${identityPassword}`,
        ],
        { stdio: 'ignore' }
    );

    execFileSync(
        'security',
        [
            'import',
            identityPath,
            '-k',
            LOGIN_KEYCHAIN,
            '-P',
            identityPassword,
            '-T',
            '/usr/bin/codesign',
            '-T',
            '/usr/bin/security',
        ],
        { stdio: 'inherit' }
    );

    if (!hasCodeSigningIdentity(LOCAL_MACOS_SIGNING_IDENTITY, LOGIN_KEYCHAIN)) {
        throw new Error('The new signing certificate was not imported.');
    }

    console.log(
        `Created local code-signing identity: ${LOCAL_MACOS_SIGNING_IDENTITY}`
    );
    console.log(
        'The first signed build may request one-time Keychain access for codesign.'
    );
} finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
}
