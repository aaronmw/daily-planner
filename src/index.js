import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import sample from 'lodash/sample';
import { PrimaryAppColumn } from './components/AppColumn';
import { ToggleButton } from './components/atoms/Button';
import Transition from './components/atoms/Transition';
import Backlog from './components/Backlog';
import CompletedTasksDropZone from './components/Trash';
import ListManager from './components/ListManager';
import TaskDetails from './components/TaskDetails';
import Timeline from './components/Timeline';
import FlexBox from './components/atoms/FlexBox';
import GlobalStyle from './components/atoms/GlobalStyles';
import ToolBar from './components/ToolBar';
import useGlobalKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import usePersistentState from './hooks/usePersistentState';
import {
    COPY,
    GRID_UNIT,
    ICONS,
    INITIAL_LISTS,
    INITIAL_SELECTED_LIST_ID,
    INITIAL_SELECTED_TASK_ID,
    INITIAL_TASKS,
    ROUTE_TRANSITION_ANIMATION_DURATION,
    TIMELINE_FROM,
    TIMELINE_TO,
} from './components/atoms/tokens';

function App() {
    const [isShowingBacklog, setIsShowingBacklog] = usePersistentState(
        'is-backlog-visible',
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
    const isBacklogVisible =
        hasUnarchivedList && (isShowingBacklog || isDraggingTask);

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

            // This remotely activates the EditInPlace
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
        setIsShowingBacklog(true);
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

    const onChangeIsShowingBacklog = setIsShowingBacklog;

    const onChangeIsShowingListManager = useCallback(
        newIsShowingListManager => {
            transition(() => {
                setIsShowingListManager(newIsShowingListManager);

                if (newIsShowingListManager) {
                    setIsShowingBacklog(true);
                }
            });
        },
        [setIsShowingBacklog, setIsShowingListManager, transition]
    );

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

    const keyMap = useMemo(
        () => ({
            ...[15, 30, 45, 60, 90, 120].reduce((acc, duration, index) => {
                return {
                    ...acc,
                    [index + 1]: () => {
                        onUpdateTask(selectedTaskId, {
                            scheduled_minutes: duration,
                        });
                    },
                };
            }, {}),
            'cmd + arrowRight': evt => {
                evt.preventDefault();
                onUpdateTask(selectedTaskId, {
                    scheduled: true,
                });
            },
            'cmd + arrowLeft': evt => {
                evt.preventDefault();
                onUpdateTask(selectedTaskId, {
                    scheduled: false,
                });
            },
            'cmd + shift + arrowRight': evt => {
                evt.preventDefault();
                const nextListIndex = currentListIndex + 1;
                const nextIndex =
                    nextListIndex > unarchivedLists.length - 1
                        ? 0
                        : nextListIndex;
                setSelectedListId(unarchivedLists[nextIndex].id);
            },
            'cmd + shift + arrowLeft': evt => {
                evt.preventDefault();
                const prevListIndex = currentListIndex - 1;
                const prevIndex =
                    prevListIndex < 0
                        ? unarchivedLists.length - 1
                        : prevListIndex;
                setSelectedListId(unarchivedLists[prevIndex].id);
            },
            'b': evt => {
                evt.preventDefault();
                onChangeIsShowingBacklog(!isShowingBacklog);
            },
            'd': evt => {
                evt.preventDefault();
                onChangeTheme(themeName === 'LIGHT' ? 'DARK' : 'LIGHT');
            },
            'e': evt => {
                evt.preventDefault();
                setIsCreatingTask(true);
            },
            'l': evt => {
                evt.preventDefault();
                onChangeIsShowingListManager(!isShowingListManager);
            },
            'n': evt => {
                evt.preventDefault();
                onCreateTask();
            },
            't': evt => {
                evt.preventDefault();
                onDeleteTask(selectedTaskId);
            },
        }),
        [
            currentListIndex,
            isShowingBacklog,
            isShowingListManager,
            onChangeIsShowingBacklog,
            onChangeIsShowingListManager,
            onChangeTheme,
            onCreateTask,
            onDeleteTask,
            onUpdateTask,
            selectedTaskId,
            setSelectedListId,
            themeName,
            unarchivedLists,
        ]
    );

    useGlobalKeyboardShortcuts(keyMap);

    const appActions = {
        onChangeIsShowingBacklog,
        onChangeTaskPosition,
        onChangeIsShowingListManager,
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
        isBacklogVisible,
        isCreatingList,
        isCreatingTask,
        isDraggingTask,
        isShowingListManager,
        lists,
        selectedListId,
        selectedTaskId,
        tasks,
        theme: themeName,
    };

    const columnWidths = isBacklogVisible
        ? {
              backlog: '30vw',
              listManager: '40vw',
              taskDetails: '40vw',
              timeline: '30vw',
          }
        : {
              backlog: `calc(${GRID_UNIT} * 2)`,
              listManager: `calc(60vw - ${GRID_UNIT} * 2)`,
              taskDetails: `calc(60vw - ${GRID_UNIT} * 2)`,
              timeline: '40vw',
          };

    return (
        <ThemeProvider theme={{ name: themeName }}>
            <GlobalStyle />
            <CompletedTasksDropZone appActions={appActions} appData={appData} />
            <FlexBox align="stretch" direction="row-reverse">
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
                <PrimaryAppColumn
                    label={
                        isShowingListManager
                            ? COPY.NAME_OF_LIST_MANAGER
                            : COPY.NAME_OF_TASK_DETAILS
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
                            {isShowingListManager
                                ? ICONS.TASK_DETAILS
                                : ICONS.LIST_MANAGER}
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
                <Backlog
                    appActions={appActions}
                    appData={appData}
                    style={{
                        width: columnWidths.backlog,
                    }}
                />
            </FlexBox>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
