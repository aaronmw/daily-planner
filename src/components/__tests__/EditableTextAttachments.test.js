import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import EditableText from '../EditableText';

global.IS_REACT_ACT_ENVIRONMENT = true;

const renderEditor = async props => {
    const container = document.createElement('div');
    const root = createRoot(container);
    document.body.appendChild(container);

    await act(async () => {
        root.render(
            <EditableText
                isMultiLine
                mode="prose"
                startsEditing
                value=""
                {...props}
            />
        );
    });

    return {
        container,
        root,
        textarea: container.querySelector('textarea'),
    };
};

const dispatchPaste = async (textarea, clipboardData) => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: clipboardData });

    await act(async () => {
        textarea.dispatchEvent(event);
    });

    return event;
};

describe('EditableText attachment paste', () => {
    let mountedEditors = [];

    afterEach(async () => {
        await Promise.all(
            mountedEditors.map(async ({ container, root }) => {
                await act(async () => root.unmount());
                container.remove();
            })
        );
        mountedEditors = [];
    });

    it('leaves normal text paste to the native textarea', async () => {
        const onPasteFiles = jest.fn();
        const editor = await renderEditor({ onPasteFiles });
        mountedEditors.push(editor);
        const event = await dispatchPaste(editor.textarea, {
            items: [{ kind: 'string', getAsFile: () => null }],
        });

        expect(event.defaultPrevented).toBe(false);
        expect(onPasteFiles).not.toHaveBeenCalled();
    });

    it('intercepts clipboard files and applies the returned draft selection', async () => {
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        const onPasteFiles = jest.fn(() => ({
            selection: { start: 12, end: 12, direction: 'none' },
            text: '[hello](url)',
        }));
        const editor = await renderEditor({ onPasteFiles });
        mountedEditors.push(editor);
        editor.textarea.setSelectionRange(0, 0);
        const event = await dispatchPaste(editor.textarea, {
            items: [{ kind: 'file', getAsFile: () => file }],
        });

        expect(event.defaultPrevented).toBe(true);
        expect(onPasteFiles).toHaveBeenCalledWith([file], {
            selection: { start: 0, end: 0, direction: 'none' },
            text: '',
        });
        expect(editor.textarea.value).toBe('[hello](url)');
        expect(editor.textarea.selectionStart).toBe(12);
    });
});
