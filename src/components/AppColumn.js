import React from 'react';
import FlexBox from './atoms/FlexBox';
import cx from '../utils/cx';

const AppColumn = ({
    children,
    className,
    disabledIf = [false],
    label,
    style,
    ...otherProps
}) => {
    const isDisabled =
        disabledIf.length && disabledIf.some(condition => condition === true);

    return (
        <FlexBox
            direction="column"
            isFlexible
            className="planner-app-column"
            data-disabled={isDisabled}
        >
            <FlexBox
                justify="center"
                className="sticky top-0 z-[100] border-b border-planner-border bg-planner-background text-xs uppercase text-planner-text-faded [height:var(--spacing-grid)]"
            >
                {label}
            </FlexBox>
            <FlexBox
                direction="column"
                className={cx(
                    'planner-column-content relative overflow-auto transition-[height,opacity,transform,width] duration-150 ease-in-out',
                    className
                )}
                style={{
                    height: 'calc(100dvh - var(--spacing-grid))',
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
            'z-[11] overflow-visible border-l border-r border-planner-border shadow-[0_0_10px_10px_var(--planner-shadow)]',
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
            'planner-secondary-column relative grow overflow-auto bg-planner-shaded',
            className
        )}
        data-drop-targeted={isTargetedForDrop}
        {...otherProps}
    />
);

export default AppColumn;
