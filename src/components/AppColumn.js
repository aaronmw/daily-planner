import React from 'react';
import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_WIDTH,
    COLORS,
    GRID_UNIT,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    UNIFIED_TRANSITION,
} from './atoms/tokens';

const Container = styled(FlexBox).attrs({
    direction: 'column',
    isFlexible: true,
})(
    ({ theme }) => `
    `
);

const ContentContainer = styled(FlexBox).attrs({
    direction: 'column',
})(
    ({ theme }) => `
        height: calc(100vh - ${GRID_UNIT});
        overflow: auto;
        position: relative;
        ${UNIFIED_TRANSITION};
        
        & > * {
            align-self: stretch;
        }
    `
);

const ColumnHeader = styled(FlexBox).attrs({
    justify: 'center',
})(
    ({ theme }) => `
        background: ${COLORS[theme.name].BACKGROUND};
        color: ${COLORS[theme.name].TEXT_FADED};
        border-bottom:
            ${BORDER_WIDTH} solid ${COLORS[theme.name].BORDER_NEUTRAL};
        font-size: 0.75rem;
        height: ${GRID_UNIT};
        position: sticky;
        text-transform: uppercase;
        top: 0;
        z-index: 100;
    `
);

const AppColumn = ({ children, label, ...otherProps }) => (
    <Container>
        <ColumnHeader>{label}</ColumnHeader>
        <ContentContainer {...otherProps}>{children}</ContentContainer>
    </Container>
);

export const PrimaryAppColumn = styled(AppColumn)(
    ({ isTransitioning, theme }) => `
        box-shadow: 0 0 10px 10px ${COLORS[theme.name].SHADOW};
        border-left: ${BORDER_WIDTH} solid ${COLORS[theme.name].BORDER_NEUTRAL};
        border-right: ${BORDER_WIDTH} solid ${
        COLORS[theme.name].BORDER_NEUTRAL
    };
        opacity: ${isTransitioning ? 0 : 1};
        overflow: unset;
        z-index: 11;
        ${UNIFIED_TRANSITION};
        transition-duration: ${ROUTE_TRANSITION_ANIMATION_DURATION / 2}ms;
    `
);

export default AppColumn;
