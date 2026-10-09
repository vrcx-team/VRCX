import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    timeToText: vi.fn((ms) => `${ms}ms`),
    nowRef: null
}));

vi.mock('../../shared/utils', () => ({
    timeToText: (...args) => mocks.timeToText(...args)
}));

vi.mock('@vueuse/core', () => ({
    useNow: () => mocks.nowRef
}));

import Timer from '../Timer.vue';

describe('Timer.vue', () => {
    beforeEach(() => {
        mocks.timeToText.mockClear();
        mocks.nowRef = ref(10000);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders dash when epoch is falsy', () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 0
            }
        });

        expect(wrapper.text()).toBe('-');
    });
});
