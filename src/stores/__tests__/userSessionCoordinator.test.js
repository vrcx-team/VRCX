import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createUserSessionCoordinator } from '../coordinators/userSessionCoordinator';

/**
 *
 * @returns {Promise<void>} Promise flush helper.
 */
async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}

/**
 *
 * @returns {object} Mock dependencies for user session coordinator.
 */
function makeDeps() {
    return {
        avatarStore: {
            addAvatarToHistory: vi.fn(),
            addAvatarWearTime: vi.fn()
        },
        gameStore: {
            isGameRunning: false
        },
        groupStore: {
            applyPresenceGroups: vi.fn()
        },
        instanceStore: {
            applyQueuedInstance: vi.fn()
        },
        friendStore: {
            updateUserCurrentStatus: vi.fn(),
            updateFriendships: vi.fn()
        },
        authStore: {
            loginComplete: vi.fn()
        },
        cachedUsers: {
            clear: vi.fn()
        },
        currentUser: {
            value: {
                homeLocation: 'wrld_current'
            }
        },
        userDialog: {
            value: {
                visible: false,
                id: '',
                $homeLocationName: ''
            }
        },
        getWorldName: vi.fn().mockResolvedValue('World Name'),
        parseLocation: vi.fn((tag) => ({ tag })),
        now: vi.fn(() => 111)
    };
}

describe('createUserSessionCoordinator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('runAvatarSwapFlow does nothing when user is not logged in', () => {
        const deps = makeDeps();
        const coordinator = createUserSessionCoordinator(deps);
        const ref = {
            currentAvatar: 'avtr_old',
            $previousAvatarSwapTime: null
        };

        coordinator.runAvatarSwapFlow({
            json: { currentAvatar: 'avtr_new' },
            ref,
            isLoggedIn: false
        });

        expect(deps.avatarStore.addAvatarToHistory).not.toHaveBeenCalled();
        expect(deps.avatarStore.addAvatarWearTime).not.toHaveBeenCalled();
    });

    test('runAvatarSwapFlow applies avatar swap side effects when game is running', () => {
        const deps = makeDeps();
        deps.gameStore.isGameRunning = true;
        const coordinator = createUserSessionCoordinator(deps);
        const ref = {
            currentAvatar: 'avtr_old',
            $previousAvatarSwapTime: null
        };

        coordinator.runAvatarSwapFlow({
            json: { currentAvatar: 'avtr_new' },
            ref,
            isLoggedIn: true
        });

        expect(deps.avatarStore.addAvatarToHistory).toHaveBeenCalledWith(
            'avtr_new'
        );
        expect(deps.avatarStore.addAvatarWearTime).toHaveBeenCalledWith(
            'avtr_old'
        );
        expect(ref.$previousAvatarSwapTime).toBe(111);
    });

    test('runFirstLoginFlow clears cache, updates currentUser and completes login', () => {
        const deps = makeDeps();
        deps.gameStore.isGameRunning = true;
        const coordinator = createUserSessionCoordinator(deps);
        const ref = {
            id: 'usr_1',
            $previousAvatarSwapTime: null
        };

        coordinator.runFirstLoginFlow(ref);

        expect(deps.cachedUsers.clear).toHaveBeenCalledTimes(1);
        expect(deps.currentUser.value).toBe(ref);
        expect(deps.authStore.loginComplete).toHaveBeenCalledTimes(1);
        expect(ref.$previousAvatarSwapTime).toBe(111);
    });

    test('runPostApplySyncFlow applies cross-store synchronization', () => {
        const deps = makeDeps();
        const coordinator = createUserSessionCoordinator(deps);
        const ref = { queuedInstance: 'wrld_1:123' };

        coordinator.runPostApplySyncFlow(ref);

        expect(deps.groupStore.applyPresenceGroups).toHaveBeenCalledWith(ref);
        expect(deps.instanceStore.applyQueuedInstance).toHaveBeenCalledWith(
            'wrld_1:123'
        );
        expect(deps.friendStore.updateUserCurrentStatus).toHaveBeenCalledWith(
            ref
        );
        expect(deps.friendStore.updateFriendships).toHaveBeenCalledWith(ref);
    });

    test('runHomeLocationSyncFlow updates home location and visible dialog name', async () => {
        const deps = makeDeps();
        deps.currentUser.value.homeLocation = 'wrld_home';
        deps.userDialog.value.visible = true;
        deps.userDialog.value.id = 'usr_1';
        const coordinator = createUserSessionCoordinator(deps);
        const ref = {
            id: 'usr_1',
            homeLocation: 'wrld_home',
            $homeLocation: { tag: 'wrld_other' }
        };

        coordinator.runHomeLocationSyncFlow(ref);
        await flushPromises();

        expect(deps.parseLocation).toHaveBeenCalledWith('wrld_home');
        expect(ref.$homeLocation).toEqual({ tag: 'wrld_home' });
        expect(deps.getWorldName).toHaveBeenCalledWith('wrld_home');
        expect(deps.userDialog.value.$homeLocationName).toBe('World Name');
    });
});
