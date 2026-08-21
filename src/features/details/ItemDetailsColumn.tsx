import { lazy, Suspense } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import {
    APP_SHORTCUT_IDS,
    getConfigurableShortcutCommand,
    shortcutDefinitionsFor,
} from '../../core/application/shortcutCommands';
import {
    ITEM_DURATION_ESTIMATES,
    itemDurationEstimateIndex,
} from '../../core/domain/itemDuration';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { EditableText } from '../editor/EditableText';
import { Icon } from '../shell/Icon';
import { TrackedSelection } from '../shell/TrackedSelection';
import { ShortcutHint } from '../shortcuts/ShortcutProvider';
import { shortcutAriaKeys } from '../shortcuts/shortcutMatching';
import { ItemNotesEditor } from './ItemNotesEditor';
import { useListCapability } from '../collaboration/useListCapability';

const ItemComments = lazy(async () => {
    const module = await import('../collaboration/ItemComments');
    return { default: module.ItemComments };
});

export function ItemDetailsColumn() {
    const commands = usePlannerCommands();
    const item = usePlannerSelector(state =>
        state.selectedItemId
            ? (state.itemsById.get(state.selectedItemId) ?? null)
            : null
    );
    const editSession = usePlannerSelector(state => state.labelEditSession);
    const preferences = usePlannerSelector(state => state.preferences);
    const canWrite = useListCapability(item?.listId ?? null, 'write');
    const selectedDurationIndex = item
        ? itemDurationEstimateIndex(item.durationMinutes)
        : -1;
    const cycleDurationCommand = getConfigurableShortcutCommand(
        `app:${APP_SHORTCUT_IDS.cycleDuration}`
    );
    const cycleDurationShortcut = cycleDurationCommand
        ? shortcutDefinitionsFor(
              cycleDurationCommand,
              preferences.appShortcuts[APP_SHORTCUT_IDS.cycleDuration]
          )[0]
        : undefined;

    if (!item) {
        return (
            <div className="grid h-full place-items-center p-6 text-center text-planner-text-faded">
                Select a item to see its details
            </div>
        );
    }

    const editRequest =
        editSession.status !== 'idle' &&
        editSession.entityType === 'item' &&
        editSession.entityId === item.id
            ? { id: editSession.requestId, selectAll: true }
            : null;

    return (
        <div className="flex h-full min-w-[280px] flex-col overflow-auto">
            <div className="flex shrink-0 items-center bg-planner-shaded">
                <h1 className="min-w-0 flex-1 px-4 py-3 text-[1.45rem] font-bold leading-[1.35]">
                    <EditableText
                        ariaLabel="Item label"
                        className="planner-item-title-editor"
                        editRequest={editRequest}
                        isEditable={canWrite}
                        onCancel={({ editRequestId }) =>
                            commands.cancelLabelEdit(editRequestId)
                        }
                        onEditRequestFulfilled={commands.fulfillLabelEdit}
                        onSave={(label, { editRequestId }) => {
                            void commands.updateItem(item.id, { label });
                            commands.completeLabelEdit(editRequestId);
                        }}
                        placeholder="Empty"
                        value={item.label}
                    />
                </h1>
                <div className="w-[72px] shrink-0 p-2 text-center text-[2rem]">
                    <EditableText
                        ariaLabel="Item icon"
                        isEditable={canWrite}
                        onSave={icon =>
                            void commands.updateItem(item.id, { icon })
                        }
                        placeholder="☝️"
                        value={item.icon}
                    />
                </div>
            </div>

            <section className="flex min-h-[240px] min-w-0 flex-1 flex-col p-4 pr-5">
                <h2 className="mb-2 text-[0.8rem] uppercase text-planner-text-faded">
                    Notes
                </h2>
                <ItemNotesEditor
                    focusAssistEnabled={preferences.focusAssistEnabled}
                    highlightIncompleteSentencesEnabled={
                        preferences.highlightIncompleteSentencesEnabled
                    }
                    isEditable={canWrite}
                    key={item.id}
                    item={item}
                />
            </section>

            <section className="shrink-0 bg-planner-shaded">
                <h2
                    aria-keyshortcuts={
                        cycleDurationShortcut
                            ? shortcutAriaKeys(cycleDurationShortcut)
                            : undefined
                    }
                    className="flex items-center gap-2 px-4 pt-3 text-[0.8rem] uppercase text-planner-text-faded"
                >
                    Duration
                    {cycleDurationShortcut && (
                        <ShortcutHint shortcut={cycleDurationShortcut} />
                    )}
                </h2>
                <TrackedSelection
                    ariaLabel="Duration"
                    className="grid grid-cols-5"
                    disabled={!canWrite}
                    selectedIndex={selectedDurationIndex}
                >
                    {ITEM_DURATION_ESTIMATES.map((estimate, index) => (
                        <button
                            aria-pressed={selectedDurationIndex === index}
                            className="relative z-10 h-[45px] text-center"
                            data-tracked-selection-index={index}
                            disabled={!canWrite}
                            key={estimate.label}
                            onClick={() =>
                                void commands.updateItem(item.id, {
                                    durationMinutes: estimate.minutes,
                                })
                            }
                            type="button"
                        >
                            {estimate.label}
                        </button>
                    ))}
                </TrackedSelection>
            </section>

            {preferences.syncEnabled && (
                <Suspense fallback={null}>
                    <ItemComments itemId={item.id} />
                </Suspense>
            )}

            <button
                className="flex h-[45px] shrink-0 items-center justify-center gap-2 transition-[background-color,color] duration-150 hover:bg-planner-shaded"
                disabled={!canWrite}
                onClick={() => void commands.archiveItem(item.id)}
                type="button"
            >
                <Icon name="box-archive" />
                <span>Archive Item</span>
            </button>
        </div>
    );
}
