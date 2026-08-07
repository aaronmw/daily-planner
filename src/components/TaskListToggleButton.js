import React from 'react';
import { IconButton } from './atoms/Button';
import { COPY, ICONS } from './atoms/tokens';

const TaskListToggleButton = ({ isSidebarOpen, onChangeIsSidebarOpen }) => {
    const label = isSidebarOpen
        ? COPY.LABEL_FOR_COLLAPSE_TASK_LIST
        : COPY.LABEL_FOR_EXPAND_TASK_LIST;

    return (
        <IconButton
            aria-label={label}
            isActive={isSidebarOpen}
            title={`${label}. ${COPY.TIPS.TOGGLE_TASK_LIST}`}
            onClick={() => onChangeIsSidebarOpen(!isSidebarOpen)}
        >
            {isSidebarOpen ? ICONS.COLLAPSE_TASK_LIST : ICONS.EXPAND_TASK_LIST}
        </IconButton>
    );
};

export default TaskListToggleButton;
