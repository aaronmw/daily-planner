import {
    getListGridMetrics,
    getTaskEstimatedSize,
} from '../virtualization';

describe('virtual collection estimates', () => {
    it('estimates relative task rows from the shared timeline scale', () => {
        expect(
            getTaskEstimatedSize({
                durationMinutes: 60,
                hoursPerScreen: 6,
                relativeCardSizingEnabled: true,
                viewportHeight: 720,
            })
        ).toBeCloseTo(120);
    });

    it('uses the natural estimate when relative sizing is disabled', () => {
        expect(
            getTaskEstimatedSize({
                durationMinutes: 120,
                hoursPerScreen: 4,
                naturalSize: 45,
                relativeCardSizingEnabled: false,
                viewportHeight: 720,
            })
        ).toBe(45);
    });

    it('preserves three 2:3 portrait cards across the list grid', () => {
        expect(
            getListGridMetrics(800, {
                gap: 12.5,
                paddingInline: 25,
            })
        ).toEqual({
            cardHeight: 362.5,
            cardWidth: 241.66666666666666,
        });
    });
});
