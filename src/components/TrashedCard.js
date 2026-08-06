import random from 'lodash/random';
import React from 'react';
import FlexBox from './atoms/FlexBox';
import Icon from './atoms/Icon';
import cx from '../utils/cx';

const TrashedCard = ({
    children,
    className,
    restoreButtonTitle,
    style,
    onRestore,
    ...otherProps
}) => (
    <div
        className={cx('planner-trashed-card', className)}
        style={{
            '--planner-float-distance': random(0.5, 2),
            '--planner-float-duration': `${random(300, 400)}ms`,
            '--planner-float-min-opacity': random(0.75, 0.9),
            ...style,
        }}
        {...otherProps}
    >
        <FlexBox
            align="center"
            justify="center"
            padding={0.25}
            className="planner-restore-button absolute right-0 top-0 z-[1000] size-[var(--spacing-grid)] translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-planner-neutral-foreground bg-planner-neutral-background text-planner-neutral-foreground"
            title={restoreButtonTitle}
            onClick={onRestore}
        >
            <Icon iconName="reply" />
        </FlexBox>
        {children}
    </div>
);

export default TrashedCard;
