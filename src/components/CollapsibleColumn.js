import React from 'react';
import cx from '../utils/cx';
import ColumnToggleButton from './ColumnToggleButton';
import ToolBar from './ToolBar';

const CollapsibleColumn = ({
    canCollapse = true,
    children,
    className,
    collapseLabel,
    expandLabel,
    expandedMinWidth,
    isOpen,
    onChangeIsOpen,
    style,
    titleSuffix,
    ...otherProps
}) => {
    const renderToggleButton = () => (
        <ColumnToggleButton
            canCollapse={canCollapse}
            collapseLabel={collapseLabel}
            expandLabel={expandLabel}
            isOpen={isOpen}
            onChangeIsOpen={onChangeIsOpen}
            titleSuffix={titleSuffix}
        />
    );

    return (
        <div
            className={cx('planner-collapsible-column', className)}
            data-open={isOpen}
            style={{
                '--planner-collapsible-expanded-min-width': expandedMinWidth,
                ...style,
            }}
            {...otherProps}
        >
            <div className="planner-collapsible-column-stage">
                <div
                    aria-hidden={!isOpen}
                    className="planner-collapsible-column-expanded"
                    data-visible={isOpen}
                    inert={!isOpen}
                >
                    {children(renderToggleButton())}
                </div>

                <div
                    aria-hidden={isOpen}
                    className="planner-collapsible-column-collapsed"
                    data-visible={!isOpen}
                    inert={isOpen}
                >
                    <ToolBar isCollapsed>{renderToggleButton()}</ToolBar>
                </div>
            </div>
        </div>
    );
};

export default CollapsibleColumn;
