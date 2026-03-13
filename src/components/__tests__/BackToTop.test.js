import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: { template: '<div><slot /></div>' },
    TooltipTrigger: { template: '<div><slot /></div>' },
    TooltipContent: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="back-btn" @click="$emit(\'click\', $event)"><slot /></button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    ArrowUp: { template: '<i />' }
}));

import BackToTop from '../BackToTop.vue';

function setScrollY(value) {
    Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value
    });
}

describe('BackToTop.vue', () => {
    beforeEach(() => {
        setScrollY(0);
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows button after scroll threshold and scrolls window to top', async () => {
        const wrapper = mount(BackToTop, {
            props: {
                visibilityHeight: 100,
                teleport: false,
                tooltip: false
            }
        });

        expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(false);

        setScrollY(120);
        window.dispatchEvent(new Event('scroll'));
        await nextTick();

        const btn = wrapper.find('[data-testid="back-btn"]');
        expect(btn.exists()).toBe(true);

        await btn.trigger('click');

        expect(window.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'smooth'
        });
    });

    it('uses virtualizer scrollToIndex when provided', async () => {
        const scrollToIndex = vi.fn();
        const wrapper = mount(BackToTop, {
            props: {
                visibilityHeight: 0,
                teleport: false,
                tooltip: false,
                virtualizer: { scrollToIndex }
            }
        });

        window.dispatchEvent(new Event('scroll'));
        await nextTick();

        const btn = wrapper.get('[data-testid="back-btn"]');
        await btn.trigger('click');

        expect(scrollToIndex).toHaveBeenCalledWith(0, {
            align: 'start',
            behavior: 'auto'
        });
        expect(window.scrollTo).not.toHaveBeenCalled();
    });

    it('scrolls target element to top with auto behavior', async () => {
        const target = document.createElement('div');
        target.scrollTop = 200;
        target.scrollTo = vi.fn();

        const wrapper = mount(BackToTop, {
            props: {
                target,
                behavior: 'auto',
                visibilityHeight: 100,
                teleport: false,
                tooltip: false
            }
        });

        target.dispatchEvent(new Event('scroll'));
        await nextTick();

        const btn = wrapper.get('[data-testid="back-btn"]');
        await btn.trigger('click');

        expect(target.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'auto'
        });
    });
});
