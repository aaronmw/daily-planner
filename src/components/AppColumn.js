import React from 'react';
import FlexBox from './atoms/FlexBox';
import cx from '../utils/cx';

const AppColumn = ({
    children,
    className,
    disabledIf = [false],
    headerActions,
    label,
    style,
    ...otherProps
}) => {
    const isDisabled =
        disabledIf.length && disabledIf.some(condition => condition === true);
    const hasHeader = label !== undefined || Boolean(headerActions);

    return (
        <FlexBox
            direction="column"
            isFlexible
            className="planner-app-column"
            data-disabled={isDisabled}
        >
            {hasHeader ? (
                <FlexBox
                    justify="center"
                    className="planner-column-header sticky top-0 z-[100] border-b border-planner-border bg-planner-background text-xs uppercase text-planner-text-faded"
                    data-has-actions={Boolean(headerActions)}
                >
                    <span className="planner-column-header-label">{label}</span>
                    {headerActions ? (
                        <div className="planner-column-header-actions">
                            {headerActions}
                        </div>
                    ) : null}
                </FlexBox>
            ) : null}
            <FlexBox
                direction="column"
                className={cx(
                    'planner-column-content relative overflow-auto transition-[height,opacity,transform,width] duration-150 ease-in-out',
                    className
                )}
                style={{
                    height: hasHeader
                        ? 'calc(100dvh - var(--spacing-icon-slot))'
                        : '100dvh',
                    ...style,
                }}
                {...otherProps}
            >
                {children}
            </FlexBox>
        </FlexBox>
    );
};

export const PrimaryAppColumn = ({ className, ...otherProps }) => (
    <AppColumn
        className={cx(
            'z-[11] overflow-visible shadow-[0_0_10px_10px_var(--planner-shadow)]',
            className
        )}
        {...otherProps}
    />
);

export const SecondaryAppColumn = ({
    className,
    isTargetedForDrop,
    ...otherProps
}) => (
    <AppColumn
        className={cx(
            'planner-secondary-column relative grow overflow-auto bg-planner-background',
            className
        )}
        data-drop-targeted={isTargetedForDrop}
        {...otherProps}
    />
);

export default AppColumn;
