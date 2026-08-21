import {
    type FocusEvent,
    type PointerEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react';

const OPTION_SELECTOR = '[data-tracked-selection-index]';
const SNAP_DISTANCE = 10;
const RETURN_DELAY = 140;

type IndicatorMotion = 'acquire' | 'follow' | 'immediate' | 'return';
type TrackingMode = 'grid' | 'horizontal';

interface Point {
    x: number;
    y: number;
}

interface TrackedSelectionProps {
    ariaLabel: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    selectedIndex: number;
    tracking?: TrackingMode;
}

const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value));

const distanceBetween = (first: Point, second: Point, mode: TrackingMode) =>
    mode === 'horizontal'
        ? Math.abs(first.x - second.x)
        : Math.hypot(first.x - second.x, first.y - second.y);

const optionIndex = (target: EventTarget | null): number | null => {
    if (!(target instanceof Element)) return null;

    const option = target.closest<HTMLElement>(OPTION_SELECTOR);
    if (!option) return null;

    const index = Number(option.dataset.trackedSelectionIndex);
    return Number.isInteger(index) ? index : null;
};

export function TrackedSelection({
    ariaLabel,
    children,
    className = '',
    disabled = false,
    selectedIndex,
    tracking = 'horizontal',
}: TrackedSelectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const centersRef = useRef<Point[]>([]);
    const focusedIndexRef = useRef<number | null>(null);
    const pointerActiveRef = useRef(false);
    const reducedMotionRef = useRef(false);
    const selectedIndexRef = useRef(selectedIndex);
    const frameRef = useRef<number | null>(null);
    const pendingCoordinateRef = useRef<Point | null>(null);
    const returnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const moveIndicator = useCallback(
        (coordinate: Point, motion: IndicatorMotion) => {
            const indicator = indicatorRef.current;
            if (!indicator) return;

            const reducedMotion = reducedMotionRef.current;
            const duration =
                reducedMotion || motion === 'immediate' || motion === 'follow'
                    ? '0ms'
                    : '300ms';

            indicator.style.transitionDuration = duration;
            indicator.style.transitionTimingFunction =
                motion === 'follow'
                    ? 'linear'
                    : 'cubic-bezier(0.22, 1, 0.36, 1)';
            indicator.style.left = `${coordinate.x}px`;
            indicator.style.top = `${coordinate.y}px`;
            indicator.style.opacity = '1';
        },
        []
    );

    const moveToIndex = useCallback(
        (index: number, motion: IndicatorMotion) => {
            const center = centersRef.current[index];
            if (center === undefined) {
                if (indicatorRef.current)
                    indicatorRef.current.style.opacity = '0';
                return;
            }
            moveIndicator(center, motion);
        },
        [moveIndicator]
    );

    const clearReturnTimeout = useCallback(() => {
        if (returnTimeoutRef.current === null) return;
        clearTimeout(returnTimeoutRef.current);
        returnTimeoutRef.current = null;
    }, []);

    const returnToSelection = useCallback(() => {
        clearReturnTimeout();
        moveToIndex(
            focusedIndexRef.current ?? selectedIndexRef.current,
            'return'
        );
    }, [clearReturnTimeout, moveToIndex]);

    const measure = useCallback(
        (motion: IndicatorMotion = 'immediate') => {
            const container = containerRef.current;
            if (!container) return;

            centersRef.current = Array.from(
                container.querySelectorAll<HTMLElement>(OPTION_SELECTOR)
            ).map(option => ({
                x: option.offsetLeft + option.offsetWidth / 2,
                y: option.offsetTop + option.offsetHeight / 2,
            }));

            moveToIndex(
                focusedIndexRef.current ?? selectedIndexRef.current,
                motion
            );
        },
        [moveToIndex]
    );

    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;

        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncPreference = () => {
            reducedMotionRef.current = media.matches;
        };

        syncPreference();
        media.addEventListener('change', syncPreference);
        return () => media.removeEventListener('change', syncPreference);
    }, []);

    useLayoutEffect(() => {
        measure('immediate');

        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const observer = new ResizeObserver(() => measure('immediate'));
        observer.observe(container);
        return () => observer.disconnect();
    }, [measure]);

    useLayoutEffect(() => {
        selectedIndexRef.current = selectedIndex;
        if (pointerActiveRef.current || focusedIndexRef.current !== null)
            return;
        moveToIndex(selectedIndex, 'return');
    }, [moveToIndex, selectedIndex]);

    useEffect(
        () => () => {
            clearReturnTimeout();
            if (frameRef.current !== null)
                cancelAnimationFrame(frameRef.current);
        },
        [clearReturnTimeout]
    );

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (disabled) return;

        const centers = centersRef.current;
        if (centers.length === 0) return;

        clearReturnTimeout();
        const acquiring = !pointerActiveRef.current;
        pointerActiveRef.current = true;

        const container = event.currentTarget;
        const bounds = container.getBoundingClientRect();
        const scaleX = bounds.width / container.clientWidth || 1;
        const scaleY = bounds.height / container.clientHeight || 1;
        const firstCenter = centers[0];
        if (firstCenter === undefined) return;

        const pointerCoordinate: Point = {
            x: (event.clientX - bounds.left) / scaleX,
            y:
                tracking === 'horizontal'
                    ? firstCenter.y
                    : (event.clientY - bounds.top) / scaleY,
        };

        let nearestCenter = firstCenter;
        for (const center of centers.slice(1)) {
            if (
                distanceBetween(center, pointerCoordinate, tracking) <
                distanceBetween(nearestCenter, pointerCoordinate, tracking)
            ) {
                nearestCenter = center;
            }
        }

        const horizontalCenters = centers.map(center => center.x);
        const verticalCenters = centers.map(center => center.y);
        const coordinate = reducedMotionRef.current
            ? nearestCenter
            : distanceBetween(nearestCenter, pointerCoordinate, tracking) <=
                SNAP_DISTANCE
              ? nearestCenter
              : {
                    x: clamp(
                        pointerCoordinate.x,
                        Math.min(...horizontalCenters),
                        Math.max(...horizontalCenters)
                    ),
                    y:
                        tracking === 'horizontal'
                            ? firstCenter.y
                            : clamp(
                                  pointerCoordinate.y,
                                  Math.min(...verticalCenters),
                                  Math.max(...verticalCenters)
                              ),
                };

        pendingCoordinateRef.current = coordinate;
        if (frameRef.current !== null) return;

        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            const pendingCoordinate = pendingCoordinateRef.current;
            if (pendingCoordinate === null) return;
            moveIndicator(pendingCoordinate, acquiring ? 'acquire' : 'follow');
        });
    };

    const handlePointerLeave = () => {
        pointerActiveRef.current = false;
        pendingCoordinateRef.current = null;
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        clearReturnTimeout();
        returnTimeoutRef.current = setTimeout(returnToSelection, RETURN_DELAY);
    };

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (disabled) return;

        const index = optionIndex(event.target);
        if (index === null) return;
        moveToIndex(index, 'acquire');
    };

    const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
        const index = optionIndex(event.target);
        if (index === null) return;

        focusedIndexRef.current = index;
        clearReturnTimeout();
        moveToIndex(index, 'acquire');
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        const nextIndex = optionIndex(event.relatedTarget);
        focusedIndexRef.current = nextIndex;

        if (nextIndex !== null) {
            moveToIndex(nextIndex, 'acquire');
            return;
        }

        returnToSelection();
    };

    return (
        <div
            aria-label={ariaLabel}
            className={`relative ${className}`}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}
            ref={containerRef}
            role="group"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 z-0 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[length:var(--planner-stroke-width)] border-planner-contrast opacity-0 transition-[left,top,opacity]"
                ref={indicatorRef}
            />
            {children}
        </div>
    );
}
