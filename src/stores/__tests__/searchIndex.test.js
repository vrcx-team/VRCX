import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { reactive } from 'vue';

const mocks = vi.hoisted(() => ({
    favoriteStore: null
}));

vi.mock('../favorite', () => ({
    useFavoriteStore: () => mocks.favoriteStore
}));

import { useSearchIndexStore } from '../searchIndex';

describe('useSearchIndexStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mocks.favoriteStore = reactive({
            favoriteAvatars: [],
            favoriteWorlds: [],
            localAvatarFavorites: {},
            localWorldFavorites: {}
        });
    });

    test('syncFriend indexes ctx.name when present', () => {
        const store = useSearchIndexStore();

        store.syncFriend({
            id: 'usr_1',
            name: 'Alice',
            ref: {
                displayName: 'Alice',
                $memo: 'my memo',
                note: 'my note',
                currentAvatarThumbnailImageUrl: 'https://example.com/a.png'
            }
        });

        expect(store.getSnapshot().friends).toEqual([
            {
                id: 'usr_1',
                name: 'Alice',
                memo: 'my memo',
                note: 'my note',
                imageUrl: 'https://example.com/a.png'
            }
        ]);
    });

    test('syncFriend falls back to ctx.ref.displayName when ctx.name is missing', () => {
        const store = useSearchIndexStore();

        store.syncFriend({
            id: 'usr_2',
            name: undefined,
            ref: {
                displayName: 'Bob',
                $memo: '',
                note: '',
                currentAvatarThumbnailImageUrl: ''
            }
        });

        expect(store.getSnapshot().friends).toEqual([
            {
                id: 'usr_2',
                name: 'Bob',
                memo: '',
                note: '',
                imageUrl: ''
            }
        ]);
    });
});
