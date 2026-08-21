import type { PropsWithChildren, ReactNode } from 'react';
import { Icon } from './Icon';
import {
    ShortcutHint,
    type ShortcutDefinition,
} from '../shortcuts/ShortcutProvider';
import { shortcutAriaKeys } from '../shortcuts/shortcutMatching';

interface ColumnProps extends PropsWithChildren {
    actions?: ReactNode;
    canCollapse: boolean;
    collapsedContent?: ReactNode;
    heading: string;
    isOpen: boolean;
    onToggle: () => void;
    shortcut?: ShortcutDefinition;
    weight: number;
}

export function Column({
    actions,
    canCollapse,
    children,
    collapsedContent,
    heading,
    isOpen,
    onToggle,
    shortcut,
    weight,
}: ColumnProps) {
    return (
        <section
            aria-label={heading}
            className={`planner-column relative min-w-0 overflow-clip transition-[color,background-color,flex-basis,flex-grow,width] duration-150 ease-in-out ${isOpen ? 'bg-planner-background text-planner-text' : 'bg-planner-contrast text-planner-background'}`}
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
                <header className="planner-column-header relative flex h-[var(--spacing-icon-slot)] shrink-0 items-center border-b-[length:var(--planner-stroke-width)] border-planner-border">
                    <button
                        aria-keyshortcuts={
                            shortcut ? shortcutAriaKeys(shortcut) : undefined
                        }
                        aria-label={`Collapse ${heading}`}
                        className="planner-column-collapse"
                        disabled={!canCollapse}
                        onClick={onToggle}
                        title={`Collapse ${heading}`}
                        type="button"
                    >
                        <span
                            aria-hidden="true"
                            className="planner-column-collapse-icon"
                        >
                            <Icon name="arrow-left-to-line" />
                        </span>
                    </button>
                    <h2 className="pointer-events-none absolute inset-0 grid place-items-center text-center uppercase text-planner-primary">
                        <span className="relative inline-flex items-center">
                            {heading}
                            {shortcut && (
                                <ShortcutHint
                                    className="planner-column-shortcut"
                                    shortcut={shortcut}
                                />
                            )}
                        </span>
                    </h2>
                    <div className="planner-column-actions ml-auto mr-[var(--spacing-icon-slot)] flex">
                        {actions}
                    </div>
                </header>
                <div className="min-h-0 flex-1">{children}</div>
            </div>
            {!isOpen && (
                <>
                    <button
                        aria-keyshortcuts={
                            shortcut ? shortcutAriaKeys(shortcut) : undefined
                        }
                        aria-label={`Expand ${heading}`}
                        className="planner-column-expand"
                        onClick={onToggle}
                        title={`Expand ${heading}`}
                        type="button"
                    >
                        {shortcut && (
                            <ShortcutHint
                                className="planner-column-expand-shortcut"
                                shortcut={shortcut}
                            />
                        )}
                        <span
                            aria-hidden="true"
                            className="planner-column-expand-icon"
                        >
                            <Icon name="arrow-right-from-line" />
                        </span>
                    </button>
                    <div className="planner-column-collapsed-layout">
                        <span
                            aria-hidden="true"
                            className="planner-column-expand-heading uppercase"
                        >
                            {heading}
                        </span>
                        {collapsedContent && (
                            <div className="planner-column-collapsed-content">
                                {collapsedContent}
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
