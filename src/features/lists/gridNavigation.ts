export type GridDirection = 'down' | 'left' | 'right' | 'up';

export const nextGridIndex = ({
    columns,
    count,
    direction,
    index,
}: {
    columns: number;
    count: number;
    direction: GridDirection;
    index: number;
}): number => {
    if (count <= 0 || columns <= 0 || index < 0 || index >= count) return index;
    if (direction === 'left') return Math.max(0, index - 1);
    if (direction === 'right') return Math.min(count - 1, index + 1);
    if (direction === 'up') return Math.max(0, index - columns);

    const direct = index + columns;
    if (direct < count) return direct;
    const last = count - 1;
    return Math.floor(last / columns) > Math.floor(index / columns)
        ? last
        : index;
};
