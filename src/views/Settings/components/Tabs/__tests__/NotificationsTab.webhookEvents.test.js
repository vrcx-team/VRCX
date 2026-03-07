import { computed, ref } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const setWebhookEventEnabledMock = vi.fn();
const setAllWebhookEventsEnabledMock = vi.fn();
const resetWebhookEventEnabledDefaultsMock = vi.fn();

const notificationsSettingsRefs = {
    overlayToast: ref('Always'),
    openVR: ref(false),
    overlayNotifications: ref(true),
    xsNotifications: ref(true),
    ovrtHudNotifications: ref(true),
    ovrtWristNotifications: ref(false),
    imageNotifications: ref(true),
    desktopToast: ref('Always'),
    afkDesktopToast: ref(false),
    notificationTTS: ref('Never'),
    notificationTTSNickName: ref(false),
    isTestTTSVisible: ref(false),
    notificationTTSTest: ref(''),
    TTSvoices: ref([]),
    webhookEventExportEnabled: ref(true),
    webhookEventExportUrl: ref('https://example.com'),
    webhookEventExportBearerToken: ref(''),
    webhookEventEnabledMap: ref({
        'friend.online': true,
        'notification.received.dynamic': true
    }),
    webhookEventTestName: ref('vrcx.webhook.test'),
    webhookEventTestPayload: ref('{}')
};

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('../SimpleSwitch.vue', () => ({
    default: {
        name: 'SimpleSwitch',
        props: {
            label: String,
            value: Boolean
        },
        emits: ['change'],
        template:
            '<button class="simple-switch-mock" @click="$emit(\'change\', !value)">{{ label }}</button>'
    }
}));

const storesMockFactory = vi.hoisted(() => () => ({
    useNotificationsSettingsStore: () => ({
        ...notificationsSettingsRefs,
        setOverlayToast: vi.fn(),
        setOpenVR: vi.fn(),
        setOverlayNotifications: vi.fn(),
        setXsNotifications: vi.fn(),
        setOvrtHudNotifications: vi.fn(),
        setOvrtWristNotifications: vi.fn(),
        setImageNotifications: vi.fn(),
        setDesktopToast: vi.fn(),
        setAfkDesktopToast: vi.fn(),
        setNotificationTTSNickName: vi.fn(),
        getTTSVoiceName: vi.fn(() => ''),
        changeTTSVoice: vi.fn(),
        saveNotificationTTS: vi.fn(),
        testNotificationTTS: vi.fn(),
        promptNotificationTimeout: vi.fn(),
        setWebhookEventExportEnabled: vi.fn(),
        setWebhookEventExportUrl: vi.fn(),
        setWebhookEventExportBearerToken: vi.fn(),
        setWebhookEventEnabled: (...args) => setWebhookEventEnabledMock(...args),
        setAllWebhookEventsEnabled: (...args) =>
            setAllWebhookEventsEnabledMock(...args),
        resetWebhookEventEnabledDefaults: (...args) =>
            resetWebhookEventEnabledDefaultsMock(...args),
        testWebhookEventExport: vi.fn()
    }),
    useAdvancedSettingsStore: () => ({
        notificationOpacity: ref(100),
        setNotificationOpacity: vi.fn()
    }),
    useVrStore: () => ({
        saveOpenVROption: vi.fn()
    }),
    useNotificationStore: () => ({
        testNotification: vi.fn()
    })
}));

vi.mock('../../../../stores', storesMockFactory);
vi.mock('../../../../stores/index.js', storesMockFactory);
vi.mock('@/stores', storesMockFactory);

import NotificationsTab from '../NotificationsTab.vue';

describe('NotificationsTab webhook event controls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders grouped webhook event controls', () => {
        const wrapper = shallowMount(NotificationsTab, {
            global: {
                stubs: {
                    FeedFiltersDialog: true,
                    NotificationPositionDialog: true
                }
            }
        });

        expect(wrapper.text()).toContain(
            'view.settings.notifications.notifications.webhook.events.header'
        );
        expect(wrapper.text()).toContain(
            'view.settings.notifications.notifications.webhook.events.categories.friend'
        );
        expect(wrapper.text()).toContain('friend.online');
    });

    test('clicking bulk action buttons invokes store actions', async () => {
        const wrapper = shallowMount(NotificationsTab, {
            global: {
                stubs: {
                    FeedFiltersDialog: true,
                    NotificationPositionDialog: true
                }
            }
        });

        const buttons = wrapper.findAllComponents({ name: 'Button' });
        expect(buttons.length).toBeGreaterThan(3);
        await buttons.at(-3).vm.$emit('click');
        await buttons.at(-2).vm.$emit('click');
        await buttons.at(-1).vm.$emit('click');

        expect(setAllWebhookEventsEnabledMock).toHaveBeenCalledWith(true);
        expect(setAllWebhookEventsEnabledMock).toHaveBeenCalledWith(false);
        expect(resetWebhookEventEnabledDefaultsMock).toHaveBeenCalledTimes(1);
    });

    test('clicking event toggle invokes setWebhookEventEnabled', async () => {
        const wrapper = shallowMount(NotificationsTab, {
            global: {
                stubs: {
                    FeedFiltersDialog: true,
                    NotificationPositionDialog: true
                }
            }
        });

        const toggle = wrapper.findAllComponents({ name: 'SimpleSwitch' }).at(-1);
        expect(toggle).toBeTruthy();
        toggle.vm.$emit('change', false);

        const call = setWebhookEventEnabledMock.mock.calls.at(-1);
        expect(call?.[0]).toEqual(expect.any(String));
        expect(call?.[1]).toBe(false);
    });
});
