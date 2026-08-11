import { currentTimelineMinute } from './timelineScale';
import {
    currentTimeParts,
    isCurrentTimeColonVisible,
} from './timelineClock';
import { useTimelineClock } from './useTimelineClock';

interface CurrentTimeMarkerProps {
    pixelsPerMinute: number;
}

export function CurrentTimeMarker({ pixelsPerMinute }: CurrentTimeMarkerProps) {
    const now = useTimelineClock();
    const time = currentTimeParts(now);
    const colonVisible = isCurrentTimeColonVisible(now);

    return (
        <div
            className="pointer-events-none absolute inset-x-0 z-20 h-0"
            data-current-time-marker
            style={{ top: currentTimelineMinute(now) * pixelsPerMinute }}
        >
            <span className="planner-current-time-label-slot">
                <time
                    aria-label={`Current time, ${time.label}`}
                    className="planner-current-time-badge bg-red-600 text-white"
                    dateTime={`${String(now.getHours()).padStart(2, '0')}:${time.minute}`}
                >
                    <span>{time.hour}</span>
                    <span
                        aria-hidden="true"
                        data-current-time-colon
                        data-visible={colonVisible}
                    >
                        :
                    </span>
                    <span>{`${time.minute} ${time.period}`}</span>
                </time>
            </span>
            <span
                aria-hidden="true"
                className="planner-current-time-surface bg-red-600"
            >
                <span
                    className="planner-current-time-sheen"
                    data-current-time-sheen
                />
            </span>
        </div>
    );
}
