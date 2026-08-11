import { type CSSProperties } from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import {
    createPlannerList,
    createPlannerItem,
} from '../../core/domain/factories';
import type { ListId, ItemId } from '../../core/domain/ids';
import type { PlannerItem } from '../../core/domain/types';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { ItemDragProvider } from '../items/ItemDragProvider';
import { ListColumn } from '../lists/ListColumn';
import { ItemColumn } from '../items/ItemColumn';
import { ItemCard } from '../items/ItemCard';
import { TimelineColumn } from '../timeline/TimelineColumn';
import '../../styles/index.css';

const noop = () => undefined;

describe('planner collection scale in a real browser', () => {
    it('fits long labels inside duration-sized item cards', async () => {
        const list = createPlannerList({ label: 'Overflow list' });
        const item = createPlannerItem({
            label: 'Press [UP] or [DOWN] to select the previous and next unscheduled items in the active list',
            listId: list.id,
        });
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [item] });
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn(),
            selectItem: vi.fn(),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;
        const cardContainerStyle = {
            '--planner-minute-height': '1.15px',
            'width': 260,
        } as CSSProperties;

        const { container } = render(
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <div style={cardContainerStyle}>
                            <ItemCard id={item.id} shortcut={1} />
                        </div>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );

        const card = container.querySelector<HTMLElement>('.planner-item-card');
        const label = container.querySelector<HTMLElement>(
            '.planner-item-card-label'
        );
        if (!card || !label) throw new Error('The item card did not render.');

        const cardBounds = card.getBoundingClientRect();
        const labelBounds = label.getBoundingClientRect();
        expect(labelBounds.top).toBeGreaterThanOrEqual(cardBounds.top);
        expect(labelBounds.bottom).toBeLessThanOrEqual(cardBounds.bottom);
        await waitFor(() => {
            expect(label.scrollHeight).toBeLessThanOrEqual(
                label.clientHeight + 1
            );
        });
    });

    it('keeps timeline lines evenly spaced at compact scales', () => {
        const list = createPlannerList({ label: 'Timeline grid list' });
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [] });
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn(),
            selectItem: vi.fn(),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;
        const { container } = render(
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <ItemDragProvider>
                            <div style={{ height: 640, width: 320 }}>
                                <TimelineColumn minuteHeight={1.15} />
                            </div>
                        </ItemDragProvider>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );
        const lineCenter = (minute: number) => {
            const tick = container.querySelector<HTMLElement>(
                `[data-timeline-minute="${minute}"]`
            );
            const line = tick?.querySelector<HTMLElement>('span');
            if (!line) throw new Error(`Timeline line ${minute} is missing.`);
            const bounds = line.getBoundingClientRect();
            return (bounds.top + bounds.bottom) / 2;
        };

        const firstGap = lineCenter(210) - lineCenter(180);
        const secondGap = lineCenter(240) - lineCenter(210);
        expect(firstGap).toBeCloseTo(secondGap, 1);
    });

    it('keeps 3,000 lists and 10,000 items out of the DOM', async () => {
        const lists = Array.from({ length: 3_000 }, (_, index) =>
            createPlannerList({ label: `List ${index + 1}` })
        );
        const firstList = lists[0];
        if (!firstList) throw new Error('The scale fixture needs a list.');
        let afterOrderKey: string | null = null;
        const items: PlannerItem[] = [];
        for (let index = 0; index < 10_000; index += 1) {
            const item = createPlannerItem({
                afterOrderKey,
                label: `Item ${index + 1}`,
                listId: firstList.id,
            });
            afterOrderKey = item.orderKey;
            items.push(item);
        }
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists, items });
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn((id: ListId) =>
                store.getState().setSelection(id, null)
            ),
            selectItem: vi.fn((id: ItemId) => {
                const item = store.getState().itemsById.get(id);
                if (item) store.getState().setSelection(item.listId, id);
            }),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;

        const { container } = render(
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <ItemDragProvider>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    height: 640,
                                    width: 1400,
                                }}
                            >
                                <ListColumn />
                                <ItemColumn minuteHeight={1} />
                            </div>
                        </ItemDragProvider>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );

        await waitFor(() => {
            expect(
                container.querySelectorAll('[data-grid-index]').length
            ).toBeGreaterThan(0);
            expect(
                container.querySelectorAll('[data-item-id]').length
            ).toBeGreaterThan(0);
        });
        expect(
            container.querySelectorAll('[data-grid-index]').length
        ).toBeLessThan(50);
        expect(
            container.querySelectorAll('[data-item-id]').length
        ).toBeLessThan(50);
    });

    it('focuses the selected list when the list column receives a reveal request', async () => {
        const lists = [
            createPlannerList({ label: 'First list' }),
            createPlannerList({ label: 'Second list' }),
        ];
        const selectedList = lists[1];
        if (!selectedList) throw new Error('The focus fixture needs a list.');

        const store = createPlannerStore();
        store.getState().applySnapshot({ lists, items: [] });
        store.getState().setSelection(selectedList.id, null);
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn((id: ListId) =>
                store.getState().setSelection(id, null)
            ),
            selectItem: vi.fn(),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;

        const renderColumn = (focusRequestId: number) => (
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <button data-testid="outside-focus">Outside</button>
                        <div style={{ height: 640, width: 900 }}>
                            <ListColumn focusRequestId={focusRequestId} />
                        </div>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );
        const view = render(renderColumn(0));

        const outside = view.getByTestId('outside-focus');
        outside.focus();
        expect(document.activeElement).toBe(outside);

        view.rerender(renderColumn(1));

        await waitFor(() => {
            expect(document.activeElement).toHaveAttribute(
                'aria-label',
                'Open Second list'
            );
        });
    });

    it('focuses the selected item when the items column receives a reveal request', async () => {
        const list = createPlannerList({ label: 'Focus list' });
        const item = createPlannerItem({
            label: 'Selected item',
            listId: list.id,
        });
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [item] });
        store.getState().setSelection(list.id, item.id);
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn(),
            selectItem: vi.fn((id: ItemId) => {
                const selected = store.getState().itemsById.get(id);
                if (selected) {
                    store.getState().setSelection(selected.listId, id);
                }
            }),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;

        const renderColumn = (focusRequestId: number) => (
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <ItemDragProvider>
                            <button data-testid="outside-item-focus">
                                Outside
                            </button>
                            <div style={{ height: 640, width: 500 }}>
                                <ItemColumn
                                    focusRequestId={focusRequestId}
                                    minuteHeight={1}
                                />
                            </div>
                        </ItemDragProvider>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );
        const view = render(renderColumn(0));
        const outside = view.getByTestId('outside-item-focus');
        outside.focus();

        view.rerender(renderColumn(1));

        await waitFor(() => {
            expect(document.activeElement).toHaveAttribute(
                'aria-label',
                'Selected item'
            );
        });
    });

    it('focuses the timeline surface when the timeline column receives a reveal request', async () => {
        const list = createPlannerList({ label: 'Timeline list' });
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [] });
        store.getState().setSelection(list.id, null);
        const commands = {
            archiveList: vi.fn(),
            archiveItem: vi.fn(),
            cancelLabelEdit: noop,
            completeLabelEdit: noop,
            createList: vi.fn(),
            createItem: vi.fn(),
            deleteList: vi.fn(),
            deleteItem: vi.fn(),
            fulfillLabelEdit: noop,
            hydrate: vi.fn(),
            moveItem: vi.fn(),
            returnItemToList: vi.fn(),
            restoreList: vi.fn(),
            restoreItem: vi.fn(),
            selectList: vi.fn(),
            selectItem: vi.fn(),
            updateList: vi.fn(),
            updatePreferences: vi.fn(),
            updateItem: vi.fn(),
            updateItemWith: vi.fn(),
        } satisfies PlannerCommands;

        const renderColumn = (focusRequestId: number) => (
            <PlannerStoreProvider store={store}>
                <CollaborationProvider>
                    <PlannerCommandsProvider commands={commands}>
                        <ItemDragProvider>
                            <button data-testid="outside-timeline-focus">
                                Outside
                            </button>
                            <div style={{ height: 640, width: 500 }}>
                                <TimelineColumn
                                    focusRequestId={focusRequestId}
                                    minuteHeight={1}
                                />
                            </div>
                        </ItemDragProvider>
                    </PlannerCommandsProvider>
                </CollaborationProvider>
            </PlannerStoreProvider>
        );
        const view = render(renderColumn(0));
        const outside = view.getByTestId('outside-timeline-focus');
        outside.focus();

        view.rerender(renderColumn(1));

        await waitFor(() => {
            expect(document.activeElement).toHaveAttribute(
                'aria-label',
                'Timeline schedule'
            );
        });
    });
});
