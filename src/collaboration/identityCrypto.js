import { base64UrlToBytes, bytesToBase64Url } from './bytes';
import { getWebCrypto } from './webCrypto';

const RSA_ALGORITHM = {
    name: 'RSA-OAEP',
    modulusLength: 3072,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
};

export const generateIdentityKeyPair = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.generateKey(RSA_ALGORITHM, true, [
        'wrapKey',
        'unwrapKey',
    ]);
};

export const exportIdentityKeyPair = async (keyPair, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const [publicKey, privateKey] = await Promise.all([
        webCrypto.subtle.exportKey('spki', keyPair.publicKey),
        webCrypto.subtle.exportKey('pkcs8', keyPair.privateKey),
    ]);

    return {
        privateKey: bytesToBase64Url(privateKey),
        publicKey: bytesToBase64Url(publicKey),
    };
};

export const exportPublicIdentityKey = async (publicKey, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const exported = await webCrypto.subtle.exportKey('spki', publicKey);

    return bytesToBase64Url(exported);
};

export const importIdentityKeyPair = async (exported, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const [publicKey, privateKey] = await Promise.all([
        webCrypto.subtle.importKey(
            'spki',
            base64UrlToBytes(exported.publicKey),
            RSA_ALGORITHM,
            true,
            ['wrapKey']
        ),
        webCrypto.subtle.importKey(
            'pkcs8',
            base64UrlToBytes(exported.privateKey),
            RSA_ALGORITHM,
            true,
            ['unwrapKey']
        ),
    ]);

    return { privateKey, publicKey };
};

export const wrapListKey = async (listKey, publicKey, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const wrapped = await webCrypto.subtle.wrapKey('raw', listKey, publicKey, {
        name: 'RSA-OAEP',
    });

    return bytesToBase64Url(wrapped);
};

export const unwrapListKey = (wrappedKey, privateKey, cryptoImpl) => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.unwrapKey(
        'raw',
        base64UrlToBytes(wrappedKey),
        privateKey,
        { name: 'RSA-OAEP' },
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};
