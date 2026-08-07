import Busboy from 'busboy';
import { create as contentDisposition } from 'content-disposition';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
    ATTACHMENT_REQUEST_HEADER,
    ATTACHMENT_REQUEST_HEADER_VALUE,
} from '../utils/attachments';

export const ATTACHMENT_ID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEPLOYMENT_ENVIRONMENT_KEYS = [
    'VERCEL',
    'NETLIFY',
    'CF_PAGES',
    'RENDER',
    'FLY_APP_NAME',
];

export class AttachmentRequestError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = 'AttachmentRequestError';
        this.status = status;
    }
}

const normalizedHostname = hostname =>
    String(hostname || '')
        .toLowerCase()
        .replace(/^\[|\]$/g, '');

export const isLocalHostname = hostname => {
    const normalized = normalizedHostname(hostname);

    return (
        normalized === 'localhost' ||
        normalized === '::1' ||
        normalized.startsWith('127.')
    );
};

export const isDeployedEnvironment = () =>
    DEPLOYMENT_ENVIRONMENT_KEYS.some(key => Boolean(process.env[key]));

export const validateAttachmentRequest = (
    request,
    { requireMutationProtection = false } = {}
) => {
    const requestUrl = new URL(request.url);

    if (isDeployedEnvironment() || !isLocalHostname(requestUrl.hostname)) {
        throw new AttachmentRequestError(
            'Attachments are available only on localhost.',
            403
        );
    }

    if (!requireMutationProtection) {
        return requestUrl;
    }

    const origin = request.headers.get('origin');
    let parsedOrigin;

    try {
        parsedOrigin = origin ? new URL(origin) : null;
    } catch {
        throw new AttachmentRequestError('Invalid request origin.', 403);
    }

    if (!parsedOrigin || parsedOrigin.origin !== requestUrl.origin) {
        throw new AttachmentRequestError('Cross-origin request rejected.', 403);
    }

    if (
        request.headers.get(ATTACHMENT_REQUEST_HEADER) !==
        ATTACHMENT_REQUEST_HEADER_VALUE
    ) {
        throw new AttachmentRequestError(
            'Attachment request header is missing.',
            403
        );
    }

    return requestUrl;
};

export const getAttachmentRoot = () =>
    process.env.DAILY_PLANNER_ATTACHMENT_DIR ||
    path.join(process.cwd(), '.daily-planner', 'attachments');

export const getAttachmentPaths = id => {
    if (!ATTACHMENT_ID_PATTERN.test(id)) {
        throw new AttachmentRequestError('Invalid attachment ID.', 400);
    }

    const directory = path.join(
        /* turbopackIgnore: true */ getAttachmentRoot(),
        id
    );

    return {
        content: path.join(directory, 'content'),
        directory,
        metadata: path.join(directory, 'metadata.json'),
        metadataTemporary: path.join(directory, 'metadata.json.part'),
        temporary: path.join(directory, 'content.part'),
    };
};

const normalizeStoredFilename = filename =>
    String(filename || 'attachment')
        .replace(/[\r\n\0]+/g, ' ')
        .trim() || 'attachment';

export const storeAttachmentRequest = async request => {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
        throw new AttachmentRequestError(
            'A multipart file upload is required.',
            415
        );
    }

    if (!request.body) {
        throw new AttachmentRequestError('The upload body is empty.');
    }

    const id = randomUUID();
    const paths = getAttachmentPaths(id);
    let byteSize = 0;
    let fileCount = 0;
    let fileInfo = null;
    let streamError = null;
    let writePromise = Promise.resolve();

    await mkdir(paths.directory, { recursive: true });

    try {
        const busboy = Busboy({
            headers: {
                'content-type': contentType,
            },
        });
        const requestStream = Readable.fromWeb(request.body);

        const parsePromise = new Promise((resolve, reject) => {
            const abort = () => {
                requestStream.destroy(
                    new AttachmentRequestError('Upload was aborted.', 499)
                );
            };

            if (request.signal.aborted) {
                abort();
            } else {
                request.signal.addEventListener('abort', abort, { once: true });
            }

            requestStream.on('error', reject);
            busboy.on('error', reject);
            busboy.on('close', () => {
                request.signal.removeEventListener('abort', abort);
                resolve();
            });
            busboy.on('file', (_fieldName, file, info) => {
                fileCount += 1;

                if (fileCount > 1) {
                    streamError = new AttachmentRequestError(
                        'Upload exactly one file per request.'
                    );
                    file.resume();
                    return;
                }

                fileInfo = {
                    filename: normalizeStoredFilename(info.filename),
                    mime_type: info.mimeType || 'application/octet-stream',
                };

                file.on('data', chunk => {
                    byteSize += chunk.length;
                });

                writePromise = pipeline(
                    file,
                    createWriteStream(paths.temporary, { flags: 'wx' })
                ).catch(error => {
                    streamError = error;
                });
            });

            requestStream.pipe(busboy);
        });

        await parsePromise;
        await writePromise;

        if (streamError) {
            throw streamError;
        }

        if (fileCount !== 1 || !fileInfo) {
            throw new AttachmentRequestError(
                'Upload exactly one file per request.'
            );
        }

        const metadata = {
            byte_size: byteSize,
            created_at: new Date().toISOString(),
            filename: fileInfo.filename,
            id,
            mime_type: fileInfo.mime_type,
            url: `/api/attachments/${id}`,
        };

        await rename(paths.temporary, paths.content);
        await writeFile(paths.metadataTemporary, JSON.stringify(metadata), {
            encoding: 'utf8',
            flag: 'wx',
        });
        await rename(paths.metadataTemporary, paths.metadata);

        return metadata;
    } catch (error) {
        await rm(paths.directory, { force: true, recursive: true });
        throw error;
    }
};

export const readAttachment = async id => {
    const paths = getAttachmentPaths(id);
    const metadata = JSON.parse(
        await readFile(/* turbopackIgnore: true */ paths.metadata, 'utf8')
    );
    const fileStat = await stat(/* turbopackIgnore: true */ paths.content);

    return {
        metadata,
        size: fileStat.size,
        stream: createReadStream(/* turbopackIgnore: true */ paths.content),
    };
};

export const createAttachmentResponse = async id => {
    const { metadata, size, stream } = await readAttachment(id);

    return new Response(Readable.toWeb(stream), {
        headers: {
            'Cache-Control': 'no-store',
            'Content-Disposition': contentDisposition(metadata.filename, {
                type: 'inline',
            }),
            'Content-Length': String(size),
            'Content-Type': metadata.mime_type || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff',
        },
    });
};

export const deleteAttachment = async id => {
    const paths = getAttachmentPaths(id);

    await readFile(/* turbopackIgnore: true */ paths.metadata, 'utf8');
    await rm(paths.directory, { force: true, recursive: true });
};
