import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import values from 'lodash/values';
import AppColumn from './components/AppColumn';
import Backlog from './components/Backlog';
import CompletedTasksDropZone from './components/CompletedTasksDropZone';
import TaskDetails from './components/TaskDetails';
import Timeline from './components/Timeline';
import FlexBox from './components/atoms/FlexBox';
import GlobalStyle from './components/atoms/GlobalStyles';
import usePersistentState from './hooks/usePersistentState';
import {
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
    const [isDragging, setIsDragging] = useState(false);
    const activeTask = tasks[selectedTaskId];
    const incompleteTasks = values(tasks).filter(task => !task.isComplete);
    const hasIncompleteTasks = incompleteTasks.length;

    const handleDragOver = () => setIsDragging(true);

    const handleDragEnd = () => setIsDragging(false);

    useEffect(() => {
        handleDragEnd();
    }, [tasks]);

    const onUpdateTask = (taskId = Date.now(), updates) => {
        setTasks(prevState => ({
            ...prevState,
            [taskId]: {
                ...prevState[taskId],
                ...updates,
            },
        }));
    };

    const onUpdateTasks = updates => {
        setTasks(prevState => ({
            ...prevState,
            ...updates,
        }));
    };

    const appActions = {
        onChangeTheme: setThemeName,
        onSelectTask: setSelectedTaskId,
        onUpdateTask,
        onUpdateTasks,
    };

    const appData = {
        selectedTaskId,
        tasks,
        theme: themeName,
    };

    return (
        <ThemeProvider theme={{ name: themeName }}>
            <GlobalStyle />
            <CompletedTasksDropZone
                appActions={appActions}
                isDragging={isDragging}
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
                    task={activeTask}
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
