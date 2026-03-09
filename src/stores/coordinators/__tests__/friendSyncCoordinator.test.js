import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createFriendSyncCoordinator } from '../friendSyncCoordinator';

/**
 *
 * @returns {object} Mock dependencies for friend sync coordinator.
 */
function makeDeps() {
    return {
        getNextCurrentUserRefresh: vi.fn(() => 999),
        getCurrentUser: vi.fn().mockResolvedValue(undefined),
        refreshFriends: vi.fn().mockResolvedValue(undefined),
        reconnectWebSocket: vi.fn(),
        getCurrentUserId: vi.fn(() => 'usr_1'),
        getCurrentUserRef: vi.fn(() => ({ id: 'usr_1' })),
        setRefreshFriendsLoading: vi.fn(),
        setFriendsLoaded: vi.fn(),
        resetFriendLog: vi.fn(),
        isFriendLogInitialized: vi.fn().mockResolvedValue(true),
        getFriendLog: vi.fn().mockResolvedValue(undefined),
        initFriendLog: vi.fn().mockResolvedValue(undefined),
        isDontLogMeOut: vi.fn(() => false),
        showLoadFailedToast: vi.fn(),
        handleLogoutEvent: vi.fn(),
        tryApplyFriendOrder: vi.fn(),
        getAllUserStats: vi.fn(),
        hasLegacyFriendLogData: vi.fn().mockResolvedValue(false),
        removeLegacyFeedTable: vi.fn(),
        migrateMemos: vi.fn(),
        migrateFriendLog: vi.fn()
    };
}

describe('createFriendSyncCoordinator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('runRefreshFriendsListFlow refreshes current user before friends when refresh window is small', async () => {
        const deps = makeDeps();
        deps.getNextCurrentUserRefresh.mockReturnValue(100);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runRefreshFriendsListFlow();

        expect(deps.getCurrentUser).toHaveBeenCalledTimes(1);
        expect(deps.refreshFriends).toHaveBeenCalledTimes(1);
        expect(deps.reconnectWebSocket).toHaveBeenCalledTimes(1);
    });

    test('runRefreshFriendsListFlow skips current user refresh when window is large', async () => {
        const deps = makeDeps();
        deps.getNextCurrentUserRefresh.mockReturnValue(300);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runRefreshFriendsListFlow();

        expect(deps.getCurrentUser).not.toHaveBeenCalled();
        expect(deps.refreshFriends).toHaveBeenCalledTimes(1);
        expect(deps.reconnectWebSocket).toHaveBeenCalledTimes(1);
    });

    test('runInitFriendsListFlow loads existing friend log when initialized', async () => {
        const deps = makeDeps();
        deps.isFriendLogInitialized.mockResolvedValue(true);
        deps.hasLegacyFriendLogData.mockResolvedValue(false);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runInitFriendsListFlow();

        expect(deps.setRefreshFriendsLoading).toHaveBeenCalledWith(true);
        expect(deps.setFriendsLoaded).toHaveBeenCalledWith(false);
        expect(deps.resetFriendLog).toHaveBeenCalledTimes(1);
        expect(deps.isFriendLogInitialized).toHaveBeenCalledWith('usr_1');
        expect(deps.getFriendLog).toHaveBeenCalledWith({ id: 'usr_1' });
        expect(deps.initFriendLog).not.toHaveBeenCalled();
        expect(deps.tryApplyFriendOrder).toHaveBeenCalledTimes(1);
        expect(deps.getAllUserStats).toHaveBeenCalledTimes(1);
    });

    test('runInitFriendsListFlow initializes new friend log when not initialized', async () => {
        const deps = makeDeps();
        deps.isFriendLogInitialized.mockResolvedValue(false);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runInitFriendsListFlow();

        expect(deps.getFriendLog).not.toHaveBeenCalled();
        expect(deps.initFriendLog).toHaveBeenCalledWith({ id: 'usr_1' });
    });

    test('runInitFriendsListFlow performs legacy migration when old data exists', async () => {
        const deps = makeDeps();
        deps.hasLegacyFriendLogData.mockResolvedValue(true);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runInitFriendsListFlow();

        expect(deps.removeLegacyFeedTable).toHaveBeenCalledWith('usr_1');
        expect(deps.migrateMemos).toHaveBeenCalledTimes(1);
        expect(deps.migrateFriendLog).toHaveBeenCalledWith('usr_1');
    });

    test('runInitFriendsListFlow logs out and rethrows when load fails and dontLogMeOut is false', async () => {
        const deps = makeDeps();
        const err = new Error('load failed');
        deps.getFriendLog.mockRejectedValue(err);
        deps.isDontLogMeOut.mockReturnValue(false);
        const coordinator = createFriendSyncCoordinator(deps);

        await expect(coordinator.runInitFriendsListFlow()).rejects.toThrow(
            'load failed'
        );
        expect(deps.showLoadFailedToast).toHaveBeenCalledTimes(1);
        expect(deps.handleLogoutEvent).toHaveBeenCalledTimes(1);
        expect(deps.tryApplyFriendOrder).not.toHaveBeenCalled();
    });

    test('runInitFriendsListFlow continues when load fails and dontLogMeOut is true', async () => {
        const deps = makeDeps();
        deps.getFriendLog.mockRejectedValue(new Error('load failed'));
        deps.isDontLogMeOut.mockReturnValue(true);
        const coordinator = createFriendSyncCoordinator(deps);

        await coordinator.runInitFriendsListFlow();

        expect(deps.showLoadFailedToast).not.toHaveBeenCalled();
        expect(deps.handleLogoutEvent).not.toHaveBeenCalled();
        expect(deps.tryApplyFriendOrder).toHaveBeenCalledTimes(1);
        expect(deps.getAllUserStats).toHaveBeenCalledTimes(1);
    });
});
