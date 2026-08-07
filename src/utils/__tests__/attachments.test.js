import {
    buildAttachmentMarkdown,
    createPendingAttachment,
    createUploadPlaceholder,
    escapeMarkdownLabel,
    extractClipboardFiles,
    insertAttachmentPlaceholders,
    removeAttachmentMarkdownByUrl,
    removeStaleUploadPlaceholders,
    removeUploadPlaceholder,
} from '../attachments';

describe('clipboard attachments', () => {
    it('extracts clipboard files without intercepting normal text paste', () => {
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        const clipboardWithFile = {
            items: [
                { kind: 'string', getAsFile: () => null },
                { kind: 'file', getAsFile: () => file },
            ],
        };
        const clipboardWithText = {
            items: [{ kind: 'string', getAsFile: () => null }],
        };

        expect(extractClipboardFiles(clipboardWithFile)).toEqual([file]);
        expect(extractClipboardFiles(clipboardWithText)).toEqual([]);
    });

    it('replaces the selection with one placeholder per line', () => {
        const attachments = [
            createPendingAttachment(
                new File(['a'], 'a.txt', { type: 'text/plain' }),
                'first'
            ),
            createPendingAttachment(
                new File(['b'], 'b.png', { type: 'image/png' }),
                'second'
            ),
        ];
        const result = insertAttachmentPlaceholders(
            'Before selected after',
            { start: 7, end: 15 },
            attachments
        );

        expect(result.text).toBe(
            'Before\n<!-- daily-planner-attachment-upload:first -->\n' +
                '<!-- daily-planner-attachment-upload:second -->\nafter'
        );
        expect(result.selection.start).toBe(result.selection.end);
        expect(result.selection.start).toBe(result.text.indexOf('after'));
    });

    it('leaves a line after pasted placeholders so typing can continue', () => {
        const attachment = createPendingAttachment(
            new File(['a'], 'a.txt'),
            'only'
        );
        const result = insertAttachmentPlaceholders('', { start: 0, end: 0 }, [
            attachment,
        ]);

        expect(result.text).toBe(
            '<!-- daily-planner-attachment-upload:only -->\n'
        );
        expect(result.selection.start).toBe(result.text.length);
    });

    it('escapes labels and generates image or file Markdown', () => {
        expect(escapeMarkdownLabel('a [draft]\\file.txt')).toBe(
            'a \\[draft\\]\\\\file.txt'
        );
        expect(
            buildAttachmentMarkdown({
                filename: 'photo [1].png',
                mime_type: 'image/png',
                url: '/api/attachments/one',
            })
        ).toBe('![photo \\[1\\].png](/api/attachments/one)');
        expect(
            buildAttachmentMarkdown({
                filename: 'notes.txt',
                mime_type: 'text/plain',
                url: '/api/attachments/two',
            })
        ).toBe('[notes.txt](/api/attachments/two)');
    });

    it('removes placeholders cleanly after stale or failed uploads', () => {
        const first = createUploadPlaceholder('first');
        const second = createUploadPlaceholder('second');
        const notes = `Before\n${first}\nMiddle ${second}\nAfter`;

        expect(removeUploadPlaceholder(notes, first)).toBe(
            `Before\nMiddle ${second}\nAfter`
        );
        expect(removeStaleUploadPlaceholders(notes)).toBe(
            'Before\nMiddle \nAfter'
        );
    });

    it('removes every matching Markdown target without reformatting text', () => {
        const url = '/api/attachments/target';
        const markdown = [
            'Before',
            `[file](${url})`,
            `Inline [file](${url}) stays around its text.`,
            `![image](${url})`,
            '[other](/api/attachments/other)',
        ].join('\n');

        expect(removeAttachmentMarkdownByUrl(markdown, url)).toBe(
            [
                'Before',
                'Inline  stays around its text.',
                '[other](/api/attachments/other)',
            ].join('\n')
        );
    });
});
