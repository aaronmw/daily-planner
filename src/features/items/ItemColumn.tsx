import { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { type Virtualizer, useVirtualizer } from '@tanstack/react-virtual';
import { usePlannerCommands } from '../../core/application/plannerContext';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import {
    usePlannerSelector,
    usePlannerStoreApi,
} from '../../core/store/plannerContext';
import { ItemCard } from './ItemCard';
import { useListCapability } from '../collaboration/useListCapability';
import type { ItemId, ListId } from '../../core/domain/ids';
import { effectiveItemDurationMinutes } from '../../core/domain/itemDuration';
import { GhostButton } from '../shell/GhostButton';
import { useItemListDropTarget } from './useItemListDropTarget';
import { ShortcutHint, useShortcuts } from '../shortcuts/ShortcutProvider';
import { isTextEntryTarget } from '../shell/isTextEntryTarget';
import {
    APP_SHORTCUT_IDS,
    getConfigurableShortcutCommand,
    shortcutDefinitionsFor,
} from '../../core/application/shortcutCommands';

const EMPTY_ITEM_IDS: readonly ItemId[] = [];

interface UseItemReorderOptions {
    canWrite: boolean;
    commands: PlannerCommands;
    focusItem: (itemId: ItemId) => void;
    itemIds: readonly ItemId[];
    listId: ListId | null;
    virtualizer: Virtualizer<HTMLDivElement, Element>;
}

function useItemReorder({
    canWrite,
    commands,
    focusItem,
    itemIds,
    listId,
    virtualizer,
}: UseItemReorderOptions) {
    const pendingRef = useRef(false);

    return useCallback(
        async (itemId: ItemId, direction: 'next' | 'previous') => {
            if (pendingRef.current || !listId || !canWrite) return;

            const currentIndex = itemIds.indexOf(itemId);
            const targetIndex =
                direction === 'next' ? currentIndex + 1 : currentIndex - 1;
            if (
                currentIndex < 0 ||
                targetIndex < 0 ||
                targetIndex >= itemIds.length
            ) {
                return;
            }

            const previousId =
                direction === 'next'
                    ? (itemIds[currentIndex + 1] ?? null)
                    : (itemIds[currentIndex - 2] ?? null);
            const nextId =
                direction === 'next'
                    ? (itemIds[currentIndex + 2] ?? null)
                    : (itemIds[currentIndex - 1] ?? null);

            pendingRef.current = true;
            try {
                await commands.moveItem(itemId, listId, previousId, nextId);
                virtualizer.scrollToIndex(targetIndex + 1, { align: 'auto' });
                focusItem(itemId);
            } finally {
                pendingRef.current = false;
            }
        },
        [canWrite, commands, focusItem, itemIds, listId, virtualizer]
    );
}

type ItemColumnEntry =
    | { kind: 'create' }
    | { id: ItemId; kind: 'item' }
    | { id: ItemId; kind: 'drop-preview' };

interface ItemColumnProps {
    focusRequestId?: number;
    isActive?: boolean;
    minuteHeight: number;
}

export function ItemColumn({
    focusRequestId = 0,
    isActive = true,
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
    const appShortcuts = usePlannerSelector(
        state => state.preferences.appShortcuts
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
            return effectiveItemDurationMinutes(duration) * minuteHeight;
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
    const reorderItem = useItemReorder({
        canWrite,
        commands,
        focusItem: scheduleItemFocus,
        itemIds,
        listId: selectedListId,
        virtualizer,
    });
    const handleDocumentArrowNavigation = useEffectEvent(
        (event: KeyboardEvent) => {
            if (
                !isActive ||
                event.defaultPrevented ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey ||
                (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') ||
                isTextEntryTarget(event.target) ||
                itemIds.length === 0
            ) {
                return;
            }

            const target =
                event.target instanceof Element ? event.target : null;
            if (
                target?.closest(
                    'button:not(.planner-item-card), a[href], input, select, textarea, [contenteditable="true"], [role="button"]:not(.planner-item-card)'
                )
            ) {
                return;
            }

            const currentIndex = selectedItemId
                ? itemIds.indexOf(selectedItemId)
                : -1;
            const nextIndex =
                currentIndex < 0
                    ? event.key === 'ArrowDown'
                        ? 0
                        : itemIds.length - 1
                    : (currentIndex +
                          (event.key === 'ArrowDown' ? 1 : -1) +
                          itemIds.length) %
                      itemIds.length;

            event.preventDefault();
            focusIndex(nextIndex);
        }
    );

    useEffect(() => {
        const listener = (event: KeyboardEvent) =>
            handleDocumentArrowNavigation(event);
        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, []);
    const selectItemsCommand = getConfigurableShortcutCommand(
        `app:${APP_SHORTCUT_IDS.selectItems}`
    );
    const itemSelectionShortcuts = selectItemsCommand
        ? shortcutDefinitionsFor(
              selectItemsCommand,
              appShortcuts[APP_SHORTCUT_IDS.selectItems]
          )
        : [];
    useShortcuts(
        itemSelectionShortcuts.map((shortcut, index) => ({
            enabled: index < itemIds.length,
            onTrigger: () => focusIndex(index),
            shortcut,
        }))
    );
    const createItemCommand = getConfigurableShortcutCommand(
        `app:${APP_SHORTCUT_IDS.createItem}`
    );
    const createItemShortcut = createItemCommand
        ? shortcutDefinitionsFor(
              createItemCommand,
              appShortcuts[APP_SHORTCUT_IDS.createItem]
          )[0]
        : undefined;
    const [createItemShortcutProps = {}] = useShortcuts(
        createItemShortcut
            ? [
                  {
                      enabled: canWrite,
                      onTrigger: () => void commands.createItem(),
                      shortcut: createItemShortcut,
                  },
              ]
            : []
    );
    const reorderItemsCommand = getConfigurableShortcutCommand(
        `app:${APP_SHORTCUT_IDS.reorderItems}`
    );
    const reorderItemShortcuts = reorderItemsCommand
        ? shortcutDefinitionsFor(
              reorderItemsCommand,
              appShortcuts[APP_SHORTCUT_IDS.reorderItems]
          )
        : [];

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
            <div className="grid h-full place-items-center bg-planner-shaded text-planner-text-faded">
                No active list
            </div>
        );
    }

    return (
        <div
            className="h-full overflow-auto bg-planner-shaded p-3"
            ref={parentRef}
        >
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
                            ? itemSelectionShortcuts[shortcutNumber - 1]
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
                                            {createItemShortcut && (
                                                <ShortcutHint
                                                    className="planner-create-item-shortcut"
                                                    shortcut={
                                                        createItemShortcut
                                                    }
                                                />
                                            )}
                                        </>
                                    ) : (
                                        'Read only'
                                    )}
                                </GhostButton>
                            ) : entry.kind === 'item' ? (
                                <ItemCard
                                    id={entry.id}
                                    {...(isActive
                                        ? {
                                              onNavigate: (
                                                  direction: 'next' | 'previous'
                                              ) => {
                                                  const current =
                                                      itemIds.indexOf(entry.id);
                                                  if (current < 0) return;
                                                  const offset =
                                                      direction === 'next'
                                                          ? 1
                                                          : -1;
                                                  focusIndex(
                                                      (current +
                                                          offset +
                                                          itemIds.length) %
                                                          itemIds.length
                                                  );
                                              },
                                          }
                                        : {})}
                                    {...(isActive &&
                                    canWrite &&
                                    entry.id === selectedItemId
                                        ? {
                                              onReorder: (
                                                  direction: 'next' | 'previous'
                                              ) =>
                                                  reorderItem(
                                                      entry.id,
                                                      direction
                                                  ),
                                              reorderShortcuts:
                                                  reorderItemShortcuts,
                                          }
                                        : {})}
                                    {...(shortcut ? { shortcut } : {})}
                                />
                            ) : previewItem ? (
                                <div
                                    aria-hidden="true"
                                    className="planner-item-list-drag-preview w-full"
                                    ref={dropPreviewRef}
                                    style={{
                                        height: relative
                                            ? `calc(var(--planner-minute-height) * ${effectiveItemDurationMinutes(previewItem.durationMinutes)})`
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
