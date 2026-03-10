import { findUserByDisplayName } from '../user';

vi.mock('../../../views/Feed/Feed.vue', () => ({
    default: { name: 'Feed' }
}));
vi.mock('../../../views/Feed/columns.jsx', () => ({ columns: [] }));
vi.mock('../../../plugins/router', () => ({
    default: { push: vi.fn(), currentRoute: { value: {} } }
}));

describe('findUserByDisplayName', () => {
    function createCachedUsers(entries) {
        const map = new Map();
        for (const entry of entries) {
            map.set(entry.id, entry);
        }
        return map;
    }

    test('returns the user matching displayName', () => {
        const users = createCachedUsers([
            { id: 'usr_1', displayName: 'Alice' },
            { id: 'usr_2', displayName: 'Bob' },
            { id: 'usr_3', displayName: 'Charlie' }
        ]);
        const result = findUserByDisplayName(users, 'Bob');
        expect(result).toEqual({ id: 'usr_2', displayName: 'Bob' });
    });

    test('returns undefined when no match found', () => {
        const users = createCachedUsers([
            { id: 'usr_1', displayName: 'Alice' }
        ]);
        expect(findUserByDisplayName(users, 'Unknown')).toBeUndefined();
    });

    test('returns undefined for empty map', () => {
        const users = new Map();
        expect(findUserByDisplayName(users, 'Alice')).toBeUndefined();
    });

    test('returns first match when duplicates exist', () => {
        const users = createCachedUsers([
            { id: 'usr_1', displayName: 'Alice' },
            { id: 'usr_2', displayName: 'Alice' }
        ]);
        // Map preserves insertion order, first match wins
        const result = findUserByDisplayName(users, 'Alice');
        expect(result.id).toBe('usr_1');
    });

    test('match is exact (case-sensitive)', () => {
        const users = createCachedUsers([
            { id: 'usr_1', displayName: 'Alice' }
        ]);
        expect(findUserByDisplayName(users, 'alice')).toBeUndefined();
        expect(findUserByDisplayName(users, 'ALICE')).toBeUndefined();
    });
});
