import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import ArmedIconButton from '../ArmedIconButton';

global.IS_REACT_ACT_ENVIRONMENT = true;

describe('ArmedIconButton', () => {
    let container;
    let root;

    beforeEach(async () => {
        container = document.createElement('div');
        root = createRoot(container);
        document.body.appendChild(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const renderButton = async props => {
        await act(async () => {
            root.render(
                <ArmedIconButton label="Remove attachment" {...props}>
                    Remove
                </ArmedIconButton>
            );
        });

        return container.querySelector('button');
    };

    it('requires two activations and keeps its accessible name stable', async () => {
        const onConfirm = jest.fn();
        const button = await renderButton({ onConfirm });

        await act(async () => button.click());
        expect(button.getAttribute('aria-pressed')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Remove attachment');
        expect(onConfirm).not.toHaveBeenCalled();

        await act(async () => button.click());
        expect(button.getAttribute('aria-pressed')).toBe('false');
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disarms on Escape, blur, and pointer leave', async () => {
        const button = await renderButton({ onConfirm: jest.fn() });

        await act(async () => button.click());
        await act(async () =>
            button.dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Escape',
                })
            )
        );
        expect(button.getAttribute('aria-pressed')).toBe('false');

        await act(async () => button.click());
        await act(async () =>
            button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
        );
        expect(button.getAttribute('aria-pressed')).toBe('false');

        await act(async () => button.click());
        await act(async () =>
            button.dispatchEvent(
                new MouseEvent('pointerout', { bubbles: true })
            )
        );
        expect(button.getAttribute('aria-pressed')).toBe('false');
    });

    it('keeps the same control and label while pending', async () => {
        const button = await renderButton({
            onConfirm: jest.fn(),
            pending: true,
        });

        expect(button.disabled).toBe(true);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Remove attachment');
        expect(button.querySelector('.planner-spin')).not.toBeNull();
    });
});
