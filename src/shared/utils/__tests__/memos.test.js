import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    friends: new Map(),
    setUserDialogMemo: vi.fn(),
    database: {
        getUserMemo: vi.fn(),
        setUserMemo: vi.fn(),
        deleteUserMemo: vi.fn(),
        getAllUserMemos: vi.fn(),
        getWorldMemo: vi.fn()
    },
    storage: {
        GetAll: vi.fn(),
        Remove: vi.fn()
    }
}));

vi.mock('../../../stores', () => ({
    useFriendStore: () => ({
        friends: mocks.friends
    }),
    useUserStore: () => ({
        setUserDialogMemo: (...args) => mocks.setUserDialogMemo(...args)
    })
}));

vi.mock('../../../services/database', () => ({
    database: mocks.database
}));

import {
    getUserMemo,
    getWorldMemo,
    migrateMemos
} from '../../../coordinators/memoCoordinator.js';

describe('memos utils', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.friends = new Map();
        mocks.setUserDialogMemo.mockReset();
        mocks.database.getUserMemo.mockReset();
        mocks.database.setUserMemo.mockReset();
        mocks.database.deleteUserMemo.mockReset();
        mocks.database.getAllUserMemos.mockReset();
        mocks.database.getWorldMemo.mockReset();
        mocks.storage.GetAll.mockReset();
        mocks.storage.Remove.mockReset();
        globalThis.VRCXStorage = mocks.storage;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test('getUserMemo returns fallback when database throws', async () => {
        mocks.database.getUserMemo.mockRejectedValue(new Error('boom'));

        const result = await getUserMemo('usr_1');

        expect(result).toEqual({
            userId: '',
            editedAt: '',
            memo: ''
        });
    });

    test('getWorldMemo returns fallback when database throws', async () => {
        mocks.database.getWorldMemo.mockRejectedValue(new Error('boom'));

        const result = await getWorldMemo('wrld_1');

        expect(result).toEqual({
            worldId: '',
            editedAt: '',
            memo: ''
        });
    });

    test('migrateMemos rejects for invalid JSON payload', async () => {
        mocks.storage.GetAll.mockResolvedValue('{bad json');

        await expect(migrateMemos()).rejects.toThrow();
        expect(mocks.database.setUserMemo).not.toHaveBeenCalled();
        expect(mocks.storage.Remove).not.toHaveBeenCalled();
    });
});
