export const getWebCrypto = cryptoImpl => {
    const resolved = cryptoImpl || globalThis.crypto;

    if (!resolved?.subtle || typeof resolved.getRandomValues !== 'function') {
        throw new Error('A Web Crypto implementation is required.');
    }

    return resolved;
};
