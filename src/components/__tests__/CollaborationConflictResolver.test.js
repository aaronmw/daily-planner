import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CollaborationConflictResolver from '../CollaborationConflictResolver';

global.IS_REACT_ACT_ENVIRONMENT = true;

const fieldConflict = {
    id: 'conflict-field',
    kind: 'field-conflict',
    recordType: 'task',
    conflicts: [
        { field: 'label', local: 'Mine', remote: 'Theirs' },
        {
            field: 'notes',
            local: 'My notes',
            remote: 'Their notes',
        },
    ],
};

const deletedConflict = {
    id: 'conflict-deleted',
    kind: 'deleted-while-editing',
    recordType: 'task',
    local: { label: 'A task I was editing' },
};

describe('CollaborationConflictResolver', () => {
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

    const renderResolver = async props => {
        await act(async () => {
            root.render(
                <CollaborationConflictResolver
                    conflicts={[fieldConflict, deletedConflict]}
                    onDiscardConflict={jest.fn()}
                    onResolveFieldConflict={jest.fn()}
                    onSaveConflictAsPrivateCopy={jest.fn()}
                    {...props}
                />
            );
        });
    };

    const click = async element => {
        await act(async () => {
            element.dispatchEvent(
                new MouseEvent('click', { bubbles: true, cancelable: true })
            );
        });
    };

    const change = async (element, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(
            element.constructor.prototype,
            'value'
        );

        await act(async () => {
            descriptor.set.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        });
    };

    it('renders conflicts in an accessible, bounded section', async () => {
        await renderResolver();

        const surface = container.querySelector(
            '.planner-collaboration-conflict-resolver'
        );
        const heading = surface.querySelector('h2');

        expect(surface).not.toBeNull();
        expect(surface.getAttribute('aria-labelledby')).toBe(heading.id);
        expect(heading.textContent).toBe('Resolve sync conflicts');
        expect(surface.querySelectorAll('article')).toHaveLength(2);
        expect(surface.textContent).toContain('Mine');
        expect(surface.textContent).toContain('Theirs');
        expect(surface.textContent).toContain('Merge');
        expect(surface.textContent).toContain('Save as private copy');
        expect(surface.textContent).toContain('Discard');
    });

    it('submits a field-keyed map of mine, theirs, and edited merge choices', async () => {
        const onResolveFieldConflict = jest.fn();
        await renderResolver({ onResolveFieldConflict });

        await click(
            container.querySelector(
                'input[name="conflict-field-label"][value="theirs"]'
            )
        );
        const mergeText = container.querySelector(
            'textarea[name="conflict-field-notes-merge"]'
        );
        await change(mergeText, 'A thoughtful merged note');
        await click(mergeText);
        await click(
            container.querySelector(
                '[data-conflict-id="conflict-field"] button[type="submit"]'
            )
        );

        expect(onResolveFieldConflict).toHaveBeenCalledTimes(1);
        expect(onResolveFieldConflict).toHaveBeenCalledWith('conflict-field', {
            label: { choice: 'theirs', value: 'Theirs' },
            notes: { choice: 'merge', value: 'A thoughtful merged note' },
        });
    });

    it('keeps the resolve control mounted and busy while its callback is pending', async () => {
        let resolveRequest;
        const request = new Promise(resolve => {
            resolveRequest = resolve;
        });
        const onResolveFieldConflict = jest.fn(() => request);
        await renderResolver({ onResolveFieldConflict });

        const button = container.querySelector(
            '[data-conflict-id="conflict-field"] button[type="submit"]'
        );
        await click(button);

        expect(button.isConnected).toBe(true);
        expect(button.textContent).toContain('Resolve conflict');
        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.querySelector('.planner-spin')).not.toBeNull();

        await act(async () => resolveRequest());

        expect(button.isConnected).toBe(true);
        expect(button.disabled).toBe(false);
        expect(button.hasAttribute('aria-busy')).toBe(false);
    });

    it('keeps deleted-conflict actions independent and reports each action', async () => {
        let finishSave;
        const onSaveConflictAsPrivateCopy = jest.fn(
            () =>
                new Promise(resolve => {
                    finishSave = resolve;
                })
        );
        const onDiscardConflict = jest.fn();
        await renderResolver({
            onDiscardConflict,
            onSaveConflictAsPrivateCopy,
        });

        const deletedSurface = container.querySelector(
            '[data-conflict-id="conflict-deleted"]'
        );
        const saveButton = [...deletedSurface.querySelectorAll('button')].find(
            button => button.textContent.includes('Save as private copy')
        );
        const discardButton = [
            ...deletedSurface.querySelectorAll('button'),
        ].find(button => button.textContent.includes('Discard'));

        await click(saveButton);
        expect(onSaveConflictAsPrivateCopy).toHaveBeenCalledWith(
            'conflict-deleted'
        );
        expect(saveButton.disabled).toBe(true);
        expect(discardButton.disabled).toBe(true);
        expect(discardButton.hasAttribute('aria-busy')).toBe(false);

        await act(async () => finishSave());
        await click(discardButton);

        expect(onDiscardConflict).toHaveBeenCalledWith('conflict-deleted');
    });

    it('does not submit when Enter is pressed in an editable Merge value', async () => {
        const onResolveFieldConflict = jest.fn();
        await renderResolver({ onResolveFieldConflict });
        const mergeText = container.querySelector(
            'textarea[name="conflict-field-notes-merge"]'
        );

        await act(async () => {
            mergeText.dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                })
            );
        });

        expect(onResolveFieldConflict).not.toHaveBeenCalled();
    });

    it('renders nothing when there are no conflicts', async () => {
        await renderResolver({ conflicts: [] });

        expect(container.childElementCount).toBe(0);
    });
});
