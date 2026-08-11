import { act, cleanup, render, screen } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { cdp } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../styles/index.css';
import { CurrentTimeMarker } from './CurrentTimeMarker';

function AdvanceSystemTimeOnLayout({ to }: { to: Date }) {
    useLayoutEffect(() => {
        vi.setSystemTime(to);
    }, [to]);
    return null;
}

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
        const marker = container.querySelector<HTMLElement>(
            '[data-current-time-marker]'
        );
        const surface = container.querySelector<HTMLElement>(
            '.planner-current-time-surface'
        );
        const sheen = container.querySelector<HTMLElement>(
            '.planner-current-time-sheen'
        );
        const firstSecond = Number(firstSheen?.dataset.second);
        const firstTop = Number.parseFloat(marker?.style.top ?? '');
        expect(surface).toBeTruthy();
        expect(sheen?.style.animationDelay).toBe('-250ms');
        expect(getComputedStyle(surface!).overflow).toBe('hidden');
        expect(colon?.dataset.visible).toBe('true');
        expect(Number.isFinite(firstSecond)).toBe(true);
        expect(Number.isFinite(firstTop)).toBe(true);

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
        expect(Number.parseFloat(marker?.style.top ?? '')).toBeGreaterThan(
            firstTop
        );
    });

    it('synchronizes the setup snapshot when mounting across a second boundary', () => {
        vi.setSystemTime(new Date('2026-08-11T15:42:18.999Z'));
        const { container } = render(
            <>
                <CurrentTimeMarker pixelsPerMinute={1} />
                <AdvanceSystemTimeOnLayout
                    to={new Date('2026-08-11T15:42:19.005Z')}
                />
            </>
        );

        expect(
            container.querySelector<HTMLElement>('[data-current-time-sheen]')
                ?.dataset.second
        ).toBe('1786462939');
        expect(
            container.querySelector<HTMLElement>('[data-current-time-colon]')
                ?.dataset.visible
        ).toBe('false');
    });

    it('reaches full sheen opacity only after its gradient clears the minimum-width clip', () => {
        vi.setSystemTime(new Date(2026, 7, 11, 15, 42, 18));
        const { container } = render(
            <div style={{ height: 1440, position: 'relative', width: 280 }}>
                <CurrentTimeMarker pixelsPerMinute={1} />
            </div>
        );
        const surface = container.querySelector<HTMLElement>(
            '.planner-current-time-surface'
        )!;
        const sheen = container.querySelector<HTMLElement>(
            '.planner-current-time-sheen'
        )!;
        const animation = sheen.getAnimations()[0];
        if (!animation) throw new Error('Expected the sheen CSS animation.');
        expect(getComputedStyle(sheen).backgroundImage).toContain('94deg');
        animation.pause();

        let firstOpaqueTime: number | null = null;
        for (let time = 0; time <= 500; time += 1) {
            animation.currentTime = time;
            if (Number.parseFloat(getComputedStyle(sheen).opacity) >= 0.999) {
                firstOpaqueTime = time;
                break;
            }
        }

        expect(firstOpaqueTime).not.toBeNull();
        const surfaceBounds = surface.getBoundingClientRect();
        const sheenBounds = sheen.getBoundingClientRect();
        const gradientWidth = Number.parseFloat(
            getComputedStyle(sheen).backgroundSize
        );
        expect(surfaceBounds.width).toBe(208);
        expect(sheenBounds.width).toBe(256);
        expect(sheenBounds.right - gradientWidth).toBeGreaterThanOrEqual(
            surfaceBounds.left
        );
    });

    it('keeps the colon visible and removes the sheen for reduced motion', async () => {
        const session = cdp();
        await session.send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
        });

        try {
            const { container } = render(
                <CurrentTimeMarker pixelsPerMinute={1} />
            );
            const colon = container.querySelector<HTMLElement>(
                '[data-current-time-colon]'
            )!;
            const sheen = container.querySelector<HTMLElement>(
                '.planner-current-time-sheen'
            )!;

            expect(getComputedStyle(colon).opacity).toBe('1');
            expect(getComputedStyle(sheen).display).toBe('none');
        } finally {
            await session.send('Emulation.setEmulatedMedia', {
                features: [
                    {
                        name: 'prefers-reduced-motion',
                        value: 'no-preference',
                    },
                ],
            });
        }
    });

    it('resynchronizes immediately and cancels the stale cadence when visible', async () => {
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

        const marker = container.querySelector<HTMLElement>(
            '[data-current-time-marker]'
        )!;
        const resynchronizedTop = marker.style.top;
        await act(async () => {
            await vi.advanceTimersByTimeAsync(600);
        });
        const firstTickTop = marker.style.top;
        expect(Number.parseFloat(firstTickTop)).toBeGreaterThan(
            Number.parseFloat(resynchronizedTop)
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(150);
        });
        expect(marker.style.top).toBe(firstTickTop);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(850);
        });
        expect(Number.parseFloat(marker.style.top)).toBeGreaterThan(
            Number.parseFloat(firstTickTop)
        );
    });
});
