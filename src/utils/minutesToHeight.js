import {
    GRID_UNIT,
    HOURS_PER_SCREEN,
    MIN_SLOT_HEIGHT,
} from '../components/atoms/tokens';

export default minutes => `
    max(
        (100vh - ${GRID_UNIT}) / (${HOURS_PER_SCREEN} * 60) * ${minutes},
        ${MIN_SLOT_HEIGHT} * 2 * ${minutes} / 60
    )
`;
