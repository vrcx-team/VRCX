import { ref } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';

const setWebhookEventEnabledMock = vi.fn();
const setAllWebhookEventsEnabledMock = vi.fn();
const resetWebhookEventEnabledDefaultsMock = vi.fn();

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

vi.mock('../../../../stores', () => ({
    useNotificationsSettingsStore: () => ({
        webhookEventEnabledMap: ref({
            'friend.online': true,
            'app.started': false
        }),
        setWebhookEventEnabled: (...args) => setWebhookEventEnabledMock(...args),
        setAllWebhookEventsEnabled: (...args) =>
            setAllWebhookEventsEnabledMock(...args),
        resetWebhookEventEnabledDefaults: (...args) =>
            resetWebhookEventEnabledDefaultsMock(...args)
    })
}));

import WebhookEventFiltersDialog from '../WebhookEventFiltersDialog.vue';

describe('WebhookEventFiltersDialog', () => {
    const dialogStubs = {
        Dialog: { template: '<div><slot /></div>' },
        DialogContent: { template: '<div><slot /></div>' },
        DialogHeader: { template: '<div><slot /></div>' },
        DialogTitle: { template: '<div><slot /></div>' },
        DialogFooter: { template: '<div><slot /></div>' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders webhook event groups and actions', () => {
        const wrapper = shallowMount(WebhookEventFiltersDialog, {
            props: {
                isWebhookEventFiltersDialogVisible: true
            },
            global: { stubs: dialogStubs }
        });

        expect(wrapper.text()).toContain(
            'view.settings.notifications.notifications.webhook.events.categories.friend'
        );
    });

    test('event toggle calls setWebhookEventEnabled', async () => {
        const wrapper = shallowMount(WebhookEventFiltersDialog, {
            props: {
                isWebhookEventFiltersDialogVisible: true
            },
            global: { stubs: dialogStubs }
        });

        const toggle = wrapper.findComponent({ name: 'SimpleSwitch' });
        expect(toggle.exists()).toBe(true);
        await toggle.vm.$emit('change', false);

        expect(setWebhookEventEnabledMock).toHaveBeenCalled();
        const args = setWebhookEventEnabledMock.mock.calls.at(-1);
        expect(args[0]).toEqual(expect.any(String));
        expect(typeof args[1]).toBe('boolean');
    });

    test('bulk actions call store action and close emits update', async () => {
        const wrapper = shallowMount(WebhookEventFiltersDialog, {
            props: {
                isWebhookEventFiltersDialogVisible: true
            },
            global: { stubs: dialogStubs }
        });

        const buttons = wrapper.findAllComponents({ name: 'Button' });
        await buttons.at(0).vm.$emit('click');
        await buttons.at(1).vm.$emit('click');
        await buttons.at(2).vm.$emit('click');
        await buttons.at(3).vm.$emit('click');

        expect(setAllWebhookEventsEnabledMock).toHaveBeenCalledWith(true);
        expect(setAllWebhookEventsEnabledMock).toHaveBeenCalledWith(false);
        expect(resetWebhookEventEnabledDefaultsMock).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('update:isWebhookEventFiltersDialogVisible')).toBeTruthy();
    });
});
