import sortBy from 'lodash/sortBy';
import React from 'react';
import { COPY } from './atoms/tokens';
import ListCard, { GhostListCard, ListCardContainer } from './ListCard';

const ListManager = ({ appActions, appData }) => {
    const { onCreateList, onSelectList } = appActions;
    const { lists } = appData;
    const unarchivedLists = lists.filter(list => !list.isArchived);
    const sortedLists = sortBy(unarchivedLists, [list => list.label]);

    return (
        <ListCardContainer>
            <GhostListCard onClick={() => onCreateList()}>
                {COPY.CREATE_LIST_LABEL}
            </GhostListCard>
            {sortedLists.map(list => (
                <ListCard
                    key={list.id}
                    appActions={appActions}
                    appData={appData}
                    listId={list.id}
                    onClick={() => onSelectList(list.id)}
                />
            ))}
        </ListCardContainer>
    );
};

export default ListManager;
