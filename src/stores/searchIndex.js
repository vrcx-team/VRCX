import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useFavoriteStore } from './favorite';

export const useSearchIndexStore = defineStore('SearchIndex', () => {
    const friends = new Map();
    const avatars = new Map();
    const worlds = new Map();
    const groups = new Map();
    const favAvatars = new Map();
    const favWorlds = new Map();

    const version = ref(0);


    /**
     * Sync a friend context into the search index.
     * Extracts only the fields needed for searching.
     * @param {object} ctx - Friend context from friendStore.friends
     */
    function syncFriend(ctx) {
        if (!ctx || !ctx.id) return;
        const entry = {
            id: ctx.id,
            name: ctx.name || '',
            memo: ctx.memo || '',
            note: ctx.ref?.note || '',
            imageUrl: ctx.ref?.currentAvatarThumbnailImageUrl || ''
        };
        const existing = friends.get(ctx.id);
        if (
            existing &&
            existing.name === entry.name &&
            existing.memo === entry.memo &&
            existing.note === entry.note &&
            existing.imageUrl === entry.imageUrl
        ) {
            return;
        }
        friends.set(ctx.id, entry);
        version.value++;
    }

    /**
     * @param {string} id
     */
    function removeFriend(id) {
        if (friends.delete(id)) {
            version.value++;
        }
    }

    function clearFriends() {
        if (friends.size > 0) {
            friends.clear();
            version.value++;
        }
    }


    /**
     * @param {object} ref - Avatar data object
     */
    function upsertAvatar(ref) {
        if (!ref || !ref.id) return;
        const entry = {
            id: ref.id,
            name: ref.name || '',
            authorId: ref.authorId || '',
            imageUrl: ref.thumbnailImageUrl || ref.imageUrl || ''
        };
        const existing = avatars.get(ref.id);
        if (
            existing &&
            existing.name === entry.name &&
            existing.authorId === entry.authorId &&
            existing.imageUrl === entry.imageUrl
        ) {
            return;
        }
        avatars.set(ref.id, entry);
        version.value++;
    }

    /**
     * @param {string} id
     */
    function removeAvatar(id) {
        if (avatars.delete(id)) {
            version.value++;
        }
    }

    function clearAvatars() {
        if (avatars.size > 0) {
            avatars.clear();
            version.value++;
        }
    }


    /**
     * @param {object} ref - World data object
     */
    function upsertWorld(ref) {
        if (!ref || !ref.id) return;
        const entry = {
            id: ref.id,
            name: ref.name || '',
            authorId: ref.authorId || '',
            imageUrl: ref.thumbnailImageUrl || ref.imageUrl || ''
        };
        const existing = worlds.get(ref.id);
        if (
            existing &&
            existing.name === entry.name &&
            existing.authorId === entry.authorId &&
            existing.imageUrl === entry.imageUrl
        ) {
            return;
        }
        worlds.set(ref.id, entry);
        version.value++;
    }

    /**
     * @param {string} id
     */
    function removeWorld(id) {
        if (worlds.delete(id)) {
            version.value++;
        }
    }

    function clearWorlds() {
        if (worlds.size > 0) {
            worlds.clear();
            version.value++;
        }
    }


    /**
     * @param {object} ref - Group data object
     */
    function upsertGroup(ref) {
        if (!ref || !ref.id) return;
        const entry = {
            id: ref.id,
            name: ref.name || '',
            ownerId: ref.ownerId || '',
            imageUrl: ref.iconUrl || ref.bannerUrl || ''
        };
        const existing = groups.get(ref.id);
        if (
            existing &&
            existing.name === entry.name &&
            existing.ownerId === entry.ownerId &&
            existing.imageUrl === entry.imageUrl
        ) {
            return;
        }
        groups.set(ref.id, entry);
        version.value++;
    }

    /**
     * @param {string} id
     */
    function removeGroup(id) {
        if (groups.delete(id)) {
            version.value++;
        }
    }

    function clearGroups() {
        if (groups.size > 0) {
            groups.clear();
            version.value++;
        }
    }


    function rebuildFavoritesFromStore() {
        const favoriteStore = useFavoriteStore();

        const newFavAvatars = new Map();
        for (const ctx of favoriteStore.favoriteAvatars) {
            if (!ctx?.ref?.name) continue;
            newFavAvatars.set(ctx.ref.id, {
                id: ctx.ref.id,
                name: ctx.ref.name,
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl || ''
            });
        }

        const newFavWorlds = new Map();
        for (const ctx of favoriteStore.favoriteWorlds) {
            if (!ctx?.ref?.name) continue;
            newFavWorlds.set(ctx.ref.id, {
                id: ctx.ref.id,
                name: ctx.ref.name,
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl || ''
            });
        }

        let changed = false;
        if (favAvatars.size !== newFavAvatars.size) {
            changed = true;
        } else {
            for (const [id, entry] of newFavAvatars) {
                const existing = favAvatars.get(id);
                if (!existing || existing.name !== entry.name || existing.imageUrl !== entry.imageUrl) {
                    changed = true;
                    break;
                }
            }
        }
        if (favWorlds.size !== newFavWorlds.size) {
            changed = true;
        } else if (!changed) {
            for (const [id, entry] of newFavWorlds) {
                const existing = favWorlds.get(id);
                if (!existing || existing.name !== entry.name || existing.imageUrl !== entry.imageUrl) {
                    changed = true;
                    break;
                }
            }
        }

        if (changed) {
            favAvatars.clear();
            for (const [id, entry] of newFavAvatars) {
                favAvatars.set(id, entry);
            }
            favWorlds.clear();
            for (const [id, entry] of newFavWorlds) {
                favWorlds.set(id, entry);
            }
            version.value++;
        }
    }

    function clearFavorites() {
        if (favAvatars.size > 0 || favWorlds.size > 0) {
            favAvatars.clear();
            favWorlds.clear();
            version.value++;
        }
    }


    /**
     * Build a snapshot from the internal index maps.
     * Used by quickSearch to send data to the Worker.
     * @returns {object} Plain object arrays ready for postMessage.
     */
    function getSnapshot() {
        return {
            friends: Array.from(friends.values()),
            avatars: Array.from(avatars.values()),
            worlds: Array.from(worlds.values()),
            groups: Array.from(groups.values()),
            favAvatars: Array.from(favAvatars.values()),
            favWorlds: Array.from(favWorlds.values())
        };
    }



    return {
        version,

        syncFriend,
        removeFriend,
        clearFriends,

        upsertAvatar,
        removeAvatar,
        clearAvatars,

        upsertWorld,
        removeWorld,
        clearWorlds,

        upsertGroup,
        removeGroup,
        clearGroups,
        rebuildFavoritesFromStore,
        clearFavorites,

        getSnapshot
    };
});
