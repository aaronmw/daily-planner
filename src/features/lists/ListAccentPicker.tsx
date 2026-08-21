import {
    type MouseEvent,
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import type { ListId } from '../../core/domain/ids';
import { ACCENT_KEYS, type AccentKey } from '../../core/domain/types';
import { IconButton } from '../shell/IconButton';
import { TrackedSelection } from '../shell/TrackedSelection';
import { accentColor } from '../theme/theme';

const accentLabel = (accentKey: AccentKey) =>
    `${accentKey.charAt(0).toUpperCase()}${accentKey.slice(1)}`;

interface ListAccentPickerProps {
    accentKey: AccentKey;
    label: string;
    listId: ListId;
}

export function ListAccentPicker({
    accentKey,
    label,
    listId,
}: ListAccentPickerProps) {
    const commands = usePlannerCommands();
    const [open, setOpen] = useState(false);
    const pickerId = useId();
    const pickerRef = useRef<HTMLDivElement>(null);
    const selectedIndex = ACCENT_KEYS.indexOf(accentKey);

    const focusTrigger = useCallback(() => {
        requestAnimationFrame(() => {
            pickerRef.current
                ?.querySelector<HTMLButtonElement>(
                    '[data-list-accent-picker-trigger]'
                )
                ?.focus();
        });
    }, []);

    const closePicker = useCallback(
        (restoreFocus = false) => {
            setOpen(false);
            if (restoreFocus) focusTrigger();
        },
        [focusTrigger]
    );

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) {
                closePicker();
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            closePicker(true);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closePicker, open]);

    const selectAccent = (
        event: MouseEvent<HTMLButtonElement>,
        nextAccentKey: AccentKey
    ) => {
        event.stopPropagation();
        if (nextAccentKey !== accentKey) {
            void commands.updateList(listId, { accentKey: nextAccentKey });
        }
        closePicker(true);
    };

    return (
        <div
            className="absolute bottom-0 right-0 z-30"
            data-list-accent-picker
            ref={pickerRef}
        >
            <IconButton
                aria-controls={pickerId}
                aria-expanded={open}
                className="planner-list-accent-picker-trigger"
                data-list-accent-picker-trigger
                icon="palette"
                label={`Choose ${label || 'list'} colour`}
                onClick={event => {
                    event.stopPropagation();
                    setOpen(current => !current);
                }}
            />
            {open && (
                <div
                    aria-label={`Choose ${label || 'list'} colour`}
                    className="absolute bottom-[calc(var(--spacing-icon-slot)+4px)] right-0 border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-1 text-planner-text shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
                    id={pickerId}
                    role="dialog"
                >
                    <TrackedSelection
                        ariaLabel="List colour"
                        className="grid grid-cols-[repeat(5,30px)]"
                        selectedIndex={selectedIndex}
                        tracking="grid"
                    >
                        {ACCENT_KEYS.map((option, index) => (
                            <button
                                aria-pressed={option === accentKey}
                                className="relative z-10 grid size-[30px] place-items-center"
                                data-tracked-selection-index={index}
                                key={option}
                                onClick={event => selectAccent(event, option)}
                                title={accentLabel(option)}
                                type="button"
                            >
                                <span
                                    aria-hidden="true"
                                    className="size-[18px] rounded-full"
                                    style={{
                                        backgroundColor: accentColor(option),
                                    }}
                                />
                                <span className="sr-only">
                                    {accentLabel(option)}
                                </span>
                            </button>
                        ))}
                    </TrackedSelection>
                </div>
            )}
        </div>
    );
}
