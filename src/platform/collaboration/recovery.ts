import { z } from 'zod';
import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from './bytes';

export const RECOVERY_ITERATIONS = 310_000;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ACCOUNT_KEY_AAD = utf8ToBytes('daily-planner-account-key:v1');

export const protectedAccountKeySchema = z.object({
    algorithm: z.literal('AES-256-GCM'),
    ciphertext: z.string().min(1),
    iterations: z.literal(RECOVERY_ITERATIONS),
    iv: z.string().min(1),
    kdf: z.literal('PBKDF2-SHA256'),
    salt: z.string().min(1),
    version: z.literal(1),
});

export type ProtectedAccountKey = z.infer<typeof protectedAccountKeySchema>;

export const normalizeRecoveryCode = (value: string): string =>
    value.replace(/[\s-]+/g, '').toUpperCase();

export const generateRecoveryCode = (): string => {
    const random = crypto.getRandomValues(new Uint8Array(20));
    let buffer = 0;
    let bits = 0;
    let encoded = '';
    for (const byte of random) {
        buffer = (buffer << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            encoded += RECOVERY_ALPHABET.charAt((buffer >>> bits) & 31);
            buffer &= (1 << bits) - 1;
        }
    }
    if (bits > 0)
        encoded += RECOVERY_ALPHABET.charAt((buffer << (5 - bits)) & 31);
    return encoded.match(/.{1,4}/g)?.join('-') ?? encoded;
};

const deriveRecoveryKey = async (
    recoveryCode: string,
    salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> => {
    const normalized = normalizeRecoveryCode(recoveryCode);
    if (!normalized) throw new Error('A recovery key is required.');
    const material = await crypto.subtle.importKey(
        'raw',
        utf8ToBytes(normalized),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            hash: 'SHA-256',
            iterations: RECOVERY_ITERATIONS,
            name: 'PBKDF2',
            salt,
        },
        material,
        { length: 256, name: 'AES-GCM' },
        false,
        ['decrypt', 'encrypt']
    );
};

export const protectAccountKey = async (
    accountKey: CryptoKey,
    recoveryCode = generateRecoveryCode()
): Promise<{
    protectedKey: ProtectedAccountKey;
    recoveryCode: string;
}> => {
    const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const [recoveryKey, rawAccountKey] = await Promise.all([
        deriveRecoveryKey(recoveryCode, salt),
        crypto.subtle.exportKey('raw', accountKey),
    ]);
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: ACCOUNT_KEY_AAD,
            iv,
            name: 'AES-GCM',
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
        recoveryCode,
    };
};

export const recoverAccountKey = async (
    rawProtectedKey: unknown,
    recoveryCode: string
): Promise<CryptoKey> => {
    const protectedKey = protectedAccountKeySchema.parse(rawProtectedKey);
    const recoveryKey = await deriveRecoveryKey(
        recoveryCode,
        base64UrlToBytes(protectedKey.salt)
    );
    const raw = await crypto.subtle.decrypt(
        {
            additionalData: ACCOUNT_KEY_AAD,
            iv: base64UrlToBytes(protectedKey.iv),
            name: 'AES-GCM',
            tagLength: 128,
        },
        recoveryKey,
        base64UrlToBytes(protectedKey.ciphertext)
    );
    return crypto.subtle.importKey(
        'raw',
        raw,
        { length: 256, name: 'AES-GCM' },
        true,
        ['decrypt', 'encrypt']
    );
};
