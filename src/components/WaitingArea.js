import React from 'react';
import styled from 'styled-components';
import useDrop from './hooks/useDrop';
import TaskCard from './TaskCard';
import { COLOR_BORDER_HOVER, COLOR_SHADED, GRID_UNIT } from '../tokens';

const Container = styled.div(
    ({ isTargetedForDrop }) => `
        background-color: ${COLOR_SHADED};
        box-shadow: ${
            isTargetedForDrop
                ? `0 0 0 5px ${COLOR_BORDER_HOVER} inset`
                : 'initial'
        };
        padding: ${GRID_UNIT};

        & > * + * {
            margin-top: calc(${GRID_UNIT} / 2);
        }
    `
);

const WaitingArea = ({
    activeTaskId,
    tasks,
    onClickTask,
    onUpdateState,
    ...otherProps
}) => {
    const [dropProps] = useDrop('task-id', taskId => {
        onUpdateState({
            tasks: {
                [taskId]: {
                    schedule: {
                        active: false,
                    },
                },
            },
        });
    });

    return (
        <Container {...dropProps} {...otherProps}>
            {tasks.map(task => (
                <TaskCard
                    draggable
                    key={task.id}
                    isActive={activeTaskId === task.id}
                    task={task}
                    onClick={onClickTask.bind(this, task.id)}
                />
            ))}
        </Container>
    );
};

export default WaitingArea;
