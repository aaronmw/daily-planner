import { GRID_UNIT, HOURS_PER_SCREEN } from '../components/atoms/tokens';

export default (minutes, hoursPerScreen = HOURS_PER_SCREEN) =>
    `calc((100dvh - ${GRID_UNIT}) / (${hoursPerScreen} * 60) * ${minutes})`;
