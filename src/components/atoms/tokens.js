import {
    getLuminance,
    readableColor,
    setLightness,
    transparentize,
} from 'polished';
import React from 'react';
import MOTIVATIONAL_DESCRIPTORS from './copy/motivational-descriptors';
import Icon from './Icon';

export const SIDEBAR_DEFAULT_WIDTH = '30vw';
export const SIDEBAR_EXTENDED_WIDTH = '40vw';
export const BORDER_RADIUS = '3px';
export const BORDER_WIDTH = '1px';
export const BULLET_SIZE = '10px';
export const COLOR_PICKER_HEIGHT = '150px';
export const COLOR_PICKER_WIDTH = '200px';
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
export const GRID_UNIT = '25px';
export const FONTS = {
    NORMAL: { LINE_HEIGHT: '1.4em', SIZE: `calc(${GRID_UNIT} * 0.5)` },
    LARGE: { LINE_HEIGHT: '1.4em', SIZE: `calc(${GRID_UNIT} * 0.75)` },
};
export const HOURS_PER_SCREEN = 10;
export const LIST_CARD_HEIGHT = `calc(${GRID_UNIT} * 8)`;
export const LIST_CARD_SPACING = `calc(${GRID_UNIT} * 0.5)`;
export const LIST_CARD_WIDTH = `calc((100% - (${LIST_CARD_SPACING} * 2)) / 3)`;
export const MIN_SLOT_HEIGHT = GRID_UNIT;
export const ROUTE_TRANSITION_ANIMATION_DURATION = 250;
export const TIMELINE_FROM = '6:00';
export const TIMELINE_TO = '30:00';
export const UNIFIED_TRANSITION = 'transition: all 0.15s ease-in-out';

const COPY = {};
COPY.MOTIVATIONAL_DESCRIPTORS = MOTIVATIONAL_DESCRIPTORS;
COPY.EMPTY_LABEL = '...label?';
COPY.EMPTY_NOTES = '...notes?';
COPY.EMPTY_TRASHED_LISTS = 'No Trashed Lists';
COPY.EMPTY_TRASHED_TASKS = 'No Trashed Tasks';
COPY.LABEL_FOR_LIST_MANAGER = 'Switch Lists';
COPY.LABEL_FOR_RESTORING_LIST = 'Restore this List';
COPY.LABEL_FOR_RESTORING_TASK = 'Restore this Task';
COPY.LABEL_FOR_TASK_DETAILS = 'Back to Task';
COPY.LABEL_FOR_TIMELINE = "Today's Schedule";
COPY.LABEL_FOR_TRASHED_LISTS = 'Trashed Lists';
COPY.LABEL_FOR_TRASHED_TASKS = 'Trashed Tasks';
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
    TOGGLE_DARK_MODE: 'Press [D] to toggle [D]ark Mode',
    TOGGLE_LIST_MANAGER: 'Press [L] to see your [L]ists',
};

export { COPY };

export const INITIAL_LISTS = [
    {
        id: 1,
        color_code: 0,
        isArchived: false,
        label: 'User Manual',
    },
];
export const INITIAL_SELECTED_LIST_ID = (INITIAL_LISTS[0] || {}).id;

export const INITIAL_TASKS = Object.keys(COPY.TIPS).map(tipId => {
    const label = COPY.TIPS[tipId];

    return {
        icon: '☝️',
        id: tipId,
        list_id: INITIAL_SELECTED_LIST_ID,
        label: label,
        isComplete: false,
        notes: '',
        scheduled: false,
        scheduled_minutes: 30,
        scheduled_time: '9:00',
    };
});

export const INITIAL_SELECTED_TASK_ID = (INITIAL_TASKS[0] || {}).id;

export const PRIMARY_COLORS = [
    '#FFB83D',
    '#E5FF3D',
    '#84FF3D',
    '#3DFF57',
    '#3DFFB8',
    '#3DE5FF',
    '#3D84FF',
    '#573DFF',
    '#B83DFF',
    '#FF3DE5',
    '#FF3D84',
    '#FF573D',
];

export const buildPalette = (theme = 'LIGHT', colorCode = '#0000FF') => {
    const THEME = {};

    THEME.PRIMARY =
        PRIMARY_COLORS.find(primaryColor => primaryColor === colorCode) ||
        PRIMARY_COLORS[0];

    const luminanceOfPrimaryColor = getLuminance(THEME.PRIMARY);

    if (theme === 'DARK') {
        THEME.PRIMARY = setLightness(
            luminanceOfPrimaryColor < 0.5 ? 0.85 : 0.75,
            THEME.PRIMARY
        );

        THEME.BACKGROUND = '#000000';
        THEME.SHADED = setLightness(0.1, THEME.PRIMARY);
        THEME.TEXT = setLightness(0.95, THEME.PRIMARY);
        THEME.TEXT_FADED = setLightness(0.75, THEME.PRIMARY);
        THEME.BORDER = setLightness(0.2, THEME.PRIMARY);
        THEME.BORDER_FADED = THEME.TEXT_FADED;
        THEME.NEUTRAL_FOREGROUND = '#ffffff';
        THEME.NEUTRAL_BACKGROUND = '#000000';
    }

    if (theme === 'LIGHT') {
        THEME.PRIMARY = setLightness(
            luminanceOfPrimaryColor < 0.5 ? 0.8 : 0.65,
            THEME.PRIMARY
        );

        THEME.BACKGROUND = '#ffffff';
        THEME.SHADED = setLightness(0.95, THEME.PRIMARY);
        THEME.TEXT = setLightness(0.05, THEME.PRIMARY);
        THEME.TEXT_FADED = setLightness(0.4, THEME.PRIMARY);
        THEME.BORDER = setLightness(
            luminanceOfPrimaryColor < 0.5 ? 0.85 : 0.6,
            THEME.PRIMARY
        );
        THEME.BORDER_FADED = transparentize(0.5, THEME.TEXT_FADED);
        THEME.NEUTRAL_FOREGROUND = '#000000';
        THEME.NEUTRAL_BACKGROUND = '#ffffff';
    }

    THEME.HIGH_CONTRAST_BACKGROUND = THEME.PRIMARY;
    THEME.HIGH_CONTRAST_TEXT = readableColor(THEME.HIGH_CONTRAST_BACKGROUND);
    THEME.SHADOW = transparentize(0.9, '#000000');
    THEME.TASK_BORDER = transparentize(0.5, THEME.PRIMARY);
    THEME.TASK_BORDER_HOVER = transparentize(0.5, THEME.PRIMARY);
    THEME.TASK_BORDER_ACTIVE = THEME.PRIMARY;

    return THEME;
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
        COLOR_PICKER: 'palette',
        DARK_MODE: 'moon-stars',
        END_ZONE: 'trash-alt',
        LEFT: 'long-arrow-left',
        LIGHT_MODE: 'sun',
        LIST_MANAGER: 'book',
        RIGHT: 'long-arrow-right',
        TASK_DETAILS: 'thumbtack',
        TIP: 'gem',
    },
};

Object.keys(ICON_PACKS.FONT_AWESOME).forEach(key => {
    const ICON_NAME = ICON_PACKS.FONT_AWESOME[key];
    ICON_PACKS.FONT_AWESOME[key] = (
        <Icon iconName={ICON_NAME} styleName="solid" />
    );
});

const ICONS = ICON_PACKS.FONT_AWESOME;

ICONS.TASK_DEFAULT = '📌';

export { ICONS };
