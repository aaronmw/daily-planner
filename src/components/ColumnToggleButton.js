import React from 'react';
import { IconButton } from './atoms/Button';
import { COPY, ICONS } from './atoms/tokens';

const ICON_BY_STATE = {
    closed: ICONS.EXPAND_LEFT_COLUMN,
    open: ICONS.COLLAPSE_LEFT_COLUMN,
};

const ColumnToggleButton = ({
    canCollapse = true,
    collapseLabel,
    expandLabel,
    isOpen,
    onChangeIsOpen,
    titleSuffix,
}) => {
    const label = isOpen ? collapseLabel : expandLabel;
    const isCollapseBlocked = isOpen && !canCollapse;
    const title = [
        label,
        titleSuffix,
        isCollapseBlocked ? COPY.AT_LEAST_ONE_COLUMN_OPEN : null,
    ]
        .filter(Boolean)
        .join('. ');

    return (
        <IconButton
            aria-disabled={isCollapseBlocked}
            aria-label={label}
            isActive={isOpen}
            title={title}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            onClick={() => {
                if (!isCollapseBlocked) {
                    onChangeIsOpen(!isOpen);
                }
            }}
        >
            {ICON_BY_STATE[isOpen ? 'open' : 'closed']}
        </IconButton>
    );
};

export default ColumnToggleButton;
