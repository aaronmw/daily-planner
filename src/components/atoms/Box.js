import styled from 'styled-components';
import { COLOR_BORDER, GRID_UNIT } from '../../tokens';

const Box = styled.div(
    ({
        border = false,
        backgroundColor = false,
        margin = 0,
        marginX = 0,
        marginY = 0,
        padding = 0,
        paddingX = 0,
        paddingY = 0,
    }) => `
        ${
            marginX
                ? `
                    margin-left: calc(${marginX} * ${GRID_UNIT});
                    margin-right: calc(${marginX} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            marginY
                ? `
                    margin-top: calc(${marginY} * ${GRID_UNIT});
                    margin-bottom: calc(${marginY} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            margin
                ? `
                    margin: calc(${margin} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            paddingX
                ? `
                    padding-left: calc(${paddingX} * ${GRID_UNIT});
                    padding-right: calc(${paddingX} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            paddingY
                ? `
                    padding-top: calc(${paddingY} * ${GRID_UNIT});
                    padding-bottom: calc(${paddingY} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            padding
                ? `
                    padding: calc(${padding} * ${GRID_UNIT});
                `
                : ''
        }
        box-shadow: ${border ? `0 0 0 1px ${COLOR_BORDER}` : 'none'};
    `
);

export default Box;
