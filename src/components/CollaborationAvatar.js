import { Avatar } from '@dicebear/core';
import initialsDefinition from '@dicebear/styles/initials.json';
import React, { memo, useMemo } from 'react';
import cx from '../utils/cx';

const getAvatarSource = profile => {
    if (profile?.avatar_url) return profile.avatar_url;

    return new Avatar(initialsDefinition, {
        seed: profile?.avatar_seed || profile?.display_name || 'Planner',
        size: 48,
    }).toDataUri();
};

const CollaborationAvatar = ({
    compact = false,
    isPresent = false,
    labelPrefix = 'Created by',
    profile,
}) => {
    const source = useMemo(() => getAvatarSource(profile), [profile]);
    const label = profile?.display_name || 'Former collaborator';

    return (
        <span
            className={cx(
                'planner-collaboration-avatar-slot',
                compact && 'planner-collaboration-avatar-slot-compact',
                isPresent && 'planner-collaboration-avatar-present'
            )}
            title={label}
        >
            <img
                alt=""
                className="planner-collaboration-avatar"
                height={compact ? 16 : 24}
                src={source}
                width={compact ? 16 : 24}
            />
            <span className="sr-only">
                {labelPrefix} {label}
            </span>
        </span>
    );
};

export default memo(CollaborationAvatar);
