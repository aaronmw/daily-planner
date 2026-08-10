import {
    type CSSProperties,
    type DragEvent,
    useLayoutEffect,
    useRef,
} from 'react';
import type { ItemId } from '../../core/domain/ids';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { accentColor } from '../theme/theme';
import { KeyboardKey } from '../shell/KeyboardKey';
import { CardOwnerAvatar } from '../collaboration/CardOwnerAvatar';
import { useListCapability } from '../collaboration/useListCapability';

type ItemCardStyle = CSSProperties &
    Record<`--planner-${string}`, string | number>;

interface ItemCardProps {
    context?: 'collection' | 'timeline';
    id: ItemId;
    shortcut?: number;
    style?: ItemCardStyle;
}

export function ItemCard({
    context = 'collection',
    id,
    shortcut,
    style,
}: ItemCardProps) {
    const commands = usePlannerCommands();
    const item = usePlannerSelector(state => state.itemsById.get(id) ?? null);
    const list = usePlannerSelector(state => {
        const current = state.itemsById.get(id);
        return current ? (state.listsById.get(current.listId) ?? null) : null;
    });
    const selected = usePlannerSelector(state => state.selectedItemId === id);
    const relativeSizing = usePlannerSelector(
        state => state.preferences.relativeCardSizingEnabled
    );
    const cardRef = useRef<HTMLButtonElement>(null);
    const canWrite = useListCapability(list?.id ?? null, 'write');

    useLayoutEffect(() => {
        if (selected) cardRef.current?.focus({ preventScroll: true });
    }, [selected]);

    if (!item || !list) return null;

    const accent = accentColor(list.accentKey);
    const cardStyle: ItemCardStyle = {
        '--planner-border': accent,
        '--planner-contrast': accent,
        '--planner-item-duration-minutes': item.durationMinutes,
        'height':
            context === 'timeline' || relativeSizing
                ? `calc(var(--planner-minute-height) * ${item.durationMinutes})`
                : 'auto',
        'minHeight': context === 'timeline' || relativeSizing ? 0 : '45px',
        ...style,
    };
    const singleLine = !item.label.includes('\n') && item.label.length < 72;

    const handleDragStart = (event: DragEvent<HTMLElement>) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-daily-planner-item-id', id);
        event.dataTransfer.setData('text/plain', id);
    };

    return (
        <button
            aria-label={item.label || 'Untitled item'}
            className={`planner-item-card relative flex w-full min-w-0 cursor-pointer bg-planner-background text-left focus:outline-none ${singleLine ? 'items-center' : 'items-start'} ${item.isComplete ? 'opacity-60' : ''}`}
            data-active={selected}
            data-card-context={context}
            data-single-line={singleLine}
            data-item-id={id}
            draggable={canWrite}
            onClick={() => commands.selectItem(id)}
            onDragStart={handleDragStart}
            ref={cardRef}
            style={cardStyle}
            tabIndex={selected ? 0 : -1}
            type="button"
        >
            {shortcut !== undefined && (
                <span className="planner-item-card-shortcut grid size-[var(--spacing-icon-slot)] shrink-0 place-items-center self-center">
                    <KeyboardKey label={String(shortcut)} />
                </span>
            )}
            <CardOwnerAvatar
                compact={item.durationMinutes < 30}
                identityId={item.creatorIdentityId}
                labelPrefix="Created by"
                listId={item.listId}
            />
            <span className="planner-item-card-label min-w-0 flex-1 whitespace-pre-wrap font-medium leading-[1.45]">
                <span className="planner-item-card-label-text">
                    {item.label || 'Empty'}
                </span>
            </span>
            <span
                aria-hidden="true"
                className="planner-item-card-icon grid size-[var(--spacing-icon-slot)] shrink-0 place-items-center self-center text-[1.25rem]"
            >
                {item.icon}
            </span>
        </button>
    );
}
