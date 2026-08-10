import { Avatar } from '@dicebear/core';
import initialsDefinition from '@dicebear/styles/initials.json';
import { memo, useMemo } from 'react';
import type { CollaborationProfile } from '../../core/collaboration/types';

interface CollaborationAvatarProps {
    compact?: boolean;
    isPresent?: boolean;
    labelPrefix: string;
    profile: CollaborationProfile | null;
}

function CollaborationAvatarComponent({
    compact = false,
    isPresent = false,
    labelPrefix,
    profile,
}: CollaborationAvatarProps) {
    const label = profile?.displayName ?? 'Former collaborator';
    const source = useMemo(
        () =>
            new Avatar(initialsDefinition, {
                seed: profile?.avatarSeed ?? profile?.displayName ?? 'Planner',
                size: 48,
            }).toDataUri(),
        [profile?.avatarSeed, profile?.displayName]
    );
    const size = compact ? 16 : 24;
    return (
        <span
            className={`relative grid shrink-0 place-items-center ${compact ? 'size-6' : 'size-8'} ${isPresent ? 'after:absolute after:inset-0 after:rounded-full after:border-[length:var(--planner-stroke-width)] after:border-planner-contrast' : ''}`}
            title={label}
        >
            <img alt="" height={size} src={source} width={size} />
            <span className="sr-only">
                {labelPrefix} {label}
            </span>
        </span>
    );
}

export const CollaborationAvatar = memo(CollaborationAvatarComponent);
