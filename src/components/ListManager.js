import React from 'react';
import { COPY } from './atoms/tokens';
import ListCard, { GhostListCard, ListCardContainer } from './ListCard';

const ListManager = ({ appActions, appData, lists }) => {
    const { onCreateList, onSelectList } = appActions;

    return (
        <ListCardContainer>
            <GhostListCard onClick={() => onCreateList()}>
                {COPY.CREATE_LIST_LABEL}
            </GhostListCard>
            {lists.map(list => (
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
