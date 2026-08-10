export const ROLES = Object.freeze({
    READ: 'read',
    COMMENT: 'comment',
    WRITE: 'write',
    FULL: 'full',
    OWNER: 'owner',
});

export const CAPABILITIES = Object.freeze({
    READ: 'read',
    COMMENT: 'comment',
    WRITE: 'write',
    MANAGE_ACCESS: 'manageAccess',
    TRANSFER_OWNERSHIP: 'transferOwnership',
});

const ROLE_ORDER = Object.freeze([
    ROLES.READ,
    ROLES.COMMENT,
    ROLES.WRITE,
    ROLES.FULL,
    ROLES.OWNER,
]);

const CAPABILITY_MINIMUM_ROLE = Object.freeze({
    [CAPABILITIES.READ]: ROLES.READ,
    [CAPABILITIES.COMMENT]: ROLES.COMMENT,
    [CAPABILITIES.WRITE]: ROLES.WRITE,
    [CAPABILITIES.MANAGE_ACCESS]: ROLES.FULL,
    [CAPABILITIES.TRANSFER_OWNERSHIP]: ROLES.OWNER,
});

export const compareRoles = (left, right) => {
    const leftIndex = ROLE_ORDER.indexOf(left);
    const rightIndex = ROLE_ORDER.indexOf(right);

    if (leftIndex === -1 || rightIndex === -1) {
        throw new TypeError('Cannot compare unknown collaboration roles.');
    }

    return leftIndex - rightIndex;
};

export const roleHasCapability = (role, capability) => {
    const minimumRole = CAPABILITY_MINIMUM_ROLE[capability];

    if (!minimumRole || !ROLE_ORDER.includes(role)) {
        return false;
    }

    return compareRoles(role, minimumRole) >= 0;
};

export const canRead = role => roleHasCapability(role, CAPABILITIES.READ);
export const canComment = role => roleHasCapability(role, CAPABILITIES.COMMENT);
export const canWrite = role => roleHasCapability(role, CAPABILITIES.WRITE);
export const canManageAccess = role =>
    roleHasCapability(role, CAPABILITIES.MANAGE_ACCESS);
export const canTransferOwnership = role =>
    roleHasCapability(role, CAPABILITIES.TRANSFER_OWNERSHIP);

export const COLLABORATION_ROLE_ORDER = ROLE_ORDER;
