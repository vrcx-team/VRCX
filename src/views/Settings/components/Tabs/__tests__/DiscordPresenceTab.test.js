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

vi.mock('../../SimpleSwitch.vue', () => ({
    default: {
        props: ['label', 'disabled'],
        emits: ['change'],
        template:
            '<div data-testid="simple-switch" :data-label="label" :data-disabled="disabled"><button class="emit-change" @click="$emit(\'change\', true)" /></div>'
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
            .findAll('div.options-container-item')
            .find((node) =>
                node
                    .text()
                    .includes(
                        'view.settings.discord_presence.discord_presence.enable_tooltip'
                    )
            );
        await tooltipRow.trigger('click');

        expect(mocks.showVRChatConfig).toHaveBeenCalledTimes(1);

        await wrapper.findAll('.emit-change')[0].trigger('click');
        expect(mocks.discordStore.setDiscordActive).toHaveBeenCalledTimes(1);
        expect(mocks.discordStore.saveDiscordOption).toHaveBeenCalled();
    });

    it('passes disabled state to dependent switches when discord is disabled', () => {
        mocks.discordStore.discordActive.value = false;
        const wrapper = mount(DiscordPresenceTab);

        const worldIntegration = wrapper
            .findAll('[data-testid="simple-switch"]')
            .find((node) =>
                node.attributes('data-label')?.includes('world_integration')
            );

        expect(worldIntegration?.attributes('data-disabled')).toBe('true');
    });
});
