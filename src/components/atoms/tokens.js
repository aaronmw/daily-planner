import { darken, lighten, setLightness, transparentize } from 'polished';
import MOTIVATIONAL_DESCRIPTORS from './copy/motivational-descriptors';

export const BORDER_RADIUS = '3px';
export const BORDER_WIDTH = '1px';
export const BULLET_SIZE = '10px';
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
export const GRID_UNIT = '30px';
export const FONTS = {
    NORMAL: { LINE_HEIGHT: '1.4em', SIZE: `calc(${GRID_UNIT} * 0.5)` },
    LARGE: { LINE_HEIGHT: '1.4em', SIZE: `calc(${GRID_UNIT} * 0.75)` },
};
export const HOURS_PER_SCREEN = 10;
export const INITIAL_LISTS = [
    {
        id: 1,
        isArchived: false,
        label: 'Default List',
    },
];
export const INITIAL_SELECTED_LIST_ID = (INITIAL_LISTS[0] || {}).id;
export const INITIAL_TASKS = [];
export const INITIAL_SELECTED_TASK_ID = (INITIAL_TASKS[0] || {}).id;
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
COPY.LABEL_FOR_LIST_MANAGER = 'Switch Lists';
COPY.LABEL_FOR_TASK_DETAILS = 'Back to Task';
COPY.CREATE_LIST_LABEL = 'Create List';
COPY.CREATE_TASK_LABEL = 'Create Task';
COPY.NEW_LIST_LABEL = 'New List';
COPY.NEW_TASK_LABEL = `New Task`;
COPY.NEW_TASK_NOTES = '';
COPY.TIPS = {
    CREATE_NEW_TASK: 'Press [N] to create a [N]ew task in the current list',
    DELETE_TASK: 'Press [T] to move the selected task to the [T]rash',
    MOVE_TASK_BETWEEN_BACKLOG_AND_TIMELINE:
        'Press [⌘]+[LEFT or RIGHT] to move the selected task to the Backlog or Timeline, respectively',
    MOVE_BETWEEN_LISTS:
        'Press [⌘]+[SHIFT]+[LEFT or RIGHT] to move between your lists',
    PREFIX: 'Tip ☝️: ',
    SETTING_DURATION:
        'Press keys [1] to [6] to quickly adjust your time estimate for the selected task',
    TOGGLE_BACKLOG:
        'Press [B] to show / hide the side[B]ar of unscheduled tasks',
    TOGGLE_DARK_MODE: 'Press [D] to toggle [D]ark Mode',
    TOGGLE_LIST_MANAGER: 'Press [L] to see your [L]ists',
};

export { COPY };

const PRIMARY = '#0094FF';

const DARK = {};
DARK.PRIMARY = PRIMARY;
DARK.PRIMARY_FADED = darken(0.2, DARK.PRIMARY);
DARK.BACKGROUND = '#00010F';
DARK.HIGH_CONTRAST_BACKGROUND = DARK.PRIMARY;
DARK.HIGH_CONTRAST_TEXT = '#FFFFFF';
DARK.SHADED = lighten(0.15, DARK.BACKGROUND);
DARK.SHADOW = transparentize(0.95, DARK.BACKGROUND);
DARK.TEXT = setLightness(0.85, DARK.PRIMARY);
DARK.TEXT_FADED = setLightness(0.4, DARK.TEXT);
DARK.TASK_BORDER = transparentize(0.5, DARK.PRIMARY);
DARK.TASK_BORDER_HOVER = transparentize(0.5, DARK.PRIMARY);
DARK.TASK_BORDER_ACTIVE = DARK.PRIMARY;
DARK.BORDER = transparentize(0, DARK.TEXT_FADED);
DARK.BORDER_FADED = transparentize(0.5, DARK.BORDER);

const LIGHT = {};
LIGHT.PRIMARY = PRIMARY;
LIGHT.PRIMARY_FADED = lighten(0.2, LIGHT.PRIMARY);
LIGHT.BACKGROUND = '#FFFFFF';
LIGHT.HIGH_CONTRAST_BACKGROUND = LIGHT.PRIMARY;
LIGHT.HIGH_CONTRAST_TEXT = LIGHT.BACKGROUND;
LIGHT.SHADED = setLightness(0.95, LIGHT.PRIMARY);
LIGHT.SHADOW = transparentize(0.8, setLightness(0.25, LIGHT.PRIMARY));
LIGHT.TEXT = setLightness(0.15, LIGHT.PRIMARY);
LIGHT.TEXT_FADED = transparentize(0.4, LIGHT.TEXT);
LIGHT.TASK_BORDER = transparentize(0.5, LIGHT.PRIMARY);
LIGHT.TASK_BORDER_HOVER = transparentize(0.5, LIGHT.PRIMARY);
LIGHT.TASK_BORDER_ACTIVE = LIGHT.PRIMARY;
LIGHT.BORDER = transparentize(0.75, LIGHT.TEXT);
LIGHT.BORDER_FADED = transparentize(0.5, LIGHT.BORDER);

export const COLORS = {
    DARK,
    LIGHT,
};

export const ICONS = {
    DARK_MODE: '🌚',
    END_ZONE: '🗑',
    LEFT: '👈',
    LIGHT_MODE: '🌞',
    LIST_MANAGER: '📚',
    RIGHT: '👉',
    TASK_DEFAULT: '📌',
    TASK_DETAILS: '📌',
};
