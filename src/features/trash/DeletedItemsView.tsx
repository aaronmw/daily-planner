import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { listIdSchema, itemIdSchema } from '../../core/domain/ids';
import { IconButton } from '../shell/IconButton';
import { useListCapability } from '../collaboration/useListCapability';
import { buildDeletedItems, type DeletedItem } from './deletedItems';

function DeletedItemRow({
    armed,
    item,
    onArm,
    onDelete,
    onDisarm,
    onRestore,
    transform,
}: {
    armed: boolean;
    item: DeletedItem;
    onArm: () => void;
    onDelete: () => void;
    onDisarm: () => void;
    onRestore: () => void;
    transform: string;
}) {
    const canRestore = useListCapability(
        listIdSchema.parse(item.listId),
        item.type === 'list' || item.listArchived
            ? 'transfer-ownership'
            : 'write'
    );
    const canDelete = useListCapability(
        listIdSchema.parse(item.listId),
        item.type === 'list' ? 'transfer-ownership' : 'write'
    );
    return (
        <div
            className="absolute left-0 top-0 grid h-[47px] w-full grid-cols-[minmax(0,1fr)_45px_45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border"
            style={{ transform }}
        >
            <span className="min-w-0 truncate px-4">{item.label}</span>
            <IconButton
                disabled={!canRestore}
                icon="rotate-left"
                label={
                    canRestore
                        ? `Restore ${item.label}`
                        : `You do not have permission to restore ${item.label}`
                }
                onClick={onRestore}
            />
            <IconButton
                className={armed ? 'bg-planner-danger text-white' : ''}
                disabled={!canDelete}
                icon="trash"
                label={
                    !canDelete
                        ? `You do not have permission to delete ${item.label}`
                        : armed
                          ? `Delete ${item.label} permanently; click again`
                          : `Delete ${item.label} permanently`
                }
                onBlur={onDisarm}
                onClick={armed ? onDelete : onArm}
                onPointerLeave={onDisarm}
            />
        </div>
    );
}

export function DeletedItems({ onClose }: { onClose: () => void }) {
    const commands = usePlannerCommands();
    const lists = usePlannerSelector(state => state.listsById);
    const plannerItems = usePlannerSelector(state => state.itemsById);
    const [armedId, setArmedId] = useState<string | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const deletedItems = useMemo(
        () => buildDeletedItems(lists, plannerItems),
        [lists, plannerItems]
    );
    const virtualizer = useVirtualizer({
        count: deletedItems.length,
        estimateSize: () => 47,
        getItemKey: index =>
            `${deletedItems[index]?.type}:${deletedItems[index]?.id}`,
        getScrollElement: () => parentRef.current,
        overscan: 6,
    });

    return (
        <div className="flex h-full flex-col">
            <button
                className="h-[45px] shrink-0 border-b-[length:var(--planner-stroke-width)] border-planner-border px-4 text-left transition-colors hover:bg-planner-shaded"
                onClick={onClose}
                type="button"
            >
                Back to item details
            </button>
            {deletedItems.length === 0 ? (
                <div className="grid flex-1 place-items-center text-planner-text-faded">
                    Nothing has been deleted
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-auto" ref={parentRef}>
                    <div
                        className="relative"
                        style={{ height: virtualizer.getTotalSize() }}
                    >
                        {virtualizer.getVirtualItems().map(row => {
                            const item = deletedItems[row.index];
                            if (!item) return null;
                            const key = `${item.type}:${item.id}`;
                            const armed = armedId === key;
                            return (
                                <DeletedItemRow
                                    armed={armed}
                                    item={item}
                                    key={row.key}
                                    onArm={() => setArmedId(key)}
                                    onDelete={() => {
                                        setArmedId(null);
                                        if (item.type === 'list')
                                            void commands.deleteList(
                                                listIdSchema.parse(item.id)
                                            );
                                        else
                                            void commands.deleteItem(
                                                itemIdSchema.parse(item.id)
                                            );
                                    }}
                                    onDisarm={() => setArmedId(null)}
                                    onRestore={() => {
                                        if (item.type === 'list')
                                            void commands.restoreList(
                                                listIdSchema.parse(item.id)
                                            );
                                        else
                                            void commands.restoreItem(
                                                itemIdSchema.parse(item.id)
                                            );
                                    }}
                                    transform={`translateY(${row.start}px)`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
