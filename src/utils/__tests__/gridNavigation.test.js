import {
    getGridNavigationTargetIndex,
    isGridNavigationEvent,
    isPlainGridNavigationKeyEvent,
} from '../gridNavigation';

describe('grid keyboard navigation', () => {
    it('clamps downward movement to the last card in an incomplete row', () => {
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 1,
                direction: 'ArrowDown',
                itemCount: 4,
            })
        ).toBe(3);
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 2,
                direction: 'ArrowDown',
                itemCount: 4,
            })
        ).toBe(3);
    });

    it('preserves the column when moving vertically through complete rows', () => {
        expect(
            getGridNavigationTargetIndex({
                columnCount: 5,
                currentIndex: 2,
                direction: 'ArrowDown',
                itemCount: 10,
            })
        ).toBe(7);
        expect(
            getGridNavigationTargetIndex({
                columnCount: 5,
                currentIndex: 7,
                direction: 'ArrowUp',
                itemCount: 10,
            })
        ).toBe(2);
    });

    it('clamps upward movement to the available card in the previous row', () => {
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 3,
                direction: 'ArrowUp',
                itemCount: 4,
            })
        ).toBe(0);
    });

    it('moves sequentially left and right without wrapping', () => {
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 2,
                direction: 'ArrowRight',
                itemCount: 4,
            })
        ).toBe(3);
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 3,
                direction: 'ArrowLeft',
                itemCount: 4,
            })
        ).toBe(2);
    });

    it('stops at the outer grid boundaries', () => {
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 0,
                direction: 'ArrowLeft',
                itemCount: 4,
            })
        ).toBeNull();
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 0,
                direction: 'ArrowUp',
                itemCount: 4,
            })
        ).toBeNull();
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 3,
                direction: 'ArrowRight',
                itemCount: 4,
            })
        ).toBeNull();
        expect(
            getGridNavigationTargetIndex({
                columnCount: 3,
                currentIndex: 3,
                direction: 'ArrowDown',
                itemCount: 4,
            })
        ).toBeNull();
    });

    it('handles only plain arrow keys from the card navigation target', () => {
        const navigationTarget = document.createElement('div');
        const input = document.createElement('input');
        const nestedButton = document.createElement('button');
        navigationTarget.append(input, nestedButton);
        const event = {
            altKey: false,
            ctrlKey: false,
            key: 'ArrowDown',
            metaKey: false,
            shiftKey: false,
            target: navigationTarget,
        };

        expect(isPlainGridNavigationKeyEvent(event)).toBe(true);
        expect(
            isPlainGridNavigationKeyEvent({ ...event, ctrlKey: true })
        ).toBe(false);
        expect(
            isPlainGridNavigationKeyEvent({ ...event, key: 'Enter' })
        ).toBe(false);
        expect(isGridNavigationEvent(event, navigationTarget)).toBe(true);
        expect(
            isGridNavigationEvent({ ...event, metaKey: true }, navigationTarget)
        ).toBe(false);
        expect(
            isGridNavigationEvent({ ...event, shiftKey: true }, navigationTarget)
        ).toBe(false);
        expect(
            isGridNavigationEvent({ ...event, target: input }, navigationTarget)
        ).toBe(false);
        expect(
            isGridNavigationEvent(
                { ...event, target: nestedButton },
                navigationTarget
            )
        ).toBe(false);
        expect(
            isGridNavigationEvent(
                { ...event, key: 'Enter' },
                navigationTarget
            )
        ).toBe(false);
    });
});
