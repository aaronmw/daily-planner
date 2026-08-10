import React, { useEffect, useRef } from 'react';
import useDrop from '../hooks/useDrop';
import cx from '../utils/cx';
import { SecondaryAppColumn } from './AppColumn';
import CollapsibleColumn from './CollapsibleColumn';
import { COPY } from './atoms/tokens';

const Sidebar = ({
    appActions,
    appData,
    children,
    className,
    label = COPY.LABEL_FOR_TASK_LIST,
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
        <CollapsibleColumn
            canCollapse={appData.canCollapseColumns}
            className={cx('planner-sidebar-column', className)}
            collapseLabel={COPY.LABEL_FOR_COLLAPSE_TASK_LIST}
            expandLabel={COPY.LABEL_FOR_EXPAND_TASK_LIST}
            expandedMinWidth="22vw"
            isOpen={isSidebarOpen}
            onChangeIsOpen={onChangeIsSidebarOpen}
            titleSuffix={COPY.TIPS.TOGGLE_TASK_LIST}
            {...otherProps}
        >
            {toggleButton => (
                <SecondaryAppColumn
                    className="planner-task-list-column"
                    headerActions={toggleButton}
                    label={label}
                    {...sidebarDropProps}
                >
                    {children}
                </SecondaryAppColumn>
            )}
        </CollapsibleColumn>
    );
};

export default Sidebar;
