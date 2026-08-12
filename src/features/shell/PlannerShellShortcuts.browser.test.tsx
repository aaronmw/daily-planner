import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlannerCommands } from '../../core/application/plannerCommands';
import { PlannerCommandsProvider } from '../../core/application/plannerContext';
import { CollaborationProvider } from '../../core/collaboration/CollaborationContext';
import {
    createPlannerItem,
    createPlannerList,
} from '../../core/domain/factories';
import type { PlannerPreferences } from '../../core/domain/types';
import { PlannerStoreProvider } from '../../core/store/plannerContext';
import { createPlannerStore } from '../../core/store/plannerStore';
import { ItemDragProvider } from '../items/ItemDragProvider';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { PlannerShell } from './PlannerShell';
import '../../styles/index.css';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const createHarness = ({ includeDeletedItems = false } = {}) => {
    const list = createPlannerList({ label: 'Shell shortcut list' });
    const item = createPlannerItem({ label: 'Shell item', listId: list.id });
    const archivedList = {
        ...createPlannerList({ label: 'Archived shell list' }),
        isArchived: true,
    };
    const archivedItemInActiveList = {
        ...createPlannerItem({
            label: 'Archived shell item',
            listId: list.id,
        }),
        isArchived: true,
    };
    const archivedItemInArchivedList = {
        ...createPlannerItem({
            label: 'Archived shell list item',
            listId: archivedList.id,
        }),
        isArchived: true,
    };
    const store = createPlannerStore();
    store.getState().applySnapshot({
        items: includeDeletedItems
            ? [item, archivedItemInActiveList, archivedItemInArchivedList]
            : [item],
        lists: includeDeletedItems ? [list, archivedList] : [list],
    });
    const updatePreferences = vi.fn((changes: Partial<PlannerPreferences>) => {
        const current = store.getState().preferences;
        store.getState().setPreferences({ ...current, ...changes });
    });
    const commands = {
        archiveItem: vi.fn(),
        archiveList: vi.fn(),
        cancelLabelEdit: vi.fn(),
        completeLabelEdit: vi.fn(),
        createItem: vi.fn(async () => item),
        createList: vi.fn(async () => list),
        deleteItem: vi.fn(),
        deleteList: vi.fn(),
        fulfillLabelEdit: vi.fn(),
        hydrate: vi.fn(),
        moveItem: vi.fn(),
        restoreItem: vi.fn(),
        restoreList: vi.fn(),
        returnItemToList: vi.fn(),
        selectItem: vi.fn(),
        selectList: vi.fn(),
        updateItem: vi.fn(),
        updateItemWith: vi.fn(),
        updateList: vi.fn(),
        updatePreferences,
    } satisfies PlannerCommands;

    render(
        <PlannerStoreProvider store={store}>
            <CollaborationProvider>
                <PlannerCommandsProvider commands={commands}>
                    <ShortcutProvider>
                        <ItemDragProvider>
                            <PlannerShell />
                        </ItemDragProvider>
                    </ShortcutProvider>
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );

    return { store, updatePreferences };
};

describe('PlannerShell contextual shortcuts', () => {
    it('hides Deleted items when nothing has been deleted', async () => {
        const user = userEvent.setup();
        createHarness();

        await user.click(screen.getByRole('button', { name: 'Options' }));

        expect(
            screen.queryByRole('button', { name: /Deleted items/i })
        ).not.toBeInTheDocument();
    });

    it('opens Deleted Items from the counted options button', async () => {
        const user = userEvent.setup();
        createHarness({ includeDeletedItems: true });

        await user.click(screen.getByRole('button', { name: 'Options' }));

        const deletedItemsButton = screen.getByRole('button', {
            name: 'Deleted items, 3',
        });
        expect(deletedItemsButton).toHaveTextContent('3');
        expect(deletedItemsButton.querySelector('.fa-trash')).not.toBeNull();

        await user.click(deletedItemsButton);

        expect(
            screen.queryByRole('dialog', { name: 'Options' })
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Deleted Items' })
        ).toBeVisible();
    });

    it('frames Options without internal horizontal rules', async () => {
        const user = userEvent.setup();
        createHarness();

        await user.click(screen.getByRole('button', { name: 'Options' }));

        const panel = screen.getByRole('dialog', { name: 'Options' });
        expect(getComputedStyle(panel).borderTopWidth).toBe('2px');
        expect(getComputedStyle(panel).borderBottomWidth).toBe('2px');

        const sections = Array.from(
            panel.querySelectorAll<HTMLElement>('.planner-settings-section')
        );
        expect(sections.length).toBeGreaterThan(1);
        for (const section of sections) {
            expect(getComputedStyle(section).borderTopWidth).toBe('0px');
        }

        const rows = panel.querySelectorAll<HTMLElement>(
            '.planner-settings-row, .planner-desktop-shortcut-row'
        );
        for (const row of rows) {
            expect(getComputedStyle(row).borderTopWidth).toBe('0px');
        }
    });

    it('opens Options as a labelled disclosure panel', async () => {
        const user = userEvent.setup();
        createHarness();

        const launcher = screen.getByRole('button', { name: 'Options' });
        expect(launcher).toHaveAttribute(
            'aria-controls',
            'planner-options-panel'
        );
        expect(launcher).toHaveAttribute('aria-expanded', 'false');
        expect(launcher).toHaveAttribute('data-open', 'false');

        const gear = launcher.querySelector<HTMLElement>(
            '.planner-options-trigger-gear'
        );
        const close = launcher.querySelector<HTMLElement>(
            '.planner-options-trigger-close'
        );
        expect(gear).not.toBeNull();
        expect(close).not.toBeNull();
        if (!gear || !close) return;
        expect(getComputedStyle(gear).opacity).toBe('1');
        expect(getComputedStyle(close).opacity).toBe('0');

        await user.click(launcher);

        expect(launcher).toHaveAttribute('aria-expanded', 'true');
        expect(launcher).toHaveAttribute('data-open', 'true');
        expect(screen.getByRole('dialog', { name: 'Options' })).toBeVisible();
        expect(
            screen.queryByRole('heading', { name: 'Options' })
        ).not.toBeInTheDocument();
        await waitFor(() => {
            expect(getComputedStyle(gear).opacity).toBe('0');
            expect(getComputedStyle(close).opacity).toBe('1');
        });
        expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();
    });

    it('closes Options when Escape is pressed and restores launcher focus', async () => {
        const user = userEvent.setup();
        createHarness();
        const launcher = screen.getByRole('button', { name: 'Options' });

        await user.click(launcher);
        await user.keyboard('{Escape}');

        expect(launcher).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('dialog', { name: 'Options' })
        ).not.toBeInTheDocument();
        expect(launcher).toHaveFocus();
    });

    it('closes Options for a pointer-down outside its wrapper', async () => {
        const user = userEvent.setup();
        createHarness();
        const launcher = screen.getByRole('button', { name: 'Options' });

        await user.click(launcher);
        fireEvent.pointerDown(document.body);

        expect(launcher).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('dialog', { name: 'Options' })
        ).not.toBeInTheDocument();
    });

    it('keeps Options open for pointer-down interactions within the panel', async () => {
        const user = userEvent.setup();
        createHarness();

        await user.click(screen.getByRole('button', { name: 'Options' }));
        fireEvent.pointerDown(screen.getByRole('radio', { name: 'System' }));

        expect(screen.getByRole('dialog', { name: 'Options' })).toBeVisible();
    });

    it('keeps the wide Options panel visible beyond the Details column', async () => {
        const user = userEvent.setup();
        createHarness();

        const detailsColumn = screen.getByRole('region', {
            name: 'Item Details',
        });
        await user.click(screen.getByRole('button', { name: 'Options' }));
        const panel = screen.getByRole('dialog', { name: 'Options' });
        const columnBounds = detailsColumn.getBoundingClientRect();
        const panelBounds = panel.getBoundingClientRect();

        expect(panelBounds.width).toBeGreaterThan(columnBounds.width);
        expect(panelBounds.left).toBeLessThan(columnBounds.left);

        const hitTarget = document.elementFromPoint(
            (panelBounds.left + columnBounds.left) / 2,
            panelBounds.top + 20
        );
        expect(hitTarget).not.toBeNull();
        expect(panel.contains(hitTarget)).toBe(true);
    });

    it('closes Options when its launcher is clicked again', async () => {
        const user = userEvent.setup();
        createHarness();
        const launcher = screen.getByRole('button', { name: 'Options' });

        await user.click(launcher);
        await user.click(launcher);

        expect(launcher).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('dialog', { name: 'Options' })
        ).not.toBeInTheDocument();
        expect(launcher).toHaveFocus();
    });

    it('uses the full header as the collapse target without swallowing header actions', async () => {
        const user = userEvent.setup();
        const { store } = createHarness();
        const section = screen.getByRole('region', {
            name: 'Item Details',
        });
        const header = section.querySelector('header');
        const collapse = screen.getByRole('button', {
            name: 'Collapse Item Details',
        });
        expect(header).not.toBeNull();
        if (!header) return;

        const headerRect = header.getBoundingClientRect();
        const collapseRect = collapse.getBoundingClientRect();
        const borderWidth = Number.parseFloat(
            getComputedStyle(header).borderBottomWidth
        );
        expect(collapseRect.left).toBe(headerRect.left);
        expect(collapseRect.right).toBe(headerRect.right);
        expect(collapseRect.top).toBe(headerRect.top);
        expect(collapseRect.bottom).toBe(headerRect.bottom - borderWidth);
        expect(getComputedStyle(collapse).cursor).toBe('pointer');

        const options = screen.getByRole('button', { name: 'Options' });
        expect(getComputedStyle(options).cursor).toBe('pointer');
        await user.click(options);
        expect(screen.getByRole('dialog', { name: 'Options' })).toBeVisible();
        expect(store.getState().preferences.columnVisibility.details).toBe(
            true
        );

        await user.click(options);
        await user.click(collapse);
        expect(store.getState().preferences.columnVisibility.details).toBe(
            false
        );
    });

    it('uses the full collapsed column as the expand target', async () => {
        const user = userEvent.setup();
        const { store } = createHarness();
        const section = screen.getByRole('region', {
            name: 'Item Details',
        });

        await user.click(
            screen.getByRole('button', { name: 'Collapse Item Details' })
        );

        const expand = screen.getByRole('button', {
            name: 'Expand Item Details',
        });
        const sectionRect = section.getBoundingClientRect();
        const expandRect = expand.getBoundingClientRect();
        expect(expandRect.top).toBe(sectionRect.top);
        expect(expandRect.right).toBe(sectionRect.right);
        expect(expandRect.bottom).toBe(sectionRect.bottom);
        expect(expandRect.left).toBe(sectionRect.left);
        expect(getComputedStyle(expand).cursor).toBe('pointer');

        await user.click(expand);
        expect(store.getState().preferences.columnVisibility.details).toBe(
            true
        );
    });

    it('requires command to cycle the lighting mode', () => {
        const { store, updatePreferences } = createHarness();
        fireEvent.click(screen.getByRole('button', { name: 'Options' }));
        const lightingHeading = screen.getByRole('heading', {
            name: 'Lighting mode',
        });
        const lightingHint = lightingHeading.querySelector<HTMLElement>(
            '.planner-settings-group-shortcut'
        );
        expect(lightingHint).toHaveTextContent('⌘D');
        expect(lightingHint).not.toHaveAttribute('data-visible');
        expect(lightingHeading).toHaveAttribute('aria-keyshortcuts', 'Meta+D');

        fireEvent.keyDown(document, { key: 'd' });
        expect(updatePreferences).not.toHaveBeenCalled();
        expect(store.getState().preferences.themeMode).toBe('system');

        fireEvent.keyDown(document, { key: 'd', metaKey: true });
        expect(store.getState().preferences.themeMode).toBe('light');
        expect(lightingHint).toHaveAttribute('data-visible', 'true');
    });

    it.each([
        ['i', 'items'],
        ['l', 'lists'],
        ['t', 'timeline'],
    ] as const)('requires command to toggle the %s column', (key, column) => {
        const { store, updatePreferences } = createHarness();
        const section = screen.getByRole('region', {
            name: new RegExp(`^${column}$`, 'i'),
        });
        const hint = section.querySelector<HTMLElement>(
            '.planner-column-shortcut'
        );
        expect(hint).toHaveTextContent(`⌘${key.toLocaleUpperCase()}`);
        expect(hint).not.toHaveAttribute('data-visible');

        fireEvent.keyDown(document, { key });
        expect(updatePreferences).not.toHaveBeenCalled();
        expect(store.getState().preferences.columnVisibility[column]).toBe(
            true
        );

        fireEvent.keyDown(document, { key, metaKey: true });
        expect(store.getState().preferences.columnVisibility[column]).toBe(
            false
        );
        const collapsedHint = section.querySelector<HTMLElement>(
            '.planner-column-expand-shortcut'
        );
        expect(collapsedHint).toHaveTextContent(`⌘${key.toLocaleUpperCase()}`);
        expect(collapsedHint).toHaveAttribute('data-visible', 'true');
    });
});
