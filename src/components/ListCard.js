import React, { useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';
import useDrag from '../hooks/useDrag';
import useDrop from '../hooks/useDrop';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import toInt from '../utils/toInt';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    COLORS,
    COPY,
    GRID_UNIT,
    LIST_CARD_HEIGHT,
    LIST_CARD_SPACING,
    LIST_CARD_WIDTH,
    UNIFIED_TRANSITION,
} from './atoms/tokens';
import EditInPlace from './EditInPlace';

const Container = styled(FlexBox).attrs({
    align: 'flex-start',
    direction: 'column',
    justify: 'space-between',
    spacing: 0.5,
})(
    ({ isActive, isTargetedForDrop, theme }) => `
        background-color: ${
            COLORS[theme.name][
                isActive ? 'HIGH_CONTRAST_BACKGROUND' : 'PRIMARY_FADED'
            ]
        };
        border-radius: ${BORDER_RADIUS};
        box-shadow:
            0 0 0 2px ${isActive ? COLORS[theme.name].SHADED : 'transparent'},
            0 0 0 4px ${
                isActive
                    ? COLORS[theme.name][
                          isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER_HOVER'
                      ]
                    : 'transparent'
            };
        color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT};
        cursor: pointer;
        height: ${LIST_CARD_HEIGHT};
        margin-bottom: ${LIST_CARD_SPACING};
        margin-left: ${LIST_CARD_SPACING};
        overflow: hidden;
        position: relative;
        transform: scale(${isTargetedForDrop ? 1.1 : 1});
        width: ${LIST_CARD_WIDTH};
        ${UNIFIED_TRANSITION};
        
        &:nth-child(3n+4) {
            margin-left: 0;
        }
        
        &:active,
        &:focus,
        &:hover {
            box-shadow:
                0 0 0 2px ${COLORS[theme.name].SHADED},
                0 0 0 4px ${
                    COLORS[theme.name][
                        isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER_HOVER'
                    ]
                };
        }
    `
);

export const ListCardTaskIconContainer = styled(FlexBox).attrs({
    justify: 'flex-start',
    paddingX: 0.25,
    paddingY: 0.25,
    wrapped: true,
})(
    ({ isActive }) => `
        background-color: rgba(255, 255, 255, ${isActive ? 0.75 : 0.25});
        border-radius: ${BORDER_RADIUS};
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        margin: 5px;
        width: calc(100% - (5px * 2));
    `
);

export const GhostListCard = styled(GhostButton).attrs({
    align: 'center',
    justify: 'center',
})`
    height: ${LIST_CARD_HEIGHT};
    margin-bottom: ${LIST_CARD_SPACING};
    width: ${LIST_CARD_WIDTH};
`;

export const ListCardContainer = styled(FlexBox).attrs({
    align: 'flex-start',
    isFlexible: true,
    justify: 'flex-start',
    padding: 1,
    wrapped: true,
})(
    ({ theme }) => `
        align-content: flex-start;
        background-color: ${COLORS[theme.name].SHADED};
        height: 100%;
        overflow: auto;
        padding-bottom: calc(${GRID_UNIT} * 1.5);
    `
);

const ListCard = ({
    appActions,
    appData,
    listId,
    isEditable = true,
    ...otherProps
}) => {
    const { onUpdateList, onUpdateTask } = appActions;

    const { isCreatingList, lists, selectedListId, tasks } = appData;

    const list = lists.find(list => list.id === listId);

    const tasksInList = tasks.filter(
        task => task.list_id === listId && !task.isComplete
    );

    const isActive = listId === selectedListId;

    const listCardElementRef = useRef(null);

    const [dragProps] = useDrag({ 'list-id': listId });

    const [dropProps] = useDrop({
        'task-id': (taskId, evt) => {
            const targetListId = toInt(evt.currentTarget.dataset.listId);
            if (targetListId) {
                onUpdateTask(taskId, {
                    isComplete: false,
                    list_id: targetListId,
                });
            }
        },
    });

    const triggerClick = useCallback(evt => {
        evt.preventDefault();
        evt.target.click();
    }, []);

    const keyMap = useMemo(
        () => ({
            enter: triggerClick,
            space: triggerClick,
        }),
        [triggerClick]
    );

    useKeyboardShortcuts(keyMap, listCardElementRef);

    const tracingElementStyles = theme => `
        border-color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT}
    `;

    return (
        <Container
            data-list-id={listId}
            ref={listCardElementRef}
            tabIndex={0}
            title={COPY.TIPS.MOVE_BETWEEN_LISTS}
            {...dragProps}
            {...dropProps}
            {...otherProps}
        >
            <EditInPlace
                isEditable={isEditable}
                isRemotelyActivated={
                    isCreatingList && selectedListId === listId
                }
                marginX={0.75}
                marginY={0.5}
                style={{
                    alignSelf: 'stretch',
                    flexGrow: 0,
                    flexShrink: 0,
                }}
                tracingElementStyles={tracingElementStyles}
                value={list.label}
                onSave={newLabel => {
                    onUpdateList(listId, { label: newLabel });
                }}
            />
            {tasksInList.length >= 1 && (
                <ListCardTaskIconContainer isActive={isActive}>
                    {tasksInList.map(task => (
                        <span key={task.id}>{task.icon}</span>
                    ))}
                </ListCardTaskIconContainer>
            )}
        </Container>
    );
};

export default ListCard;
