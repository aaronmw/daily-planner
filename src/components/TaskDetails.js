import React, { useCallback } from 'react';
import { canWrite, ROLES } from '../collaboration/roles';
import EditableText from './EditableText';
import OptionBar from './OptionBar';
import TaskNotesEditor from './TaskNotesEditor';
import TaskComments from './TaskComments';
import Box from './atoms/Box';
import FlexBox from './atoms/FlexBox';
import { COPY, ICONS, DURATION_OPTIONS, FONTS } from './atoms/tokens';

const TaskHeader = ({ style, ...otherProps }) => (
    <FlexBox
        as="h1"
        align="center"
        spacing={1.5}
        paddingX={1}
        paddingY={0.75}
        className="relative bg-planner-shaded font-black"
        style={{ fontSize: FONTS.LARGE.SIZE, ...style }}
        {...otherProps}
    />
);

const TaskHeaderLabel = props => (
    <Box className="grow shrink self-center" {...props} />
);

const TaskHeaderIcon = props => (
    <Box
        role="img"
        className="shrink-0 grow-0 self-start text-5xl leading-[1.4rem] w-12"
        {...props}
    />
);

const DurationOptionBar = props => (
    <OptionBar
        className="border-t border-planner-background bg-planner-shaded"
        {...props}
    />
);

const EMPTY_APP_ACTIONS = Object.freeze({});
const EMPTY_APP_DATA = Object.freeze({
    plannerIndexes: Object.freeze({ taskById: new Map() }),
});

const TaskDetails = ({
    appActions = EMPTY_APP_ACTIONS,
    appData = EMPTY_APP_DATA,
}) => {
    const {
        onCancelLabelEdit,
        onCompleteLabelEdit,
        onFulfillLabelEdit,
        onUpdateTask,
    } = appActions;
    const { labelEditSession, plannerIndexes, selectedTaskId } = appData;
    const activeTask = plannerIndexes.taskById.get(selectedTaskId) || {};
    const { duration_minutes, icon, id, label } = activeTask;
    const isEmpty = !activeTask.id;
    const isEditable =
        plannerIndexes.listById.get(activeTask.list_id)?.is_private_copy ||
        !appData.collaboration?.isEnabled ||
        canWrite(
            appData.collaboration?.roleByListId?.get(activeTask.list_id) ||
                ROLES.READ
        );

    const handleUpdateTask = useCallback(
        (field, value) => onUpdateTask(id, { [field]: value }),
        [id, onUpdateTask]
    );

    const handleSaveDuration = useCallback(
        newDuration => handleUpdateTask('duration_minutes', newDuration),
        [handleUpdateTask]
    );

    const handleSaveIcon = useCallback(
        newNotes => handleUpdateTask('icon', newNotes),
        [handleUpdateTask]
    );

    const handleSaveLabel = useCallback(
        (newLabel, { editRequestId } = {}) => {
            handleUpdateTask('label', newLabel);

            if (editRequestId !== null && editRequestId !== undefined) {
                onCompleteLabelEdit(editRequestId);
            }
        },
        [handleUpdateTask, onCompleteLabelEdit]
    );
    const labelEditRequest =
        labelEditSession?.entityType === 'task' &&
        labelEditSession.entityId === id
            ? {
                  id: labelEditSession.requestId,
                  selectAll: true,
              }
            : null;

    return (
        !isEmpty && (
            <>
                <TaskHeader>
                    <TaskHeaderLabel>
                        <EditableText
                            key={id}
                            editRequest={labelEditRequest}
                            isEditable={isEditable}
                            placeholder={COPY.EMPTY_LABEL}
                            value={label}
                            onCancel={({ editRequestId }) =>
                                onCancelLabelEdit(editRequestId)
                            }
                            onEditRequestFulfilled={onFulfillLabelEdit}
                            onSave={handleSaveLabel}
                        />
                    </TaskHeaderLabel>
                    <TaskHeaderIcon>
                        <EditableText
                            isEditable={isEditable}
                            placeholder={ICONS.TASK_DEFAULT}
                            value={icon}
                            onSave={handleSaveIcon}
                        />
                    </TaskHeaderIcon>
                </TaskHeader>

                <TaskNotesEditor
                    key={id}
                    appActions={appActions}
                    appData={appData}
                    task={activeTask}
                    isEditable={isEditable}
                />

                <DurationOptionBar
                    disabled={!isEditable}
                    options={DURATION_OPTIONS}
                    renderSelectedOption={option => <span>{option} mins</span>}
                    selectedOption={duration_minutes}
                    title={COPY.TIPS.SETTING_DURATION}
                    onChange={handleSaveDuration}
                />
                <TaskComments
                    appActions={appActions}
                    appData={appData}
                    task={activeTask}
                />
            </>
        )
    );
};

export default TaskDetails;
