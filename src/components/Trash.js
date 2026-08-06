import React from 'react';
import useDrop from '../hooks/useDrop';
import FlexBox from './atoms/FlexBox';
import { COPY, ICONS } from './atoms/tokens';

const Trash = ({ appActions, appData, ...otherProps }) => {
    const {
        onChangeIsShowingTrashContents,
        deleteTask,
        onSelectList,
        onUpdateList,
    } = appActions;

    const { isDraggingTask, isShowingTrashContents, lists, selectedListId } =
        appData;

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

    const handleClick = () =>
        onChangeIsShowingTrashContents(!isShowingTrashContents);

    const isTargetedForDrop = dropProps.isTargetedForDrop;
    const isActive =
        isTargetedForDrop || isDraggingTask || isShowingTrashContents;
    const trashColor = isTargetedForDrop
        ? '#FF0000'
        : isDraggingTask || isShowingTrashContents
          ? 'var(--planner-primary)'
          : 'var(--planner-text-faded)';

    return (
        <>
            <FlexBox
                align="center"
                justify="center"
                padding={1}
                className="planner-trash-anchor planner-trash-icon"
                data-active={isActive}
                data-dragging={isDraggingTask}
                data-targeted={isTargetedForDrop}
                style={{ color: trashColor }}
                title={COPY.TIPS.DELETE_TASK}
                onClick={handleClick}
            >
                {ICONS.END_ZONE}
            </FlexBox>
            <FlexBox
                className="planner-trash-anchor"
                data-dragging={isDraggingTask}
                data-targeted={isTargetedForDrop}
                style={{ pointerEvents: isDraggingTask ? 'all' : 'none' }}
                {...dropProps}
                {...otherProps}
            />
        </>
    );
};

export default Trash;
