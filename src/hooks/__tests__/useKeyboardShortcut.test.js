import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import useKeyboardShortcut from '../useKeyboardShortcut';

global.IS_REACT_ACT_ENVIRONMENT = true;

const ShortcutHarness = ({ handler }) => {
    useKeyboardShortcut('shortcut-test', 'k', handler);
    return null;
};

describe('useKeyboardShortcut', () => {
    let container;
    let root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        container.remove();
    });

    const pressK = target => {
        target.dispatchEvent(
            new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'k',
            })
        );
    };

    it('uses the latest handler and removes it on unmount', async () => {
        const firstHandler = jest.fn();
        const secondHandler = jest.fn();

        await act(async () =>
            root.render(<ShortcutHarness handler={firstHandler} />)
        );
        pressK(document.body);
        expect(firstHandler).toHaveBeenCalledTimes(1);

        await act(async () =>
            root.render(<ShortcutHarness handler={secondHandler} />)
        );
        pressK(document.body);
        expect(firstHandler).toHaveBeenCalledTimes(1);
        expect(secondHandler).toHaveBeenCalledTimes(1);

        await act(async () => root.unmount());
        pressK(document.body);
        expect(secondHandler).toHaveBeenCalledTimes(1);
    });

    it('does not run global shortcuts while typing in an input', async () => {
        const handler = jest.fn();
        const input = document.createElement('input');
        document.body.appendChild(input);

        await act(async () =>
            root.render(<ShortcutHarness handler={handler} />)
        );
        pressK(input);

        expect(handler).not.toHaveBeenCalled();
        input.remove();
        await act(async () => root.unmount());
    });
});
