import React, { memo } from 'react';
import styled from 'styled-components';
import useDrag from '../hooks/useDrag';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    COLORS,
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
    ({ duration, isActive, isDragging, isTargetedForDrop, theme }) => `
        background-color: ${COLORS[theme.name].BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        box-shadow: 0 0 0 2px ${
            COLORS[theme.name][isActive ? 'PRIMARY' : 'BORDER_IDLE']
        };
        cursor: pointer;
        height: ${minutesToHeight(duration)};
        opacity: ${isDragging ? 0 : 1};
        overflow: hidden;
        padding-left: calc(${GRID_UNIT} * 0.5 + ${LABEL_STRIP_WIDTH});
        position: relative;
        width: 100%;
        z-index: ${isActive ? 10 : 'initial'};
        ${UNIFIED_TRANSITION};
        transition-property:
            background-color,
            box-shadow,
            height,
            min-height,
            opacity,
            width;

        &:before {
            background-color: ${COLORS[theme.name].PRIMARY};
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
            box-shadow: 0 0 0 2px ${COLORS[theme.name].BORDER_HOVER};
        }
        
        &:focus {
            box-shadow: 0 0 0 2px ${COLORS[theme.name].PRIMARY};
        }
        
        &:active {
            box-shadow: 0 0 0 2px ${COLORS[theme.name].PRIMARY} inset;
        }
        
        ${CardLabel} {
            color: ${COLORS[theme.name][isActive ? 'TEXT' : 'TEXT_FADED']};
            min-height: ${minutesToHeight(Math.min(30, duration))};
        }

        ${CardIcon} {
            height: ${minutesToHeight(Math.min(30, duration))};
        }
    `
);

const CardLabel = styled(FlexBox).attrs({
    align: 'center',
    isFlexible: true,
})(
    ({ theme }) => `
        position: relative;
        width: auto;
        ${UNIFIED_TRANSITION};
        
        ${Container}:hover > & {
            color: ${COLORS[theme.name].TEXT};
        }
    `
);

const CardIcon = styled(FlexBox).attrs({
    align: 'center',
    justify: 'center',
})(
    ({ theme }) => `
        width: auto;
    `
);

const TaskCard = ({ appActions, appData, isActive, task, ...otherProps }) => {
    const { onImmediatelySelectTask, onTransitionToTask } = appActions;
    const { isShowingListManager } = appData;
    const { icon, id, label, scheduled_minutes } = task;
    const [dragProps] = useDrag({ 'task-id': id });

    const handleClick = () => {
        if (isShowingListManager) {
            onImmediatelySelectTask(id);
            return;
        }

        onTransitionToTask(id);
    };

    return (
        <Container
            data-task-id={id}
            duration={scheduled_minutes}
            isActive={isActive}
            tabIndex={0}
            onClick={handleClick}
            {...dragProps}
            {...otherProps}
        >
            <CardLabel>{label}</CardLabel>
            <CardIcon>{icon}</CardIcon>
        </Container>
    );
};

export default memo(TaskCard);
