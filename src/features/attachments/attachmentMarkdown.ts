import type { TextSelection } from '../editor/sentences';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import type { Image, Link } from 'mdast';

const PREFIX = 'daily-planner-attachment-upload:';

export const uploadPlaceholder = (clientId: string): string =>
    `<!-- ${PREFIX}${clientId} -->`;

export const escapeMarkdownLabel = (value: string): string =>
    (value.trim() || 'attachment')
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

export const attachmentMarkdown = ({
    filename,
    mimeType,
    url,
}: {
    filename: string;
    mimeType: string;
    url: string;
}): string => {
    const label = escapeMarkdownLabel(filename);
    return mimeType.toLowerCase().startsWith('image/')
        ? `![${label}](${url})`
        : `[${label}](${url})`;
};

export const insertUploadPlaceholders = (
    text: string,
    selection: TextSelection,
    placeholders: readonly string[]
): { selection: TextSelection; text: string } => {
    const before = text.slice(0, selection.start).replace(/[ \t]+$/u, '');
    const after = text.slice(selection.end).replace(/^[ \t]+/u, '');
    const prefix = before && !before.endsWith('\n') ? '\n' : '';
    const suffix = after && !after.startsWith('\n') ? '\n' : '';
    const trailing = after ? '' : '\n';
    const inserted = `${prefix}${placeholders.join('\n')}${suffix}${trailing}`;
    const cursor = before.length + inserted.length;
    return {
        selection: { direction: 'none', end: cursor, start: cursor },
        text: `${before}${inserted}${after}`,
    };
};

export const replaceUploadPlaceholder = (
    text: string,
    placeholder: string,
    replacement: string
): string => text.replace(placeholder, replacement);

export const removeUploadPlaceholder = (
    text: string,
    placeholder: string
): string => {
    const start = text.indexOf(placeholder);
    if (start === -1) return text;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const newline = text.indexOf('\n', start + placeholder.length);
    const lineEnd = newline === -1 ? text.length : newline;
    const standalone =
        text.slice(lineStart, start).trim() === '' &&
        text.slice(start + placeholder.length, lineEnd).trim() === '';
    if (!standalone) {
        return `${text.slice(0, start)}${text.slice(start + placeholder.length)}`;
    }
    return newline === -1
        ? `${text.slice(0, Math.max(0, lineStart - 1))}${text.slice(lineEnd)}`
        : `${text.slice(0, lineStart)}${text.slice(newline + 1)}`;
};

export const removeAttachmentMarkdown = (
    markdown: string,
    targetUrl: string
): string => {
    const ranges: { end: number; start: number }[] = [];
    const tree = fromMarkdown(markdown);
    visit(tree, ['image', 'link'], node => {
        const target = node as Image | Link;
        const start = target.position?.start.offset;
        const end = target.position?.end.offset;
        if (
            target.url === targetUrl &&
            typeof start === 'number' &&
            typeof end === 'number'
        ) {
            ranges.push({ end, start });
        }
    });
    return ranges
        .sort((left, right) => right.start - left.start)
        .reduce(
            (source, range) =>
                `${source.slice(0, range.start)}${source.slice(range.end)}`,
            markdown
        )
        .replace(/\n{3,}/g, '\n\n');
};
