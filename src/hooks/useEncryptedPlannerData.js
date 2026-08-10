import { useCallback, useEffect, useRef, useState } from 'react';
import {
    migratePlannerDataToEncryptedStore,
    saveEncryptedPlannerData,
} from '../platform/encryptedPlannerStore';

export default function useEncryptedPlannerData({
    defaultLists,
    defaultTasks,
    normalizeLists,
    normalizeTasks,
    onMigrateSelection,
    selectedListId,
    selectedTaskId,
}) {
    const [data, setData] = useState({
        lists: defaultLists,
        tasks: defaultTasks,
    });
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const initialSelectionRef = useRef({ selectedListId, selectedTaskId });
    const saveSequenceRef = useRef(Promise.resolve());

    useEffect(() => {
        if (typeof indexedDB === 'undefined' || !globalThis.crypto?.subtle) {
            setIsLoaded(true);
            return undefined;
        }

        let cancelled = false;
        void migratePlannerDataToEncryptedStore({
            defaultLists,
            defaultTasks,
            normalizeLists,
            normalizeTasks,
            selectedListId: initialSelectionRef.current.selectedListId,
            selectedTaskId: initialSelectionRef.current.selectedTaskId,
        })
            .then(loaded => {
                if (!cancelled) {
                    setData({ lists: loaded.lists, tasks: loaded.tasks });
                    onMigrateSelection?.({
                        selectedListId: loaded.selectedListId,
                        selectedTaskId: loaded.selectedTaskId,
                    });
                    setIsLoaded(true);
                }
            })
            .catch(caught => {
                if (!cancelled) {
                    setError(caught);
                    setIsLoaded(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [
        defaultLists,
        defaultTasks,
        normalizeLists,
        normalizeTasks,
        onMigrateSelection,
    ]);

    useEffect(() => {
        if (
            !isLoaded ||
            error ||
            typeof indexedDB === 'undefined' ||
            !globalThis.crypto?.subtle
        ) {
            return;
        }
        saveSequenceRef.current = saveSequenceRef.current
            .catch(() => {})
            .then(() => saveEncryptedPlannerData(data))
            .catch(setError);
    }, [data, error, isLoaded]);

    const setLists = useCallback(update => {
        setData(current => ({
            ...current,
            lists:
                typeof update === 'function' ? update(current.lists) : update,
        }));
    }, []);

    const setTasks = useCallback(update => {
        setData(current => ({
            ...current,
            tasks:
                typeof update === 'function' ? update(current.tasks) : update,
        }));
    }, []);

    return {
        error,
        isLoaded,
        lists: data.lists,
        setLists,
        setTasks,
        tasks: data.tasks,
    };
}
