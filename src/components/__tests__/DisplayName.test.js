import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(() => Promise.resolve({ json: { displayName: 'Fetched User' } })),
    showUserDialog: vi.fn()
}));

vi.mock('../../api', () => ({
    queryRequest: {
        fetch: (...args) => mocks.fetch(...args)
    }
}));

vi.mock('../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

import DisplayName from '../DisplayName.vue';

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

describe('DisplayName.vue', () => {
    beforeEach(() => {
        mocks.fetch.mockClear();
        mocks.showUserDialog.mockClear();
    });

    it('uses hint directly and skips user query', async () => {
        const wrapper = mount(DisplayName, {
            props: {
                userid: 'usr_1',
                hint: 'Hint Name'
            }
        });

        await flush();

        expect(wrapper.text()).toBe('Hint Name');
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('fetches and renders display name when hint is missing', async () => {
        const wrapper = mount(DisplayName, {
            props: {
                userid: 'usr_2'
            }
        });

        await flush();

        expect(mocks.fetch).toHaveBeenCalledWith('user.dialog', { userId: 'usr_2' });
        expect(wrapper.text()).toBe('Fetched User');
    });

    it('opens user dialog when clicked', async () => {
        const wrapper = mount(DisplayName, {
            props: {
                userid: 'usr_3',
                hint: 'Clickable User'
            }
        });

        await wrapper.trigger('click');

        expect(mocks.showUserDialog).toHaveBeenCalledWith('usr_3');
    });
});
