import { describe, expect, test, vi } from 'vitest';

import { createFriendRelationshipCoordinator } from '../coordinators/friendRelationshipCoordinator';

/**
 * @returns {Promise<void>} Promise flush helper.
 */
async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

/**
 * @returns {object} Mock dependencies for friend relationship tests.
 */
function makeDeps() {
    return {
        friendLog: new Map(),
        friendLogTable: {
            value: {
                data: []
            }
        },
        getCurrentUserId: vi.fn(() => 'usr_me'),
        requestFriendStatus: vi.fn().mockResolvedValue({
            params: {
                currentUserId: 'usr_me'
            },
            json: {
                isFriend: false
            }
        }),
        handleFriendStatus: vi.fn(),
        addFriendship: vi.fn(),
        deleteFriend: vi.fn(),
        database: {
            addFriendLogHistory: vi.fn(),
            deleteFriendLogCurrent: vi.fn()
        },
        notificationStore: {
            queueFriendLogNoty: vi.fn()
        },
        sharedFeedStore: {
            addEntry: vi.fn()
        },
        favoriteStore: {
            handleFavoriteDelete: vi.fn()
        },
        uiStore: {
            notifyMenu: vi.fn()
        },
        shouldNotifyUnfriend: vi.fn(() => true),
        nowIso: vi.fn(() => '2026-03-08T00:00:00.000Z')
    };
}

describe('createFriendRelationshipCoordinator', () => {
    test('runDeleteFriendshipFlow applies unfriend side effects after status check', async () => {
        const deps = makeDeps();
        deps.friendLog.set('usr_1', {
            displayName: 'User 1'
        });
        const coordinator = createFriendRelationshipCoordinator(deps);

        coordinator.runDeleteFriendshipFlow('usr_1');
        await flushPromises();

        expect(deps.requestFriendStatus).toHaveBeenCalledWith({
            userId: 'usr_1',
            currentUserId: 'usr_me'
        });
        expect(deps.handleFriendStatus).toHaveBeenCalledTimes(1);
        expect(deps.friendLog.has('usr_1')).toBe(false);
        expect(deps.database.addFriendLogHistory).toHaveBeenCalledTimes(1);
        expect(deps.database.deleteFriendLogCurrent).toHaveBeenCalledWith(
            'usr_1'
        );
        expect(deps.notificationStore.queueFriendLogNoty).toHaveBeenCalledTimes(
            1
        );
        expect(deps.sharedFeedStore.addEntry).toHaveBeenCalledTimes(1);
        expect(deps.favoriteStore.handleFavoriteDelete).toHaveBeenCalledWith(
            'usr_1'
        );
        expect(deps.uiStore.notifyMenu).toHaveBeenCalledWith('friend-log');
        expect(deps.deleteFriend).toHaveBeenCalledWith('usr_1');
    });

    test('runUpdateFriendshipsFlow syncs additions and stale removals', async () => {
        const deps = makeDeps();
        deps.friendLog.set('usr_me', {
            displayName: 'Me'
        });
        deps.friendLog.set('usr_keep', {
            displayName: 'Keep'
        });
        deps.friendLog.set('usr_drop', {
            displayName: 'Drop'
        });
        const coordinator = createFriendRelationshipCoordinator(deps);

        coordinator.runUpdateFriendshipsFlow({
            friends: ['usr_keep', 'usr_new']
        });
        await flushPromises();

        expect(deps.addFriendship).toHaveBeenNthCalledWith(1, 'usr_keep');
        expect(deps.addFriendship).toHaveBeenNthCalledWith(2, 'usr_new');
        expect(deps.database.deleteFriendLogCurrent).toHaveBeenCalledWith(
            'usr_me'
        );
        expect(deps.requestFriendStatus).toHaveBeenCalledWith({
            userId: 'usr_drop',
            currentUserId: 'usr_me'
        });
    });

    test('ignores delayed status responses from stale current user', async () => {
        const deps = makeDeps();
        deps.friendLog.set('usr_1', {
            displayName: 'User 1'
        });
        deps.requestFriendStatus.mockResolvedValue({
            params: {
                currentUserId: 'usr_old'
            },
            json: {
                isFriend: false
            }
        });
        const coordinator = createFriendRelationshipCoordinator(deps);

        coordinator.runDeleteFriendshipFlow('usr_1');
        await flushPromises();

        expect(deps.handleFriendStatus).not.toHaveBeenCalled();
        expect(deps.friendLog.has('usr_1')).toBe(true);
        expect(deps.database.addFriendLogHistory).not.toHaveBeenCalled();
        expect(deps.deleteFriend).not.toHaveBeenCalled();
    });

    test('respects unfriend notify switch', async () => {
        const deps = makeDeps();
        deps.shouldNotifyUnfriend.mockReturnValue(false);
        deps.friendLog.set('usr_1', {
            displayName: 'User 1'
        });
        const coordinator = createFriendRelationshipCoordinator(deps);

        coordinator.runDeleteFriendshipFlow('usr_1');
        await flushPromises();

        expect(deps.uiStore.notifyMenu).not.toHaveBeenCalled();
        expect(deps.favoriteStore.handleFavoriteDelete).toHaveBeenCalledWith(
            'usr_1'
        );
    });
});
