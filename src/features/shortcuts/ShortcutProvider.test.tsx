import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    ShortcutHint,
    ShortcutProvider,
    type ShortcutBinding,
    type ShortcutDefinition,
    useShortcut,
    useShortcutRecorder,
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

function RecorderHarness({
    onCandidate,
    onCancel,
    onStart,
    onTrigger,
}: {
    onCandidate: (shortcut: string) => boolean | Promise<boolean>;
    onCancel?: () => void | Promise<void>;
    onStart?: () => void | Promise<void>;
    onTrigger: () => void;
}) {
    useShortcut({
        onTrigger,
        shortcut: commandOne,
    });
    const recorder = useShortcutRecorder({
        onCandidate,
        ...(onCancel ? { onCancel } : {}),
        ...(onStart ? { onStart } : {}),
    });

    return (
        <>
            <button onClick={() => void recorder.start()} type="button">
                Record
            </button>
            <button onClick={recorder.cancel} type="button">
                Cancel recording
            </button>
            <output data-testid="recording-active">
                {String(recorder.active)}
            </output>
            <output data-testid="pressed-keys">
                {recorder.pressedKeyLabels.join('')}
            </output>
        </>
    );
}

function CompetingRecorderHarness({
    firstOnStart,
    secondOnStart,
}: {
    firstOnStart: () => void | Promise<void>;
    secondOnStart: () => void | Promise<void>;
}) {
    const first = useShortcutRecorder({
        onCandidate: () => false,
        onStart: firstOnStart,
    });
    const second = useShortcutRecorder({
        onCandidate: () => false,
        onStart: secondOnStart,
    });

    return (
        <>
            <button onClick={() => void first.start()} type="button">
                Record first
            </button>
            <button onClick={() => void second.start()} type="button">
                Record second
            </button>
            <button onClick={second.cancel} type="button">
                Cancel second
            </button>
            <output data-testid="first-recorder-active">
                {String(first.active)}
            </output>
            <output data-testid="second-recorder-active">
                {String(second.active)}
            </output>
        </>
    );
}

const renderRecorderHarness = ({
    onCandidate = vi.fn(() => false),
    onCancel = vi.fn(),
    onStart = vi.fn(),
    onTrigger = vi.fn(),
}: Partial<React.ComponentProps<typeof RecorderHarness>> = {}) => {
    const view = render(
        <ShortcutProvider>
            <RecorderHarness
                onCandidate={onCandidate}
                onCancel={onCancel}
                onStart={onStart}
                onTrigger={onTrigger}
            />
        </ShortcutProvider>
    );
    return { onCandidate, onCancel, onStart, onTrigger, ...view };
};

const createDeferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    const promise = new Promise<T>(complete => {
        resolve = complete;
    });
    return { promise, resolve };
};

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

    it('gives an active recorder first refusal and suppresses repeated candidates', () => {
        const { onCandidate, onTrigger } = renderRecorderHarness();

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.keyDown(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: true,
        });
        expect(screen.getByTestId('pressed-keys')).toHaveTextContent('⌘');

        fireEvent.keyDown(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
        });
        expect(onCandidate).toHaveBeenCalledWith('Super+Digit1');
        expect(onTrigger).not.toHaveBeenCalled();
        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'true'
        );

        fireEvent.keyDown(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
            repeat: true,
        });
        expect(onCandidate).toHaveBeenCalledOnce();
    });

    it('refreshes recorded keys on key-up while retaining held modifiers', () => {
        renderRecorderHarness();

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.keyDown(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: true,
        });
        fireEvent.keyDown(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
        });
        fireEvent.keyUp(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
        });
        expect(screen.getByTestId('pressed-keys')).toHaveTextContent('⌘');

        fireEvent.keyUp(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: false,
        });
        expect(screen.getByTestId('pressed-keys')).toBeEmptyDOMElement();
    });

    it('ends a recorder without cancelling it when an asynchronous candidate succeeds', async () => {
        const onCancel = vi.fn();
        const onCandidate = vi.fn(() => Promise.resolve(true));
        renderRecorderHarness({ onCandidate, onCancel });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.keyDown(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
        });

        await waitFor(() =>
            expect(screen.getByTestId('recording-active')).toHaveTextContent(
                'false'
            )
        );
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('keeps listening after a rejected candidate', async () => {
        const onCandidate = vi.fn(() => Promise.reject(new Error('taken')));
        renderRecorderHarness({ onCandidate });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.keyDown(window, {
            code: 'Digit1',
            key: '1',
            metaKey: true,
        });

        await waitFor(() => expect(onCandidate).toHaveBeenCalledOnce());
        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'true'
        );
    });

    it('does not let an earlier asynchronous start replace a newer recorder', async () => {
        let finishFirstStart: (() => void) | undefined;
        const firstOnStart = vi.fn(
            () =>
                new Promise<void>(resolve => {
                    finishFirstStart = resolve;
                })
        );
        const secondOnStart = vi.fn();
        render(
            <ShortcutProvider>
                <CompetingRecorderHarness
                    firstOnStart={firstOnStart}
                    secondOnStart={secondOnStart}
                />
            </ShortcutProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Record first' }));
        fireEvent.click(screen.getByRole('button', { name: 'Record second' }));

        await act(async () => finishFirstStart?.());

        expect(screen.getByTestId('first-recorder-active')).toHaveTextContent(
            'false'
        );
        expect(screen.getByTestId('second-recorder-active')).toHaveTextContent(
            'true'
        );
    });

    it('does not start a queued recorder after it is cancelled', async () => {
        const firstStart = createDeferred<undefined>();
        const firstOnStart = vi.fn(() => firstStart.promise);
        const secondOnStart = vi.fn();
        render(
            <ShortcutProvider>
                <CompetingRecorderHarness
                    firstOnStart={firstOnStart}
                    secondOnStart={secondOnStart}
                />
            </ShortcutProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Record first' }));
        fireEvent.click(screen.getByRole('button', { name: 'Record second' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel second' }));
        await act(async () => firstStart.resolve(undefined));

        expect(secondOnStart).not.toHaveBeenCalled();
    });

    it('stays inactive when Escape cancels an asynchronous start', async () => {
        const start = createDeferred<undefined>();
        const onCancel = vi.fn();
        renderRecorderHarness({ onCancel, onStart: () => start.promise });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.keyDown(window, {
            code: 'Escape',
            key: 'Escape',
        });
        await act(async () => start.resolve(undefined));

        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'false'
        );
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('stays inactive when window blur cancels an asynchronous start', async () => {
        const start = createDeferred<undefined>();
        const onCancel = vi.fn();
        renderRecorderHarness({ onCancel, onStart: () => start.promise });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent.blur(window);
        await act(async () => start.resolve(undefined));

        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'false'
        );
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('stays inactive when a hidden page cancels an asynchronous start', async () => {
        const start = createDeferred<undefined>();
        const onCancel = vi.fn();
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        renderRecorderHarness({ onCancel, onStart: () => start.promise });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        fireEvent(document, new Event('visibilitychange'));
        await act(async () => start.resolve(undefined));

        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'false'
        );
        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('stays inactive when an unmount cancels an asynchronous start', async () => {
        const start = createDeferred<undefined>();
        const onCancel = vi.fn();
        const { unmount } = renderRecorderHarness({
            onCancel,
            onStart: () => start.promise,
        });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        unmount();
        await act(async () => start.resolve(undefined));

        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('does not activate or throw when onStart throws synchronously', () => {
        const onStart = vi.fn(() => {
            throw new Error('start failed');
        });
        renderRecorderHarness({ onStart });

        expect(() =>
            fireEvent.click(screen.getByRole('button', { name: 'Record' }))
        ).not.toThrow();

        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'false'
        );
    });

    it('does not throw or reactivate when onCancel throws synchronously', () => {
        const onCancel = vi.fn(() => {
            throw new Error('cancel failed');
        });
        renderRecorderHarness({ onCancel });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        expect(() =>
            fireEvent.click(
                screen.getByRole('button', { name: 'Cancel recording' })
            )
        ).not.toThrow();

        expect(screen.getByTestId('recording-active')).toHaveTextContent(
            'false'
        );
    });

    it('cancels recording for Escape, an explicit cancellation, blur, and hidden pages', () => {
        const cases: {
            cancel: () => void;
            name: string;
        }[] = [
            {
                name: 'Escape',
                cancel: () =>
                    fireEvent.keyDown(window, {
                        cancelable: true,
                        code: 'Escape',
                        key: 'Escape',
                    }),
            },
            {
                name: 'an explicit cancellation',
                cancel: () =>
                    fireEvent.click(
                        screen.getByRole('button', {
                            name: 'Cancel recording',
                        })
                    ),
            },
            { name: 'window blur', cancel: () => fireEvent.blur(window) },
            {
                name: 'a hidden page',
                cancel: () => {
                    vi.spyOn(
                        document,
                        'visibilityState',
                        'get'
                    ).mockReturnValue('hidden');
                    fireEvent(document, new Event('visibilitychange'));
                },
            },
        ];

        for (const scenario of cases) {
            const onCancel = vi.fn();
            renderRecorderHarness({ onCancel });
            fireEvent.click(screen.getByRole('button', { name: 'Record' }));

            scenario.cancel();

            expect(onCancel, scenario.name).toHaveBeenCalledOnce();
            expect(screen.getByTestId('recording-active')).toHaveTextContent(
                'false'
            );
            cleanup();
            vi.restoreAllMocks();
        }
    });

    it('cancels the active recorder when its hook unmounts', () => {
        const onCancel = vi.fn();
        const { unmount } = renderRecorderHarness({ onCancel });

        fireEvent.click(screen.getByRole('button', { name: 'Record' }));
        unmount();

        expect(onCancel).toHaveBeenCalledOnce();
    });
});
