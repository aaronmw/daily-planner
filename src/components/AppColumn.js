import React from 'react';
import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import { BORDER_WIDTH, GRID_UNIT, UNIFIED_TRANSITION } from './atoms/tokens';

const Container = styled(FlexBox).attrs({
    direction: 'column',
    isFlexible: true,
})(
    ({ isDisabled, theme }) => `
        position: relative;
        
        &:before {
            background-color: ${theme.BACKGROUND};
            bottom: 0;
            content: '';
            left: 0;
            opacity: ${isDisabled ? 0.25 : 0};
            pointer-events: ${isDisabled ? 'all' : 'none'};
            position: absolute;
            right: 0;
            top: 0;
            z-index: 200;
        }
    `
);

const ContentContainer = styled(FlexBox).attrs({
    direction: 'column',
})`
    height: calc(100vh - ${GRID_UNIT});
    overflow: auto;
    position: relative;
    ${UNIFIED_TRANSITION};

    & > * {
        align-self: stretch;
    }
`;

const ColumnHeader = styled(FlexBox).attrs({
    justify: 'center',
})(
    ({ theme }) => `
        background: ${theme.BACKGROUND};
        color: ${theme.TEXT_FADED};
        border-bottom:
            ${BORDER_WIDTH} solid ${theme.BORDER};
        font-size: 0.75rem;
        height: ${GRID_UNIT};
        position: sticky;
        text-transform: uppercase;
        top: 0;
        z-index: 100;
    `
);

const AppColumn = ({
    children,
    disabledIf = [false],
    label,
    ...otherProps
}) => {
    const isDisabled =
        disabledIf.length && disabledIf.some(condition => condition === true);

    return (
        <Container isDisabled={isDisabled}>
            <ColumnHeader>{label}</ColumnHeader>
            <ContentContainer {...otherProps}>{children}</ContentContainer>
        </Container>
    );
};

export const PrimaryAppColumn = styled(AppColumn)(
    ({ theme }) => `
        box-shadow: 0 0 10px 10px ${theme.SHADOW};
        border-left: ${BORDER_WIDTH} solid ${theme.BORDER};
        border-right: 
            ${BORDER_WIDTH} solid ${theme.BORDER};
        overflow: unset;
        z-index: 11;
    `
);

export const SecondaryAppColumn = styled(AppColumn)(
    ({ isTargetedForDrop, theme }) => `
        background-color: ${theme.SHADED};
        flex-grow: 1;
        overflow: auto;
        position: relative;
        
        &:before {
            box-shadow: ${
                isTargetedForDrop
                    ? `0 0 0 5px ${theme.TASK_BORDER_HOVER} inset`
                    : 'initial'
            };
            bottom: 0;
            content: '';
            left: 0;
            pointer-events: none;
            position: absolute;
            right: 0;
            top: 0;
            z-index: 1000;
        }
    `
);

export default AppColumn;
