import React from 'react';
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
})(
    ({ duration, isActive, isDragging, isDraggingOver, theme }) => `
        background-color: ${COLORS[theme.name].BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        box-shadow: ${`0 0 0 2px ${
            COLORS[theme.name][isActive ? 'PRIMARY' : 'BORDER_IDLE']
        }`};
        cursor: pointer;
        height: ${minutesToHeight(duration)};
        min-height: ${minutesToHeight(20)};
        opacity: ${isDragging ? 0.5 : 1};
        padding: 0 calc(${GRID_UNIT} / 2) 0
            calc(${GRID_UNIT} / 2 + ${LABEL_STRIP_WIDTH});
        pointer-events: ${isDraggingOver ? 'none' : 'auto'};
        position: relative;
        transition-property: opacity, top;
        width: 100%;
        z-index: ${isActive ? 10 : 'initial'};
        ${UNIFIED_TRANSITION};

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
    `
);

const Label = styled(FlexBox).attrs({
    spacing: 0.5,
})(
    ({ isActive, theme }) => `
        align-items: center;
        color: ${COLORS[theme.name][isActive ? 'TEXT' : 'TEXT_FADED']};
        display: flex;
        justify-content: space-between;
        height: 100%;
        ${UNIFIED_TRANSITION};
        
        ${Container}:hover > & {
            color: ${COLORS[theme.name].TEXT};
        }
    `
);

const TaskCard = ({ appActions, isActive, task, ...otherProps }) => {
    const { onSelectTask } = appActions;
    const { icon, id, label, scheduled_minutes } = task;
    const [dragProps] = useDrag('task-id', id);

    const handleClick = () => onSelectTask(id);

    return (
        <Container
            duration={scheduled_minutes}
            isActive={isActive}
            onClick={handleClick}
            {...dragProps}
            {...otherProps}
        >
            <Label isActive={isActive}>
                <div
                    style={{
                        maxHeight: '100%',
                        overflow: 'auto',
                    }}
                >
                    {label}
                </div>
                <span>{icon}</span>
            </Label>
        </Container>
    );
};

export default TaskCard;
