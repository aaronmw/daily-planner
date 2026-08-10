import React from 'react';
import ColumnToggleButton from './ColumnToggleButton';
import { COPY } from './atoms/tokens';

const TaskListToggleButton = ({ isSidebarOpen, onChangeIsSidebarOpen }) => {
    return (
        <ColumnToggleButton
            collapseLabel={COPY.LABEL_FOR_COLLAPSE_TASK_LIST}
            expandLabel={COPY.LABEL_FOR_EXPAND_TASK_LIST}
            isOpen={isSidebarOpen}
            onChangeIsOpen={onChangeIsSidebarOpen}
            titleSuffix={COPY.TIPS.TOGGLE_TASK_LIST}
        />
    );
};

export default TaskListToggleButton;
