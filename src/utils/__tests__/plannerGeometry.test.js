import {
    getAnchoredScrollTop,
    getCardSizingMode,
    getDurationHeight,
    getMinuteHeightCss,
    getPixelsPerMinute,
    snapToDevicePixel,
} from '../plannerGeometry';

describe('planner geometry', () => {
    it.each([4, 10, 24])(
        'keeps duration heights proportional at %s hours per screen',
        hoursPerScreen => {
            const pixelsPerMinute = getPixelsPerMinute(720, hoursPerScreen);

            expect(getDurationHeight(30, pixelsPerMinute)).toBeCloseTo(
                720 / (hoursPerScreen * 2)
            );
            expect(getDurationHeight(60, pixelsPerMinute)).toBeCloseTo(
                getDurationHeight(30, pixelsPerMinute) * 2
            );
        }
    );

    it('preserves the top visible minute when zoom changes', () => {
        const currentPixelsPerMinute = getPixelsPerMinute(720, 12);
        const nextPixelsPerMinute = getPixelsPerMinute(720, 6);
        const currentScrollTop = currentPixelsPerMinute * 180;

        expect(
            getAnchoredScrollTop(
                currentScrollTop,
                currentPixelsPerMinute,
                nextPixelsPerMinute
            )
        ).toBeCloseTo(nextPixelsPerMinute * 180);
    });

    it('uses natural sizing only for non-timeline cards when disabled', () => {
        expect(getCardSizingMode(true, 'collection')).toBe('relative');
        expect(getCardSizingMode(false, 'collection')).toBe('natural');
        expect(getCardSizingMode(false, 'timeline')).toBe('relative');
    });

    it('creates one shared CSS minute scale for a zoom level', () => {
        expect(getMinuteHeightCss(6)).toBe(
            'calc((100dvh - var(--spacing-grid)) / 360)'
        );
    });

    it('aligns virtual row positions to physical display pixels', () => {
        expect(snapToDevicePixel(144.5, 1)).toBe(145);
        expect(snapToDevicePixel(144.5, 2)).toBe(144.5);
        expect(snapToDevicePixel(144.375, 2)).toBe(144.5);
    });
});
