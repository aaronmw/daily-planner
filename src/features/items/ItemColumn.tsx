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

const EMPTY_ITEM_IDS: readonly ItemId[] = [];

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
    const focusFrameRef = useRef<number | null>(null);
    const fulfilledFocusRequestRef = useRef(0);
    const virtualizer = useVirtualizer({
        count: itemIds.length + 1,
        estimateSize: index => {
            if (!relative) return index === 0 ? 72 : 64;
            const itemId = itemIds[index - 1];
            const duration = itemId
                ? (store.getState().itemsById.get(itemId)?.durationMinutes ??
                  30)
                : 30;
            return duration * minuteHeight;
        },
        getItemKey: index =>
            index === 0 ? 'create-item' : (itemIds[index - 1] ?? index),
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
            if (/^[1-9]$/.test(event.key)) {
                const index = Number(event.key) - 1;
                if (index < itemIds.length) {
                    event.preventDefault();
                    focusIndex(index);
                }
                return;
            }
            if (event.key.toLowerCase() === 'n' && canWrite) {
                event.preventDefault();
                void commands.createItem();
                return;
            }
        };
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, [canWrite, commands, focusIndex, selectedItemId, itemIds]);

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
                    const itemId = itemIds[item.index - 1] ?? null;
                    return (
                        <div
                            className="absolute left-0 top-0 w-full pb-[10px]"
                            data-index={item.index}
                            key={item.key}
                            ref={virtualizer.measureElement}
                            style={{ transform: `translateY(${item.start}px)` }}
                        >
                            {item.index === 0 ? (
                                <GhostButton
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
                                    {canWrite ? 'Create Item' : 'Read only'}
                                </GhostButton>
                            ) : itemId ? (
                                <ItemCard
                                    id={itemId}
                                    {...(item.index <= 9
                                        ? { shortcut: item.index }
                                        : {})}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
