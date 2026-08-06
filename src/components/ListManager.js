import React, { memo, useCallback, useMemo } from 'react';
import { COPY } from './atoms/tokens';
import ListCard, { GhostListCard } from './ListCard';
import VirtualListGrid from './VirtualListGrid';

const CREATE_LIST_ITEM = { id: 'create-list', kind: 'create-list' };
const getListItemKey = item => item.id;

const ListManager = ({
    isCreatingList,
    lists,
    onCreateList,
    onSelectList,
    onUpdateList,
    onUpdateTask,
    selectedListId,
    tasksByListId,
    themeByListId,
}) => {
    const items = useMemo(() => [CREATE_LIST_ITEM, ...lists], [lists]);
    const selectedIndex = lists.findIndex(list => list.id === selectedListId);
    const renderItem = useCallback(
        item =>
            item.kind === 'create-list' ? (
                <GhostListCard onClick={() => onCreateList()}>
                    {COPY.CREATE_LIST_LABEL}
                </GhostListCard>
            ) : (
                <ListCard
                    isActive={item.id === selectedListId}
                    isCreatingList={isCreatingList}
                    list={item}
                    listId={item.id}
                    listThemeStyle={themeByListId.get(item.id)}
                    onUpdateList={onUpdateList}
                    onUpdateTask={onUpdateTask}
                    tasks={tasksByListId.get(item.id) || []}
                    onClick={() => onSelectList(item.id)}
                />
            ),
        [
            isCreatingList,
            onCreateList,
            onSelectList,
            onUpdateList,
            onUpdateTask,
            selectedListId,
            tasksByListId,
            themeByListId,
        ]
    );

    return (
        <VirtualListGrid
            focusSelected
            getItemKey={getListItemKey}
            items={items}
            renderItem={renderItem}
            selectedIndex={selectedIndex < 0 ? -1 : selectedIndex + 1}
        />
    );
};

export default memo(ListManager);
