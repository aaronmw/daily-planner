import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from './bytes';
import { getWebCrypto } from './webCrypto';

export const RECOVERY_ITERATIONS = 310000;

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ACCOUNT_KEY_AAD = utf8ToBytes('daily-planner-account-key:v1');

const normalizeRecoveryCode = code =>
    String(code || '')
        .replace(/[\s-]+/g, '')
        .toUpperCase();

const deriveRecoveryKey = async (recoveryCode, salt, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const normalized = normalizeRecoveryCode(recoveryCode);

    if (!normalized) {
        throw new TypeError('A recovery code is required.');
    }

    const material = await webCrypto.subtle.importKey(
        'raw',
        utf8ToBytes(normalized),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return webCrypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            iterations: RECOVERY_ITERATIONS,
            salt,
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

export const generateVaultKey = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.generateKey(
        { name: 'AES-KW', length: 256 },
        false,
        ['wrapKey', 'unwrapKey']
    );
};

export const generateAccountKey = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, true, [
        'wrapKey',
        'unwrapKey',
    ]);
};

export const wrapAccountKeyWithVault = async (
    accountKey,
    vaultKey,
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const wrapped = await webCrypto.subtle.wrapKey(
        'raw',
        accountKey,
        vaultKey,
        'AES-KW'
    );

    return bytesToBase64Url(wrapped);
};

export const unwrapAccountKeyWithVault = (
    wrappedAccountKey,
    vaultKey,
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.unwrapKey(
        'raw',
        base64UrlToBytes(wrappedAccountKey),
        vaultKey,
        'AES-KW',
        { name: 'AES-KW', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    );
};

export const generateRecoveryCode = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const random = webCrypto.getRandomValues(new Uint8Array(20));
    let bitBuffer = 0;
    let bitCount = 0;
    let encoded = '';

    for (const byte of random) {
        bitBuffer = (bitBuffer << 8) | byte;
        bitCount += 8;

        while (bitCount >= 5) {
            bitCount -= 5;
            encoded += RECOVERY_ALPHABET[(bitBuffer >>> bitCount) & 31];
            bitBuffer &= (1 << bitCount) - 1;
        }
    }

    if (bitCount > 0) {
        encoded += RECOVERY_ALPHABET[(bitBuffer << (5 - bitCount)) & 31];
    }

    return encoded.match(/.{1,4}/g).join('-');
};

export const protectAccountKey = async (
    accountKey,
    { recoveryCode = null, cryptoImpl } = {}
) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const resolvedRecoveryCode =
        recoveryCode || generateRecoveryCode(webCrypto);
    const salt = webCrypto.getRandomValues(new Uint8Array(16));
    const iv = webCrypto.getRandomValues(new Uint8Array(12));
    const [recoveryKey, rawAccountKey] = await Promise.all([
        deriveRecoveryKey(resolvedRecoveryCode, salt, webCrypto),
        webCrypto.subtle.exportKey('raw', accountKey),
    ]);
    const ciphertext = await webCrypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData: ACCOUNT_KEY_AAD,
            tagLength: 128,
        },
        recoveryKey,
        rawAccountKey
    );

    return {
        protectedKey: {
            algorithm: 'AES-256-GCM',
            ciphertext: bytesToBase64Url(ciphertext),
            iterations: RECOVERY_ITERATIONS,
            iv: bytesToBase64Url(iv),
            kdf: 'PBKDF2-SHA256',
            salt: bytesToBase64Url(salt),
            version: 1,
        },
        recoveryCode: resolvedRecoveryCode,
    };
};

export const recoverAccountKey = async (
    protectedKey,
    recoveryCode,
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);

    if (
        protectedKey?.version !== 1 ||
        protectedKey?.algorithm !== 'AES-256-GCM' ||
        protectedKey?.kdf !== 'PBKDF2-SHA256' ||
        protectedKey?.iterations !== RECOVERY_ITERATIONS
    ) {
        throw new Error('Unsupported protected account key.');
    }

    const recoveryKey = await deriveRecoveryKey(
        recoveryCode,
        base64UrlToBytes(protectedKey.salt),
        webCrypto
    );
    const rawAccountKey = await webCrypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64UrlToBytes(protectedKey.iv),
            additionalData: ACCOUNT_KEY_AAD,
            tagLength: 128,
        },
        recoveryKey,
        base64UrlToBytes(protectedKey.ciphertext)
    );

    return webCrypto.subtle.importKey(
        'raw',
        rawAccountKey,
        { name: 'AES-KW', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    );
};

export { normalizeRecoveryCode };
