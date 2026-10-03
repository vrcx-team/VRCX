import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, KeepAlive, ref } from 'vue';

const mocks = vi.hoisted(() => ({
    markAllAsSeen: vi.fn(),
    testNotification: vi.fn()
}));

vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal()),
    useI18n: () => ({ t: (key) => key })
}));

vi.mock('@/stores', async () => {
    const { defineStore } = await import('pinia');
    const { ref } = await import('vue');
    const noop = () => {};

    return {
        useNotificationStore: defineStore('settings-test-notifications', () => {
            const unseenNotifications = ref([]);
            return {
                unseenNotifications,
                markAllAsSeen: () => {
                    mocks.markAllAsSeen();
                    unseenNotifications.value = [];
                },
                testNotification: (...args) => mocks.testNotification(...args)
            };
        }),
        useNotificationsSettingsStore: defineStore('settings-test-notification-preferences', () => ({
            desktopToast: ref('Always'),
            afkDesktopToast: ref(false),
            notificationTTS: ref('Never'),
            notificationTTSNickName: ref(false),
            isTestTTSVisible: ref(false),
            notificationTTSTest: ref(''),
            TTSvoices: ref([{ name: 'English' }]),
            setDesktopToast: noop,
            setAfkDesktopToast: noop,
            setNotificationTTSNickName: noop,
            getTTSVoiceName: () => 'English',
            changeTTSVoice: noop,
            saveNotificationTTS: noop,
            testNotificationTTS: noop
        }))
    };
});

vi.mock('../components/Tabs/SystemTab.vue', () => ({
    default: { template: '<div>System settings</div>' }
}));
vi.mock('../components/Tabs/InterfaceTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/Tabs/SocialTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/Tabs/VrTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/Tabs/MediaTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/Tabs/IntegrationsTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../components/Tabs/AdvancedTab.vue', () => ({ default: { template: '<div />' } }));
vi.mock('../dialogs/FeedFiltersDialog.vue', () => ({ default: { template: '<div />' } }));

import { useNotificationStore } from '@/stores';
import Settings from '../Settings.vue';
import NotificationsTab from '../components/Tabs/NotificationsTab.vue';

describe('Settings.vue notification read state', () => {
    let pinia;
    let notificationStore;
    let wrapper;
    const unreadIds = ['notification-invite', 'notification-friend-request'];

    beforeEach(() => {
        mocks.markAllAsSeen.mockClear();
        mocks.testNotification.mockClear();
        pinia = createPinia();
        setActivePinia(pinia);
        notificationStore = useNotificationStore();
        notificationStore.unseenNotifications = [...unreadIds];
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = null;
    });

    async function openSettings(component = Settings) {
        wrapper = mount(component, {
            attachTo: document.body,
            global: {
                plugins: [pinia],
                stubs: {
                    Select: true,
                    Switch: true,
                    InputGroupTextareaField: true
                }
            }
        });
        await flushPromises();
    }

    function getTab(value) {
        const tab = wrapper.findAll('[role="tab"]').find((item) => item.text() === `view.settings.category.${value}`);
        expect(tab).toBeDefined();
        return tab;
    }

    function getNotificationsPanel() {
        return wrapper.get(`[id="${getTab('notifications').attributes('aria-controls')}"]`);
    }

    async function selectTab(value) {
        await getTab(value).trigger('mousedown', { button: 0, ctrlKey: false });
        await flushPromises();
        expect(getTab(value).attributes('aria-selected')).toBe('true');
    }

    function expectUnreadPreserved(expectedIds = unreadIds) {
        expect(mocks.markAllAsSeen).not.toHaveBeenCalled();
        expect(notificationStore.unseenNotifications).toEqual(expectedIds);
    }

    it('mounts the hidden notification settings without marking unread notifications as seen', async () => {
        await openSettings();

        expect(getTab('system').attributes('aria-selected')).toBe('true');
        expect(wrapper.findComponent(NotificationsTab).exists()).toBe(true);
        expect(getNotificationsPanel().attributes('data-state')).toBe('inactive');
        expect(getNotificationsPanel().element.hidden).toBe(true);
        expectUnreadPreserved();
    });

    it('preserves unread notifications across repeated settings tab changes', async () => {
        await openSettings();
        await selectTab('notifications');
        expect(getNotificationsPanel().element.hidden).toBe(false);
        expectUnreadPreserved();

        await selectTab('interface');
        expect(getNotificationsPanel().element.hidden).toBe(true);
        expectUnreadPreserved();

        await selectTab('notifications');
        expect(getNotificationsPanel().element.hidden).toBe(false);
        expectUnreadPreserved();
    });

    it('still sends a test notification from the notification settings button', async () => {
        await openSettings();
        await selectTab('notifications');
        const button = getNotificationsPanel()
            .findAll('button')
            .find((item) => item.text() === 'view.settings.notifications.notifications.test_notification');

        expect(button).toBeDefined();
        await button.trigger('click');

        expect(mocks.testNotification).toHaveBeenCalledOnce();
    });

    it('preserves new unread notifications when returning to cached settings', async () => {
        const showSettings = ref(true);
        const OtherPage = defineComponent({ render: () => h('div', 'Other page') });
        const CachedSettings = defineComponent({
            setup: () => () =>
                h(KeepAlive, null, {
                    default: () => (showSettings.value ? h(Settings) : h(OtherPage))
                })
        });

        await openSettings(CachedSettings);
        const settingsElement = wrapper.getComponent(Settings).element;
        await selectTab('notifications');
        expectUnreadPreserved();

        showSettings.value = false;
        await flushPromises();
        expect(wrapper.findComponent(Settings).exists()).toBe(false);
        expect(wrapper.text()).toContain('Other page');
        expectUnreadPreserved();

        const newUnreadId = 'notification-received-while-away';
        notificationStore.unseenNotifications.push(newUnreadId);
        const expectedUnreadIds = [...unreadIds, newUnreadId];
        showSettings.value = true;
        await flushPromises();

        expect(wrapper.getComponent(Settings).element).toBe(settingsElement);
        expect(getTab('notifications').attributes('aria-selected')).toBe('true');
        expect(getNotificationsPanel().element.hidden).toBe(false);
        expectUnreadPreserved(expectedUnreadIds);

        wrapper.unmount();
        wrapper = null;
        expectUnreadPreserved(expectedUnreadIds);
    });
});
