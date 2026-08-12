import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import type { PlannerPreferences } from '../../core/domain/types';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { ItemDragProvider } from '../items/ItemDragProvider';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { PlannerShell } from './PlannerShell';
import '../../styles/index.css';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const createHarness = () => {
    const list = createPlannerList({ label: 'Shell shortcut list' });
    const item = createPlannerItem({ label: 'Shell item', listId: list.id });
    const store = createPlannerStore();
    store.getState().applySnapshot({ items: [item], lists: [list] });
    const updatePreferences = vi.fn((changes: Partial<PlannerPreferences>) => {
        const current = store.getState().preferences;
        store.getState().setPreferences({ ...current, ...changes });
    });
    const commands = {
        archiveItem: vi.fn(),
        archiveList: vi.fn(),
        cancelLabelEdit: vi.fn(),
        completeLabelEdit: vi.fn(),
        createItem: vi.fn(async () => item),
        createList: vi.fn(async () => list),
        deleteItem: vi.fn(),
        deleteList: vi.fn(),
        fulfillLabelEdit: vi.fn(),
        hydrate: vi.fn(),
        moveItem: vi.fn(),
        restoreItem: vi.fn(),
        restoreList: vi.fn(),
        returnItemToList: vi.fn(),
        selectItem: vi.fn(),
        selectList: vi.fn(),
        updateItem: vi.fn(),
        updateItemWith: vi.fn(),
        updateList: vi.fn(),
        updatePreferences,
    } satisfies PlannerCommands;

    render(
        <PlannerStoreProvider store={store}>
            <CollaborationProvider>
                <PlannerCommandsProvider commands={commands}>
                    <ShortcutProvider>
                        <ItemDragProvider>
                            <PlannerShell />
                        </ItemDragProvider>
                    </ShortcutProvider>
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );

    return { store, updatePreferences };
};

describe('PlannerShell contextual shortcuts', () => {
    it('requires command to cycle the lighting mode', () => {
        const { store, updatePreferences } = createHarness();
        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        const lightingHeading = screen.getByRole('heading', {
            name: 'Lighting mode',
        });
        const lightingHint = lightingHeading.querySelector<HTMLElement>(
            '.planner-settings-group-shortcut'
        );
        expect(lightingHint).toHaveTextContent('⌘D');
        expect(lightingHint).not.toHaveAttribute('data-visible');
        expect(lightingHeading).toHaveAttribute('aria-keyshortcuts', 'Meta+D');

        fireEvent.keyDown(document, { key: 'd' });
        expect(updatePreferences).not.toHaveBeenCalled();
        expect(store.getState().preferences.themeMode).toBe('system');

        fireEvent.keyDown(document, { key: 'd', metaKey: true });
        expect(store.getState().preferences.themeMode).toBe('light');
        expect(lightingHint).toHaveAttribute('data-visible', 'true');
    });

    it.each([
        ['i', 'items'],
        ['l', 'lists'],
        ['t', 'timeline'],
    ] as const)('requires command to toggle the %s column', (key, column) => {
        const { store, updatePreferences } = createHarness();
        const section = screen.getByRole('region', {
            name: new RegExp(`^${column}$`, 'i'),
        });
        const hint = section.querySelector<HTMLElement>(
            '.planner-column-shortcut'
        );
        expect(hint).toHaveTextContent(`⌘${key.toLocaleUpperCase()}`);
        expect(hint).not.toHaveAttribute('data-visible');

        fireEvent.keyDown(document, { key });
        expect(updatePreferences).not.toHaveBeenCalled();
        expect(store.getState().preferences.columnVisibility[column]).toBe(
            true
        );

        fireEvent.keyDown(document, { key, metaKey: true });
        expect(store.getState().preferences.columnVisibility[column]).toBe(
            false
        );
        const collapsedHint = section.querySelector<HTMLElement>(
            '.planner-column-expand-shortcut'
        );
        expect(collapsedHint).toHaveTextContent(`⌘${key.toLocaleUpperCase()}`);
        expect(collapsedHint).toHaveAttribute('data-visible', 'true');
    });
});
