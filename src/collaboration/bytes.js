const BASE64URL_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const objectTag = value => Object.prototype.toString.call(value);

const asBytes = value => {
    if (value instanceof Uint8Array) {
        return value;
    }

    if (ArrayBuffer.isView(value)) {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }

    if (
        value instanceof ArrayBuffer ||
        objectTag(value) === '[object ArrayBuffer]'
    ) {
        return new Uint8Array(value);
    }

    if (
        objectTag(value) === '[object Uint8Array]' &&
        Number.isSafeInteger(value.byteLength)
    ) {
        return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    }

    throw new TypeError('Expected bytes as an ArrayBuffer or typed array.');
};

export const bytesToBase64Url = value => {
    const bytes = asBytes(value);
    let result = '';

    for (let offset = 0; offset < bytes.length; offset += 3) {
        const first = bytes[offset];
        const hasSecond = offset + 1 < bytes.length;
        const hasThird = offset + 2 < bytes.length;
        const second = hasSecond ? bytes[offset + 1] : 0;
        const third = hasThird ? bytes[offset + 2] : 0;
        const chunk = (first << 16) | (second << 8) | third;

        result += BASE64URL_ALPHABET[(chunk >>> 18) & 63];
        result += BASE64URL_ALPHABET[(chunk >>> 12) & 63];

        if (hasSecond) {
            result += BASE64URL_ALPHABET[(chunk >>> 6) & 63];
        }

        if (hasThird) {
            result += BASE64URL_ALPHABET[chunk & 63];
        }
    }

    return result;
};

export const base64UrlToBytes = value => {
    if (
        typeof value !== 'string' ||
        !/^[A-Za-z0-9_-]*$/.test(value) ||
        value.length % 4 === 1
    ) {
        throw new TypeError('Expected an unpadded base64url string.');
    }

    const bytes = [];
    let accumulator = 0;
    let bitCount = 0;

    for (const character of value) {
        const encoded = BASE64URL_ALPHABET.indexOf(character);
        accumulator = (accumulator << 6) | encoded;
        bitCount += 6;

        if (bitCount >= 8) {
            bitCount -= 8;
            bytes.push((accumulator >>> bitCount) & 255);
            accumulator &= (1 << bitCount) - 1;
        }
    }

    const decoded = new Uint8Array(bytes);

    if (bytesToBase64Url(decoded) !== value) {
        throw new TypeError('Expected a canonical base64url string.');
    }

    return decoded;
};

export const utf8ToBytes = value => {
    const bytes = [];

    for (const character of String(value)) {
        let codePoint = character.codePointAt(0);

        if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
            codePoint = 0xfffd;
        }

        if (codePoint <= 0x7f) {
            bytes.push(codePoint);
        } else if (codePoint <= 0x7ff) {
            bytes.push(0xc0 | (codePoint >>> 6));
            bytes.push(0x80 | (codePoint & 0x3f));
        } else if (codePoint <= 0xffff) {
            bytes.push(0xe0 | (codePoint >>> 12));
            bytes.push(0x80 | ((codePoint >>> 6) & 0x3f));
            bytes.push(0x80 | (codePoint & 0x3f));
        } else {
            bytes.push(0xf0 | (codePoint >>> 18));
            bytes.push(0x80 | ((codePoint >>> 12) & 0x3f));
            bytes.push(0x80 | ((codePoint >>> 6) & 0x3f));
            bytes.push(0x80 | (codePoint & 0x3f));
        }
    }

    return new Uint8Array(bytes);
};

const isContinuationByte = byte => (byte & 0xc0) === 0x80;

export const bytesToUtf8 = value => {
    const bytes = asBytes(value);
    const codePoints = [];

    for (let index = 0; index < bytes.length;) {
        const first = bytes[index];
        let codePoint;
        let byteCount;

        if (first <= 0x7f) {
            codePoint = first;
            byteCount = 1;
        } else if (first >= 0xc2 && first <= 0xdf) {
            codePoint = first & 0x1f;
            byteCount = 2;
        } else if (first >= 0xe0 && first <= 0xef) {
            codePoint = first & 0x0f;
            byteCount = 3;
        } else if (first >= 0xf0 && first <= 0xf4) {
            codePoint = first & 0x07;
            byteCount = 4;
        } else {
            throw new TypeError('Invalid UTF-8 byte sequence.');
        }

        if (index + byteCount > bytes.length) {
            throw new TypeError('Invalid UTF-8 byte sequence.');
        }

        for (let offset = 1; offset < byteCount; offset += 1) {
            const continuation = bytes[index + offset];

            if (!isContinuationByte(continuation)) {
                throw new TypeError('Invalid UTF-8 byte sequence.');
            }

            codePoint = (codePoint << 6) | (continuation & 0x3f);
        }

        const overlong =
            (byteCount === 2 && codePoint < 0x80) ||
            (byteCount === 3 && codePoint < 0x800) ||
            (byteCount === 4 && codePoint < 0x10000);

        if (
            overlong ||
            (codePoint >= 0xd800 && codePoint <= 0xdfff) ||
            codePoint > 0x10ffff
        ) {
            throw new TypeError('Invalid UTF-8 byte sequence.');
        }

        codePoints.push(codePoint);
        index += byteCount;
    }

    let result = '';

    for (let offset = 0; offset < codePoints.length; offset += 0x8000) {
        result += String.fromCodePoint(
            ...codePoints.slice(offset, offset + 0x8000)
        );
    }

    return result;
};

export { asBytes };
