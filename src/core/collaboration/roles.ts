export const COLLABORATION_ROLES = [
    'read',
    'comment',
    'write',
    'full',
    'owner',
] as const;

export type CollaborationRole = (typeof COLLABORATION_ROLES)[number];
export type CollaborationCapability =
    'read' | 'comment' | 'write' | 'manage-access' | 'transfer-ownership';

const minimumRole: Record<CollaborationCapability, CollaborationRole> = {
    'comment': 'comment',
    'manage-access': 'full',
    'read': 'read',
    'transfer-ownership': 'owner',
    'write': 'write',
};

export const compareRoles = (
    left: CollaborationRole,
    right: CollaborationRole
): number =>
    COLLABORATION_ROLES.indexOf(left) - COLLABORATION_ROLES.indexOf(right);

export const roleHasCapability = (
    role: CollaborationRole,
    capability: CollaborationCapability
): boolean => compareRoles(role, minimumRole[capability]) >= 0;
