const ITEM_DRAG_THRESHOLD_PX = 8;

export const hasCrossedItemDragThreshold = (
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
): boolean => {
    const horizontalDistance = currentX - startX;
    const verticalDistance = currentY - startY;
    return (
        horizontalDistance * horizontalDistance +
            verticalDistance * verticalDistance >=
        ITEM_DRAG_THRESHOLD_PX * ITEM_DRAG_THRESHOLD_PX
    );
};
