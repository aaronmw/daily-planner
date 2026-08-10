/** @jest-environment node */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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
const attachmentId = '10000000-0000-4000-8000-000000000001';

describe('legacy local attachment storage', () => {
    let storageDirectory;

    beforeEach(async () => {
        storageDirectory = await mkdtemp(
            path.join(os.tmpdir(), 'daily-planner-attachments-')
        );
        process.env.DAILY_PLANNER_ATTACHMENT_DIR = storageDirectory;
        const attachmentDirectory = path.join(storageDirectory, attachmentId);
        await mkdir(attachmentDirectory);
        await Promise.all([
            writeFile(path.join(attachmentDirectory, 'content'), 'image'),
            writeFile(
                path.join(attachmentDirectory, 'metadata.json'),
                JSON.stringify({
                    byte_size: 5,
                    created_at: '2026-08-08T00:00:00.000Z',
                    filename: 'photo one.png',
                    id: attachmentId,
                    mime_type: 'image/png',
                    url: `/api/attachments/${attachmentId}`,
                })
            ),
        ]);
    });

    afterEach(async () => {
        delete process.env.DAILY_PLANNER_ATTACHMENT_DIR;
        await rm(storageDirectory, { force: true, recursive: true });
    });

    it('reads old plaintext files only for migration and then deletes them', async () => {
        const requestUrl = `${origin}/api/attachments/${attachmentId}`;
        const getResponse = await GET(new Request(requestUrl), {
            params: Promise.resolve({ id: attachmentId }),
        });

        expect(getResponse.status).toBe(200);
        expect(getResponse.headers.get('content-type')).toBe('image/png');
        expect(getResponse.headers.get('content-length')).toBe('5');
        expect(getResponse.headers.get('content-disposition')).toContain(
            'photo one.png'
        );
        expect(await getResponse.text()).toBe('image');

        const deleteResponse = await DELETE(
            new Request(requestUrl, {
                headers: mutationHeaders,
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: attachmentId }) }
        );
        const missingResponse = await GET(new Request(requestUrl), {
            params: Promise.resolve({ id: attachmentId }),
        });

        expect(deleteResponse.status).toBe(204);
        expect(missingResponse.status).toBe(404);
    });

    it('rejects cross-origin, unmarked, and malformed migration requests', async () => {
        const requestUrl = `${origin}/api/attachments/${attachmentId}`;
        const crossOriginResponse = await DELETE(
            new Request(requestUrl, {
                headers: {
                    ...mutationHeaders,
                    Origin: 'http://example.com',
                },
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: attachmentId }) }
        );
        const unmarkedResponse = await DELETE(
            new Request(requestUrl, {
                headers: { Origin: origin },
                method: 'DELETE',
            }),
            { params: Promise.resolve({ id: attachmentId }) }
        );
        const traversalResponse = await GET(
            new Request(`${origin}/api/attachments/not-an-id`),
            { params: Promise.resolve({ id: '../../etc/passwd' }) }
        );

        expect(crossOriginResponse.status).toBe(403);
        expect(unmarkedResponse.status).toBe(403);
        expect(traversalResponse.status).toBe(400);
    });
});
