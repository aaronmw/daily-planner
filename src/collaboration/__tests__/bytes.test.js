import {
    base64UrlToBytes,
    bytesToBase64Url,
    bytesToUtf8,
    utf8ToBytes,
} from '../bytes';

describe('collaboration byte encoding', () => {
    it('round-trips arbitrary bytes using unpadded base64url', () => {
        const bytes = new Uint8Array([251, 255, 0, 1]);

        expect(bytesToBase64Url(bytes)).toBe('-_8AAQ');
        expect(base64UrlToBytes('-_8AAQ')).toEqual(bytes);
    });

    it('round-trips Unicode text through UTF-8 bytes', () => {
        const text = 'Planner notes \u2014 caf\u00e9 \u2615';

        expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
    });

    it('uses the standard replacement character for lone surrogates', () => {
        expect(bytesToUtf8(utf8ToBytes('\ud800'))).toBe('\ufffd');
    });

    it('rejects malformed base64url input', () => {
        expect(() => base64UrlToBytes('not+base64url')).toThrow(/base64url/i);
    });
});
