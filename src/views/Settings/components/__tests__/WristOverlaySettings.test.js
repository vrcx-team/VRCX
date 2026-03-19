import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    notificationsStore: {
        openVR: { value: true },
        setOpenVR: vi.fn()
    },
    wristStore: {
        overlayWrist: { value: true },
        hidePrivateFromFeed: { value: false },
        overlaybutton: { value: false },
        overlayHand: { value: '1' },
        vrBackgroundEnabled: { value: false },
        minimalFeed: { value: false },
        hideDevicesFromFeed: { value: false },
        vrOverlayCpuUsage: { value: false },
        hideUptimeFromFeed: { value: false },
        pcUptimeOnFeed: { value: false },
        setOverlayWrist: vi.fn(),
        setHidePrivateFromFeed: vi.fn(),
        setOverlaybutton: vi.fn(),
        setOverlayHand: vi.fn(),
        setVrBackgroundEnabled: vi.fn(),
        setMinimalFeed: vi.fn(),
        setHideDevicesFromFeed: vi.fn(),
        setVrOverlayCpuUsage: vi.fn(),
        setHideUptimeFromFeed: vi.fn(),
        setPcUptimeOnFeed: vi.fn()
    },
    saveOpenVROption: vi.fn()
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));

vi.mock('../../../../stores', () => ({
    useNotificationsSettingsStore: () => mocks.notificationsStore,
    useWristOverlaySettingsStore: () => mocks.wristStore,
    useVrStore: () => ({
        saveOpenVROption: (...a) => mocks.saveOpenVROption(...a)
    })
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        props: ['disabled'],
        emits: ['click'],
        template:
            '<button data-testid="filters-btn" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/switch', () => ({
    Switch: {
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="switch" :data-disabled="disabled || undefined" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>'
    }
}));

vi.mock('../../../../components/ui/radio-group', () => ({
    RadioGroup: {
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template:
            '<div data-testid="radio-group" :data-disabled="disabled"><button data-testid="radio-false" @click="$emit(\'update:modelValue\', \'false\')" /><button data-testid="radio-true" @click="$emit(\'update:modelValue\', \'true\')" /><slot /></div>'
    },
    RadioGroupItem: { template: '<div />' }
}));

vi.mock('../../../../components/ui/toggle-group', () => ({
    ToggleGroup: {
        emits: ['update:model-value'],
        template:
            '<div data-testid="toggle-group"><button data-testid="toggle-right" @click="$emit(\'update:model-value\', \'2\')" /><slot /></div>'
    },
    ToggleGroupItem: { template: '<div><slot /></div>' }
}));

vi.mock('../SettingsGroup.vue', () => ({
    default: { template: '<div><slot /><slot name="description" /></div>' }
}));

vi.mock('../SettingsItem.vue', () => ({
    default: { template: '<div><slot /></div>' }
}));

import WristOverlaySettings from '../WristOverlaySettings.vue';

describe('WristOverlaySettings.vue', () => {
    beforeEach(() => {
        mocks.notificationsStore.openVR.value = true;
        mocks.wristStore.overlayWrist.value = true;
        mocks.wristStore.overlaybutton.value = false;
        mocks.wristStore.setOverlayWrist.mockClear();
        mocks.wristStore.setHidePrivateFromFeed.mockClear();
        mocks.wristStore.setOverlaybutton.mockClear();
        mocks.wristStore.setOverlayHand.mockClear();
        mocks.saveOpenVROption.mockClear();
    });

    it('emits open-feed-filters and handles switch/radio/toggle updates', async () => {
        const wrapper = mount(WristOverlaySettings);

        // Feed filters button emits event
        await wrapper.get('[data-testid="filters-btn"]').trigger('click');
        expect(wrapper.emitted('open-feed-filters')).toBeTruthy();

        // First switch is now overlayWrist (SteamVR Overlay moved to VrTab)
        const switches = wrapper.findAll('[data-testid="switch"]');
        await switches[0].trigger('click');
        expect(mocks.wristStore.setOverlayWrist).toHaveBeenCalledTimes(1);
        expect(mocks.saveOpenVROption).toHaveBeenCalled();

        // First (and only) radio group is now overlay button (Start Overlay With moved to VrTab)
        const radioGroups = wrapper.findAll('[data-testid="radio-group"]');
        await radioGroups[0].get('[data-testid="radio-true"]').trigger('click');
        expect(mocks.wristStore.setOverlaybutton).toHaveBeenCalledTimes(1);

        // Toggle group for overlay hand
        await wrapper.get('[data-testid="toggle-right"]').trigger('click');
        expect(mocks.wristStore.setOverlayHand).toHaveBeenCalledWith('2');
    });

    it('does not toggle overlaybutton when the value is unchanged', async () => {
        mocks.wristStore.overlaybutton.value = true;
        const wrapper = mount(WristOverlaySettings);

        const firstRadio = wrapper.findAll('[data-testid="radio-group"]')[0];
        await firstRadio.get('[data-testid="radio-true"]').trigger('click');

        expect(mocks.wristStore.setOverlaybutton).not.toHaveBeenCalled();
    });
});
