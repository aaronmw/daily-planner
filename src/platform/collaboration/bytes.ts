const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const bytesToBase64Url = (
    value: ArrayBuffer | Uint8Array<ArrayBuffer>
): string => {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/u, '');
};

export const base64UrlToBytes = (value: string): Uint8Array<ArrayBuffer> => {
    if (!/^[A-Za-z0-9_-]*$/u.test(value) || value.length % 4 === 1) {
        throw new TypeError('Expected a canonical base64url string.');
    }
    const padded = `${value.replace(/-/g, '+').replace(/_/g, '/')}${'='.repeat((4 - (value.length % 4)) % 4)}`;
    const binary = atob(padded);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
};

export const utf8ToBytes = (value: string): Uint8Array<ArrayBuffer> =>
    new Uint8Array(encoder.encode(value));

export const bytesToUtf8 = (
    value: ArrayBuffer | Uint8Array<ArrayBuffer>
): string => decoder.decode(value);
