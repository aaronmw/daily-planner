import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EditableText } from './EditableText';

describe('EditableText in a real browser', () => {
    it('acknowledges a pre-mount edit request with focus and full selection', async () => {
        const fulfilled = vi.fn();
        render(
            <EditableText
                ariaLabel="List label"
                editRequest={{ id: 'request-1', selectAll: true }}
                onEditRequestFulfilled={fulfilled}
                onSave={() => undefined}
                value="Daily Planner"
            />
        );

        const textarea = await screen.findByRole('textbox', {
            name: 'List label',
        });
        await waitFor(() => expect(document.activeElement).toBe(textarea));
        expect(textarea).toHaveProperty('selectionStart', 0);
        expect(textarea).toHaveProperty('selectionEnd', 13);
        expect(fulfilled).toHaveBeenCalledOnce();
    });

    it('accepts spaces without saving and wraps selected prose', async () => {
        const save = vi.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <EditableText
                ariaLabel="Item label"
                editRequest={{ id: 'label-request', selectAll: true }}
                onSave={save}
                value="DailyPlanner"
            />
        );
        const label = await screen.findByRole('textbox', {
            name: 'Item label',
        });
        await user.keyboard('Daily Planner');
        expect(label).toHaveValue('Daily Planner');
        expect(save).not.toHaveBeenCalled();

        rerender(
            <EditableText
                ariaLabel="Item notes"
                editRequest={{ id: 'notes-request', selectAll: false }}
                mode="prose"
                multiline
                onSave={save}
                value="hello world"
            />
        );
        const notes = await screen.findByRole('textbox', {
            name: 'Item notes',
        });
        expect(notes).toBeInstanceOf(HTMLTextAreaElement);
        if (!(notes instanceof HTMLTextAreaElement)) return;
        notes.setSelectionRange(0, 5, 'forward');
        fireEvent.keyDown(notes, { key: '(' });
        expect(notes).toHaveValue('(hello) world');
        expect(notes).toHaveProperty('selectionStart', 1);
        expect(notes).toHaveProperty('selectionEnd', 6);
    });
});
