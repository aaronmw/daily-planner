import styled from 'styled-components';
import { HOURS_AT_ONCE, MIN_SLOT_HEIGHT } from '../tokens';

const CurrentTimeMarker = styled.div(
    ({ offsetMinutes }) => `
        position: absolute;
        top: max(
            100vh / (${HOURS_AT_ONCE} * 60) * ${offsetMinutes},
            ${MIN_SLOT_HEIGHT} * 2 * ${offsetMinutes} / 60
        );
        left: 0;
        right: 0;
        height: 1px;
        background-color: red;
    `
);

export default CurrentTimeMarker;
