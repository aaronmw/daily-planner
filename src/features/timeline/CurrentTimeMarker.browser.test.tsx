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

    it('shows minutes and advances the clock without restarting the sweep', async () => {
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
        const firstTop = Number.parseFloat(marker?.style.top ?? '');
        expect(surface).toBeTruthy();
        expect(sheen).toBe(firstSheen);
        expect(getComputedStyle(surface!).overflow).toBe('hidden');
        expect(colon?.dataset.visible).toBe('true');
        expect(Number.isFinite(firstTop)).toBe(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(750);
        });

        expect(colon?.dataset.visible).toBe('false');
        expect(
            container.querySelector<HTMLElement>('[data-current-time-sheen]')
        ).toBe(firstSheen);
        expect(Number.parseFloat(marker?.style.top ?? '')).toBeGreaterThan(
            firstTop
        );
    });

    it('synchronizes the colon when mounting across a second boundary', () => {
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
            container.querySelector<HTMLElement>('[data-current-time-colon]')
                ?.dataset.visible
        ).toBe('false');
    });

    it('sweeps a horizontal gradient across the full marker surface', () => {
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
        animation.pause();
        animation.currentTime = 1000;

        const surfaceBounds = surface.getBoundingClientRect();
        const sheenBounds = sheen.getBoundingClientRect();
        const sheenStyle = getComputedStyle(sheen);

        expect(sheenStyle.animationDuration).toBe('2s');
        expect(sheenStyle.animationIterationCount).toBe('infinite');
        expect(sheenStyle.animationTimingFunction).toBe('linear');
        expect(sheenStyle.backgroundImage).toMatch(
            /^linear-gradient\(90deg, rgba?\(255, 255, 255, 0\) 0%, rgba\(255, 255, 255, 0\.5\) 50%, rgba?\(255, 255, 255, 0\) 100%\)$/
        );
        expect(surfaceBounds.height).toBe(2);
        expect(surfaceBounds.width).toBe(208);
        expect(sheenBounds.left).toBeCloseTo(surfaceBounds.left, 3);
        expect(sheenBounds.right).toBeCloseTo(surfaceBounds.right, 3);
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

    it('shapes the minute and meridiem as one normal-space text run', () => {
        vi.setSystemTime(new Date(2026, 7, 11, 15, 2, 18, 250));
        render(<CurrentTimeMarker pixelsPerMinute={1} />);

        const badge = screen.getByLabelText('Current time, 3:02 PM');
        expect(Array.from(badge.children, child => child.textContent)).toEqual([
            '3',
            ':',
            '02 PM',
        ]);
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
