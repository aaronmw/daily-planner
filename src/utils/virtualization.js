import {
    getDurationHeight,
    getPixelsPerMinute,
} from './plannerGeometry';

const getTaskEstimatedSize = ({
    durationMinutes,
    hoursPerScreen,
    naturalSize = 45,
    relativeCardSizingEnabled,
    viewportHeight,
}) =>
    relativeCardSizingEnabled
        ? getDurationHeight(
              durationMinutes,
              getPixelsPerMinute(viewportHeight, hoursPerScreen)
          )
        : naturalSize;

const getListGridMetrics = (
    containerWidth,
    { columns = 3, gap, paddingInline }
) => {
    const gapsWidth = gap * (columns - 1);
    const contentWidth = Math.max(0, containerWidth - paddingInline * 2);
    const cardWidth = Math.max(0, contentWidth - gapsWidth) / columns;

    return {
        cardHeight: cardWidth * 1.5,
        cardWidth,
    };
};

export { getListGridMetrics, getTaskEstimatedSize };
