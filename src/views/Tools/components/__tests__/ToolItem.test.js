import { describe, expect, test } from 'vitest';
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
});
