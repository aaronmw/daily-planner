import React from 'react';
import { transparentize } from 'polished';
import styled, { css, keyframes } from 'styled-components';
import useDrop from '../hooks/useDrop';
import FlexBox from './atoms/FlexBox';
import {
    COLORS,
    COPY,
    GRID_UNIT,
    ICONS,
    UNIFIED_TRANSITION,
} from './atoms/tokens';

const DROP_ZONE_RADIUS = `calc(${GRID_UNIT} * 3.5)`;

const pulsingAnimation = ({ from, to }) => keyframes`
    0% {
        transform: scale(${from});
    }
    100% {
        transform: scale(${to});
    }
`;

const Container = styled(FlexBox).attrs({
    align: 'flex-end',
    justify: 'flex-end',
    padding: 1,
})(
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
        bottom: 0;
        font-size: 3rem;
        height: calc(${DROP_ZONE_RADIUS} * 2);
        pointer-events: ${isDraggingTask ? 'all' : 'none'};
        position: fixed;
        right: 0;
        transform: scale(${isDraggingTask ? 1.5 : 1});
        transform-origin: bottom right;
        width: calc(${DROP_ZONE_RADIUS} * 2);
        z-index: 1000;
        ${UNIFIED_TRANSITION};
    `
);

const Trash = ({ appActions, appData, ...otherProps }) => {
    const { onDeleteTask, onSelectList, onUpdateList } = appActions;
    const { isDraggingTask, lists, selectedListId } = appData;
    const [dropProps] = useDrop({
        'list-id': listId => {
            if (selectedListId === listId) {
                const firstUnarchivedList = lists.find(
                    list => list.id !== listId && !list.isArchived
                );

                if (firstUnarchivedList) {
                    onSelectList(firstUnarchivedList.id);
                }
            }

            onUpdateList(listId, {
                isArchived: true,
            });
        },
        'task-id': onDeleteTask,
    });

    return (
        <Container
            isDraggingTask={isDraggingTask}
            title={COPY.TIPS.DELETE_TASK}
            {...dropProps}
            {...otherProps}
        >
            {ICONS.END_ZONE}
        </Container>
    );
};

export default Trash;
