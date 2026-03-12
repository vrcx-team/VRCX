import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    timeToText: vi.fn((ms) => `${ms}ms`)
}));

vi.mock('../../shared/utils', () => ({
    timeToText: (...args) => mocks.timeToText(...args)
}));

import Timer from '../Timer.vue';

describe('Timer.vue', () => {
    let intervalCallback;

    beforeEach(() => {
        intervalCallback = null;
        mocks.timeToText.mockClear();

        vi.spyOn(globalThis, 'setInterval').mockImplementation((cb) => {
            intervalCallback = cb;
            return 99;
        });
        vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
        vi.spyOn(Date, 'now').mockReturnValue(10000);
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

    it('updates text when interval callback runs', async () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 4000
            }
        });

        vi.mocked(Date.now).mockReturnValue(13000);
        intervalCallback?.();
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

    it('clears interval on unmount', () => {
        const wrapper = mount(Timer, {
            props: {
                epoch: 1
            }
        });

        wrapper.unmount();

        expect(clearInterval).toHaveBeenCalledWith(99);
    });
});
