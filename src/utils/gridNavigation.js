const GRID_NAVIGATION_DIRECTIONS = new Set([
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
]);

export const isPlainGridNavigationKeyEvent = event =>
    GRID_NAVIGATION_DIRECTIONS.has(event.key) &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey;

export const isGridNavigationEvent = (event, navigationTarget) =>
    isPlainGridNavigationKeyEvent(event) && event.target === navigationTarget;

export const getGridNavigationTargetIndex = ({
    columnCount,
    currentIndex,
    direction,
    itemCount,
}) => {
    if (
        !GRID_NAVIGATION_DIRECTIONS.has(direction) ||
        currentIndex < 0 ||
        currentIndex >= itemCount ||
        itemCount <= 0
    ) {
        return null;
    }

    if (direction === 'ArrowLeft') {
        return currentIndex > 0 ? currentIndex - 1 : null;
    }

    if (direction === 'ArrowRight') {
        return currentIndex < itemCount - 1 ? currentIndex + 1 : null;
    }

    const resolvedColumnCount = Math.max(1, Math.floor(columnCount));
    const currentRow = Math.floor(currentIndex / resolvedColumnCount);
    const targetRow =
        direction === 'ArrowDown' ? currentRow + 1 : currentRow - 1;
    const rowCount = Math.ceil(itemCount / resolvedColumnCount);

    if (targetRow < 0 || targetRow >= rowCount) {
        return null;
    }

    const targetRowStart = targetRow * resolvedColumnCount;
    const targetRowEnd = Math.min(
        itemCount - 1,
        targetRowStart + resolvedColumnCount - 1
    );
    const currentColumn = currentIndex % resolvedColumnCount;

    return Math.min(targetRowStart + currentColumn, targetRowEnd);
};
