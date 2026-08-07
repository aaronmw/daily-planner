import React from 'react';
import useDrop from '../hooks/useDrop';
import FlexBox from './atoms/FlexBox';
import { COPY, ICONS } from './atoms/tokens';

const Trash = ({ appActions, appData, ...otherProps }) => {
    const { deleteTask, onSelectList, onUpdateList } = appActions;

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
        'task-id': deleteTask,
    });

    const isTargetedForDrop = dropProps.isTargetedForDrop;
    const trashColor = isTargetedForDrop
        ? '#FF0000'
        : isDraggingTask
          ? 'var(--planner-primary)'
          : 'var(--planner-text-faded)';

    return (
        <FlexBox
            align="center"
            justify="center"
            className="planner-trash-drop-target"
            data-dragging={isDraggingTask}
            data-targeted={isTargetedForDrop}
            style={{
                color: trashColor,
                pointerEvents: isDraggingTask ? 'all' : 'none',
            }}
            title={COPY.TIPS.DELETE_TASK}
            {...dropProps}
            {...otherProps}
        >
            <span aria-hidden="true">{ICONS.END_ZONE}</span>
        </FlexBox>
    );
};

export default Trash;
