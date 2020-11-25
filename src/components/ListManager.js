import sortBy from 'lodash/sortBy';
import React from 'react';
import styled from 'styled-components';
import FlexBox from './atoms/FlexBox';
import { COLORS, COPY, GRID_UNIT } from './atoms/tokens';
import EditInPlace from './EditInPlace';
import { GhostListCard, ListCard, ListCardTaskIconContainer } from './ListCard';

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
