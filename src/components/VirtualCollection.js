import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import cx from '../utils/cx';

const VirtualCollection = ({
    className,
    estimateSize,
    focusSelected = false,
    gap = 12.5,
    getItemKey,
    items,
    overscan = 6,
    paddingEnd = 37.5,
    paddingStart = 25,
    renderItem,
    scrollElementRef: providedScrollElementRef,
    selectedIndex = -1,
}) => {
    const internalScrollElementRef = useRef(null);
    const scrollElementRef =
        providedScrollElementRef || internalScrollElementRef;
    const virtualizer = useVirtualizer({
        count: items.length,
        estimateSize,
        gap,
        getItemKey: index => getItemKey(items[index]),
        getScrollElement: () => scrollElementRef.current,
        overscan,
        paddingEnd,
        paddingStart,
        useAnimationFrameWithResizeObserver: true,
    });

    useEffect(() => {
        virtualizer.measure();
    }, [estimateSize, virtualizer]);

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
    }, [focusSelected, scrollElementRef, selectedIndex, virtualizer]);

    return (
        <div
            className={cx('planner-virtual-scroll', className)}
            ref={scrollElementRef}
        >
            <div
                className="planner-virtual-canvas"
                style={{ height: virtualizer.getTotalSize() }}
            >
                {virtualizer.getVirtualItems().map(virtualItem => (
                    <div
                        key={virtualItem.key}
                        className="planner-virtual-item"
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                            transform: `translateY(${virtualItem.start}px)`,
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

export default VirtualCollection;
