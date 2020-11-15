import { lighten, rgba, setLightness, transparentize } from 'polished';

export const BULLET_SIZE = '10px';
export const BORDER_RADIUS = '3px';

const PRIMARY = '#0094FF';

const DARK = {};
DARK.PRIMARY = PRIMARY;
DARK.BACKGROUND = '#000209';
DARK.BORDER_HOVER = setLightness(0.5, PRIMARY);
DARK.BORDER_IDLE = setLightness(0.3, PRIMARY);
DARK.SHADED = lighten(0.08, DARK.BACKGROUND);
DARK.TEXT = setLightness(0.85, PRIMARY);
DARK.TEXT_FADED = transparentize(0.5, DARK.TEXT);
DARK.BORDER_NEUTRAL = setLightness(0.15, DARK.TEXT);

const LIGHT = {};
LIGHT.PRIMARY = PRIMARY;
LIGHT.BACKGROUND = 'white';
LIGHT.BORDER_HOVER = rgba('#0094FF', 0.5);
LIGHT.BORDER_IDLE = rgba('#0094FF', 0.5);
LIGHT.SHADED = setLightness(0.95, LIGHT.PRIMARY);
LIGHT.TEXT = setLightness(0.15, PRIMARY);
LIGHT.TEXT_FADED = transparentize(0.4, LIGHT.TEXT);
LIGHT.BORDER_NEUTRAL = setLightness(0.75, LIGHT.BACKGROUND);

export const COLORS = {
    DARK,
    LIGHT,
};
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
export const GRID_UNIT = '30px';
export const HOURS_PER_SCREEN = 8;
export const INITIAL_TASKS = {};
export const MIN_SLOT_HEIGHT = `20px`;
export const TIMELINE_FROM = '7:00';
export const TIMELINE_TO = '24:00';
export const UNIFIED_TRANSITION = 'transition: all 0.15s ease-in-out';
