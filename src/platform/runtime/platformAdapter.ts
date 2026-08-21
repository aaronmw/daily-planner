import type { PlatformAdapter } from '../../core/application/ports';
import type { PlannerCommandId } from '../../core/application/commandIds';
import type { AccentKey } from '../../core/domain/types';

export const isDesktopRuntime = (): boolean =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const shortcutsAreUnique = (
    shortcuts: Readonly<Partial<Record<PlannerCommandId, string>>>
): boolean => {
    const values = Object.values(shortcuts);
    return new Set(values).size === values.length;
};

class WebPlatformAdapter implements PlatformAdapter {
    readonly kind = 'web' as const;

    openExternal(url: string): Promise<void> {
        window.open(url, '_blank', 'noopener,noreferrer');
        return Promise.resolve();
    }

    registerGlobalShortcuts(): Promise<() => void> {
        return Promise.resolve(() => undefined);
    }

    setDockIconAccent(): Promise<void> {
        return Promise.resolve();
    }

    showPlanner(): Promise<void> {
        window.focus();
        return Promise.resolve();
    }
}

export class TauriPlatformAdapter implements PlatformAdapter {
    readonly kind = 'desktop' as const;
    #registered: string[] = [];
    #registeredEntries: [PlannerCommandId, string][] = [];
    #registeredHandler: ((commandId: PlannerCommandId) => void) | null = null;
    #dockIconQueue: Promise<void> = Promise.resolve();

    async openExternal(url: string): Promise<void> {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
    }

    async registerGlobalShortcuts(
        shortcuts: Readonly<Partial<Record<PlannerCommandId, string>>>,
        onCommand: (commandId: PlannerCommandId) => void
    ): Promise<() => void | Promise<void>> {
        if (!shortcutsAreUnique(shortcuts)) {
            throw new Error('Desktop shortcuts must be unique.');
        }
        const { register, unregister } =
            await import('@tauri-apps/plugin-global-shortcut');
        const entries = Object.entries(shortcuts) as [
            PlannerCommandId,
            string,
        ][];
        const values = entries.map(([, shortcut]) => shortcut);
        const previous = [...this.#registered];
        const previousEntries = [...this.#registeredEntries];
        const previousHandler = this.#registeredHandler;
        if (previous.length > 0) {
            await unregister(previous);
            this.#registered = [];
        }
        if (values.length === 0) {
            this.#registeredEntries = [];
            this.#registeredHandler = onCommand;
            return () => {
                this.#registeredHandler = null;
            };
        }
        try {
            await register(values, event => {
                if (event.state !== 'Pressed') return;
                const command = entries.find(
                    ([, shortcut]) => shortcut === event.shortcut
                )?.[0];
                if (command) onCommand(command);
            });
            this.#registered = values;
            this.#registeredEntries = entries;
            this.#registeredHandler = onCommand;
        } catch (error) {
            if (previous.length > 0) {
                await register(previous, event => {
                    if (event.state !== 'Pressed') return;
                    const command = previousEntries.find(
                        ([, shortcut]) => shortcut === event.shortcut
                    )?.[0];
                    if (command) previousHandler?.(command);
                });
                this.#registered = previous;
                this.#registeredEntries = previousEntries;
                this.#registeredHandler = previousHandler;
            }
            throw error;
        }
        let released = false;
        return async () => {
            if (released) return;
            const registered = [...this.#registered];
            if (registered.length > 0) await unregister(registered);
            released = true;
            this.#registered = [];
            this.#registeredEntries = [];
            this.#registeredHandler = null;
        };
    }

    setDockIconAccent(accent: AccentKey | null): Promise<void> {
        const update = this.#dockIconQueue.then(async () => {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('set_dock_icon_accent', { accent });
        });
        this.#dockIconQueue = update.catch(() => undefined);
        return update;
    }

    async showPlanner(): Promise<void> {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const current = getCurrentWindow();
        await current.unminimize();
        await current.show();
        await current.setFocus();
    }
}

let adapter: PlatformAdapter | null = null;

export const getPlatformAdapter = (): PlatformAdapter => {
    adapter ??= isDesktopRuntime()
        ? new TauriPlatformAdapter()
        : new WebPlatformAdapter();
    return adapter;
};
