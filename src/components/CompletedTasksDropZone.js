import React from 'react';
import { transparentize } from 'polished';
import styled, { css, keyframes } from 'styled-components';
import useDrop from '../hooks/useDrop';
import { COLORS, END_ZONE_ICON, UNIFIED_TRANSITION } from './atoms/tokens';

const DROP_ZONE_RADIUS = '20vw';

const pulsingAnimation = ({ theme }) => keyframes`
    0% {
        box-shadow: 0 0 0 0 ${COLORS[theme.name].PRIMARY};
        transform: scale(1);
    }
    100% {
        box-shadow: 0 0 50px 0 ${COLORS[theme.name].PRIMARY};
        transform: scale(1.2);
    }
`;

const Container = styled.div(
    ({ isDragging, isTargetedForDrop, theme }) => css`
        animation-direction: alternate;
        animation-duration: 300ms;
        animation-iteration-count: infinite;
        animation-name: ${isTargetedForDrop ? pulsingAnimation : 'unset'};
        animation-timing-function: ease-in-out;
        background: ${transparentize(
            isTargetedForDrop ? 0 : isDragging ? 0.35 : 0.8,
            COLORS[theme.name].PRIMARY
        )};
        bottom: calc(${DROP_ZONE_RADIUS} * -1);
        border-radius: calc(${DROP_ZONE_RADIUS} * 2);
        height: calc(${DROP_ZONE_RADIUS} * 2);
        pointer-events: ${isDragging ? 'all' : 'none'};
        position: fixed;
        right: calc(${DROP_ZONE_RADIUS} * -1);
        transform: scale(${isDragging ? 0.5 : 0.25});
        width: calc(${DROP_ZONE_RADIUS} * 2);
        z-index: 100;
        ${UNIFIED_TRANSITION};

        &:before {
            align-items: center;
            content: '${END_ZONE_ICON}';
            display: flex;
            font-size: 8rem;
            justify-content: center;
            height: calc(${DROP_ZONE_RADIUS} * 1.25);
            left: 0;
            position: absolute;
            top: 0;
            width: calc(${DROP_ZONE_RADIUS} * 1.25);
        }
    `
);

const CompletedTaskDropZone = ({ appActions, isDragging, ...otherProps }) => {
    const { onSelectTask, onUpdateTask } = appActions;
    const [dropProps] = useDrop('task-id', taskId => {
        onUpdateTask(taskId, {
            isComplete: true,
        });
        onSelectTask(currentSelectedTaskId => {
            return currentSelectedTaskId === taskId
                ? null
                : currentSelectedTaskId;
        });
    });

    return <Container isDragging={isDragging} {...dropProps} {...otherProps} />;
};

export default CompletedTaskDropZone;
