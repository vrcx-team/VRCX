import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

import StatusBar from '../StatusBar.vue';
import en from '../../localization/en.json';

// --- Mocks ---

vi.mock('../../services/config', () => ({
    default: {
        init: vi.fn(),
        getString: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? '{}'),
        setString: vi.fn(),
        getBool: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? false),
        setBool: vi.fn(),
        getInt: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? 0),
        setInt: vi.fn(),
        getFloat: vi
            .fn()
            .mockImplementation((_key, defaultValue) => defaultValue ?? 0),
        setFloat: vi.fn(),
        getObject: vi.fn().mockReturnValue(null),
        setObject: vi.fn(),
        getArray: vi.fn().mockReturnValue([]),
        setArray: vi.fn(),
        remove: vi.fn()
    }
}));

vi.mock('../../services/websocket', () => ({
    wsState: { connected: false, messageCount: 0, bytesReceived: 0 },
    initWebsocket: vi.fn(),
    closeWebSocket: vi.fn(),
    reconnectWebSocket: vi.fn()
}));

vi.mock('../../services/webapi', () => ({
    default: {
        execute: vi.fn().mockResolvedValue({
            status: 200,
            data: JSON.stringify({
                page: { updated_at: '2026-01-01T00:00:00.000Z' },
                status: { description: 'All Systems Operational' }
            })
        })
    }
}));

vi.mock('worker-timers', () => ({
    setInterval: vi.fn(),
    clearInterval: vi.fn(),
    setTimeout: vi.fn(),
    clearTimeout: vi.fn()
}));

vi.mock('../../services/jsonStorage', () => ({
    default: vi.fn()
}));
vi.mock('../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('../../services/database', () => ({
    database: new Proxy(
        {},
        {
            get: (_target, prop) => {
                if (prop === '__esModule') return false;
                return vi.fn().mockResolvedValue(null);
            }
        }
    )
}));
vi.mock('../../plugins/router', () => ({
    router: {
        beforeEach: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        currentRoute: ref({ path: '/', name: '', meta: {} }),
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));
vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: vi.fn(() => ({
            push: vi.fn(),
            replace: vi.fn(),
            currentRoute: ref({ path: '/', name: '', meta: {} })
        }))
    };
});
vi.mock('../../plugins/interopApi', () => ({
    initInteropApi: vi.fn()
}));

const i18n = createI18n({
    locale: 'en',
    fallbackLocale: 'en',
    legacy: false,
    globalInjection: false,
    missingWarn: false,
    fallbackWarn: false,
    messages: { en }
});

const stubs = {
    TooltipWrapper: {
        template: '<span data-testid="tooltip"><slot /></span>',
        props: [
            'content',
            'disabled',
            'delayDuration',
            'delay-duration',
            'side'
        ]
    },
    ContextMenu: { template: '<div><slot /></div>' },
    ContextMenuTrigger: { template: '<div><slot /></div>' },
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuCheckboxItem: {
        template: '<div><slot /></div>',
        props: ['modelValue']
    },
    ContextMenuSeparator: { template: '<div />' },
    ContextMenuSub: { template: '<div><slot /></div>' },
    ContextMenuSubTrigger: { template: '<div><slot /></div>' },
    ContextMenuSubContent: { template: '<div><slot /></div>' },
    ContextMenuRadioGroup: {
        template: '<div><slot /></div>',
        props: ['modelValue']
    },
    ContextMenuRadioItem: { template: '<div><slot /></div>', props: ['value'] },
    HoverCard: {
        template: '<div data-testid="hover-card"><slot /></div>',
        props: ['open']
    },
    HoverCardTrigger: {
        template: '<div data-testid="hover-card-trigger"><slot /></div>'
    },
    HoverCardContent: {
        template: '<div data-testid="hover-card-content"><slot /></div>',
        props: ['class', 'side', 'align', 'sideOffset']
    },
    Popover: { template: '<div><slot /></div>', props: ['open'] },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: {
        template: '<div><slot /></div>',
        props: ['class', 'side', 'align']
    },
    Select: { template: '<div><slot /></div>', props: ['modelValue'] },
    SelectTrigger: { template: '<div><slot /></div>', props: ['size'] },
    SelectValue: { template: '<span />', props: ['placeholder'] },
    SelectContent: { template: '<div><slot /></div>', props: ['class'] },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectItem: { template: '<div><slot /></div>', props: ['value'] },
    NumberField: {
        template: '<div><slot /></div>',
        props: ['modelValue', 'step', 'formatOptions', 'class']
    },
    NumberFieldContent: { template: '<div><slot /></div>' },
    NumberFieldDecrement: { template: '<button />' },
    NumberFieldIncrement: { template: '<button />' },
    NumberFieldInput: { template: '<input />', props: ['class'] }
};

/**
 *
 * @param storeOverrides
 */
function mountStatusBar(storeOverrides = {}) {
    return mount(StatusBar, {
        global: {
            plugins: [
                i18n,
                createTestingPinia({
                    stubActions: true,
                    initialState: {
                        Game: {
                            isGameRunning: false,
                            isSteamVRRunning: false,
                            lastSessionDurationMs: 0,
                            lastOfflineAt: 0,
                            ...storeOverrides.Game
                        },
                        Vrcx: {
                            proxyServer: '',
                            appStartAt: Date.now(),
                            ...storeOverrides.Vrcx
                        },
                        VrcStatus: {
                            lastStatus: '',
                            lastStatusTime: null,
                            lastStatusSummary: '',
                            ...storeOverrides.VrcStatus
                        },
                        User: {
                            currentUser: {
                                $online_for: Date.now()
                            },
                            ...storeOverrides.User
                        },
                        GeneralSettings: {
                            ...storeOverrides.GeneralSettings
                        }
                    }
                })
            ],
            stubs
        }
    });
}

describe('StatusBar.vue - Servers indicator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('shows "Game" label instead of "VRChat" for game running indicator', () => {
        const wrapper = mountStatusBar({ Game: { isGameRunning: true } });
        expect(wrapper.text()).toContain('Game');
    });

    test('shows Servers indicator with green dot when no issues', () => {
        const wrapper = mountStatusBar();
        expect(wrapper.text()).toContain('Servers');
        const serversDots = wrapper.findAll('.bg-status-online');
        expect(serversDots.length).toBeGreaterThan(0);
        expect(wrapper.find('.bg-\\[\\#e6a23c\\]').exists()).toBe(false);
    });

    test('shows Servers indicator with yellow dot when there is an issue', () => {
        const wrapper = mountStatusBar({
            VrcStatus: {
                lastStatus: 'Partial System Outage'
            }
        });
        expect(wrapper.text()).toContain('Servers');
        expect(wrapper.find('.bg-\\[\\#e6a23c\\]').exists()).toBe(true);
    });

    test('shows HoverCard content with status text when there is an issue', () => {
        const wrapper = mountStatusBar({
            VrcStatus: {
                lastStatus: 'Partial System Outage',
                lastStatusSummary: 'API, CDN'
            }
        });
        const hoverContent = wrapper.find('[data-testid="hover-card-content"]');
        expect(hoverContent.exists()).toBe(true);
        expect(hoverContent.text()).toContain('VRChat Server Issues');
    });

    test('does not show HoverCard content when no issues', () => {
        const wrapper = mountStatusBar();
        const hoverContent = wrapper.find('[data-testid="hover-card-content"]');
        expect(hoverContent.exists()).toBe(false);
    });

    test('shows Servers indicator in context menu', () => {
        const wrapper = mountStatusBar();
        const text = wrapper.text();
        expect(text).toContain('Servers');
    });

    test('shows SteamVR indicator', () => {
        const wrapper = mountStatusBar({ Game: { isSteamVRRunning: true } });
        expect(wrapper.text()).toContain('SteamVR');
    });

    test('shows last game session details when game is offline and there is session data', () => {
        const wrapper = mountStatusBar({
            Game: {
                isGameRunning: false,
                lastSessionDurationMs: 3_600_000,
                lastOfflineAt: new Date('2026-03-13T14:30:00Z').getTime()
            }
        });

        expect(wrapper.text()).toContain('Last Session');
        expect(wrapper.text()).toContain('Offline Since');
    });
});
