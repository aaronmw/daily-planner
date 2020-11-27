import React from 'react';
import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_WIDTH,
    COLORS,
    GRID_UNIT,
    UNIFIED_TRANSITION,
} from './atoms/tokens';

const Container = styled(FlexBox).attrs({
    direction: 'column',
    isFlexible: true,
})(
    ({ isDisabled, theme }) => `
        position: relative;
        
        &:before {
            background-color: ${COLORS[theme.name].BACKGROUND};
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
        background: ${COLORS[theme.name].BACKGROUND};
        color: ${COLORS[theme.name].TEXT_FADED};
        border-bottom:
            ${BORDER_WIDTH} solid ${COLORS[theme.name].BORDER};
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
        box-shadow: 0 0 10px 10px ${COLORS[theme.name].SHADOW};
        border-left: ${BORDER_WIDTH} solid ${COLORS[theme.name].BORDER};
        border-right: 
            ${BORDER_WIDTH} solid ${COLORS[theme.name].BORDER};
        overflow: unset;
        z-index: 11;
    `
);

export const SecondaryAppColumn = styled(AppColumn)(
    ({ isTargetedForDrop, theme }) => `
        background-color: ${COLORS[theme.name].SHADED};
        flex-grow: 1;
        overflow: auto;
        position: relative;
        
        &:before {
            box-shadow: ${
                isTargetedForDrop
                    ? `0 0 0 5px ${COLORS[theme.name].TASK_BORDER_HOVER} inset`
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
