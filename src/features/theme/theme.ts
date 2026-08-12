import type { CSSProperties } from 'react';
import type { AccentKey, ThemeMode } from '../../core/domain/types';
import accentColors from '../../core/domain/accent-colors.json';

const accents: Record<AccentKey, string> = accentColors;

const accentTints: Record<AccentKey, string> = {
    amber: '#fbbf24',
    cyan: '#22d3ee',
    emerald: '#34d399',
    green: '#4ade80',
    lime: '#a3e635',
    orange: '#fb923c',
    red: '#fb7185',
    sky: '#38bdf8',
    teal: '#2dd4bf',
    yellow: '#facc15',
};

export const accentColor = (accentKey: AccentKey): string => accents[accentKey];

export const shadedColor = (accentKey: AccentKey): string =>
    `color-mix(in srgb, ${accentTints[accentKey]} 10%, transparent)`;

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
    const accent = accentColor(accentKey);
    const dark = theme === 'dark';
    return {
        '--planner-background': dark ? '#000000' : '#ffffff',
        '--planner-border': accent,
        '--planner-contrast': accent,
        '--planner-contrast-text': dark ? '#000000' : '#ffffff',
        '--planner-dotted-line': accent,
        '--planner-neutral-background': dark ? '#080808' : '#f8fafc',
        '--planner-neutral-foreground': dark ? '#e2e8f0' : '#0f172a',
        '--planner-primary': dark ? '#94a3b8' : '#475569',
        '--planner-shaded': shadedColor(accentKey),
        '--planner-item-border': accent,
        '--planner-item-border-active': accent,
        '--planner-item-border-hover': accent,
        '--planner-keyboard-key-tint': dark ? '#0f172a' : '#f1f5f9',
        '--planner-text': dark ? '#f8fafc' : '#020617',
        '--planner-text-faded': dark ? '#94a3b8' : '#475569',
    };
};
