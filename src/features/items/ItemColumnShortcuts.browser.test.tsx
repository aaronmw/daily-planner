import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import type { ItemId } from '../../core/domain/ids';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { ItemColumn } from './ItemColumn';
import { ItemDragProvider } from './ItemDragProvider';
import '../../styles/index.css';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const createHarness = () => {
    const list = createPlannerList({ label: 'Shortcut list' });
    let afterOrderKey: string | null = null;
    const items = Array.from({ length: 40 }, (_, index) => {
        const item = createPlannerItem({
            afterOrderKey,
            label: `Item ${index + 1}`,
            listId: list.id,
        });
        afterOrderKey = item.orderKey;
        return item;
    });
    const store = createPlannerStore();
    store.getState().applySnapshot({ items, lists: [list] });
    const commands = {
        archiveItem: vi.fn(),
        archiveList: vi.fn(),
        cancelLabelEdit: vi.fn(),
        completeLabelEdit: vi.fn(),
        createItem: vi.fn(async () => items[0]!),
        createList: vi.fn(),
        deleteItem: vi.fn(),
        deleteList: vi.fn(),
        fulfillLabelEdit: vi.fn(),
        hydrate: vi.fn(),
        moveItem: vi.fn(),
        restoreItem: vi.fn(),
        restoreList: vi.fn(),
        returnItemToList: vi.fn(),
        selectItem: vi.fn((id: ItemId) =>
            store.getState().setSelection(list.id, id)
        ),
        selectList: vi.fn(),
        updateItem: vi.fn(),
        updateItemWith: vi.fn(),
        updateList: vi.fn(),
        updatePreferences: vi.fn(),
    } satisfies PlannerCommands;
    const view = render(
        <PlannerStoreProvider store={store}>
            <CollaborationProvider>
                <PlannerCommandsProvider commands={commands}>
                    <ShortcutProvider>
                        <ItemDragProvider>
                            <div style={{ height: 220, width: 320 }}>
                                <ItemColumn minuteHeight={1} />
                            </div>
                        </ItemDragProvider>
                    </ShortcutProvider>
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );

    return { commands, items, store, view };
};

describe('ItemColumn contextual shortcuts', () => {
    it('requires command for numbered item selection', async () => {
        const { commands, items, view } = createHarness();
        await waitFor(() =>
            expect(view.container.querySelector('[data-item-id]')).toBeTruthy()
        );

        fireEvent.keyDown(document, { key: '2' });
        expect(commands.selectItem).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: '2', metaKey: true });
        expect(commands.selectItem).toHaveBeenCalledWith(items[1]!.id);
    });

    it('requires command for creation while preserving arrow navigation', async () => {
        const { commands, items, view } = createHarness();
        await waitFor(() =>
            expect(view.container.querySelector('[data-item-id]')).toBeTruthy()
        );
        const createButton = view.getByRole('button', {
            name: 'Create Item',
        });
        const createHint = createButton.querySelector<HTMLElement>(
            '.planner-create-item-shortcut'
        );
        expect(createButton).toHaveAttribute('aria-keyshortcuts', 'Meta+N');
        expect(createHint).toHaveTextContent('⌘N');
        expect(createHint).not.toHaveAttribute('data-visible');

        fireEvent.keyDown(document, { key: 'n' });
        expect(commands.createItem).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'n', metaKey: true });
        expect(commands.createItem).toHaveBeenCalledOnce();
        expect(createHint).toHaveAttribute('data-visible', 'true');

        fireEvent.keyDown(document, { key: 'ArrowDown' });
        expect(commands.selectItem).toHaveBeenCalledWith(items[0]!.id);
    });
});
