import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import styled from 'styled-components';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
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

    useEffect(
        () => {
            setBufferedValue(value);
        },
        [value]
    );

    useEffect(
        () => {
            if (isEditing && inputRef.current) {
                inputRef.current.select();
                inputRef.current.focus();
            }
        },
        [inputRef, isEditing]
    );

    useEffect(
        () => {
            const el = measuringElementRef.current;
            if (el) {
                setMeasuringElementHeight(el.offsetHeight);
            }
        },
        [bufferedValue, isEditing, measuringElementRef]
    );

    const handleClick = useCallback(
        () => {
            if (isEditable && !isEditing) {
                setBufferedValue(value);
                setIsEditing(true);
            }
        },
        [isEditable, isEditing, setBufferedValue, setIsEditing, value]
    );

    useEffect(
        () => {
            if (isRemotelyActivated === true) {
                handleClick();
            }
        },
        [handleClick, isRemotelyActivated]
    );

    const handleBlur = () => {
        onSave(bufferedValue);
        setIsEditing(false);
    };

    const handleChange = evt => {
        setBufferedValue(evt.target.value);
    };

    const textareaKeyMap = useMemo(
        () => {
            const saveAndClose = () => {
                onSave(bufferedValue);
                setIsEditing(false);
            };

            const close = () => {
                setBufferedValue(value);
                setIsEditing(false);
            };

            const getIndentedSelection = ({
                selectionStart,
                selectionEnd,
                tabString,
                outdent = false,
            }) => {
                const tabSize = tabString.length;
                const textBeforeSelection = bufferedValue.substring(
                    0,
                    selectionStart
                );
                const textAfterSelection = bufferedValue.substring(
                    selectionEnd
                );
                const textWithinSelection = bufferedValue.substring(
                    selectionStart,
                    selectionEnd
                );

                let newBuffer, newSelectionStart, newSelectionEnd;

                if (outdent) {
                    const trimmedTextWithinSelection = textWithinSelection.trimStart();
                    const textBeforeTrimmedSelection = bufferedValue.substring(
                        0,
                        selectionEnd - trimmedTextWithinSelection.length
                    );
                    const tailSample = textBeforeTrimmedSelection.substring(
                        textBeforeTrimmedSelection.length - tabSize
                    );
                    const isIndented = tailSample === tabString;

                    if (!isIndented) {
                        return {
                            newBuffer: bufferedValue,
                            newSelectionStart: selectionStart,
                            newSelectionEnd: selectionEnd,
                        };
                    }

                    newBuffer =
                        textBeforeTrimmedSelection.substring(
                            0,
                            textBeforeTrimmedSelection.length - tabSize
                        ) +
                        trimmedTextWithinSelection +
                        textAfterSelection;

                    newSelectionStart =
                        selectionEnd -
                        trimmedTextWithinSelection.length -
                        tabSize;

                    newSelectionEnd =
                        newSelectionStart + trimmedTextWithinSelection.length;
                } else {
                    newBuffer =
                        textBeforeSelection +
                        tabString +
                        textWithinSelection +
                        textAfterSelection;

                    newSelectionStart = selectionStart + tabSize;
                    newSelectionEnd = selectionEnd + tabSize;
                }

                return {
                    newBuffer,
                    newSelectionStart,
                    newSelectionEnd,
                };
            };

            const handleIndentation = (evt, options = { outdent: false }) => {
                if (!isSingleLine) {
                    const el = evt.target;
                    const { selectionEnd, selectionStart } = el;

                    const tabString = '  ';

                    const {
                        newBuffer,
                        newSelectionStart,
                        newSelectionEnd,
                    } = getIndentedSelection({
                        selectionStart,
                        selectionEnd,
                        tabString,
                        outdent: options.outdent,
                    });

                    console.log({
                        newBuffer,
                        newSelectionStart,
                        newSelectionEnd,
                    });

                    setBufferedValue(newBuffer);

                    el.selectionStart = newSelectionStart;
                    el.selectionEnd = newSelectionEnd;
                }
            };

            return {
                'cmd + escape': close,
                'shift + escape': close,
                'cmd + enter': saveAndClose,
                'shift + enter': saveAndClose,
                tab: evt => {
                    if (!isSingleLine) {
                        evt.preventDefault();
                        handleIndentation(evt);
                    }
                },
                'shift + tab': evt => {
                    if (!isSingleLine) {
                        evt.preventDefault();
                        handleIndentation(evt, { outdent: true });
                    }
                },
                escape: saveAndClose,
                enter: evt => {
                    if (
                        evt.target.tagName.toLowerCase() === 'textarea' &&
                        isSingleLine
                    ) {
                        saveAndClose();
                        evt.preventDefault();
                        return false;
                    }
                },
            };
        },
        [bufferedValue, onSave, isSingleLine, value]
    );

    useKeyboardShortcuts(textareaKeyMap, inputRef);

    const keyMap = useMemo(
        () => {
            const enterEditMode = evt => {
                if (evt.target === containerElementRef.current) {
                    evt.preventDefault();
                    handleClick();
                }
            };

            return {
                enter: enterEditMode,
            };
        },
        [handleClick, containerElementRef]
    );

    useKeyboardShortcuts(keyMap, containerElementRef);

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
