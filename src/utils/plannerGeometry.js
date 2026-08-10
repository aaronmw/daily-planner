const getPixelsPerMinute = (viewportHeight, hoursPerScreen) => {
    const numericViewportHeight = Number(viewportHeight);
    const numericHoursPerScreen = Number(hoursPerScreen);

    if (
        !Number.isFinite(numericViewportHeight) ||
        !Number.isFinite(numericHoursPerScreen) ||
        numericViewportHeight <= 0 ||
        numericHoursPerScreen <= 0
    ) {
        return 0;
    }

    return numericViewportHeight / (numericHoursPerScreen * 60);
};

const getDurationHeight = (durationMinutes, pixelsPerMinute) =>
    Math.max(0, Number(durationMinutes) || 0) * pixelsPerMinute;

const snapToDevicePixel = (value, devicePixelRatio = 1) => {
    const numericValue = Number(value);
    const numericDevicePixelRatio = Number(devicePixelRatio);

    if (
        !Number.isFinite(numericValue) ||
        !Number.isFinite(numericDevicePixelRatio) ||
        numericDevicePixelRatio <= 0
    ) {
        return numericValue;
    }

    return (
        Math.round(numericValue * numericDevicePixelRatio) /
        numericDevicePixelRatio
    );
};

const getMinuteHeightCss = hoursPerScreen =>
    `calc((100dvh - var(--spacing-grid)) / ${Number(hoursPerScreen) * 60})`;

const getAnchoredScrollTop = (
    currentScrollTop,
    currentPixelsPerMinute,
    nextPixelsPerMinute
) => {
    if (currentPixelsPerMinute <= 0 || nextPixelsPerMinute <= 0) {
        return currentScrollTop;
    }

    return (currentScrollTop / currentPixelsPerMinute) * nextPixelsPerMinute;
};

const getCardSizingMode = (relativeCardSizingEnabled, cardContext) =>
    cardContext === 'timeline' || relativeCardSizingEnabled
        ? 'relative'
        : 'natural';

export {
    getAnchoredScrollTop,
    getCardSizingMode,
    getDurationHeight,
    getMinuteHeightCss,
    getPixelsPerMinute,
    snapToDevicePixel,
};
