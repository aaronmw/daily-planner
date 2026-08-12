import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { ITEM_SELECTION_SHORTCUTS } from '../shortcuts/appShortcuts';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { ItemCard } from './ItemCard';
import '../../styles/index.css';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe('item shortcut hint', () => {
    it('cross-fades the item icon and protrudes the final key by one third', async () => {
        const list = createPlannerList({ label: 'Hint list' });
        const item = createPlannerItem({
            label: 'Hinted item',
            listId: list.id,
        });
        const store = createPlannerStore();
        store.getState().applySnapshot({ items: [item], lists: [list] });
        const commands = {
            archiveItem: vi.fn(),
            archiveList: vi.fn(),
            cancelLabelEdit: vi.fn(),
            completeLabelEdit: vi.fn(),
            createItem: vi.fn(),
            createList: vi.fn(),
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
            updatePreferences: vi.fn(),
        } satisfies PlannerCommands;
        const shortcut = ITEM_SELECTION_SHORTCUTS[0];
        if (!shortcut) throw new Error('The first item shortcut is missing.');
        const { container } = render(
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <ShortcutProvider>
                            <div style={{ margin: 60, width: 260 }}>
                                <ItemCard id={item.id} shortcut={shortcut} />
                            </div>
                        </ShortcutProvider>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );
        const card = container.querySelector<HTMLElement>('.planner-item-card');
        const hint = container.querySelector<HTMLElement>(
            '.planner-item-card-shortcut'
        );
        const icon = container.querySelector<HTMLElement>(
            '.planner-item-card-icon'
        );
        const keys = hint?.querySelectorAll<HTMLElement>(
            '.planner-keyboard-key'
        );
        if (!card || !hint || !icon || keys?.length !== 2) {
            throw new Error('The card shortcut fixture did not render.');
        }

        expect(hint).toHaveTextContent('⌘1');
        expect(card).toHaveAttribute('aria-keyshortcuts', 'Meta+1');
        expect(getComputedStyle(hint).opacity).toBe('0');
        expect(getComputedStyle(icon).opacity).toBe('1');

        fireEvent.keyDown(window, { key: 'Meta', metaKey: true });
        await waitFor(() => {
            expect(getComputedStyle(hint).opacity).toBe('1');
            expect(getComputedStyle(icon).opacity).toBe('0');
        });

        const cardBounds = card.getBoundingClientRect();
        const hintBounds = hint.getBoundingClientRect();
        const finalKeyBounds = keys[1]!.getBoundingClientRect();
        expect((hintBounds.top + hintBounds.bottom) / 2).toBeCloseTo(
            (cardBounds.top + cardBounds.bottom) / 2,
            1
        );
        expect(finalKeyBounds.right - cardBounds.right).toBeCloseTo(
            finalKeyBounds.width / 3,
            1
        );
    });
});
