import { useEffect, useMemo, useRef, useState } from 'react';
import {
    useCollaboration,
    useCollaborationSelector,
} from '../../core/collaboration/CollaborationContext';
import type { PlannerList, PlannerItem } from '../../core/domain/types';
import { IconButton } from '../shell/IconButton';

const HIDDEN_FIELDS = new Set([
    'createdAt',
    'creatorIdentityId',
    'id',
    'keyVersion',
    'ownerIdentityId',
    'revision',
    'updatedAt',
]);

const fieldLabel = (field: string): string =>
    field
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, value => value.toUpperCase());

export function ConflictResolver() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const collaboration = useCollaboration();
    const conflicts = useCollaborationSelector(state => state.conflicts);
    const conflict = conflicts[0] ?? null;
    const [mergedOverride, setMergedOverride] = useState<{
        conflictId: string;
        value: PlannerList | PlannerItem;
    } | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (conflict && !dialogRef.current?.open)
            dialogRef.current?.showModal();
        if (!conflict && dialogRef.current?.open) dialogRef.current.close();
    }, [conflict]);

    const merged =
        conflict?.status === 'field-conflict'
            ? mergedOverride?.conflictId === conflict.id
                ? mergedOverride.value
                : conflict.local
            : null;

    const fields = useMemo(() => {
        if (conflict?.status !== 'field-conflict') return [];
        return Object.keys(conflict.local).filter(
            field =>
                !HIDDEN_FIELDS.has(field) &&
                JSON.stringify(
                    (conflict.local as unknown as Record<string, unknown>)[
                        field
                    ]
                ) !==
                    JSON.stringify(
                        (conflict.remote as unknown as Record<string, unknown>)[
                            field
                        ]
                    )
        );
    }, [conflict]);

    if (!conflict) return null;

    const resolve = async (
        resolution: 'discard' | 'merge' | 'mine' | 'private-copy' | 'theirs'
    ) => {
        setPending(true);
        try {
            await collaboration.resolveConflict(
                conflict.id,
                resolution,
                resolution === 'merge' ? (merged ?? undefined) : undefined
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <dialog
            aria-label="Resolve editing conflict"
            className="fixed inset-0 m-auto max-h-[calc(100dvh-24px)] w-[min(680px,calc(100vw-24px))] overflow-auto border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-0 text-planner-text shadow-2xl backdrop:bg-black/50"
            ref={dialogRef}
        >
            <header className="flex h-[45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border">
                <h2 className="min-w-0 flex-1 px-4 font-semibold">
                    Resolve editing conflict
                </h2>
                <IconButton
                    disabled
                    icon="triangle-exclamation"
                    label="Action required"
                />
            </header>
            {conflict.status === 'deleted-remotely' ? (
                <div className="p-5">
                    <p>
                        This {conflict.entityType} was deleted while you were
                        editing it.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                            disabled={pending}
                            onClick={() => void resolve('private-copy')}
                            type="button"
                        >
                            Save as private copy
                        </button>
                        <button
                            className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-danger px-4 text-planner-danger hover:bg-planner-shaded"
                            disabled={pending}
                            onClick={() => void resolve('discard')}
                            type="button"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            ) : (
                <div className="p-5">
                    <p className="text-planner-text-faded">
                        Both copies changed the same field. Choose either copy,
                        or adjust the merged value below.
                    </p>
                    <div className="mt-4 space-y-4">
                        {fields.map(field => {
                            const mergeBase = merged ?? conflict.local;
                            const local = (
                                conflict.local as unknown as Record<
                                    string,
                                    unknown
                                >
                            )[field];
                            const remote = (
                                conflict.remote as unknown as Record<
                                    string,
                                    unknown
                                >
                            )[field];
                            const value = (
                                mergeBase as unknown as Record<string, unknown>
                            )[field];
                            const setValue = (next: unknown) => {
                                setMergedOverride({
                                    conflictId: conflict.id,
                                    value: { ...mergeBase, [field]: next },
                                });
                            };
                            return (
                                <fieldset
                                    className="border-[length:var(--planner-stroke-width)] border-planner-border p-3"
                                    key={field}
                                >
                                    <legend className="px-2 font-semibold">
                                        {fieldLabel(field)}
                                    </legend>
                                    <div className="mb-2 flex gap-2">
                                        <button
                                            className="h-[36px] border-[length:var(--planner-stroke-width)] border-planner-border px-3 hover:bg-planner-shaded"
                                            onClick={() => setValue(local)}
                                            type="button"
                                        >
                                            Mine
                                        </button>
                                        <button
                                            className="h-[36px] border-[length:var(--planner-stroke-width)] border-planner-border px-3 hover:bg-planner-shaded"
                                            onClick={() => setValue(remote)}
                                            type="button"
                                        >
                                            Theirs
                                        </button>
                                    </div>
                                    {typeof value === 'string' ? (
                                        <textarea
                                            aria-label={`Merged ${fieldLabel(field)}`}
                                            className="min-h-[90px] w-full border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-3 leading-[1.6]"
                                            onChange={event =>
                                                setValue(event.target.value)
                                            }
                                            value={value}
                                        />
                                    ) : typeof value === 'number' ? (
                                        <input
                                            aria-label={`Merged ${fieldLabel(field)}`}
                                            className="h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background px-3"
                                            onChange={event => {
                                                const next =
                                                    event.currentTarget
                                                        .valueAsNumber;
                                                if (Number.isFinite(next))
                                                    setValue(next);
                                            }}
                                            type="number"
                                            value={value}
                                        />
                                    ) : (
                                        <pre className="max-h-36 overflow-auto whitespace-pre-wrap text-[0.85rem]">
                                            {JSON.stringify(value, null, 2)}
                                        </pre>
                                    )}
                                </fieldset>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                            disabled={pending}
                            onClick={() => void resolve('mine')}
                            type="button"
                        >
                            Use mine
                        </button>
                        <button
                            className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                            disabled={pending}
                            onClick={() => void resolve('theirs')}
                            type="button"
                        >
                            Use theirs
                        </button>
                        <button
                            className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-contrast bg-planner-contrast px-4 font-semibold text-planner-contrast-text"
                            disabled={pending || !merged}
                            onClick={() => void resolve('merge')}
                            type="button"
                        >
                            Save merge
                        </button>
                    </div>
                </div>
            )}
        </dialog>
    );
}
