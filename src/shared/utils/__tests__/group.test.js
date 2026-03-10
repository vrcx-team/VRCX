import { hasGroupModerationPermission, hasGroupPermission } from '../group';

// Mock transitive deps to avoid import errors
vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { template: '<div />' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
    default: { push: vi.fn(), currentRoute: { value: {} } }
}));

describe('Group Utils', () => {
    describe('hasGroupPermission', () => {
        test('returns true when permission is in list', () => {
            const ref = {
                myMember: {
                    permissions: ['group-bans-manage', 'group-audit-view']
                }
            };
            expect(hasGroupPermission(ref, 'group-bans-manage')).toBe(true);
        });

        test('returns true when wildcard permission is present', () => {
            const ref = { myMember: { permissions: ['*'] } };
            expect(hasGroupPermission(ref, 'group-bans-manage')).toBe(true);
        });

        test('returns false when permission is not in list', () => {
            const ref = {
                myMember: { permissions: ['group-bans-manage'] }
            };
            expect(hasGroupPermission(ref, 'group-audit-view')).toBe(false);
        });

        test('returns false when permissions array is empty', () => {
            const ref = { myMember: { permissions: [] } };
            expect(hasGroupPermission(ref, 'group-bans-manage')).toBe(false);
        });

        test('returns false when myMember is null', () => {
            expect(hasGroupPermission({ myMember: null }, 'x')).toBe(false);
        });

        test('returns false when ref is null', () => {
            expect(hasGroupPermission(null, 'x')).toBe(false);
        });

        test('returns false when ref is undefined', () => {
            expect(hasGroupPermission(undefined, 'x')).toBe(false);
        });

        test('returns false when permissions is missing', () => {
            const ref = { myMember: {} };
            expect(hasGroupPermission(ref, 'x')).toBe(false);
        });
    });

    describe('hasGroupModerationPermission', () => {
        test('returns true for any single moderation permission', () => {
            const permissions = [
                'group-invites-manage',
                'group-moderates-manage',
                'group-audit-view',
                'group-bans-manage',
                'group-data-manage',
                'group-members-manage',
                'group-members-remove',
                'group-roles-assign',
                'group-roles-manage',
                'group-default-role-manage'
            ];

            for (const perm of permissions) {
                const ref = { myMember: { permissions: [perm] } };
                expect(hasGroupModerationPermission(ref)).toBe(true);
            }
        });

        test('returns true for wildcard', () => {
            const ref = { myMember: { permissions: ['*'] } };
            expect(hasGroupModerationPermission(ref)).toBe(true);
        });

        test('returns false for non-moderation permissions', () => {
            const ref = {
                myMember: {
                    permissions: ['group-announcements-manage']
                }
            };
            expect(hasGroupModerationPermission(ref)).toBe(false);
        });

        test('returns false for empty permissions', () => {
            const ref = { myMember: { permissions: [] } };
            expect(hasGroupModerationPermission(ref)).toBe(false);
        });

        test('returns false for null ref', () => {
            expect(hasGroupModerationPermission(null)).toBe(false);
        });
    });
});
