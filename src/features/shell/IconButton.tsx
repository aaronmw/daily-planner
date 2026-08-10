import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    label: string;
}

export function IconButton({
    className = '',
    icon,
    label,
    ...props
}: IconButtonProps) {
    return (
        <button
            aria-label={label}
            className={`grid size-[var(--spacing-icon-slot)] shrink-0 place-items-center text-[var(--planner-icon-glyph-size)] transition-[color,background-color,opacity,transform] duration-150 ease-in-out hover:bg-planner-shaded ${className}`}
            title={label}
            type="button"
            {...props}
        >
            <Icon name={icon} />
        </button>
    );
}
