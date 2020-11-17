import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import sample from 'lodash/sample';
import values from 'lodash/values';
import Backlog from './components/Backlog';
import CompletedTasksDropZone from './components/CompletedTasksDropZone';
import TaskDetails from './components/TaskDetails';
import Timeline from './components/Timeline';
import FlexBox from './components/atoms/FlexBox';
import GlobalStyle from './components/atoms/GlobalStyles';
import usePersistentState from './hooks/usePersistentState';
import {
    COPY,
    DEFAULT_TASK_ICON,
    INITIAL_TASKS,
    TIMELINE_FROM,
    TIMELINE_TO,
} from './components/atoms/tokens';

/*
    tasks: {
        1: {
            id: 1,
            icon: '🧺',
            isComplete: false,
            label: 'Take out the laundry',
            notes:
                'This is a note. **This is bold, I think?**\n\nWith two lines!\n\n- And a list\n\n- Of things\n\n- Like this!\n\n> Look, a blockquote! Oooh',
            scheduled: false,
            scheduled_minutes: 30,
            scheduled_time: '14:00',
        },
    },
*/

function App() {
    const [tasks, setTasks] = usePersistentState('tasks', INITIAL_TASKS);
    const [themeName, setThemeName] = usePersistentState('theme-name', 'DARK');
    const [selectedTaskId, setSelectedTaskId] = usePersistentState(
        'selected-task-id',
        null
    );
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isDraggingTask, setIsDraggingTask] = useState(false);
    const taskLabelElementRef = useRef(null);
    const activeTask = tasks[selectedTaskId];
    const incompleteTasks = values(tasks).filter(task => !task.isComplete);
    const hasIncompleteTasks = incompleteTasks.length;

    const handleDragOver = () => setIsDraggingTask(true);

    const handleDragEnd = () => setIsDraggingTask(false);

    useEffect(() => {
        handleDragEnd();
    }, [tasks]);

    const onUpdateTasks = updates => {
        setTasks(prevState => ({
            ...prevState,
            ...updates,
        }));
    };

    const onUpdateTask = (taskId, updates) => {
        setTasks(prevState => ({
            ...prevState,
            [taskId]: {
                ...prevState[taskId],
                ...updates,
            },
        }));
    };

    const onCreateTask = (overrides = {}) => {
        const newTaskId = Date.now();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        onUpdateTasks({
            [newTaskId]: {
                icon: DEFAULT_TASK_ICON,
                id: newTaskId,
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
        });

        setSelectedTaskId(newTaskId);

        setIsCreatingTask(true);

        // setTimeout(() => setIsCreatingTask(false), 1000);
    };

    const appActions = {
        onChangeTheme: setThemeName,
        onCreateTask,
        onSelectTask: setSelectedTaskId,
        onUpdateTask,
        onUpdateTasks,
    };

    const appData = {
        selectedTaskId,
        taskLabelElementRef,
        tasks,
        theme: themeName,
    };

    return (
        <ThemeProvider theme={{ name: themeName }}>
            <GlobalStyle />
            <CompletedTasksDropZone
                appActions={appActions}
                isDragging={isDraggingTask}
            />
            <FlexBox
                align="stretch"
                direction="row-reverse"
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <Timeline
                    appActions={appActions}
                    selectedTaskId={selectedTaskId}
                    from={TIMELINE_FROM}
                    style={{
                        opacity: hasIncompleteTasks ? 1 : 0.25,
                        width: '30vw',
                        pointerEvents: hasIncompleteTasks ? 'all' : 'none',
                    }}
                    tasks={incompleteTasks}
                    to={TIMELINE_TO}
                />
                <TaskDetails
                    appActions={appActions}
                    appData={appData}
                    task={activeTask}
                    isCreatingTask={isCreatingTask}
                    style={{
                        width: '40vw',
                        opacity: hasIncompleteTasks ? 1 : 0.25,
                    }}
                />
                <Backlog
                    appActions={appActions}
                    appData={appData}
                    selectedTaskId={selectedTaskId}
                    style={{
                        width: '30vw',
                    }}
                    tasks={incompleteTasks}
                />
            </FlexBox>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
