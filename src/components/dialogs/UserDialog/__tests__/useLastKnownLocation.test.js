import { computed, defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const getLastKnownGPSLocation = vi.fn();

vi.mock('../../../../services/database', () => ({
    database: {
        getLastKnownGPSLocation: (...args) => getLastKnownGPSLocation(...args)
    }
}));

// The dialog component tree reaches src/plugins, which is not initialised in tests.
vi.mock('@/plugins', () => ({
    i18n: { global: { t: (key) => key } }
}));

import { parseMaxAgeMinutes, useLastKnownLocation } from '../composables/useLastKnownLocation.js';

/** Minutes ago, as an ISO timestamp. */
function minutesAgo(minutes) {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function gpsRow(overrides = {}) {
    return {
        createdAt: minutesAgo(5),
        location: 'wrld_left:1~hidden(usr_x)',
        worldName: 'Some World',
        ...overrides
    };
}

/**
 * @param deps
 */
function mountComposable(deps) {
    let api;
    const Host = defineComponent({
        setup() {
            api = useLastKnownLocation(deps);
            return () => h('div');
        }
    });
    const wrapper = mount(Host);
    return { wrapper, api: () => api };
}

function hiddenUser(overrides = {}) {
    return {
        id: 'usr_friend',
        visible: true,
        loading: false,
        $location: { tag: 'private', isRealInstance: false },
        ...overrides
    };
}

function mountFor(userDialog, options = {}) {
    return mountComposable({
        userDialog: ref(userDialog),
        currentUser: ref({ id: 'usr_me' }),
        isEnabled: ref(options.isEnabled ?? true),
        maxAgeMinutes: computed(() => options.maxAgeMinutes ?? '60')
    });
}

describe('parseMaxAgeMinutes', () => {
    test('parses a positive number of minutes', () => {
        expect(parseMaxAgeMinutes('60')).toBe(60);
        expect(parseMaxAgeMinutes('720')).toBe(720);
    });

    test('treats 0 and invalid input as unlimited', () => {
        expect(parseMaxAgeMinutes('0')).toBeNull();
        expect(parseMaxAgeMinutes(undefined)).toBeNull();
        expect(parseMaxAgeMinutes('')).toBeNull();
        expect(parseMaxAgeMinutes('abc')).toBeNull();
    });
});

describe('useLastKnownLocation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getLastKnownGPSLocation.mockResolvedValue(null);
    });

    test('resolves the location of a friend whose own location is hidden', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow());

        const { wrapper, api } = mountFor(hiddenUser());
        await flushPromises();

        expect(getLastKnownGPSLocation).toHaveBeenCalledWith({
            id: 'usr_friend',
            displayName: ''
        });
        const found = api().lastKnownLocation.value;
        expect(found.location).toBe('wrld_left:1~hidden(usr_x)');
        expect(found.worldName).toBe('Some World');
        expect(found.$location.isRealInstance).toBe(true);
        expect(Date.now() - found.lastSeenAt).toBeLessThan(10 * 60 * 1000);
        wrapper.unmount();
    });

    test('does not look anything up while the friend has a visible instance', async () => {
        const { wrapper, api } = mountFor(hiddenUser({ $location: { tag: 'wrld_now:1', isRealInstance: true } }));
        await flushPromises();

        expect(getLastKnownGPSLocation).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('does not look anything up for the current user', async () => {
        const { wrapper, api } = mountFor(hiddenUser({ id: 'usr_me' }));
        await flushPromises();

        expect(getLastKnownGPSLocation).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('does not look anything up when the feature is disabled', async () => {
        const { wrapper, api } = mountFor(hiddenUser(), { isEnabled: false });
        await flushPromises();

        expect(getLastKnownGPSLocation).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('does not look anything up when the dialog is not visible', async () => {
        const { wrapper, api } = mountFor(hiddenUser({ visible: false }));
        await flushPromises();

        expect(getLastKnownGPSLocation).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('returns null when the stored location is not a real instance', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow({ location: 'private' }));

        const { wrapper, api } = mountFor(hiddenUser());
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('hides a location older than the configured limit', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow({ createdAt: minutesAgo(180) }));

        const { wrapper, api } = mountFor(hiddenUser(), { maxAgeMinutes: '60' });
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('keeps a location just inside the limit', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow({ createdAt: minutesAgo(59) }));

        const { wrapper, api } = mountFor(hiddenUser(), { maxAgeMinutes: '60' });
        await flushPromises();

        expect(api().lastKnownLocation.value).not.toBeNull();
        wrapper.unmount();
    });

    test('hides a location just past the limit', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow({ createdAt: minutesAgo(61) }));

        const { wrapper, api } = mountFor(hiddenUser(), { maxAgeMinutes: '60' });
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('ignores the limit when set to 0', async () => {
        getLastKnownGPSLocation.mockResolvedValue(gpsRow({ createdAt: minutesAgo(60 * 24 * 365) }));

        const { wrapper, api } = mountFor(hiddenUser(), { maxAgeMinutes: '0' });
        await flushPromises();

        expect(api().lastKnownLocation.value).not.toBeNull();
        wrapper.unmount();
    });

    test('surfaces a failed query as no location', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        getLastKnownGPSLocation.mockRejectedValue(new Error('db offline'));

        const { wrapper, api } = mountFor(hiddenUser());
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        expect(api().isLoading.value).toBe(false);
        consoleError.mockRestore();
        wrapper.unmount();
    });
});
