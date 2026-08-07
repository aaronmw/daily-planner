import React, { useEffect, useRef } from 'react';
import useDrop from '../hooks/useDrop';
import cx from '../utils/cx';
import { SecondaryAppColumn } from './AppColumn';
import FlexBox from './atoms/FlexBox';
import { SIDEBAR_DEFAULT_WIDTH } from './atoms/tokens';
import SidebarToggleButton from './TaskListToggleButton';
import ToolBar from './ToolBar';

const Sidebar = ({
    appActions,
    appData,
    children,
    className,
    ...otherProps
}) => {
    const { onChangeIsSidebarOpen, onUpdateTask } = appActions;

    const { isSidebarOpen, selectedListId } = appData;

    const isTaskListForcedOpenRef = useRef(false);

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
            className={cx('planner-sidebar-column', className)}
            {...sidebarDropProps}
            {...otherProps}
        >
            <div
                className="planner-sidebar-stage"
                style={{
                    '--planner-sidebar-expanded-width': SIDEBAR_DEFAULT_WIDTH,
                }}
            >
                <FlexBox
                    align="stretch"
                    direction="column"
                    aria-hidden={!isSidebarOpen}
                    className="planner-sidebar-expanded-content"
                    data-visible={isSidebarOpen}
                    inert={!isSidebarOpen}
                >
                    <ToolBar justify="flex-end">
                        <SidebarToggleButton
                            isSidebarOpen={isSidebarOpen}
                            onChangeIsSidebarOpen={onChangeIsSidebarOpen}
                        />
                    </ToolBar>

                    {children}
                </FlexBox>

                <div
                    aria-hidden={isSidebarOpen}
                    className="planner-sidebar-collapsed-content"
                    data-visible={!isSidebarOpen}
                    inert={isSidebarOpen}
                >
                    <ToolBar isCollapsed>
                        <SidebarToggleButton
                            isSidebarOpen={isSidebarOpen}
                            onChangeIsSidebarOpen={onChangeIsSidebarOpen}
                        />
                    </ToolBar>
                </div>
            </div>
        </SecondaryAppColumn>
    );
};

export default Sidebar;
