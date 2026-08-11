import { useEffect, useState } from 'react';
import { millisecondsUntilNextSecond } from './timelineClock';

export function useTimelineClock(): Date {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let timer: number | null = null;

        const schedule = () => {
            const current = new Date();
            setNow(current);
            timer = window.setTimeout(
                schedule,
                millisecondsUntilNextSecond(current)
            );
        };
        const resynchronize = () => {
            if (document.visibilityState !== 'visible') return;
            if (timer !== null) window.clearTimeout(timer);
            schedule();
        };

        timer = window.setTimeout(
            schedule,
            millisecondsUntilNextSecond(new Date())
        );
        document.addEventListener('visibilitychange', resynchronize);
        return () => {
            if (timer !== null) window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', resynchronize);
        };
    }, []);

    return now;
}
