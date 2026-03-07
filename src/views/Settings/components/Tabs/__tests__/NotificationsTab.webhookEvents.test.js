import { computed, ref } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

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
    webhookEventEnabledMap: ref({ 'friend.online': true }),
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
        setWebhookEventEnabled: vi.fn(),
        setAllWebhookEventsEnabled: vi.fn(),
        resetWebhookEventEnabledDefaults: vi.fn(),
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

    test('renders webhook filter dialog entry button only', () => {
        const wrapper = shallowMount(NotificationsTab, {
            global: {
                stubs: {
                    FeedFiltersDialog: true,
                    NotificationPositionDialog: true,
                    WebhookEventFiltersDialog: true
                }
            }
        });

        expect(wrapper.text()).not.toContain(
            'view.settings.notifications.notifications.webhook.events.categories.friend'
        );
        const dialog = wrapper.find('webhook-event-filters-dialog-stub');
        expect(dialog.exists()).toBe(true);
        expect(dialog.attributes('iswebhookeventfiltersdialogvisible')).toBe(
            'false'
        );
    });

    test('clicking filter button opens webhook event dialog', async () => {
        const wrapper = shallowMount(NotificationsTab, {
            global: {
                stubs: {
                    FeedFiltersDialog: true,
                    NotificationPositionDialog: true,
                    WebhookEventFiltersDialog: true
                }
            }
        });
        const buttons = wrapper.findAllComponents({ name: 'Button' });
        const button = buttons.at(-1);
        expect(button).toBeTruthy();
        await button.vm.$emit('click');
        const dialog = wrapper.find('webhook-event-filters-dialog-stub');
        expect(dialog.exists()).toBe(true);
        expect(dialog.attributes('iswebhookeventfiltersdialogvisible')).toBe(
            'true'
        );
    });
});
