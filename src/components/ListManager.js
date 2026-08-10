import React, { memo, useCallback, useMemo } from 'react';
import { canWrite, ROLES } from '../collaboration/roles';
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
    labelEditSession,
    collaboration,
    lists,
    onCancelLabelEdit,
    onCompleteLabelEdit,
    onCreateList,
    onFulfillLabelEdit,
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
            const isEditable =
                item.is_private_copy ||
                !collaboration.isEnabled ||
                canWrite(
                    collaboration.roleByListId?.get(item.id) || ROLES.READ
                );
            const labelEditRequest =
                labelEditSession?.entityType === 'list' &&
                labelEditSession.entityId === item.id
                    ? {
                          id: labelEditSession.requestId,
                          selectAll: true,
                      }
                    : null;
            const openList = () => {
                onSelectList(item.id);
            };

            return (
                <ListCard
                    isActive={isActive}
                    isEditable={isEditable}
                    labelEditRequest={labelEditRequest}
                    list={item}
                    listId={item.id}
                    listThemeStyle={themeByListId.get(item.id)}
                    isOwnerPresent={collaboration.presenceByIdentityId?.has(
                        item.owner_identity_id
                    )}
                    ownerProfile={collaboration.getProfileForList?.(
                        item.id,
                        item.owner_identity_id
                    )}
                    showOwnerAvatar={
                        (collaboration.membersByListId?.get(item.id)?.length ||
                            0) > 1
                    }
                    onCancelLabelEdit={onCancelLabelEdit}
                    onCompleteLabelEdit={onCompleteLabelEdit}
                    onFulfillLabelEdit={onFulfillLabelEdit}
                    onUpdateList={onUpdateList}
                    onUpdateTask={onUpdateTask}
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
            labelEditSession,
            collaboration,
            onCancelLabelEdit,
            onCompleteLabelEdit,
            onCreateList,
            onFulfillLabelEdit,
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
            focusSelected={
                !(
                    labelEditSession?.entityType === 'list' &&
                    labelEditSession.entityId === selectedListId
                )
            }
            getItemKey={getListItemKey}
            items={items}
            onNavigateItem={navigateToItem}
            revealSelected
            renderItem={renderItem}
            selectedIndex={selectedIndex < 0 ? -1 : selectedIndex + 1}
        />
    );
};

export default memo(ListManager);
