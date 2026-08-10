import React, { memo, useCallback } from 'react';
import { ROLES } from '../collaboration/roles';
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
        list => {
            const canRestore =
                !appData.collaboration?.isEnabled ||
                appData.collaboration?.roleByListId?.get(list.id) ===
                    ROLES.OWNER;
            return (
                <TrashedCard
                    className="h-full"
                    restoreDisabled={!canRestore}
                    restoreButtonTitle={
                        canRestore
                            ? COPY.LABEL_FOR_RESTORING_LIST
                            : 'Owner access is required to restore this list.'
                    }
                    onRestore={() =>
                        onUpdateList(list.id, { isArchived: false })
                    }
                >
                    <ListCard
                        isActive={list.id === appData.selectedListId}
                        isEditable={false}
                        list={list}
                        listId={list.id}
                        listThemeStyle={appData.plannerIndexes.themeByListId.get(
                            list.id
                        )}
                        isOwnerPresent={appData.collaboration?.presenceByIdentityId?.has(
                            list.owner_identity_id
                        )}
                        ownerProfile={appData.collaboration?.getProfileForList?.(
                            list.id,
                            list.owner_identity_id
                        )}
                        onUpdateList={onUpdateList}
                        onUpdateTask={onUpdateTask}
                        tasks={
                            appData.plannerIndexes.tasksByListId.get(list.id) ||
                            []
                        }
                        showOwnerAvatar={
                            (appData.collaboration?.membersByListId?.get(
                                list.id
                            )?.length || 0) > 1
                        }
                        style={{ marginLeft: 0 }}
                    />
                </TrashedCard>
            );
        },
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
