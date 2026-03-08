import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createAuthAutoLoginCoordinator } from '../coordinators/authAutoLoginCoordinator';

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
 * @param {object} overrides Dependency overrides for a specific test case.
 * @returns {object} Mock dependencies for auth auto-login coordinator.
 */
function makeDeps(overrides = {}) {
    let attemptingAutoLogin = false;

    const deps = {
        getIsAttemptingAutoLogin: vi.fn(() => attemptingAutoLogin),
        setAttemptingAutoLogin: vi.fn((value) => {
            attemptingAutoLogin = value;
        }),
        getLastUserLoggedIn: vi.fn(() => 'usr_1'),
        getSavedCredentials: vi.fn().mockResolvedValue({
            user: { id: 'usr_1' },
            loginParams: {}
        }),
        isPrimaryPasswordEnabled: vi.fn(() => false),
        handleLogoutEvent: vi.fn().mockResolvedValue(undefined),
        autoLoginAttempts: new Set(),
        relogin: vi.fn().mockResolvedValue(undefined),
        notifyAutoLoginSuccess: vi.fn(),
        notifyAutoLoginFailed: vi.fn(),
        notifyOffline: vi.fn(),
        flashWindow: vi.fn(),
        isOnline: vi.fn(() => true),
        now: vi.fn(() => 1000)
    };

    return {
        ...deps,
        ...overrides
    };
}

describe('createAuthAutoLoginCoordinator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('returns early when auto-login is already in progress', async () => {
        const deps = makeDeps({
            getIsAttemptingAutoLogin: vi.fn(() => true)
        });
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();

        expect(deps.setAttemptingAutoLogin).not.toHaveBeenCalled();
        expect(deps.getSavedCredentials).not.toHaveBeenCalled();
    });

    test('stops flow when no saved credentials are found', async () => {
        const deps = makeDeps({
            getSavedCredentials: vi.fn().mockResolvedValue(null)
        });
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();

        expect(deps.setAttemptingAutoLogin).toHaveBeenNthCalledWith(1, true);
        expect(deps.setAttemptingAutoLogin).toHaveBeenNthCalledWith(2, false);
        expect(deps.relogin).not.toHaveBeenCalled();
    });

    test('logs out when primary password is enabled', async () => {
        const deps = makeDeps({
            isPrimaryPasswordEnabled: vi.fn(() => true)
        });
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();

        expect(deps.setAttemptingAutoLogin).toHaveBeenNthCalledWith(1, true);
        expect(deps.setAttemptingAutoLogin).toHaveBeenNthCalledWith(2, false);
        expect(deps.handleLogoutEvent).toHaveBeenCalledTimes(1);
        expect(deps.relogin).not.toHaveBeenCalled();
    });

    test('logs out and flashes window when attempts exceed limit', async () => {
        const deps = makeDeps({
            autoLoginAttempts: new Set([100, 200, 300]),
            now: vi.fn(() => 500)
        });
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();

        expect(deps.handleLogoutEvent).toHaveBeenCalledTimes(1);
        expect(deps.flashWindow).toHaveBeenCalledTimes(1);
        expect(deps.relogin).not.toHaveBeenCalled();
    });

    test('runs relogin and success notify on successful auto-login', async () => {
        const deps = makeDeps();
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();
        await flushPromises();

        expect(deps.autoLoginAttempts.has(1000)).toBe(true);
        expect(deps.relogin).toHaveBeenCalledTimes(1);
        expect(deps.notifyAutoLoginSuccess).toHaveBeenCalledTimes(1);
        expect(deps.notifyAutoLoginFailed).not.toHaveBeenCalled();
        expect(deps.setAttemptingAutoLogin).toHaveBeenLastCalledWith(false);
    });

    test('runs failure and offline notifications when relogin fails while offline', async () => {
        const deps = makeDeps({
            relogin: vi.fn().mockRejectedValue(new Error('failed')),
            isOnline: vi.fn(() => false)
        });
        const coordinator = createAuthAutoLoginCoordinator(deps);

        await coordinator.runHandleAutoLoginFlow();
        await flushPromises();

        expect(deps.notifyAutoLoginSuccess).not.toHaveBeenCalled();
        expect(deps.notifyAutoLoginFailed).toHaveBeenCalledTimes(1);
        expect(deps.notifyOffline).toHaveBeenCalledTimes(1);
        expect(deps.setAttemptingAutoLogin).toHaveBeenLastCalledWith(false);
    });
});
