import type { CSSProperties } from 'react';
import type { AccentKey, ThemeMode } from '../../core/domain/types';
import accentColors from '../../core/domain/accent-colors.json';

type NeutralPaletteKey = 'mauve' | 'mist' | 'olive' | 'slate' | 'taupe';
type NeutralShade =
    50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

interface PlannerColorTheme {
    neutral: NeutralPaletteKey;
    primary: string;
    tint: string;
}

const colorThemes: Record<AccentKey, PlannerColorTheme> = {
    amber: {
        neutral: 'taupe',
        primary: accentColors.amber,
        tint: '#fbbf24',
    },
    cyan: {
        neutral: 'mist',
        primary: accentColors.cyan,
        tint: '#22d3ee',
    },
    emerald: {
        neutral: 'mist',
        primary: accentColors.emerald,
        tint: '#34d399',
    },
    green: {
        neutral: 'olive',
        primary: accentColors.green,
        tint: '#4ade80',
    },
    lime: {
        neutral: 'olive',
        primary: accentColors.lime,
        tint: '#a3e635',
    },
    orange: {
        neutral: 'taupe',
        primary: accentColors.orange,
        tint: '#fb923c',
    },
    red: {
        neutral: 'mauve',
        primary: accentColors.red,
        tint: '#fb7185',
    },
    sky: {
        neutral: 'slate',
        primary: accentColors.sky,
        tint: '#38bdf8',
    },
    teal: {
        neutral: 'mist',
        primary: accentColors.teal,
        tint: '#2dd4bf',
    },
    yellow: {
        neutral: 'olive',
        primary: accentColors.yellow,
        tint: '#facc15',
    },
};

const neutralColor = (
    palette: NeutralPaletteKey,
    shade: NeutralShade
): string => `var(--color-${palette}-${shade})`;

export const accentColor = (accentKey: AccentKey): string =>
    colorThemes[accentKey].primary;

export const shadedColor = (accentKey: AccentKey): string =>
    `color-mix(in srgb, ${colorThemes[accentKey].tint} 10%, transparent)`;

export const resolveTheme = (
    mode: ThemeMode,
    systemPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches
): 'light' | 'dark' => {
    if (mode === 'light' || mode === 'dark') return mode;
    return systemPrefersDark ? 'dark' : 'light';
};

type PlannerThemeStyle = CSSProperties & Record<`--planner-${string}`, string>;

export const buildThemeStyle = (
    theme: 'light' | 'dark',
    accentKey: AccentKey = 'sky'
): PlannerThemeStyle => {
    const colorTheme = colorThemes[accentKey];
    const accent = colorTheme.primary;
    const neutral = (shade: NeutralShade) =>
        neutralColor(colorTheme.neutral, shade);
    const dark = theme === 'dark';
    return {
        '--planner-background': dark ? neutral(950) : neutral(50),
        '--planner-border': accent,
        '--planner-contrast': accent,
        '--planner-contrast-text': '#ffffff',
        '--planner-control-thumb': dark ? neutral(200) : neutral(50),
        '--planner-control-thumb-border': dark ? neutral(600) : neutral(300),
        '--planner-control-track': dark ? neutral(700) : neutral(200),
        '--planner-dotted-line': accent,
        '--planner-neutral-background': dark ? neutral(900) : neutral(100),
        '--planner-neutral-foreground': dark ? neutral(200) : neutral(900),
        '--planner-primary': dark ? neutral(400) : neutral(600),
        '--planner-shaded': shadedColor(accentKey),
        '--planner-item-border': accent,
        '--planner-item-border-active': accent,
        '--planner-item-border-hover': accent,
        '--planner-item-card-text': neutral(600),
        '--planner-item-card-text-active': neutral(950),
        '--planner-keyboard-key-cap': dark ? neutral(800) : neutral(200),
        '--planner-keyboard-key-face': dark ? neutral(700) : neutral(50),
        '--planner-keyboard-key-label': dark ? neutral(400) : neutral(500),
        '--planner-text': dark ? neutral(50) : neutral(950),
        '--planner-text-faded': dark ? neutral(400) : neutral(600),
    };
};
