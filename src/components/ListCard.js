import React, { memo, useCallback, useRef } from 'react';
import useDrag from '../hooks/useDrag';
import useDrop from '../hooks/useDrop';
import isSurfaceActivationKey from '../utils/isSurfaceActivationKey';
import toInt from '../utils/toInt';
import cx from '../utils/cx';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import { COPY, FONTS, getListAccentKey } from './atoms/tokens';
import ColorPicker from './ColorPicker';
import EditInPlace from './EditInPlace';
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
const estimatePreviewTaskSize = () => 15;

const ListCard = ({
    isActive,
    isCreatingList,
    listId,
    list,
    listThemeStyle,
    onUpdateList,
    onUpdateTask,
    isEditable = true,
    style,
    tasks = [],
    ...otherProps
}) => {
    const listAccentKey = getListAccentKey(list);

    const listCardElementRef = useRef(null);

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

    const setListColor = accentKey =>
        onUpdateList(listId, { accent_key: accentKey });
    const handleKeyDown = evt => {
        if (isSurfaceActivationKey(evt)) {
            evt.preventDefault();
            evt.currentTarget.click();
        }
    };
    const renderPreviewTask = useCallback(
        task => (
            <FlexBox
                align="flex-start"
                paddingX={0.25}
                spacing={0.25}
                style={{
                    fontSize: `calc(${FONTS.NORMAL.SIZE} / 2)`,
                }}
            >
                <span>{task.icon}</span>
                <span>{task.label}</span>
            </FlexBox>
        ),
        []
    );

    return (
        <Container
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
            onKeyDown={handleKeyDown}
        >
            <EditInPlace
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
            />
            <ColorPicker accentKey={listAccentKey} onPickColor={setListColor} />
        </Container>
    );
};

export default memo(ListCard);
