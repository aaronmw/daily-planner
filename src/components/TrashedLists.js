import React, { memo } from 'react';
import FlexBox from './atoms/FlexBox';
import { COPY, LIST_CARD_WIDTH } from './atoms/tokens';
import ListCard, { ListCardContainer } from './ListCard';
import TrashedCard from './TrashedCard';

const TrashedLists = ({ appActions, appData, ...otherProps }) => {
    const { onUpdateList } = appActions;

    const { lists } = appData;

    const deletedLists = lists.filter(list => list.isArchived);

    const hasDeletedLists = deletedLists.length;

    const handleRestoreList = listId =>
        onUpdateList(listId, { isArchived: false });

    return (
        <>
            {!hasDeletedLists && (
                <FlexBox
                    align="center"
                    isFlexible
                    justify="center"
                    style={{ opacity: 0.6 }}
                >
                    {COPY.EMPTY_TRASHED_LISTS}
                </FlexBox>
            )}
            {!!hasDeletedLists && (
                <ListCardContainer {...otherProps}>
                    {deletedLists.map(list => (
                        <TrashedCard
                            key={list.id}
                            restoreButtonTitle={COPY.LABEL_FOR_RESTORING_LIST}
                            style={{ width: LIST_CARD_WIDTH }}
                            onRestore={handleRestoreList.bind(this, list.id)}
                        >
                            <ListCard
                                appActions={appActions}
                                appData={appData}
                                isEditable={false}
                                listId={list.id}
                                style={{ marginLeft: 0 }}
                            />
                        </TrashedCard>
                    ))}
                </ListCardContainer>
            )}
        </>
    );
};

export default memo(TrashedLists);
