import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { ListCard } from './ListCard';
import { nextGridIndex, type GridDirection } from './gridNavigation';
import { GhostButton } from '../shell/GhostButton';
import { isTextEntryTarget } from '../shell/isTextEntryTarget';

const GAP = 12;
const FIVE_COLUMN_WIDTH = 1100;

interface ListColumnProps {
    focusRequestId?: number;
}

export function ListColumn({ focusRequestId = 0 }: ListColumnProps) {
    const commands = usePlannerCommands();
    const listIds = usePlannerSelector(state => state.listIds);
    const selectedListId = usePlannerSelector(state => state.selectedListId);
    const parentRef = useRef<HTMLDivElement>(null);
    const focusFrameRef = useRef<number | null>(null);
    const fulfilledFocusRequestRef = useRef(0);
    const [width, setWidth] = useState(0);
    const columns = width >= FIVE_COLUMN_WIDTH ? 5 : 3;
    const items = useMemo(() => ['create' as const, ...listIds], [listIds]);
    const rows = Math.ceil(items.length / columns);
    const cardWidth = Math.max(160, (width - GAP * (columns + 1)) / columns);
    const rowHeight = cardWidth * 1.5 + GAP;
    const virtualizer = useVirtualizer({
        count: rows,
        estimateSize: () => rowHeight,
        getScrollElement: () => parentRef.current,
        overscan: 2,
    });

    useEffect(() => {
        const element = parentRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            setWidth(entries[0]?.contentRect.width ?? 0);
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => virtualizer.measure(), [columns, rowHeight, virtualizer]);

    const focusGridIndex = useCallback(
        (index: number) => {
            const item = items[index];
            if (!item) return;
            if (item !== 'create') commands.selectList(item);
            virtualizer.scrollToIndex(Math.floor(index / columns), {
                align: 'auto',
            });
            if (focusFrameRef.current !== null) {
                cancelAnimationFrame(focusFrameRef.current);
            }

            const focusWhenMounted = (attemptsRemaining: number) => {
                focusFrameRef.current = requestAnimationFrame(() => {
                    const target =
                        parentRef.current?.querySelector<HTMLElement>(
                            `[data-grid-index="${index}"]`
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
        },
        [columns, commands, items, virtualizer]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                isTextEntryTarget(event.target) ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey ||
                !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
                    event.key
                )
            ) {
                return;
            }
            const target =
                event.target instanceof HTMLElement
                    ? event.target.closest<HTMLElement>('[data-grid-index]')
                    : null;
            if (!target || event.target !== target) return;
            const index = Number(target.dataset.gridIndex);
            const direction = event.key
                .replace('Arrow', '')
                .toLowerCase() as GridDirection;
            const next = nextGridIndex({
                columns,
                count: items.length,
                direction,
                index,
            });
            event.preventDefault();
            event.stopPropagation();
            if (next === index) return;
            focusGridIndex(next);
        },
        [columns, focusGridIndex, items.length]
    );

    useEffect(() => {
        if (
            focusRequestId === 0 ||
            focusRequestId === fulfilledFocusRequestRef.current
        ) {
            return;
        }

        fulfilledFocusRequestRef.current = focusRequestId;
        const selectedIndex = selectedListId
            ? listIds.indexOf(selectedListId) + 1
            : 0;
        focusGridIndex(Math.max(0, selectedIndex));
    }, [focusGridIndex, focusRequestId, listIds, selectedListId]);

    useEffect(() => {
        const element = parentRef.current;
        if (!element) return;
        element.addEventListener('keydown', handleKeyDown);
        return () => element.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                isTextEntryTarget(event.target) ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey ||
                (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
                listIds.length === 0
            ) {
                return;
            }

            event.preventDefault();
            const current = selectedListId
                ? listIds.indexOf(selectedListId)
                : -1;
            const next =
                current < 0
                    ? event.key === 'ArrowRight'
                        ? 0
                        : listIds.length - 1
                    : (current +
                          (event.key === 'ArrowRight' ? 1 : -1) +
                          listIds.length) %
                      listIds.length;
            focusGridIndex(next + 1);
        };

        document.addEventListener('keydown', listener);
        return () => document.removeEventListener('keydown', listener);
    }, [focusGridIndex, listIds, selectedListId]);

    useEffect(
        () => () => {
            if (focusFrameRef.current !== null) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        },
        []
    );

    return (
        <div
            className="planner-list-grid @container/list-grid h-full overflow-auto p-3"
            ref={parentRef}
        >
            <div
                className="relative w-full"
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualizer.getVirtualItems().map(row => {
                    const start = row.index * columns;
                    return (
                        <div
                            className="planner-list-grid-row absolute left-0 top-0 grid w-full grid-cols-3 gap-3 @[1100px]/list-grid:grid-cols-5"
                            data-index={row.index}
                            key={row.key}
                            ref={virtualizer.measureElement}
                            style={{ transform: `translateY(${row.start}px)` }}
                        >
                            {items
                                .slice(start, start + columns)
                                .map((item, column) => {
                                    const index = start + column;
                                    if (item === 'create') {
                                        return (
                                            <GhostButton
                                                className="aspect-[2/3] min-w-0 font-semibold"
                                                data-grid-index={index}
                                                key="create-list"
                                                onClick={() => {
                                                    void commands.createList();
                                                }}
                                                tabIndex={
                                                    listIds.length === 0
                                                        ? 0
                                                        : -1
                                                }
                                            >
                                                Create List
                                            </GhostButton>
                                        );
                                    }
                                    return (
                                        <ListCard
                                            id={item}
                                            index={index}
                                            key={item}
                                        />
                                    );
                                })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
