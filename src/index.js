import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import merge from 'lodash/merge';
import values from 'lodash/values';
import { createGlobalStyle } from 'styled-components';
import TaskDetails from './components/TaskDetails';
import WaitingArea from './components/WaitingArea';
import Timeline from './components/Timeline';
import { HOURS_AT_ONCE, TIMELINE_FROM, TIMELINE_TO } from './tokens';

const GlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        list-style-type: none;
        font-size: inherit;  
        font-weight: inherit;
        font-style: inherit;
        border: none;
    }
    :root {
        font-family: 'Operator Mono', monospace;
    }
    strong {
        font-weight: 900;
    }
    em {
        font-style: italic;
    }
`;

const INITIAL_STATE = {
    activeTaskId: 1,
    tasks: {
        1: {
            id: 1,
            icon: '🧺',
            isComplete: false,
            label: 'Take out the laundry',
            notes:
                'This is a note. **This is bold, I think?**\n\nWith two lines!\n\n- And a list\n\n- Of things\n\n- Like this!\n\n> Look, a blockquote! Oooh',
            schedule: {
                active: false,
                duration: 30,
                time: '14:00',
            },
        },
        2: {
            id: 2,
            icon: '🧪',
            isComplete: false,
            label: 'Study for Chem Exam',
            notes: '',
            schedule: {
                active: true,
                duration: 120,
                time: '10:00',
            },
        },
        3: {
            id: 3,
            icon: '💪',
            isComplete: false,
            label: 'Go to the gym',
            notes: '',
            schedule: {
                active: false,
                duration: 90,
                time: '18:00',
            },
        },
    },
};

function App() {
    const [appState, setAppState] = useState(INITIAL_STATE);
    const { tasks, activeTaskId } = appState;
    const tasksArray = values(tasks);
    const activeTask = tasksArray.find(task => task.id === activeTaskId);
    const scheduledTasks = tasksArray.filter(task => task.schedule.active);
    const unScheduledTasks = tasksArray.filter(task => !task.schedule.active);

    useEffect(() => {
        console.log('Rendering app');
    }, [appState]);

    const updateState = patch => {
        setAppState(merge(appState, patch));
    };

    const handleClickTask = taskId => updateState({ activeTaskId: taskId });

    return (
        <>
            <GlobalStyle />
            <div
                style={{
                    display: 'flex',
                }}
            >
                <Timeline
                    activeTaskId={activeTaskId}
                    from={TIMELINE_FROM}
                    hoursAtOnce={HOURS_AT_ONCE}
                    style={{
                        width: '30vw',
                    }}
                    tasks={scheduledTasks}
                    to={TIMELINE_TO}
                    onClickTask={handleClickTask}
                    onUpdateState={updateState}
                />
                <TaskDetails
                    task={activeTask}
                    style={{
                        width: '40vw',
                        height: '100vh',
                        overflow: 'auto',
                    }}
                    onUpdateState={updateState}
                />
                <WaitingArea
                    activeTaskId={activeTaskId}
                    tasks={unScheduledTasks}
                    style={{
                        width: '30vw',
                    }}
                    onClickTask={handleClickTask}
                    onUpdateState={updateState}
                />
            </div>
        </>
    );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
