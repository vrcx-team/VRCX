import { describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('../../../shared/constants', () => ({
    TAG_COLORS: [
        {
            name: 'blue',
            label: 'Blue',
            bg: 'hsl(210 100% 50% / 0.2)',
            text: 'hsl(210 100% 40%)'
        }
    ],
    getTagColor: () => ({
        name: 'blue',
        bg: 'hsl(210 100% 50% / 0.2)',
        text: 'hsl(210 100% 40%)'
    })
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: {
        props: ['open'],
        emits: ['update:open'],
        template: '<div><slot /></div>'
    },
    DialogContent: { template: '<div><slot /></div>' },
    DialogDescription: { template: '<div><slot /></div>' },
    DialogFooter: { template: '<div><slot /></div>' },
    DialogHeader: { template: '<div><slot /></div>' },
    DialogTitle: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/popover', () => ({
    Popover: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button data-testid="button" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/tags-input', () => ({
    TagsInput: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template: '<div><slot /></div>'
    },
    TagsInputInput: {
        template: '<input data-testid="tags-input" />'
    },
    TagsInputItem: {
        props: ['value'],
        template: '<span data-testid="tag-item"><slot />{{ value }}</span>'
    },
    TagsInputItemDelete: { template: '<span>x</span>' },
    TagsInputItemText: { template: '<span />' }
}));

import ManageTagsDialog from '../ManageTagsDialog.vue';

function mountDialog(props = {}) {
    return mount(ManageTagsDialog, {
        props: {
            open: false,
            avatarName: 'Test Avatar',
            avatarId: 'avtr_1',
            initialTags: [],
            ...props
        }
    });
}

describe('ManageTagsDialog.vue', () => {
    test('loads initial tags when dialog opens', async () => {
        const wrapper = mountDialog({
            initialTags: [{ tag: 'cute', color: null }]
        });

        await wrapper.setProps({ open: true });
        await nextTick();

        const tags = wrapper.findAll('[data-testid="tag-item"]');
        expect(tags).toHaveLength(1);
        expect(tags[0].text()).toContain('cute');
    });

    test('emits save payload and closes dialog', async () => {
        const wrapper = mountDialog({
            initialTags: [{ tag: 'cute', color: null }]
        });

        await wrapper.setProps({ open: true });
        await nextTick();

        const okButton = wrapper
            .findAll('[data-testid="button"]')
            .find((node) => node.text().includes('prompt.rename_avatar.ok'));

        expect(okButton).toBeTruthy();
        await okButton.trigger('click');

        expect(wrapper.emitted('save')).toBeTruthy();
        expect(wrapper.emitted('save')[0][0]).toEqual({
            avatarId: 'avtr_1',
            tags: [{ tag: 'cute', color: null }]
        });
        expect(wrapper.emitted('update:open')).toBeTruthy();
        expect(wrapper.emitted('update:open').at(-1)).toEqual([false]);
    });

    test('cancel button closes dialog without save', async () => {
        const wrapper = mountDialog();

        const cancelButton = wrapper
            .findAll('[data-testid="button"]')
            .find((node) => node.text().includes('prompt.rename_avatar.cancel'));

        expect(cancelButton).toBeTruthy();
        await cancelButton.trigger('click');

        expect(wrapper.emitted('save')).toBeFalsy();
        expect(wrapper.emitted('update:open')).toBeTruthy();
        expect(wrapper.emitted('update:open').at(-1)).toEqual([false]);
    });
});
