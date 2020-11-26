import React, { useEffect, useState } from 'react';
import useDrop from '../hooks/useDrop';
import { SecondaryAppColumn } from './AppColumn';
import { ToggleButton } from './atoms/Button';
import { COPY, ICONS } from './atoms/tokens';
import SidebarToggleButton from './TaskListToggleButton';
import ToolBar from './ToolBar';

const Sidebar = ({ appActions, appData, children, ...otherProps }) => {
    const { onChangeIsSidebarOpen, onChangeTheme, onUpdateTask } = appActions;

    const {
        isShowingTrashContents,
        isSidebarOpen,
        lists,
        selectedListId,
        theme,
    } = appData;

    const [isTaskListForcedOpen, setIsTaskListForcedOpen] = useState(false);

    const selectedList = lists.find(list => list.id === selectedListId);

    const [sidebarDropProps] = useDrop({
        'task-id': taskId => {
            onUpdateTask(taskId, {
                list_id: selectedListId,
                scheduled: false,
            });
        },
    });

    useEffect(() => {
        if (!isSidebarOpen && sidebarDropProps.isTargetedForDrop) {
            setIsTaskListForcedOpen(true);
            onChangeIsSidebarOpen(true);
            return;
        }

        if (isTaskListForcedOpen && !sidebarDropProps.isTargetedForDrop) {
            setIsTaskListForcedOpen(false);
            onChangeIsSidebarOpen(false);
        }
    }, [
        sidebarDropProps.isTargetedForDrop,
        isTaskListForcedOpen,
        isSidebarOpen,
        setIsTaskListForcedOpen,
        onChangeIsSidebarOpen,
    ]);

    return (
        <SecondaryAppColumn
            label={
                !isSidebarOpen
                    ? ''
                    : isShowingTrashContents
                    ? COPY.LABEL_FOR_TRASH
                    : selectedList.label
            }
            {...sidebarDropProps}
            {...otherProps}
        >
            {!isSidebarOpen ? (
                <SidebarToggleButton
                    isSidebarOpen={isSidebarOpen}
                    onChangeIsSidebarOpen={onChangeIsSidebarOpen}
                />
            ) : (
                <>
                    <ToolBar>
                        <ToggleButton
                            isActive={theme === 'DARK'}
                            title={COPY.TIPS.TOGGLE_DARK_MODE}
                            onClick={() =>
                                onChangeTheme(
                                    theme === 'LIGHT' ? 'DARK' : 'LIGHT'
                                )
                            }
                        >
                            {theme === 'LIGHT'
                                ? ICONS.DARK_MODE
                                : ICONS.LIGHT_MODE}
                        </ToggleButton>
                        <SidebarToggleButton
                            isSidebarOpen={isSidebarOpen}
                            onChangeIsSidebarOpen={onChangeIsSidebarOpen}
                        />
                    </ToolBar>

                    {children}
                </>
            )}
        </SecondaryAppColumn>
    );
};

export default Sidebar;
