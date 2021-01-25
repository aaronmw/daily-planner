import React, { useCallback } from 'react';
import styled from 'styled-components';
import marked from 'marked';
import EditInPlace from './EditInPlace';
import OptionBar from './OptionBar';
import Box from './atoms/Box';
import FlexBox from './atoms/FlexBox';
import {
    COPY,
    ICONS,
    DURATION_OPTIONS,
    FONTS,
    BORDER_WIDTH,
} from './atoms/tokens';

const TaskHeader = styled(FlexBox).attrs({
    forwardedAs: 'h1',
    align: 'center',
    spacing: 1.5,
    paddingX: 1,
    paddingY: 0.75,
})(
    ({ theme }) => `
        background-color: ${theme.SHADED};
        font-size: ${FONTS.LARGE.SIZE};
        font-weight: 900;
        position: relative;
    `
);

const TaskHeaderLabel = styled(Box)`
    flex-grow: 1;
    flex-shrink: 1;
    align-self: center;
`;

const TaskHeaderIcon = styled(Box).attrs({
    role: 'img',
})`
    align-self: flex-start;
    flex-grow: 0;
    flex-shrink: 0;
    font-size: 3rem;
    line-height: 1.4rem;
    width: 3rem;
`;

const DurationOptionBar = styled(OptionBar)(
    ({ theme }) => `
        background-color: ${theme.SHADED};
        border-top: ${BORDER_WIDTH} solid ${theme.BACKGROUND};
    `
);

const TaskDetails = ({ appActions = {}, appData = {} }) => {
    const { onUpdateTask } = appActions;
    const { isCreatingTask, selectedTaskId, tasks } = appData;
    const activeTask = tasks.find(task => task.id === selectedTaskId) || {};
    const { icon, id, label, notes, scheduled_minutes } = activeTask;
    const isEmpty = !activeTask.id;

    const handleUpdateTask = useCallback(
        (field, value) => onUpdateTask(id, { [field]: value }),
        [id, onUpdateTask]
    );

    const handleSaveDuration = useCallback(
        newDuration => handleUpdateTask('scheduled_minutes', newDuration),
        [handleUpdateTask]
    );

    const handleSaveIcon = useCallback(
        newNotes => handleUpdateTask('icon', newNotes),
        [handleUpdateTask]
    );

    const handleSaveLabel = useCallback(
        newLabel => handleUpdateTask('label', newLabel),
        [handleUpdateTask]
    );

    const handleSaveNotes = useCallback(
        newNotes => handleUpdateTask('notes', newNotes),
        [handleUpdateTask]
    );

    return (
        !isEmpty && (
            <>
                <TaskHeader>
                    <TaskHeaderLabel>
                        <EditInPlace
                            isRemotelyActivated={isCreatingTask}
                            placeholder={COPY.EMPTY_LABEL}
                            value={label}
                            onSave={handleSaveLabel}
                        />
                    </TaskHeaderLabel>
                    <TaskHeaderIcon>
                        <EditInPlace
                            placeholder={ICONS.TASK_DEFAULT}
                            value={icon}
                            onSave={handleSaveIcon}
                        />
                    </TaskHeaderIcon>
                </TaskHeader>

                <EditInPlace
                    isFlexible
                    isMultiLine
                    margin={1}
                    placeholder={COPY.EMPTY_NOTES}
                    render={rawNotes => (
                        <div
                            className="markdown"
                            dangerouslySetInnerHTML={{
                                __html: marked(rawNotes),
                            }}
                        />
                    )}
                    canvasStyles={{
                        bottom: 0,
                        fontSize: FONTS.LARGE.SIZE,
                        left: 0,
                        overflow: 'auto',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                    }}
                    value={notes}
                    onSave={handleSaveNotes}
                />

                <DurationOptionBar
                    options={DURATION_OPTIONS}
                    renderSelectedOption={option => <span>{option} mins</span>}
                    selectedOption={scheduled_minutes}
                    title={COPY.TIPS.SETTING_DURATION}
                    onChange={handleSaveDuration}
                />
            </>
        )
    );
};

export default TaskDetails;
