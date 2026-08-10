import {
    base64UrlToBytes,
    bytesToBase64Url,
    bytesToUtf8,
    utf8ToBytes,
} from './bytes';
import { getWebCrypto } from './webCrypto';

const RECORD_VERSION = 1;

const assertContext = context => {
    const stringFields = ['listId', 'recordType', 'recordId'];

    stringFields.forEach(field => {
        if (typeof context?.[field] !== 'string' || !context[field]) {
            throw new TypeError(`Record context ${field} must be non-empty.`);
        }
    });

    ['revision', 'keyVersion'].forEach(field => {
        if (!Number.isSafeInteger(context?.[field]) || context[field] < 0) {
            throw new TypeError(
                `Record context ${field} must be a non-negative integer.`
            );
        }
    });
};

export const buildRecordAdditionalData = context => {
    assertContext(context);

    return utf8ToBytes(
        JSON.stringify([
            'daily-planner-record',
            RECORD_VERSION,
            context.listId,
            context.recordType,
            context.recordId,
            context.revision,
            context.keyVersion,
        ])
    );
};

export const generateListKey = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

export const exportListKey = async (key, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const rawKey = await webCrypto.subtle.exportKey('raw', key);

    return bytesToBase64Url(rawKey);
};

export const importListKey = (encodedKey, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.importKey(
        'raw',
        base64UrlToBytes(encodedKey),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

export const encryptRecord = async (key, context, value, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const serialized = JSON.stringify(value);

    if (serialized === undefined) {
        throw new TypeError('Encrypted records must be JSON-serializable.');
    }

    const iv = webCrypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await webCrypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData: buildRecordAdditionalData(context),
            tagLength: 128,
        },
        key,
        utf8ToBytes(serialized)
    );

    return {
        algorithm: 'AES-256-GCM',
        ciphertext: bytesToBase64Url(ciphertext),
        iv: bytesToBase64Url(iv),
        keyVersion: context.keyVersion,
        version: RECORD_VERSION,
    };
};

export const decryptRecord = async (key, context, envelope, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);

    if (
        envelope?.version !== RECORD_VERSION ||
        envelope?.algorithm !== 'AES-256-GCM'
    ) {
        throw new Error('Unsupported encrypted record envelope.');
    }

    if (envelope.keyVersion !== context?.keyVersion) {
        throw new Error('The encrypted record uses a different key version.');
    }

    const plaintext = await webCrypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64UrlToBytes(envelope.iv),
            additionalData: buildRecordAdditionalData(context),
            tagLength: 128,
        },
        key,
        base64UrlToBytes(envelope.ciphertext)
    );

    return JSON.parse(bytesToUtf8(plaintext));
};
