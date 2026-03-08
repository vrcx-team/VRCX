import { describe, expect, test, vi } from 'vitest';

import { createFriendPresenceCoordinator } from '../coordinators/friendPresenceCoordinator';

/**
 * @returns {object} Mock dependencies and mutable state for friend presence tests.
 */
function makeDeps() {
    const friends = new Map();
    const cachedUsers = new Map();
    const pendingOfflineMap = new Map();
    const ref = {
        id: 'usr_1',
        state: 'online',
        displayName: 'User 1',
        location: 'wrld_1:1',
        $location_at: 100,
        $lastFetch: 0,
        $online_for: 1,
        $offline_for: '',
        $active_for: ''
    };
    const ctx = {
        id: 'usr_1',
        state: 'online',
        ref,
        name: 'User 1',
        isVIP: false,
        pendingOffline: false
    };
    friends.set('usr_1', ctx);
    cachedUsers.set('usr_1', ref);

    return {
        deps: {
            friends,
            localFavoriteFriends: new Set(),
            pendingOfflineMap,
            pendingOfflineDelay: 100,
            watchState: { isFriendsLoaded: true },
            appDebug: { debugFriendState: false },
            getCachedUsers: vi.fn(() => cachedUsers),
            isRealInstance: vi.fn(() => false),
            requestUser: vi.fn(),
            getWorldName: vi.fn().mockResolvedValue('World 1'),
            getGroupName: vi.fn().mockResolvedValue('Group 1'),
            feedStore: {
                addFeed: vi.fn()
            },
            database: {
                addOnlineOfflineToDatabase: vi.fn()
            },
            updateOnlineFriendCounter: vi.fn(),
            now: vi.fn(() => 1000),
            nowIso: vi.fn(() => '2025-01-01T00:00:00.000Z')
        },
        ctx,
        ref,
        pendingOfflineMap
    };
}

describe('createFriendPresenceCoordinator', () => {
    test('queues pending offline transition when friend moves from online to offline', async () => {
        const { deps, ctx, pendingOfflineMap } = makeDeps();
        const coordinator = createFriendPresenceCoordinator(deps);

        await coordinator.runUpdateFriendFlow('usr_1', 'offline');

        expect(ctx.pendingOffline).toBe(true);
        expect(pendingOfflineMap.has('usr_1')).toBe(true);
        expect(deps.updateOnlineFriendCounter).not.toHaveBeenCalled();
    });

    test('processes pending offline queue and applies delayed transition', async () => {
        const { deps, ctx, pendingOfflineMap, ref } = makeDeps();
        pendingOfflineMap.set('usr_1', {
            startTime: 0,
            newState: 'offline',
            previousLocation: 'wrld_1:1',
            previousLocationAt: 500
        });
        const coordinator = createFriendPresenceCoordinator(deps);

        await coordinator.runPendingOfflineTickFlow();

        expect(ctx.state).toBe('offline');
        expect(ctx.pendingOffline).toBe(false);
        expect(pendingOfflineMap.has('usr_1')).toBe(false);
        expect(ref.$offline_for).toBe(1000);
        expect(deps.feedStore.addFeed).toHaveBeenCalledTimes(1);
        expect(deps.feedStore.addFeed).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Offline',
                userId: 'usr_1',
                location: 'wrld_1:1',
                worldName: 'World 1',
                groupName: 'Group 1',
                time: 500
            })
        );
        expect(deps.database.addOnlineOfflineToDatabase).toHaveBeenCalledTimes(
            1
        );
        expect(deps.updateOnlineFriendCounter).toHaveBeenCalledTimes(1);
    });

    test('cancels pending offline transition when online state arrives again', async () => {
        const { deps, ctx, pendingOfflineMap } = makeDeps();
        pendingOfflineMap.set('usr_1', {
            startTime: 900,
            newState: 'offline',
            previousLocation: 'wrld_1:1',
            previousLocationAt: 800
        });
        const coordinator = createFriendPresenceCoordinator(deps);

        await coordinator.runUpdateFriendFlow('usr_1', 'online');

        expect(ctx.pendingOffline).toBe(false);
        expect(pendingOfflineMap.has('usr_1')).toBe(false);
    });

    test('applies offline to online transition contract immediately', async () => {
        const { deps, ctx, ref } = makeDeps();
        ctx.state = 'offline';
        const coordinator = createFriendPresenceCoordinator(deps);

        await coordinator.runUpdateFriendFlow('usr_1', 'online');

        expect(ctx.state).toBe('online');
        expect(ref.$online_for).toBe(1000);
        expect(ref.$offline_for).toBe('');
        expect(deps.feedStore.addFeed).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Online',
                userId: 'usr_1',
                location: 'wrld_1:1',
                worldName: 'World 1',
                groupName: 'Group 1'
            })
        );
        expect(deps.database.addOnlineOfflineToDatabase).toHaveBeenCalledTimes(
            1
        );
        expect(deps.updateOnlineFriendCounter).toHaveBeenCalledTimes(1);
    });

    test('returns safely when friend context does not exist', async () => {
        const { deps } = makeDeps();
        deps.friends.clear();
        const coordinator = createFriendPresenceCoordinator(deps);

        await coordinator.runUpdateFriendFlow('usr_404', 'online');

        expect(deps.feedStore.addFeed).not.toHaveBeenCalled();
        expect(deps.updateOnlineFriendCounter).not.toHaveBeenCalled();
    });
});
