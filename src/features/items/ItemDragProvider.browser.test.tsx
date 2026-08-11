import { useMemo, useRef } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import type { ItemId, ListId } from '../../core/domain/ids';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import {
    ItemDragProvider,
    useItemDragState,
    useItemDropTarget,
} from './ItemDragProvider';
import {
    isElementHitAtPoint,
    type ItemDropPreview,
    type ItemDropTarget,
} from './itemDropTargets';
import { useItemListDropTarget } from './useItemListDropTarget';
import '../../styles/index.css';

afterEach(() => {
    cleanup();
    document.querySelectorAll('[data-test-drop-occluder]').forEach(element => {
        element.remove();
    });
});

const dispatchPointer = (
    target: EventTarget,
    type: 'pointerdown' | 'pointermove' | 'pointerup',
    clientX: number,
    clientY: number
) => {
    target.dispatchEvent(
        new PointerEvent(type, {
            bubbles: true,
            button: 0,
            cancelable: true,
            clientX,
            clientY,
            isPrimary: true,
            pointerId: 7,
        })
    );
};

const createTestCommands = (): PlannerCommands => ({
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
});

function TestDropTarget({
    minute,
    onCommit,
}: {
    minute: number;
    onCommit: (itemId: ItemId, preview: ItemDropPreview) => void;
}) {
    const targetRef = useRef<HTMLDivElement>(null);
    const target = useMemo<ItemDropTarget>(
        () => ({
            commit: onCommit,
            getPreviewBounds: preview =>
                preview.kind === 'timeline'
                    ? (targetRef.current?.getBoundingClientRect() ?? null)
                    : null,
            id: 'test-target',
            resolve: pointer => {
                const element = targetRef.current;
                return element &&
                    isElementHitAtPoint(
                        element,
                        pointer.clientX,
                        pointer.clientY
                    )
                    ? { kind: 'timeline', minute }
                    : null;
            },
        }),
        [minute, onCommit]
    );
    useItemDropTarget(target);
    const { activeDrop } = useItemDragState();

    return (
        <div
            data-preview-minute={
                activeDrop?.targetId === 'test-target' &&
                activeDrop.preview.kind === 'timeline'
                    ? activeDrop.preview.minute
                    : undefined
            }
            data-testid="registered-drop-target"
            ref={targetRef}
            style={{ height: 160, width: 240 }}
        />
    );
}

function PaddedItemListTarget({
    itemId,
    listId,
}: {
    itemId: ItemId;
    listId: ListId;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const itemIds = useMemo(() => [itemId], [itemId]);
    const { insertion } = useItemListDropTarget({
        canWrite: true,
        containerRef,
        itemIds,
        previewRef,
        selectedListId: listId,
    });

    return (
        <div
            data-insertion-index={insertion?.index}
            data-insertion-next-id={insertion?.nextId ?? undefined}
            data-insertion-previous-id={insertion?.previousId ?? undefined}
            data-testid="padded-items-target"
            ref={containerRef}
            style={{ height: 160, overflow: 'auto', padding: 12, width: 240 }}
        >
            <div style={{ position: 'relative' }}>
                <div
                    data-item-list-row-id={itemId}
                    data-testid="padded-item-row"
                    style={{ height: 60 }}
                >
                    Existing item
                </div>
                {insertion && (
                    <div
                        data-testid="padded-item-preview"
                        ref={previewRef}
                        style={{ height: 54 }}
                    />
                )}
            </div>
        </div>
    );
}

describe('item drag behavior in a real browser', () => {
    it('rejects a drop target hidden behind another surface', () => {
        const { getByTestId } = render(
            <div style={{ height: 160, position: 'relative', width: 240 }}>
                <div
                    data-testid="drop-target"
                    style={{ inset: 0, position: 'absolute' }}
                />
                <div
                    data-testid="occluding-surface"
                    style={{ inset: 0, position: 'absolute' }}
                />
            </div>
        );
        const target = getByTestId('drop-target');
        const occluder = getByTestId('occluding-surface');
        const bounds = target.getBoundingClientRect();
        const clientX = bounds.left + bounds.width / 2;
        const clientY = bounds.top + bounds.height / 2;

        expect(isElementHitAtPoint(target, clientX, clientY)).toBe(false);

        occluder.style.display = 'none';
        expect(isElementHitAtPoint(target, clientX, clientY)).toBe(true);

        target.style.pointerEvents = 'none';
        expect(isElementHitAtPoint(target, clientX, clientY)).toBe(false);
    });

    it('keeps an active drag alive across item-map updates', async () => {
        const list = createPlannerList({ label: 'Drag source' });
        const item = {
            ...createPlannerItem({ listId: list.id }),
            scheduledStartMinutes: 480,
        };
        const store = createPlannerStore();
        store.getState().applySnapshot({ items: [item], lists: [list] });
        const commit = vi.fn();
        const { getByTestId } = render(
            <PlannerStoreProvider store={store}>
                <ItemDragProvider>
                    <div style={{ display: 'flex', gap: 80 }}>
                        <button
                            data-draggable="true"
                            data-item-id={item.id}
                            data-testid="drag-source"
                            style={{ height: 60, width: 160 }}
                            type="button"
                        >
                            Drag me
                        </button>
                        <TestDropTarget minute={540} onCommit={commit} />
                    </div>
                </ItemDragProvider>
            </PlannerStoreProvider>
        );
        const source = getByTestId('drag-source');
        const target = getByTestId('registered-drop-target');
        const sourceBounds = source.getBoundingClientRect();
        const targetBounds = target.getBoundingClientRect();
        const sourceX = sourceBounds.left + sourceBounds.width / 2;
        const sourceY = sourceBounds.top + sourceBounds.height / 2;
        const targetX = targetBounds.left + targetBounds.width / 2;
        const targetY = targetBounds.top + targetBounds.height / 2;

        act(() => {
            dispatchPointer(source, 'pointerdown', sourceX, sourceY);
            dispatchPointer(document, 'pointermove', targetX, targetY);
        });
        await waitFor(() => {
            expect(target).toHaveAttribute('data-preview-minute', '540');
        });
        expect(
            document.querySelector('[data-pointer-drag-ghost="true"]')
        ).not.toBeNull();

        act(() => {
            store.getState().upsertItem({
                ...item,
                label: 'Updated while dragging',
            });
        });

        expect(
            document.querySelector('[data-pointer-drag-ghost="true"]')
        ).not.toBeNull();
        expect(document.documentElement).toHaveAttribute(
            'data-item-dragging',
            'true'
        );

        act(() => {
            dispatchPointer(document, 'pointerup', targetX, targetY);
        });
        await waitFor(() => {
            expect(commit).toHaveBeenCalledWith(item.id, {
                kind: 'timeline',
                minute: 540,
            });
        });
    });

    it('invalidates the visible preview when its target is replaced', async () => {
        const list = createPlannerList({ label: 'Replacement source' });
        const item = {
            ...createPlannerItem({ listId: list.id }),
            scheduledStartMinutes: 480,
        };
        const store = createPlannerStore();
        store.getState().applySnapshot({ items: [item], lists: [list] });
        const commit = vi.fn();
        const renderHarness = (minute: number) => (
            <PlannerStoreProvider store={store}>
                <ItemDragProvider>
                    <div style={{ display: 'flex', gap: 80 }}>
                        <button
                            data-draggable="true"
                            data-item-id={item.id}
                            data-testid="replacement-drag-source"
                            style={{ height: 60, width: 160 }}
                            type="button"
                        >
                            Drag me
                        </button>
                        <TestDropTarget minute={minute} onCommit={commit} />
                    </div>
                </ItemDragProvider>
            </PlannerStoreProvider>
        );
        const view = render(renderHarness(540));
        const source = view.getByTestId('replacement-drag-source');
        const target = view.getByTestId('registered-drop-target');
        const sourceBounds = source.getBoundingClientRect();
        const targetBounds = target.getBoundingClientRect();
        const sourceX = sourceBounds.left + sourceBounds.width / 2;
        const sourceY = sourceBounds.top + sourceBounds.height / 2;
        const targetX = targetBounds.left + targetBounds.width / 2;
        const targetY = targetBounds.top + targetBounds.height / 2;

        act(() => {
            dispatchPointer(source, 'pointerdown', sourceX, sourceY);
            dispatchPointer(document, 'pointermove', targetX, targetY);
        });
        await waitFor(() => {
            expect(target).toHaveAttribute('data-preview-minute', '540');
        });

        view.rerender(renderHarness(600));

        await waitFor(() => {
            expect(target).not.toHaveAttribute('data-preview-minute');
        });
        act(() => {
            dispatchPointer(document, 'pointerup', targetX, targetY);
        });
        expect(commit).not.toHaveBeenCalled();
    });

    it('does not commit when the preview becomes occluded before release', async () => {
        const list = createPlannerList({ label: 'Occlusion source' });
        const item = {
            ...createPlannerItem({ listId: list.id }),
            scheduledStartMinutes: 480,
        };
        const store = createPlannerStore();
        store.getState().applySnapshot({ items: [item], lists: [list] });
        const commit = vi.fn();
        const { getByTestId } = render(
            <PlannerStoreProvider store={store}>
                <ItemDragProvider>
                    <div style={{ display: 'flex', gap: 80 }}>
                        <button
                            data-draggable="true"
                            data-item-id={item.id}
                            data-testid="occlusion-drag-source"
                            style={{ height: 60, width: 160 }}
                            type="button"
                        >
                            Drag me
                        </button>
                        <TestDropTarget minute={540} onCommit={commit} />
                    </div>
                </ItemDragProvider>
            </PlannerStoreProvider>
        );
        const source = getByTestId('occlusion-drag-source');
        const target = getByTestId('registered-drop-target');
        const sourceBounds = source.getBoundingClientRect();
        const targetBounds = target.getBoundingClientRect();
        const sourceX = sourceBounds.left + sourceBounds.width / 2;
        const sourceY = sourceBounds.top + sourceBounds.height / 2;
        const targetX = targetBounds.left + targetBounds.width / 2;
        const targetY = targetBounds.top + targetBounds.height / 2;

        act(() => {
            dispatchPointer(source, 'pointerdown', sourceX, sourceY);
            dispatchPointer(document, 'pointermove', targetX, targetY);
        });
        await waitFor(() => {
            expect(target).toHaveAttribute('data-preview-minute', '540');
        });

        const occluder = document.createElement('div');
        occluder.dataset.testDropOccluder = 'true';
        Object.assign(occluder.style, {
            height: `${targetBounds.height}px`,
            left: `${targetBounds.left}px`,
            position: 'fixed',
            top: `${targetBounds.top}px`,
            width: `${targetBounds.width}px`,
            zIndex: '10000',
        });
        document.body.append(occluder);

        act(() => {
            dispatchPointer(document, 'pointerup', targetX, targetY);
        });
        expect(commit).not.toHaveBeenCalled();
    });

    it('commits the neighbour pair rendered from padded row geometry', async () => {
        const sourceList = createPlannerList({ label: 'Drag source' });
        const destinationList = createPlannerList({
            label: 'Padded destination',
        });
        const existing = createPlannerItem({ listId: destinationList.id });
        const scheduled = {
            ...createPlannerItem({ listId: sourceList.id }),
            scheduledStartMinutes: 480,
        };
        const store = createPlannerStore();
        store.getState().applySnapshot({
            items: [existing, scheduled],
            lists: [sourceList, destinationList],
        });
        store.getState().setSelection(destinationList.id, null);
        const returnItemToList = vi.fn();
        const commands = {
            ...createTestCommands(),
            returnItemToList,
        };
        const { getByTestId } = render(
            <PlannerStoreProvider store={store}>
                <PlannerCommandsProvider commands={commands}>
                    <ItemDragProvider>
                        <div style={{ display: 'flex', gap: 80 }}>
                            <button
                                data-draggable="true"
                                data-item-id={scheduled.id}
                                data-testid="padded-drag-source"
                                style={{ height: 60, width: 160 }}
                                type="button"
                            >
                                Drag me
                            </button>
                            <PaddedItemListTarget
                                itemId={existing.id}
                                listId={destinationList.id}
                            />
                        </div>
                    </ItemDragProvider>
                </PlannerCommandsProvider>
            </PlannerStoreProvider>
        );
        const source = getByTestId('padded-drag-source');
        const target = getByTestId('padded-items-target');
        const row = getByTestId('padded-item-row');
        const sourceBounds = source.getBoundingClientRect();
        const rowBounds = row.getBoundingClientRect();
        const sourceX = sourceBounds.left + sourceBounds.width / 2;
        const sourceY = sourceBounds.top + sourceBounds.height / 2;
        const targetX = rowBounds.left + rowBounds.width / 2;
        const justAboveVisualMidpoint =
            rowBounds.top + rowBounds.height / 2 - 1;

        act(() => {
            dispatchPointer(source, 'pointerdown', sourceX, sourceY);
            dispatchPointer(
                document,
                'pointermove',
                targetX,
                justAboveVisualMidpoint
            );
        });

        await waitFor(() => {
            expect(target).toHaveAttribute('data-insertion-index', '0');
        });
        expect(target).not.toHaveAttribute('data-insertion-previous-id');
        expect(target).toHaveAttribute('data-insertion-next-id', existing.id);
        expect(returnItemToList).not.toHaveBeenCalled();

        act(() => {
            dispatchPointer(
                document,
                'pointerup',
                targetX,
                justAboveVisualMidpoint
            );
        });
        await waitFor(() => {
            expect(returnItemToList).toHaveBeenCalledWith(
                scheduled.id,
                destinationList.id,
                null,
                existing.id
            );
        });
        expect(returnItemToList).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(target).not.toHaveAttribute('data-insertion-index');
        });
        expect(source).not.toHaveAttribute('data-pointer-dragging');
        expect(document.documentElement).not.toHaveAttribute(
            'data-item-dragging'
        );
        expect(
            document.querySelector('[data-pointer-drag-ghost="true"]')
        ).toBeNull();

        act(() => {
            dispatchPointer(
                document,
                'pointerup',
                targetX,
                justAboveVisualMidpoint
            );
        });
        expect(returnItemToList).toHaveBeenCalledTimes(1);
    });
});
