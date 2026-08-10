import React, { memo, useLayoutEffect, useRef, useState } from 'react';
import useDrag from '../hooks/useDrag';
import isSurfaceActivationKey from '../utils/isSurfaceActivationKey';
import cx from '../utils/cx';
import CollaborationAvatar from './CollaborationAvatar';
import FlexBox from './atoms/FlexBox';
import KeyboardKey from './atoms/KeyboardKey';
import { COPY, FONTS } from './atoms/tokens';

const Container = React.forwardRef(
    (
        {
            className,
            cardContext,
            durationMinutes,
            hasCreatorAvatar,
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
            spacing={0}
            className={cx('planner-task-card', className)}
            data-active={isActive}
            data-card-context={cardContext}
            data-dragging={isDragging}
            data-hovered={isMouseOver}
            data-has-creator-avatar={hasCreatorAvatar}
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

const CardShortcut = ({ shortcutNumber }) => (
    <FlexBox
        align="center"
        justify="center"
        className="planner-task-card-shortcut"
    >
        <KeyboardKey
            aria-label={`Press ${shortcutNumber} to focus this task`}
            label={shortcutNumber}
            title={`Press ${shortcutNumber} to focus this task`}
        />
    </FlexBox>
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
    creatorProfile,
    isActive = false,
    isCreatorPresent = false,
    isInteractionDisabled = false,
    isMutable = true,
    onTransitionToTask,
    startOffsetMinutes,
    style,
    showCreatorAvatar = false,
    shortcutNumber = null,
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

    const handleClick = () => onTransitionToTask(id);

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
            hasCreatorAvatar={showCreatorAvatar}
            isActive={isActive}
            isDragging={dragProps.isDragging}
            isMouseOver={isMouseOver}
            data-single-line={isSingleLine}
            tabIndex={0}
            title={
                isMutable
                    ? COPY.TIPS.MOVE_TASK_BETWEEN_TASK_LIST_AND_TIMELINE
                    : 'Write access is required to move this task.'
            }
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
            {...(isMutable ? dragProps : {})}
            {...otherProps}
        >
            {showCreatorAvatar ? (
                <CollaborationAvatar
                    compact={duration_minutes <= 15}
                    isPresent={isCreatorPresent}
                    profile={creatorProfile}
                />
            ) : null}
            <CardLabel isSingleLine={isSingleLine}>
                <span
                    className="planner-task-card-label-text"
                    ref={labelTextRef}
                >
                    {label}
                </span>
            </CardLabel>
            {Number.isInteger(shortcutNumber) &&
            shortcutNumber >= 1 &&
            shortcutNumber <= 9 ? (
                <CardShortcut shortcutNumber={shortcutNumber} />
            ) : null}
            <CardIcon durationMinutes={duration_minutes}>{icon}</CardIcon>
        </Container>
    );
};

export default memo(TaskCard);
