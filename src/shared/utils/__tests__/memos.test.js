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
    getAllUserMemos,
    getUserMemo,
    getWorldMemo,
    migrateMemos,
    saveUserMemo
} from '../../../coordinators/memoCoordinator.js';

describe('memos utils', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
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

    test('saveUserMemo persists memo and syncs friend fields', async () => {
        const friend = { memo: '', $nickName: '' };
        mocks.friends.set('usr_1', friend);

        await saveUserMemo('usr_1', 'Nick\nmore');

        expect(mocks.database.setUserMemo).toHaveBeenCalledTimes(1);
        expect(mocks.database.deleteUserMemo).not.toHaveBeenCalled();
        expect(friend.memo).toBe('Nick\nmore');
        expect(friend.$nickName).toBe('Nick');
        expect(mocks.setUserDialogMemo).toHaveBeenCalledWith('Nick\nmore');
    });

    test('saveUserMemo deletes memo and clears nickname on empty input', async () => {
        const friend = { memo: 'old', $nickName: 'old' };
        mocks.friends.set('usr_1', friend);

        await saveUserMemo('usr_1', '');

        expect(mocks.database.deleteUserMemo).toHaveBeenCalledWith('usr_1');
        expect(friend.memo).toBe('');
        expect(friend.$nickName).toBe('');
        expect(mocks.setUserDialogMemo).toHaveBeenCalledWith('');
    });

    test('getAllUserMemos applies memo data to existing cached friends', async () => {
        const friend1 = { memo: '', $nickName: '' };
        const friend2 = { memo: '', $nickName: '' };
        mocks.friends.set('usr_1', friend1);
        mocks.friends.set('usr_2', friend2);
        mocks.database.getAllUserMemos.mockResolvedValue([
            { userId: 'usr_1', memo: 'Alpha\nline2' },
            { userId: 'usr_2', memo: '' },
            { userId: 'usr_missing', memo: 'ignored' }
        ]);

        await getAllUserMemos();

        expect(friend1.memo).toBe('Alpha\nline2');
        expect(friend1.$nickName).toBe('Alpha');
        expect(friend2.memo).toBe('');
        expect(friend2.$nickName).toBe('');
    });

    test('migrateMemos moves memo_usr entries to database and storage cleanup', async () => {
        const friend = { memo: '', $nickName: '' };
        mocks.friends.set('usr_1', friend);
        mocks.storage.GetAll.mockResolvedValue(
            JSON.stringify({
                memo_usr_1: 'hello',
                other_key: 'x',
                memo_usr_2: ''
            })
        );

        await migrateMemos();

        expect(mocks.database.setUserMemo).toHaveBeenCalledTimes(1);
        expect(mocks.database.setUserMemo).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'usr_1',
                memo: 'hello'
            })
        );
        expect(mocks.storage.Remove).toHaveBeenCalledWith('memo_usr_1');
        expect(mocks.storage.Remove).not.toHaveBeenCalledWith('memo_usr_2');
    });

    test('migrateMemos rejects for invalid JSON payload', async () => {
        mocks.storage.GetAll.mockResolvedValue('{bad json');

        await expect(migrateMemos()).rejects.toThrow();
        expect(mocks.database.setUserMemo).not.toHaveBeenCalled();
        expect(mocks.storage.Remove).not.toHaveBeenCalled();
    });
});
