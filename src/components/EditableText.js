import React, {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import indentSelectedLines from '../utils/indentSelectedLines';
import extendBulletedListAtCursor from '../utils/extendBulletedLinesAtCursor';
import {
    selectionWrapperForInput,
    selectionWrapperForTextInput,
    wrapTextSelection,
} from '../utils/editorSelection';
import {
    applySentenceDisplayState,
    sentenceHighlightSegments,
} from '../utils/sentenceEditing';
import { extractClipboardFiles } from '../utils/attachments';
import wrapSelectedText from '../utils/wrapSelectedText';
import cx from '../utils/cx';
import Box from './atoms/Box';

const Container = React.forwardRef(
    (
        { className, isEditable, isEditing, style, tracerColor, ...otherProps },
        ref
    ) => (
        <Box
            ref={ref}
            isFlexible
            className={cx('planner-editable-text', className)}
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

const DEFAULT_CANVAS_STYLES = {};
const defaultRender = value => value;
const noop = () => {};
const DEFAULT_SELECTION = { start: 0, end: 0, direction: 'none' };

const resizeTextarea = textarea => {
    if (!textarea) {
        return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
};

const textareaSelection = textarea => ({
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    direction: textarea.selectionDirection || 'none',
});

const getFormattingShortcut = evt => {
    const key = evt.key.toLowerCase();

    if ((evt.metaKey || evt.ctrlKey) && !evt.altKey && !evt.shiftKey) {
        if (key === 'b') {
            return {
                insertBefore: '**',
                insertAfter: '**',
                wrapAtAnyCursorLocation: true,
            };
        }

        if (key === 'i') {
            return {
                insertBefore: '_',
                insertAfter: '_',
                wrapAtAnyCursorLocation: true,
            };
        }
    }

    if (!evt.metaKey && !evt.ctrlKey && !evt.altKey && evt.shiftKey) {
        if (key === 'x') {
            return {
                insertBefore: '~',
                insertAfter: '~',
                wrapAtAnyCursorLocation: true,
            };
        }

        if (evt.key === '~') {
            return { insertBefore: '```\n', insertAfter: '\n```' };
        }

        if (evt.key === '>') {
            return { insertBefore: '> ', insertAfter: '' };
        }
    }

    return null;
};

const EditableText = ({
    ariaLabel = null,
    canvasStyles = DEFAULT_CANVAS_STYLES,
    doubleClickToEdit = false,
    draftValue,
    focusAssistEnabled = false,
    highlightIncompleteSentencesEnabled = false,
    isEditable = true,
    isMultiLine = false,
    mode = 'compact',
    placeholder = 'Empty',
    render = defaultRender,
    startsEditing = false,
    tracerColor = null,
    value = '',
    onDraftValueChange = noop,
    onPasteFiles = null,
    onSave = noop,
    ...otherProps
}) => {
    const [isEditing, setIsEditing] = useState(startsEditing);
    const [bufferedValue, setBufferedValue] = useState(
        startsEditing ? value : ''
    );
    const [selection, setSelection] = useState(DEFAULT_SELECTION);
    const inputRef = useRef(null);
    const overlayRef = useRef(null);
    const composingRef = useRef(false);
    const pendingSelectionRef = useRef(null);
    const shouldSaveOnBlurRef = useRef(true);
    const hasControlledDraft = draftValue !== undefined;
    const editingValue = hasControlledDraft ? draftValue : bufferedValue;
    const displayValue = isEditing ? editingValue : value;
    const isEmpty = String(displayValue).trim() === '';
    const isProse = mode === 'prose';
    const isSingleLine = !isMultiLine;
    const textareaLabel =
        ariaLabel ||
        (typeof placeholder === 'string' ? placeholder : 'Editable text');

    const sentenceSegments = useMemo(
        () => (isProse ? sentenceHighlightSegments(editingValue) : []),
        [editingValue, isProse]
    );
    const displaySegments = useMemo(
        () =>
            applySentenceDisplayState(sentenceSegments, {
                focusAssistEnabled,
                highlightIncompleteSentencesEnabled,
                selection,
            }),
        [
            focusAssistEnabled,
            highlightIncompleteSentencesEnabled,
            selection,
            sentenceSegments,
        ]
    );

    const updateSelection = useCallback(() => {
        if (inputRef.current) {
            setSelection(textareaSelection(inputRef.current));
        }
    }, []);

    const setEditingValue = useCallback(
        nextValue => {
            if (hasControlledDraft) {
                onDraftValueChange(nextValue);
            } else {
                setBufferedValue(nextValue);
            }
        },
        [hasControlledDraft, onDraftValueChange]
    );

    const applyTextAndSelection = useCallback(
        (nextText, nextSelection) => {
            pendingSelectionRef.current = nextSelection;
            setEditingValue(nextText);
            setSelection(nextSelection);
        },
        [setEditingValue]
    );

    const wrapCurrentSelection = useCallback(
        wrapper => {
            const textarea = inputRef.current;

            if (!textarea) {
                return false;
            }

            const result = wrapTextSelection(
                editingValue,
                textareaSelection(textarea),
                wrapper
            );

            if (!result) {
                return false;
            }

            applyTextAndSelection(result.text, result.selection);
            return true;
        },
        [applyTextAndSelection, editingValue]
    );

    useEffect(() => {
        const textarea = inputRef.current;

        if (!isEditing || !textarea) {
            return;
        }

        if (!isProse) {
            resizeTextarea(textarea);
        }

        textarea.select();
        textarea.focus();
        setSelection(textareaSelection(textarea));
    }, [isEditing, isProse]);

    useLayoutEffect(() => {
        const textarea = inputRef.current;
        const pendingSelection = pendingSelectionRef.current;

        if (!textarea || !pendingSelection) {
            return;
        }

        textarea.setSelectionRange(
            pendingSelection.start,
            pendingSelection.end,
            pendingSelection.direction
        );
        pendingSelectionRef.current = null;
    }, [editingValue]);

    const handleClick = useCallback(() => {
        if (isEditable && !isEditing) {
            shouldSaveOnBlurRef.current = true;
            setEditingValue(value);
            setIsEditing(true);
        }
    }, [isEditable, isEditing, setEditingValue, value]);

    const handleBlur = useCallback(() => {
        if (shouldSaveOnBlurRef.current) {
            onSave(editingValue);
        }

        setIsEditing(false);
    }, [editingValue, onSave]);

    const cancelEditing = useCallback(() => {
        shouldSaveOnBlurRef.current = false;
        setEditingValue(value);
        setIsEditing(false);
    }, [setEditingValue, value]);

    const saveEditing = useCallback(() => {
        inputRef.current?.blur();
    }, []);

    const handleChange = evt => {
        setEditingValue(evt.target.value);
        setSelection(textareaSelection(evt.target));

        if (!isProse) {
            resizeTextarea(evt.target);
        }
    };

    const handleBeforeInput = evt => {
        if (!isProse) {
            return;
        }

        const inputEvent = evt.nativeEvent;
        const wrapper = selectionWrapperForTextInput({
            data: inputEvent.data,
            inputType: inputEvent.inputType,
            isComposing: composingRef.current || inputEvent.isComposing,
        });

        if (wrapper && wrapCurrentSelection(wrapper)) {
            evt.preventDefault();
        }
    };

    const handleKeyDown = evt => {
        if (evt.key === 'Escape') {
            evt.preventDefault();
            evt.stopPropagation();
            cancelEditing();
            return;
        }

        if (
            evt.key === 'Enter' &&
            (isSingleLine || evt.metaKey || evt.ctrlKey || evt.shiftKey)
        ) {
            evt.preventDefault();
            saveEditing();
            return;
        }

        if (!isProse || composingRef.current || evt.nativeEvent.isComposing) {
            return;
        }

        const textarea = evt.currentTarget;

        if (evt.key === 'Tab') {
            evt.preventDefault();
            const result = indentSelectedLines({
                text: editingValue,
                selectionStart: textarea.selectionStart,
                selectionEnd: textarea.selectionEnd,
                outdent: evt.shiftKey,
            });
            applyTextAndSelection(result.newText, {
                start: result.newSelectionStart,
                end: result.newSelectionEnd,
                direction: textarea.selectionDirection || 'none',
            });
            return;
        }

        if (evt.key === 'Enter') {
            evt.preventDefault();
            const result = extendBulletedListAtCursor({
                text: editingValue,
                selectionStart: textarea.selectionStart,
                selectionEnd: textarea.selectionEnd,
            });
            applyTextAndSelection(result.newText, {
                start: result.newCursorPosition,
                end: result.newCursorPosition,
                direction: 'none',
            });
            return;
        }

        const formattingShortcut = getFormattingShortcut(evt);

        if (formattingShortcut) {
            const result = wrapSelectedText({
                ...formattingShortcut,
                selectionStart: textarea.selectionStart,
                selectionEnd: textarea.selectionEnd,
                text: editingValue,
            });

            if (result.newText !== editingValue) {
                evt.preventDefault();
                applyTextAndSelection(result.newText, {
                    start: result.newSelectionStart,
                    end: result.newSelectionEnd,
                    direction: textarea.selectionDirection || 'none',
                });
            }
            return;
        }

        if (evt.metaKey || evt.ctrlKey || evt.altKey) {
            return;
        }

        const wrapper = selectionWrapperForInput(evt.key);

        if (wrapper && wrapCurrentSelection(wrapper)) {
            evt.preventDefault();
        }
    };

    const handleContainerKeyDown = evt => {
        if (evt.target === evt.currentTarget && evt.key === 'Enter') {
            evt.preventDefault();
            handleClick();
        }
    };

    const handlePaste = evt => {
        if (!isProse || !onPasteFiles) {
            return;
        }

        const files = extractClipboardFiles(evt.clipboardData);

        if (!files.length) {
            return;
        }

        const result = onPasteFiles(files, {
            selection: textareaSelection(evt.currentTarget),
            text: editingValue,
        });

        if (!result) {
            return;
        }

        evt.preventDefault();
        applyTextAndSelection(result.text, result.selection);
    };

    const handleScroll = evt => {
        if (overlayRef.current) {
            overlayRef.current.scrollLeft = evt.currentTarget.scrollLeft;
            overlayRef.current.scrollTop = evt.currentTarget.scrollTop;
        }
    };

    return (
        <Container
            isEditable={isEditable}
            isEditing={isEditing}
            tabIndex={0}
            tracerColor={tracerColor}
            onClick={!doubleClickToEdit ? handleClick : null}
            onDoubleClick={doubleClickToEdit ? handleClick : null}
            onKeyDown={handleContainerKeyDown}
            {...otherProps}
        >
            <Canvas
                isEmpty={isEmpty}
                className={cx(
                    isEditing && isProse && 'planner-editable-text-prose-canvas'
                )}
                style={{ ...canvasStyles }}
            >
                {isEditing ? (
                    <>
                        {isProse ? (
                            <div
                                aria-hidden="true"
                                className="planner-editable-text-highlight-layer"
                                ref={overlayRef}
                            >
                                {displaySegments.map(segment => (
                                    <span
                                        className={cx(
                                            segment.dimmed &&
                                                'planner-editable-text-segment-dimmed',
                                            segment.incomplete &&
                                                'planner-editable-text-segment-incomplete'
                                        )}
                                        key={`${segment.kind}:${segment.start}:${segment.end}`}
                                    >
                                        {segment.text}
                                    </span>
                                ))}
                                {editingValue.endsWith('\n') ? '\u200b' : null}
                            </div>
                        ) : null}
                        <textarea
                            aria-label={textareaLabel}
                            aria-multiline={isMultiLine}
                            className={cx(
                                'planner-editable-text-input',
                                isProse && 'planner-editable-text-prose-input'
                            )}
                            ref={inputRef}
                            rows={1}
                            spellCheck="true"
                            value={editingValue}
                            onBeforeInput={handleBeforeInput}
                            onBlur={handleBlur}
                            onChange={handleChange}
                            onCompositionEnd={() => {
                                composingRef.current = false;
                            }}
                            onCompositionStart={() => {
                                composingRef.current = true;
                            }}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            onScroll={handleScroll}
                            onSelect={updateSelection}
                        />
                    </>
                ) : (
                    render(isEmpty ? placeholder : value)
                )}
            </Canvas>
        </Container>
    );
};

export default memo(EditableText);
