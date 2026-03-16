import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    discordStore: {
        setDiscordActive: vi.fn(),
        setDiscordInstance: vi.fn(),
        setDiscordHideInvite: vi.fn(),
        setDiscordJoinButton: vi.fn(),
        setDiscordHideImage: vi.fn(),
        setDiscordShowPlatform: vi.fn(),
        setDiscordWorldIntegration: vi.fn(),
        setDiscordWorldNameAsDiscordStatus: vi.fn(),
        saveDiscordOption: vi.fn(),
        discordActive: { __v_isRef: true, value: true },
        discordInstance: { __v_isRef: true, value: true },
        discordHideInvite: { __v_isRef: true, value: false },
        discordJoinButton: { __v_isRef: true, value: true },
        discordHideImage: { __v_isRef: true, value: false },
        discordShowPlatform: { __v_isRef: true, value: true },
        discordWorldIntegration: { __v_isRef: true, value: true },
        discordWorldNameAsDiscordStatus: { __v_isRef: true, value: false }
    },
    showVRChatConfig: vi.fn()
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));
vi.mock('../../../../../stores', () => ({
    useDiscordPresenceSettingsStore: () => mocks.discordStore,
    useAdvancedSettingsStore: () => ({
        showVRChatConfig: (...a) => mocks.showVRChatConfig(...a)
    })
}));

vi.mock('@/components/ui/switch', () => ({
    Switch: {
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="switch" :data-disabled="disabled || undefined" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>'
    }
}));

vi.mock('../../SettingsGroup.vue', () => ({
    default: { template: '<div><slot /><slot name="description" /></div>' }
}));

vi.mock('../../SettingsItem.vue', () => ({
    default: {
        props: ['label', 'description'],
        template: '<div :data-label="label"><slot /></div>'
    }
}));

import DiscordPresenceTab from '../DiscordPresenceTab.vue';

describe('DiscordPresenceTab.vue', () => {
    beforeEach(() => {
        mocks.discordStore.discordActive.value = true;
        mocks.discordStore.discordInstance.value = true;
        mocks.discordStore.setDiscordActive.mockClear();
        mocks.discordStore.saveDiscordOption.mockClear();
        mocks.showVRChatConfig.mockClear();
    });

    it('opens VRChat config and handles switch changes', async () => {
        const wrapper = mount(DiscordPresenceTab);

        const tooltipRow = wrapper
            .findAll('p')
            .find((node) =>
                node
                    .text()
                    .includes(
                        'view.settings.discord_presence.discord_presence.enable_tooltip'
                    )
            );
        expect(tooltipRow).toBeTruthy();
        await tooltipRow.trigger('click');

        expect(mocks.showVRChatConfig).toHaveBeenCalledTimes(1);

        const switches = wrapper.findAll('[data-testid="switch"]');
        await switches[0].trigger('click');
        expect(mocks.discordStore.setDiscordActive).toHaveBeenCalledTimes(1);
        expect(mocks.discordStore.saveDiscordOption).toHaveBeenCalled();
    });

    it('passes disabled state to dependent switches when discord is disabled', () => {
        mocks.discordStore.discordActive.value = false;
        const wrapper = mount(DiscordPresenceTab);

        const switches = wrapper.findAll('[data-testid="switch"]');
        const worldIntegrationSwitch = switches[1];

        expect(worldIntegrationSwitch?.attributes('data-disabled')).toBe('true');
    });
});
