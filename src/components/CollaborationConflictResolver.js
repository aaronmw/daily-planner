import React, { useId, useState } from 'react';
import { ICONS } from './atoms/tokens';

const CHOICE = Object.freeze({
    MERGE: 'merge',
    MINE: 'mine',
    THEIRS: 'theirs',
});

const formatFieldLabel = field =>
    String(field || 'value')
        .replace(/[_-]+/g, ' ')
        .replace(/^./, character => character.toUpperCase());

const formatValue = value => {
    if (typeof value === 'string') return value;
    if (value === undefined) return '';
    if (value === null) return 'null';

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const errorMessage = error =>
    error instanceof Error && error.message
        ? error.message
        : 'The conflict could not be resolved. Please try again.';

const PendingIcon = ({ isPending }) => (
    <span
        aria-hidden="true"
        className="planner-collaboration-conflict-action-slot"
    >
        {isPending ? (
            <span className="planner-collaboration-conflict-spinner planner-spin">
                {ICONS.SPINNER}
            </span>
        ) : null}
    </span>
);

const FieldConflict = ({ conflict, onResolve }) => {
    const formId = useId();
    const [choiceByField, setChoiceByField] = useState(() =>
        Object.fromEntries(
            (conflict.conflicts || []).map(collision => [
                collision.field,
                {
                    choice: CHOICE.MINE,
                    mergeValue: formatValue(collision.local),
                },
            ])
        )
    );
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);

    const updateChoice = (field, update) => {
        setChoiceByField(current => ({
            ...current,
            [field]: {
                ...current[field],
                ...update,
            },
        }));
    };

    const submit = async event => {
        event.preventDefault();
        if (isPending) return;

        const choices = Object.fromEntries(
            (conflict.conflicts || []).map(collision => {
                const selection = choiceByField[collision.field];
                const value =
                    selection.choice === CHOICE.MINE
                        ? collision.local
                        : selection.choice === CHOICE.THEIRS
                          ? collision.remote
                          : selection.mergeValue;

                return [collision.field, { choice: selection.choice, value }];
            })
        );

        setError(null);
        setIsPending(true);
        try {
            await onResolve(conflict.id, choices);
        } catch (caught) {
            setError(errorMessage(caught));
        } finally {
            setIsPending(false);
        }
    };

    return (
        <article
            aria-labelledby={`${formId}-title`}
            className="planner-collaboration-conflict-item planner-collaboration-conflict-field"
            data-conflict-id={conflict.id}
        >
            <header className="planner-collaboration-conflict-header">
                <h3 id={`${formId}-title`}>Choose which changes to keep</h3>
                <p>
                    This {conflict.recordType || 'item'} changed in two places.
                </p>
            </header>
            <form
                className="planner-collaboration-conflict-form"
                onSubmit={submit}
            >
                {(conflict.conflicts || []).map((collision, index) => {
                    const fieldId = `${formId}-field-${index}`;
                    const fieldName = `${conflict.id}-${collision.field}`;
                    const selection = choiceByField[collision.field];

                    return (
                        <fieldset
                            className="planner-collaboration-conflict-fieldset"
                            disabled={isPending}
                            key={`${collision.field}-${index}`}
                        >
                            <legend id={`${fieldId}-legend`}>
                                {formatFieldLabel(collision.field)}
                            </legend>
                            <label
                                className="planner-collaboration-conflict-choice"
                                htmlFor={`${fieldId}-mine`}
                            >
                                <input
                                    checked={selection.choice === CHOICE.MINE}
                                    id={`${fieldId}-mine`}
                                    name={fieldName}
                                    type="radio"
                                    value={CHOICE.MINE}
                                    onChange={() =>
                                        updateChoice(collision.field, {
                                            choice: CHOICE.MINE,
                                        })
                                    }
                                />
                                <span className="planner-collaboration-conflict-choice-content">
                                    <strong>Mine</strong>
                                    <span className="planner-collaboration-conflict-value">
                                        {formatValue(collision.local) ||
                                            '(empty)'}
                                    </span>
                                </span>
                            </label>
                            <label
                                className="planner-collaboration-conflict-choice"
                                htmlFor={`${fieldId}-theirs`}
                            >
                                <input
                                    checked={selection.choice === CHOICE.THEIRS}
                                    id={`${fieldId}-theirs`}
                                    name={fieldName}
                                    type="radio"
                                    value={CHOICE.THEIRS}
                                    onChange={() =>
                                        updateChoice(collision.field, {
                                            choice: CHOICE.THEIRS,
                                        })
                                    }
                                />
                                <span className="planner-collaboration-conflict-choice-content">
                                    <strong>Theirs</strong>
                                    <span className="planner-collaboration-conflict-value">
                                        {formatValue(collision.remote) ||
                                            '(empty)'}
                                    </span>
                                </span>
                            </label>
                            <div className="planner-collaboration-conflict-choice planner-collaboration-conflict-merge-choice">
                                <input
                                    aria-label={`Merge ${formatFieldLabel(collision.field)}`}
                                    checked={selection.choice === CHOICE.MERGE}
                                    id={`${fieldId}-merge`}
                                    name={fieldName}
                                    type="radio"
                                    value={CHOICE.MERGE}
                                    onChange={() =>
                                        updateChoice(collision.field, {
                                            choice: CHOICE.MERGE,
                                        })
                                    }
                                />
                                <label
                                    className="planner-collaboration-conflict-choice-content"
                                    htmlFor={`${fieldId}-merge-value`}
                                >
                                    <strong>Merge</strong>
                                    <textarea
                                        aria-labelledby={`${fieldId}-legend ${fieldId}-merge-label`}
                                        id={`${fieldId}-merge-value`}
                                        name={`${fieldName}-merge`}
                                        rows={3}
                                        value={selection.mergeValue}
                                        onClick={() =>
                                            updateChoice(collision.field, {
                                                choice: CHOICE.MERGE,
                                            })
                                        }
                                        onFocus={() =>
                                            updateChoice(collision.field, {
                                                choice: CHOICE.MERGE,
                                            })
                                        }
                                        onChange={event =>
                                            updateChoice(collision.field, {
                                                choice: CHOICE.MERGE,
                                                mergeValue: event.target.value,
                                            })
                                        }
                                    />
                                    <span
                                        className="planner-collaboration-conflict-visually-hidden"
                                        id={`${fieldId}-merge-label`}
                                    >
                                        Merged value
                                    </span>
                                </label>
                            </div>
                        </fieldset>
                    );
                })}
                {error ? (
                    <p
                        className="planner-collaboration-conflict-error"
                        role="alert"
                    >
                        {error}
                    </p>
                ) : null}
                <button
                    aria-busy={isPending ? 'true' : undefined}
                    className="planner-collaboration-conflict-action planner-collaboration-conflict-resolve"
                    disabled={isPending}
                    type="submit"
                >
                    <span className="planner-collaboration-conflict-action-label">
                        Resolve conflict
                    </span>
                    <PendingIcon isPending={isPending} />
                </button>
            </form>
        </article>
    );
};

const DeletedConflict = ({ conflict, onDiscard, onSavePrivateCopy }) => {
    const titleId = useId();
    const [error, setError] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);

    const perform = async (action, callback) => {
        if (pendingAction) return;
        setError(null);
        setPendingAction(action);
        try {
            await callback(conflict.id);
        } catch (caught) {
            setError(errorMessage(caught));
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <article
            aria-labelledby={titleId}
            className="planner-collaboration-conflict-item planner-collaboration-conflict-deleted"
            data-conflict-id={conflict.id}
        >
            <header className="planner-collaboration-conflict-header">
                <h3 id={titleId}>This item was deleted elsewhere</h3>
                <p>
                    Keep your edited version as a private copy, or discard your
                    changes.
                </p>
            </header>
            {error ? (
                <p
                    className="planner-collaboration-conflict-error"
                    role="alert"
                >
                    {error}
                </p>
            ) : null}
            <div className="planner-collaboration-conflict-actions">
                <button
                    aria-busy={
                        pendingAction === 'private-copy' ? 'true' : undefined
                    }
                    className="planner-collaboration-conflict-action planner-collaboration-conflict-private-copy"
                    disabled={Boolean(pendingAction)}
                    type="button"
                    onClick={() => perform('private-copy', onSavePrivateCopy)}
                >
                    <span className="planner-collaboration-conflict-action-label">
                        Save as private copy
                    </span>
                    <PendingIcon isPending={pendingAction === 'private-copy'} />
                </button>
                <button
                    aria-busy={pendingAction === 'discard' ? 'true' : undefined}
                    className="planner-collaboration-conflict-action planner-collaboration-conflict-discard"
                    disabled={Boolean(pendingAction)}
                    type="button"
                    onClick={() => perform('discard', onDiscard)}
                >
                    <span className="planner-collaboration-conflict-action-label">
                        Discard
                    </span>
                    <PendingIcon isPending={pendingAction === 'discard'} />
                </button>
            </div>
        </article>
    );
};

const CollaborationConflictResolver = ({
    conflicts = [],
    onDiscardConflict,
    onResolveFieldConflict,
    onSaveConflictAsPrivateCopy,
}) => {
    const titleId = useId();
    const supportedConflicts = conflicts.filter(conflict =>
        ['deleted-while-editing', 'field-conflict'].includes(conflict.kind)
    );

    if (!supportedConflicts.length) return null;

    return (
        <section
            aria-labelledby={titleId}
            className="planner-collaboration-conflict-resolver"
        >
            <header className="planner-collaboration-conflict-resolver-header">
                <h2 id={titleId}>Resolve sync conflicts</h2>
                <p>
                    Your work is safe. Choose which version should be kept for
                    each conflict.
                </p>
            </header>
            <div
                aria-live="polite"
                className="planner-collaboration-conflict-list"
            >
                {supportedConflicts.map(conflict =>
                    conflict.kind === 'field-conflict' ? (
                        <FieldConflict
                            conflict={conflict}
                            key={conflict.id}
                            onResolve={onResolveFieldConflict}
                        />
                    ) : (
                        <DeletedConflict
                            conflict={conflict}
                            key={conflict.id}
                            onDiscard={onDiscardConflict}
                            onSavePrivateCopy={onSaveConflictAsPrivateCopy}
                        />
                    )
                )}
            </div>
        </section>
    );
};

export { CHOICE };
export default CollaborationConflictResolver;
