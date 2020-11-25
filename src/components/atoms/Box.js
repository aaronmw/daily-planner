import styled from 'styled-components';
import { COLORS, GRID_UNIT } from './tokens';

export default styled.div(
    ({
        border = false,
        isFlexible = false,
        margin = 0,
        marginX = 0,
        marginY = 0,
        padding = 0,
        paddingX = 0,
        paddingY = 0,
        theme,
    }) => `
        box-shadow: ${
            border ? `0 0 0 1px ${COLORS[theme.name].BORDER}` : 'none'
        };
        flex-grow: ${isFlexible ? 1 : 0};
        flex-shrink: ${isFlexible ? 1 : 0};
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
    `
);
