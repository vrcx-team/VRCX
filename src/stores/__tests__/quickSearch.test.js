import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, reactive } from 'vue';

const mocks = vi.hoisted(() => ({
    workerInstances: [],
    friendStore: null,
    searchIndexStore: null,
    userStore: null
}));

vi.mock('../quickSearchWorker.js?worker&inline', () => ({
    default: class MockSearchWorker {
        constructor() {
            this.onmessage = null;
            this.postMessage = vi.fn();
            mocks.workerInstances.push(this);
        }

        emit(data) {
            this.onmessage?.({ data });
        }
    }
}));

vi.mock('../friend', () => ({
    useFriendStore: () => mocks.friendStore
}));
vi.mock('../searchIndex', () => ({
    useSearchIndexStore: () => mocks.searchIndexStore
}));
vi.mock('../user', () => ({
    useUserStore: () => mocks.userStore
}));

const showUserDialog = vi.fn();
const showAvatarDialog = vi.fn();
const showWorldDialog = vi.fn();
const showGroupDialog = vi.fn();

vi.mock('../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => showUserDialog(...args)
}));
vi.mock('../../coordinators/avatarCoordinator', () => ({
    showAvatarDialog: (...args) => showAvatarDialog(...args)
}));
vi.mock('../../coordinators/worldCoordinator', () => ({
    showWorldDialog: (...args) => showWorldDialog(...args)
}));
vi.mock('../../coordinators/groupCoordinator', () => ({
    showGroupDialog: (...args) => showGroupDialog(...args)
}));

import { useQuickSearchStore } from '../quickSearch';

function setupStores() {
    mocks.friendStore = reactive({ friends: new Map() });
    mocks.searchIndexStore = reactive({
        version: 0,
        getSnapshot() {
            const friendsList = [];
            for (const ctx of (mocks.friendStore?.friends || new Map()).values()) {
                if (typeof ctx.ref === 'undefined') continue;
                friendsList.push({
                    id: ctx.id,
                    name: ctx.name,
                    memo: ctx.memo || '',
                    note: ctx.ref?.note || '',
                    imageUrl: ctx.ref?.currentAvatarThumbnailImageUrl || ''
                });
            }
            return {
                friends: friendsList,
                avatars: [],
                worlds: [],
                groups: [],
                favAvatars: [],
                favWorlds: []
            };
        }
    });
    mocks.userStore = reactive({ currentUser: { id: 'usr_me' } });
}

describe('useQuickSearchStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.workerInstances.length = 0;
        setActivePinia(createPinia());
        setupStores();
    });

    test('discards stale worker results and applies the latest seq only', async () => {
        const store = useQuickSearchStore();
        store.setQuery('ab');
        await nextTick();

        const worker = mocks.workerInstances[0];
        expect(worker).toBeTruthy();
        const firstMsg = worker.postMessage.mock.calls.at(-1)[0];
        expect(firstMsg.type).toBe('search');

        store.setQuery('abc');
        await nextTick();
        const secondMsg = worker.postMessage.mock.calls.at(-1)[0];
        expect(secondMsg.payload.seq).toBeGreaterThan(firstMsg.payload.seq);

        worker.emit({
            type: 'searchResult',
            payload: {
                seq: firstMsg.payload.seq,
                friends: [{ id: 'usr_old', name: 'Old' }],
                ownAvatars: [],
                favAvatars: [],
                ownWorlds: [],
                favWorlds: [],
                ownGroups: [],
                joinedGroups: []
            }
        });
        expect(store.friendResults).toEqual([]);

        mocks.friendStore.friends.set('usr_new', {
            id: 'usr_new',
            ref: { id: 'usr_new' }
        });
        worker.emit({
            type: 'searchResult',
            payload: {
                seq: secondMsg.payload.seq,
                friends: [{ id: 'usr_new', name: 'New' }],
                ownAvatars: [],
                favAvatars: [],
                ownWorlds: [],
                favWorlds: [],
                ownGroups: [],
                joinedGroups: []
            }
        });

        expect(store.friendResults).toHaveLength(1);
        expect(store.friendResults[0].id).toBe('usr_new');
    });

    test('short query clears results and blocks stale refill', async () => {
        const store = useQuickSearchStore();
        store.setQuery('ab');
        await nextTick();

        const worker = mocks.workerInstances[0];
        const firstSeq = worker.postMessage.mock.calls.at(-1)[0].payload.seq;

        store.setQuery('');
        await nextTick();
        expect(store.friendResults).toEqual([]);

        worker.emit({
            type: 'searchResult',
            payload: {
                seq: firstSeq,
                friends: [{ id: 'usr_old', name: 'Old' }],
                ownAvatars: [],
                favAvatars: [],
                ownWorlds: [],
                favWorlds: [],
                ownGroups: [],
                joinedGroups: []
            }
        });

        expect(store.friendResults).toEqual([]);
    });

    test('re-dispatches search when currentUserId changes and query is active', async () => {
        const store = useQuickSearchStore();
        store.setQuery('ab');
        await nextTick();

        const worker = mocks.workerInstances[0];
        const callsBefore = worker.postMessage.mock.calls.length;

        mocks.userStore.currentUser.id = 'usr_other';
        await nextTick();

        const callsAfter = worker.postMessage.mock.calls.length;
        expect(callsAfter).toBeGreaterThan(callsBefore);

        const lastMessage = worker.postMessage.mock.calls.at(-1)[0];
        expect(lastMessage.type).toBe('search');
        expect(lastMessage.payload.currentUserId).toBe('usr_other');
    });

    test('re-dispatches search after index update when query is active', async () => {
        vi.useFakeTimers();
        const store = useQuickSearchStore();
        store.isOpen = true;
        await nextTick();

        store.setQuery('ab');
        await nextTick();

        const worker = mocks.workerInstances[0];
        const callsBefore = worker.postMessage.mock.calls.length;

        // Simulate searchIndex version bump (as if data arrived)
        mocks.searchIndexStore.version++;
        await nextTick();

        // Fast-forward the 200ms debounce
        vi.advanceTimersByTime(200);
        await nextTick();

        const newCalls = worker.postMessage.mock.calls.slice(callsBefore);
        const types = newCalls.map((c) => c[0].type);
        expect(types).toContain('updateIndex');
        expect(types).toContain('search');

        // updateIndex should come before search
        const updateIdx = types.indexOf('updateIndex');
        const searchIdx = types.lastIndexOf('search');
        expect(updateIdx).toBeLessThan(searchIdx);

        vi.useRealTimers();
    });
});
