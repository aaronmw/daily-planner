import React from 'react';
import { transparentize } from 'polished';
import styled, { css, keyframes } from 'styled-components';
import useDrop from '../hooks/useDrop';
import { COLORS, GRID_UNIT, ICONS, UNIFIED_TRANSITION } from './atoms/tokens';

const DROP_ZONE_RADIUS = `calc(${GRID_UNIT} * 3.5)`;

const pulsingAnimation = ({ from, to }) => keyframes`
    0% {
        transform: scale(${from});
    }
    100% {
        transform: scale(${to});
    }
`;

const Container = styled.div(
    ({ isDraggingTask, isTargetedForDrop, theme }) => css`
        animation-direction: alternate;
        animation-duration: 300ms;
        animation-iteration-count: infinite;
        animation-name: ${isTargetedForDrop
            ? pulsingAnimation({ from: 1.6, to: 2.4 })
            : isDraggingTask
            ? pulsingAnimation({ from: 1, to: 1.6 })
            : 'unset'};
        animation-timing-function: ease-in-out;
        background: ${transparentize(
            isTargetedForDrop || isDraggingTask ? 1 : 0.75,
            COLORS[theme.name].PRIMARY
        )};
        bottom: calc(${DROP_ZONE_RADIUS} * -1);
        border-radius: calc(${DROP_ZONE_RADIUS} * 2);
        height: calc(${DROP_ZONE_RADIUS} * 2);
        pointer-events: ${isDraggingTask ? 'all' : 'none'};
        position: fixed;
        right: calc(${DROP_ZONE_RADIUS} * -1);
        transform: scale(${isDraggingTask ? 1.5 : 1});
        width: calc(${DROP_ZONE_RADIUS} * 2);
        z-index: 100;
        ${UNIFIED_TRANSITION};

        &:before {
            align-items: center;
            content: '${ICONS.END_ZONE}';
            display: flex;
            font-size: 3rem;
            justify-content: center;
            height: calc(${DROP_ZONE_RADIUS} * 1.25);
            left: 0;
            position: absolute;
            top: 0;
            width: calc(${DROP_ZONE_RADIUS} * 1.25);
        }
    `
);

const Trash = ({ appActions, appData, ...otherProps }) => {
    const { onTransitionToTask, onUpdateTask } = appActions;
    const { isDraggingTask } = appData;
    const [dropProps] = useDrop('task-id', taskId => {
        onUpdateTask(taskId, {
            isComplete: true,
        });
        onTransitionToTask(currentSelectedTaskId => {
            return currentSelectedTaskId === taskId
                ? null
                : currentSelectedTaskId;
        });
    });

    return (
        <Container
            isDraggingTask={isDraggingTask}
            {...dropProps}
            {...otherProps}
        />
    );
};

export default Trash;
