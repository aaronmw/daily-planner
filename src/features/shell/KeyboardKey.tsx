interface KeyboardKeyProps {
    isIcon?: boolean;
    label: string;
}

export function KeyboardKey({ isIcon = false, label }: KeyboardKeyProps) {
    return (
        <kbd className="planner-keyboard-key" data-slot="keyboard-key">
            <span
                className="planner-keyboard-key-face"
                data-icon={isIcon ? 'true' : undefined}
            >
                {label}
            </span>
        </kbd>
    );
}
