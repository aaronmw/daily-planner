import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
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
    ({ isEditing, isEmpty, theme }) => `
        cursor: ${isEditing ? 'text' : 'pointer'};
        position: relative;
        opacity: ${isEmpty ? 0.5 : 1};
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
            top: calc(${GRID_UNIT} * 0.5 * -1);
            right: calc(${GRID_UNIT} * 0.5 * -1);
            bottom: calc(${GRID_UNIT} * 0.5 * -1);
            left: calc(${GRID_UNIT} * 0.5 * -1);
            ${UNIFIED_TRANSITION};
        }
        
        &:hover {
            &:before {
                opacity: 1;
            }
        }
    `
);

const EditInPlace = ({
    isMultiLine = false,
    placeholder = 'Empty',
    render = value => value,
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
    const isEmpty = value.trim() === '';

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

    const handleClick = () => {
        setBufferedValue(value);
        setIsEditing(true);
    };

    const handleBlur = () => {
        onSave(bufferedValue);
        setIsEditing(false);
    };

    const handleChange = evt => {
        setBufferedValue(evt.target.value);
    };

    const handleKeyDown = evt => {
        if (evt.key === 'Escape') {
            setBufferedValue(value);
            setIsEditing(false);
            return;
        }
        if (evt.key === 'Enter') {
            if (evt.metaKey || evt.shiftKey || !isMultiLine) {
                onSave(bufferedValue);
                setIsEditing(false);
            }
            if (!isMultiLine) {
                evt.preventDefault();
                return false;
            }
        }
    };

    return (
        <Container
            isEditing={isEditing}
            isEmpty={isEmpty}
            onClick={handleClick}
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
                                outline: '2px dotted red',
                                whiteSpace: 'pre-wrap',
                                width: '100%',
                            }}
                        >
                            {bufferedValue}.
                        </div>
                        <textarea
                            disabled={!isEditing}
                            ref={inputRef}
                            rows={1}
                            style={{
                                display: 'block',
                                height: `${measuringElementHeight}px`,
                                width: '100%',
                            }}
                            value={bufferedValue}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                        />
                    </>
                ) : (
                    render(isEmpty ? placeholder : value)
                )}
            </Box>
        </Container>
    );
};

export default EditInPlace;
