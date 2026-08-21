import {
    type KeyboardEvent,
    type FormEvent,
    type ClipboardEvent,
    type ReactNode,
    type UIEvent,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { sentenceDisplaySegments, type TextSelection } from './sentences';
import {
    extendBullet,
    indentLines,
    selectionWrapperForInput,
    wrapTextSelection,
} from './textEditing';
import { MarchingAnts } from '../shell/MarchingAnts';

interface EditRequest {
    id: string;
    selectAll?: boolean;
}

interface EditContext {
    editRequestId: string | null;
}

interface EditableTextProps {
    ariaLabel?: string;
    className?: string;
    draftValue?: string;
    editRequest?: EditRequest | null;
    focusAssistEnabled?: boolean;
    highlightIncompleteSentencesEnabled?: boolean;
    isEditable?: boolean;
    mode?: 'compact' | 'prose';
    multiline?: boolean;
    onCancel?: (context: EditContext) => void;
    onDraftValueChange?: (value: string) => void;
    onEditRequestFulfilled?: (requestId: string) => void;
    onSave: (value: string, context: EditContext) => void | Promise<void>;
    onPasteFiles?: (
        files: readonly File[],
        context: { selection: TextSelection; text: string }
    ) => { selection: TextSelection; text: string } | null;
    placeholder?: string;
    render?: (value: string) => ReactNode;
    value: string;
}

const EMPTY_SELECTION: TextSelection = {
    direction: 'none',
    end: 0,
    start: 0,
};

const readSelection = (textarea: HTMLTextAreaElement): TextSelection => ({
    direction: textarea.selectionDirection,
    end: textarea.selectionEnd,
    start: textarea.selectionStart,
});

const normalizeValue = (value: string, multiline: boolean) =>
    multiline ? value : value.replace(/[\r\n]+/gu, ' ');

export function EditableText({
    ariaLabel,
    className = '',
    draftValue,
    editRequest = null,
    focusAssistEnabled = false,
    highlightIncompleteSentencesEnabled = false,
    isEditable = true,
    mode = 'compact',
    multiline = false,
    onCancel,
    onDraftValueChange,
    onEditRequestFulfilled,
    onSave,
    onPasteFiles,
    placeholder = 'Empty',
    render,
    value,
}: EditableTextProps) {
    const [draft, setDraft] = useState(value);
    const [editing, setEditing] = useState(false);
    const [selection, setSelection] = useState(EMPTY_SELECTION);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const composingRef = useRef(false);
    const requestRef = useRef<string | null>(null);
    const fulfilledRef = useRef<string | null>(null);
    const shouldSaveRef = useRef(true);
    const pendingSelectionRef = useRef<TextSelection | null>(null);
    const prose = mode === 'prose';
    const controlled = draftValue !== undefined;
    const editingValue = controlled ? draftValue : draft;
    const setEditingValue = useCallback(
        (next: string) => {
            if (controlled) onDraftValueChange?.(next);
            else setDraft(next);
        },
        [controlled, onDraftValueChange]
    );

    const segments = useMemo(
        () =>
            sentenceDisplaySegments(editingValue, selection, {
                focusAssistEnabled,
                highlightIncompleteSentencesEnabled,
            }),
        [
            editingValue,
            focusAssistEnabled,
            highlightIncompleteSentencesEnabled,
            selection,
        ]
    );

    const beginEditing = useCallback(
        (requestId: string | null = null) => {
            if (!isEditable) return;
            shouldSaveRef.current = true;
            requestRef.current = requestId;
            setEditingValue(normalizeValue(value, multiline));
            setEditing(true);
        },
        [isEditable, multiline, setEditingValue, value]
    );

    useLayoutEffect(() => {
        if (
            !editRequest ||
            fulfilledRef.current === editRequest.id ||
            !isEditable
        ) {
            return;
        }
        beginEditing(editRequest.id);
    }, [beginEditing, editRequest, isEditable]);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!editing || !textarea) return;
        if (!prose) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
        textarea.focus({ preventScroll: true });
        if (
            editRequest?.id === requestRef.current &&
            editRequest.selectAll !== false
        ) {
            textarea.select();
        }
        setSelection(readSelection(textarea));
        if (requestRef.current && fulfilledRef.current !== requestRef.current) {
            fulfilledRef.current = requestRef.current;
            onEditRequestFulfilled?.(requestRef.current);
        }
    }, [editRequest, editing, onEditRequestFulfilled, prose]);

    useLayoutEffect(() => {
        const pending = pendingSelectionRef.current;
        const textarea = textareaRef.current;
        if (!pending || !textarea) return;
        textarea.setSelectionRange(
            pending.start,
            pending.end,
            pending.direction
        );
        pendingSelectionRef.current = null;
    }, [draft]);

    const apply = (next: { selection: TextSelection; text: string }) => {
        pendingSelectionRef.current = next.selection;
        setEditingValue(next.text);
        setSelection(next.selection);
    };

    const cancel = () => {
        shouldSaveRef.current = false;
        const editRequestId = requestRef.current;
        requestRef.current = null;
        setEditingValue(value);
        setEditing(false);
        onCancel?.({ editRequestId });
    };

    const handleBlur = () => {
        const editRequestId = requestRef.current;
        requestRef.current = null;
        setEditing(false);
        if (shouldSaveRef.current) {
            void onSave(normalizeValue(editingValue, multiline), {
                editRequestId,
            });
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
            return;
        }
        if (
            event.key === 'Enter' &&
            !composingRef.current &&
            !event.nativeEvent.isComposing &&
            (!multiline || event.metaKey || event.ctrlKey)
        ) {
            event.preventDefault();
            event.currentTarget.blur();
            return;
        }
        if (!prose || composingRef.current || event.nativeEvent.isComposing)
            return;
        const currentSelection = readSelection(event.currentTarget);
        if (event.key === 'Tab') {
            event.preventDefault();
            apply(indentLines(editingValue, currentSelection, event.shiftKey));
            return;
        }
        if (event.key === 'Enter') {
            const lineStart =
                editingValue.lastIndexOf('\n', currentSelection.start - 1) + 1;
            if (
                /^\s*(?:[-*+>]|•)\s+/u.test(
                    editingValue.slice(lineStart, currentSelection.start)
                )
            ) {
                event.preventDefault();
                apply(extendBullet(editingValue, currentSelection));
            }
            return;
        }
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const wrapper = selectionWrapperForInput(event.key);
        if (!wrapper) return;
        const wrapped = wrapTextSelection(
            editingValue,
            currentSelection,
            wrapper
        );
        if (wrapped) {
            event.preventDefault();
            apply(wrapped);
        }
    };

    const handleBeforeInput = (event: FormEvent<HTMLTextAreaElement>) => {
        if (!prose || composingRef.current) return;
        const input = event.nativeEvent as InputEvent;
        if (input.isComposing || input.inputType !== 'insertText') return;
        const wrapper = selectionWrapperForInput(input.data);
        const textarea = textareaRef.current;
        if (!wrapper || !textarea) return;
        const wrapped = wrapTextSelection(
            editingValue,
            readSelection(textarea),
            wrapper
        );
        if (wrapped) {
            event.preventDefault();
            apply(wrapped);
        }
    };

    const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
        if (!overlayRef.current) return;
        overlayRef.current.scrollLeft = event.currentTarget.scrollLeft;
        overlayRef.current.scrollTop = event.currentTarget.scrollTop;
    };

    const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        if (!prose || !onPasteFiles) return;
        const files = Array.from(event.clipboardData.items).flatMap(item => {
            if (item.kind !== 'file') return [];
            const file = item.getAsFile();
            return file ? [file] : [];
        });
        if (files.length === 0) return;
        const result = onPasteFiles(files, {
            selection: readSelection(event.currentTarget),
            text: editingValue,
        });
        if (!result) return;
        event.preventDefault();
        apply(result);
    };

    const normalizedValue = normalizeValue(value, multiline);
    const display =
        normalizedValue.trim() === '' ? placeholder : normalizedValue;
    return (
        <div
            className={`planner-editable-text ${className}`}
            data-editable={isEditable}
            data-editing={editing}
            onClick={() => !editing && beginEditing()}
            onKeyDown={event => {
                if (!editing && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    beginEditing();
                }
            }}
            role={isEditable ? 'button' : undefined}
            tabIndex={isEditable ? 0 : undefined}
        >
            <MarchingAnts className="planner-editable-text-marching-ants" />
            <div
                className={`planner-editable-text-content ${editing && prose ? 'planner-editable-text-prose-canvas' : ''}`}
            >
                {editing ? (
                    <>
                        {prose && (
                            <div
                                aria-hidden="true"
                                className="planner-editable-text-highlight-layer"
                                ref={overlayRef}
                            >
                                {segments.map(segment => (
                                    <span
                                        className={`${segment.dimmed ? 'planner-editable-text-segment-dimmed' : ''} ${segment.incomplete ? 'planner-editable-text-segment-incomplete' : ''}`}
                                        key={`${segment.kind}:${segment.start}:${segment.end}`}
                                    >
                                        {segment.text}
                                    </span>
                                ))}
                                {editingValue.endsWith('\n') ? '\u200b' : null}
                            </div>
                        )}
                        <textarea
                            aria-label={ariaLabel ?? placeholder}
                            aria-multiline={multiline}
                            className={`planner-editable-text-input ${prose ? 'planner-editable-text-prose-input' : ''}`}
                            data-empty={editingValue.length === 0}
                            onBeforeInput={handleBeforeInput}
                            onBlur={handleBlur}
                            onChange={event => {
                                setEditingValue(
                                    normalizeValue(
                                        event.target.value,
                                        multiline
                                    )
                                );
                                setSelection(readSelection(event.target));
                            }}
                            onCompositionEnd={() => {
                                composingRef.current = false;
                            }}
                            onCompositionStart={() => {
                                composingRef.current = true;
                            }}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            onScroll={syncScroll}
                            onSelect={event =>
                                setSelection(readSelection(event.currentTarget))
                            }
                            ref={textareaRef}
                            rows={prose ? 8 : 1}
                            spellCheck
                            value={editingValue}
                        />
                    </>
                ) : render ? (
                    render(display)
                ) : (
                    display
                )}
            </div>
        </div>
    );
}
