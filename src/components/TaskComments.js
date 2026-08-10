import React, { useEffect, useMemo, useState } from 'react';
import { canComment, canManageAccess, ROLES } from '../collaboration/roles';
import CollaborationAvatar from './CollaborationAvatar';
import ArmedIconButton from './atoms/ArmedIconButton';
import { ICONS } from './atoms/tokens';

const TaskComments = ({ appActions, appData, task }) => {
    const [draft, setDraft] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const collaboration = appData.collaboration || {};
    const comments = collaboration.commentsByTaskId?.get(task.id) || [];
    const role = collaboration.roleByListId?.get(task.list_id) || ROLES.READ;
    const currentUserId = collaboration.identity?.record?.userId;
    const unreadCount =
        collaboration.unreadCommentCountByTaskId?.get(task.id) || 0;
    const canPost = canComment(role);
    const orderedComments = useMemo(
        () =>
            [...comments].sort((left, right) =>
                left.created_at.localeCompare(right.created_at)
            ),
        [comments]
    );

    useEffect(() => {
        if (collaboration.isEnabled) {
            void appActions.onMarkCommentThreadRead?.(task.id);
        }
    }, [appActions, collaboration.isEnabled, task.id]);

    if (!collaboration.isEnabled) return null;

    const submit = async evt => {
        evt.preventDefault();
        const body = draft.trim();
        if (!body || isSubmitting || !canPost) return;
        setIsSubmitting(true);
        try {
            await appActions.onCreateComment(task.id, body, {
                parentCommentId: replyingTo,
            });
            setDraft('');
            setReplyingTo(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section aria-label="Comments" className="planner-task-comments">
            <h2>Comments{unreadCount ? ` (${unreadCount} unread)` : ''}</h2>
            <div className="planner-task-comment-list" aria-live="polite">
                {orderedComments.length ? (
                    orderedComments.map(comment => {
                        const profile = collaboration.getProfileForList?.(
                            task.list_id,
                            comment.author_id
                        );
                        const canDelete =
                            comment.author_id === currentUserId ||
                            canManageAccess(role);

                        return (
                            <article
                                className="planner-task-comment"
                                data-reply={Boolean(comment.parent_comment_id)}
                                key={comment.id}
                            >
                                <CollaborationAvatar profile={profile} />
                                <div className="planner-task-comment-content">
                                    <strong>
                                        {profile?.display_name ||
                                            'Former collaborator'}
                                    </strong>
                                    <p>{comment.body}</p>
                                    {canPost ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReplyingTo(comment.id)
                                            }
                                        >
                                            Reply
                                        </button>
                                    ) : null}
                                </div>
                                {canDelete ? (
                                    <ArmedIconButton
                                        label="Delete comment"
                                        onConfirm={() =>
                                            appActions.onDeleteComment(comment)
                                        }
                                    >
                                        {ICONS.END_ZONE}
                                    </ArmedIconButton>
                                ) : null}
                            </article>
                        );
                    })
                ) : (
                    <p className="planner-task-comments-empty">
                        No comments yet.
                    </p>
                )}
            </div>
            {canPost ? (
                <form
                    className="planner-task-comment-composer"
                    onSubmit={submit}
                >
                    {replyingTo ? (
                        <div className="planner-task-comment-replying">
                            <span>Replying in thread</span>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : null}
                    <textarea
                        aria-label="Add a comment"
                        placeholder="Add a comment..."
                        rows={3}
                        value={draft}
                        onChange={evt => setDraft(evt.target.value)}
                    />
                    <button
                        className="planner-task-comment-submit"
                        disabled={!draft.trim() || isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Posting...' : 'Comment'}
                    </button>
                </form>
            ) : (
                <p className="planner-task-comments-read-only">
                    Read & Comment access is required to participate.
                </p>
            )}
        </section>
    );
};

export default TaskComments;
