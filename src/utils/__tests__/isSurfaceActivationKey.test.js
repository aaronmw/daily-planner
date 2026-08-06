import isSurfaceActivationKey from '../isSurfaceActivationKey';

describe('isSurfaceActivationKey', () => {
    const surface = {};

    it.each(['Enter', ' '])('accepts %p on the focused surface', key => {
        expect(
            isSurfaceActivationKey({
                currentTarget: surface,
                key,
                target: surface,
            })
        ).toBe(true);
    });

    it('ignores activation keys from controls inside the surface', () => {
        expect(
            isSurfaceActivationKey({
                currentTarget: surface,
                key: ' ',
                target: {},
            })
        ).toBe(false);
    });

    it('ignores other keys', () => {
        expect(
            isSurfaceActivationKey({
                currentTarget: surface,
                key: 'D',
                target: surface,
            })
        ).toBe(false);
    });
});
