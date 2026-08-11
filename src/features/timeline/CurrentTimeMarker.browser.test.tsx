import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../styles/index.css';
import { CurrentTimeMarker } from './CurrentTimeMarker';

describe('CurrentTimeMarker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 11, 15, 42, 18, 250));
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('shows minutes and advances every surface on the next whole second', async () => {
        const { container } = render(
            <div className="relative h-[1440px] w-[320px]">
                <CurrentTimeMarker pixelsPerMinute={1} />
            </div>
        );

        expect(screen.getByLabelText('Current time, 3:42 PM')).toBeTruthy();
        const colon = container.querySelector<HTMLElement>(
            '[data-current-time-colon]'
        );
        const firstSheen = container.querySelector<HTMLElement>(
            '[data-current-time-sheen]'
        );
        const surface = container.querySelector<HTMLElement>(
            '.planner-current-time-surface'
        );
        const sheen = container.querySelector<HTMLElement>(
            '.planner-current-time-sheen'
        );
        const firstSecond = Number(firstSheen?.dataset.second);
        expect(surface).toBeTruthy();
        expect(sheen?.style.animationDelay).toBe('-250ms');
        expect(getComputedStyle(surface!).overflow).toBe('hidden');
        expect(colon?.dataset.visible).toBe('true');
        expect(Number.isFinite(firstSecond)).toBe(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(750);
        });

        expect(colon?.dataset.visible).toBe('false');
        expect(
            Number(
                container.querySelector<HTMLElement>(
                    '[data-current-time-sheen]'
                )?.dataset.second
            )
        ).toBe(firstSecond + 1);
    });

    it('resynchronizes immediately when the document becomes visible', () => {
        const { container } = render(<CurrentTimeMarker pixelsPerMinute={1} />);
        vi.setSystemTime(new Date(2026, 7, 11, 16, 7, 20, 400));

        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(screen.getByLabelText('Current time, 4:07 PM')).toBeTruthy();
        expect(
            container.querySelector<HTMLElement>('[data-current-time-colon]')
                ?.dataset.visible
        ).toBe('true');
    });
});
