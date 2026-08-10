import React, { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import EditableText from '../EditableText';

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('EditableText focus requests', () => {
    let container;
    let root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderEditor = async props => {
        await act(async () => {
            root.render(
                <StrictMode>
                    <EditableText value="New Task" {...props} />
                </StrictMode>
            );
        });

        return container.querySelector('textarea');
    };

    it('focuses, selects, and acknowledges a request exactly once', async () => {
        const onEditRequestFulfilled = jest.fn();
        const editRequest = { id: 1, selectAll: true };
        const textarea = await renderEditor({
            editRequest,
            onEditRequestFulfilled,
        });

        expect(document.activeElement).toBe(textarea);
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe('New Task'.length);
        expect(onEditRequestFulfilled).toHaveBeenCalledTimes(1);
        expect(onEditRequestFulfilled).toHaveBeenCalledWith(1);

        await renderEditor({ editRequest, onEditRequestFulfilled });
        expect(onEditRequestFulfilled).toHaveBeenCalledTimes(1);
    });

    it('handles a request that arrives after the idle editor mounts', async () => {
        const onEditRequestFulfilled = jest.fn();
        await renderEditor({ onEditRequestFulfilled });
        expect(container.querySelector('textarea')).toBeNull();

        const textarea = await renderEditor({
            editRequest: { id: 2, selectAll: true },
            onEditRequestFulfilled,
        });

        expect(document.activeElement).toBe(textarea);
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe('New Task'.length);
        expect(onEditRequestFulfilled).toHaveBeenCalledWith(2);
    });

    it('places the caret at zero for an empty requested label', async () => {
        const textarea = await renderEditor({
            editRequest: { id: 3, selectAll: true },
            value: '',
        });

        expect(document.activeElement).toBe(textarea);
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe(0);
    });

    it('reports cancellation without saving the requested edit', async () => {
        const onCancel = jest.fn();
        const onSave = jest.fn();
        const textarea = await renderEditor({
            editRequest: { id: 4, selectAll: true },
            onCancel,
            onSave,
        });

        await act(async () => {
            textarea.dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Escape',
                })
            );
        });

        expect(onCancel).toHaveBeenCalledWith({ editRequestId: 4 });
        expect(onSave).not.toHaveBeenCalled();
        expect(container.querySelector('textarea')).toBeNull();
    });
});
