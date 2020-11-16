import { lighten, rgba, setLightness, transparentize } from 'polished';

export const BORDER_RADIUS = '3px';
export const BULLET_SIZE = '10px';
export const DEFAULT_TASK_ICON = '📌';
export const END_ZONE_ICON = '🗑';
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
export const GRID_UNIT = '30px';
export const HOURS_PER_SCREEN = 8;
export const INITIAL_TASKS = {};
export const MIN_SLOT_HEIGHT = GRID_UNIT;
export const TIMELINE_FROM = '7:00';
export const TIMELINE_TO = '24:00';
export const UNIFIED_TRANSITION = 'transition: all 0.15s ease-in-out';

export const COPY = {
    empty_notes: 'Add task notes',
};

const PRIMARY = '#0094FF';

const DARK = {};
DARK.PRIMARY = PRIMARY;
DARK.BACKGROUND = '#000209';
DARK.HIGH_CONTRAST_BACKGROUND = DARK.PRIMARY;
DARK.HIGH_CONTRAST_TEXT = DARK.BACKGROUND;
DARK.BORDER_HOVER = setLightness(0.5, PRIMARY);
DARK.BORDER_IDLE = setLightness(0.3, PRIMARY);
DARK.SHADED = lighten(0.1, DARK.BACKGROUND);
DARK.TEXT = setLightness(0.85, DARK.PRIMARY);
DARK.TEXT_FADED = setLightness(0.4, DARK.TEXT);
DARK.BORDER_NEUTRAL = setLightness(0.15, DARK.TEXT);

const LIGHT = {};
LIGHT.PRIMARY = PRIMARY;
LIGHT.BACKGROUND = 'white';
LIGHT.HIGH_CONTRAST_BACKGROUND = LIGHT.PRIMARY;
LIGHT.HIGH_CONTRAST_TEXT = LIGHT.BACKGROUND;
LIGHT.BORDER_HOVER = rgba('#0094FF', 0.5);
LIGHT.BORDER_IDLE = rgba('#0094FF', 0.3);
LIGHT.BORDER_NEUTRAL = setLightness(0.75, LIGHT.BACKGROUND);
LIGHT.SHADED = setLightness(0.95, LIGHT.PRIMARY);
LIGHT.TEXT = setLightness(0.15, LIGHT.PRIMARY);
LIGHT.TEXT_FADED = LIGHT.BORDER_NEUTRAL;

export const COLORS = {
    DARK,
    LIGHT,
};
