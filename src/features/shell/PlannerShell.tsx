import {
    type CSSProperties,
    lazy,
    Suspense,
    useEffect,
    useRef,
    useState,
} from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import type { PlannerColumn, ThemeMode } from '../../core/domain/types';
import { nextItemDurationEstimate } from '../../core/domain/itemDuration';
import { useListCapability } from '../collaboration/useListCapability';
import { ListColumn } from '../lists/ListColumn';
import { CollapsedListSwitcher } from '../lists/CollapsedListSwitcher';
import { OptionsMenu } from '../settings/OptionsMenu';
import { ItemColumn } from '../items/ItemColumn';
import { TimelineColumn } from '../timeline/TimelineColumn';
import { timelineMinuteHeight } from '../timeline/timelineScale';
import { buildThemeStyle, resolveTheme } from '../theme/theme';
import { CollaborationLauncher } from '../collaboration/CollaborationLauncher';
import { ConflictLauncher } from '../collaboration/ConflictLauncher';
import { Column } from './Column';
import { useDesktopCommands } from './useDesktopCommands';
import { resolveColumnShortcut, type ShortcutColumn } from './columnShortcuts';
import { useShortcuts } from '../shortcuts/ShortcutProvider';
import { getPlatformAdapter } from '../../platform/runtime/platformAdapter';
import {
    APP_SHORTCUT_IDS,
    getConfigurableShortcutCommand,
    shortcutDefinitionsFor,
    type AppShortcutId,
} from '../../core/application/shortcutCommands';

const ItemDetailsColumn = lazy(async () => {
    const module = await import('../details/ItemDetailsColumn');
    return { default: module.ItemDetailsColumn };
});

const DeletedItems = lazy(async () => {
    const module = await import('../trash/DeletedItemsView');
    return { default: module.DeletedItems };
});

type RootStyle = CSSProperties & Record<`--planner-${string}`, string>;

const nextThemeMode = (mode: ThemeMode): ThemeMode => {
    return mode === 'light' ? 'dark' : 'light';
};

export function PlannerShell() {
    const commands = usePlannerCommands();
    useDesktopCommands();
    const hydrated = usePlannerSelector(state => state.hydrated);
    const preferences = usePlannerSelector(state => state.preferences);
    const selectedList = usePlannerSelector(state =>
        state.selectedListId
            ? (state.listsById.get(state.selectedListId) ?? null)
            : null
    );
    const selectedItem = usePlannerSelector(state =>
        state.selectedItemId
            ? (state.itemsById.get(state.selectedItemId) ?? null)
            : null
    );
    const canWriteSelectedItem = useListCapability(
        selectedItem?.listId ?? null,
        'write'
    );
    const selectedAccentKey = selectedList?.accentKey ?? null;
    const [systemPrefersDark, setSystemPrefersDark] = useState(
        () => matchMedia('(prefers-color-scheme: dark)').matches
    );
    const [showDeleted, setShowDeleted] = useState(false);
    const [columnFocusRequests, setColumnFocusRequests] = useState<
        Record<ShortcutColumn, number>
    >({ items: 0, lists: 0, timeline: 0 });
    const rootRef = useRef<HTMLElement>(null);
    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
        const media = matchMedia('(prefers-color-scheme: dark)');
        const update = () => setSystemPrefersDark(media.matches);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!hydrated) return;

        void getPlatformAdapter()
            .setDockIconAccent(selectedAccentKey)
            .catch(error =>
                console.error('Failed to update Dock icon.', error)
            );
    }, [hydrated, selectedAccentKey]);

    useEffect(() => {
        const element = rootRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries =>
            setHeight(entries[0]?.contentRect.height ?? window.innerHeight)
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const runColumnShortcut = (key: string) => {
        const result = resolveColumnShortcut(key, preferences.columnVisibility);
        if (!result) return;

        if (result.visibility !== preferences.columnVisibility) {
            commands.updatePreferences({
                columnVisibility: result.visibility,
            });
        }
        const focusColumn = result.focusColumn;
        if (focusColumn) {
            setColumnFocusRequests(current => ({
                ...current,
                [focusColumn]: current[focusColumn] + 1,
            }));
        }
    };
    const shortcutFor = (id: AppShortcutId) => {
        const command = getConfigurableShortcutCommand(`app:${id}`);
        return command
            ? shortcutDefinitionsFor(command, preferences.appShortcuts[id])[0]
            : undefined;
    };
    const cycleDurationShortcut = shortcutFor(APP_SHORTCUT_IDS.cycleDuration);
    const cycleThemeShortcut = shortcutFor(APP_SHORTCUT_IDS.cycleTheme);
    const itemsColumnShortcut = shortcutFor(APP_SHORTCUT_IDS.toggleItems);
    const listsColumnShortcut = shortcutFor(APP_SHORTCUT_IDS.toggleLists);
    const timelineColumnShortcut = shortcutFor(APP_SHORTCUT_IDS.toggleTimeline);
    useShortcuts([
        ...(cycleDurationShortcut
            ? [
                  {
                      enabled: Boolean(selectedItem && canWriteSelectedItem),
                      onTrigger: () => {
                          if (!selectedItem) return;
                          void commands.updateItemWith(
                              selectedItem.id,
                              current => ({
                                  durationMinutes: nextItemDurationEstimate(
                                      current.durationMinutes
                                  ),
                              })
                          );
                      },
                      shortcut: cycleDurationShortcut,
                  },
              ]
            : []),
        ...(cycleThemeShortcut
            ? [
                  {
                      onTrigger: () =>
                          commands.updatePreferences({
                              themeMode: nextThemeMode(preferences.themeMode),
                          }),
                      shortcut: cycleThemeShortcut,
                  },
              ]
            : []),
        ...(itemsColumnShortcut
            ? [
                  {
                      onTrigger: () => runColumnShortcut('i'),
                      shortcut: itemsColumnShortcut,
                  },
              ]
            : []),
        ...(listsColumnShortcut
            ? [
                  {
                      onTrigger: () => runColumnShortcut('l'),
                      shortcut: listsColumnShortcut,
                  },
              ]
            : []),
        ...(timelineColumnShortcut
            ? [
                  {
                      onTrigger: () => runColumnShortcut('t'),
                      shortcut: timelineColumnShortcut,
                  },
              ]
            : []),
    ]);

    const resolvedTheme = resolveTheme(
        preferences.themeMode,
        systemPrefersDark
    );
    const minuteHeight = timelineMinuteHeight(
        height,
        preferences.timelineHoursPerScreen
    );
    const style: RootStyle = {
        ...buildThemeStyle(resolvedTheme, selectedList?.accentKey ?? 'sky'),
        '--planner-minute-height': `${minuteHeight}px`,
    };
    const openCount = Object.values(preferences.columnVisibility).filter(
        Boolean
    ).length;
    const toggle = (column: PlannerColumn) => {
        const isOpen = preferences.columnVisibility[column];
        if (isOpen && openCount === 1) return;
        commands.updatePreferences({
            columnVisibility: {
                ...preferences.columnVisibility,
                [column]: !isOpen,
            },
        });
    };

    if (!hydrated) {
        return (
            <main
                className="planner-root grid min-h-dvh place-items-center bg-black text-white font-planner"
                style={style}
            >
                Loading planner…
            </main>
        );
    }

    return (
        <main
            className="planner-root flex h-dvh gap-[var(--planner-stroke-width)] overflow-hidden bg-planner-background text-planner-text font-planner"
            data-theme={resolvedTheme}
            ref={rootRef}
            style={style}
        >
            <Column
                canCollapse={openCount > 1}
                heading="Timeline"
                isOpen={preferences.columnVisibility.timeline}
                onToggle={() => toggle('timeline')}
                {...(timelineColumnShortcut
                    ? { shortcut: timelineColumnShortcut }
                    : {})}
                weight={1.1}
            >
                <TimelineColumn
                    focusRequestId={columnFocusRequests.timeline}
                    minuteHeight={minuteHeight}
                />
            </Column>
            <Column
                canCollapse={openCount > 1}
                collapsedContent={<CollapsedListSwitcher />}
                heading="Lists"
                isOpen={preferences.columnVisibility.lists}
                onToggle={() => toggle('lists')}
                {...(listsColumnShortcut
                    ? { shortcut: listsColumnShortcut }
                    : {})}
                weight={1.45}
            >
                <ListColumn
                    focusRequestId={columnFocusRequests.lists}
                    isActive={preferences.columnVisibility.lists}
                />
            </Column>
            <Column
                canCollapse={openCount > 1}
                heading="Items"
                isOpen={preferences.columnVisibility.items}
                onToggle={() => toggle('items')}
                {...(itemsColumnShortcut
                    ? { shortcut: itemsColumnShortcut }
                    : {})}
                weight={1.05}
            >
                <ItemColumn
                    focusRequestId={columnFocusRequests.items}
                    isActive={preferences.columnVisibility.items}
                    minuteHeight={minuteHeight}
                />
            </Column>
            <Column
                actions={
                    <>
                        <CollaborationLauncher />
                        <OptionsMenu
                            onShowDeletedItems={() => setShowDeleted(true)}
                        />
                    </>
                }
                canCollapse={openCount > 1}
                heading={showDeleted ? 'Deleted Items' : 'Item Details'}
                isOpen={preferences.columnVisibility.details}
                onToggle={() => toggle('details')}
                weight={1.15}
            >
                <Suspense
                    fallback={
                        <div className="grid h-full place-items-center text-planner-text-faded">
                            Loading…
                        </div>
                    }
                >
                    {showDeleted ? (
                        <DeletedItems onClose={() => setShowDeleted(false)} />
                    ) : (
                        <ItemDetailsColumn />
                    )}
                </Suspense>
            </Column>
            <ConflictLauncher />
        </main>
    );
}
