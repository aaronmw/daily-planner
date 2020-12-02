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
    ({ isEditable, isEditing, theme, tracingElementStyles = () => {} }) => `
        cursor: ${isEditing ? 'text' : 'pointer'};
        position: relative;
        user-select: ${isEditing ? 'text' : 'none'};
        width: auto;
        height: auto;
    
        // Tracing element
        &:before {
            border:
                ${isEditing ? 'none' : `2px dashed ${theme.BORDER}`};
            box-shadow:
                ${
                    isEditing
                        ? `0 0 0 2px ${theme.PRIMARY}`
                        : `0 0 0 0 ${theme.PRIMARY}`
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
            ${tracingElementStyles(theme)}
        }
        
        &:focus,
        &:hover {
            &:before {
                opacity: ${isEditable ? 1 : 0};
            }
        }
    `
);

const StyledTextarea = styled.textarea`
    display: block;
    height: 100%;
    width: 100%;
`;

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
    tracingElementStyles = () => {},
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

    const textareaKeyMap = useMemo(() => {
        const saveAndClose = () => {
            onSave(bufferedValue);
            setIsEditing(false);
        };

        const close = () => {
            setBufferedValue(value);
            setIsEditing(false);
        };

        return {
            'cmd + escape': close,
            'shift + escape': close,
            'cmd + enter': saveAndClose,
            'shift + enter': saveAndClose,
            'escape': saveAndClose,
            'enter': evt => {
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
    }, [bufferedValue, onSave, isSingleLine, value]);

    useKeyboardShortcuts(textareaKeyMap, inputRef);

    const keyMap = useMemo(() => {
        const enterEditMode = evt => {
            if (evt.target === containerElementRef.current) {
                evt.preventDefault();
                handleClick();
            }
        };

        return {
            enter: enterEditMode,
        };
    }, [handleClick, containerElementRef]);

    useKeyboardShortcuts(keyMap, containerElementRef);

    return (
        <Container
            isEditable={isEditable}
            isEditing={isEditing}
            ref={containerElementRef}
            tabIndex={0}
            tracingElementStyles={tracingElementStyles}
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
