import { computed, defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

const cachedInstances = new Map();
const getInstance = vi.fn().mockResolvedValue(null);

vi.mock('../../../../stores', () => ({
    useInstanceStore: () => ({ cachedInstances })
}));

vi.mock('../../../../api', () => ({
    instanceRequest: {
        getInstance: (...args) => getInstance(...args)
    }
}));

const getPreviousInstancesByUserId = vi.fn();
const getLastKnownGPSLocation = vi.fn();
const getWorldNameByLocation = vi.fn();

vi.mock('../../../../services/database', () => ({
    database: {
        getPreviousInstancesByUserId: (...args) => getPreviousInstancesByUserId(...args),
        getLastKnownGPSLocation: (...args) => getLastKnownGPSLocation(...args),
        getWorldNameByLocation: (...args) => getWorldNameByLocation(...args)
    }
}));

import {
    findLastKnownInstance,
    parseMaxAgeMinutes,
    useLastKnownLocation
} from '../composables/useLastKnownLocation.js';

/**
 * @param overrides
 */
function makeInstance(overrides = {}) {
    return {
        created_at: '2026-01-01T00:00:00.000Z',
        location: 'wrld_public:123',
        worldName: 'Public World',
        groupName: '',
        time: 0,
        last_ts: Date.parse('2026-01-01T00:00:00.000Z'),
        ...overrides
    };
}

describe('findLastKnownInstance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getLastKnownGPSLocation.mockResolvedValue(null);
        getWorldNameByLocation.mockResolvedValue('');
    });

    describe('friend GPS feed', () => {
        /**
         * @param overrides
         */
        function gpsEntry(overrides = {}) {
            return {
                createdAt: '2026-01-15T10:00:00.000Z',
                location: 'private',
                previousLocation: 'wrld_left:43160~hidden(usr_x)',
                worldName: '',
                groupName: '',
                ...overrides
            };
        }

        test('uses the world the player left when they went hidden', async () => {
            getLastKnownGPSLocation.mockResolvedValue(gpsEntry());

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.location).toBe('wrld_left:43160~hidden(usr_x)');
            expect(result.lastSeenAt).toBe(Date.parse('2026-01-15T10:00:00.000Z'));
            // The GPS feed wins, so the game log is not consulted.
            expect(getPreviousInstancesByUserId).not.toHaveBeenCalled();
        });

        test('uses the event time as lastSeenAt so the age is measured from it', async () => {
            const at = Date.parse('2026-01-15T09:30:00.000Z');
            getLastKnownGPSLocation.mockResolvedValue(gpsEntry({ createdAt: new Date(at).toISOString() }));

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.lastSeenAt).toBe(at);
        });

        test('falls back to the location when it is itself a real world', async () => {
            getLastKnownGPSLocation.mockResolvedValue(
                gpsEntry({ location: 'wrld_now:999', previousLocation: 'private' })
            );

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.location).toBe('wrld_now:999');
        });

        test('carries the world name from the GPS entry', async () => {
            getLastKnownGPSLocation.mockResolvedValue(
                gpsEntry({ previousLocation: 'wrld_left:1', worldName: 'Some World' })
            );

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.worldName).toBe('Some World');
            // Nothing to look up when the row already has the name.
            expect(getWorldNameByLocation).not.toHaveBeenCalled();
        });

        test('resolves the world name for a row that has none', async () => {
            getLastKnownGPSLocation.mockResolvedValue(gpsEntry({ previousLocation: 'wrld_left:1', worldName: '' }));
            getWorldNameByLocation.mockResolvedValue('Resolved World');

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.location).toBe('wrld_left:1');
            expect(result.worldName).toBe('Resolved World');
            expect(getWorldNameByLocation).toHaveBeenCalledWith('wrld_left:1');
        });

        test('leaves the world name empty when it cannot be resolved', async () => {
            getLastKnownGPSLocation.mockResolvedValue(gpsEntry({ previousLocation: 'wrld_left:1', worldName: '' }));
            getWorldNameByLocation.mockResolvedValue('');

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.location).toBe('wrld_left:1');
            expect(result.worldName).toBe('');
        });

        test('ignores a GPS entry that leads to no real world', async () => {
            getLastKnownGPSLocation.mockResolvedValue(gpsEntry({ location: 'private', previousLocation: '' }));
            getPreviousInstancesByUserId.mockResolvedValue(new Set([makeInstance({ location: 'wrld_log:1' })]));

            const result = await findLastKnownInstance({ id: 'usr_1' });

            expect(result.location).toBe('wrld_log:1');
        });
    });

    test('returns the newest real instance, skipping hidden locations', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([
                makeInstance({ location: 'wrld_first:111', worldName: 'First' }),
                makeInstance({ location: 'private', worldName: '' }),
                makeInstance({ location: 'wrld_second:222', worldName: 'Second' }),
                makeInstance({ location: 'offline', worldName: '' })
            ])
        );

        const result = await findLastKnownInstance({ id: 'usr_1', displayName: 'Alice' });

        expect(result.location).toBe('wrld_second:222');
        expect(result.worldName).toBe('Second');
    });

    test('returns null when every recorded location is hidden', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([makeInstance({ location: 'private' }), makeInstance({ location: 'traveling' })])
        );

        expect(await findLastKnownInstance({ id: 'usr_1' })).toBeNull();
    });

    test('returns null when the player has no recorded instances', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(new Set());

        expect(await findLastKnownInstance({ id: 'usr_1' })).toBeNull();
    });

    test('returns null without querying when there is no id or display name', async () => {
        expect(await findLastKnownInstance({})).toBeNull();
        expect(await findLastKnownInstance(null)).toBeNull();
        expect(getPreviousInstancesByUserId).not.toHaveBeenCalled();
    });

    test('returns null when the query yields nothing', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(null);

        expect(await findLastKnownInstance({ id: 'usr_1' })).toBeNull();
    });

    test('reports the end of the visit as lastSeenAt', async () => {
        const visit = makeInstance({
            created_at: '2026-01-01T00:00:00.000Z',
            last_ts: Date.parse('2026-01-01T05:30:00.000Z')
        });
        getPreviousInstancesByUserId.mockResolvedValue(new Set([visit]));

        const result = await findLastKnownInstance({ id: 'usr_1' });

        expect(result.lastSeenAt).toBe(Date.parse('2026-01-01T05:30:00.000Z'));
    });

    test('picks the newest real visit even when a hidden entry is newer', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([
                makeInstance({ location: 'wrld_old:1' }),
                makeInstance({ location: 'wrld_new:2' }),
                makeInstance({ location: 'private' })
            ])
        );

        const result = await findLastKnownInstance({ id: 'usr_1' });

        expect(result.location).toBe('wrld_new:2');
    });

    test('falls back to created_at when the visit has no last_ts', async () => {
        const createdAt = Date.parse('2026-03-01T10:00:00.000Z');
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([makeInstance({ created_at: new Date(createdAt).toISOString(), last_ts: 0 })])
        );

        const result = await findLastKnownInstance({ id: 'usr_1' });

        expect(result.lastSeenAt).toBe(createdAt);
    });
});

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

describe('useLastKnownLocation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getLastKnownGPSLocation.mockResolvedValue(null);
        getWorldNameByLocation.mockResolvedValue('');
        cachedInstances.clear();
    });

    test('does not look anything up when the friend has a visible instance', async () => {
        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'wrld_public:123', isRealInstance: true }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(getPreviousInstancesByUserId).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('does not look anything up for the current user', async () => {
        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_me',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(getPreviousInstancesByUserId).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('does not look anything up when the feature is disabled', async () => {
        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(false)
        });
        await flushPromises();

        expect(getPreviousInstancesByUserId).not.toHaveBeenCalled();
        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
    });

    test('resolves the last known location for a friend whose location is hidden', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([
                makeInstance({ location: 'private' }),
                makeInstance({ location: 'wrld_last:999', worldName: 'Last World' })
            ])
        );

        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                ref: { displayName: 'Friend' },
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        const result = api().lastKnownLocation.value;
        expect(result).not.toBeNull();
        expect(result.location).toBe('wrld_last:999');
        expect(result.worldName).toBe('Last World');
        expect(result.$location.isRealInstance).toBe(true);
        wrapper.unmount();
    });

    test('reuses a cached instance instead of requesting it again', async () => {
        const cached = { id: 'wrld_last:999', ref: { world: { name: 'Cached World' } } };
        cachedInstances.set('wrld_last:999', cached);
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([makeInstance({ location: 'wrld_last:999', worldName: 'Last World' })])
        );

        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(api().lastKnownLocation.value.instance).toEqual(cached);
        expect(getInstance).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('fetches instance details when the location is not cached', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([makeInstance({ location: 'wrld_last:999', worldName: 'Last World' })])
        );

        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(getInstance).toHaveBeenCalledWith({ worldId: 'wrld_last', instanceId: '999' });
        expect(api().lastKnownLocation.value.instance).toBeNull();
        wrapper.unmount();
    });

    test('clears the result when the friend becomes offline with no history', async () => {
        getPreviousInstancesByUserId.mockResolvedValue(new Set());

        const userDialog = ref({
            id: 'usr_friend',
            visible: true,
            loading: false,
            $location: { tag: 'private', isRealInstance: false }
        });
        const { wrapper, api } = mountComposable({
            userDialog,
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        expect(api().isLoading.value).toBe(false);
        wrapper.unmount();
    });

    test('surfaces a failed query as no location', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        getPreviousInstancesByUserId.mockRejectedValue(new Error('db offline'));

        const { wrapper, api } = mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true)
        });
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        expect(api().isLoading.value).toBe(false);
        consoleError.mockRestore();
        wrapper.unmount();
    });

    /**
     * The clock is frozen so a visit sitting exactly on the limit is not pushed
     * past it by the delay between building the fixture and mounting.
     *
     * @param maxAgeMinutes
     * @param ageMinutes - How long ago the visit ended
     */
    function mountWithWindow(maxAgeMinutes, ageMinutes) {
        const now = Date.parse('2026-09-18T12:00:00.000Z');
        vi.useFakeTimers();
        vi.setSystemTime(now);
        getPreviousInstancesByUserId.mockResolvedValue(
            new Set([
                makeInstance({
                    location: 'wrld_at_limit:1',
                    last_ts: now - ageMinutes * 60 * 1000
                })
            ])
        );
        return mountComposable({
            userDialog: ref({
                id: 'usr_friend',
                visible: true,
                loading: false,
                $location: { tag: 'private', isRealInstance: false }
            }),
            currentUser: ref({ id: 'usr_me' }),
            isEnabled: ref(true),
            maxAgeMinutes: computed(() => maxAgeMinutes.value)
        });
    }

    test('shows a location the friend was in recently', async () => {
        const { wrapper, api } = mountWithWindow(ref('60'), 10);
        await flushPromises();

        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');
        wrapper.unmount();
        vi.useRealTimers();
    });

    test('drops a location older than the configured limit', async () => {
        const { wrapper, api } = mountWithWindow(ref('60'), 211);
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
        vi.useRealTimers();
    });

    test('keeps a location exactly at the limit', async () => {
        const { wrapper, api } = mountWithWindow(ref('60'), 60);
        await flushPromises();

        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');
        wrapper.unmount();
        vi.useRealTimers();
    });

    test('a visit from 2.5 hours ago is hidden under the default 1 hour limit', async () => {
        // Mirrors the real case: left the world a while ago, so the location is
        // no longer within the window and must not be shown.
        const { wrapper, api } = mountWithWindow(ref('60'), 150);
        await flushPromises();

        expect(api().lastKnownLocation.value).toBeNull();
        wrapper.unmount();
        vi.useRealTimers();
    });

    test('the same visit shows once the limit is widened to 6 hours', async () => {
        const maxAgeMinutes = ref('60');
        const { wrapper, api } = mountWithWindow(maxAgeMinutes, 150);
        await flushPromises();
        expect(api().lastKnownLocation.value).toBeNull();

        maxAgeMinutes.value = '360';
        await flushPromises();
        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');

        wrapper.unmount();
        vi.useRealTimers();
    });

    test('shows an old location when unlimited is selected', async () => {
        const { wrapper, api } = mountWithWindow(ref('0'), 400 * 24 * 60);
        await flushPromises();

        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');
        wrapper.unmount();
        vi.useRealTimers();
    });

    test('re-evaluates when the limit is relaxed', async () => {
        const maxAgeMinutes = ref('60');
        // Visited 6 hours ago: hidden under a 1 hour limit, shown under 12 hours.
        const { wrapper, api } = mountWithWindow(maxAgeMinutes, 6 * 60);
        await flushPromises();
        expect(api().lastKnownLocation.value).toBeNull();

        maxAgeMinutes.value = '720';
        await flushPromises();
        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');

        wrapper.unmount();
        vi.useRealTimers();
    });

    test('lets the limit expire on its own while the dialog stays open', async () => {
        const { wrapper, api } = mountWithWindow(ref('5'), 4);
        await flushPromises();
        expect(api().lastKnownLocation.value?.location).toBe('wrld_at_limit:1');

        // Cross the 5 minute limit without reopening the dialog.
        await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
        expect(api().lastKnownLocation.value).toBeNull();

        wrapper.unmount();
        vi.useRealTimers();
    });
});
