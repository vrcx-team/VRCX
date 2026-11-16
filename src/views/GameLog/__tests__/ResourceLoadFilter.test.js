import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('pinia', () => ({ storeToRefs: (store) => store }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key) => key }) }));
vi.mock('@/components/ui/dialog', () => {
    const component = { template: '<div><slot /></div>' };
    return Object.fromEntries(
        [
            'Dialog',
            'DialogTrigger',
            'DialogContent',
            'DialogHeader',
            'DialogTitle',
            'DialogDescription',
            'DialogFooter'
        ].map((name) => [name, component])
    );
});
vi.mock('@/components/ui/button', () => ({ Button: { template: '<button><slot /></button>' } }));
vi.mock('@/components/ui/input', () => ({ Input: { name: 'Input', template: '<input />' } }));
vi.mock('@/components/ui/switch', () => ({ Switch: { name: 'Switch', template: '<input />' } }));
vi.mock('../../../stores', () => ({
    useGameLogStore: () => ({
        resourceLoadFilter: ref({ enabled: false, patterns: ['existing'] }),
        setResourceLoadFilter: mocks.save
    })
}));

import ResourceLoadFilter from '../components/ResourceLoadFilter.vue';

const passthrough = { template: '<div><slot /></div>' };
function render() {
    return mount(ResourceLoadFilter, {
        global: {
            stubs: {
                Dialog: passthrough,
                DialogTrigger: passthrough,
                DialogContent: passthrough,
                DialogHeader: passthrough,
                DialogTitle: passthrough,
                DialogDescription: passthrough,
                DialogFooter: passthrough,
                Button: { template: '<button><slot /></button>' },
                Input: {
                    props: ['modelValue'],
                    emits: ['update:modelValue'],
                    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
                },
                Switch: {
                    props: ['modelValue'],
                    emits: ['update:modelValue'],
                    template:
                        '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
                }
            }
        }
    });
}
function button(wrapper, name) {
    return wrapper.findAll('button').find((entry) => entry.text() === `view.game_log.url_filter.${name}`);
}

describe('ResourceLoadFilter', () => {
    beforeEach(() => mocks.save.mockReset());

    it('edits, adds and removes patterns, then saves the enabled setting', async () => {
        const wrapper = render();
        await button(wrapper, 'title').trigger('click');
        await wrapper.get('input:not([type="checkbox"])').setValue('telemetry\\.vrclinking');
        await button(wrapper, 'add').trigger('click');
        await button(wrapper, 'remove').trigger('click');
        await wrapper.get('input:not([type="checkbox"])').setValue('vr-m\\.net');
        await wrapper.get('input[type="checkbox"]').setValue(true);
        await button(wrapper, 'save').trigger('click');
        await flushPromises();
        expect(mocks.save).toHaveBeenCalledWith({ enabled: true, patterns: ['vr-m\\.net'] });
        expect(wrapper.emitted('saved')).toHaveLength(1);
    });

    it('rejects invalid regex and restores saved patterns after cancel', async () => {
        const wrapper = render();
        await button(wrapper, 'title').trigger('click');
        await wrapper.get('input:not([type="checkbox"])').setValue('[');
        expect(wrapper.get('[role="alert"]').text()).toContain('view.game_log.url_filter.invalid');
        expect(button(wrapper, 'save').attributes('disabled')).toBeDefined();
        await button(wrapper, 'cancel').trigger('click');
        await button(wrapper, 'title').trigger('click');
        expect(wrapper.get('input:not([type="checkbox"])').element.value).toBe('existing');
        expect(mocks.save).not.toHaveBeenCalled();
    });

    it('reports persistence failure without claiming the filter was saved', async () => {
        mocks.save.mockRejectedValueOnce(new Error('disk'));
        const wrapper = render();
        await button(wrapper, 'title').trigger('click');
        await button(wrapper, 'save').trigger('click');
        await flushPromises();
        expect(wrapper.get('[role="alert"]').text()).toBe('view.game_log.url_filter.save_error');
        expect(wrapper.emitted('saved')).toBeUndefined();
    });
});
