import React from 'react';
import MOTIVATIONAL_DESCRIPTORS from './copy/motivational-descriptors';
import Icon from './Icon';

const SIDEBAR_DEFAULT_WIDTH = '30vw';
const SIDEBAR_EXTENDED_WIDTH = '40vw';
const BORDER_RADIUS = '3px';
const BORDER_WIDTH = '1px';
const BULLET_SIZE = '10px';
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const GRID_UNIT = '25px';
const FONTS = {
    NORMAL: { LINE_HEIGHT: '1.6', SIZE: `calc(${GRID_UNIT} * 0.5)` },
    LARGE: { LINE_HEIGHT: '1.6', SIZE: `calc(${GRID_UNIT} * 0.75)` },
};
const HOURS_PER_SCREEN = 10;
const INTERACTION_ANIMATION_DURATION = 150;
const DEFAULT_FOCUS_ASSIST_ENABLED = true;
const DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED = true;
const DEFAULT_RELATIVE_CARD_SIZING_ENABLED = true;
const DEFAULT_THEME_MODE = 'SYSTEM';
const LIST_CARD_SPACING = `calc(${GRID_UNIT} * 0.5)`;
const LIST_CARD_WIDTH = `calc((100% - (${LIST_CARD_SPACING} * 2)) / 3)`;
const MIN_SLOT_HEIGHT = GRID_UNIT;
const ROUTE_TRANSITION_ANIMATION_DURATION = 250;
const THEME_MODES = ['SYSTEM', 'LIGHT', 'DARK'];
const TIMELINE_FROM = '6:00';
const TIMELINE_HOURS_PER_SCREEN_MAX = 24;
const TIMELINE_HOURS_PER_SCREEN_MIN = 4;
const TIMELINE_HOURS_PER_SCREEN_STEP = 1;
const TIMELINE_TO = '30:00';

const COPY = {};
COPY.MOTIVATIONAL_DESCRIPTORS = MOTIVATIONAL_DESCRIPTORS;
COPY.EMPTY_LABEL = '...label?';
COPY.EMPTY_NOTES = '...notes?';
COPY.EMPTY_TRASHED_LISTS = 'No Trashed Lists';
COPY.EMPTY_TRASHED_TASKS = 'No Trashed Tasks';
COPY.LABEL_FOR_LIST_MANAGER = 'Switch Lists';
COPY.LABEL_FOR_COLLAPSE_TASK_LIST = 'Collapse task list';
COPY.LABEL_FOR_EXPAND_TASK_LIST = 'Expand task list';
COPY.LABEL_FOR_RESTORING_LIST = 'Restore this List';
COPY.LABEL_FOR_RESTORING_TASK = 'Restore this Task';
COPY.LABEL_FOR_LIGHTING_MODE = 'Lighting Mode';
COPY.LABEL_FOR_OPTIONS = 'Options';
COPY.LABEL_FOR_EDITING_SETTINGS = 'Editing';
COPY.LABEL_FOR_FOCUS_ASSIST = 'Focus Assist';
COPY.LABEL_FOR_HIGHLIGHT_INCOMPLETE = 'Highlight incomplete';
COPY.LABEL_FOR_LIST_COLOR = 'Choose list color';
COPY.LABEL_FOR_RELATIVE_CARD_SIZING = 'Relative card sizing';
COPY.LABEL_FOR_TASK_DETAILS = 'Back to Task';
COPY.LABEL_FOR_TIMELINE = "Today's Schedule";
COPY.LABEL_FOR_TIMELINE_SETTINGS = 'Timeline';
COPY.LABEL_FOR_TIMELINE_ZOOM = 'Zoom';
COPY.LABEL_FOR_DELETED_ITEMS = 'Deleted items';
COPY.LABEL_FOR_TRASHED_LISTS = 'Trashed Lists';
COPY.LABEL_FOR_TRASHED_TASKS = 'Trashed Tasks';
COPY.LIGHTING_MODE_LABELS = {
    SYSTEM: 'System',
    LIGHT: 'Light',
    DARK: 'Dark',
};
COPY.CREATE_LIST_LABEL = 'Create List';
COPY.CREATE_TASK_LABEL = 'Create Task';
COPY.NEW_LIST_LABEL = 'New List';
COPY.NEW_TASK_LABEL = `New Task`;
COPY.NEW_TASK_NOTES = '';
COPY.TIPS = {
    BASICALLY:
        'Make lists of tasks. Every day, schedule your most important ones',
    CREATE_NEW_TASK: 'Press [N] to create a [N]ew task in the current list',
    DELETE_TASK: 'Press [T] to move the selected task to the [T]rash',
    EDIT_TASK: 'Press [E] to edit the selected task',
    MOVE_BETWEEN_LISTS:
        'Press [⌘]+[SHIFT]+[LEFT or RIGHT] to move between your lists',
    SELECT_NEXT_PREV_TASK:
        'Press [UP] or [DOWN] to select the previous and next unscheduled tasks in the active list',
    MOVE_TASK_BETWEEN_TASK_LIST_AND_TIMELINE:
        'Press [⌘]+[LEFT or RIGHT] to move the selected task to the TaskList or Timeline, respectively',
    SETTING_DURATION:
        'Press keys [1] to [6] to quickly adjust your time estimate for the selected task',
    TOGGLE_TASK_LIST:
        'Press [B] to show / hide the side[B]ar of unscheduled tasks',
    TOGGLE_DARK_MODE: 'Press [D] to cycle the lighting mode',
    TOGGLE_LIST_MANAGER: 'Press [L] to see your [L]ists',
};

export { COPY };

const TAILWIND_ACCENT_KEYS = [
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
];

const DEFAULT_ACCENT_KEY = TAILWIND_ACCENT_KEYS[0];

const LEGACY_ACCENT_BY_COLOR = {
    '#ff0000': 'red',
    '#d72127': 'red',
    '#d78821': 'orange',
    '#b9d721': 'lime',
    '#4bd721': 'green',
    '#21d764': 'emerald',
    '#21d7d1': 'teal',
    '#2170d7': 'sky',
    '#3f21d7': 'sky',
    '#ad21d7': 'red',
    '#d72194': 'red',
};

const toTitleCase = value =>
    value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');

const buildAccentPalette = accentKey => ({
    key: accentKey,
    label: toTitleCase(accentKey),
    value: `var(--color-${accentKey}-500)`,
    palette: {
        LIGHT: {
            PRIMARY: `var(--color-${accentKey}-600)`,
            BACKGROUND: 'var(--color-white)',
            SHADED: `var(--color-${accentKey}-50)`,
            TEXT: 'var(--color-slate-950)',
            TEXT_FADED: 'var(--color-slate-600)',
            BORDER: `var(--color-${accentKey}-200)`,
            DOTTED_LINE: `var(--color-${accentKey}-400)`,
            TIME_LINE_PRIMARY: 'var(--color-slate-600)',
            TIME_LINE_SECONDARY: 'var(--color-slate-600)',
            HIGH_CONTRAST_BACKGROUND: `var(--color-${accentKey}-500)`,
            HIGH_CONTRAST_TEXT: 'var(--color-white)',
            NEUTRAL_FOREGROUND: '#000000',
            NEUTRAL_BACKGROUND: '#ffffff',
            SHADOW: 'rgb(0 0 0 / 0.1)',
            TASK_BORDER: `color-mix(in oklab, var(--color-${accentKey}-500) 45%, transparent)`,
            TASK_BORDER_HOVER: `color-mix(in oklab, var(--color-${accentKey}-500) 55%, transparent)`,
            TASK_BORDER_ACTIVE: `var(--color-${accentKey}-600)`,
        },
        DARK: {
            PRIMARY: `var(--color-${accentKey}-400)`,
            BACKGROUND: '#000000',
            SHADED: `color-mix(in oklab, var(--color-${accentKey}-950) 48%, black)`,
            TEXT: 'var(--color-slate-100)',
            TEXT_FADED: 'var(--color-slate-400)',
            BORDER: `color-mix(in oklab, var(--color-${accentKey}-800) 58%, black)`,
            DOTTED_LINE: `var(--color-${accentKey}-300)`,
            TIME_LINE_PRIMARY: 'var(--color-slate-400)',
            TIME_LINE_SECONDARY: 'var(--color-slate-400)',
            HIGH_CONTRAST_BACKGROUND: `var(--color-${accentKey}-400)`,
            HIGH_CONTRAST_TEXT: 'var(--color-slate-950)',
            NEUTRAL_FOREGROUND: '#ffffff',
            NEUTRAL_BACKGROUND: '#000000',
            SHADOW: 'rgb(0 0 0 / 0.1)',
            TASK_BORDER: `color-mix(in oklab, var(--color-${accentKey}-400) 45%, transparent)`,
            TASK_BORDER_HOVER: `color-mix(in oklab, var(--color-${accentKey}-400) 55%, transparent)`,
            TASK_BORDER_ACTIVE: `var(--color-${accentKey}-400)`,
        },
    },
});

const ACCENT_SWATCHES = TAILWIND_ACCENT_KEYS.map(buildAccentPalette);
const ACCENT_BY_KEY = ACCENT_SWATCHES.reduce(
    (acc, swatch) => ({ ...acc, [swatch.key]: swatch }),
    {}
);

const getAccentKey = accentInput => {
    const input =
        accentInput && typeof accentInput === 'object'
            ? accentInput.accent_key || accentInput.color_code
            : accentInput;

    if (!input) {
        return DEFAULT_ACCENT_KEY;
    }

    const normalizedInput = String(input).toLowerCase();

    if (ACCENT_BY_KEY[normalizedInput]) {
        return normalizedInput;
    }

    return LEGACY_ACCENT_BY_COLOR[normalizedInput] || DEFAULT_ACCENT_KEY;
};

const getListAccentKey = list => getAccentKey(list);

const getNextThemeMode = themeMode => {
    const currentModeIndex = THEME_MODES.indexOf(themeMode);

    return currentModeIndex < 0
        ? THEME_MODES[0]
        : THEME_MODES[(currentModeIndex + 1) % THEME_MODES.length];
};

const PALETTE_VARIABLES = {
    BACKGROUND: '--planner-background',
    BORDER: '--planner-border',
    DOTTED_LINE: '--planner-dotted-line',
    HIGH_CONTRAST_BACKGROUND: '--planner-contrast',
    HIGH_CONTRAST_TEXT: '--planner-contrast-text',
    NEUTRAL_BACKGROUND: '--planner-neutral-background',
    NEUTRAL_FOREGROUND: '--planner-neutral-foreground',
    PRIMARY: '--planner-primary',
    SHADED: '--planner-shaded',
    SHADOW: '--planner-shadow',
    TASK_BORDER: '--planner-task-border',
    TASK_BORDER_ACTIVE: '--planner-task-border-active',
    TASK_BORDER_HOVER: '--planner-task-border-hover',
    TEXT: '--planner-text',
    TEXT_FADED: '--planner-text-faded',
};

const buildThemeStyle = (theme = 'LIGHT', accentInput = DEFAULT_ACCENT_KEY) => {
    const palette = buildPalette(theme, accentInput);

    return Object.keys(PALETTE_VARIABLES).reduce(
        (style, paletteKey) => ({
            ...style,
            [PALETTE_VARIABLES[paletteKey]]: palette[paletteKey],
        }),
        {}
    );
};

const INITIAL_LISTS = [
    {
        id: 1,
        accent_key: DEFAULT_ACCENT_KEY,
        isArchived: false,
        label: 'User Manual',
    },
];
const INITIAL_SELECTED_LIST_ID = (INITIAL_LISTS[0] || {}).id;

const INITIAL_TASKS = Object.keys(COPY.TIPS).map(tipId => {
    const label = COPY.TIPS[tipId];

    return {
        attachments: [],
        icon: '☝️',
        id: tipId,
        list_id: INITIAL_SELECTED_LIST_ID,
        label: label,
        isComplete: false,
        notes: '',
        scheduled: false,
        duration_minutes: 30,
        scheduled_time: '9:00',
    };
});

const INITIAL_SELECTED_TASK_ID = (INITIAL_TASKS[0] || {}).id;

const buildPalette = (theme = 'LIGHT', accentInput = DEFAULT_ACCENT_KEY) => {
    const themeName = theme === 'LIGHT' ? 'LIGHT' : 'DARK';
    const accentKey = getAccentKey(accentInput);
    const accent = ACCENT_BY_KEY[accentKey];

    return {
        ...accent.palette[themeName],
        ACCENT_KEY: accentKey,
        SWATCH: accent.value,
    };
};

const ICON_PACKS = {
    EMOJI: {
        COLOR_PICKER: '🎨',
        DARK_MODE: '🌚',
        END_ZONE: '🗑',
        LEFT: '👈',
        LIGHT_MODE: '🌞',
        LIST_MANAGER: '📚',
        RIGHT: '👉',
        TASK_DETAILS: '📌',
        TIP: '☝️',
    },
    FONT_AWESOME: {
        COLLAPSE_TASK_LIST: 'arrow-left-to-line',
        COLOR_PICKER: 'palette',
        CHECK: 'check',
        DARK_MODE: 'moon',
        END_ZONE: 'trash-alt',
        EXPAND_TASK_LIST: 'arrow-right-from-line',
        LEFT: 'long-arrow-left',
        LIGHT_MODE: 'sun',
        LIST_MANAGER: 'book',
        OPTIONS: 'cog',
        PAPERCLIP: 'paperclip',
        RIGHT: 'long-arrow-right',
        SPINNER: 'spinner-third',
        SYSTEM_MODE: 'desktop',
        TASK_DETAILS: 'thumbtack',
        TIP: 'gem',
        WARNING: 'triangle-exclamation',
    },
};

Object.keys(ICON_PACKS.FONT_AWESOME).forEach(key => {
    const ICON_NAME = ICON_PACKS.FONT_AWESOME[key];
    ICON_PACKS.FONT_AWESOME[key] = <Icon iconName={ICON_NAME} />;
});

const ICONS = ICON_PACKS.FONT_AWESOME;

ICONS.TASK_DEFAULT = '📌';

export {
    ACCENT_SWATCHES,
    BORDER_RADIUS,
    BORDER_WIDTH,
    buildPalette,
    buildThemeStyle,
    BULLET_SIZE,
    DEFAULT_FOCUS_ASSIST_ENABLED,
    DEFAULT_HIGHLIGHT_INCOMPLETE_SENTENCES_ENABLED,
    DEFAULT_THEME_MODE,
    DEFAULT_RELATIVE_CARD_SIZING_ENABLED,
    DEFAULT_ACCENT_KEY,
    DURATION_OPTIONS,
    FONTS,
    getAccentKey,
    getListAccentKey,
    getNextThemeMode,
    GRID_UNIT,
    HOURS_PER_SCREEN,
    ICONS,
    INTERACTION_ANIMATION_DURATION,
    INITIAL_LISTS,
    INITIAL_SELECTED_LIST_ID,
    INITIAL_SELECTED_TASK_ID,
    INITIAL_TASKS,
    LIST_CARD_SPACING,
    LIST_CARD_WIDTH,
    MIN_SLOT_HEIGHT,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_EXTENDED_WIDTH,
    THEME_MODES,
    TIMELINE_FROM,
    TIMELINE_HOURS_PER_SCREEN_MAX,
    TIMELINE_HOURS_PER_SCREEN_MIN,
    TIMELINE_HOURS_PER_SCREEN_STEP,
    TIMELINE_TO,
};
