import sample from 'lodash/sample';
import sortBy from 'lodash/sortBy';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ACCENT_SWATCHES,
    buildThemeStyle,
    COPY,
    DEFAULT_RELATIVE_CARD_SIZING_ENABLED,
    DEFAULT_THEME_MODE,
    GRID_UNIT,
    HOURS_PER_SCREEN,
    ICONS,
    getNextThemeMode,
    INITIAL_LISTS,
    INITIAL_SELECTED_LIST_ID,
    INITIAL_SELECTED_TASK_ID,
    INITIAL_TASKS,
    INTERACTION_ANIMATION_DURATION,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_EXTENDED_WIDTH,
    THEME_MODES,
    TIMELINE_HOURS_PER_SCREEN_MAX,
    TIMELINE_HOURS_PER_SCREEN_MIN,
    TIMELINE_HOURS_PER_SCREEN_STEP,
} from '../components/atoms/tokens';
import { getMinuteHeightCss } from '../utils/plannerGeometry';
import { buildPlannerIndexes } from '../utils/plannerIndexes';
import useKeyboardShortcut from './useKeyboardShortcut';
import usePersistentState from './usePersistentState';
import useSystemThemeName from './useSystemThemeName';

const keyboardShortcutNamespace = 'global';

const withPreventDefault = func => e => {
    e.preventDefault();
    func(e);
};

const getRelativeIndexOffset = (relativeIndex, itemCount) =>
    relativeIndex >= 0
        ? relativeIndex
        : Math.abs(relativeIndex) * (itemCount - 1);

const normalizeThemeMode = themeMode =>
    THEME_MODES.includes(themeMode) ? themeMode : DEFAULT_THEME_MODE;

const normalizeTimelineHoursPerScreen = hoursPerScreen => {
    const numericHoursPerScreen = Number(hoursPerScreen);

    if (!Number.isFinite(numericHoursPerScreen)) {
        return HOURS_PER_SCREEN;
    }

    const steppedHoursPerScreen =
        Math.round(numericHoursPerScreen / TIMELINE_HOURS_PER_SCREEN_STEP) *
        TIMELINE_HOURS_PER_SCREEN_STEP;

    return Math.min(
        TIMELINE_HOURS_PER_SCREEN_MAX,
        Math.max(TIMELINE_HOURS_PER_SCREEN_MIN, steppedHoursPerScreen)
    );
};

export default function usePlannerApp() {
    const [isShowingSidebar, setIsShowingSidebar] = usePersistentState(
        'is-showing-sidebar',
        true
    );
    const [lists, setLists] = usePersistentState('lists', INITIAL_LISTS);
    const [selectedListId, setSelectedListId] = usePersistentState(
        'selected-list-id',
        INITIAL_SELECTED_LIST_ID
    );
    const [isShowingListManager, setIsShowingListManager] = usePersistentState(
        'is-showing-list-manager',
        true
    );
    const [tasks, setTasks] = usePersistentState('tasks', INITIAL_TASKS);
    const [selectedTaskId, setSelectedTaskId] = usePersistentState(
        'selected-task-id',
        INITIAL_SELECTED_TASK_ID
    );
    const [themeMode, setThemeMode] = usePersistentState(
        'theme-mode',
        DEFAULT_THEME_MODE
    );
    const [timelineHoursPerScreen, setTimelineHoursPerScreen] =
        usePersistentState('timeline-hours-per-screen', HOURS_PER_SCREEN);
    const [relativeCardSizingEnabled, setRelativeCardSizingEnabled] =
        usePersistentState(
            'relative-card-sizing-enabled',
            DEFAULT_RELATIVE_CARD_SIZING_ENABLED
        );
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isCardSizingTransitioning, setIsCardSizingTransitioning] =
        useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const [isShowingTrashContents, setIsShowingTrashContents] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const cardSizingTransitionTimerRef = useRef(null);

    const unarchivedLists = useMemo(
        () =>
            sortBy(
                lists.filter(list => !list.isArchived),
                [list => list.label]
            ),
        [lists]
    );
    const unarchivedListIndexById = useMemo(
        () => new Map(unarchivedLists.map((list, index) => [list.id, index])),
        [unarchivedLists]
    );

    const systemThemeName = useSystemThemeName();
    const normalizedThemeMode = normalizeThemeMode(themeMode);
    const themeName =
        normalizedThemeMode === 'SYSTEM'
            ? systemThemeName
            : normalizedThemeMode;

    const plannerIndexes = useMemo(
        () =>
            buildPlannerIndexes(lists, tasks, list =>
                buildThemeStyle(themeName, list)
            ),
        [lists, tasks, themeName]
    );
    const { listById } = plannerIndexes;

    const currentListIndex = unarchivedListIndexById.get(selectedListId) ?? -1;
    const selectedList = listById.get(selectedListId);
    const normalizedTimelineHoursPerScreen = normalizeTimelineHoursPerScreen(
        timelineHoursPerScreen
    );
    const effectiveRelativeCardSizingEnabled = relativeCardSizingEnabled;
    const appThemeStyle = useMemo(
        () => ({
            ...(plannerIndexes.themeByListId.get(selectedListId) ||
                buildThemeStyle(themeName, selectedList)),
            '--planner-card-minute-height': getMinuteHeightCss(
                normalizedTimelineHoursPerScreen
            ),
            '--planner-timeline-minute-height': getMinuteHeightCss(
                normalizedTimelineHoursPerScreen
            ),
        }),
        [
            normalizedTimelineHoursPerScreen,
            plannerIndexes.themeByListId,
            selectedList,
            selectedListId,
            themeName,
        ]
    );
    const isSidebarOpen = unarchivedLists.length > 0 && isShowingSidebar;

    useEffect(() => {
        const handleDragOver = () => setIsDraggingTask(true);
        const handleDragEnd = () => setIsDraggingTask(false);

        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('dragend', handleDragEnd);
        document.addEventListener('drop', handleDragEnd);

        return () => {
            document.removeEventListener('dragover', handleDragOver);
            document.removeEventListener('dragend', handleDragEnd);
            document.removeEventListener('drop', handleDragEnd);
        };
    }, []);

    useEffect(
        () => () => {
            if (cardSizingTransitionTimerRef.current !== null) {
                clearTimeout(cardSizingTransitionTimerRef.current);
            }
        },
        []
    );

    const onUpdateList = useCallback(
        (listId, updates) => {
            setLists(prevLists =>
                prevLists.map(list =>
                    list.id === listId
                        ? {
                              ...list,
                              ...updates,
                          }
                        : list
                )
            );
        },
        [setLists]
    );

    const onUpdateTask = useCallback(
        (taskId, updates) => {
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? {
                              ...task,
                              ...updates,
                          }
                        : task
                )
            );
        },
        [setTasks]
    );

    const onCreateList = useCallback(
        (overrides = {}) => {
            const newListId = Date.now();
            const randomAccentKey = sample(ACCENT_SWATCHES).key;

            setLists(currentLists =>
                currentLists.concat([
                    {
                        id: newListId,
                        accent_key: randomAccentKey,
                        isArchived: false,
                        label: `${sample(COPY.MOTIVATIONAL_DESCRIPTORS)} ${
                            COPY.NEW_LIST_LABEL
                        }`,
                        ...overrides,
                    },
                ])
            );

            setSelectedListId(newListId);
            setIsCreatingList(true);
            setTimeout(() => setIsCreatingList(false), 1000);
        },
        [setSelectedListId, setLists]
    );

    const onSelectList = useCallback(
        listId => {
            setSelectedListId(listId);
            const firstTaskInList =
                plannerIndexes.tasksByListId.get(listId)?.[0];

            if (firstTaskInList) {
                setSelectedTaskId(firstTaskInList.id);
            }

            setIsShowingSidebar(true);
            setIsShowingTrashContents(false);
            setIsShowingListManager(true);
            document.querySelector(`[data-list-id="${listId}"]`)?.focus();
        },
        [
            plannerIndexes.tasksByListId,
            setSelectedListId,
            setSelectedTaskId,
            setIsShowingSidebar,
            setIsShowingTrashContents,
            setIsShowingListManager,
        ]
    );

    const onCreateTask = useCallback(
        (overrides = {}) => {
            const newTaskId = Date.now();
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            setTasks(currentTasks =>
                [
                    {
                        icon: ICONS.TASK_DEFAULT,
                        id: newTaskId,
                        list_id: selectedListId,
                        isComplete: false,
                        label: `${sample(COPY.MOTIVATIONAL_DESCRIPTORS)} ${
                            COPY.NEW_TASK_LABEL
                        }`,
                        notes: COPY.NEW_TASK_NOTES,
                        scheduled: false,
                        duration_minutes: 30,
                        scheduled_time: `${currentHour}:${currentMinute}`,
                        ...overrides,
                    },
                ].concat(currentTasks)
            );

            setSelectedTaskId(newTaskId);
            setIsCreatingTask(true);
            setIsShowingListManager(false);
        },
        [selectedListId, setIsShowingListManager, setSelectedTaskId, setTasks]
    );

    useEffect(() => {
        if (!isCreatingTask) {
            return undefined;
        }

        setIsShowingListManager(false);
        const timer = setTimeout(() => setIsCreatingTask(false), 100);
        return () => clearTimeout(timer);
    }, [isCreatingTask, setIsCreatingTask, setIsShowingListManager]);

    const onSelectTask = useCallback(
        taskId => {
            const task = plannerIndexes.taskById.get(taskId);

            if (!task) {
                return;
            }

            setSelectedListId(task.list_id);

            if (isShowingListManager) {
                setIsShowingListManager(false);
            }

            setSelectedTaskId(taskId);
            document.querySelector(`[data-task-id="${taskId}"]`)?.focus();
        },
        [
            isShowingListManager,
            plannerIndexes.taskById,
            setIsShowingListManager,
            setSelectedTaskId,
            setSelectedListId,
        ]
    );

    const selectTaskByRelativeIndex = useCallback(
        relativeIndex => {
            const tasksInList =
                plannerIndexes.unscheduledTasksByListId.get(selectedListId) ||
                [];
            const indexOfCurrentTask = tasksInList.findIndex(
                task => task.id === selectedTaskId
            );
            const targetIndex =
                (indexOfCurrentTask +
                    getRelativeIndexOffset(relativeIndex, tasksInList.length)) %
                tasksInList.length;
            const taskAtRelativeIndex = tasksInList[targetIndex];

            if (taskAtRelativeIndex) {
                onSelectTask(taskAtRelativeIndex.id);
            }
        },
        [
            onSelectTask,
            plannerIndexes.unscheduledTasksByListId,
            selectedListId,
            selectedTaskId,
        ]
    );

    const selectListByRelativeIndex = useCallback(
        relativeIndex => {
            const targetIndex =
                (currentListIndex +
                    getRelativeIndexOffset(
                        relativeIndex,
                        unarchivedLists.length
                    )) %
                unarchivedLists.length;
            const listAtRelativeIndex = unarchivedLists[targetIndex];

            if (listAtRelativeIndex) {
                onSelectList(listAtRelativeIndex.id);
            }
        },
        [currentListIndex, onSelectList, unarchivedLists]
    );

    const selectByRelativeIndex = useCallback(
        (relativeIndex, isVertical = false) => {
            const elementWithFocus = document.activeElement;
            const isListCard = !!elementWithFocus.dataset.listId;
            const selectionFunc = isListCard
                ? selectListByRelativeIndex
                : selectTaskByRelativeIndex;
            const offset =
                isVertical && isListCard
                    ? relativeIndex >= 0
                        ? 3
                        : -3
                    : relativeIndex;

            selectionFunc(offset);
        },
        [selectListByRelativeIndex, selectTaskByRelativeIndex]
    );

    const onImmediatelySelectTask = useCallback(
        taskId => {
            onSelectTask(taskId);
        },
        [onSelectTask]
    );

    const onTransitionToTask = useCallback(
        taskId => {
            setIsTransitioning(true);
            setTimeout(() => {
                onSelectTask(taskId);
                setIsTransitioning(false);
            }, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        },
        [onSelectTask]
    );

    const onChangeIsSidebarOpen = setIsShowingSidebar;

    const onChangeIsShowingListManager = useCallback(
        newIsShowingListManager => {
            setIsTransitioning(true);
            setTimeout(() => {
                setIsShowingListManager(newIsShowingListManager);

                if (newIsShowingListManager) {
                    setIsShowingSidebar(true);
                }

                setIsShowingTrashContents(false);
                setIsTransitioning(false);
            }, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        },
        [
            setIsShowingSidebar,
            setIsShowingListManager,
            setIsShowingTrashContents,
        ]
    );

    const onChangeIsShowingTrashContents = useCallback(() => {
        if (!isShowingSidebar) {
            setIsShowingSidebar(true);
        }
        if (!isShowingListManager) {
            setIsShowingListManager(true);
        }
        setIsShowingTrashContents(!isShowingTrashContents);
    }, [
        isShowingListManager,
        isShowingSidebar,
        isShowingTrashContents,
        setIsShowingListManager,
        setIsShowingSidebar,
        setIsShowingTrashContents,
    ]);

    const onChangeThemeMode = useCallback(
        nextThemeMode => {
            setThemeMode(normalizeThemeMode(nextThemeMode));
        },
        [setThemeMode]
    );

    const onChangeTimelineHoursPerScreen = useCallback(
        nextHoursPerScreen => {
            setTimelineHoursPerScreen(
                normalizeTimelineHoursPerScreen(nextHoursPerScreen)
            );
        },
        [setTimelineHoursPerScreen]
    );

    const onChangeRelativeCardSizingEnabled = useCallback(
        nextRelativeCardSizingEnabled => {
            if (cardSizingTransitionTimerRef.current !== null) {
                clearTimeout(cardSizingTransitionTimerRef.current);
            }

            setIsCardSizingTransitioning(true);
            setRelativeCardSizingEnabled(
                Boolean(nextRelativeCardSizingEnabled)
            );
            cardSizingTransitionTimerRef.current = setTimeout(() => {
                setIsCardSizingTransitioning(false);
                cardSizingTransitionTimerRef.current = null;
            }, INTERACTION_ANIMATION_DURATION);
        },
        [setRelativeCardSizingEnabled]
    );

    const onChangeTaskPosition = useCallback(
        (taskId, newIndex) => {
            setTasks(prevTasks => {
                const tasksMinusTarget = prevTasks.filter(
                    task => task.id !== taskId
                );
                const task = prevTasks.find(task => task.id === taskId);

                return [].concat(
                    tasksMinusTarget.slice(0, newIndex),
                    [task],
                    tasksMinusTarget.slice(newIndex)
                );
            });
        },
        [setTasks]
    );

    const deleteTask = useCallback(
        taskId => {
            if (selectedTaskId === taskId) {
                const firstUnarchivedTask = tasks.find(
                    task =>
                        task.id !== taskId &&
                        task.list_id === selectedListId &&
                        !task.isComplete
                );

                if (firstUnarchivedTask) {
                    onImmediatelySelectTask(firstUnarchivedTask.id);
                } else {
                    onChangeIsShowingListManager(true);
                }
            }

            onUpdateTask(taskId, {
                isComplete: true,
            });
        },
        [
            onChangeIsShowingListManager,
            onImmediatelySelectTask,
            onUpdateTask,
            selectedListId,
            selectedTaskId,
            tasks,
        ]
    );

    const setTaskDuration = useCallback(
        duration => {
            onUpdateTask(selectedTaskId, {
                duration_minutes: duration,
            });
        },
        [onUpdateTask, selectedTaskId]
    );

    const moveTaskToTimeline = useCallback(() => {
        onUpdateTask(selectedTaskId, {
            scheduled: true,
        });
    }, [onUpdateTask, selectedTaskId]);

    const moveTaskToTaskList = useCallback(() => {
        onUpdateTask(selectedTaskId, {
            scheduled: false,
        });
    }, [onUpdateTask, selectedTaskId]);

    const toggleTaskListVisibility = useCallback(() => {
        if (isShowingSidebar) {
            setIsShowingTrashContents(false);
        }

        onChangeIsSidebarOpen(!isShowingSidebar);
    }, [isShowingSidebar, onChangeIsSidebarOpen]);

    const cycleThemeMode = useCallback(() => {
        setThemeMode(getNextThemeMode(normalizedThemeMode));
    }, [normalizedThemeMode, setThemeMode]);

    const toggleIsEditingCurrentTask = useCallback(() => {
        setIsCreatingTask(true);
    }, []);

    const toggleIsShowingListManager = useCallback(() => {
        onChangeIsShowingListManager(!isShowingListManager);
    }, [isShowingListManager, onChangeIsShowingListManager]);

    const createNewTask = useCallback(() => {
        onCreateTask();
    }, [onCreateTask]);

    const deleteCurrentTask = useCallback(() => {
        deleteTask(selectedTaskId);
    }, [deleteTask, selectedTaskId]);

    const goBack = useCallback(() => {
        if (isShowingTrashContents) {
            setIsShowingTrashContents(false);
            setIsShowingListManager(false);
            return;
        }

        setIsShowingListManager(current => !current);
    }, [
        isShowingTrashContents,
        setIsShowingListManager,
        setIsShowingTrashContents,
    ]);

    useKeyboardShortcut(keyboardShortcutNamespace, [1, 2, 3, 4, 5, 6], evt => {
        const durations = [15, 30, 45, 60, 90, 120];
        const desiredDurationIndex = Number(evt.key) - 1;
        setTaskDuration(durations[desiredDurationIndex]);
    });
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'cmd + arrowRight',
        withPreventDefault(moveTaskToTimeline)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'cmd + arrowLeft',
        withPreventDefault(moveTaskToTaskList)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['arrowRight', 'cmd + shift + arrowRight', 'cmd + shift + ]'],
        withPreventDefault(() => selectListByRelativeIndex(1))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['arrowLeft', 'cmd + shift + arrowLeft', 'cmd + shift + ['],
        withPreventDefault(() => selectListByRelativeIndex(-1))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'b',
        withPreventDefault(toggleTaskListVisibility)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'd',
        withPreventDefault(cycleThemeMode)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'e',
        withPreventDefault(toggleIsEditingCurrentTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'escape',
        withPreventDefault(goBack)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'l',
        withPreventDefault(toggleIsShowingListManager)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'n',
        withPreventDefault(createNewTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        't',
        withPreventDefault(deleteCurrentTask)
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'arrowUp',
        withPreventDefault(() => selectByRelativeIndex(-1, true))
    );
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        'arrowDown',
        withPreventDefault(() => selectByRelativeIndex(1, true))
    );

    const appActions = useMemo(
        () => ({
            deleteTask,
            onChangeIsShowingListManager,
            onChangeIsShowingTrashContents,
            onChangeIsSidebarOpen,
            onChangeRelativeCardSizingEnabled,
            onChangeTaskPosition,
            onChangeThemeMode,
            onChangeTimelineHoursPerScreen,
            onCreateList,
            onCreateTask,
            onImmediatelySelectTask,
            onSelectList,
            onTransitionToTask,
            onUpdateList,
            onUpdateTask,
        }),
        [
            deleteTask,
            onChangeIsShowingListManager,
            onChangeIsShowingTrashContents,
            onChangeIsSidebarOpen,
            onChangeRelativeCardSizingEnabled,
            onChangeTaskPosition,
            onChangeThemeMode,
            onChangeTimelineHoursPerScreen,
            onCreateList,
            onCreateTask,
            onImmediatelySelectTask,
            onSelectList,
            onTransitionToTask,
            onUpdateList,
            onUpdateTask,
        ]
    );

    const appData = useMemo(
        () => ({
            effectiveRelativeCardSizingEnabled,
            isCardSizingTransitioning,
            isCreatingList,
            isCreatingTask,
            isDraggingTask,
            isShowingListManager,
            isShowingTrashContents,
            isSidebarOpen,
            lists,
            plannerIndexes,
            relativeCardSizingEnabled,
            selectedListId,
            selectedTaskId,
            tasks,
            theme: themeName,
            themeMode: normalizedThemeMode,
            timelineHoursPerScreen: normalizedTimelineHoursPerScreen,
        }),
        [
            effectiveRelativeCardSizingEnabled,
            isCardSizingTransitioning,
            isCreatingList,
            isCreatingTask,
            isDraggingTask,
            isShowingListManager,
            isShowingTrashContents,
            isSidebarOpen,
            lists,
            normalizedThemeMode,
            normalizedTimelineHoursPerScreen,
            plannerIndexes,
            relativeCardSizingEnabled,
            selectedListId,
            selectedTaskId,
            tasks,
            themeName,
        ]
    );

    const columnWidths = isSidebarOpen
        ? {
              sidebar: SIDEBAR_DEFAULT_WIDTH,
              listManager: '40vw',
              taskDetails: '40vw',
              timeline: SIDEBAR_DEFAULT_WIDTH,
          }
        : {
              sidebar: `calc(${GRID_UNIT} * 2)`,
              listManager: `calc((100vw - ${SIDEBAR_EXTENDED_WIDTH}) - ${GRID_UNIT} * 2)`,
              taskDetails: `calc((100vw - ${SIDEBAR_EXTENDED_WIDTH}) - ${GRID_UNIT} * 2)`,
              timeline: SIDEBAR_EXTENDED_WIDTH,
          };

    return {
        appActions,
        appData,
        appThemeStyle,
        columnWidths,
        isTransitioning,
        onChangeIsShowingListManager,
        unarchivedLists,
    };
}
