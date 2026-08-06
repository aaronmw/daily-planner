import React, { useEffect, useRef } from 'react';
import useDrop from '../hooks/useDrop';
import { SecondaryAppColumn } from './AppColumn';
import { COPY } from './atoms/tokens';
import SidebarToggleButton from './TaskListToggleButton';
import ToolBar from './ToolBar';

const Sidebar = ({ appActions, appData, children, ...otherProps }) => {
    const { onChangeIsSidebarOpen, onUpdateTask } = appActions;

    const {
        isShowingTrashContents,
        isSidebarOpen,
        plannerIndexes,
        selectedListId,
    } = appData;

    const isTaskListForcedOpenRef = useRef(false);

    const selectedList = plannerIndexes.listById.get(selectedListId);

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
            isTaskListForcedOpenRef.current = true;
            onChangeIsSidebarOpen(true);
            return;
        }

        if (
            isTaskListForcedOpenRef.current &&
            !sidebarDropProps.isTargetedForDrop
        ) {
            isTaskListForcedOpenRef.current = false;
            onChangeIsSidebarOpen(false);
        }
    }, [
        sidebarDropProps.isTargetedForDrop,
        isSidebarOpen,
        onChangeIsSidebarOpen,
    ]);

    return (
        <SecondaryAppColumn
            label={
                !isSidebarOpen
                    ? ''
                    : isShowingTrashContents
                      ? COPY.LABEL_FOR_TRASHED_TASKS
                      : selectedList?.label || ''
            }
            {...sidebarDropProps}
            {...otherProps}
        >
            {!isSidebarOpen ? (
                <ToolBar isCollapsed>
                    <SidebarToggleButton
                        isSidebarOpen={isSidebarOpen}
                        onChangeIsSidebarOpen={onChangeIsSidebarOpen}
                    />
                </ToolBar>
            ) : (
                <>
                    <ToolBar justify="flex-end">
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
