import {
    CAPABILITIES,
    ROLES,
    canComment,
    canManageAccess,
    canRead,
    canTransferOwnership,
    canWrite,
    compareRoles,
    roleHasCapability,
} from '../roles';

describe('collaboration roles', () => {
    it.each([
        [ROLES.READ, true, false, false, false, false],
        [ROLES.COMMENT, true, true, false, false, false],
        [ROLES.WRITE, true, true, true, false, false],
        [ROLES.FULL, true, true, true, true, false],
        [ROLES.OWNER, true, true, true, true, true],
    ])(
        'applies the complete capability matrix for %s',
        (role, read, comment, write, manage, transfer) => {
            expect(canRead(role)).toBe(read);
            expect(canComment(role)).toBe(comment);
            expect(canWrite(role)).toBe(write);
            expect(canManageAccess(role)).toBe(manage);
            expect(canTransferOwnership(role)).toBe(transfer);
        }
    );

    it('rejects unknown roles and capabilities', () => {
        expect(roleHasCapability('unknown', CAPABILITIES.READ)).toBe(false);
        expect(roleHasCapability(ROLES.OWNER, 'unknown')).toBe(false);
    });

    it('orders roles by increasing authority', () => {
        expect(compareRoles(ROLES.READ, ROLES.OWNER)).toBeLessThan(0);
        expect(compareRoles(ROLES.FULL, ROLES.WRITE)).toBeGreaterThan(0);
        expect(compareRoles(ROLES.COMMENT, ROLES.COMMENT)).toBe(0);
    });
});
