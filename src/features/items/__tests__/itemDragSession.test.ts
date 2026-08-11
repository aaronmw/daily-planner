import { describe, expect, it } from 'vitest';
import * as currentSession from '../itemDragSession';

interface PointerDragSession {
    hasCrossedItemDragThreshold?: (
        startX: number,
        startY: number,
        currentX: number,
        currentY: number
    ) => boolean;
}

const session = currentSession as PointerDragSession;

describe('itemDragSession', () => {
    it('ignores pointer jitter but starts a deliberate card drag', () => {
        expect(session.hasCrossedItemDragThreshold).toBeTypeOf('function');

        expect(session.hasCrossedItemDragThreshold!(10, 10, 14, 14)).toBe(
            false
        );
        expect(session.hasCrossedItemDragThreshold!(10, 10, 18, 10)).toBe(true);
    });
});
