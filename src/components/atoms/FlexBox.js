import styled from 'styled-components';
import { GRID_UNIT } from '../../tokens';
import Box from './Box';

const FlexBox = styled(Box)(
    ({
        align = 'center',
        direction = 'row',
        justify = 'center',
        spacing = 0,
    }) => `
        display: flex;
        flex-direction: ${direction};
        align-items: ${align};
        justify-content: ${justify};
        
        ${
            spacing
                ? `
                    & > * + * {
                        margin-left: calc(${spacing} * ${GRID_UNIT});
                    }
                `
                : ''
        }
    `
);

export default FlexBox;
