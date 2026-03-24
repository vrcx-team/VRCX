import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';

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

    it('renders elapsed time text from epoch', () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 4000
            }
        });

        expect(wrapper.text()).toBe('6000ms');
        expect(mocks.timeToText).toHaveBeenCalledWith(6000);
    });

    it('updates text when now value changes', async () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 4000
            }
        });

        mocks.nowRef.value = 13000;
        await nextTick();

        expect(wrapper.text()).toBe('9000ms');
    });

    it('renders dash when epoch is falsy', () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 0
            }
        });

        expect(wrapper.text()).toBe('-');
    });

    it('computes correct elapsed time', () => {
        mocks.nowRef.value = 20000;
        const wrapper = mount(Timer, {
            props: {
                epoch: 5000
            }
        });

        expect(wrapper.text()).toBe('15000ms');
        expect(mocks.timeToText).toHaveBeenCalledWith(15000);
    });
});
