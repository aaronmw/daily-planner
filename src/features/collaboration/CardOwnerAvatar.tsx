import { lazy, Suspense } from 'react';
import { useCollaborationSelector } from '../../core/collaboration/CollaborationContext';
import type { IdentityId, ListId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';

const CollaborationAvatar = lazy(async () => {
    const module = await import('./CollaborationAvatar');
    return { default: module.CollaborationAvatar };
});

interface CardOwnerAvatarProps {
    compact?: boolean;
    identityId: IdentityId | null;
    labelPrefix: string;
    listId: ListId;
}

export function CardOwnerAvatar({
    compact,
    identityId,
    labelPrefix,
    listId,
}: CardOwnerAvatarProps) {
    const membershipCount = useCollaborationSelector(
        state =>
            state.membershipsByListId
                .get(listId)
                ?.filter(member => member.state === 'active').length ?? 0
    );
    const profile = useCollaborationSelector(state =>
        identityId
            ? (state.profilesByListId.get(listId)?.get(identityId) ?? null)
            : null
    );
    const isPresent = usePlannerSelector(state =>
        identityId ? state.presentIdentityIds.has(identityId) : false
    );
    if (!identityId || membershipCount < 2) return null;
    return (
        <span className="grid w-8 shrink-0 place-items-center self-start">
            <Suspense
                fallback={<span className={compact ? 'size-6' : 'size-8'} />}
            >
                <CollaborationAvatar
                    compact={compact ?? false}
                    isPresent={isPresent}
                    labelPrefix={labelPrefix}
                    profile={profile}
                />
            </Suspense>
        </span>
    );
}
