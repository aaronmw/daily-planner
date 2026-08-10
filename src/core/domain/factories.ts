import { generateKeyBetween } from 'fractional-indexing';
import { createListId, createItemId, type ListId } from './ids';
import type { PlannerList, PlannerSnapshot, PlannerItem } from './types';

const now = (): string => new Date().toISOString();

export const createPlannerList = (
    input: Partial<Pick<PlannerList, 'accentKey' | 'label'>> = {}
): PlannerList => {
    const timestamp = now();
    return {
        accentKey: input.accentKey ?? 'sky',
        createdAt: timestamp,
        id: createListId(),
        isArchived: false,
        isPrivateCopy: false,
        keyVersion: 1,
        label: input.label ?? 'New List',
        ownerIdentityId: null,
        revision: 0,
        updatedAt: timestamp,
    };
};

export const createPlannerItem = ({
    afterOrderKey = null,
    label = 'New Item',
    listId,
}: {
    afterOrderKey?: string | null;
    label?: string;
    listId: ListId;
}): PlannerItem => {
    const timestamp = now();
    return {
        attachments: [],
        createdAt: timestamp,
        creatorIdentityId: null,
        durationMinutes: 30,
        icon: '☝️',
        id: createItemId(),
        isArchived: false,
        isComplete: false,
        isPrivateCopy: false,
        keyVersion: 1,
        label,
        listId,
        notes: '',
        orderKey: generateKeyBetween(afterOrderKey, null),
        revision: 0,
        scheduledStartMinutes: null,
        updatedAt: timestamp,
    };
};

const MANUAL_ITEMS = [
    'Make lists of items. Every day, schedule your most important ones',
    'Press [N] to create a [N]ew item in the current list',
    'Press [E] to edit the selected item',
    'Press [⌘]+[SHIFT]+[LEFT or RIGHT] to move between your lists',
    'Press [UP] or [DOWN] to select the previous and next unscheduled items in the active list',
    'Press keys [1] to [9] to focus the corresponding item in the active list',
    'Press [⌘]+[LEFT or RIGHT] to move the selected item to Items or Timeline, respectively',
    'Choose a time estimate for the selected item',
    'Press [I] to show / hide [I]tems',
    'Press [T] to show / hide the [T]imeline',
    'Press [D] to cycle the lighting mode',
    'Press [L] to see your [L]ists',
] as const;

export const createInitialPlannerSnapshot = (): PlannerSnapshot => {
    const list = createPlannerList({ accentKey: 'red', label: 'User Manual' });
    let afterOrderKey: string | null = null;
    const items = MANUAL_ITEMS.map(label => {
        const item = createPlannerItem({
            afterOrderKey,
            label,
            listId: list.id,
        });
        afterOrderKey = item.orderKey;
        return item;
    });
    return { lists: [list], items };
};
