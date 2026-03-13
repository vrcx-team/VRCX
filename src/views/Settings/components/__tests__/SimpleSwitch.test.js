import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../../../components/ui/switch', () => ({
    Switch: {
        props: ['modelValue', 'disabled'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="switch" :data-disabled="disabled" @click="$emit(\'update:modelValue\', !modelValue)">switch</button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    Info: { template: '<i data-testid="info" />' }
}));

import SimpleSwitch from '../SimpleSwitch.vue';

describe('SimpleSwitch.vue', () => {
    it('emits change when inner switch updates', async () => {
        const wrapper = mount(SimpleSwitch, {
            props: {
                label: 'Label',
                value: false
            },
            global: {
                stubs: {
                    TooltipWrapper: {
                        template: '<span data-testid="tooltip"><slot /></span>'
                    }
                }
            }
        });

        await wrapper.get('[data-testid="switch"]').trigger('click');
        expect(wrapper.emitted('change')).toEqual([[true]]);
    });

    it('applies long label style and renders tooltip', () => {
        const wrapper = mount(SimpleSwitch, {
            props: {
                label: 'Long',
                value: true,
                longLabel: true,
                tooltip: 'tip',
                disabled: true
            },
            global: {
                stubs: {
                    TooltipWrapper: {
                        template: '<span data-testid="tooltip"><slot /></span>'
                    }
                }
            }
        });

        expect(wrapper.get('.name').attributes('style')).toContain(
            'width: 300px'
        );
        expect(wrapper.find('[data-testid="tooltip"]').exists()).toBe(true);
        expect(
            wrapper.get('[data-testid="switch"]').attributes('data-disabled')
        ).toBe('true');
    });
});
