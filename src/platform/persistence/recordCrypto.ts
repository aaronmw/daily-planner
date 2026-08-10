const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EncryptedRecordEnvelope {
    ciphertext: Uint8Array<ArrayBuffer>;
    iv: Uint8Array<ArrayBuffer>;
    keyVersion: number;
    revision: number;
}

const additionalData = ({
    id,
    keyVersion,
    kind,
    revision,
}: {
    id: string;
    keyVersion: number;
    kind: string;
    revision: number;
}): Uint8Array<ArrayBuffer> =>
    new Uint8Array(
        encoder.encode(
            JSON.stringify({
                id,
                keyVersion,
                kind,
                namespace: 'daily-planner:v5',
                revision,
            })
        )
    );

export const createVaultKey = (): Promise<CryptoKey> =>
    crypto.subtle.generateKey({ length: 256, name: 'AES-GCM' }, false, [
        'encrypt',
        'decrypt',
    ]);

export const encryptRecord = async ({
    id,
    key,
    keyVersion,
    kind,
    revision,
    value,
}: {
    id: string;
    key: CryptoKey;
    keyVersion: number;
    kind: string;
    revision: number;
    value: unknown;
}): Promise<EncryptedRecordEnvelope> => {
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: additionalData({
                id,
                keyVersion,
                kind,
                revision,
            }),
            iv,
            name: 'AES-GCM',
        },
        key,
        new Uint8Array(encoder.encode(JSON.stringify(value)))
    );
    return {
        ciphertext: new Uint8Array(ciphertext),
        iv,
        keyVersion,
        revision,
    };
};

export const encryptBytes = async ({
    bytes,
    id,
    key,
    keyVersion,
    kind,
    revision,
}: {
    bytes: Uint8Array<ArrayBuffer>;
    id: string;
    key: CryptoKey;
    keyVersion: number;
    kind: string;
    revision: number;
}): Promise<EncryptedRecordEnvelope> => {
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: additionalData({
                id,
                keyVersion,
                kind,
                revision,
            }),
            iv,
            name: 'AES-GCM',
        },
        key,
        bytes
    );
    return {
        ciphertext: new Uint8Array(ciphertext),
        iv,
        keyVersion,
        revision,
    };
};

export const decryptBytes = async ({
    envelope,
    id,
    key,
    kind,
}: {
    envelope: EncryptedRecordEnvelope;
    id: string;
    key: CryptoKey;
    kind: string;
}): Promise<Uint8Array<ArrayBuffer>> => {
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: additionalData({
                id,
                keyVersion: envelope.keyVersion,
                kind,
                revision: envelope.revision,
            }),
            iv: new Uint8Array(envelope.iv),
            name: 'AES-GCM',
        },
        key,
        new Uint8Array(envelope.ciphertext)
    );
    return new Uint8Array(plaintext);
};

export const decryptRecord = async <Value>({
    envelope,
    id,
    key,
    kind,
}: {
    envelope: EncryptedRecordEnvelope;
    id: string;
    key: CryptoKey;
    kind: string;
}): Promise<Value> => {
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: additionalData({
                id,
                keyVersion: envelope.keyVersion,
                kind,
                revision: envelope.revision,
            }),
            iv: new Uint8Array(envelope.iv),
            name: 'AES-GCM',
        },
        key,
        new Uint8Array(envelope.ciphertext)
    );
    return JSON.parse(decoder.decode(plaintext)) as Value;
};
