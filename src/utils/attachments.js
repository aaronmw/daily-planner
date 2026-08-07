import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';

export const ATTACHMENT_REQUEST_HEADER = 'x-daily-planner-attachment';
export const ATTACHMENT_REQUEST_HEADER_VALUE = '1';
export const UPLOAD_PLACEHOLDER_PREFIX = 'daily-planner-attachment-upload:';

const normalizeFilename = filename =>
    String(filename || 'attachment')
        .replace(/[\r\n]+/g, ' ')
        .trim() || 'attachment';

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rangeForStandaloneLine = (text, start, end) => {
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const newlineAfter = text.indexOf('\n', end);
    const contentEnd = newlineAfter === -1 ? text.length : newlineAfter;
    const isStandalone =
        text.slice(lineStart, start).trim() === '' &&
        text.slice(end, contentEnd).trim() === '';

    if (!isStandalone) {
        return { start, end };
    }

    if (newlineAfter !== -1) {
        return { start: lineStart, end: newlineAfter + 1 };
    }

    return {
        start: lineStart > 0 ? lineStart - 1 : lineStart,
        end: text.length,
    };
};

export const createUploadPlaceholder = clientId =>
    `<!-- ${UPLOAD_PLACEHOLDER_PREFIX}${clientId} -->`;

export const createAttachmentClientId = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const extractClipboardFiles = clipboardData => {
    if (!clipboardData) {
        return [];
    }

    const itemFiles = Array.from(clipboardData.items || [])
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter(Boolean);

    return itemFiles.length
        ? itemFiles
        : Array.from(clipboardData.files || []).filter(Boolean);
};

export const escapeMarkdownLabel = filename =>
    normalizeFilename(filename)
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

export const buildAttachmentMarkdown = ({ filename, mime_type, url }) => {
    const label = escapeMarkdownLabel(filename);

    return String(mime_type || '')
        .toLowerCase()
        .startsWith('image/')
        ? `![${label}](${url})`
        : `[${label}](${url})`;
};

export const createPendingAttachment = (file, clientId) => ({
    byte_size: Number(file.size) || 0,
    client_id: clientId,
    filename: normalizeFilename(file.name),
    mime_type: file.type || 'application/octet-stream',
    placeholder: createUploadPlaceholder(clientId),
    status: 'uploading',
});

export const insertAttachmentPlaceholders = (
    text,
    selection,
    pendingAttachments
) => {
    const source = String(text || '');
    const start = Math.max(0, Math.min(selection?.start ?? 0, source.length));
    const end = Math.max(
        start,
        Math.min(selection?.end ?? start, source.length)
    );
    const rawBefore = source.slice(0, start);
    const rawAfter = source.slice(end);
    const before = rawBefore.replace(/[ \t]+$/, '');
    const after = rawAfter.replace(/^[ \t]+/, '');
    const placeholders = pendingAttachments
        .map(attachment => attachment.placeholder)
        .join('\n');
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    const suffix = after && !after.startsWith('\n') ? '\n' : '';
    const trailingNewline = after ? '' : '\n';
    const inserted = `${prefix}${placeholders}${suffix}${trailingNewline}`;
    const nextCursor = before.length + inserted.length;

    return {
        text: `${before}${inserted}${after}`,
        selection: {
            start: nextCursor,
            end: nextCursor,
            direction: 'none',
        },
    };
};

export const replaceUploadPlaceholder = (text, placeholder, replacement) =>
    String(text || '').replace(placeholder, replacement);

export const removeUploadPlaceholder = (text, placeholder) => {
    const source = String(text || '');
    const start = source.indexOf(placeholder);

    if (start === -1) {
        return source;
    }

    const range = rangeForStandaloneLine(
        source,
        start,
        start + placeholder.length
    );

    return source.slice(0, range.start) + source.slice(range.end);
};

export const removeStaleUploadPlaceholders = text => {
    const placeholderPattern = new RegExp(
        `<!--\\s*${escapeRegExp(UPLOAD_PLACEHOLDER_PREFIX)}[^>]+-->`,
        'g'
    );
    let nextText = String(text || '');
    const placeholders = nextText.match(placeholderPattern) || [];

    placeholders.forEach(placeholder => {
        nextText = removeUploadPlaceholder(nextText, placeholder);
    });

    return nextText;
};

export const removeAttachmentMarkdownByUrl = (markdown, targetUrl) => {
    const source = String(markdown || '');
    const ranges = [];

    try {
        const tree = fromMarkdown(source);

        visit(tree, node => {
            if (
                (node.type === 'link' || node.type === 'image') &&
                node.url === targetUrl &&
                Number.isInteger(node.position?.start?.offset) &&
                Number.isInteger(node.position?.end?.offset)
            ) {
                ranges.push(
                    rangeForStandaloneLine(
                        source,
                        node.position.start.offset,
                        node.position.end.offset
                    )
                );
            }
        });
    } catch {
        return source;
    }

    return ranges
        .sort((a, b) => b.start - a.start)
        .reduce(
            (nextSource, range) =>
                nextSource.slice(0, range.start) + nextSource.slice(range.end),
            source
        );
};

export const applyAttachmentDraftMutation = (draft, mutation) => {
    if (mutation.type === 'replace-placeholder') {
        return mutation.replacement
            ? replaceUploadPlaceholder(
                  draft,
                  mutation.placeholder,
                  mutation.replacement
              )
            : removeUploadPlaceholder(draft, mutation.placeholder);
    }

    if (mutation.type === 'remove-markdown') {
        return removeAttachmentMarkdownByUrl(draft, mutation.url);
    }

    return draft;
};
