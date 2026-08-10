import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
} from 'react';
import { createPlannerCommands, type PlannerCommands } from './plannerCommands';
import { usePlannerStoreApi } from '../store/plannerContext';
import { EncryptedDexiePlannerRepository } from '../../platform/persistence/plannerRepository';
import { LocalStoragePreferenceRepository } from '../../platform/persistence/preferences';
import { useCollaborationStoreApi } from '../collaboration/CollaborationContext';
import { createCollaborationPlannerAuthorization } from '../collaboration/plannerAuthorization';

const PlannerCommandsContext = createContext<PlannerCommands | null>(null);

function ConnectedPlannerCommandsProvider({ children }: PropsWithChildren) {
    const store = usePlannerStoreApi();
    const collaborationStore = useCollaborationStoreApi();
    const commands = useMemo(
        () =>
            createPlannerCommands({
                authorization: createCollaborationPlannerAuthorization(
                    store,
                    collaborationStore
                ),
                preferences: new LocalStoragePreferenceRepository(),
                repository: new EncryptedDexiePlannerRepository(),
                store,
            }),
        [collaborationStore, store]
    );

    useEffect(() => {
        void commands.hydrate();
    }, [commands]);

    return (
        <PlannerCommandsContext.Provider value={commands}>
            {children}
        </PlannerCommandsContext.Provider>
    );
}

export function PlannerCommandsProvider({
    children,
    commands,
}: PropsWithChildren<{ commands?: PlannerCommands }>) {
    if (commands) {
        return (
            <PlannerCommandsContext.Provider value={commands}>
                {children}
            </PlannerCommandsContext.Provider>
        );
    }
    return (
        <ConnectedPlannerCommandsProvider>
            {children}
        </ConnectedPlannerCommandsProvider>
    );
}

export const usePlannerCommands = (): PlannerCommands => {
    const commands = useContext(PlannerCommandsContext);
    if (!commands) {
        throw new Error(
            'PlannerCommandsProvider is missing from the app shell.'
        );
    }
    return commands;
};
