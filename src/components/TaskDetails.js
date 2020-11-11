import React, { useEffect, useRef, useState } from 'react';
import marked from 'marked';
import styled from 'styled-components';
import Button from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    BULLET_SIZE,
    COLOR_BORDER,
    COLOR_BORDER_HOVER,
    COLOR_PRIMARY,
    COLOR_SHADED,
    GRID_UNIT,
    UNIFIED_TRANSITION,
} from '../tokens';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0.1);
    border-left: 2px solid ${COLOR_BORDER};
    border-right: 2px solid ${COLOR_BORDER};
    z-index: 1;
`;

const TaskHeader = styled.h1(
    ({ icon }) => `
        background-color: ${COLOR_SHADED};
        font-size: 1.4rem;
        padding: calc(${GRID_UNIT}) ${GRID_UNIT};
        position: relative;
    
        &:before {
            content: '${icon}';
            font-size: 3rem;
            position: absolute;
            right: ${GRID_UNIT};
            top: 50%;
            transform: translateY(-50%);
        }
    `
);

const StyledTaskNotesViewer = styled.div(
    ({ isEmpty }) => `
        cursor: pointer;
        padding: calc(${GRID_UNIT}) ${GRID_UNIT};
        position: relative;
        height: 100%;
        
        ${
            isEmpty
                ? `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${COLOR_BORDER};
                `
                : ''
        }
    
        & > * + * {
            margin-top: calc(${GRID_UNIT} / 2);
        }
    
        &:hover {
            &:before {
                opacity: 1;
            }
    
            &:after {
                opacity: 1;
                transform: translateX(0) rotateY(-180deg);
            }
        }
    
        // Tracing element
        &:before {
            border: 2px dashed ${COLOR_BORDER_HOVER};
            border-radius: ${BORDER_RADIUS};
            content: '';
            opacity: 0;
            position: absolute;
            top: calc(${GRID_UNIT} / 2);
            right: calc(${GRID_UNIT} / 2);
            bottom: calc(${GRID_UNIT} / 2);
            left: calc(${GRID_UNIT} / 2);
            ${UNIFIED_TRANSITION};
        }
    
        // Pencil
        &:after {
            content: '✏️';
            position: absolute;
            top: calc(${GRID_UNIT});
            right: calc(${GRID_UNIT} * 1.1);
            transform: translateX(200%) rotateY(-180deg);
            filter: saturate(0);
            opacity: 0;
            ${UNIFIED_TRANSITION};
        }
        
        blockquote {
            border-left: 5px solid ${COLOR_BORDER};
            font-style: italic;
            padding: calc(${GRID_UNIT} * 0.5) ${GRID_UNIT};
        }
    
        li {
            margin-top: calc(${GRID_UNIT} / 4);
            padding-left: ${GRID_UNIT};
            position: relative;
    
            &:before {
                content: '';
                box-sizing: border-box;
                position: absolute;
                top: 5px;
                left: 0;
                border: 2px solid ${COLOR_BORDER};
                border-radius: 100px;
                width: ${BULLET_SIZE};
                height: ${BULLET_SIZE};
            }
        }
    `
);

const TaskNotesViewer = ({ notes, ...otherProps }) => {
    const isEmpty = notes.trim() === '';

    return (
        <StyledTaskNotesViewer
            dangerouslySetInnerHTML={{
                __html: !isEmpty ? marked(notes) : 'No notes',
            }}
            isEmpty={isEmpty}
            {...otherProps}
        />
    );
};

const TaskNotesEditorTextarea = styled.textarea`
    border-radius: ${BORDER_RADIUS};
    box-shadow: 0 0 0 1px ${COLOR_BORDER}, 0 0 5px ${COLOR_BORDER} inset;
    flex-grow: 1;
    margin: calc(${GRID_UNIT} / 2);
    padding: calc(${GRID_UNIT} / 2);
    outline: none;

    &:hover {
        box-shadow: 0 0 0 2px ${COLOR_BORDER_HOVER},
            0 0 5px ${COLOR_BORDER} inset;
    }
    &:focus,
    &:active {
        box-shadow: 0 0 0 2px ${COLOR_PRIMARY}, 0 0 5px ${COLOR_BORDER} inset;
    }
`;

const TaskNotesEditor = ({ task, onCancel, onUpdateState, ...otherProps }) => {
    const { id: taskId, notes } = task;
    const [notesBuffer, setNotesBuffer] = useState(notes);
    const editorTextareaRef = useRef(null);

    useEffect(() => {
        if (editorTextareaRef.current) {
            editorTextareaRef.current.select();
            editorTextareaRef.current.focus();
        }
    }, [editorTextareaRef]);

    const handleChange = evt => setNotesBuffer(evt.target.value);

    const handleClickCancel = onCancel;

    const handleClickSave = () => {
        onUpdateState({
            tasks: {
                [taskId]: {
                    notes: notesBuffer,
                },
            },
        });
    };

    const handleKeyDown = evt => {
        if (evt.key === 'Enter' && evt.shiftKey) {
            handleClickSave();
        }
    };

    return (
        <>
            <TaskNotesEditorTextarea
                ref={editorTextareaRef}
                value={notesBuffer}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                {...otherProps}
            />
            <FlexBox justify="flex-end" margin={0.5} spacing={0.25}>
                <Button onClick={handleClickCancel}>Cancel</Button>
                <Button onClick={handleClickSave}>Save</Button>
            </FlexBox>
        </>
    );
};

const TaskDetails = ({ task, onUpdateState, ...otherProps }) => {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const { icon, label, notes } = task;

    useEffect(() => {
        setIsEditingNotes(false);
    }, [task]);

    const handleCancel = () => setIsEditingNotes(false);

    return (
        <Container {...otherProps}>
            <TaskHeader icon={icon}>{label}</TaskHeader>
            {isEditingNotes ? (
                <TaskNotesEditor
                    task={task}
                    onCancel={handleCancel}
                    onUpdateState={onUpdateState}
                />
            ) : (
                <TaskNotesViewer
                    notes={notes}
                    onClick={() => setIsEditingNotes(true)}
                />
            )}
        </Container>
    );
};

export default TaskDetails;
