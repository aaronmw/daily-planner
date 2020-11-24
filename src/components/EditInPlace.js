import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import styled from 'styled-components';
import useGlobalKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import Box from './atoms/Box';
import {
    BORDER_RADIUS,
    COLORS,
    GRID_UNIT,
    UNIFIED_TRANSITION,
} from './atoms/tokens';

const Container = styled(Box).attrs({
    isFlexible: true,
})(
    ({ isEditing, isEmpty, theme, tracingElementStyles = () => {} }) => `
        color: ${COLORS[theme.name][isEmpty ? 'TEXT_FADED' : 'TEXT']};
        cursor: ${isEditing ? 'text' : 'pointer'};
        position: relative;
        user-select: ${isEditing ? 'text' : 'none'};
        width: auto;
        height: auto;
    
        // Tracing element
        &:before {
            border: 2px dashed ${COLORS[theme.name].BORDER_HOVER};
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
                opacity: 1;
            }
        }
    `
);

const StyledTextarea = styled.textarea(
    ({ theme }) => `
        display: block;
        height: 100%;
        width: 100%;
    `
);

const EditInPlace = ({
    doubleClickToEdit = false,
    isMultiLine = false,
    isRemotelyActivated = false,
    placeholder = 'Empty',
    render = value => value,
    tracingElementStyles = () => {},
    value = '',
    wrapperStyles = {},
    onSave = () => {},
    ...otherProps
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [bufferedValue, setBufferedValue] = useState(value);
    const [measuringElementHeight, setMeasuringElementHeight] = useState(null);
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
        if (!isEditing) {
            setBufferedValue(value);
            setIsEditing(true);
        }
    }, [isEditing, setBufferedValue, setIsEditing, value]);

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

    const keyMap = useMemo(() => {
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
                if (isSingleLine) {
                    saveAndClose();
                    evt.preventDefault();
                    return false;
                }
            },
        };
    }, [bufferedValue, onSave, isSingleLine, value]);

    useGlobalKeyboardShortcuts(keyMap, inputRef);

    return (
        <Container
            isEditing={isEditing}
            isEmpty={isEmpty}
            tabIndex={0}
            tracingElementStyles={tracingElementStyles}
            onClick={!doubleClickToEdit ? handleClick : null}
            onDoubleClick={doubleClickToEdit ? handleClick : null}
            {...otherProps}
        >
            <Box style={wrapperStyles}>
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
            </Box>
        </Container>
    );
};

export default memo(EditInPlace);
