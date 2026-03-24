import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, reactive } from 'vue';

import { links } from '../../shared/constants/link';

const mockWatchState = reactive({
    isLoggedIn: false,
    isFriendsLoaded: false,
    isFavoritesLoaded: false
});

const mocks = vi.hoisted(() => ({
    toast: {
        dismiss: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    },
    request: vi.fn(),
    authRequest: {
        getConfig: vi.fn()
    },
    runLoginSuccessFlow: vi.fn(),
    runLogoutFlow: vi.fn(),
    runHandleAutoLoginFlow: vi.fn(),
    getCurrentUser: vi.fn(),
    initWebsocket: vi.fn(),
    advancedSettingsStore: {
        enablePrimaryPassword: false,
        setEnablePrimaryPassword: vi.fn(),
        setEnablePrimaryPasswordConfigRepository: vi.fn(),
        runAvatarAutoCleanup: vi.fn()
    },
    generalSettingsStore: {
        autoLoginDelayEnabled: false,
        autoLoginDelaySeconds: 0
    },
    modalStore: {
        prompt: vi.fn(),
        otpPrompt: vi.fn(),
        confirm: vi.fn(),
        alert: vi.fn()
    },
    updateLoopStore: {
        setNextCurrentUserRefresh: vi.fn(),
        setIpcTimeout: vi.fn()
    },
    userStore: {
        currentUser: {
            id: 'usr_me',
            displayName: 'Tester'
        },
        setUserDialogVisible: vi.fn()
    },
    vrcxStore: {
        waitForDatabaseInit: vi.fn().mockResolvedValue(true)
    },
    configRepository: {
        getString: vi.fn(),
        getBool: vi.fn(),
        setString: vi.fn(),
        setBool: vi.fn(),
        remove: vi.fn()
    },
    webApiService: {
        clearCookies: vi.fn().mockResolvedValue(undefined),
        getCookies: vi.fn().mockResolvedValue([]),
        setCookies: vi.fn().mockResolvedValue(undefined)
    },
    security: {
        encrypt: vi.fn(),
        decrypt: vi.fn()
    },
    notyShow: vi.fn(),
    appDebug: {
        endpointDomain: '',
        websocketDomain: '',
        endpointDomainVrchat: 'https://vrchat.com',
        websocketDomainVrchat: 'wss://pubsub.vrchat.com',
        errorNoty: null
    }
}));

vi.mock('vue-sonner', () => ({
    toast: mocks.toast
}));

vi.mock('noty', () => ({
    default: vi.fn().mockImplementation(function NotyMock() {
        this.show = (...args) => mocks.notyShow(...args);
    })
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('../../services/request', () => ({
    request: (...args) => mocks.request(...args)
}));

vi.mock('../../api', () => ({
    authRequest: mocks.authRequest
}));

vi.mock('../../coordinators/authCoordinator', () => ({
    runLoginSuccessFlow: (...args) => mocks.runLoginSuccessFlow(...args),
    runLogoutFlow: (...args) => mocks.runLogoutFlow(...args)
}));

vi.mock('../../coordinators/authAutoLoginCoordinator', () => ({
    runHandleAutoLoginFlow: (...args) => mocks.runHandleAutoLoginFlow(...args)
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    getCurrentUser: (...args) => mocks.getCurrentUser(...args)
}));

vi.mock('../../services/appConfig', () => ({
    AppDebug: mocks.appDebug,
    isApiLogSuppressed: vi.fn(() => true),
    logWebRequest: vi.fn()
}));

vi.mock('../../shared/utils', () => ({
    escapeTag: (value) => value
}));

vi.mock('../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(undefined);
            }
        }
    )
}));

vi.mock('../../services/security', () => ({
    default: mocks.security
}));

vi.mock('../../services/webapi', () => ({
    default: mocks.webApiService
}));

vi.mock('../../services/watchState', () => ({
    watchState: mockWatchState
}));

vi.mock('../../services/config', () => ({
    default: mocks.configRepository
}));

vi.mock('../../services/websocket', () => ({
    initWebsocket: (...args) => mocks.initWebsocket(...args),
    closeWebSocket: vi.fn()
}));

vi.mock('../../stores/settings/advanced', () => ({
    useAdvancedSettingsStore: () => mocks.advancedSettingsStore
}));

vi.mock('../../stores/settings/general', () => ({
    useGeneralSettingsStore: () => mocks.generalSettingsStore
}));

vi.mock('../../stores/modal', () => ({
    useModalStore: () => mocks.modalStore
}));

vi.mock('../../stores/updateLoop', () => ({
    useUpdateLoopStore: () => mocks.updateLoopStore
}));

vi.mock('../../stores/user', () => ({
    useUserStore: () => mocks.userStore
}));

vi.mock('../../stores/vrcx', () => ({
    useVrcxStore: () => mocks.vrcxStore
}));

vi.mock('worker-timers', () => ({
    setTimeout: vi.fn()
}));

function flushPromises() {
    return Promise.resolve().then(() => Promise.resolve());
}

function makeAuthError(message, status = 401) {
    const err = new Error(message);
    err.status = status;
    err.endpoint = 'auth/user';
    return err;
}

async function createAuthStore() {
    setActivePinia(createPinia());
    const { useAuthStore } = await import('../auth');
    const store = useAuthStore();
    await flushPromises();
    return store;
}

async function failManualLogin(store, error) {
    mocks.authRequest.getConfig.mockResolvedValueOnce({ json: {} });
    mocks.request.mockRejectedValueOnce(error);
    await store.login().catch(() => {});
    await flushPromises();
}

async function failSavedAccountLogin(store, error, overrides = {}) {
    const savedUser = {
        user: { id: 'usr_saved', displayName: 'Saved User' },
        loginParams: {
            username: 'saved@example.com',
            password: 'password',
            endpoint: '',
            websocket: '',
            ...overrides
        }
    };
    mocks.authRequest.getConfig.mockResolvedValueOnce({ json: {} });
    mocks.request.mockRejectedValueOnce(error);
    await store.relogin(savedUser).catch(() => {});
    await flushPromises();
}

async function succeedManualLogin(store) {
    mocks.authRequest.getConfig.mockResolvedValueOnce({ json: {} });
    mocks.request.mockResolvedValueOnce({
        id: 'usr_me',
        displayName: 'Tester'
    });
    await store.login().catch(() => {});
    mockWatchState.isLoggedIn = true;
    await nextTick();
    await flushPromises();
}

describe('useAuthStore login failure toast policy', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-23T00:00:00.000Z'));
        vi.clearAllMocks();

        mocks.configRepository.getString.mockImplementation(
            (_key, defaultValue = '') => Promise.resolve(defaultValue)
        );
        mocks.configRepository.getBool.mockImplementation(
            (_key, defaultValue = false) => Promise.resolve(defaultValue)
        );
        mocks.configRepository.setString.mockResolvedValue(undefined);
        mocks.configRepository.setBool.mockResolvedValue(undefined);
        mocks.configRepository.remove.mockResolvedValue(undefined);
        mocks.authRequest.getConfig.mockResolvedValue({ json: {} });
        mocks.request.mockReset();
        mocks.request.mockResolvedValue({});
        mocks.toast.warning.mockReturnValue('login-network-issue-toast');
        mocks.runLoginSuccessFlow.mockReset();
        mocks.runLogoutFlow.mockReset();
        mocks.runHandleAutoLoginFlow.mockReset();
        mocks.getCurrentUser.mockReset();
        mocks.initWebsocket.mockReset();
        mocks.notyShow.mockReset();
        mocks.toast.warning.mockReset();
        mocks.toast.warning.mockReturnValue('login-network-issue-toast');
        mocks.toast.success.mockReset();
        mocks.toast.error.mockReset();
        mocks.toast.info.mockReset();
        mocks.toast.dismiss.mockReset();
        mocks.advancedSettingsStore.enablePrimaryPassword = false;
        mockWatchState.isLoggedIn = false;
        mockWatchState.isFriendsLoaded = false;
        mockWatchState.isFavoritesLoaded = false;
        mocks.userStore.currentUser = {
            id: 'usr_me',
            displayName: 'Tester'
        };
        mocks.vrcxStore.waitForDatabaseInit.mockResolvedValue(true);

        globalThis.AppApi = {
            CheckGameRunning: vi.fn(),
            FlashWindow: vi.fn(),
            IPCAnnounceStart: vi.fn(),
            OpenLink: vi.fn()
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('shows a single warning toast on the third manual login failure inside 90 seconds', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:30.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).not.toHaveBeenCalled();

        vi.setSystemTime(new Date('2026-03-23T00:01:00.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).toHaveBeenCalledTimes(1);
        expect(mocks.toast.warning).toHaveBeenCalledWith(
            'message.auth.login_network_issue_hint_title',
            expect.objectContaining({
                description: 'message.auth.login_network_issue_hint_description',
                duration: Infinity,
                action: expect.objectContaining({
                    label: 'common.actions.open',
                    onClick: expect.any(Function)
                })
            })
        );
        mocks.toast.warning.mock.calls[0][1].action.onClick();
        expect(globalThis.AppApi.OpenLink).toHaveBeenCalledWith(
            links.troubleshootingAuthUserConnectionIssues
        );
    });

    test('does not count explicit password errors toward the warning threshold', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:20.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:40.000Z'));
        await failManualLogin(
            store,
            makeAuthError('Invalid Username/Email or Password', 401)
        );

        expect(mocks.toast.warning).not.toHaveBeenCalled();
    });

    test('does not trigger the warning during auto-login retries', async () => {
        const store = await createAuthStore();
        store.setAttemptingAutoLogin(true);

        const savedUser = {
            user: { id: 'usr_me', displayName: 'Tester' },
            loginParams: {
                username: 'tester@example.com',
                password: 'password',
                endpoint: '',
                websocket: ''
            }
        };

        mocks.authRequest.getConfig.mockResolvedValue({ json: {} });
        mocks.request.mockRejectedValueOnce(makeAuthError('Unauthorized', 401));
        await store.relogin(savedUser).catch(() => {});
        await flushPromises();

        expect(mocks.toast.warning).not.toHaveBeenCalled();
        expect(mocks.runHandleAutoLoginFlow).not.toHaveBeenCalled();
    });

    test('counts saved-account relogin failures together with manual login failures', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:30.000Z'));
        await failSavedAccountLogin(store, makeAuthError('Unauthorized', 401), {
            username: 'tester@example.com'
        });

        expect(mocks.toast.warning).not.toHaveBeenCalled();

        vi.setSystemTime(new Date('2026-03-23T00:01:00.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).toHaveBeenCalledTimes(1);
    });

    test('resets the failure window after a successful login', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:30.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:01:00.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).toHaveBeenCalledTimes(1);

        vi.setSystemTime(new Date('2026-03-23T00:01:05.000Z'));
        await succeedManualLogin(store);
        expect(mocks.toast.dismiss).toHaveBeenCalledWith(
            'login-network-issue-toast'
        );

        mocks.toast.warning.mockClear();
        mocks.toast.dismiss.mockClear();

        mockWatchState.isLoggedIn = false;
        await nextTick();

        vi.setSystemTime(new Date('2026-03-23T00:01:10.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:01:30.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).not.toHaveBeenCalled();
    });

    test('resets the failure window when the user edits the login form', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:20.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        expect(mocks.toast.warning).not.toHaveBeenCalled();

        store.loginForm.username = 'tester2@example.com';
        await nextTick();

        vi.setSystemTime(new Date('2026-03-23T00:00:35.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).not.toHaveBeenCalled();
    });

    test('dismisses the sticky warning when credentials change before the next submit', async () => {
        const store = await createAuthStore();
        store.loginForm.username = 'tester@example.com';
        store.loginForm.password = 'password';

        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:00:30.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));
        vi.setSystemTime(new Date('2026-03-23T00:01:00.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.warning).toHaveBeenCalledTimes(1);

        store.loginForm.password = 'new-password';
        vi.setSystemTime(new Date('2026-03-23T00:01:10.000Z'));
        await failManualLogin(store, makeAuthError('Unauthorized', 401));

        expect(mocks.toast.dismiss).toHaveBeenCalledWith(
            'login-network-issue-toast'
        );
        expect(mocks.toast.warning).toHaveBeenCalledTimes(1);
    });
});
