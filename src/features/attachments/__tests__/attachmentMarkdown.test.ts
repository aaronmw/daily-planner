import { describe, expect, it } from 'vitest';
import {
    attachmentMarkdown,
    insertUploadPlaceholders,
    removeAttachmentMarkdown,
    uploadPlaceholder,
} from '../attachmentMarkdown';

describe('attachment Markdown', () => {
    it('inserts stable placeholders at the current selection', () => {
        const placeholder = uploadPlaceholder('client-1');
        const result = insertUploadPlaceholders(
            'before after',
            { direction: 'none', end: 6, start: 6 },
            [placeholder]
        );
        expect(result.text).toBe(`before\n${placeholder}\nafter`);
    });

    it('escapes filenames and emits images for image MIME types', () => {
        expect(
            attachmentMarkdown({
                filename: 'my [image].png',
                mimeType: 'image/png',
                url: 'daily-planner-attachment://id',
            })
        ).toBe('![my \\[image\\].png](daily-planner-attachment://id)');
    });

    it('removes only Markdown nodes targeting the attachment URL', () => {
        const target = 'daily-planner-attachment://target';
        const source = `[keep](https://example.com)\n\n![remove](${target})\n`;
        expect(removeAttachmentMarkdown(source, target)).toBe(
            '[keep](https://example.com)\n\n'
        );
    });
});
