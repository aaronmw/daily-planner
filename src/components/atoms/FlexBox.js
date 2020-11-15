import styled from 'styled-components';
import { GRID_UNIT } from '../../tokens';
import Box from './Box';

const FlexBox = styled(Box)(
    ({
        align = 'center',
        direction = 'row',
        justify = 'stretch',
        spacing = 0,
    }) => `
        align-items: ${align};
        display: flex;
        flex-direction: ${direction};
        justify-content: ${justify};
        width: 100%;
        
        ${
            spacing
                ? `
                    & > * + * {
                        margin-${
                            direction === 'row' ? 'left' : 'top'
                        }: calc(${spacing} * ${GRID_UNIT});
                    }
                `
                : ''
        }
    `
);

export default FlexBox;
