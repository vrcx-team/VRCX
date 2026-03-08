import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createAuthCoordinator } from '../coordinators/authCoordinator';

/**
 *
 * @returns {object} Mock dependencies for auth coordinator.
 */
function makeDeps() {
    return {
        userStore: {
            currentUser: { id: 'usr_1' },
            setUserDialogVisible: vi.fn(),
            applyCurrentUser: vi.fn()
        },
        notificationStore: {
            setNotificationInitStatus: vi.fn()
        },
        updateLoopStore: {
            setNextCurrentUserRefresh: vi.fn()
        },
        initWebsocket: vi.fn(),
        updateStoredUser: vi.fn().mockResolvedValue(undefined),
        webApiService: {
            clearCookies: vi.fn().mockResolvedValue(undefined)
        },
        loginForm: {
            value: {
                lastUserLoggedIn: 'usr_1'
            }
        },
        configRepository: {
            remove: vi.fn().mockResolvedValue(undefined)
        },
        setAttemptingAutoLogin: vi.fn(),
        autoLoginAttempts: {
            clear: vi.fn()
        },
        closeWebSocket: vi.fn(),
        queryClient: {
            clear: vi.fn()
        },
        watchState: {
            isLoggedIn: true,
            isFriendsLoaded: true,
            isFavoritesLoaded: true
        }
    };
}

describe('createAuthCoordinator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('runLogoutFlow applies all logout side effects', async () => {
        const deps = makeDeps();
        const coordinator = createAuthCoordinator(deps);

        await coordinator.runLogoutFlow();

        expect(deps.userStore.setUserDialogVisible).toHaveBeenCalledWith(false);
        expect(deps.watchState.isLoggedIn).toBe(false);
        expect(deps.watchState.isFriendsLoaded).toBe(false);
        expect(deps.watchState.isFavoritesLoaded).toBe(false);
        expect(
            deps.notificationStore.setNotificationInitStatus
        ).toHaveBeenCalledWith(false);
        expect(deps.updateStoredUser).toHaveBeenCalledWith(
            deps.userStore.currentUser
        );
        expect(deps.webApiService.clearCookies).toHaveBeenCalledTimes(1);
        expect(deps.loginForm.value.lastUserLoggedIn).toBe('');
        expect(deps.configRepository.remove).toHaveBeenCalledWith(
            'lastUserLoggedIn'
        );
        expect(deps.setAttemptingAutoLogin).toHaveBeenCalledWith(false);
        expect(deps.autoLoginAttempts.clear).toHaveBeenCalledTimes(1);
        expect(deps.closeWebSocket).toHaveBeenCalledTimes(1);
        expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
    });

    test('runLoginSuccessFlow applies login success side effects', () => {
        const deps = makeDeps();
        const coordinator = createAuthCoordinator(deps);
        const json = { id: 'usr_2' };

        coordinator.runLoginSuccessFlow(json);

        expect(
            deps.updateLoopStore.setNextCurrentUserRefresh
        ).toHaveBeenCalledWith(420);
        expect(deps.userStore.applyCurrentUser).toHaveBeenCalledWith(json);
        expect(deps.initWebsocket).toHaveBeenCalledTimes(1);
    });
});
