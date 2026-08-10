import {
    createContext,
    type PropsWithChildren,
    useContext,
    useState,
} from 'react';
import { useStore } from 'zustand';
import {
    createPlannerStore,
    type PlannerStore,
    type PlannerStoreState,
} from './plannerStore';

const PlannerStoreContext = createContext<PlannerStore | null>(null);

export function PlannerStoreProvider({
    children,
    store: suppliedStore,
}: PropsWithChildren<{ store?: PlannerStore }>) {
    const [defaultStore] = useState(createPlannerStore);
    const store = suppliedStore ?? defaultStore;
    return (
        <PlannerStoreContext.Provider value={store}>
            {children}
        </PlannerStoreContext.Provider>
    );
}

export const usePlannerStoreApi = (): PlannerStore => {
    const store = useContext(PlannerStoreContext);
    if (!store) {
        throw new Error('PlannerStoreProvider is missing from the app shell.');
    }
    return store;
};

export const usePlannerSelector = <Selected,>(
    selector: (state: PlannerStoreState) => Selected
): Selected => useStore(usePlannerStoreApi(), selector);
