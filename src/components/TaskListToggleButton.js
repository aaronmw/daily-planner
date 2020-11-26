import React from 'react';
import { ToggleButton } from './atoms/Button';
import { COPY, ICONS } from './atoms/tokens';

const TaskListToggleButton = ({ isSidebarOpen, onChangeIsSidebarOpen }) => (
    <ToggleButton
        isActive={isSidebarOpen}
        title={COPY.TIPS.TOGGLE_TASK_LIST}
        onClick={() => onChangeIsSidebarOpen(!isSidebarOpen)}
    >
        {isSidebarOpen ? ICONS.LEFT : ICONS.RIGHT}
    </ToggleButton>
);

export default TaskListToggleButton;
