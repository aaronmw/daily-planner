import React from 'react';
import { transparentize } from 'polished';
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
        
        & > * {
            align-self: stretch;
        }
    `
);

const ColumnHeader = styled(FlexBox).attrs({
    paddingX: 0.5,
})(
    ({ theme }) => `
        background: ${COLORS[theme.name].HIGH_CONTRAST_BACKGROUND};
        color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT};
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
