import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import useBulletedLists from '../hooks/useBulletedLists';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import useMarkdownShortcuts from '../hooks/useMarkdownShortcuts';
import useTabIndentation from '../hooks/useTabIndentation';
import Box from './atoms/Box';
import { BORDER_RADIUS, GRID_UNIT, UNIFIED_TRANSITION } from './atoms/tokens';

const Container = styled(Box).attrs({
    isFlexible: true,
})(
    ({ isEditable, isEditing, theme, tracerColor }) => `
        cursor: ${isEditing ? 'text' : 'pointer'};
        position: relative;
        user-select: ${isEditing ? 'text' : 'none'};
        width: auto;
        height: auto;

        // Tracing element
        &:before {
            border:
                ${
                    isEditing
                        ? 'none'
                        : `2px dashed ${tracerColor || theme.DOTTED_LINE}`
                };
            box-shadow:
                ${
                    isEditing
                        ? `0 0 0 2px ${tracerColor || theme.PRIMARY}`
                        : `0 0 0 0 ${tracerColor || theme.PRIMARY}`
                };
            border-radius: ${BORDER_RADIUS};
            content: '';
            opacity: ${isEditing ? 1 : 0};
            pointer-events: none;
            position: absolute;
            top: calc(${GRID_UNIT} * 0.25 * -1);
            right: calc(${GRID_UNIT} * 0.5 * -1);
            bottom: calc(${GRID_UNIT} * 0.25 * -1);
            left: calc(${GRID_UNIT} * 0.5 * -1);
            ${UNIFIED_TRANSITION};
        }

        &:focus,
        &:hover {
            &:before {
                opacity: ${isEditable ? 1 : 0};
            }
        }
    `
);

const StyledTextarea = styled.textarea(
    ({ theme }) => `
        display: block;
        height: 100%;
        width: 100%;

        ::selection {
            background-color: ${theme.HIGH_CONTRAST_BACKGROUND};
            color: white;
        }
    `
);

const Canvas = styled(Box)(
    ({ isEmpty }) => `
        opacity: ${isEmpty ? 0.6 : 1};
    `
);

const keyboardShortcutNamespace = 'edit-in-place';

const EditInPlace = ({
    canvasStyles = {},
    doubleClickToEdit = false,
    isEditable = true,
    isMultiLine = false,
    isRemotelyActivated = false,
    placeholder = 'Empty',
    render = value => value,
    tracerColor = null,
    value = '',
    onSave = () => {},
    ...otherProps
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [bufferedValue, setBufferedValue] = useState(value);
    const [measuringElementHeight, setMeasuringElementHeight] = useState(null);
    const containerElementRef = useRef(null);
    const inputRef = useRef(null);
    const measuringElementRef = useRef(null);
    const isEmpty = bufferedValue.trim() === '';
    const isSingleLine = !isMultiLine;

    useEffect(() => {
        setBufferedValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.select();
            inputRef.current.focus();
        }
    }, [inputRef, isEditing]);

    useEffect(() => {
        const el = measuringElementRef.current;
        if (el) {
            setMeasuringElementHeight(el.offsetHeight);
        }
    }, [bufferedValue, isEditing, measuringElementRef]);

    const handleClick = useCallback(() => {
        if (isEditable && !isEditing) {
            setBufferedValue(value);
            setIsEditing(true);
        }
    }, [isEditable, isEditing, setBufferedValue, setIsEditing, value]);

    useEffect(() => {
        if (isRemotelyActivated === true) {
            handleClick();
        }
    }, [handleClick, isRemotelyActivated]);

    const handleBlur = () => {
        onSave(bufferedValue);
        setIsEditing(false);
    };

    const handleChange = evt => {
        setBufferedValue(evt.target.value);
    };

    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['cmd + escape', 'shift + escape'],
        () => {
            setBufferedValue(value);
            setIsEditing(false);
        },
        inputRef
    );

    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['escape', 'cmd + enter', 'shift + enter'],
        handleBlur,
        inputRef
    );

    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'enter',
        evt => {
            if (evt.target === containerElementRef.current) {
                evt.preventDefault();
                handleClick();
            } else if (
                evt.target.tagName.toLowerCase() === 'textarea' &&
                isSingleLine
            ) {
                evt.preventDefault();
                onSave(bufferedValue);
                setIsEditing(false);
                return false;
            }
        },
        inputRef
    );

    useTabIndentation(inputRef);

    useBulletedLists(inputRef);

    useMarkdownShortcuts(inputRef);

    return (
        <Container
            isEditable={isEditable}
            isEditing={isEditing}
            ref={containerElementRef}
            tabIndex={0}
            tracerColor={tracerColor}
            onClick={!doubleClickToEdit ? handleClick : null}
            onDoubleClick={doubleClickToEdit ? handleClick : null}
            {...otherProps}
        >
            <Canvas isEmpty={isEmpty} style={{ ...canvasStyles }}>
                {isEditing ? (
                    <>
                        <div
                            ref={measuringElementRef}
                            style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                opacity: 0,
                                whiteSpace: 'pre-wrap',
                                width: '100%',
                            }}
                        >
                            {bufferedValue}.
                        </div>
                        <StyledTextarea
                            disabled={!isEditing}
                            ref={inputRef}
                            rows={1}
                            style={{
                                height: `${measuringElementHeight}px`,
                            }}
                            value={bufferedValue}
                            onBlur={handleBlur}
                            onChange={handleChange}
                        />
                    </>
                ) : (
                    render(isEmpty ? placeholder : value)
                )}
            </Canvas>
        </Container>
    );
};

export default memo(EditInPlace);
