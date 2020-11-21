import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import sample from 'lodash/sample';
import Backlog from './components/Backlog';
import CompletedTasksDropZone from './components/CompletedTasksDropZone';
import TaskDetails from './components/TaskDetails';
import Timeline from './components/Timeline';
import FlexBox from './components/atoms/FlexBox';
import GlobalStyle from './components/atoms/GlobalStyles';
import useGlobalKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import usePersistentState from './hooks/usePersistentState';
import {
    COPY,
    DEFAULT_TASK_ICON,
    GRID_UNIT,
    INITIAL_LISTS,
    INITIAL_TASKS,
    TIMELINE_FROM,
    TIMELINE_TO,
} from './components/atoms/tokens';

/*
    activeListId: 123,
    lists: [
        {
            id: 123,
            label: 'Default List',
        }
    ],
    tasks: [
        {
            id: 1,
            list_id: 123,
            icon: '🧺',
            isComplete: false,
            label: 'Take out the laundry',
            notes:
                'This is a note. **This is bold, I think?**\n\nWith two lines!\n\n- And a list\n\n- Of things\n\n- Like this!\n\n> Look, a blockquote! Oooh',
            scheduled: false,
            scheduled_minutes: 30,
            scheduled_time: '14:00',
        },
    ],
*/

function App() {
    const [isBacklogVisible, setIsBacklogVisible] = usePersistentState(
        'is-backlog-visible',
        true
    );
    const [lists, setLists] = usePersistentState('lists', INITIAL_LISTS);
    const [selectedListId, setSelectedListId] = usePersistentState(
        'selected-list-id',
        1
    );
    const [selectedTaskId, setSelectedTaskId] = usePersistentState(
        'selected-task-id',
        null
    );
    const [tasks, setTasks] = usePersistentState('tasks', INITIAL_TASKS);
    const [themeName, setThemeName] = usePersistentState('theme-name', 'DARK');
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const isBacklogVisibleOrDraggingTask = isBacklogVisible || isDraggingTask;
    const selectedList = useMemo(
        () => lists.find(list => list.id === selectedListId),
        [lists, selectedListId]
    );
    const selectedTask = useMemo(
        () => tasks.find(task => task.id === selectedTaskId),
        [tasks, selectedTaskId]
    );
    const incompleteTasks = useMemo(
        () => tasks.filter(task => !task.isComplete),
        [tasks]
    );
    const hasIncompleteTasks = incompleteTasks.length;

    const handleDragOver = () => setIsDraggingTask(true);

    const handleDragEnd = () => setIsDraggingTask(false);

    useEffect(() => {
        handleDragEnd();
    }, [tasks]);

    const getTaskById = taskId => tasks.find(task => task.id === taskId);

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
                        icon: DEFAULT_TASK_ICON,
                        id: newTaskId,
                        list_id: selectedListId,
                        isComplete: false,
                        label: `${sample(COPY.motivational_descriptors)} ${
                            COPY.new_task_label
                        }`,
                        notes: COPY.new_task_notes,
                        scheduled: false,
                        scheduled_minutes: 30,
                        scheduled_time: `${currentHour}:${currentMinute}`,
                        ...overrides,
                    },
                ])
            );

            setSelectedTaskId(newTaskId);

            setIsCreatingTask(true);

            setTimeout(() => setIsCreatingTask(false), 1000);
        },
        [selectedListId, setSelectedTaskId, setTasks]
    );

    const onSelectTask = setSelectedTaskId;

    const onChangeBacklogVisibility = setIsBacklogVisible;

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
        [isBacklogVisible, selectedTaskId, themeName]
    );

    useGlobalKeyboardShortcuts(keyMap);

    const appActions = {
        getTaskById,
        onChangeBacklogVisibility,
        onChangeTaskPosition,
        onChangeTheme,
        onCreateTask,
        onSelectTask,
        onUpdateTask,
    };

    const appData = {
        isBacklogVisibleOrDraggingTask,
        isDraggingTask,
        selectedTaskId,
        tasks,
        theme: themeName,
    };

    console.log({
        isBacklogVisible,
        isDraggingTask,
        isBacklogVisibleOrDraggingTask,
    });

    const columnWidths = isBacklogVisibleOrDraggingTask
        ? {
              backlog: '30vw',
              taskDetails: '40vw',
              timeline: '30vw',
          }
        : {
              backlog: `calc(${GRID_UNIT} * 2)`,
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
                <TaskDetails
                    appActions={appActions}
                    appData={appData}
                    task={selectedTask}
                    isCreatingTask={isCreatingTask}
                    style={{
                        width: columnWidths.taskDetails,
                        opacity: hasIncompleteTasks ? 1 : 0.25,
                    }}
                />
                <Backlog
                    appActions={appActions}
                    appData={appData}
                    selectedTaskId={selectedTaskId}
                    style={{
                        width: columnWidths.backlog,
                    }}
                    tasks={incompleteTasks}
                />
            </FlexBox>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
