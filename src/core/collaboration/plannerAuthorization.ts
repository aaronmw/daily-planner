import type { PlannerAuthorization } from '../application/ports';
import type { PlannerStore } from '../store/plannerStore';
import type { CollaborationStore } from './collaborationStore';
import { roleHasCapability } from './roles';

export const createCollaborationPlannerAuthorization = (
    plannerStore: PlannerStore,
    collaborationStore: CollaborationStore
): PlannerAuthorization => ({
    canAccessList: (listId, capability) => {
        const planner = plannerStore.getState();
        const list = planner.listsById.get(listId);
        if (list?.isPrivateCopy || !planner.preferences.syncEnabled)
            return true;

        const collaboration = collaborationStore.getState();
        if (!collaboration.identityId) return false;
        const membership = collaboration.membershipsByListId
            .get(listId)
            ?.find(
                candidate =>
                    candidate.userId === collaboration.identityId &&
                    candidate.state === 'active'
            );
        return Boolean(
            membership && roleHasCapability(membership.role, capability)
        );
    },
});
