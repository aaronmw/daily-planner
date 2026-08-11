export interface CurrentTimeParts {
    hour: string;
    label: string;
    minute: string;
    period: 'AM' | 'PM';
}

export function currentTimeParts(now: Date): CurrentTimeParts {
    const hour = now.getHours();
    const displayHour = String(hour % 12 || 12);
    const minute = String(now.getMinutes()).padStart(2, '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    return {
        hour: displayHour,
        label: `${displayHour}:${minute} ${period}`,
        minute,
        period,
    };
}

export function currentSecondKey(now: Date): number {
    return Math.floor(now.getTime() / 1_000);
}

export function isCurrentTimeColonVisible(now: Date): boolean {
    return currentSecondKey(now) % 2 === 0;
}

export function millisecondsUntilNextSecond(now: Date): number {
    const remainder = now.getMilliseconds();
    return remainder === 0 ? 1_000 : 1_000 - remainder;
}
