import { create as contentDisposition } from 'content-disposition';
import { createReadStream } from 'node:fs';
import { readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
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
    };
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
