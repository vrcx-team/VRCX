import { createDefaultAvatarRef } from '../avatarTransforms';

describe('createDefaultAvatarRef', () => {
    it('creates object with defaults', () => {
        const ref = createDefaultAvatarRef({});
        expect(ref.id).toBe('');
        expect(ref.name).toBe('');
        expect(ref.version).toBe(0);
        expect(ref.tags).toEqual([]);
    });

    it('spreads json over defaults', () => {
        const ref = createDefaultAvatarRef({
            id: 'avtr_123',
            name: 'My Avatar'
        });
        expect(ref.id).toBe('avtr_123');
        expect(ref.name).toBe('My Avatar');
    });
});
