import {
    ACCENT_SWATCHES,
    buildThemeStyle,
    DEFAULT_ACCENT_KEY,
    DEFAULT_FOCUS_ASSIST_ENABLED,
    DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED,
    DEFAULT_RELATIVE_CARD_SIZING_ENABLED,
    getAccentKey,
    getListAccentKey,
    getNextThemeMode,
    INITIAL_TASKS,
} from '../tokens';

describe('Tailwind-backed theme tokens', () => {
    it('exports the planned Tailwind accent set in picker order', () => {
        expect(ACCENT_SWATCHES.map(swatch => swatch.key)).toEqual([
            'red',
            'orange',
            'amber',
            'yellow',
            'lime',
            'green',
            'emerald',
            'teal',
            'cyan',
            'sky',
        ]);
    });

    it('normalizes legacy hex colors to Tailwind accent keys', () => {
        expect(getAccentKey('#d78821')).toBe('orange');
        expect(getAccentKey('#21d764')).toBe('emerald');
        expect(getListAccentKey({ color_code: '#21d7d1' })).toBe('teal');
    });

    it('prefers new accent keys and falls back safely', () => {
        expect(
            getListAccentKey({ accent_key: 'sky', color_code: '#d72127' })
        ).toBe('sky');
        expect(getAccentKey('not-a-tailwind-color')).toBe(DEFAULT_ACCENT_KEY);
        expect(getListAccentKey({})).toBe(DEFAULT_ACCENT_KEY);
    });

    it('builds light and dark runtime CSS variables from Tailwind colors', () => {
        expect(buildThemeStyle('LIGHT', 'teal')).toMatchObject({
            '--planner-background': 'var(--color-white)',
            '--planner-primary': 'var(--color-teal-600)',
            '--planner-contrast': 'var(--color-teal-500)',
        });

        expect(buildThemeStyle('DARK', { accent_key: 'sky' })).toMatchObject({
            '--planner-background': '#000000',
            '--planner-primary': 'var(--color-sky-400)',
            '--planner-contrast': 'var(--color-sky-400)',
        });
    });

    it('uses duration_minutes as the canonical task duration', () => {
        expect(INITIAL_TASKS.length).toBeGreaterThan(0);
        INITIAL_TASKS.forEach(task => {
            expect(task.attachments).toEqual([]);
            expect(task.duration_minutes).toBe(30);
            expect(task).not.toHaveProperty('scheduled_minutes');
        });
    });

    it('enables relative card sizing by default', () => {
        expect(DEFAULT_RELATIVE_CARD_SIZING_ENABLED).toBe(true);
    });

    it('enables sentence-aware editing preferences by default', () => {
        expect(DEFAULT_FOCUS_ASSIST_ENABLED).toBe(true);
        expect(DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED).toBe(true);
    });

    it('cycles lighting modes in menu order', () => {
        expect(getNextThemeMode('SYSTEM')).toBe('LIGHT');
        expect(getNextThemeMode('LIGHT')).toBe('DARK');
        expect(getNextThemeMode('DARK')).toBe('SYSTEM');
        expect(getNextThemeMode('invalid')).toBe('SYSTEM');
    });
});
