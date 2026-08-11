# Current-Time Marker Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a minute-only current-time badge with a synchronized blinking colon and one 500ms diagonal sheen across the marker at each wall-clock second.

**Architecture:** Isolate local-time formatting and second-boundary arithmetic in pure helpers, own the drift-resistant wall-clock lifecycle in a small hook, and move the current-time UI into a focused component. `TimelineColumn` will consume that component while feature CSS owns badge alignment, the clipped compositor-friendly sheen, and reduced-motion behavior.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4 utilities plus feature CSS, Vitest unit and Playwright browser projects, Tauri 2 macOS packaging.

## Global Constraints

- Show the local current time as `h:mm AM/PM`; do not display seconds.
- Blink only the colon, preserving its layout width while hidden.
- Shape the minute and meridiem as one text run with one normal space so their spacing matches ordinary timeline labels.
- Align the badge's text edge—not its outer edge—with the existing hourly labels.
- Clip the sheen to the current-time marker surface to the right of the 72px label gutter.
- Start one sheen at each real second boundary; complete it within 500ms and remain still for the rest of the second.
- Begin the sheen outside the marker at 0% opacity and reach 100% only after its full width has cleared the left clipping edge.
- Use a `4deg` CSS gradient direction so the visible color band is nearly horizontal and the 4px marker renders an elongated glancing streak rather than a compact dot.
- Use one wall-clock source for marker position, colon phase, and sheen identity; resynchronize immediately after backgrounding or suspension.
- Under `prefers-reduced-motion: reduce`, keep the marker accurate, keep the colon visible, and omit the sheen.
- Do not alter scrolling, drag-and-drop behavior, planner persistence, or planner-store state.
- Do not add a motion or date dependency.
- Local per-task checkpoint commits are allowed as internal artifacts for the selected subagent-driven review workflow. The post-implementation decision audit still gates merging, pushing, pull requests, deployment, release, and other integration/finalization.

---

## File Structure

- Create `src/features/timeline/timelineClock.ts`: pure local-time display, whole-second phase, and next-boundary delay helpers.
- Create `src/features/timeline/__tests__/timelineClock.test.ts`: deterministic helper coverage.
- Create `src/features/timeline/useTimelineClock.ts`: chained timeout and document-visibility lifecycle.
- Create `src/features/timeline/CurrentTimeMarker.tsx`: current-time badge, colon, marker surface, and keyed sheen markup.
- Create `src/features/timeline/CurrentTimeMarker.browser.test.tsx`: real-browser timing, resynchronization, and stable markup coverage.
- Modify `src/features/timeline/TimelineColumn.tsx`: replace the inline marker with `CurrentTimeMarker`.
- Modify `src/styles/features.css`: badge geometry, sheen keyframes, and reduced-motion treatment.

### Task 1: Pure timeline-clock primitives

**Files:**
- Create: `src/features/timeline/timelineClock.ts`
- Create: `src/features/timeline/__tests__/timelineClock.test.ts`

**Interfaces:**
- Consumes: native `Date` and epoch milliseconds.
- Produces: `CurrentTimeParts`, `currentTimeParts(now: Date)`, `currentSecondKey(now: Date)`, `isCurrentTimeColonVisible(now: Date)`, and `millisecondsUntilNextSecond(now: Date)`.

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from 'vitest';
import {
    currentSecondKey,
    currentTimeParts,
    isCurrentTimeColonVisible,
    millisecondsUntilNextSecond,
} from '../timelineClock';

describe('timelineClock', () => {
    it('formats local time with minutes but no seconds', () => {
        expect(currentTimeParts(new Date(2026, 7, 11, 15, 4, 38))).toEqual({
            hour: '3',
            label: '3:04 PM',
            minute: '04',
            period: 'PM',
        });
    });

    it('alternates the colon on consecutive whole seconds', () => {
        const even = new Date(2026, 7, 11, 15, 4, 38);
        const odd = new Date(2026, 7, 11, 15, 4, 39);
        expect(isCurrentTimeColonVisible(even)).toBe(true);
        expect(isCurrentTimeColonVisible(odd)).toBe(false);
        expect(currentSecondKey(odd) - currentSecondKey(even)).toBe(1);
    });

    it('aligns the next callback to the real second boundary', () => {
        expect(
            millisecondsUntilNextSecond(
                new Date(2026, 7, 11, 15, 4, 38, 250)
            )
        ).toBe(750);
        expect(
            millisecondsUntilNextSecond(
                new Date(2026, 7, 11, 15, 4, 39, 0)
            )
        ).toBe(1_000);
    });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `./node_modules/.bin/vitest run --project unit src/features/timeline/__tests__/timelineClock.test.ts`

Expected: FAIL because `../timelineClock` does not exist.

- [ ] **Step 3: Implement the pure helpers**

```ts
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
```

- [ ] **Step 4: Run the helper tests and confirm GREEN**

Run: `./node_modules/.bin/vitest run --project unit src/features/timeline/__tests__/timelineClock.test.ts`

Expected: 3 tests pass.

- [ ] **Step 5: Review and checkpoint Task 1**

Run: `git diff --check && ./node_modules/.bin/eslint src/features/timeline/timelineClock.ts src/features/timeline/__tests__/timelineClock.test.ts --max-warnings 0`

Expected: no whitespace or lint errors. Then create the local review checkpoint:

```bash
git add src/features/timeline/timelineClock.ts src/features/timeline/__tests__/timelineClock.test.ts
git commit -m "feat: add synchronized timeline clock"
```

### Task 2: Drift-resistant wall-clock lifecycle

**Files:**
- Create: `src/features/timeline/useTimelineClock.ts`
- Create: `src/features/timeline/CurrentTimeMarker.tsx`
- Create: `src/features/timeline/CurrentTimeMarker.browser.test.tsx`

**Interfaces:**
- Consumes: all helpers from `timelineClock.ts` plus `currentTimelineMinute(now: Date)` from `timelineScale.ts`.
- Produces: `useTimelineClock(): Date` and `CurrentTimeMarker({ pixelsPerMinute }: { pixelsPerMinute: number })`.

- [ ] **Step 1: Write the failing browser tests**

```tsx
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrentTimeMarker } from './CurrentTimeMarker';

describe('CurrentTimeMarker', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 7, 11, 15, 42, 18, 250));
    });

    afterEach(() => {
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
        const firstSecond = Number(firstSheen?.dataset.second);
        expect(colon?.dataset.visible).toBe('true');
        expect(Number.isFinite(firstSecond)).toBe(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(750);
        });

        expect(colon?.dataset.visible).toBe('false');
        expect(Number(
            container.querySelector<HTMLElement>(
                '[data-current-time-sheen]'
            )?.dataset.second
        )).toBe(firstSecond + 1);
    });

    it('resynchronizes immediately when the document becomes visible', () => {
        const { container } = render(
            <CurrentTimeMarker pixelsPerMinute={1} />
        );
        vi.setSystemTime(new Date(2026, 7, 11, 16, 7, 20, 400));

        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(screen.getByLabelText('Current time, 4:07 PM')).toBeTruthy();
        expect(
            container.querySelector<HTMLElement>(
                '[data-current-time-colon]'
            )?.dataset.visible
        ).toBe('true');
    });
});
```

- [ ] **Step 2: Run the browser test and confirm RED**

Run: `./node_modules/.bin/vitest run --project browser src/features/timeline/CurrentTimeMarker.browser.test.tsx`

Expected: FAIL because `./CurrentTimeMarker` does not exist.

- [ ] **Step 3: Implement the clock hook**

```ts
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
```

- [ ] **Step 4: Implement the focused marker component**

```tsx
import { type CSSProperties } from 'react';
import { currentTimelineMinute } from './timelineScale';
import {
    currentSecondKey,
    currentTimeParts,
    isCurrentTimeColonVisible,
} from './timelineClock';
import { useTimelineClock } from './useTimelineClock';

interface CurrentTimeMarkerProps {
    pixelsPerMinute: number;
}

export function CurrentTimeMarker({
    pixelsPerMinute,
}: CurrentTimeMarkerProps) {
    const now = useTimelineClock();
    const time = currentTimeParts(now);
    const second = currentSecondKey(now);
    const colonVisible = isCurrentTimeColonVisible(now);
    const sheenStyle = {
        animationDelay: `-${now.getMilliseconds()}ms`,
    } as CSSProperties;

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
                    data-second={second}
                    key={second}
                    style={sheenStyle}
                />
            </span>
        </div>
    );
}
```

- [ ] **Step 5: Run the focused browser test and confirm GREEN**

Run: `./node_modules/.bin/vitest run --project browser src/features/timeline/CurrentTimeMarker.browser.test.tsx`

Expected: 2 tests pass, and the observed second key advances by exactly one.

- [ ] **Step 6: Review and checkpoint Task 2**

Run: `git diff --check && ./node_modules/.bin/eslint src/features/timeline/useTimelineClock.ts src/features/timeline/CurrentTimeMarker.tsx src/features/timeline/CurrentTimeMarker.browser.test.tsx --max-warnings 0`

Expected: no whitespace or lint errors. Then create the local review checkpoint:

```bash
git add src/features/timeline/useTimelineClock.ts src/features/timeline/CurrentTimeMarker.tsx src/features/timeline/CurrentTimeMarker.browser.test.tsx
git commit -m "feat: render synchronized current time marker"
```

### Task 3: Integrate and style the synchronized marker

**Files:**
- Modify: `src/features/timeline/TimelineColumn.tsx:1-40,241`
- Modify: `src/styles/features.css:184-199,245-249`
- Test: `src/features/timeline/CurrentTimeMarker.browser.test.tsx`

**Interfaces:**
- Consumes: `CurrentTimeMarker({ pixelsPerMinute })` from Task 2.
- Produces: the installed timeline marker UI; no new public application API.

- [ ] **Step 1: Replace the inline marker**

In `TimelineColumn.tsx`, delete the existing inline `CurrentTimeMarker` function and its private timer. Add:

```ts
import { CurrentTimeMarker } from './CurrentTimeMarker';
```

Keep the existing render call unchanged:

```tsx
<CurrentTimeMarker pixelsPerMinute={pixelsPerMinute} />
```

- [ ] **Step 2: Add badge, marker, colon, and sheen CSS**

Add the following focused feature styles, refining only token names or selector ordering required by the project's formatter:

```css
.planner-current-time-label-slot {
    left: 0;
    position: absolute;
    top: 0;
    width: 72px;
}

.planner-current-time-badge {
    align-items: baseline;
    border-radius: var(--radius-planner);
    display: inline-flex;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    padding: 4px;
    position: absolute;
    right: 4px;
    top: 0;
    transform: translateY(-50%);
    white-space: nowrap;
    z-index: 1;
}

.planner-current-time-badge [data-current-time-colon] {
    opacity: 0;
}

.planner-current-time-badge [data-current-time-colon][data-visible='true'] {
    opacity: 1;
}

.planner-current-time-surface {
    height: calc(var(--planner-stroke-width) * 2);
    left: 72px;
    overflow: hidden;
    position: absolute;
    right: 0;
    top: 0;
    transform: translateY(-50%);
}

.planner-current-time-sheen {
    animation: planner-current-time-sheen 500ms ease-in-out both;
    background-image: linear-gradient(
        4deg,
        transparent 0%,
        rgb(255 255 255 / 35%) 32%,
        white 50%,
        rgb(255 255 255 / 35%) 68%,
        transparent 100%
    );
    background-position: right;
    background-repeat: no-repeat;
    background-size: 48px 100%;
    bottom: 0;
    left: 0;
    opacity: 0;
    position: absolute;
    top: 0;
    transform: translateX(-100%);
    width: calc(100% + 48px);
    will-change: opacity, transform;
}

@keyframes planner-current-time-sheen {
    0% {
        opacity: 0;
        transform: translateX(-100%);
    }
    35% {
        opacity: 1;
    }
    80% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: translateX(0);
    }
}
```

The badge's `right: 4px` plus `padding-right: 4px` places its text edge at 64px, matching the hourly labels' 72px width minus 8px right padding. The sheen element is the marker width plus its 48px gradient; translating that compositor layer from `-100%` to `0` moves its right-anchored gradient fully across the clipped marker without animating layout.

- [ ] **Step 3: Add reduced-motion behavior**

Extend the existing media query:

```css
@media (prefers-reduced-motion: reduce) {
    .planner-current-time-badge [data-current-time-colon] {
        opacity: 1;
    }

    .planner-current-time-sheen {
        display: none;
    }

    .planner-ghost-tracer {
        animation: none;
    }
}
```

- [ ] **Step 4: Expand the browser test with structural and phase assertions**

Import `../../styles/index.css` in `CurrentTimeMarker.browser.test.tsx`, then assert:

```ts
const surface = container.querySelector<HTMLElement>(
    '.planner-current-time-surface'
);
const sheen = container.querySelector<HTMLElement>(
    '.planner-current-time-sheen'
);
expect(surface).toBeTruthy();
expect(sheen?.style.animationDelay).toBe('-250ms');
expect(getComputedStyle(surface!).overflow).toBe('hidden');
```

This confirms the phase starts 250ms into the current second rather than launching a fresh off-tick sheen on initial render.

- [ ] **Step 5: Run focused and full code verification**

Run:

```bash
./node_modules/.bin/prettier --check src/features/timeline/timelineClock.ts src/features/timeline/useTimelineClock.ts src/features/timeline/CurrentTimeMarker.tsx src/features/timeline/CurrentTimeMarker.browser.test.tsx src/features/timeline/__tests__/timelineClock.test.ts src/features/timeline/TimelineColumn.tsx src/styles/features.css
./node_modules/.bin/eslint src vite.config.ts vitest.config.ts eslint.config.ts --max-warnings 0
./node_modules/.bin/tsc -b
./node_modules/.bin/vitest run
./node_modules/.bin/vite build
```

Expected: formatting, lint, typecheck, all Vitest projects, and Vite production build pass. Preserve any existing non-failing Node warnings in the report rather than treating them as new failures.

- [ ] **Step 6: Run React Doctor**

Run `npx react-doctor@latest --verbose --scope changed`, compare the changed-code score and diagnostics to the known baseline, and fix only regressions introduced by these files. Do not broaden this feature into unrelated cleanup.

- [ ] **Step 7: Build, install, stop the exact app, and reopen it**

Resolve the exact running process first:

```bash
pgrep -af '/Applications/Daily Planner.app/Contents/MacOS/daily-planner'
```

Build and install through the documented transactional workflow:

```bash
node scripts/build-tauri-app.mjs --config '{"build":{"beforeBuildCommand":""}}'
node scripts/install-desktop-app.mjs
codesign --verify --deep --strict '/Applications/Daily Planner.app'
```

Confirm exactly one installed-app process is running after installation and that the installed executable hash matches the newly built executable. The installer, not an ad-hoc kill command, owns replacement and relaunch.

- [ ] **Step 8: Create the local Task 3 review checkpoint**

```bash
git add src/features/timeline/TimelineColumn.tsx src/styles/features.css src/features/timeline/CurrentTimeMarker.browser.test.tsx
git commit -m "style: polish current time marker"
```

- [ ] **Step 9: Perform the post-implementation decision audit**

Report every implementation decision and tradeoff, confidence, validation gaps, remaining edge cases, the pride gate, and an overall readiness verdict. The local checkpoints remain internal review artifacts; do not merge, push, create a pull request, deploy, release, or otherwise integrate/finalize the work until Aaron accepts the audit.
