import React from 'react';
import styled from 'styled-components';
import sortBy from 'lodash/sortBy';
import useDrag from '../hooks/useDrag';
import useDrop from '../hooks/useDrop';
import toInt from '../utils/toInt';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import {
    BORDER_RADIUS,
    COLORS,
    COPY,
    GRID_UNIT,
    UNIFIED_TRANSITION,
} from './atoms/tokens';
import EditInPlace from './EditInPlace';

const LIST_CARD_HEIGHT = `calc(${GRID_UNIT} * 8)`;
const LIST_CARD_SPACING = `calc(${GRID_UNIT} * 0.5)`;
const LIST_CARD_WIDTH = `calc((100% - (${LIST_CARD_SPACING} * 2)) / 3)`;

const Container = styled(FlexBox).attrs({
    align: 'flex-start',
    isFlexible: true,
    justify: 'flex-start',
    padding: 1,
    wrapped: true,
})(
    ({ theme }) => `
        align-content: flex-start;
        background-color: ${COLORS[theme.name].SHADED};
        height: 100%;
        overflow: auto;
        padding-bottom: calc(${GRID_UNIT} * 1.5);
    `
);

const StyledListCard = styled(FlexBox).attrs({
    align: 'flex-start',
    direction: 'column',
    justify: 'space-between',
    spacing: 0.5,
})(
    ({ isActive, isTargetedForDrop, theme }) => `
        background-color: ${
            COLORS[theme.name][
                isActive ? 'HIGH_CONTRAST_BACKGROUND' : 'PRIMARY_FADED'
            ]
        };
        border-radius: ${BORDER_RADIUS};
        color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT};
        cursor: pointer;
        height: ${LIST_CARD_HEIGHT};
        margin-bottom: ${LIST_CARD_SPACING};
        margin-left: ${LIST_CARD_SPACING};
        overflow: hidden;
        position: relative;
        transform: scale(${isTargetedForDrop ? 1.1 : 1});
        width: ${LIST_CARD_WIDTH};
        ${UNIFIED_TRANSITION};
        
        &:nth-child(3n+4) {
            margin-left: 0;
        }
    `
);

const ListCardTaskIconContainer = styled(FlexBox).attrs({
    justify: 'flex-start',
    paddingX: 0.25,
    paddingY: 0.25,
    wrapped: true,
})(
    ({ isActive }) => `
        background-color: rgba(255, 255, 255, ${isActive ? 0.75 : 0.25});
        border-radius: ${BORDER_RADIUS};
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        margin: 5px;
        width: calc(100% - (5px * 2));
    `
);

const ListCard = ({ appActions, children, listId, ...otherProps }) => {
    const { onUpdateTask } = appActions;

    const [dragProps] = useDrag({ 'list-id': listId });

    const [dropProps] = useDrop({
        'task-id': (taskId, evt) => {
            const targetListId = toInt(evt.currentTarget.dataset.listId);
            if (targetListId) {
                onUpdateTask(taskId, {
                    list_id: targetListId,
                });
            }
        },
    });

    return (
        <StyledListCard
            data-list-id={listId}
            title={COPY.TIPS.MOVE_BETWEEN_LISTS}
            {...dragProps}
            {...dropProps}
            {...otherProps}
        >
            {children}
        </StyledListCard>
    );
};

const GhostListCard = styled(GhostButton).attrs({
    align: 'center',
    justify: 'center',
})`
    height: ${LIST_CARD_HEIGHT};
    margin-bottom: ${LIST_CARD_SPACING};
    width: ${LIST_CARD_WIDTH};
`;

const ListManager = ({ appActions, appData }) => {
    const { onCreateList, onSelectList, onUpdateList } = appActions;
    const { incompleteTasks, isCreatingList, lists, selectedListId } = appData;
    const unarchivedLists = lists.filter(list => !list.isArchived);
    const sortedLists = sortBy(unarchivedLists, [list => list.label]);

    const tracingElementStyles = theme => `
        border-color: ${COLORS[theme.name].HIGH_CONTRAST_TEXT}
    `;

    return (
        <Container>
            <GhostListCard onClick={() => onCreateList()}>
                {COPY.CREATE_LIST_LABEL}
            </GhostListCard>
            {sortedLists.map(list => {
                const isActive = selectedListId === list.id;
                const tasksInList = incompleteTasks.filter(
                    task => task.list_id === list.id
                );

                return (
                    <ListCard
                        key={list.id}
                        appActions={appActions}
                        isActive={isActive}
                        listId={list.id}
                        onClick={() => onSelectList(list.id)}
                    >
                        <EditInPlace
                            isRemotelyActivated={
                                isCreatingList && selectedListId === list.id
                            }
                            marginX={0.75}
                            marginY={0.5}
                            style={{
                                alignSelf: 'stretch',
                                flexGrow: 0,
                                flexShrink: 0,
                            }}
                            tracingElementStyles={tracingElementStyles}
                            value={list.label}
                            onSave={newLabel => {
                                onUpdateList(list.id, { label: newLabel });
                            }}
                        />
                        {tasksInList.length >= 1 && (
                            <ListCardTaskIconContainer isActive={isActive}>
                                {tasksInList.map(task => (
                                    <span key={task.id}>{task.icon}</span>
                                ))}
                            </ListCardTaskIconContainer>
                        )}
                    </ListCard>
                );
            })}
        </Container>
    );
};

export default ListManager;
