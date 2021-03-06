import React, { useCallback, useRef } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import useDrag from '../hooks/useDrag';
import useDrop from '../hooks/useDrop';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import toInt from '../utils/toInt';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    buildPalette,
    COPY,
    FONTS,
    GRID_UNIT,
    LIST_CARD_HEIGHT,
    LIST_CARD_SPACING,
    LIST_CARD_WIDTH,
    UNIFIED_TRANSITION,
} from './atoms/tokens';
import ColorPicker from './ColorPicker';
import EditInPlace from './EditInPlace';

const Container = styled(FlexBox).attrs({
    align: 'flex-start',
    direction: 'column',
    justify: 'flex-start',
    spacing: 0.5,
})(
    ({ isActive, isTargetedForDrop, theme }) => `
        background-color: ${theme.HIGH_CONTRAST_BACKGROUND};
        border-radius: ${BORDER_RADIUS};
        box-shadow:
            0 0 0 2px ${isActive ? theme.SHADED : 'transparent'},
            0 0 0 4px ${
                isActive
                    ? theme[
                          isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER_HOVER'
                      ]
                    : 'transparent'
            };
        color: ${theme.HIGH_CONTRAST_TEXT};
        cursor: pointer;
        overflow: hidden;
        position: relative;
        transform: scale(${isTargetedForDrop ? 1.1 : 1});
        width: 100%;
        height: 100%;
        ${UNIFIED_TRANSITION};

        &:hover {
            box-shadow:
                0 0 0 2px ${theme.SHADED},
                0 0 0 4px ${
                    theme[isActive ? 'TASK_BORDER_ACTIVE' : 'TASK_BORDER_HOVER']
                };
        }

        &:focus {
            box-shadow:
                0 0 0 2px ${theme.SHADED},
                0 0 0 4px ${theme.TASK_BORDER_ACTIVE};
        }

        &:active {
            box-shadow:
                0 0 0 2px ${theme.SHADED},
                0 0 0 4px ${theme.TASK_BORDER_ACTIVE};
        }
    `
);

export const GhostListCard = styled(GhostButton).attrs({
    align: 'center',
    justify: 'center',
})`
    height: ${LIST_CARD_HEIGHT};
    margin-bottom: ${LIST_CARD_SPACING};
    width: ${LIST_CARD_WIDTH};
`;

export const ListCardContainer = styled(FlexBox).attrs({
    align: 'flex-start',
    isFlexible: true,
    justify: 'flex-start',
    padding: 1,
    spacing: LIST_CARD_SPACING,
    wrapped: true,
})(
    ({ theme }) => `
        align-content: flex-start;
        background-color: ${theme.SHADED};
        height: 100%;
        overflow: auto;
        padding-bottom: calc(${GRID_UNIT} * 1.5);

        & > * {
            height: ${LIST_CARD_HEIGHT};
            margin-bottom: ${LIST_CARD_SPACING};
            margin-left: ${LIST_CARD_SPACING};
            width: ${LIST_CARD_WIDTH};

            :nth-child(3n + 1) {
                margin-left: 0;
            }
        }
    `
);

const keyboardShortcutNamespace = 'list-card';

const ListCard = ({
    appActions,
    appData,
    listId,
    isEditable = true,
    ...otherProps
}) => {
    const { onUpdateList, onUpdateTask } = appActions;

    const { isCreatingList, lists, selectedListId, tasks, theme } = appData;

    const list = lists.find(list => list.id === listId);

    const listPalette = buildPalette(theme, list.color_code);

    const tasksInList = tasks.filter(
        task => task.list_id === listId && !task.isComplete
    );

    const isActive = listId === selectedListId;

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

    const triggerClick = useCallback(evt => {
        evt.preventDefault();
        evt.target.click();
    }, []);

    const setListColor = colorCode =>
        onUpdateList(listId, { color_code: colorCode });

    useKeyboardShortcut(
        keyboardShortcutNamespace,
        [('enter', 'space')],
        triggerClick
    );

    return (
        <ThemeProvider theme={listPalette}>
            <Container
                data-list-id={listId}
                isActive={isActive}
                ref={listCardElementRef}
                tabIndex={0}
                title={COPY.TIPS.MOVE_BETWEEN_LISTS}
                {...dragProps}
                {...dropProps}
                {...otherProps}
            >
                <EditInPlace
                    isEditable={isEditable}
                    isRemotelyActivated={
                        isCreatingList && selectedListId === listId
                    }
                    marginX={0.75}
                    marginTop={0.5}
                    style={{
                        alignSelf: 'stretch',
                        flexGrow: 0,
                        flexShrink: 0,
                    }}
                    tracerColor={listPalette.HIGH_CONTRAST_TEXT}
                    value={list.label}
                    onSave={newLabel => {
                        onUpdateList(listId, { label: newLabel });
                    }}
                />
                <FlexBox
                    direction="column"
                    isFlexible
                    isScrollable
                    spacing={0.25}
                >
                    {tasksInList.map(task => (
                        <FlexBox
                            key={task.id}
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
                    ))}
                </FlexBox>
                <ColorPicker listId={listId} onPickColor={setListColor} />
            </Container>
        </ThemeProvider>
    );
};

export default ListCard;
