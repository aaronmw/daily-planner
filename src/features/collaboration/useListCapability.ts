import { useCollaborationSelector } from '../../core/collaboration/CollaborationContext';
import type { CollaborationCapability } from '../../core/collaboration/roles';
import { roleHasCapability } from '../../core/collaboration/roles';
import type { ListId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';

export const useListCapability = (
    listId: ListId | null,
    capability: CollaborationCapability
): boolean => {
    const syncEnabled = usePlannerSelector(
        state => state.preferences.syncEnabled
    );
    const isPrivateCopy = usePlannerSelector(state =>
        listId ? Boolean(state.listsById.get(listId)?.isPrivateCopy) : false
    );
    const identityId = useCollaborationSelector(state => state.identityId);
    const role = useCollaborationSelector(state => {
        if (!listId || !identityId) return null;
        return (
            state.membershipsByListId
                .get(listId)
                ?.find(
                    member =>
                        member.userId === identityId &&
                        member.state === 'active'
                )?.role ?? null
        );
    });
    return (
        isPrivateCopy ||
        !syncEnabled ||
        (role !== null && roleHasCapability(role, capability))
    );
};
