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
const INDICATOR_SIZE = 36;
const SNAP_DISTANCE = 10;
const RETURN_DELAY = 140;

type IndicatorMotion = 'acquire' | 'follow' | 'immediate' | 'return';

interface TrackedSelectionProps {
    ariaLabel: string;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    selectedIndex: number;
}

const clamp = (value: number, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, value));

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
}: TrackedSelectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const centersRef = useRef<number[]>([]);
    const focusedIndexRef = useRef<number | null>(null);
    const pointerActiveRef = useRef(false);
    const reducedMotionRef = useRef(false);
    const selectedIndexRef = useRef(selectedIndex);
    const frameRef = useRef<number | null>(null);
    const pendingCoordinateRef = useRef<number | null>(null);
    const returnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const moveIndicator = useCallback(
        (coordinate: number, motion: IndicatorMotion) => {
            const indicator = indicatorRef.current;
            if (!indicator) return;

            const reducedMotion = reducedMotionRef.current;
            const duration =
                reducedMotion || motion === 'immediate'
                    ? '0ms'
                    : motion === 'follow'
                      ? '80ms'
                      : '300ms';

            indicator.style.transitionDuration = duration;
            indicator.style.transitionTimingFunction =
                motion === 'follow'
                    ? 'linear'
                    : 'cubic-bezier(0.22, 1, 0.36, 1)';
            indicator.style.transform = `translate3d(${coordinate - INDICATOR_SIZE / 2}px, -50%, 0)`;
            indicator.style.opacity = '1';
        },
        []
    );

    const moveToIndex = useCallback(
        (index: number, motion: IndicatorMotion) => {
            const coordinate = centersRef.current[index];
            if (coordinate === undefined) {
                if (indicatorRef.current)
                    indicatorRef.current.style.opacity = '0';
                return;
            }
            moveIndicator(coordinate, motion);
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

            const containerRect = container.getBoundingClientRect();
            centersRef.current = Array.from(
                container.querySelectorAll<HTMLElement>(OPTION_SELECTOR)
            ).map(option => {
                const optionRect = option.getBoundingClientRect();
                return (
                    optionRect.left - containerRect.left + optionRect.width / 2
                );
            });

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

        const bounds = event.currentTarget.getBoundingClientRect();
        const pointerCoordinate = event.clientX - bounds.left;
        const firstCenter = centers[0];
        const lastCenter = centers.at(-1);
        if (firstCenter === undefined || lastCenter === undefined) return;

        let nearestCenter = firstCenter;
        for (const center of centers.slice(1)) {
            if (
                Math.abs(center - pointerCoordinate) <
                Math.abs(nearestCenter - pointerCoordinate)
            ) {
                nearestCenter = center;
            }
        }

        const coordinate = reducedMotionRef.current
            ? nearestCenter
            : Math.abs(nearestCenter - pointerCoordinate) <= SNAP_DISTANCE
              ? nearestCenter
              : clamp(pointerCoordinate, firstCenter, lastCenter);

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
                className="pointer-events-none absolute left-0 top-1/2 z-0 size-9 rounded-full border-[length:var(--planner-stroke-width)] border-planner-contrast opacity-0 transition-[transform,opacity]"
                ref={indicatorRef}
            />
            {children}
        </div>
    );
}
