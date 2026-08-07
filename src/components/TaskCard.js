import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import useDrag from '../hooks/useDrag';
import isSurfaceActivationKey from '../utils/isSurfaceActivationKey';
import cx from '../utils/cx';
import FlexBox from './atoms/FlexBox';
import { COPY, FONTS } from './atoms/tokens';

const Container = React.forwardRef(
    (
        {
            className,
            cardContext,
            durationMinutes,
            isActive,
            isDragging,
            isMouseOver,
            style,
            ...otherProps
        },
        ref
    ) => (
        <FlexBox
            ref={ref}
            align="flex-start"
            justify="space-between"
            spacing={0.5}
            paddingX={0.5}
            className={cx('planner-task-card', className)}
            data-active={isActive}
            data-card-context={cardContext}
            data-dragging={isDragging}
            data-hovered={isMouseOver}
            style={{
                '--planner-task-duration-minutes': durationMinutes,
                '--planner-task-label-duration-minutes': Math.min(
                    30,
                    durationMinutes
                ),
                ...style,
            }}
            {...otherProps}
        />
    )
);

const CardLabel = ({ className, isSingleLine, ...otherProps }) => (
    <FlexBox
        align={isSingleLine ? 'center' : 'flex-start'}
        isFlexible
        className={cx('planner-task-card-label', className)}
        {...otherProps}
    />
);

const CardIcon = ({ durationMinutes, style, ...otherProps }) => (
    <FlexBox
        align="center"
        justify="center"
        className="planner-task-card-icon"
        style={{
            fontSize:
                durationMinutes <= 15 ? FONTS.NORMAL.SIZE : FONTS.LARGE.SIZE,
            width: 'auto',
            ...style,
        }}
        {...otherProps}
    />
);

export const TaskCardContainer = ({ className, ...otherProps }) => (
    <FlexBox
        isFlexible
        justify="flex-start"
        direction="column"
        spacing={0.5}
        padding={1}
        className={cx('h-full', className)}
        {...otherProps}
    />
);

const TaskCard = ({
    cardThemeStyle,
    cardContext = 'collection',
    className,
    isActive = false,
    isInteractionDisabled = false,
    isShowingListManager,
    onImmediatelySelectTask,
    onTransitionToTask,
    startOffsetMinutes,
    style,
    task,
    ...otherProps
}) => {
    const [isMouseOver, setIsMouseOver] = useState(false);

    const { duration_minutes, icon, id, label } = task;
    const labelTextRef = useRef(null);
    const [isSingleLine, setIsSingleLine] = useState(
        () => !String(label).includes('\n')
    );

    const [dragProps] = useDrag({ 'task-id': id });

    useLayoutEffect(() => {
        const labelTextElement = labelTextRef.current;

        if (!labelTextElement) {
            return undefined;
        }

        const measureLineCount = () => {
            const lineHeight = Number.parseFloat(
                window.getComputedStyle(labelTextElement).lineHeight
            );
            const renderedHeight =
                labelTextElement.getBoundingClientRect().height;
            const nextIsSingleLine =
                !String(label).includes('\n') &&
                Number.isFinite(lineHeight) &&
                renderedHeight <= lineHeight * 1.25;

            setIsSingleLine(current =>
                current === nextIsSingleLine ? current : nextIsSingleLine
            );
        };

        measureLineCount();

        if (typeof ResizeObserver === 'undefined') {
            return undefined;
        }

        const observer = new ResizeObserver(measureLineCount);
        observer.observe(labelTextElement);

        return () => observer.disconnect();
    }, [label]);

    const handleClick = () => {
        if (isShowingListManager) {
            onImmediatelySelectTask(id);
            return;
        }

        onTransitionToTask(id);
    };

    const handleKeyDown = evt => {
        if (isSurfaceActivationKey(evt)) {
            evt.preventDefault();
            handleClick();
        }
    };

    return (
        <Container
            className={className}
            data-task-id={id}
            cardContext={cardContext}
            durationMinutes={duration_minutes}
            isActive={isActive}
            isDragging={dragProps.isDragging}
            isMouseOver={isMouseOver}
            data-single-line={isSingleLine}
            tabIndex={0}
            title={COPY.TIPS.MOVE_TASK_BETWEEN_TASK_LIST_AND_TIMELINE}
            style={{
                ...cardThemeStyle,
                pointerEvents: isInteractionDisabled ? 'none' : 'auto',
                ...(Number.isFinite(startOffsetMinutes)
                    ? {
                          '--planner-task-start-offset-minutes':
                              startOffsetMinutes,
                      }
                    : {}),
                ...style,
            }}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsMouseOver(true)}
            onMouseLeave={() => setIsMouseOver(false)}
            {...dragProps}
            {...otherProps}
        >
            <CardLabel isSingleLine={isSingleLine}>
                <span
                    className="planner-task-card-label-text"
                    ref={labelTextRef}
                >
                    {label}
                </span>
            </CardLabel>
            <CardIcon durationMinutes={duration_minutes}>{icon}</CardIcon>
        </Container>
    );
};

export default memo(TaskCard);
