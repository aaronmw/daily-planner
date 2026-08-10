import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ROUTE_TRANSITION_ANIMATION_DURATION } from '../../components/atoms/tokens';
import { PLANNER_COMMANDS } from '../../utils/plannerCommands';
import usePlannerApp, { normalizeListsForHydration } from '../usePlannerApp';

jest.mock('../useAttachmentUploads', () => () => ({
    cancelUpload: jest.fn(),
    dismissFailedUpload: jest.fn(),
    draftMutations: [],
    failedUploads: [],
    progressByClientId: {},
    pushDraftMutation: jest.fn(),
    queueUploads: jest.fn(),
}));

global.IS_REACT_ACT_ENVIRONMENT = true;

const PlannerHarness = ({ onRender }) => {
    onRender(usePlannerApp());
    return null;
};

describe('usePlannerApp creation flows', () => {
    let container;
    let latestPlanner;
    let root;

    beforeEach(async () => {
        window.localStorage.clear();
        jest.useFakeTimers();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <PlannerHarness
                    onRender={planner => {
                        latestPlanner = planner;
                    }}
                />
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        jest.useRealTimers();
    });

    it('creates and opens a selected task with a label-edit request', async () => {
        const selectedListId = latestPlanner.appData.selectedListId;

        await act(async () => latestPlanner.appActions.onCreateTask());

        const createdTask = latestPlanner.appData.plannerIndexes.taskById.get(
            latestPlanner.appData.selectedTaskId
        );
        expect(createdTask.list_id).toBe(selectedListId);
        expect(latestPlanner.appData.isShowingListManager).toBe(false);
        expect(latestPlanner.appData.isShowingTrashContents).toBe(false);
        expect(latestPlanner.appData.labelEditSession).toMatchObject({
            entityId: createdTask.id,
            entityType: 'task',
            phase: 'requested',
        });
    });

    it('routes command dispatch through the same creation actions', async () => {
        await act(async () => {
            latestPlanner.appActions.onExecuteCommand(
                PLANNER_COMMANDS.CREATE_LIST
            );
        });

        expect(latestPlanner.appData.labelEditSession).toMatchObject({
            entityId: latestPlanner.appData.selectedListId,
            entityType: 'list',
        });
    });

    it('creates a selected list and opens its task view after commit', async () => {
        await act(async () => latestPlanner.appActions.onCreateList());

        const editSession = latestPlanner.appData.labelEditSession;
        expect(latestPlanner.appData.isShowingListManager).toBe(true);
        expect(latestPlanner.appData.selectedTaskId).toBeNull();
        expect(editSession).toMatchObject({
            entityId: latestPlanner.appData.selectedListId,
            entityType: 'list',
            phase: 'requested',
        });

        await act(async () =>
            latestPlanner.appActions.onCompleteLabelEdit(editSession.requestId)
        );
        expect(latestPlanner.appData.labelEditSession).toBeNull();

        await act(async () => {
            jest.advanceTimersByTime(ROUTE_TRANSITION_ANIMATION_DURATION / 2);
        });
        expect(latestPlanner.appData.isShowingListManager).toBe(false);
    });

    it('lets a newer creation supersede stale completion and keeps IDs unique', async () => {
        const dateNow = jest.spyOn(Date, 'now').mockReturnValue(12345);

        await act(async () => latestPlanner.appActions.onCreateTask());
        const firstSession = latestPlanner.appData.labelEditSession;
        const firstTaskId = latestPlanner.appData.selectedTaskId;

        await act(async () => latestPlanner.appActions.onCreateTask());
        const secondSession = latestPlanner.appData.labelEditSession;
        const secondTaskId = latestPlanner.appData.selectedTaskId;

        expect(secondTaskId).not.toBe(firstTaskId);
        expect(secondSession.requestId).not.toBe(firstSession.requestId);

        await act(async () =>
            latestPlanner.appActions.onCompleteLabelEdit(firstSession.requestId)
        );
        expect(latestPlanner.appData.labelEditSession.requestId).toBe(
            secondSession.requestId
        );

        dateNow.mockRestore();
    });

    it('replaces the final archived list atomically with an empty active list', async () => {
        const originalListId = latestPlanner.appData.selectedListId;

        await act(async () =>
            latestPlanner.appActions.onArchiveList(originalListId)
        );

        const originalList =
            latestPlanner.appData.plannerIndexes.listById.get(originalListId);
        const replacementList =
            latestPlanner.appData.plannerIndexes.listById.get(
                latestPlanner.appData.selectedListId
            );

        expect(originalList.isArchived).toBe(true);
        expect(replacementList).toMatchObject({
            isArchived: false,
            label: '',
        });
        expect(latestPlanner.unarchivedLists).toHaveLength(1);
        expect(latestPlanner.appData.selectedTaskId).toBeNull();
        expect(latestPlanner.appData.labelEditSession).toMatchObject({
            entityId: replacementList.id,
            entityType: 'list',
        });
    });

    it('rejects a desktop shortcut that duplicates another command', async () => {
        const showPlannerShortcut =
            latestPlanner.appData.desktopShortcuts[
                PLANNER_COMMANDS.SHOW_PLANNER
            ];

        await expect(
            latestPlanner.appActions.onChangeDesktopShortcut(
                PLANNER_COMMANDS.CREATE_LIST,
                showPlannerShortcut
            )
        ).rejects.toThrow('Desktop shortcuts must be unique');
        expect(
            latestPlanner.appData.desktopShortcuts[PLANNER_COMMANDS.CREATE_LIST]
        ).not.toBe(showPlannerShortcut);
    });

    it('keeps at least one planner column open', async () => {
        await act(async () =>
            latestPlanner.appActions.onChangeIsTimelineOpen(false)
        );
        await act(async () =>
            latestPlanner.appActions.onChangeIsListColumnOpen(false)
        );
        await act(async () =>
            latestPlanner.appActions.onChangeIsSidebarOpen(false)
        );

        expect(latestPlanner.appData.canCollapseColumns).toBe(false);
        expect(latestPlanner.appData.isTaskDetailsOpen).toBe(true);

        await act(async () =>
            latestPlanner.appActions.onChangeIsTaskDetailsOpen(false)
        );

        expect(latestPlanner.appData.isTaskDetailsOpen).toBe(true);
    });

    it('uses number keys to focus the corresponding unscheduled task', async () => {
        const tasksInList =
            latestPlanner.appData.plannerIndexes.unscheduledTasksByListId.get(
                latestPlanner.appData.selectedListId
            );
        const durationsBefore = tasksInList.map(task => task.duration_minutes);

        await act(async () => {
            document.body.dispatchEvent(
                new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: '5',
                })
            );
        });

        expect(latestPlanner.appData.selectedTaskId).toBe(tasksInList[4].id);
        expect(
            latestPlanner.appData.plannerIndexes.unscheduledTasksByListId
                .get(latestPlanner.appData.selectedListId)
                .map(task => task.duration_minutes)
        ).toEqual(durationsBefore);
    });

    it('repairs hydration data with no active list', () => {
        const normalizedLists = normalizeListsForHydration([
            {
                accent_key: 'red',
                id: 90,
                isArchived: true,
                label: 'Archived',
            },
        ]);

        expect(normalizedLists).toHaveLength(2);
        expect(normalizedLists.filter(list => !list.isArchived)).toEqual([
            expect.objectContaining({ label: '' }),
        ]);
    });
});
