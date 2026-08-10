const mockMkdir = jest.fn();
const mockReadFile = jest.fn();
const mockRemove = jest.fn();
const mockRename = jest.fn();
const mockWriteFile = jest.fn();

jest.mock('@tauri-apps/plugin-fs', () => ({
    BaseDirectory: { AppData: 22 },
    mkdir: (...args) => mockMkdir(...args),
    readFile: (...args) => mockReadFile(...args),
    remove: (...args) => mockRemove(...args),
    rename: (...args) => mockRename(...args),
    writeFile: (...args) => mockWriteFile(...args),
}));

import {
    deleteStoredAttachment,
    loadDesktopAttachment,
    uploadDesktopAttachment,
} from '../attachments';

const { webcrypto } = require('node:crypto');

const setDesktopRuntime = enabled => {
    if (enabled) {
        window.__TAURI_INTERNALS__ = {};
    } else {
        delete window.__TAURI_INTERNALS__;
    }
};

const createFile = (bytes, overrides = {}) => ({
    name: 'screenshot.png',
    size: bytes.length,
    slice: (start, end) => ({
        arrayBuffer: async () => bytes.slice(start, end).buffer,
    }),
    type: 'image/png',
    ...overrides,
});

const readBlob = blob =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
    });

describe('desktop attachment storage', () => {
    let storedChunks;

    beforeEach(() => {
        jest.clearAllMocks();
        setDesktopRuntime(true);
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: webcrypto,
        });
        jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
            '123e4567-e89b-42d3-a456-426614174000'
        );
        storedChunks = new Map();
        mockMkdir.mockResolvedValue(undefined);
        mockRemove.mockResolvedValue(undefined);
        mockRename.mockResolvedValue(undefined);
        mockWriteFile.mockImplementation(async (path, bytes) => {
            storedChunks.set(path, new Uint8Array(bytes));
        });
        mockReadFile.mockImplementation(async path => storedChunks.get(path));
    });

    afterEach(() => {
        setDesktopRuntime(false);
    });

    it('encrypts chunks, atomically promotes them, and decrypts on demand', async () => {
        const progress = [];
        const bytes = new Uint8Array([1, 2, 3, 4, 5]);
        const result = await uploadDesktopAttachment(createFile(bytes), {
            onProgress: value => progress.push(value),
        });

        expect(mockMkdir).toHaveBeenCalledWith(
            'encrypted-attachments/.123e4567-e89b-42d3-a456-426614174000.pending',
            { baseDir: 22, recursive: true }
        );
        const [, ciphertext] = mockWriteFile.mock.calls[0];
        expect(Array.from(ciphertext)).not.toEqual(Array.from(bytes));
        expect(mockRename).toHaveBeenCalledWith(
            'encrypted-attachments/.123e4567-e89b-42d3-a456-426614174000.pending',
            'encrypted-attachments/123e4567-e89b-42d3-a456-426614174000',
            { newPathBaseDir: 22, oldPathBaseDir: 22 }
        );
        expect(progress.at(-1)).toEqual({
            bytesTotal: 5,
            bytesUploaded: 5,
        });
        expect(result).toMatchObject({
            byte_size: 5,
            filename: 'screenshot.png',
            id: '123e4567-e89b-42d3-a456-426614174000',
            local_encrypted: true,
            mime_type: 'image/png',
            url: 'daily-planner-local-attachment:123e4567-e89b-42d3-a456-426614174000',
        });
        storedChunks.set(
            'encrypted-attachments/123e4567-e89b-42d3-a456-426614174000/000000.bin',
            new Uint8Array(ciphertext)
        );
        const restored = await loadDesktopAttachment(result);
        expect(await readBlob(restored)).toEqual(bytes);
        expect(restored.type).toBe('image/png');
    });

    it('rejects tampered encrypted chunks', async () => {
        const result = await uploadDesktopAttachment(
            createFile(new Uint8Array([1, 2, 3]))
        );
        const [, ciphertext] = mockWriteFile.mock.calls[0];
        const tampered = new Uint8Array(ciphertext);
        tampered[0] ^= 1;
        storedChunks.set(
            'encrypted-attachments/123e4567-e89b-42d3-a456-426614174000/000000.bin',
            tampered
        );
        await expect(loadDesktopAttachment(result)).rejects.toThrow();
    });

    it('removes partial native files when an upload is cancelled', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(
            uploadDesktopAttachment(createFile(new Uint8Array([1])), {
                signal: controller.signal,
            })
        ).rejects.toMatchObject({ name: 'AbortError' });

        expect(mockRemove).toHaveBeenCalledWith(
            'encrypted-attachments/.123e4567-e89b-42d3-a456-426614174000.pending',
            { baseDir: 22, recursive: true }
        );
    });

    it('deletes encrypted native attachments from app data', async () => {
        await deleteStoredAttachment({
            id: '123e4567-e89b-42d3-a456-426614174000',
            local_encrypted: true,
        });

        expect(mockRemove).toHaveBeenCalledWith(
            'encrypted-attachments/123e4567-e89b-42d3-a456-426614174000',
            { baseDir: 22, recursive: true }
        );
    });

    it('deletes native attachments from the private app-data directory', async () => {
        await deleteStoredAttachment({
            id: '123e4567-e89b-42d3-a456-426614174000',
        });

        expect(mockRemove).toHaveBeenCalledWith(
            'attachments/123e4567-e89b-42d3-a456-426614174000',
            { baseDir: 22, recursive: true }
        );
    });
});

describe('web attachment storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setDesktopRuntime(false);
        global.fetch = jest.fn(async () => ({ ok: true }));
    });

    it('keeps using the local Next.js attachment endpoint', async () => {
        await deleteStoredAttachment({ url: '/api/attachments/test-id' });

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/attachments/test-id',
            expect.objectContaining({ method: 'DELETE' })
        );
    });
});
