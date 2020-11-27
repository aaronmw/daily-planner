import React from 'react';
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

const DROP_ZONE_SIZE = `calc(${GRID_UNIT} * 4)`;

const pulsingAnimation = ({ from, to }) => keyframes`
    0% {
        transform: scale(${from});
    }
    100% {
        transform: scale(${to});
    }
`;

const AnimatedContainer = styled(FlexBox)(
    ({ isDraggingTask, isTargetedForDrop }) => css`
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
        height: ${DROP_ZONE_SIZE};
        position: fixed;
        right: 0;
        transform-origin: bottom right;
        transform: scale(${isDraggingTask ? 1.5 : 1});
        width: ${DROP_ZONE_SIZE};
        z-index: 1000;
        ${UNIFIED_TRANSITION};
    `
);

const TrashDropZone = styled(AnimatedContainer)(
    ({ isDraggingTask }) => `
        pointer-events: ${isDraggingTask ? 'all' : 'none'};
    `
);

const TrashIconContainer = styled(AnimatedContainer).attrs({
    align: 'center',
    justify: 'center',
    padding: 1,
})(
    ({ isDraggingTask, isShowingTrashContents, isTargetedForDrop, theme }) => `
        color: ${
            isTargetedForDrop
                ? '#FF0000'
                : COLORS[theme.name][
                      isDraggingTask || isShowingTrashContents
                          ? 'PRIMARY'
                          : 'TEXT_FADED'
                  ]
        };
        cursor: pointer;
        font-size: 3rem;
        opacity: ${!isTargetedForDrop && !isDraggingTask ? 0.6 : 1};
        
        &:hover {
            color: ${COLORS[theme.name].PRIMARY};
        }
    `
);

const Trash = ({ appActions, appData, ...otherProps }) => {
    const {
        onChangeIsShowingTrashContents,
        onDeleteTask,
        onSelectList,
        onUpdateList,
    } = appActions;

    const {
        isDraggingTask,
        isShowingTrashContents,
        lists,
        selectedListId,
    } = appData;

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

    const handleClick = () =>
        onChangeIsShowingTrashContents(!isShowingTrashContents);

    return (
        <>
            <TrashIconContainer
                isDraggingTask={isDraggingTask}
                isShowingTrashContents={isShowingTrashContents}
                isTargetedForDrop={dropProps.isTargetedForDrop}
                title={COPY.TIPS.DELETE_TASK}
                onClick={handleClick}
            >
                {ICONS.END_ZONE}
            </TrashIconContainer>
            <TrashDropZone
                isDraggingTask={isDraggingTask}
                {...dropProps}
                {...otherProps}
            />
        </>
    );
};

export default Trash;
