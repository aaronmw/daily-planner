import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import type { ItemId } from '../../core/domain/ids';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { accentColor } from '../theme/theme';
import { CardOwnerAvatar } from '../collaboration/CardOwnerAvatar';
import { useListCapability } from '../collaboration/useListCapability';
import {
    ShortcutHint,
    shortcutAriaKeys,
    type ShortcutDefinition,
} from '../shortcuts/ShortcutProvider';

type ItemCardStyle = CSSProperties &
    Record<`--planner-${string}`, string | number>;

const MINIMUM_LABEL_FONT_SIZE = 6.25;
const MAXIMUM_LABEL_FONT_SIZE = 16;

interface ItemCardProps {
    context?: 'collection' | 'timeline';
    id: ItemId;
    shortcut?: ShortcutDefinition;
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
    const labelRef = useRef<HTMLSpanElement>(null);
    const [labelFontSize, setLabelFontSize] = useState(MAXIMUM_LABEL_FONT_SIZE);
    const canWrite = useListCapability(list?.id ?? null, 'write');

    useLayoutEffect(() => {
        if (selected) cardRef.current?.focus({ preventScroll: true });
    }, [selected]);

    useLayoutEffect(() => {
        const element = labelRef.current;
        if (!element) return;
        const shouldFit = context === 'timeline' || relativeSizing;
        const fit = () => {
            if (!shouldFit) {
                element.style.fontSize = `${MAXIMUM_LABEL_FONT_SIZE}px`;
                setLabelFontSize(MAXIMUM_LABEL_FONT_SIZE);
                return;
            }

            let low = MINIMUM_LABEL_FONT_SIZE;
            let high = MAXIMUM_LABEL_FONT_SIZE;
            for (let step = 0; step < 7; step += 1) {
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

            const nextFontSize = Math.max(
                MINIMUM_LABEL_FONT_SIZE,
                Math.floor(low * 10) / 10
            );
            element.style.fontSize = `${nextFontSize}px`;
            setLabelFontSize(current =>
                current === nextFontSize ? current : nextFontSize
            );
        };
        const observer = new ResizeObserver(fit);
        observer.observe(element);
        fit();
        return () => observer.disconnect();
    }, [context, item?.label, relativeSizing]);

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

    return (
        <button
            aria-label={item.label || 'Untitled item'}
            aria-keyshortcuts={
                shortcut ? shortcutAriaKeys(shortcut) : undefined
            }
            className={`planner-item-card relative flex w-full min-w-0 cursor-pointer bg-planner-background text-left focus:outline-none ${singleLine ? 'items-center' : 'items-start'} ${item.isComplete ? 'opacity-60' : ''}`}
            data-active={selected}
            data-card-context={context}
            data-draggable={canWrite}
            data-single-line={singleLine}
            data-item-id={id}
            onClick={() => commands.selectItem(id)}
            ref={cardRef}
            style={cardStyle}
            tabIndex={selected ? 0 : -1}
            type="button"
        >
            {shortcut !== undefined && (
                <ShortcutHint
                    className="planner-item-card-shortcut"
                    shortcut={shortcut}
                />
            )}
            <CardOwnerAvatar
                compact={item.durationMinutes < 30}
                identityId={item.creatorIdentityId}
                labelPrefix="Created by"
                listId={item.listId}
            />
            <span
                className="planner-item-card-label min-w-0 flex-1 whitespace-pre-wrap font-medium leading-[1.45]"
                ref={labelRef}
                style={{ fontSize: labelFontSize }}
            >
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
