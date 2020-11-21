import React, { useLayoutEffect, useState } from 'react';
import styled from 'styled-components';
import marked from 'marked';
import AppColumn from './AppColumn';
import EditInPlace from './EditInPlace';
import OptionBar from './OptionBar';
import Box from './atoms/Box';
import FlexBox from './atoms/FlexBox';
import {
    COLORS,
    COPY,
    DEFAULT_TASK_ICON,
    DURATION_OPTIONS,
} from './atoms/tokens';

const ANIMATION_DURATION = 200;

const Container = styled(AppColumn)(
    ({ isLoading, theme }) => `
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);
        border-left: 2px solid ${COLORS[theme.name].BORDER_NEUTRAL};
        border-right: 2px solid ${COLORS[theme.name].BORDER_NEUTRAL};
        overflow: unset;
        z-index: 11;
        
        // Blackout curtain
        &:before {
            background-color: ${COLORS[theme.name].BACKGROUND};
            bottom: 0;
            content: '';
            left: 0;
            opacity: ${isLoading ? 1 : 0};
            pointer-events: none;
            position: absolute;
            right: 0;
            top: 0;
            transition: opacity ${ANIMATION_DURATION / 2 / 1000}s ease-in-out;
            z-index: 10;
        }
    `
);

const TaskHeader = styled(FlexBox).attrs({
    as: 'h1',
    align: 'center',
    spacing: 1.5,
    paddingX: 1,
    paddingY: 0.75,
})(
    ({ theme }) => `
        background-color: ${COLORS[theme.name].SHADED};
        font-size: 1.4rem;
        font-weight: 900;
        position: relative;
    `
);

const TaskHeaderLabel = styled(Box)`
    flex-grow: 1;
    flex-shrink: 1;
    justify-self: stretch;
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

const TaskDetails = ({
    appActions = {},
    appData = {},
    isCreatingTask = false,
    task = {},
    ...otherProps
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const { onUpdateTask } = appActions;
    const { icon, id, label, notes, scheduled_minutes } = task;
    const isEmpty = !task.id;

    const handleUpdateTask = (field, value) =>
        onUpdateTask(id, { [field]: value });

    const handleSaveDuration = newDuration =>
        handleUpdateTask('scheduled_minutes', newDuration);

    const handleSaveIcon = newNotes => handleUpdateTask('icon', newNotes);

    const handleSaveLabel = newLabel => handleUpdateTask('label', newLabel);

    const handleSaveNotes = newNotes => handleUpdateTask('notes', newNotes);

    useLayoutEffect(() => {
        setIsLoading(true);
        const newTimer = setTimeout(
            () => setIsLoading(false),
            ANIMATION_DURATION / 2
        );
        return () => clearTimeout(newTimer);
    }, [task.id]);

    return (
        <Container
            isLoading={isLoading}
            label="Selected Task Details"
            {...otherProps}
        >
            {!isEmpty && !isLoading && (
                <>
                    <OptionBar
                        renderSelectedOption={option => `${option} mins`}
                        selectedOption={scheduled_minutes}
                        options={DURATION_OPTIONS}
                        onChange={handleSaveDuration}
                    />

                    <TaskHeader>
                        <TaskHeaderLabel>
                            <EditInPlace
                                isRemotelyActivated={isCreatingTask}
                                placeholder={COPY.empty_label}
                                value={label}
                                onSave={handleSaveLabel}
                            />
                        </TaskHeaderLabel>
                        <TaskHeaderIcon>
                            <EditInPlace
                                placeholder={DEFAULT_TASK_ICON}
                                value={icon}
                                onSave={handleSaveIcon}
                            />
                        </TaskHeaderIcon>
                    </TaskHeader>

                    <EditInPlace
                        isFlexible
                        isMultiLine
                        margin={1}
                        placeholder={COPY.empty_notes}
                        render={rawNotes => (
                            <div
                                className="markdown"
                                dangerouslySetInnerHTML={{
                                    __html: marked(rawNotes),
                                }}
                            />
                        )}
                        wrapperStyles={{
                            bottom: 0,
                            left: 0,
                            overflow: 'auto',
                            position: 'absolute',
                            right: 0,
                            top: 0,
                        }}
                        value={notes}
                        onSave={handleSaveNotes}
                    />
                </>
            )}
        </Container>
    );
};

export default TaskDetails;
