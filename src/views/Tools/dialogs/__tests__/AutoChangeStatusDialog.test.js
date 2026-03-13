import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    generalStore: {
        autoStateChangeEnabled: { __v_isRef: true, value: true },
        autoStateChangeAloneStatus: { __v_isRef: true, value: 'active' },
        autoStateChangeCompanyStatus: { __v_isRef: true, value: 'busy' },
        autoStateChangeInstanceTypes: { __v_isRef: true, value: ['invite'] },
        autoStateChangeNoFriends: { __v_isRef: true, value: false },
        autoStateChangeAloneDescEnabled: { __v_isRef: true, value: false },
        autoStateChangeAloneDesc: { __v_isRef: true, value: '' },
        autoStateChangeCompanyDescEnabled: { __v_isRef: true, value: false },
        autoStateChangeCompanyDesc: { __v_isRef: true, value: '' },
        autoStateChangeGroups: { __v_isRef: true, value: [] },
        autoAcceptInviteRequests: { __v_isRef: true, value: 'Off' },
        autoAcceptInviteGroups: { __v_isRef: true, value: [] },
        setAutoStateChangeEnabled: vi.fn(),
        setAutoStateChangeAloneStatus: vi.fn(),
        setAutoStateChangeCompanyStatus: vi.fn(),
        setAutoStateChangeInstanceTypes: vi.fn(),
        setAutoStateChangeNoFriends: vi.fn(),
        setAutoStateChangeAloneDescEnabled: vi.fn(),
        setAutoStateChangeAloneDesc: vi.fn(),
        setAutoStateChangeCompanyDescEnabled: vi.fn(),
        setAutoStateChangeCompanyDesc: vi.fn(),
        setAutoStateChangeGroups: vi.fn(),
        setAutoAcceptInviteRequests: vi.fn(),
        setAutoAcceptInviteGroups: vi.fn()
    },
    favoriteStore: {
        favoriteFriendGroups: {
            __v_isRef: true,
            value: [{ key: 'grp_a', displayName: 'Group A' }]
        },
        localFriendFavoriteGroups: { __v_isRef: true, value: ['Local A'] }
    }
}));

vi.mock('pinia', async (i) => ({ ...(await i()), storeToRefs: (s) => s }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (k) => k }) }));

vi.mock('../../../../stores', () => ({
    useGeneralSettingsStore: () => mocks.generalStore,
    useFavoriteStore: () => mocks.favoriteStore
}));

vi.mock('../../../../shared/constants', () => ({
    accessTypeLocaleKeyMap: {
        invite: 'access.invite',
        invitePlus: 'access.invite_plus',
        friends: 'access.friends',
        friendsPlus: 'access.friends_plus',
        public: 'access.public',
        groupPublic: 'access.group_public',
        groupPlus: 'access.group_plus',
        groupMembers: 'access.group_members',
        group: 'access.group'
    }
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: {
        emits: ['update:open'],
        template:
            '<div><button data-testid="dialog-close" @click="$emit(\'update:open\', false)" /><slot /></div>'
    },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<h2><slot /></h2>' }
}));

vi.mock('@/components/ui/field', () => ({
    Field: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' },
    FieldGroup: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<div><slot /></div>' },
    FieldSeparator: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/select', () => ({
    Select: { template: '<div><slot /></div>' },
    SelectContent: { template: '<div><slot /></div>' },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectItem: { template: '<div><slot /></div>' },
    SelectSeparator: { template: '<div><slot /></div>' },
    SelectTrigger: { template: '<div><slot /></div>' },
    SelectValue: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/radio-group', () => ({
    RadioGroup: {
        emits: ['update:modelValue'],
        template:
            '<div data-testid="radio-group"><button class="emit-false" @click="$emit(\'update:modelValue\', \'false\')" /><button class="emit-true" @click="$emit(\'update:modelValue\', \'true\')" /><button class="emit-all" @click="$emit(\'update:modelValue\', \'All Favorites\')" /><slot /></div>'
    },
    RadioGroupItem: { template: '<div />' }
}));

vi.mock('@/components/ui/input', () => ({
    Input: { template: '<input />' }
}));

vi.mock('../../../Settings/components/SimpleSwitch.vue', () => ({
    default: {
        props: ['label'],
        emits: ['change'],
        template:
            '<div data-testid="simple-switch" :data-label="label"><button class="emit-true" @click="$emit(\'change\', true)" /><button class="emit-false" @click="$emit(\'change\', false)" /></div>'
    }
}));

import AutoChangeStatusDialog from '../AutoChangeStatusDialog.vue';

describe('AutoChangeStatusDialog.vue', () => {
    beforeEach(() => {
        mocks.generalStore.autoStateChangeNoFriends.value = false;
        mocks.generalStore.autoAcceptInviteRequests.value = 'Off';
        mocks.generalStore.setAutoStateChangeNoFriends.mockClear();
        mocks.generalStore.setAutoAcceptInviteRequests.mockClear();
    });

    it('emits close when dialog is closed', async () => {
        const wrapper = mount(AutoChangeStatusDialog, {
            props: { isAutoChangeStatusDialogVisible: true }
        });

        await wrapper.get('[data-testid="dialog-close"]').trigger('click');

        expect(wrapper.emitted('close')).toEqual([[]]);
    });

    it('handles auto accept switch and alone-condition radio changes', async () => {
        const wrapper = mount(AutoChangeStatusDialog, {
            props: { isAutoChangeStatusDialogVisible: true }
        });

        const autoAcceptSwitch = wrapper
            .findAll('[data-testid="simple-switch"]')
            .find((node) =>
                node
                    .attributes('data-label')
                    ?.includes(
                        'view.settings.general.automation.auto_invite_request_accept'
                    )
            );

        await autoAcceptSwitch.find('.emit-false').trigger('click');
        expect(
            mocks.generalStore.setAutoAcceptInviteRequests
        ).toHaveBeenCalledWith('Off');

        await autoAcceptSwitch.find('.emit-true').trigger('click');
        expect(
            mocks.generalStore.setAutoAcceptInviteRequests
        ).toHaveBeenCalledWith('All Favorites');

        const noFriendsRadio = wrapper.findAll(
            '[data-testid="radio-group"]'
        )[0];
        await noFriendsRadio.find('.emit-false').trigger('click');
        expect(
            mocks.generalStore.setAutoStateChangeNoFriends
        ).not.toHaveBeenCalled();

        await noFriendsRadio.find('.emit-true').trigger('click');
        expect(
            mocks.generalStore.setAutoStateChangeNoFriends
        ).toHaveBeenCalledTimes(1);
    });
});
