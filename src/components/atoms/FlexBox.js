import styled from 'styled-components';
import { GRID_UNIT } from './tokens';
import Box from './Box';

export default styled(Box)(
    ({
        align = 'center',
        direction = 'row',
        isFlexible = false,
        justify = 'stretch',
        spacing = 0,
    }) => `
        align-items: ${align};
        display: flex;
        flex-direction: ${direction};
        flex-grow: ${isFlexible ? 1 : 0};
        flex-shrink: ${isFlexible ? 1 : 0};
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
