import { useEffect, useMemo, useState } from 'react';
import {
    useCollaboration,
    useCollaborationSelector,
} from '../../core/collaboration/CollaborationContext';
import { roleHasCapability } from '../../core/collaboration/roles';
import type {
    CollaborationComment,
    CollaborationMembership,
    CollaborationProfile,
} from '../../core/collaboration/types';
import type { IdentityId, ItemId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { IconButton } from '../shell/IconButton';
import { CollaborationAvatar } from './CollaborationAvatar';

const EMPTY_COMMENTS: readonly CollaborationComment[] = [];
const EMPTY_MEMBERSHIPS: readonly CollaborationMembership[] = [];
const EMPTY_PROFILES = new Map<IdentityId, CollaborationProfile>();

export function ItemComments({ itemId }: { itemId: ItemId }) {
    const collaboration = useCollaboration();
    const item = usePlannerSelector(
        state => state.itemsById.get(itemId) ?? null
    );
    const syncEnabled = usePlannerSelector(
        state => state.preferences.syncEnabled
    );
    const identityId = useCollaborationSelector(state => state.identityId);
    const selectedComments = useCollaborationSelector(state =>
        state.commentsByItemId.get(itemId)
    );
    const comments = selectedComments ?? EMPTY_COMMENTS;
    const unreadCount = useCollaborationSelector(
        state => state.unreadCountByItemId.get(itemId) ?? 0
    );
    const selectedMemberships = useCollaborationSelector(state =>
        item ? state.membershipsByListId.get(item.listId) : undefined
    );
    const memberships = selectedMemberships ?? EMPTY_MEMBERSHIPS;
    const selectedProfiles = useCollaborationSelector(state =>
        item ? state.profilesByListId.get(item.listId) : undefined
    );
    const profiles = selectedProfiles ?? EMPTY_PROFILES;
    const [draft, setDraft] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [armedId, setArmedId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const membership = memberships.find(
        member => member.userId === identityId && member.state === 'active'
    );
    const role = membership?.role ?? 'read';
    const canComment = roleHasCapability(role, 'comment');
    const canModerate = roleHasCapability(role, 'manage-access');
    const orderedComments = useMemo(
        () =>
            comments.toSorted((a, b) => a.createdAt.localeCompare(b.createdAt)),
        [comments]
    );

    useEffect(() => {
        if (!syncEnabled || unreadCount === 0) return;
        void collaboration.markThreadRead(itemId);
    }, [collaboration, syncEnabled, itemId, unreadCount]);

    if (!syncEnabled || !item || !membership) return null;

    return (
        <section className="border-t-[length:var(--planner-stroke-width)] border-planner-border">
            <h2 className="px-4 pt-3 text-[0.8rem] uppercase text-planner-text-faded">
                Comments{unreadCount ? ` · ${unreadCount} unread` : ''}
            </h2>
            <div className="p-4" aria-live="polite">
                {orderedComments.length ? (
                    <div className="border-[length:var(--planner-stroke-width)] border-planner-border">
                        {orderedComments.map(comment => {
                            const profile =
                                profiles.get(comment.authorId) ?? null;
                            const canDelete =
                                comment.authorId === identityId || canModerate;
                            const armed = armedId === comment.id;
                            return (
                                <article
                                    className={`grid grid-cols-[45px_minmax(0,1fr)_45px] border-b-[length:var(--planner-stroke-width)] border-planner-border last:border-b-0 ${comment.parentCommentId ? 'bg-planner-shaded' : ''}`}
                                    key={comment.id}
                                >
                                    <span className="grid size-[45px] place-items-center">
                                        <CollaborationAvatar
                                            compact
                                            labelPrefix="Comment by"
                                            profile={profile}
                                        />
                                    </span>
                                    <div className="min-w-0 py-2 pr-3">
                                        <strong className="block truncate">
                                            {profile?.displayName ??
                                                'Former collaborator'}
                                        </strong>
                                        <p className="whitespace-pre-wrap break-words">
                                            {comment.body}
                                        </p>
                                        {canComment && (
                                            <button
                                                className="mt-1 text-planner-text-faded hover:text-planner-text"
                                                onClick={() =>
                                                    setReplyingTo(comment.id)
                                                }
                                                type="button"
                                            >
                                                Reply
                                            </button>
                                        )}
                                    </div>
                                    {canDelete ? (
                                        <IconButton
                                            icon={armed ? 'check' : 'trash'}
                                            label={
                                                armed
                                                    ? 'Confirm delete comment'
                                                    : 'Delete comment'
                                            }
                                            onBlur={() => setArmedId(null)}
                                            onClick={() => {
                                                if (!armed) {
                                                    setArmedId(comment.id);
                                                    return;
                                                }
                                                setArmedId(null);
                                                void collaboration.deleteComment(
                                                    comment
                                                );
                                            }}
                                        />
                                    ) : (
                                        <span />
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-planner-text-faded">No comments yet.</p>
                )}

                {canComment && (
                    <form
                        className="mt-3"
                        onSubmit={event => {
                            event.preventDefault();
                            const body = draft.trim();
                            if (!body || pending) return;
                            setPending(true);
                            setError('');
                            void collaboration
                                .createComment(itemId, body, replyingTo)
                                .then(() => {
                                    setDraft('');
                                    setReplyingTo(null);
                                })
                                .catch(caught =>
                                    setError(
                                        caught instanceof Error
                                            ? caught.message
                                            : 'The comment could not be posted.'
                                    )
                                )
                                .finally(() => setPending(false));
                        }}
                    >
                        {replyingTo && (
                            <div className="mb-2 flex items-center justify-between text-planner-text-faded">
                                <span>Replying in thread</span>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <textarea
                            aria-label="Add a comment"
                            className="min-h-[90px] w-full resize-y border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-3 leading-[1.6]"
                            onChange={event => setDraft(event.target.value)}
                            placeholder="Add a comment…"
                            value={draft}
                        />
                        {error && (
                            <p
                                className="mt-2 text-planner-danger"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}
                        <button
                            className="mt-2 h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                            disabled={!draft.trim() || pending}
                            type="submit"
                        >
                            {pending ? 'Posting…' : 'Comment'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}
