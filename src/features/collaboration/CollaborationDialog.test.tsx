import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import { createPlannerList } from '../../core/domain/factories';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { CollaborationDialog } from './CollaborationDialog';

describe('CollaborationDialog', () => {
    it('mounts with stable empty collaboration collections', () => {
        const list = createPlannerList();
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [] });

        expect(() =>
            render(
                <StrictMode>
                    <PlannerStoreProvider store={store}>
                        <CollaborationProvider>
                            <CollaborationDialog />
                        </CollaborationProvider>
                    </PlannerStoreProvider>
                </StrictMode>
            )
        ).not.toThrow();
    });
});
