import React, { memo, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import useDrag from '../hooks/useDrag';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    buildPalette,
    COPY,
    FONTS,
    GRID_UNIT,
    UNIFIED_TRANSITION,
} from './atoms/tokens';
import minutesToHeight from '../utils/minutesToHeight';

const LABEL_STRIP_WIDTH = '5px';

const Container = styled(FlexBox).attrs({
    align: 'flex-start',
    justify: 'space-between',
    spacing: 0.5,
    paddingX: 0.5,
})(
    ({ duration, isActive, isDragging, theme }) => `
        background-color: ${theme.BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        box-shadow:
            0 0 0 ${isActive ? 2 : 1}px
            ${theme[isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER']};
        cursor: pointer;
        height: ${minutesToHeight(duration)};
        opacity: ${isDragging ? 0 : 1};
        overflow: hidden;
        padding-left: calc(${GRID_UNIT} * 0.5 + ${LABEL_STRIP_WIDTH});
        position: relative;
        width: 100%;
        z-index: ${isActive ? 100 : 10};
        ${UNIFIED_TRANSITION};
        transition-property:
            background-color,
            box-shadow,
            height,
            min-height,
            opacity,
            width;
            
        & ::selection {
            color: ${theme.HIGH_CONTRAST_BACKGROUND};
            background-color: ${theme.HIGH_CONTRAST_TEXT};
        }

        &:before {
            background-color: ${theme.PRIMARY};
            border-bottom-left-radius: ${BORDER_RADIUS};
            border-top-left-radius: ${BORDER_RADIUS};
            bottom: 1px;
            content: '';
            left: 1px;
            opacity: ${isActive ? 1 : 0.5};
            position: absolute;
            top: 1px;
            width: ${LABEL_STRIP_WIDTH};
            ${UNIFIED_TRANSITION};
        }
        
        &:hover {
            box-shadow: 0 0 0 2px ${
                theme[isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER_HOVER']
            };
        }
        
        &:focus {
            box-shadow: 0 0 0 2px ${theme.TASK_BORDER_ACTIVE};
        }
        
        &:active {
            box-shadow: 0 0 0 2px ${theme.TASK_BORDER_ACTIVE} inset;
        }
    `
);

const CardLabel = styled(FlexBox).attrs({
    align: 'flex-start',
    isFlexible: true,
})(
    ({ duration, isActive, isMouseOver, theme }) => `
        color: ${theme[isActive || isMouseOver ? 'TEXT' : 'TEXT_FADED']};
        min-height: ${minutesToHeight(Math.min(30, duration))};
        position: relative;
        width: auto;
        ${UNIFIED_TRANSITION};
    `
);

const CardIcon = styled(FlexBox).attrs({
    align: 'center',
    justify: 'center',
})(
    ({ duration }) => `
        font-size: ${duration <= 15 ? FONTS.NORMAL.SIZE : FONTS.LARGE.SIZE};
        height: ${minutesToHeight(Math.min(30, duration))};
        width: auto;
    `
);

export const TaskCardContainer = styled(FlexBox).attrs({
    isFlexible: true,
    justify: 'flex-start',
    direction: 'column',
    spacing: 0.5,
    padding: 1,
})`
    height: 100%;
`;

const TaskCard = ({ appActions, appData, task, ...otherProps }) => {
    const [isMouseOver, setIsMouseOver] = useState(false);

    const { onImmediatelySelectTask, onTransitionToTask } = appActions;

    const { isShowingListManager, lists, selectedTaskId, theme } = appData;

    const { icon, id, label, list_id, scheduled_minutes } = task;

    const listColorCode = lists.find(list => list.id === list_id).color_code;

    const cardPalette = buildPalette(theme, listColorCode);

    const isActive = task.id === selectedTaskId;

    const [dragProps] = useDrag({ 'task-id': id });

    const handleClick = () => {
        if (isShowingListManager) {
            onImmediatelySelectTask(id);
            return;
        }

        onTransitionToTask(id);
    };

    const toggleIsMouseOver = () => setIsMouseOver(!isMouseOver);

    return (
        <ThemeProvider theme={cardPalette}>
            <Container
                data-task-id={id}
                duration={scheduled_minutes}
                isActive={isActive}
                tabIndex={0}
                title={COPY.TIPS.MOVE_TASK_BETWEEN_TASK_LIST_AND_TIMELINE}
                onClick={handleClick}
                onMouseEnter={toggleIsMouseOver}
                onMouseLeave={toggleIsMouseOver}
                {...dragProps}
                {...otherProps}
            >
                <CardLabel
                    duration={scheduled_minutes}
                    isActive={isActive}
                    isMouseOver={isMouseOver}
                >
                    {label}
                </CardLabel>
                <CardIcon duration={scheduled_minutes}>{icon}</CardIcon>
            </Container>
        </ThemeProvider>
    );
};

export default memo(TaskCard);
