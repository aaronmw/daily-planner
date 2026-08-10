import { z } from 'zod';
import {
    base64UrlToBytes,
    bytesToBase64Url,
    bytesToUtf8,
    utf8ToBytes,
} from './bytes';

const recordContextSchema = z.object({
    keyVersion: z.number().int().nonnegative(),
    listId: z.string().min(1),
    recordId: z.string().min(1),
    recordType: z.string().min(1),
    revision: z.number().int().nonnegative(),
});

export type CollaborationRecordContext = z.infer<typeof recordContextSchema>;

export const collaborationEnvelopeSchema = z.object({
    algorithm: z.literal('AES-256-GCM'),
    ciphertext: z.string().min(1),
    iv: z.string().min(1),
    keyVersion: z.number().int().nonnegative(),
    version: z.literal(1),
});

export type CollaborationEnvelope = z.infer<typeof collaborationEnvelopeSchema>;

export const recordAdditionalData = (
    value: CollaborationRecordContext
): Uint8Array<ArrayBuffer> => {
    const context = recordContextSchema.parse(value);
    return utf8ToBytes(
        JSON.stringify([
            'daily-planner-record',
            1,
            context.listId,
            context.recordType,
            context.recordId,
            context.revision,
            context.keyVersion,
        ])
    );
};

export const generateListKey = (): Promise<CryptoKey> =>
    crypto.subtle.generateKey({ length: 256, name: 'AES-GCM' }, true, [
        'encrypt',
        'decrypt',
    ]);

export const exportListKey = async (key: CryptoKey): Promise<string> =>
    bytesToBase64Url(await crypto.subtle.exportKey('raw', key));

export const importListKey = (value: string): Promise<CryptoKey> =>
    crypto.subtle.importKey(
        'raw',
        base64UrlToBytes(value),
        { length: 256, name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );

export const encryptCollaborationRecord = async (
    key: CryptoKey,
    context: CollaborationRecordContext,
    value: unknown
): Promise<CollaborationEnvelope> => {
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: recordAdditionalData(context),
            iv,
            name: 'AES-GCM',
            tagLength: 128,
        },
        key,
        utf8ToBytes(JSON.stringify(value))
    );
    return {
        algorithm: 'AES-256-GCM',
        ciphertext: bytesToBase64Url(ciphertext),
        iv: bytesToBase64Url(iv),
        keyVersion: context.keyVersion,
        version: 1,
    };
};

export const decryptCollaborationRecord = async <Value>(
    key: CryptoKey,
    context: CollaborationRecordContext,
    rawEnvelope: unknown
): Promise<Value> => {
    const envelope = collaborationEnvelopeSchema.parse(rawEnvelope);
    if (envelope.keyVersion !== context.keyVersion) {
        throw new Error('The encrypted record uses a different key version.');
    }
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: recordAdditionalData(context),
            iv: base64UrlToBytes(envelope.iv),
            name: 'AES-GCM',
            tagLength: 128,
        },
        key,
        base64UrlToBytes(envelope.ciphertext)
    );
    return JSON.parse(bytesToUtf8(plaintext)) as Value;
};

const RSA_ALGORITHM: RsaHashedKeyGenParams = {
    hash: 'SHA-256',
    modulusLength: 3072,
    name: 'RSA-OAEP',
    publicExponent: new Uint8Array([1, 0, 1]),
};

export const generateIdentityKeyPair = (): Promise<CryptoKeyPair> =>
    crypto.subtle.generateKey(RSA_ALGORITHM, true, ['wrapKey', 'unwrapKey']);

export const exportPublicIdentityKey = async (
    key: CryptoKey
): Promise<string> =>
    bytesToBase64Url(await crypto.subtle.exportKey('spki', key));

export const importPublicIdentityKey = (value: string): Promise<CryptoKey> =>
    crypto.subtle.importKey(
        'spki',
        base64UrlToBytes(value),
        { hash: 'SHA-256', name: 'RSA-OAEP' },
        true,
        ['wrapKey']
    );

export const wrapListKey = async (
    listKey: CryptoKey,
    publicKey: CryptoKey
): Promise<string> =>
    bytesToBase64Url(
        await crypto.subtle.wrapKey('raw', listKey, publicKey, 'RSA-OAEP')
    );

export const unwrapListKey = (
    value: string,
    privateKey: CryptoKey
): Promise<CryptoKey> =>
    crypto.subtle.unwrapKey(
        'raw',
        base64UrlToBytes(value),
        privateKey,
        'RSA-OAEP',
        { length: 256, name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
