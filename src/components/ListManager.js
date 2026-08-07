import React, { memo, useCallback, useMemo } from 'react';
import { COPY } from './atoms/tokens';
import ListCard, { GhostListCard } from './ListCard';
import VirtualListGrid from './VirtualListGrid';

const CREATE_LIST_ITEM = { id: 'create-list', kind: 'create-list' };
const getListItemKey = item => item.id;
const isNestedListCardControl = target =>
    target instanceof Element &&
    Boolean(
        target.closest(
            '.planner-editable-text, .planner-list-card-theme-control'
        )
    );

const ListManager = ({
    isCreatingList,
    lists,
    onChangeIsShowingListManager,
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
    const navigateToItem = useCallback(
        item => {
            if (item.kind !== 'create-list') {
                onSelectList(item.id, { preserveSidebarState: true });
            }
        },
        [onSelectList]
    );
    const renderItem = useCallback(
        item => {
            if (item.kind === 'create-list') {
                return (
                    <GhostListCard onClick={() => onCreateList()}>
                        {COPY.CREATE_LIST_LABEL}
                    </GhostListCard>
                );
            }

            const isActive = item.id === selectedListId;
            const openList = () => {
                onSelectList(item.id);
                onChangeIsShowingListManager(false);
            };

            return (
                <ListCard
                    isActive={isActive}
                    isCreatingList={isCreatingList}
                    list={item}
                    listId={item.id}
                    listThemeStyle={themeByListId.get(item.id)}
                    onUpdateList={onUpdateList}
                    onUpdateTask={onUpdateTask}
                    selectedListId={selectedListId}
                    tasks={tasksByListId.get(item.id) || []}
                    onClick={evt => {
                        if (isNestedListCardControl(evt.target)) {
                            return;
                        }

                        openList();
                    }}
                />
            );
        },
        [
            isCreatingList,
            onChangeIsShowingListManager,
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
            onNavigateItem={navigateToItem}
            renderItem={renderItem}
            selectedIndex={selectedIndex < 0 ? -1 : selectedIndex + 1}
        />
    );
};

export default memo(ListManager);
