import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('lucide-vue-next', () => ({
    MessageSquareWarning: { template: '<i data-testid="warn-icon" />' }
}));

import DeprecationAlert from '../DeprecationAlert.vue';

describe('DeprecationAlert.vue', () => {
    it('renders relocated title and feature name', () => {
        const wrapper = mount(DeprecationAlert, {
            props: {
                featureName: 'InstanceActionBar'
            },
            global: {
                stubs: {
                    i18nT: {
                        template:
                            '<span data-testid="i18n-t"><slot name="feature" /></span>'
                    }
                }
            }
        });

        expect(wrapper.text()).toContain('common.feature_relocated.title');
        expect(wrapper.text()).toContain('InstanceActionBar');
        expect(wrapper.find('[data-testid="warn-icon"]').exists()).toBe(true);
    });
});
