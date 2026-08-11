import { afterEach, describe, expect, it } from 'vitest';
import { startItemDropProjection } from './itemDropProjection';

const createGhost = (): HTMLElement => {
    const ghost = document.createElement('div');
    Object.assign(ghost.style, {
        height: '30px',
        left: '0',
        position: 'fixed',
        top: '0',
        transform: 'translate3d(0px, 0px, 0)',
        width: '40px',
    });
    document.body.append(ghost);
    return ghost;
};

afterEach(() => {
    document.body.replaceChildren();
});

describe('item drop projection motion', () => {
    it('places the ghost immediately when reduced motion is enabled', async () => {
        const ghost = createGhost();
        const targetBounds = new DOMRect(120, 80, 90, 60);

        const projection = startItemDropProjection(ghost, targetBounds, {
            durationMs: 150,
            reducedMotion: true,
        });
        await projection.finished;

        expect(ghost.style.transform).toBe('translate3d(120px, 80px, 0px)');
        expect(ghost.style.width).toBe('90px');
        expect(ghost.style.height).toBe('60px');
    });

    it('freezes the current presentation before a running projection is redirected', async () => {
        const ghost = createGhost();
        const targetBounds = new DOMRect(300, 200, 120, 90);
        const projection = startItemDropProjection(ghost, targetBounds, {
            durationMs: 1_000,
            reducedMotion: false,
        });

        await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        const movingBounds = ghost.getBoundingClientRect();
        projection.stopAtCurrentBounds();
        await projection.finished;
        const stoppedBounds = ghost.getBoundingClientRect();

        expect(stoppedBounds.left).toBeCloseTo(movingBounds.left, 0);
        expect(stoppedBounds.top).toBeCloseTo(movingBounds.top, 0);
        expect(stoppedBounds.left).toBeLessThan(targetBounds.left);
        expect(stoppedBounds.top).toBeLessThan(targetBounds.top);
    });
});
