import { lazy, Suspense } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { EditableText } from '../editor/EditableText';
import { IconButton } from '../shell/IconButton';
import { ItemNotesEditor } from './ItemNotesEditor';
import { useListCapability } from '../collaboration/useListCapability';

const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

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
            <div className="flex shrink-0 items-start bg-planner-shaded">
                <h1 className="min-w-0 flex-1 px-4 py-3 text-[1.45rem] font-bold leading-[1.35]">
                    <EditableText
                        ariaLabel="Item label"
                        editRequest={editRequest}
                        isEditable={canWrite}
                        multiline
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

            <section className="min-h-[240px] flex-1 p-4">
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

            <section className="shrink-0 border-t-[length:var(--planner-stroke-width)] border-planner-border">
                <h2 className="px-4 pt-3 text-[0.8rem] uppercase text-planner-text-faded">
                    Duration
                </h2>
                <div className="grid grid-cols-6">
                    {DURATIONS.map(duration => (
                        <button
                            aria-pressed={item.durationMinutes === duration}
                            className="h-[45px] border-r-[length:var(--planner-stroke-width)] border-planner-border text-center last:border-r-0 transition-[background-color,color] duration-150 hover:bg-planner-shaded aria-pressed:bg-planner-contrast aria-pressed:text-planner-contrast-text"
                            disabled={!canWrite}
                            key={duration}
                            onClick={() =>
                                void commands.updateItem(item.id, {
                                    durationMinutes: duration,
                                })
                            }
                            type="button"
                        >
                            {duration}
                        </button>
                    ))}
                </div>
            </section>

            {preferences.syncEnabled && (
                <Suspense fallback={null}>
                    <ItemComments itemId={item.id} />
                </Suspense>
            )}

            <div className="grid shrink-0 grid-cols-[1fr_45px] border-t-[length:var(--planner-stroke-width)] border-planner-border">
                <button
                    aria-pressed={item.isComplete}
                    className="px-4 text-left transition-[background-color,color] duration-150 hover:bg-planner-shaded"
                    disabled={!canWrite}
                    onClick={() =>
                        void commands.updateItem(item.id, {
                            isComplete: !item.isComplete,
                        })
                    }
                    type="button"
                >
                    {item.isComplete ? 'Completed' : 'Mark complete'}
                </button>
                <IconButton
                    disabled={!canWrite}
                    icon="trash"
                    label="Move item to deleted items"
                    onClick={() => void commands.archiveItem(item.id)}
                />
            </div>
        </div>
    );
}
