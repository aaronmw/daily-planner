import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { BORDER_RADIUS, GRID_UNIT } from './tokens';
import preventWidowsFunction from '../../utils/preventWidows';

const buildStyles = (propName = '', propValue = null, edges = []) => {
    if (propValue !== null) {
        return edges
            .map(
                edge =>
                    `${propName}-${edge}: calc(${propValue} * ${GRID_UNIT});`
            )
            .join('');
    }

    return '';
};

const Container = styled.div(
    ({
        border = false,
        margin = null,
        marginBottom = null,
        marginLeft = null,
        marginRight = null,
        marginTop = null,
        marginX = null,
        marginY = null,
        padding = null,
        paddingBottom = null,
        paddingLeft = null,
        paddingRight = null,
        paddingTop = null,
        paddingX = null,
        paddingY = null,
        theme,
        isFlexible = false,
        isRounded = false,
        isScrollable = false,
        onClick = null,
    }) => `
        align-self: stretch;
        border-radius: ${isRounded ? BORDER_RADIUS : ''};
        box-shadow: ${border ? `0 0 0 1px ${theme.BORDER}` : 'none'};
        cursor: ${onClick ? 'pointer' : ''};
        flex-grow: ${isFlexible ? 1 : 0};
        flex-shrink: ${isFlexible ? 1 : 0};
        overflow: ${isScrollable ? 'auto' : ''};
        
        ${[
            buildStyles('margin', margin, ['top', 'right', 'bottom', 'left']),
            buildStyles('margin', marginBottom, ['bottom']),
            buildStyles('margin', marginLeft, ['left']),
            buildStyles('margin', marginRight, ['right']),
            buildStyles('margin', marginTop, ['top']),
            buildStyles('margin', marginX, ['right', 'left']),
            buildStyles('margin', marginY, ['top', 'bottom']),
            buildStyles('padding', padding, ['top', 'right', 'bottom', 'left']),
            buildStyles('padding', paddingBottom, ['bottom']),
            buildStyles('padding', paddingLeft, ['left']),
            buildStyles('padding', paddingRight, ['right']),
            buildStyles('padding', paddingTop, ['top']),
            buildStyles('padding', paddingX, ['right', 'left']),
            buildStyles('padding', paddingY, ['top', 'bottom']),
        ].join('')}
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
