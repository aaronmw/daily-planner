import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { MarchingAnts } from './MarchingAnts';

type GhostButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(
    function GhostButton(
        { children, className = '', type = 'button', ...buttonProps },
        forwardedRef
    ) {
        return (
            <button
                {...buttonProps}
                className={`planner-ghost-button ${className}`}
                ref={forwardedRef}
                type={type}
            >
                <MarchingAnts />
                <span className="planner-ghost-button-content relative z-10 block w-full">
                    {children}
                </span>
            </button>
        );
    }
);
