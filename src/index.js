import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import sample from 'lodash/sample';
import { PrimaryAppColumn } from './components/AppColumn';
import { ToggleButton } from './components/atoms/Button';
import Backlog from './components/Backlog';
import CompletedTasksDropZone from './components/CompletedTasksDropZone';
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
    const [isBacklogVisible, setIsBacklogVisible] = usePersistentState(
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
    const isBacklogVisibleOrDraggingTask = isBacklogVisible || isDraggingTask;
    const incompleteTasks = useMemo(
        () => tasks.filter(task => !task.isComplete),
        [tasks]
    );
    const hasIncompleteTasks = incompleteTasks.length;

    useLayoutEffect(() => {
        setIsTransitioning(true);

        const stopTransitionTimer = setTimeout(
            () => setIsTransitioning(false),
            ROUTE_TRANSITION_ANIMATION_DURATION / 2
        );

        return () => clearTimeout(stopTransitionTimer);
    }, [selectedTaskId, isShowingListManager]);

    const handleDragOver = () => setIsDraggingTask(true);

    const handleDragEnd = () => setIsDraggingTask(false);

    useEffect(() => {
        handleDragEnd();
    }, [tasks]);

    const onCreateList = useCallback(
        (overrides = {}) => {
            const newListId = Date.now();

            setLists(currentLists =>
                currentLists.concat([
                    {
                        id: newListId,
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

    const onSelectList = setSelectedListId;

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
                currentTasks.concat([
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
                ])
            );

            setSelectedTaskId(newTaskId);

            // This remotely activates the EditInPlace
            setIsCreatingTask(true);

            setTimeout(() => setIsCreatingTask(false), 1000);
        },
        [selectedListId, setSelectedTaskId, setTasks]
    );

    const transition = callback => {
        setIsTransitioning(true);
        setTimeout(callback, ROUTE_TRANSITION_ANIMATION_DURATION / 2);
    };

    const onImmediatelySelectTask = setSelectedTaskId;

    const onTransitionToTask = taskId => {
        if (isShowingListManager) {
            setSelectedTaskId(taskId);
            return;
        }

        transition(() => setSelectedTaskId(taskId));
    };

    const onChangeBacklogVisibility = setIsBacklogVisible;

    const onChangeIsShowingListManager = newIsShowingListManager => {
        transition(() => setIsShowingListManager(newIsShowingListManager));
    };

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
            'cmd + b': evt => {
                evt.preventDefault();
                onChangeBacklogVisibility(!isBacklogVisible);
            },
            'cmd + d': evt => {
                evt.preventDefault();
                onChangeTheme(themeName === 'LIGHT' ? 'DARK' : 'LIGHT');
            },
        }),
        [
            isBacklogVisible,
            onChangeBacklogVisibility,
            onChangeTheme,
            onUpdateTask,
            selectedTaskId,
            themeName,
        ]
    );

    useGlobalKeyboardShortcuts(keyMap);

    const appActions = {
        onChangeBacklogVisibility,
        onChangeTaskPosition,
        onChangeIsShowingListManager,
        onChangeTheme,
        onCreateList,
        onCreateTask,
        onSelectList,
        onImmediatelySelectTask,
        onTransitionToTask,
        onUpdateList,
        onUpdateTask,
    };

    const appData = {
        incompleteTasks,
        isBacklogVisibleOrDraggingTask,
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

    const columnWidths = isBacklogVisibleOrDraggingTask
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
            <FlexBox
                align="stretch"
                direction="row-reverse"
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
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
                    isTransitioning={isTransitioning}
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
