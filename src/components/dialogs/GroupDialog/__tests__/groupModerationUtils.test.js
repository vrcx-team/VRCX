import { describe, expect, it } from 'vitest';

import { getAuditLogTypeName, resolveRoleNames } from '../groupModerationUtils';

describe('getAuditLogTypeName', () => {
    it('converts dotted audit log type to title case', () => {
        expect(getAuditLogTypeName('group.member.ban')).toBe('Member Ban');
    });

    it('handles single segment after group prefix', () => {
        expect(getAuditLogTypeName('group.update')).toBe('Update');
    });

    it('handles multiple segments', () => {
        expect(getAuditLogTypeName('group.role.member.add')).toBe(
            'Role Member Add'
        );
    });

    it('returns empty string for falsy input', () => {
        expect(getAuditLogTypeName('')).toBe('');
        expect(getAuditLogTypeName(null)).toBe('');
        expect(getAuditLogTypeName(undefined)).toBe('');
    });
});

describe('resolveRoleNames', () => {
    const roles = [
        { id: 'role_1', name: 'Admin' },
        { id: 'role_2', name: 'Moderator' },
        { id: 'role_3', name: 'Member' }
    ];

    it('resolves role IDs to comma-separated names', () => {
        expect(resolveRoleNames(['role_1', 'role_3'], roles)).toBe(
            'Admin, Member'
        );
    });

    it('returns empty string for empty roleIds', () => {
        expect(resolveRoleNames([], roles)).toBe('');
    });

    it('skips unknown role IDs', () => {
        expect(resolveRoleNames(['role_1', 'role_unknown'], roles)).toBe(
            'Admin'
        );
    });

    it('handles non-array roleIds gracefully', () => {
        expect(resolveRoleNames(null, roles)).toBe('');
        expect(resolveRoleNames(undefined, roles)).toBe('');
    });

    it('handles non-array roles gracefully', () => {
        expect(resolveRoleNames(['role_1'], null)).toBe('');
    });

    it('returns single name without comma', () => {
        expect(resolveRoleNames(['role_2'], roles)).toBe('Moderator');
    });
});
