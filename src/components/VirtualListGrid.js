import { useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useElementRect from '../hooks/useElementRect';
import { getListGridMetrics } from '../utils/virtualization';
import cx from '../utils/cx';

const GRID_COLUMNS = 3;
const GRID_GAP = 12.5;
const GRID_PADDING_INLINE = 25;

const VirtualListGrid = ({
    className,
    focusSelected = false,
    getItemKey,
    items,
    renderItem,
    selectedIndex = -1,
}) => {
    const scrollElementRef = useRef(null);
    const { width } = useElementRect(scrollElementRef);
    const { cardHeight, cardWidth } = getListGridMetrics(width, {
        gap: GRID_GAP,
        paddingInline: GRID_PADDING_INLINE,
    });
    const estimateSize = useCallback(
        () => cardHeight || 300,
        [cardHeight]
    );
    const virtualizer = useVirtualizer({
        count: items.length,
        estimateSize,
        gap: GRID_GAP,
        getItemKey: index => getItemKey(items[index]),
        getScrollElement: () => scrollElementRef.current,
        lanes: GRID_COLUMNS,
        overscan: 6,
        paddingEnd: 37.5,
        paddingStart: 25,
    });

    useEffect(() => {
        virtualizer.measure();
    }, [cardHeight, virtualizer]);

    useEffect(() => {
        if (!focusSelected || selectedIndex < 0) {
            return;
        }

        virtualizer.scrollToIndex(selectedIndex, { align: 'auto' });
        const frame = requestAnimationFrame(() => {
            scrollElementRef.current
                ?.querySelector(
                    `[data-index="${selectedIndex}"] [tabindex="0"]`
                )
                ?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [focusSelected, selectedIndex, virtualizer]);

    return (
        <div
            className={cx('planner-list-card-grid', className)}
            ref={scrollElementRef}
        >
            <div
                className="planner-virtual-canvas"
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
                            width: cardWidth || `calc((100% - 75px) / 3)`,
                        }}
                    >
                        {renderItem(items[virtualItem.index], virtualItem.index)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualListGrid;
