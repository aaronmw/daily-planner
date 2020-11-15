import { HOURS_PER_SCREEN, MIN_SLOT_HEIGHT } from '../tokens';

const minutesToHeight = minutes => `
    max(
        100vh / (${HOURS_PER_SCREEN} * 60) * ${minutes},
        ${MIN_SLOT_HEIGHT} * 2 * ${minutes} / 60
    )
`;

export default minutesToHeight;
