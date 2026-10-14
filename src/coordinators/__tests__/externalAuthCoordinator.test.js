import { describe, expect, test, vi } from 'vitest';
import { createExternalAuthController } from '../externalAuthCoordinator';

function setup() {
    const api = {
        beginExternalLogin: vi.fn().mockResolvedValue({ operationId: 'one', status: 'waiting', provider: 'apple' }),
        openExternalLogin: vi.fn().mockResolvedValue(true),
        cancelExternalLogin: vi.fn().mockResolvedValue(undefined),
        getExternalLoginState: vi
            .fn()
            .mockResolvedValue({ status: 'ready', user: { id: 'usr_test', displayName: 'Tester' } }),
        commitExternalLogin: vi.fn().mockResolvedValue({ id: 'usr_test', displayName: 'Tester' })
    };
    const complete = vi.fn().mockResolvedValue(undefined);
    const busy = vi.fn();
    return { api, complete, busy, controller: createExternalAuthController({ api, complete, busy }) };
}

describe('external auth UI lifecycle', () => {
    test('automatically activates the verified account without sending credentials', async () => {
        const { api, complete, busy, controller } = setup();
        await controller.start('apple', true);
        expect(api.commitExternalLogin).not.toHaveBeenCalled();
        await controller.refresh();
        expect(api.beginExternalLogin).toHaveBeenCalledWith('apple');
        expect(complete).toHaveBeenCalledWith({ id: 'usr_test', displayName: 'Tester' }, 'apple', true);
        expect(controller.state.status).toBe('completed');
        expect(busy).toHaveBeenLastCalledWith(false);
    });

    test('rejects repeated starts while waiting', async () => {
        const { api, controller } = setup();
        await controller.start('apple');
        await controller.start('google');
        expect(api.beginExternalLogin).toHaveBeenCalledTimes(1);
    });

    test('does not open a browser when backend configuration failed', async () => {
        const { api, busy, controller } = setup();
        api.beginExternalLogin.mockResolvedValue({
            status: 'failed',
            error: 'configuration_failed',
            stage: 'configuration',
            httpStatus: 503
        });
        await controller.start('google');
        expect(api.openExternalLogin).not.toHaveBeenCalled();
        expect(controller.state.error).toBe('configuration_failed');
        expect(busy).toHaveBeenLastCalledWith(false);
    });

    test('cancellation ignores a delayed ready response', async () => {
        const { api, controller } = setup();
        await controller.start('apple');
        let resolve;
        api.getExternalLoginState.mockImplementation(
            () =>
                new Promise((done) => {
                    resolve = done;
                })
        );
        const refresh = controller.refresh();
        await controller.cancel();
        resolve({ status: 'ready', user: { id: 'usr_test' } });
        await refresh;
        expect(controller.state.status).toBe('idle');
        expect(controller.state.user).toBeNull();
        expect(api.commitExternalLogin).not.toHaveBeenCalled();
    });

    test('a delayed poll cannot reopen a completed login', async () => {
        const { api, controller } = setup();
        await controller.start('apple');
        let resolve;
        api.getExternalLoginState.mockImplementation(
            () =>
                new Promise((done) => {
                    resolve = done;
                })
        );
        const refresh = controller.refresh();
        api.getExternalLoginState.mockResolvedValue({ status: 'ready', user: { id: 'usr_test' } });
        await controller.refresh();
        resolve({ status: 'ready', user: { id: 'usr_test' } });
        await refresh;
        expect(controller.state.status).toBe('completed');
        expect(api.commitExternalLogin).toHaveBeenCalledOnce();
    });

    test('closes the backend operation if the browser cannot open', async () => {
        const { api, controller } = setup();
        api.openExternalLogin.mockResolvedValue(false);
        await controller.start('apple');
        expect(api.cancelExternalLogin).toHaveBeenCalledOnce();
        expect(controller.state.error).toBe('browser_failed');
    });

    test('an old browser-open failure cannot cancel a newer login', async () => {
        const { api, controller } = setup();
        let resolve;
        api.openExternalLogin.mockImplementationOnce(
            () =>
                new Promise((done) => {
                    resolve = done;
                })
        );
        const oldStart = controller.start('apple');
        await vi.waitFor(() => expect(api.openExternalLogin).toHaveBeenCalledOnce());
        await controller.cancel();
        await controller.start('meta');
        const cancellations = api.cancelExternalLogin.mock.calls.length;
        resolve(false);
        await oldStart;
        expect(controller.state.status).toBe('waiting');
        expect(api.cancelExternalLogin).toHaveBeenCalledTimes(cancellations);
    });

    test('device login does not open a browser and expiry releases the login lock', async () => {
        const { api, busy, controller } = setup();
        await controller.start('device');
        expect(api.openExternalLogin).not.toHaveBeenCalled();
        api.getExternalLoginState.mockResolvedValue({ status: 'expired', verificationUrl: null });
        await controller.refresh();
        expect(controller.state.status).toBe('expired');
        expect(busy).toHaveBeenLastCalledWith(false);
    });

    test('cancelling configuration preparation never starts a late authorization', async () => {
        const { api, complete, busy } = setup();
        let finish;
        const prepare = () =>
            new Promise((resolve) => {
                finish = resolve;
            });
        const controller = createExternalAuthController({ api, complete, busy, prepare });
        const starting = controller.start('google', true);
        expect(controller.state.status).toBe('starting');
        expect(busy).toHaveBeenLastCalledWith(true);
        await controller.cancel();
        finish();
        await starting;
        expect(api.beginExternalLogin).not.toHaveBeenCalled();
        expect(controller.state.status).toBe('idle');
    });

    test('a ready response at start also signs in immediately', async () => {
        const { api, complete, controller } = setup();
        api.beginExternalLogin.mockResolvedValue({
            operationId: 'one',
            status: 'ready',
            provider: 'apple',
            user: { id: 'usr_test' }
        });
        await controller.start('apple');
        expect(api.commitExternalLogin).toHaveBeenCalledOnce();
        expect(complete).toHaveBeenCalledOnce();
        expect(api.openExternalLogin).not.toHaveBeenCalled();
    });

    test('cancelling restores the idle form even if the backend disconnects', async () => {
        const { api, controller } = setup();
        await controller.start('apple');
        api.cancelExternalLogin.mockRejectedValue(new Error('Backend disconnected'));
        await expect(controller.cancel()).resolves.toBeUndefined();
        expect(controller.state.status).toBe('idle');
        expect(controller.state.operationId).toBe('');
        expect(api.commitExternalLogin).not.toHaveBeenCalled();
    });

    test('mismatched activation cannot complete the login', async () => {
        const { api, complete, controller } = setup();
        api.commitExternalLogin.mockResolvedValue({ id: 'usr_different' });
        await controller.start('apple');
        await controller.refresh();
        expect(complete).not.toHaveBeenCalled();
        expect(controller.state.status).toBe('failed');
        expect(controller.state.error).toBe('session_failed');
    });

    test('device authorization automatically activates once and never opens a browser', async () => {
        const { api, complete, controller } = setup();
        api.beginExternalLogin.mockResolvedValue({ operationId: 'one', status: 'waiting', provider: 'device' });
        await controller.start('device', true);
        await Promise.all([controller.refresh(), controller.refresh()]);
        expect(api.openExternalLogin).not.toHaveBeenCalled();
        expect(api.commitExternalLogin).toHaveBeenCalledOnce();
        expect(complete).toHaveBeenCalledWith(expect.objectContaining({ id: 'usr_test' }), 'device', true);
    });
});
