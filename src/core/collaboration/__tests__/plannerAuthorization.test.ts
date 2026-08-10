import { describe, expect, it } from 'vitest';
import { createPlannerList } from '../../domain/factories';
import {
    createPlannerStore,
    DEFAULT_PREFERENCES,
} from '../../store/plannerStore';
import { createCollaborationStore } from '../collaborationStore';
import { createCollaborationPlannerAuthorization } from '../plannerAuthorization';

describe('collaboration planner authorization', () => {
    it('keeps private conflict copies editable while sync is enabled', () => {
        const planner = createPlannerStore();
        const list = { ...createPlannerList(), isPrivateCopy: true };
        planner.getState().applySnapshot({ lists: [list], items: [] });
        planner.getState().setPreferences({
            ...DEFAULT_PREFERENCES,
            syncEnabled: true,
        });
        const authorization = createCollaborationPlannerAuthorization(
            planner,
            createCollaborationStore()
        );

        expect(authorization.canAccessList(list.id, 'write')).toBe(true);
        expect(authorization.canAccessList(list.id, 'transfer-ownership')).toBe(
            true
        );
    });

    it('denies synced mutations until an active membership is available', () => {
        const planner = createPlannerStore();
        const list = createPlannerList();
        planner.getState().applySnapshot({ lists: [list], items: [] });
        planner.getState().setPreferences({
            ...DEFAULT_PREFERENCES,
            syncEnabled: true,
        });
        const authorization = createCollaborationPlannerAuthorization(
            planner,
            createCollaborationStore()
        );

        expect(authorization.canAccessList(list.id, 'write')).toBe(false);
    });
});
