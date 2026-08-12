import { describe, expect, it } from 'vitest';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import { buildDeletedItems } from './deletedItems';

describe('buildDeletedItems', () => {
    it('lists archived lists first, followed by archived items', () => {
        const activeList = createPlannerList({ label: 'Active list' });
        const archivedList = {
            ...createPlannerList({ label: 'Archived list' }),
            isArchived: true,
        };
        const activeItem = createPlannerItem({
            label: 'Active item',
            listId: activeList.id,
        });
        const archivedItemInActiveList = {
            ...createPlannerItem({
                label: 'Archived item in active list',
                listId: activeList.id,
            }),
            isArchived: true,
        };
        const archivedItemInArchivedList = {
            ...createPlannerItem({
                label: 'Archived item in archived list',
                listId: archivedList.id,
            }),
            isArchived: true,
        };

        expect(
            buildDeletedItems(
                new Map([
                    [activeList.id, activeList],
                    [archivedList.id, archivedList],
                ]),
                new Map([
                    [activeItem.id, activeItem],
                    [archivedItemInActiveList.id, archivedItemInActiveList],
                    [archivedItemInArchivedList.id, archivedItemInArchivedList],
                ])
            )
        ).toEqual([
            {
                id: archivedList.id,
                label: 'Archived list',
                listId: archivedList.id,
                type: 'list',
            },
            {
                id: archivedItemInActiveList.id,
                label: 'Archived item in active list',
                listArchived: false,
                listId: activeList.id,
                type: 'item',
            },
            {
                id: archivedItemInArchivedList.id,
                label: 'Archived item in archived list',
                listArchived: true,
                listId: archivedList.id,
                type: 'item',
            },
        ]);
    });
});
