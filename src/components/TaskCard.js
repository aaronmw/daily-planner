import React from 'react';
import styled from 'styled-components';
import useDrag from './hooks/useDrag';
import {
    BORDER_RADIUS,
    COLOR_BORDER,
    COLOR_BORDER_HOVER,
    COLOR_PRIMARY,
    GRID_UNIT,
    HOURS_AT_ONCE,
    MIN_SLOT_HEIGHT,
    UNIFIED_TRANSITION,
} from '../tokens';

const LABEL_STRIP_WIDTH = '5px';

const Container = styled.div(
    ({ duration, isActive, isDragging, isDraggingOver }) => `
        align-items: center;
        background-color: white;
        border-radius: ${BORDER_RADIUS};
        box-shadow: ${
            isActive
                ? `0 0 0 2px ${COLOR_PRIMARY} !important`
                : `0 0 0 1px ${COLOR_BORDER}`
        };
        cursor: pointer;
        height: calc((100vh / (${HOURS_AT_ONCE} * 60)) * ${duration});
        height: max(
            100vh / (${HOURS_AT_ONCE} * 60) * ${duration},
            ${MIN_SLOT_HEIGHT} * 2 * ${duration} / 60
        );
        opacity: ${isDragging ? 0.5 : 1};
        padding: 0 calc(${GRID_UNIT} / 2) 0
            calc(${GRID_UNIT} / 2 + ${LABEL_STRIP_WIDTH});
        pointerEvents: ${isDraggingOver ? 'none' : 'auto'};
        position: relative;
        z-index: ${isActive ? 10 : 'initial'};
        ${UNIFIED_TRANSITION};

        &:before {
            background-color: ${COLOR_PRIMARY};
            bottom: 1px;
            content: '';
            left: 1px;
            position: absolute;
            top: 1px;
            width: ${LABEL_STRIP_WIDTH};
        }

        &:hover {
            box-shadow: 0 0 0 2px ${COLOR_BORDER_HOVER};
        }
        &:focus {
            box-shadow: 0 0 0 2px ${COLOR_PRIMARY};
        }
    `
);

const Label = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    min-height: ${MIN_SLOT_HEIGHT};
    max-height: calc((100vh / (${HOURS_AT_ONCE} * 60)) * 30);
`;

const TaskCard = ({ isActive, task, ...otherProps }) => {
    const { icon, id, label, schedule } = task;
    const { duration } = schedule;
    const [dragProps] = useDrag('task-id', id);

    return (
        <Container
            duration={duration}
            isActive={isActive}
            {...dragProps}
            {...otherProps}
        >
            <Label>
                <span>{label}</span>
                <span>{icon}</span>
            </Label>
        </Container>
    );
};

export default TaskCard;
