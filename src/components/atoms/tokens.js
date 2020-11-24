import { darken, lighten, rgba, setLightness, transparentize } from 'polished';

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
export const MIN_SLOT_HEIGHT = GRID_UNIT;
export const ROUTE_TRANSITION_ANIMATION_DURATION = 250;
export const TIMELINE_FROM = '8:00';
export const TIMELINE_TO = '20:00';
export const UNIFIED_TRANSITION = 'transition: all 0.15s ease-in-out';

const COPY = {};
COPY.MOTIVATIONAL_DESCRIPTORS = [
    'Adorable',
    'Adventurous',
    'Amazing',
    'Ambitious',
    'Awesome',
    'Beautiful',
    'Bold',
    'Bright',
    'Charming',
    'Clean',
    'Colourful',
    'Cute',
    'Dashing',
    'Elegant',
    'Excellent',
    'Exciting',
    'Fabulous',
    'Fantastic',
    'Fresh',
    'Gorgeous',
    'Happy',
    'Important',
    'Incredible',
    'Neat',
    'Outstanding',
    'Scrappy',
    'Sleek',
    'Special',
    'Splendid',
    'Super',
    'Thoughtful',
    'Wonderful',
];
COPY.EMPTY_LABEL = '...label?';
COPY.EMPTY_NOTES = '...notes?';
COPY.NAME_OF_LIST_MANAGER = 'All Lists';
COPY.NAME_OF_TASK_DETAILS = 'Task Deets';
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
DARK.BACKGROUND = '#000209';
DARK.HIGH_CONTRAST_BACKGROUND = DARK.PRIMARY;
DARK.HIGH_CONTRAST_TEXT = '#FFFFFF';
DARK.BORDER_HOVER = setLightness(0.5, PRIMARY);
DARK.BORDER_IDLE = setLightness(0.3, PRIMARY);
DARK.SHADED = lighten(0.1, DARK.BACKGROUND);
DARK.SHADOW = transparentize(0.95, DARK.BACKGROUND);
DARK.TEXT = setLightness(0.85, DARK.PRIMARY);
DARK.TEXT_FADED = setLightness(0.4, DARK.TEXT);
DARK.BORDER_NEUTRAL = setLightness(0.15, DARK.TEXT);

const LIGHT = {};
LIGHT.PRIMARY = PRIMARY;
LIGHT.PRIMARY_FADED = lighten(0.2, LIGHT.PRIMARY);
LIGHT.BACKGROUND = '#FFFFFF';
LIGHT.HIGH_CONTRAST_BACKGROUND = LIGHT.PRIMARY;
LIGHT.HIGH_CONTRAST_TEXT = LIGHT.BACKGROUND;
LIGHT.BORDER_HOVER = rgba('#0094FF', 0.5);
LIGHT.BORDER_IDLE = rgba('#0094FF', 0.3);
LIGHT.SHADED = setLightness(0.95, LIGHT.PRIMARY);
LIGHT.SHADOW = transparentize(0.8, setLightness(0.25, LIGHT.PRIMARY));
LIGHT.TEXT = setLightness(0.15, LIGHT.PRIMARY);
LIGHT.TEXT_FADED = transparentize(0.5, LIGHT.TEXT);
LIGHT.BORDER_NEUTRAL = transparentize(0.75, LIGHT.TEXT);

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
