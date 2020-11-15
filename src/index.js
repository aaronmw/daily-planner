import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import values from 'lodash/values';
import FlexBox from './components/atoms/FlexBox';
import CompletedTasksDropZone from './components/CompletedTasksDropZone';
import OptionBar from './components/OptionBar';
import TaskDetails from './components/TaskDetails';
import Timeline from './components/Timeline';
import WaitingArea from './components/WaitingArea';
import usePersistentState from './hooks/usePersistentState';
import {
    BULLET_SIZE,
    COLORS,
    GRID_UNIT,
    INITIAL_TASKS,
    TIMELINE_FROM,
    TIMELINE_TO,
} from './tokens';

const GlobalStyle = createGlobalStyle(
    ({ theme }) => `
        * {
            background: unset;
            border: unset;
            box-sizing: border-box;
            color: unset;
            font: unset;
            line-height: 1.4em;
            list-style-type: none;
            margin: 0;
            outline: unset;
            padding: 0;
        }
        :root {
            background: ${COLORS[theme.name].BACKGROUND};
            color: ${COLORS[theme.name].TEXT};
            font-family: 'Operator Mono', monospace;
            font-weight: 300;
            height: 100%;
            overflow: hidden;
        }
        strong {
            font-weight: 900;
        }
        em {
            font-style: italic;
        }
        
        .markdown {
            * + * {
                margin-top: calc(${GRID_UNIT} * 0.5);
            }
            
            h1 {
                color: ${COLORS[theme.name].TEXT_FADED};
                font-size: 1.4rem;
                font-weight: 500;
                border-bottom: 2px dotted ${COLORS[theme.name].TEXT_FADED};
                padding-bottom: calc(${GRID_UNIT} * 0.25);
                
                & + * {
                    margin-top: ${GRID_UNIT};
                } 
            }
        
            blockquote {
                border-left: 2px dotted ${COLORS[theme.name].TEXT_FADED};
                font-style: italic;
                padding: calc(${GRID_UNIT} * 0.5) ${GRID_UNIT};
            }
        
            li {
                padding-left: ${GRID_UNIT};
                position: relative;
        
                &:before {
                    content: '';
                    box-sizing: border-box;
                    position: absolute;
                    top: 5px;
                    left: 0;
                    border: 2px dotted ${COLORS[theme.name].TEXT_FADED};
                    border-radius: 100px;
                    width: ${BULLET_SIZE};
                    height: ${BULLET_SIZE};
                }
            }
        }
    `
);

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
    const [theme, setTheme] = usePersistentState('theme', { name: 'DARK' });
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

    const onChangeTheme = newTheme => {
        console.log('Setting theme:', newTheme);
        setTheme({ name: newTheme });
    };

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
        onChangeTheme,
        onSelectTask: setSelectedTaskId,
        onUpdateTask,
        onUpdateTasks,
    };

    return (
        <ThemeProvider theme={theme}>
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
                        height: '100vh',
                        opacity: hasIncompleteTasks ? 1 : 0.25,
                        overflow: 'auto',
                    }}
                />
                <FlexBox
                    direction="column"
                    style={{
                        width: '30vw',
                    }}
                >
                    <OptionBar
                        options={['DARK', 'LIGHT']}
                        renderOption={option => option.toLowerCase()}
                        renderSelectedOption={option => `${option} mode`}
                        selectedOption={theme.name}
                        onChange={onChangeTheme}
                    />
                    <WaitingArea
                        appActions={appActions}
                        selectedTaskId={selectedTaskId}
                        tasks={incompleteTasks}
                    />
                </FlexBox>
            </FlexBox>
        </ThemeProvider>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
