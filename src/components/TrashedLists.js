import React, { memo, useCallback } from 'react';
import FlexBox from './atoms/FlexBox';
import { COPY } from './atoms/tokens';
import ListCard from './ListCard';
import TrashedCard from './TrashedCard';
import VirtualListGrid from './VirtualListGrid';

const getListKey = list => list.id;

const TrashedLists = ({ appActions, appData, ...otherProps }) => {
    const { onUpdateList, onUpdateTask } = appActions;
    const deletedLists = appData.plannerIndexes.trashedLists;
    const renderList = useCallback(
        list => (
            <TrashedCard
                className="h-full"
                restoreButtonTitle={COPY.LABEL_FOR_RESTORING_LIST}
                onRestore={() => onUpdateList(list.id, { isArchived: false })}
            >
                <ListCard
                    isActive={list.id === appData.selectedListId}
                    isCreatingList={appData.isCreatingList}
                    isEditable={false}
                    list={list}
                    listId={list.id}
                    listThemeStyle={appData.plannerIndexes.themeByListId.get(
                        list.id
                    )}
                    onUpdateList={onUpdateList}
                    onUpdateTask={onUpdateTask}
                    tasks={
                        appData.plannerIndexes.tasksByListId.get(list.id) || []
                    }
                    style={{ marginLeft: 0 }}
                />
            </TrashedCard>
        ),
        [appData, onUpdateList, onUpdateTask]
    );

    if (!deletedLists.length) {
        return (
            <FlexBox
                align="center"
                isFlexible
                justify="center"
                style={{ opacity: 0.6 }}
            >
                {COPY.EMPTY_TRASHED_LISTS}
            </FlexBox>
        );
    }

    return (
        <VirtualListGrid
            {...otherProps}
            getItemKey={getListKey}
            items={deletedLists}
            renderItem={renderList}
        />
    );
};

export default memo(TrashedLists);
