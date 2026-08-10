import type { CSSProperties } from 'react';
import type { AccentKey, ThemeMode } from '../../core/domain/types';

const accents: Record<AccentKey, string> = {
    amber: '#f59e0b',
    cyan: '#06b6d4',
    emerald: '#10b981',
    green: '#22c55e',
    lime: '#84cc16',
    orange: '#f97316',
    red: '#f43f5e',
    sky: '#0ea5e9',
    teal: '#14b8a6',
    yellow: '#eab308',
};

export const accentColor = (accentKey: AccentKey): string => accents[accentKey];

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
        '--planner-shaded': dark ? '#030303' : '#f8fafc',
        '--planner-item-border': accent,
        '--planner-item-border-active': accent,
        '--planner-item-border-hover': accent,
        '--planner-keyboard-key-tint': dark ? '#0f172a' : '#f1f5f9',
        '--planner-text': dark ? '#f8fafc' : '#020617',
        '--planner-text-faded': dark ? '#94a3b8' : '#475569',
    };
};
