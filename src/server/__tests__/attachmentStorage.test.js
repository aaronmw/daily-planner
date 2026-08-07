/** @jest-environment node */

import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { POST } from '../../../app/api/attachments/route';
import { DELETE, GET } from '../../../app/api/attachments/[id]/route';
import {
    ATTACHMENT_REQUEST_HEADER,
    ATTACHMENT_REQUEST_HEADER_VALUE,
} from '../../utils/attachments';

const origin = 'http://localhost:3010';
const mutationHeaders = {
    [ATTACHMENT_REQUEST_HEADER]: ATTACHMENT_REQUEST_HEADER_VALUE,
    Origin: origin,
};

const createUploadRequest = (files, headers = mutationHeaders) => {
    const formData = new FormData();

    files.forEach(file => formData.append('file', file));

    return new Request(`${origin}/api/attachments`, {
        body: formData,
        headers,
        method: 'POST',
    });
};

describe('local attachment storage', () => {
    let storageDirectory;

    beforeEach(async () => {
        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), 'daily-planner-attachments-')
        );
        process.env.DAILY_PLANNER_ATTACHMENT_DIR = storageDirectory;
    });

    afterEach(async () => {
        delete process.env.DAILY_PLANNER_ATTACHMENT_DIR;
        await rm(storageDirectory, { force: true, recursive: true });
    });

    it('streams a file to a generated UUID directory', async () => {
        const file = new File(['hello attachment'], 'hello.txt', {
            type: 'text/plain',
        });
        const response = await POST(createUploadRequest([file]));
        const metadata = await response.json();

        expect(response.status).toBe(201);
        expect(metadata.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(metadata).toMatchObject({
            byte_size: 16,
            filename: 'hello.txt',
            mime_type: 'text/plain',
            url: `/api/attachments/${metadata.id}`,
        });
        expect(
            await readFile(
                path.join(storageDirectory, metadata.id, 'content'),
                'utf8'
            )
        ).toBe('hello attachment');
    });

    it('does not apply an application file-size limit', async () => {
        const content = new Uint8Array(5 * 1024 * 1024);
        const response = await POST(
            createUploadRequest([
                new File([content], 'large.bin', {
                    type: 'application/octet-stream',
                }),
            ])
        );
        const metadata = await response.json();

        expect(response.status).toBe(201);
        expect(metadata.byte_size).toBe(content.byteLength);
    });

    it('returns inline content headers and deletes the stored directory', async () => {
        const uploadResponse = await POST(
            createUploadRequest([
                new File(['image'], 'photo one.png', { type: 'image/png' }),
            ])
        );
        const metadata = await uploadResponse.json();
        const requestUrl = `${origin}${metadata.url}`;
        const getResponse = await GET(new Request(requestUrl), {
            params: Promise.resolve({ id: metadata.id }),
        });

        expect(getResponse.status).toBe(200);
        expect(getResponse.headers.get('content-type')).toBe('image/png');
        expect(getResponse.headers.get('content-length')).toBe('5');
        expect(getResponse.headers.get('content-disposition')).toContain(
            'inline'
        );
        expect(getResponse.headers.get('content-disposition')).toContain(
            'photo one.png'
        );
        expect(await getResponse.text()).toBe('image');

        const deleteResponse = await DELETE(
            new Request(requestUrl, {
                headers: mutationHeaders,
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: metadata.id }) }
        );
        const missingResponse = await GET(new Request(requestUrl), {
            params: Promise.resolve({ id: metadata.id }),
        });

        expect(deleteResponse.status).toBe(204);
        expect(missingResponse.status).toBe(404);
    });

    it('rejects malformed, multi-file, cross-origin, and unmarked mutations', async () => {
        const one = new File(['one'], 'one.txt');
        const two = new File(['two'], 'two.txt');
        const multiResponse = await POST(createUploadRequest([one, two]));
        const crossOriginResponse = await POST(
            createUploadRequest([one], {
                ...mutationHeaders,
                Origin: 'http://example.com',
            })
        );
        const unmarkedResponse = await POST(
            createUploadRequest([one], { Origin: origin })
        );
        const nonMultipartResponse = await POST(
            new Request(`${origin}/api/attachments`, {
                body: 'not multipart',
                headers: mutationHeaders,
                method: 'POST',
            })
        );
        const traversalResponse = await GET(
            new Request(`${origin}/api/attachments/not-an-id`),
            { params: Promise.resolve({ id: '../../etc/passwd' }) }
        );

        expect(multiResponse.status).toBe(400);
        expect(crossOriginResponse.status).toBe(403);
        expect(unmarkedResponse.status).toBe(403);
        expect(nonMultipartResponse.status).toBe(415);
        expect(traversalResponse.status).toBe(400);
    });

    it('cleans partial files when an upload is aborted', async () => {
        const controller = new AbortController();
        const boundary = 'daily-planner-abort-boundary';
        const body = new ReadableStream({
            start(streamController) {
                streamController.enqueue(
                    new TextEncoder().encode(
                        `--${boundary}\r\n` +
                            'Content-Disposition: form-data; name="file"; filename="partial.txt"\r\n' +
                            'Content-Type: text/plain\r\n\r\npartial'
                    )
                );
            },
        });
        const request = new Request(`${origin}/api/attachments`, {
            body,
            duplex: 'half',
            headers: {
                ...mutationHeaders,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            method: 'POST',
            signal: controller.signal,
        });
        const responsePromise = POST(request);

        controller.abort();
        const response = await responsePromise;

        expect(response.status).toBe(499);
        expect(await readdir(storageDirectory)).toEqual([]);
    });
});
