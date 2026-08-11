import { describe, expect, it } from 'vitest';
import {
    createPlannerItem,
    createPlannerList,
} from '../../../core/domain/factories';
import {
    areActiveItemDropsEqual,
    resolveRegisteredItemDrop,
    type ItemDropTarget,
} from '../itemDropTargets';

describe('resolveRegisteredItemDrop', () => {
    it('returns the first registered target that accepts the pointer', () => {
        const list = createPlannerList();
        const item = createPlannerItem({ listId: list.id });
        const acceptedPreview = { kind: 'timeline' as const, minute: 615 };
        const targets: ItemDropTarget[] = [
            {
                commit: () => undefined,
                getPreviewBounds: () => null,
                id: 'items',
                resolve: () => null,
            },
            {
                commit: () => undefined,
                getPreviewBounds: () => null,
                id: 'timeline',
                resolve: () => acceptedPreview,
            },
        ];

        expect(
            resolveRegisteredItemDrop(
                targets,
                { clientX: 20, clientY: 30, grabRatioY: 0.5 },
                item
            )
        ).toEqual({ preview: acceptedPreview, targetId: 'timeline' });
    });

    it('compares typed previews without treating pointer movement as a change', () => {
        expect(
            areActiveItemDropsEqual(
                {
                    preview: { kind: 'timeline', minute: 615 },
                    targetId: 'timeline',
                },
                {
                    preview: { kind: 'timeline', minute: 615 },
                    targetId: 'timeline',
                }
            )
        ).toBe(true);
        expect(
            areActiveItemDropsEqual(
                {
                    preview: { kind: 'timeline', minute: 615 },
                    targetId: 'timeline',
                },
                {
                    preview: { kind: 'timeline', minute: 620 },
                    targetId: 'timeline',
                }
            )
        ).toBe(false);
    });
});
