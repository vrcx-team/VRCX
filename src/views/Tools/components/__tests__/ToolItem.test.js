import { describe, expect, test, vi } from 'vitest';
import { defineComponent, markRaw } from 'vue';
import { mount } from '@vue/test-utils';

import ToolItem from '../ToolItem.vue';

describe('ToolItem.vue', () => {
    test('renders icon, title and description', () => {
        const MockIcon = defineComponent({
            template: '<svg data-test="mock-icon" />'
        });

        const wrapper = mount(ToolItem, {
            props: {
                icon: markRaw(MockIcon),
                title: 'Test title',
                description: 'Test description'
            }
        });

        expect(wrapper.find('[data-test="mock-icon"]').exists()).toBe(true);
        expect(wrapper.text()).toContain('Test title');
        expect(wrapper.text()).toContain('Test description');
    });

    test('forwards click handler from parent', async () => {
        const onClick = vi.fn();

        const wrapper = mount(ToolItem, {
            props: {
                icon: markRaw(defineComponent({ template: '<svg />' })),
                title: 'Clickable title',
                description: 'Clickable description'
            },
            attrs: {
                onClick
            }
        });

        await wrapper.trigger('click');

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
