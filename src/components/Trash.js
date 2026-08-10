import React from 'react';
import useDrop from '../hooks/useDrop';
import FlexBox from './atoms/FlexBox';
import { COPY, ICONS } from './atoms/tokens';

const Trash = ({ appActions, appData, ...otherProps }) => {
    const { deleteTask, onArchiveList } = appActions;

    const { isDraggingTask } = appData;

    const [dropProps] = useDrop({
        'list-id': onArchiveList,
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
