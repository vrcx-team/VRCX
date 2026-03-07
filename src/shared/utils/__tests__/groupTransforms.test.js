import { createDefaultGroupRef } from '../groupTransforms';

describe('createDefaultGroupRef', () => {
    it('creates object with defaults including myMember', () => {
        const ref = createDefaultGroupRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.myMember).toBeDefined();
        expect(ref.myMember.roleIds).toEqual([]);
        expect(ref.roles).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultGroupRef({
            id: 'grp_123',
            name: 'Test Group'
        });
        expect(ref.id).toBe('grp_123');
    });
});
