import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    getGridNavigationTargetIndex,
    isGridNavigationEvent,
    isPlainGridNavigationKeyEvent,
} from '../utils/gridNavigation';
import { getListGridMetrics } from '../utils/virtualization';
import cx from '../utils/cx';

const GRID_COLUMNS_DEFAULT = 3;
const GRID_GAP = 12.5;
const GRID_PADDING_INLINE = 25;

const VirtualListGrid = ({
    className,
    focusSelected = false,
    getItemKey,
    items,
    onNavigateItem,
    renderItem,
    selectedIndex = -1,
}) => {
    const scrollElementRef = useRef(null);
    const layoutElementRef = useRef(null);
    const navigationFocusFrameRef = useRef(null);
    const pendingNavigationIndexRef = useRef(null);
    const [{ columns, width }, setLayout] = useState({
        columns: GRID_COLUMNS_DEFAULT,
        width: 0,
    });

    useEffect(() => {
        const scrollElement = scrollElementRef.current;

        if (!scrollElement) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            const layoutElement = layoutElementRef.current;

            if (!layoutElement) {
                return;
            }

            const resolvedColumns = Number.parseInt(
                window
                    .getComputedStyle(layoutElement)
                    .getPropertyValue('--planner-list-grid-columns'),
                10
            );
            const nextLayout = {
                columns: Number.isFinite(resolvedColumns)
                    ? resolvedColumns
                    : GRID_COLUMNS_DEFAULT,
                width: entry.contentRect.width,
            };

            setLayout(currentLayout =>
                currentLayout.columns === nextLayout.columns &&
                currentLayout.width === nextLayout.width
                    ? currentLayout
                    : nextLayout
            );
        });

        observer.observe(scrollElement);

        return () => observer.disconnect();
    }, []);

    const { cardHeight, cardWidth } = getListGridMetrics(width, {
        columns,
        gap: GRID_GAP,
        paddingInline: GRID_PADDING_INLINE,
    });
    const estimateSize = useCallback(() => cardHeight || 300, [cardHeight]);
    const virtualizer = useVirtualizer({
        count: items.length,
        estimateSize,
        gap: GRID_GAP,
        getItemKey: index => getItemKey(items[index]),
        getScrollElement: () => scrollElementRef.current,
        lanes: columns,
        overscan: 6,
        paddingEnd: 37.5,
        paddingStart: 25,
    });

    useEffect(() => {
        virtualizer.measure();
    }, [cardHeight, columns, virtualizer]);

    const scheduleItemFocus = useCallback(
        itemIndex => {
            if (navigationFocusFrameRef.current !== null) {
                cancelAnimationFrame(navigationFocusFrameRef.current);
            }

            pendingNavigationIndexRef.current = itemIndex;
            virtualizer.scrollToIndex(itemIndex, { align: 'auto' });

            const focusItem = attemptsRemaining => {
                navigationFocusFrameRef.current = requestAnimationFrame(() => {
                    const navigationTarget = scrollElementRef.current
                        ?.querySelector(
                            `[data-index="${itemIndex}"] [data-grid-navigation-target]`
                        );

                    if (navigationTarget) {
                        navigationTarget.focus({ preventScroll: true });
                        navigationFocusFrameRef.current = null;
                        pendingNavigationIndexRef.current = null;
                        return;
                    }

                    if (attemptsRemaining > 0) {
                        focusItem(attemptsRemaining - 1);
                        return;
                    }

                    navigationFocusFrameRef.current = null;
                    pendingNavigationIndexRef.current = null;
                });
            };

            focusItem(2);
        },
        [virtualizer]
    );

    useEffect(
        () => () => {
            if (navigationFocusFrameRef.current !== null) {
                cancelAnimationFrame(navigationFocusFrameRef.current);
            }
        },
        []
    );

    useEffect(() => {
        if (!focusSelected || selectedIndex < 0) {
            return;
        }

        scheduleItemFocus(selectedIndex);
    }, [focusSelected, scheduleItemFocus, selectedIndex]);

    const handleKeyDown = useCallback(
        evt => {
            if (!onNavigateItem || !(evt.target instanceof Element)) {
                return;
            }

            const virtualItemElement = evt.target.closest('[data-index]');
            const navigationTarget = virtualItemElement?.querySelector(
                '[data-grid-navigation-target]'
            );

            if (!isPlainGridNavigationKeyEvent(evt)) {
                return;
            }

            evt.stopPropagation();
            evt.nativeEvent.stopImmediatePropagation();

            if (!isGridNavigationEvent(evt, navigationTarget)) {
                return;
            }

            evt.preventDefault();

            const renderedIndex = Number.parseInt(
                virtualItemElement.dataset.index,
                10
            );
            const currentIndex = Number.isFinite(
                pendingNavigationIndexRef.current
            )
                ? pendingNavigationIndexRef.current
                : renderedIndex;
            const targetIndex = getGridNavigationTargetIndex({
                columnCount: columns,
                currentIndex,
                direction: evt.key,
                itemCount: items.length,
            });

            if (targetIndex === null) {
                return;
            }

            scheduleItemFocus(targetIndex);
            onNavigateItem(items[targetIndex], targetIndex);
        },
        [columns, items, onNavigateItem, scheduleItemFocus]
    );

    return (
        <div
            className={cx(
                '@container/list-grid planner-list-card-grid',
                className
            )}
            onKeyDown={handleKeyDown}
            ref={scrollElementRef}
        >
            <div
                className="planner-virtual-canvas [--planner-list-grid-columns:3] @[950px]/list-grid:[--planner-list-grid-columns:5]"
                data-columns={columns}
                ref={layoutElementRef}
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualizer.getVirtualItems().map(virtualItem => (
                    <div
                        key={virtualItem.key}
                        className="planner-virtual-grid-item"
                        data-index={virtualItem.index}
                        style={{
                            height: cardHeight || 300,
                            left:
                                GRID_PADDING_INLINE +
                                virtualItem.lane * (cardWidth + GRID_GAP),
                            transform: `translateY(${virtualItem.start}px)`,
                            width:
                                cardWidth ||
                                `calc((100% - ${
                                    GRID_PADDING_INLINE * 2 +
                                    GRID_GAP * (columns - 1)
                                }px) / ${columns})`,
                        }}
                    >
                        {renderItem(
                            items[virtualItem.index],
                            virtualItem.index
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualListGrid;
