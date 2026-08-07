import React, { memo, useCallback, useMemo, useRef } from 'react';
import useDrag from '../hooks/useDrag';
import useDrop from '../hooks/useDrop';
import useElementRect from '../hooks/useElementRect';
import isSurfaceActivationKey from '../utils/isSurfaceActivationKey';
import toInt from '../utils/toInt';
import cx from '../utils/cx';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { COPY, getListAccentKey } from './atoms/tokens';
import ColorPicker from './ColorPicker';
import EditableText from './EditableText';
import VirtualCollection from './VirtualCollection';

const Container = React.forwardRef(
    ({ className, isActive, isTargetedForDrop, style, ...otherProps }, ref) => (
        <FlexBox
            ref={ref}
            align="flex-start"
            direction="column"
            justify="flex-start"
            spacing={0.5}
            className={cx('planner-list-card', className)}
            data-active={isActive}
            style={{
                '--planner-drop-scale': isTargetedForDrop ? 1.1 : 1,
                ...style,
            }}
            {...otherProps}
        />
    )
);

export const GhostListCard = ({ className, ...otherProps }) => (
    <GhostButton
        align="center"
        data-grid-navigation-target
        justify="center"
        className={cx('h-full w-full', className)}
        {...otherProps}
    />
);

export const ListCardContainer = ({ className, ...otherProps }) => (
    <FlexBox
        align="flex-start"
        isFlexible
        justify="flex-start"
        padding={1}
        spacing={0.5}
        wrapped
        className={cx('planner-list-card-grid', className)}
        {...otherProps}
    />
);

const getPreviewTaskKey = task => task.id;
const PREVIEW_GAP = 6.25;
const PREVIEW_LINE_HEIGHT = 1.4;
const PREVIEW_MIN_FONT_SIZE = 6.25;
const PREVIEW_MAX_FONT_SIZE = 12.5;
const EMPTY_TASKS = [];

const handleListCardKeyDown = evt => {
    if (isSurfaceActivationKey(evt)) {
        evt.preventDefault();
        evt.currentTarget.click();
    }
};

const ListCard = ({
    isActive,
    isCreatingList,
    listId,
    list,
    listThemeStyle,
    onUpdateList,
    onUpdateTask,
    selectedListId,
    isEditable = true,
    style,
    tasks = EMPTY_TASKS,
    ...otherProps
}) => {
    const listAccentKey = getListAccentKey(list);

    const listCardElementRef = useRef(null);
    const previewElementRef = useRef(null);
    const { height: previewHeight } = useElementRect(previewElementRef);
    const previewFontSize = useMemo(() => {
        if (!tasks.length || !previewHeight) {
            return PREVIEW_MAX_FONT_SIZE;
        }

        const availableTextHeight = Math.max(
            0,
            previewHeight - PREVIEW_GAP * (tasks.length - 1)
        );
        const fittedFontSize =
            availableTextHeight / (tasks.length * PREVIEW_LINE_HEIGHT);

        return Math.min(
            PREVIEW_MAX_FONT_SIZE,
            Math.max(PREVIEW_MIN_FONT_SIZE, fittedFontSize)
        );
    }, [previewHeight, tasks.length]);
    const estimatePreviewTaskSize = useCallback(
        () => previewFontSize * PREVIEW_LINE_HEIGHT,
        [previewFontSize]
    );

    const [dragProps] = useDrag({ 'list-id': listId });

    const [dropProps] = useDrop({
        'task-id': (taskId, evt) => {
            const targetListId = toInt(evt.currentTarget.dataset.listId);
            if (targetListId) {
                onUpdateTask(taskId, {
                    isComplete: false,
                    list_id: targetListId,
                });
            }
        },
    });

    const setListColor = useCallback(
        accentKey => onUpdateList(listId, { accent_key: accentKey }),
        [listId, onUpdateList]
    );
    const renderPreviewTask = useCallback(
        task => (
            <FlexBox
                align="flex-start"
                className="planner-list-card-preview-task"
                paddingX={0.25}
                spacing={0.25}
                style={{
                    fontSize: previewFontSize,
                }}
            >
                <span>{task.icon}</span>
                <span className="planner-list-card-preview-task-label">
                    {task.label}
                </span>
            </FlexBox>
        ),
        [previewFontSize]
    );

    return (
        <Container
            data-grid-navigation-target
            data-list-id={listId}
            isActive={isActive}
            isTargetedForDrop={dropProps.isTargetedForDrop}
            ref={listCardElementRef}
            tabIndex={0}
            title={COPY.TIPS.MOVE_BETWEEN_LISTS}
            style={{
                ...listThemeStyle,
                ...style,
            }}
            {...dragProps}
            {...dropProps}
            {...otherProps}
            onKeyDown={handleListCardKeyDown}
        >
            <EditableText
                key={listId}
                isEditable={isEditable}
                marginX={0.75}
                marginTop={0.5}
                startsEditing={isCreatingList && selectedListId === listId}
                style={{
                    alignSelf: 'stretch',
                    flexGrow: 0,
                    flexShrink: 0,
                }}
                tracerColor="var(--planner-contrast-text)"
                value={list.label}
                onSave={newLabel => {
                    onUpdateList(listId, { label: newLabel });
                }}
            />
            <VirtualCollection
                className="planner-list-card-preview"
                estimateSize={estimatePreviewTaskSize}
                gap={6.25}
                getItemKey={getPreviewTaskKey}
                items={tasks}
                overscan={4}
                paddingEnd={0}
                paddingStart={0}
                renderItem={renderPreviewTask}
                scrollElementRef={previewElementRef}
            />
            <ColorPicker
                accentKey={listAccentKey}
                className="planner-list-card-theme-control"
                onPickColor={setListColor}
            />
        </Container>
    );
};

export default memo(ListCard);
