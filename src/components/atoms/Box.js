import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { COLORS, GRID_UNIT } from './tokens';
import preventWidowsFunction from '../../utils/preventWidows';

const Container = styled.div(
    ({
        border = false,
        isFlexible = false,
        margin = null,
        marginX = null,
        marginY = null,
        padding = null,
        paddingX = null,
        paddingY = null,
        theme,
    }) => `
        align-self: stretch;
        box-shadow: ${
            border ? `0 0 0 1px ${COLORS[theme.name].BORDER}` : 'none'
        };
        flex-grow: ${isFlexible ? 1 : 0};
        flex-shrink: ${isFlexible ? 1 : 0};
        ${
            marginX !== null
                ? `
                    margin-left: calc(${marginX} * ${GRID_UNIT});
                    margin-right: calc(${marginX} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            marginY !== null
                ? `
                    margin-top: calc(${marginY} * ${GRID_UNIT});
                    margin-bottom: calc(${marginY} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            margin !== null
                ? `
                    margin: calc(${margin} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            paddingX !== null
                ? `
                    padding-left: calc(${paddingX} * ${GRID_UNIT});
                    padding-right: calc(${paddingX} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            paddingY !== null
                ? `
                    padding-top: calc(${paddingY} * ${GRID_UNIT});
                    padding-bottom: calc(${paddingY} * ${GRID_UNIT});
                `
                : ''
        }
        ${
            padding !== null
                ? `
                    padding: calc(${padding} * ${GRID_UNIT});
                `
                : ''
        }
    `
);

const Box = forwardRef(
    ({ children, preventWidows = false, ...otherProps }, ref) => (
        <Container ref={ref} {...otherProps}>
            {preventWidows ? preventWidowsFunction(children) : children}
        </Container>
    )
);

export default Box;
