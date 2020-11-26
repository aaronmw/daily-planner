import sample from 'lodash/sample';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { PrimaryAppColumn } from './components/AppColumn';
import { ToggleButton } from './components/atoms/Button';
import FlexBox from './components/atoms/FlexBox';
import GlobalStyle from './components/atoms/GlobalStyles';
import {
    COPY,
    GRID_UNIT,
    ICONS,
    INITIAL_LISTS,
    INITIAL_SELECTED_LIST_ID,
    INITIAL_SELECTED_TASK_ID,
    INITIAL_TASKS,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    SIDEBAR_DEFAULT_WIDTH,
    SIDEBAR_EXTENDED_WIDTH,
    TIMELINE_FROM,
    TIMELINE_TO,
} from './components/atoms/tokens';
import Transition from './components/atoms/Transition';
import ListManager from './components/ListManager';
import Sidebar from './components/Sidebar';
import TaskDetails from './components/TaskDetails';
import TaskList from './components/TaskList';
import Timeline from './components/Timeline';
import ToolBar from './components/ToolBar';
import CompletedTasksDropZone from './components/Trash';
import TrashContents from './components/TrashContents';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import usePersistentState from './hooks/usePersistentState';

function App() {
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
    const [themeName, setThemeName] = usePersistentState('theme-name', 'DARK');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const [isShowingTrashContents, setIsShowingTrashContents] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const unarchivedLists = useMemo(
        () => lists.filter(list => !list.isArchived),
        [lists]
    );
    const currentListIndex = unarchivedLists.findIndex(
        list => list.id === selectedListId
    );
    const incompleteTasks = useMemo(
        () => tasks.filter(task => !task.isComplete),
        [tasks]
    );
    const hasIncompleteTasks = incompleteTasks.length;
    const hasUnarchivedList = lists.filter(list => !list.isArchived).length;
    const isSidebarOpen = hasUnarchivedList && isShowingSidebar;

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

    const onCreateList = useCallback(
        (overrides = {}) => {
            const newListId = Date.now();

            setLists(currentLists =>
                currentLists.concat([
                    {
                        id: newListId,
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

    const onUpdateList = useCallback(
        (listId, updates) => {
            setLists(prevLists =>
                prevLists.map(list => {
                    if (list.id === listId) {
                        return {
                            ...list,
                            ...updates,
                        };
                    }
                    return list;
                })
            );
        },
        [setLists]
    );

    const onSelectList = listId => {
        setSelectedListId(listId);
        setIsShowingSidebar(true);
        setIsShowingTrashContents(false);
    };

    const onUpdateTask = useCallback(
        (taskId, updates) => {
            setTasks(prevTasks =>
                prevTasks.map(task => {
                    if (task.id === taskId) {
                        return {
                            ...task,
                            ...updates,
                        };
                    }
                    return task;
                })
            );
        },
        [setTasks]
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
                        scheduled_minutes: 30,
                        scheduled_time: `${currentHour}:${currentMinute}`,
                        ...overrides,
                    },
                ].concat(currentTasks)
            );

            setSelectedTaskId(newTaskId);

            // This remotely activates the EditInPlace
            setIsCreatingTask(true);

            setIsShowingListManager(false);
        },
        [selectedListId, setIsShowingListManager, setSelectedTaskId, setTasks]
    );

    useEffect(() => {
        if (isCreatingTask) {
            setIsShowingListManager(false);
            const timer = setTimeout(() => setIsCreatingTask(false), 100);
            return () => clearTimeout(timer);
        }
    }, [isCreatingTask, setIsCreatingTask, setIsShowingListManager]);

    const transition = useCallback(
        callback => {
            setIsTransitioning(true);
            setTimeout(() => {
                callback();
                setIsTransitioning(false);
            }, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        },
        [setIsTransitioning]
    );

    const onImmediatelySelectTask = useCallback(
        taskId => {
            if (isShowingListManager) {
                setIsShowingListManager(false);
            }

            setSelectedTaskId(taskId);
        },
        [isShowingListManager, setIsShowingListManager, setSelectedTaskId]
    );

    const onTransitionToTask = useCallback(
        taskId => {
            if (isShowingListManager) {
                setIsShowingListManager(false);
            }

            transition(() => setSelectedTaskId(taskId));
        },
        [
            isShowingListManager,
            setIsShowingListManager,
            setSelectedTaskId,
            transition,
        ]
    );

    const onChangeIsSidebarOpen = setIsShowingSidebar;

    const onChangeIsShowingListManager = useCallback(
        newIsShowingListManager => {
            transition(() => {
                setIsShowingListManager(newIsShowingListManager);

                if (newIsShowingListManager) {
                    setIsShowingSidebar(true);
                }
            });
        },
        [setIsShowingSidebar, setIsShowingListManager, transition]
    );

    const onChangeIsShowingTrashContents = useCallback(() => {
        if (!isShowingSidebar) {
            setIsShowingSidebar(true);
        }
        setIsShowingTrashContents(!isShowingTrashContents);
    }, [
        isShowingSidebar,
        isShowingTrashContents,
        setIsShowingSidebar,
        setIsShowingTrashContents,
    ]);

    const onDeleteTask = useCallback(
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
            tasks,
            selectedTaskId,
        ]
    );

    const onChangeTheme = setThemeName;

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

    const moveTaskToTimeline = useCallback(
        evt => {
            evt.preventDefault();
            onUpdateTask(selectedTaskId, {
                scheduled: true,
            });
        },
        [onUpdateTask, selectedTaskId]
    );

    const moveTaskToTaskList = useCallback(
        evt => {
            evt.preventDefault();
            onUpdateTask(selectedTaskId, {
                scheduled: false,
            });
        },
        [onUpdateTask, selectedTaskId]
    );

    const selectNextList = useCallback(
        evt => {
            evt.preventDefault();
            const nextListIndex = currentListIndex + 1;
            const nextIndex =
                nextListIndex > unarchivedLists.length - 1 ? 0 : nextListIndex;
            setSelectedListId(unarchivedLists[nextIndex].id);
            setIsShowingListManager(true);
        },
        [
            currentListIndex,
            setIsShowingListManager,
            setSelectedListId,
            unarchivedLists,
        ]
    );

    const selectPreviousList = useCallback(
        evt => {
            evt.preventDefault();
            const prevListIndex = currentListIndex - 1;
            const prevIndex =
                prevListIndex < 0 ? unarchivedLists.length - 1 : prevListIndex;
            setSelectedListId(unarchivedLists[prevIndex].id);
            setIsShowingListManager(true);
        },
        [
            currentListIndex,
            setIsShowingListManager,
            setSelectedListId,
            unarchivedLists,
        ]
    );

    const setTaskDuration = useCallback(
        duration => {
            onUpdateTask(selectedTaskId, {
                scheduled_minutes: duration,
            });
        },
        [onUpdateTask, selectedTaskId]
    );

    const toggleTaskListVisibility = useCallback(
        evt => {
            evt.preventDefault();

            if (isShowingSidebar) {
                setIsShowingTrashContents(false);
            }

            onChangeIsSidebarOpen(!isShowingSidebar);
        },
        [isShowingSidebar, onChangeIsSidebarOpen]
    );

    const toggleDarkMode = useCallback(
        evt => {
            evt.preventDefault();
            onChangeTheme(themeName === 'LIGHT' ? 'DARK' : 'LIGHT');
        },
        [onChangeTheme, themeName]
    );

    const toggleIsEditingCurrentTask = useCallback(
        evt => {
            evt.preventDefault();
            setIsCreatingTask(true);
        },
        [setIsCreatingTask]
    );

    const toggleIsShowingListManager = useCallback(
        evt => {
            evt.preventDefault();
            onChangeIsShowingListManager(!isShowingListManager);
        },
        [isShowingListManager, onChangeIsShowingListManager]
    );

    const createNewTask = useCallback(
        evt => {
            evt.preventDefault();
            onCreateTask();
        },
        [onCreateTask]
    );

    const deleteCurrentTask = useCallback(
        evt => {
            evt.preventDefault();
            onDeleteTask(selectedTaskId);
        },
        [onDeleteTask, selectedTaskId]
    );

    const keyMap = useMemo(() => {
        return {
            ...[15, 30, 45, 60, 90, 120].reduce((acc, duration, index) => {
                return {
                    ...acc,
                    [index + 1]: setTaskDuration.bind(null, duration),
                };
            }, {}),
            'cmd + arrowRight': moveTaskToTimeline,
            'cmd + arrowLeft': moveTaskToTaskList,
            'cmd + shift + arrowRight': selectNextList,
            'cmd + shift + arrowLeft': selectPreviousList,
            'cmd + shift + ]': selectNextList,
            'cmd + shift + [': selectPreviousList,
            'b': toggleTaskListVisibility,
            'd': toggleDarkMode,
            'e': toggleIsEditingCurrentTask,
            'l': toggleIsShowingListManager,
            'n': createNewTask,
            't': deleteCurrentTask,
        };
    }, [
        createNewTask,
        deleteCurrentTask,
        moveTaskToTaskList,
        moveTaskToTimeline,
        selectNextList,
        selectPreviousList,
        setTaskDuration,
        toggleTaskListVisibility,
        toggleDarkMode,
        toggleIsEditingCurrentTask,
        toggleIsShowingListManager,
    ]);

    useKeyboardShortcuts(keyMap);

    const appActions = {
        onChangeIsSidebarOpen,
        onChangeTaskPosition,
        onChangeIsShowingListManager,
        onChangeIsShowingTrashContents,
        onChangeTheme,
        onCreateList,
        onCreateTask,
        onDeleteTask,
        onSelectList,
        onImmediatelySelectTask,
        onTransitionToTask,
        onUpdateList,
        onUpdateTask,
    };

    const appData = {
        incompleteTasks,
        isSidebarOpen,
        isCreatingList,
        isCreatingTask,
        isDraggingTask,
        isShowingListManager,
        isShowingTrashContents,
        lists,
        selectedListId,
        selectedTaskId,
        tasks,
        theme: themeName,
    };

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

    return (
        <ThemeProvider theme={{ name: themeName }}>
            <GlobalStyle />
            <CompletedTasksDropZone appActions={appActions} appData={appData} />
            <FlexBox align="stretch">
                <Sidebar appActions={appActions} appData={appData}>
                    {isShowingTrashContents ? (
                        <TrashContents
                            appActions={appActions}
                            appData={appData}
                        />
                    ) : (
                        <TaskList appActions={appActions} appData={appData} />
                    )}
                </Sidebar>

                <PrimaryAppColumn
                    label={
                        isShowingListManager
                            ? COPY.LABEL_FOR_LIST_MANAGER
                            : COPY.LABEL_FOR_TASK_DETAILS
                    }
                    style={{
                        width: isShowingListManager
                            ? columnWidths.listManager
                            : columnWidths.taskDetails,
                    }}
                >
                    <ToolBar>
                        <ToggleButton
                            isActive={isShowingListManager}
                            title={COPY.TIPS.TOGGLE_LIST_MANAGER}
                            onClick={() =>
                                onChangeIsShowingListManager(
                                    !isShowingListManager
                                )
                            }
                        >
                            {isShowingListManager ? (
                                <FlexBox spacing={0.25}>
                                    {ICONS.TASK_DETAILS}
                                    <span>{COPY.LABEL_FOR_TASK_DETAILS}</span>
                                </FlexBox>
                            ) : (
                                <FlexBox spacing={0.25}>
                                    {ICONS.LIST_MANAGER}
                                    <span>{COPY.LABEL_FOR_LIST_MANAGER}</span>
                                </FlexBox>
                            )}
                        </ToggleButton>
                    </ToolBar>
                    <Transition isTransitioning={isTransitioning}>
                        {isShowingListManager ? (
                            <ListManager
                                appActions={appActions}
                                appData={appData}
                            />
                        ) : (
                            <TaskDetails
                                appActions={appActions}
                                appData={appData}
                                style={{
                                    opacity: hasIncompleteTasks ? 1 : 0.25,
                                }}
                            />
                        )}
                    </Transition>
                </PrimaryAppColumn>

                <Timeline
                    appActions={appActions}
                    appData={appData}
                    selectedTaskId={selectedTaskId}
                    from={TIMELINE_FROM}
                    style={{
                        opacity: hasIncompleteTasks ? 1 : 0.25,
                        width: columnWidths.timeline,
                        pointerEvents: hasIncompleteTasks ? 'all' : 'none',
                    }}
                    tasks={incompleteTasks}
                    to={TIMELINE_TO}
                />
            </FlexBox>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
