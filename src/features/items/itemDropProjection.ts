export interface ItemDropProjectionOptions {
    durationMs: number;
    reducedMotion: boolean;
}

export interface ItemDropProjectionAnimation {
    finished: Promise<void>;
    stopAtCurrentBounds: () => void;
}

const projectionKeyframe = (bounds: DOMRect): Keyframe => ({
    height: `${bounds.height}px`,
    transform: `translate3d(${bounds.left}px, ${bounds.top}px, 0)`,
    width: `${bounds.width}px`,
});

export const placeItemDropProjection = (
    element: HTMLElement,
    bounds: DOMRect
): void => {
    element.style.height = `${bounds.height}px`;
    element.style.transform =
        `translate3d(${bounds.left}px, ${bounds.top}px, 0)`;
    element.style.width = `${bounds.width}px`;
};

export function startItemDropProjection(
    element: HTMLElement,
    targetBounds: DOMRect,
    options: ItemDropProjectionOptions
): ItemDropProjectionAnimation {
    if (
        options.reducedMotion ||
        options.durationMs <= 0 ||
        typeof element.animate !== 'function'
    ) {
        placeItemDropProjection(element, targetBounds);
        return {
            finished: Promise.resolve(),
            stopAtCurrentBounds: () => undefined,
        };
    }

    const sourceBounds = element.getBoundingClientRect();
    const animation = element.animate(
        [projectionKeyframe(sourceBounds), projectionKeyframe(targetBounds)],
        {
            duration: options.durationMs,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            fill: 'forwards',
        }
    );
    let stopped = false;
    const stopAtCurrentBounds = () => {
        if (stopped) return;
        stopped = true;
        const currentBounds = element.getBoundingClientRect();
        animation.cancel();
        placeItemDropProjection(element, currentBounds);
    };
    return {
        finished: animation.finished
            .then(() => {
                if (stopped) return;
                stopped = true;
                animation.cancel();
                placeItemDropProjection(element, targetBounds);
            })
            .catch(() => undefined),
        stopAtCurrentBounds,
    };
}
