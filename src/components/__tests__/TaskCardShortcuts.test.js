import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TaskCard from '../TaskCard';

jest.mock('../CollaborationAvatar', () => () => null);

global.IS_REACT_ACT_ENVIRONMENT = true;

const task = {
    duration_minutes: 30,
    icon: 'x',
    id: 'task-1',
    label: 'Numbered task',
};

describe('TaskCard shortcuts', () => {
    let container;
    let root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('renders a numbered key cap only for shortcuts one through nine', async () => {
        await act(async () => {
            root.render(
                <TaskCard
                    onTransitionToTask={jest.fn()}
                    shortcutNumber={5}
                    task={task}
                />
            );
        });

        expect(container.querySelector('kbd').textContent).toBe('5');
        expect(container.querySelector('kbd').getAttribute('aria-label')).toBe(
            'Press 5 to focus this task'
        );

        await act(async () => {
            root.render(
                <TaskCard
                    onTransitionToTask={jest.fn()}
                    shortcutNumber={10}
                    task={task}
                />
            );
        });

        expect(container.querySelector('kbd')).toBeNull();
    });
});
