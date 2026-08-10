import type { PropsWithChildren, ReactNode } from 'react';
import { IconButton } from './IconButton';

interface ColumnProps extends PropsWithChildren {
    actions?: ReactNode;
    canCollapse: boolean;
    heading: string;
    isOpen: boolean;
    onToggle: () => void;
    weight: number;
}

export function Column({
    actions,
    canCollapse,
    children,
    heading,
    isOpen,
    onToggle,
    weight,
}: ColumnProps) {
    return (
        <section
            aria-label={heading}
            className={`planner-column relative min-w-0 overflow-hidden transition-[color,background-color,flex-basis,flex-grow,width] duration-150 ease-in-out ${isOpen ? 'bg-planner-background text-planner-text' : 'bg-planner-contrast text-planner-background'}`}
            data-collapsed={!isOpen}
            style={{
                flexBasis: isOpen ? 0 : 'var(--spacing-icon-slot)',
                flexGrow: isOpen ? weight : 0,
                width: isOpen ? undefined : 'var(--spacing-icon-slot)',
            }}
        >
            <div
                className={`flex h-full min-w-[280px] flex-col transition-opacity duration-150 ease-in-out ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
                <header className="relative flex h-[var(--spacing-icon-slot)] shrink-0 items-center border-b-[length:var(--planner-stroke-width)] border-planner-border">
                    <h2 className="pointer-events-none absolute inset-0 grid place-items-center text-center uppercase text-planner-primary">
                        {heading}
                    </h2>
                    <div className="ml-auto flex">{actions}</div>
                    <IconButton
                        disabled={!canCollapse}
                        icon="arrow-left-to-line"
                        label={`Collapse ${heading}`}
                        onClick={onToggle}
                    />
                </header>
                <div className="min-h-0 flex-1">{children}</div>
            </div>
            {!isOpen && (
                <div className="absolute inset-x-0 top-0 z-10">
                    <IconButton
                        className="planner-column-expand hover:bg-transparent"
                        icon="arrow-right-from-line"
                        label={`Expand ${heading}`}
                        onClick={onToggle}
                    />
                </div>
            )}
        </section>
    );
}
