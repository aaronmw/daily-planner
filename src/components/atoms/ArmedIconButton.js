import React from 'react';
import useArmedAction from '../../hooks/useArmedAction';
import cx from '../../utils/cx';
import { IconButton } from './Button';
import Tooltip from './Tooltip';
import { ICONS } from './tokens';

const ArmedIconButton = ({
    children,
    className,
    confirmLabel = 'Click again to confirm',
    disabled = false,
    error = null,
    label,
    pending = false,
    onConfirm,
}) => {
    const { activate, disarm, isArmed } = useArmedAction({
        disabled: disabled || pending,
        onConfirm,
    });
    const tooltip = isArmed ? confirmLabel : error || label;

    return (
        <Tooltip content={tooltip}>
            <IconButton
                aria-busy={pending ? 'true' : undefined}
                aria-label={label}
                aria-pressed={isArmed}
                className={cx(
                    'planner-attachment-action rounded-none border-0 bg-transparent text-planner-text hover:border-transparent focus:border-transparent',
                    isArmed && 'planner-attachment-action-armed',
                    pending && 'cursor-wait',
                    className
                )}
                disabled={disabled || pending}
                onBlur={disarm}
                onClick={activate}
                onKeyDown={event => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        disarm();
                    }
                }}
                onPointerLeave={disarm}
            >
                <span className={pending ? 'planner-spin' : undefined}>
                    {pending ? ICONS.SPINNER : children}
                </span>
            </IconButton>
        </Tooltip>
    );
};

export default ArmedIconButton;
