import { useLayoutEffect, useRef } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import type { ListId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { accentColor } from '../theme/theme';

function CollapsedListButton({ id }: { id: ListId }) {
    const commands = usePlannerCommands();
    const list = usePlannerSelector(state => state.listsById.get(id) ?? null);
    const selected = usePlannerSelector(state => state.selectedListId === id);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (selected) buttonRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selected]);

    if (!list) return null;

    const label = list.label || 'Untitled list';
    return (
        <button
            aria-label={`Switch to ${label}`}
            aria-pressed={selected}
            className="planner-collapsed-list-button pointer-events-auto grid size-[30px] shrink-0 place-items-center rounded-full"
            onClick={() => commands.selectList(id)}
            ref={buttonRef}
            title={label}
            type="button"
        >
            <span
                aria-hidden="true"
                className="planner-collapsed-list-swatch size-[18px] rounded-full border-[length:var(--planner-stroke-width)] border-planner-background"
                style={{ backgroundColor: accentColor(list.accentKey) }}
            />
        </button>
    );
}

export function CollapsedListSwitcher() {
    const listIds = usePlannerSelector(state => state.listIds);

    if (listIds.length === 0) return null;

    return (
        <div
            aria-label="Switch active list"
            className="planner-collapsed-list-switcher"
            role="group"
        >
            {listIds.map(id => (
                <CollapsedListButton id={id} key={id} />
            ))}
        </div>
    );
}
