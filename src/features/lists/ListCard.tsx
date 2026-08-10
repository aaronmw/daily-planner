import {
    type CSSProperties,
    type MouseEvent,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import type { ListId, ItemId } from '../../core/domain/ids';
import { ACCENT_KEYS } from '../../core/domain/types';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { accentColor } from '../theme/theme';
import { EditableText } from '../editor/EditableText';
import { IconButton } from '../shell/IconButton';
import { CardOwnerAvatar } from '../collaboration/CardOwnerAvatar';
import { useListCapability } from '../collaboration/useListCapability';

type AccentStyle = CSSProperties & Record<`--planner-${string}`, string>;
const EMPTY_ITEM_IDS: readonly ItemId[] = [];

function PreviewItem({ id }: { id: ItemId }) {
    const item = usePlannerSelector(state => state.itemsById.get(id) ?? null);
    if (!item) return null;
    return (
        <li className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden="true" className="shrink-0">
                {item.icon}
            </span>
            <span className="truncate">{item.label || 'Empty'}</span>
        </li>
    );
}

function FittedPreview({ itemIds }: { itemIds: readonly ItemId[] }) {
    const ref = useRef<HTMLUListElement>(null);
    const [fontSize, setFontSize] = useState(18);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;
        const fit = () => {
            let low = 12;
            let high = 18;
            for (let step = 0; step < 5; step += 1) {
                const candidate = (low + high) / 2;
                element.style.fontSize = `${candidate}px`;
                if (
                    element.scrollHeight <= element.clientHeight &&
                    element.scrollWidth <= element.clientWidth
                ) {
                    low = candidate;
                } else {
                    high = candidate;
                }
            }
            setFontSize(Math.max(12, Math.floor(low * 10) / 10));
        };
        const observer = new ResizeObserver(fit);
        observer.observe(element);
        fit();
        return () => observer.disconnect();
    }, [itemIds]);

    return (
        <ul
            className="min-h-0 flex-1 overflow-hidden leading-[1.45]"
            ref={ref}
            style={{ fontSize }}
        >
            {itemIds.slice(0, 12).map(id => (
                <PreviewItem id={id} key={id} />
            ))}
        </ul>
    );
}

export function ListCard({ id, index }: { id: ListId; index: number }) {
    const commands = usePlannerCommands();
    const list = usePlannerSelector(state => state.listsById.get(id) ?? null);
    const selected = usePlannerSelector(state => state.selectedListId === id);
    const itemIds = usePlannerSelector(
        state => state.itemIdsByListId.get(id) ?? EMPTY_ITEM_IDS
    );
    const editSession = usePlannerSelector(state => state.labelEditSession);
    const cardRef = useRef<HTMLDivElement>(null);
    const canWrite = useListCapability(id, 'write');

    useLayoutEffect(() => {
        if (selected) cardRef.current?.focus({ preventScroll: true });
    }, [selected]);

    if (!list) return null;

    const accent = accentColor(list.accentKey);
    const style: AccentStyle = {
        '--planner-border': accent,
        '--planner-contrast': accent,
        '--planner-dotted-line': accent,
        '--planner-item-border': accent,
    };
    const editRequest =
        editSession.status !== 'idle' &&
        editSession.entityType === 'list' &&
        editSession.entityId === id
            ? { id: editSession.requestId, selectAll: true }
            : null;

    const cycleAccent = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        const current = ACCENT_KEYS.indexOf(list.accentKey);
        const accentKey = ACCENT_KEYS[(current + 1) % ACCENT_KEYS.length];
        if (accentKey) void commands.updateList(id, { accentKey });
    };

    return (
        <div
            aria-label={`Open ${list.label || 'untitled list'}`}
            className="planner-list-card group relative flex aspect-[2/3] min-w-0 cursor-pointer flex-col border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-contrast p-4 text-planner-contrast-text transition-[background-color,border-color,box-shadow,transform] duration-150 ease-in-out focus:outline-none"
            data-active={selected}
            data-grid-index={index}
            onClick={() => commands.selectList(id)}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    commands.selectList(id);
                }
            }}
            ref={cardRef}
            role="button"
            style={style}
            tabIndex={selected ? 0 : -1}
        >
            <h3 className="mb-3 flex min-w-0 shrink-0 items-baseline text-[1.15rem] font-semibold">
                <CardOwnerAvatar
                    identityId={list.ownerIdentityId}
                    labelPrefix="Owned by"
                    listId={list.id}
                />
                <span className="min-w-0 flex-1">
                    <EditableText
                        editRequest={editRequest}
                        isEditable={canWrite}
                        onCancel={({ editRequestId }) =>
                            commands.cancelLabelEdit(editRequestId)
                        }
                        onEditRequestFulfilled={commands.fulfillLabelEdit}
                        onSave={(label, { editRequestId }) => {
                            void commands.updateList(id, { label });
                            commands.completeLabelEdit(editRequestId);
                        }}
                        placeholder="Empty"
                        value={list.label}
                    />
                </span>
            </h3>
            <FittedPreview itemIds={itemIds} />
            {canWrite && (
                <div className="absolute bottom-0 right-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    <IconButton
                        icon="palette"
                        label={`Change ${list.label || 'list'} colour`}
                        onClick={cycleAccent}
                    />
                </div>
            )}
        </div>
    );
}
