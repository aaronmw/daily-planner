export const ITEM_DURATION_ESTIMATES = [
    { label: '1', minutes: 1 },
    { label: '5', minutes: 5 },
    { label: '15', minutes: 15 },
    { label: '30', minutes: 30 },
    { label: '30+', minutes: 60 },
] as const;

export const effectiveItemDurationMinutes = (
    durationMinutes: number
): number => (durationMinutes > 30 ? 60 : durationMinutes);

export const itemDurationEstimateIndex = (durationMinutes: number): number => {
    const effectiveDuration = effectiveItemDurationMinutes(durationMinutes);
    return ITEM_DURATION_ESTIMATES.findIndex(
        estimate => estimate.minutes === effectiveDuration
    );
};

export const nextItemDurationEstimate = (durationMinutes: number): number => {
    const effectiveDuration = effectiveItemDurationMinutes(durationMinutes);
    const currentIndex = itemDurationEstimateIndex(effectiveDuration);
    if (currentIndex >= 0) {
        const nextEstimate =
            ITEM_DURATION_ESTIMATES[
                (currentIndex + 1) % ITEM_DURATION_ESTIMATES.length
            ] ?? ITEM_DURATION_ESTIMATES[0];
        return nextEstimate.minutes;
    }

    return (
        ITEM_DURATION_ESTIMATES.find(
            estimate => estimate.minutes > effectiveDuration
        ) ?? ITEM_DURATION_ESTIMATES[0]
    ).minutes;
};
