import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    ShortcutHint,
    ShortcutProvider,
    type ShortcutBinding,
    type ShortcutDefinition,
    useShortcut,
} from './ShortcutProvider';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const commandOne = {
    id: 'select-item-1',
    key: '1',
    keyLabel: '1',
    modifiers: ['meta'],
} as const satisfies ShortcutDefinition;

function ShortcutHarness({
    allowInTextEntry = false,
    enabled = true,
    onTrigger,
    shortcut = commandOne,
}: {
    allowInTextEntry?: boolean;
    enabled?: boolean;
    onTrigger: () => void;
    shortcut?: ShortcutDefinition;
}) {
    const shortcutProps = useShortcut({
        allowInTextEntry,
        enabled,
        onTrigger,
        shortcut,
    });

    return (
        <>
            <button {...shortcutProps} type="button">
                Target
            </button>
            <input aria-label="Editor" />
            <ShortcutHint shortcut={shortcut} />
        </>
    );
}

const renderHarness = (
    binding: Pick<ShortcutBinding, 'allowInTextEntry' | 'enabled'> = {}
) => {
    const onTrigger = vi.fn();
    render(
        <ShortcutProvider>
            <ShortcutHarness onTrigger={onTrigger} {...binding} />
        </ShortcutProvider>
    );
    return onTrigger;
};

const getShortcutHint = () => {
    const hint = document.querySelector<HTMLElement>(
        '[data-slot="shortcut-hint"]'
    );
    if (!hint) throw new Error('The shortcut hint did not render.');
    return hint;
};

describe('ShortcutProvider', () => {
    it('dispatches only an exact, non-repeating command chord', () => {
        const onTrigger = renderHarness();

        fireEvent.keyDown(document, { key: '1' });
        fireEvent.keyDown(document, {
            key: '1',
            metaKey: true,
            shiftKey: true,
        });
        fireEvent.keyDown(document, {
            key: '1',
            metaKey: true,
            repeat: true,
        });
        expect(onTrigger).not.toHaveBeenCalled();

        const handled = fireEvent.keyDown(document, {
            cancelable: true,
            key: '1',
            metaKey: true,
        });

        expect(handled).toBe(false);
        expect(onTrigger).toHaveBeenCalledOnce();
    });

    it('does not trigger inside text-entry controls by default', () => {
        const onTrigger = renderHarness();

        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Editor' }), {
            key: '1',
            metaKey: true,
        });

        expect(onTrigger).not.toHaveBeenCalled();
    });

    it('supports bindings that explicitly allow text-entry activation', () => {
        const onTrigger = renderHarness({ allowInTextEntry: true });

        fireEvent.keyDown(screen.getByRole('textbox', { name: 'Editor' }), {
            key: '1',
            metaKey: true,
        });

        expect(onTrigger).toHaveBeenCalledOnce();
    });

    it('does not intercept disabled bindings', () => {
        const onTrigger = renderHarness({ enabled: false });

        const handled = fireEvent.keyDown(document, {
            cancelable: true,
            key: '1',
            metaKey: true,
        });

        expect(handled).toBe(true);
        expect(onTrigger).not.toHaveBeenCalled();
    });

    it('reveals contextual hints only while command is held', () => {
        renderHarness();
        const hint = getShortcutHint();
        expect(hint).not.toHaveAttribute('data-visible');

        fireEvent.keyDown(window, { key: 'Meta', metaKey: true });
        expect(hint).toHaveAttribute('data-visible', 'true');

        fireEvent.keyUp(window, { key: 'Meta', metaKey: false });
        expect(hint).not.toHaveAttribute('data-visible');
    });

    it('clears a held command state when the window loses focus', () => {
        renderHarness();
        const hint = getShortcutHint();

        fireEvent.keyDown(window, { key: 'Meta', metaKey: true });
        fireEvent.blur(window);

        expect(hint).not.toHaveAttribute('data-visible');
    });

    it('clears a held command state when the page becomes hidden', () => {
        renderHarness();
        const hint = getShortcutHint();
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

        fireEvent.keyDown(window, { key: 'Meta', metaKey: true });
        fireEvent(document, new Event('visibilitychange'));

        expect(hint).not.toHaveAttribute('data-visible');
    });

    it('keeps the first binding active when a chord conflicts', () => {
        const first = vi.fn();
        const second = vi.fn();
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => undefined);

        render(
            <ShortcutProvider>
                <ShortcutHarness onTrigger={first} />
                <ShortcutHarness
                    onTrigger={second}
                    shortcut={{ ...commandOne, id: 'conflicting-item' }}
                />
            </ShortcutProvider>
        );
        fireEvent.keyDown(document, { key: '1', metaKey: true });

        expect(first).toHaveBeenCalledOnce();
        expect(second).not.toHaveBeenCalled();
        expect(consoleError).toHaveBeenCalledWith(
            'Shortcut conflict for Meta+1: select-item-1, conflicting-item'
        );
    });

    it('exposes aria-keyshortcuts metadata on the bound control', () => {
        renderHarness();

        expect(screen.getByRole('button', { name: 'Target' })).toHaveAttribute(
            'aria-keyshortcuts',
            'Meta+1'
        );
    });
});
