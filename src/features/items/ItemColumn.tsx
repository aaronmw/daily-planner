import { useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePlannerCommands } from '../../core/application/plannerContext';
import {
    usePlannerSelector,
    usePlannerStoreApi,
} from '../../core/store/plannerContext';
import { ItemCard } from './ItemCard';
import { useListCapability } from '../collaboration/useListCapability';
import type { ItemId } from '../../core/domain/ids';
import { GhostButton } from '../shell/GhostButton';
import { isTextEntryTarget } from '../shell/isTextEntryTarget';
import { useItemListDropTarget } from './useItemListDropTarget';
import {
    ShortcutHint,
    useShortcut,
    useShortcuts,
} from '../shortcuts/ShortcutProvider';
import {
    CREATE_ITEM_SHORTCUT,
    ITEM_SELECTION_SHORTCUTS,
} from '../shortcuts/appShortcuts';

const EMPTY_ITEM_IDS: readonly ItemId[] = [];

type ItemColumnEntry =
    | { kind: 'create' }
    | { id: ItemId; kind: 'item' }
    | { id: ItemId; kind: 'drop-preview' };

interface ItemColumnProps {
    focusRequestId?: number;
    minuteHeight: number;
}

export function ItemColumn({
    focusRequestId = 0,
    minuteHeight,
}: ItemColumnProps) {
    const commands = usePlannerCommands();
    const store = usePlannerStoreApi();
    const selectedListId = usePlannerSelector(state => state.selectedListId);
    const selectedItemId = usePlannerSelector(state => state.selectedItemId);
    const selectedItemIds = usePlannerSelector(state =>
        selectedListId
            ? state.unscheduledItemIdsByListId.get(selectedListId)
            : undefined
    );
    const itemIds = selectedItemIds ?? EMPTY_ITEM_IDS;
    const relative = usePlannerSelector(
        state => state.preferences.relativeCardSizingEnabled
    );
    const canWrite = useListCapability(selectedListId, 'write');
    const parentRef = useRef<HTMLDivElement>(null);
    const dropPreviewRef = useRef<HTMLDivElement>(null);
    const focusFrameRef = useRef<number | null>(null);
    const fulfilledFocusRequestRef = useRef(0);
    const { activeItemId, insertion } = useItemListDropTarget({
        canWrite,
        containerRef: parentRef,
        itemIds,
        previewRef: dropPreviewRef,
        selectedListId,
    });
    const draggedItem = usePlannerSelector(state =>
        activeItemId ? (state.itemsById.get(activeItemId) ?? null) : null
    );
    const renderedItemIds =
        insertion && activeItemId
            ? itemIds.filter(id => id !== activeItemId)
            : itemIds;
    const entries: ItemColumnEntry[] = [
        { kind: 'create' },
        ...renderedItemIds.map(id => ({ id, kind: 'item' }) as const),
    ];
    if (insertion && draggedItem) {
        entries.splice(insertion.index + 1, 0, {
            id: draggedItem.id,
            kind: 'drop-preview',
        });
    }
    const virtualizer = useVirtualizer({
        count: entries.length,
        estimateSize: index => {
            const entry = entries[index];
            if (!relative) return entry?.kind === 'create' ? 72 : 64;
            const duration =
                entry?.kind === 'item'
                    ? (store.getState().itemsById.get(entry.id)
                          ?.durationMinutes ?? 30)
                    : entry?.kind === 'drop-preview'
                      ? (draggedItem?.durationMinutes ?? 30)
                      : 30;
            return duration * minuteHeight;
        },
        getItemKey: index => {
            const entry = entries[index];
            if (entry?.kind === 'create') return 'create-item';
            if (entry?.kind === 'drop-preview') return 'item-drop-preview';
            return entry?.id ?? index;
        },
        getScrollElement: () => parentRef.current,
        overscan: 6,
    });

    useEffect(
        () => virtualizer.measure(),
        [minuteHeight, relative, virtualizer]
    );

    const scheduleItemFocus = useCallback((itemId: ItemId) => {
        if (focusFrameRef.current !== null) {
            cancelAnimationFrame(focusFrameRef.current);
        }

        const focusWhenMounted = (attemptsRemaining: number) => {
            focusFrameRef.current = requestAnimationFrame(() => {
                const target = parentRef.current?.querySelector<HTMLElement>(
                    `[data-item-id="${itemId}"]`
                );
                if (target) {
                    focusFrameRef.current = null;
                    target.focus({ preventScroll: true });
                } else if (attemptsRemaining > 0) {
                    focusWhenMounted(attemptsRemaining - 1);
                } else {
                    focusFrameRef.current = null;
                }
            });
        };

        focusWhenMounted(3);
    }, []);

    const scheduleCreateItemFocus = useCallback(() => {
        if (focusFrameRef.current !== null) {
            cancelAnimationFrame(focusFrameRef.current);
        }

        const focusWhenMounted = (attemptsRemaining: number) => {
            focusFrameRef.current = requestAnimationFrame(() => {
                const target =
                    parentRef.current?.querySelector<HTMLElement>(
                        '[data-create-item]'
                    );
                if (target) {
                    focusFrameRef.current = null;
                    target.focus({ preventScroll: true });
                } else if (attemptsRemaining > 0) {
                    focusWhenMounted(attemptsRemaining - 1);
                } else {
                    focusFrameRef.current = null;
                }
            });
        };

        focusWhenMounted(3);
    }, []);

    const focusIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= itemIds.length) return;
            const itemId = itemIds[index];
            if (!itemId) return;
            commands.selectItem(itemId);
            virtualizer.scrollToIndex(index + 1, { align: 'auto' });
            scheduleItemFocus(itemId);
        },
        [commands, scheduleItemFocus, itemIds, virtualizer]
    );
    useShortcuts(
        ITEM_SELECTION_SHORTCUTS.map((shortcut, index) => ({
            enabled: index < itemIds.length,
            onTrigger: () => focusIndex(index),
            shortcut,
        }))
    );
    const createItemShortcutProps = useShortcut({
        enabled: canWrite,
        onTrigger: () => void commands.createItem(),
        shortcut: CREATE_ITEM_SHORTCUT,
    });

    useEffect(() => {
        if (
            focusRequestId === 0 ||
            focusRequestId === fulfilledFocusRequestRef.current
        ) {
            return;
        }

        fulfilledFocusRequestRef.current = focusRequestId;
        const selectedIndex = selectedItemId
            ? itemIds.indexOf(selectedItemId)
            : -1;
        if (selectedIndex >= 0) {
            focusIndex(selectedIndex);
            return;
        }

        virtualizer.scrollToIndex(0, { align: 'start' });
        scheduleCreateItemFocus();
    }, [
        focusIndex,
        focusRequestId,
        itemIds,
        scheduleCreateItemFocus,
        selectedItemId,
        virtualizer,
    ]);

    useEffect(() => {
        const listener = (event: globalThis.KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                isTextEntryTarget(event.target) ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey
            ) {
                return;
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                if (itemIds.length === 0) return;
                event.preventDefault();
                const current = selectedItemId
                    ? itemIds.indexOf(selectedItemId)
                    : -1;
                const next =
                    current < 0
                        ? event.key === 'ArrowDown'
                            ? 0
                            : itemIds.length - 1
                        : (current +
                              (event.key === 'ArrowDown' ? 1 : -1) +
                              itemIds.length) %
                          itemIds.length;
                focusIndex(next);
                return;
            }
        };
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, [focusIndex, selectedItemId, itemIds]);

    useEffect(
        () => () => {
            if (focusFrameRef.current !== null) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        },
        []
    );

    if (!selectedListId) {
        return (
            <div className="grid h-full place-items-center text-planner-text-faded">
                No active list
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-3" ref={parentRef}>
            <div
                className="relative w-full"
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualizer.getVirtualItems().map(item => {
                    const entry = entries[item.index];
                    if (!entry) return null;
                    const shortcutNumber =
                        entry.kind === 'item'
                            ? itemIds.indexOf(entry.id) + 1
                            : null;
                    const shortcut =
                        shortcutNumber !== null &&
                        shortcutNumber >= 1 &&
                        shortcutNumber <= 9
                            ? ITEM_SELECTION_SHORTCUTS[shortcutNumber - 1]
                            : undefined;
                    const previewItem =
                        entry.kind === 'drop-preview' ? draggedItem : null;
                    return (
                        <div
                            className="absolute left-0 top-0 w-full pb-[10px]"
                            data-item-list-row-id={
                                entry.kind === 'item' ? entry.id : undefined
                            }
                            data-index={item.index}
                            key={item.key}
                            ref={virtualizer.measureElement}
                            style={{ top: item.start }}
                        >
                            {entry.kind === 'create' ? (
                                <GhostButton
                                    {...createItemShortcutProps}
                                    className="w-full font-semibold transition-[height] duration-150"
                                    data-create-item
                                    disabled={!canWrite}
                                    onClick={() => void commands.createItem()}
                                    style={{
                                        height: relative
                                            ? 'calc(var(--planner-minute-height) * 30)'
                                            : 72,
                                    }}
                                >
                                    {canWrite ? (
                                        <>
                                            Create Item
                                            <ShortcutHint
                                                className="planner-create-item-shortcut"
                                                shortcut={CREATE_ITEM_SHORTCUT}
                                            />
                                        </>
                                    ) : (
                                        'Read only'
                                    )}
                                </GhostButton>
                            ) : entry.kind === 'item' ? (
                                <ItemCard
                                    id={entry.id}
                                    {...(shortcut ? { shortcut } : {})}
                                />
                            ) : previewItem ? (
                                <div
                                    aria-hidden="true"
                                    className="planner-item-list-drag-preview w-full"
                                    ref={dropPreviewRef}
                                    style={{
                                        height: relative
                                            ? `calc(var(--planner-minute-height) * ${previewItem.durationMinutes})`
                                            : 54,
                                    }}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
