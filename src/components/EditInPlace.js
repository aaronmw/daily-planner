import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import useBulletedLists from '../hooks/useBulletedLists';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import useMarkdownShortcuts from '../hooks/useMarkdownShortcuts';
import useTabIndentation from '../hooks/useTabIndentation';
import Box from './atoms/Box';
import cx from '../utils/cx';

const Container = React.forwardRef(
    (
        { className, isEditable, isEditing, style, tracerColor, ...otherProps },
        ref
    ) => (
        <Box
            ref={ref}
            isFlexible
            className={cx('planner-edit-in-place', className)}
            data-editable={isEditable}
            data-editing={isEditing}
            style={{
                '--planner-tracer-color': tracerColor || undefined,
                ...style,
            }}
            {...otherProps}
        />
    )
);

const Canvas = ({ className, isEmpty, ...otherProps }) => (
    <Box className={cx(isEmpty && 'opacity-60', className)} {...otherProps} />
);

const keyboardShortcutNamespace = 'edit-in-place';
const DEFAULT_CANVAS_STYLES = {};
const defaultRender = value => value;
const noop = () => {};

const resizeTextarea = textarea => {
    if (!textarea) {
        return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
};

const EditInPlace = ({
    ariaLabel = null,
    canvasStyles = DEFAULT_CANVAS_STYLES,
    doubleClickToEdit = false,
    isEditable = true,
    isMultiLine = false,
    placeholder = 'Empty',
    render = defaultRender,
    startsEditing = false,
    tracerColor = null,
    value = '',
    onSave = noop,
    ...otherProps
}) => {
    const [isEditing, setIsEditing] = useState(startsEditing);
    const [bufferedValue, setBufferedValue] = useState(
        startsEditing ? value : ''
    );
    const containerElementRef = useRef(null);
    const inputRef = useRef(null);
    const displayValue = isEditing ? bufferedValue : value;
    const isEmpty = String(displayValue).trim() === '';
    const isSingleLine = !isMultiLine;
    const textareaLabel =
        ariaLabel ||
        (typeof placeholder === 'string' ? placeholder : 'Editable text');

    useEffect(() => {
        if (isEditing && inputRef.current) {
            resizeTextarea(inputRef.current);
            inputRef.current.select();
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleClick = useCallback(() => {
        if (isEditable && !isEditing) {
            setBufferedValue(value);
            setIsEditing(true);
        }
    }, [isEditable, isEditing, setBufferedValue, setIsEditing, value]);

    const handleBlur = useCallback(() => {
        onSave(bufferedValue);
        setIsEditing(false);
    }, [bufferedValue, onSave, setIsEditing]);

    const handleChange = evt => {
        const nextValue = evt.target.value;
        setBufferedValue(nextValue);
        resizeTextarea(evt.target);
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
                handleBlur();
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
                    <textarea
                        aria-label={textareaLabel}
                        disabled={!isEditing}
                        className="planner-edit-textarea"
                        ref={inputRef}
                        rows={1}
                        value={bufferedValue}
                        onBlur={handleBlur}
                        onChange={handleChange}
                    />
                ) : (
                    render(isEmpty ? placeholder : value)
                )}
            </Canvas>
        </Container>
    );
};

export default memo(EditInPlace);
