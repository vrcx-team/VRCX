import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    avatarRemoteDatabaseProviderList: require('vue').ref([]),
    saveAvatarProviderList: vi.fn(),
    removeAvatarProvider: vi.fn()
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../../stores', () => ({
    useAvatarProviderStore: () => ({
        avatarRemoteDatabaseProviderList: mocks.avatarRemoteDatabaseProviderList,
        saveAvatarProviderList: (...args) => mocks.saveAvatarProviderList(...args),
        removeAvatarProvider: (...args) => mocks.removeAvatarProvider(...args)
    })
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: {
        props: ['open'],
        emits: ['update:open'],
        template:
            '<div data-testid="dialog" v-if="open">' +
            '<button data-testid="close-dialog" @click="$emit(\'update:open\', false)">close</button>' +
            '<slot />' +
            '</div>'
    },
    DialogContent: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<h2><slot /></h2>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button data-testid="add-provider" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/input-group', () => ({
    InputGroupAction: {
        props: ['modelValue', 'size'],
        emits: ['update:modelValue', 'change'],
        template:
            '<div class="provider-row">' +
            '<input data-testid="provider-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\')" />' +
            '<slot name="actions" />' +
            '</div>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    Trash2: {
        emits: ['click'],
        template: '<button data-testid="trash" @click="$emit(\'click\')">trash</button>'
    }
}));

import AvatarProviderDialog from '../AvatarProviderDialog.vue';

function mountComponent(props = {}) {
    return mount(AvatarProviderDialog, {
        props: {
            isAvatarProviderDialogVisible: true,
            ...props
        }
    });
}

describe('AvatarProviderDialog.vue', () => {
    beforeEach(() => {
        mocks.avatarRemoteDatabaseProviderList.value = ['https://a.example', 'https://b.example'];
        mocks.saveAvatarProviderList.mockReset();
        mocks.removeAvatarProvider.mockReset();
    });

    test('renders provider rows when dialog is visible', () => {
        const wrapper = mountComponent();

        expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
        expect(wrapper.findAll('.provider-row')).toHaveLength(2);
    });

    test('emits close when dialog open updates to false', async () => {
        const wrapper = mountComponent();

        await wrapper.get('[data-testid="close-dialog"]').trigger('click');

        expect(wrapper.emitted('update:isAvatarProviderDialogVisible')).toEqual([[false]]);
    });

    test('adds empty provider entry when add button clicked', async () => {
        const wrapper = mountComponent();

        await wrapper.get('[data-testid="add-provider"]').trigger('click');

        expect(mocks.avatarRemoteDatabaseProviderList.value).toEqual([
            'https://a.example',
            'https://b.example',
            ''
        ]);
    });

    test('calls saveAvatarProviderList on provider input change', async () => {
        const wrapper = mountComponent();

        const input = wrapper.findAll('[data-testid="provider-input"]')[0];
        await input.setValue('https://updated.example');

        expect(mocks.avatarRemoteDatabaseProviderList.value[0]).toBe('https://updated.example');
        expect(mocks.saveAvatarProviderList).toHaveBeenCalledTimes(1);
    });

    test('calls removeAvatarProvider with row provider when trash clicked', async () => {
        const wrapper = mountComponent();

        await wrapper.findAll('[data-testid="trash"]')[1].trigger('click');

        expect(mocks.removeAvatarProvider).toHaveBeenCalledWith('https://b.example');
    });
});
