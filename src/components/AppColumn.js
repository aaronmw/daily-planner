import React from 'react';
import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import { COLORS, GRID_UNIT, UNIFIED_TRANSITION } from './atoms/tokens';

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
        border-bottom: 2px solid ${COLORS[theme.name].BORDER_NEUTRAL};
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

export default AppColumn;
