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

    function createDisplayNameIndex(entries) {
        const index = new Map();
        for (const entry of entries) {
            let ids = index.get(entry.displayName);
            if (!ids) {
                ids = new Set();
                index.set(entry.displayName, ids);
            }
            ids.add(entry.id);
        }
        return index;
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

    test('uses displayName index when provided', () => {
        const entries = [
            { id: 'usr_1', displayName: 'Alice' },
            { id: 'usr_2', displayName: 'Bob' }
        ];
        const users = createCachedUsers(entries);
        const index = createDisplayNameIndex(entries);

        const result = findUserByDisplayName(users, 'Bob', index);

        expect(result).toEqual({ id: 'usr_2', displayName: 'Bob' });
    });

    test('indexed lookup falls back to next duplicate when first user is missing', () => {
        const entries = [
            { id: 'usr_1', displayName: 'Alice' },
            { id: 'usr_2', displayName: 'Alice' }
        ];
        const users = createCachedUsers(entries);
        users.delete('usr_1');
        const index = createDisplayNameIndex(entries);

        const result = findUserByDisplayName(users, 'Alice', index);

        expect(result).toEqual({ id: 'usr_2', displayName: 'Alice' });
    });
});
