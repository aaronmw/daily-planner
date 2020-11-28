import styled from 'styled-components';
import { GRID_UNIT } from './tokens';
import Box from './Box';

export default styled(Box)(
    ({
        align = 'center',
        direction = 'row',
        justify = 'stretch',
        spacing = 0,
        wrapped = false,
    }) => `
        align-items: ${align};
        align-content: ${wrapped ? align : ''};
        display: flex;
        flex-direction: ${direction};
        flex-wrap: ${wrapped ? 'wrap' : 'nowrap'};
        justify-content: ${justify};
        
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
