import { localeIncludes } from './base/string';
import removeConfusables, {
    removeWhitespace
} from '../../services/confusables';

/**
 * Tests whether a name matches a query using locale-aware comparison.
 * Handles confusable-character normalization and whitespace stripping.
 * @param {string} name     - The display name to test
 * @param {string} query    - The raw user query (may contain whitespace)
 * @param {Intl.Collator} comparer - Locale collator for comparison
 * @returns {boolean}
 */
export function matchName(name, query, comparer) {
    if (!name || !query) {
        return false;
    }
    const cleanQuery = removeWhitespace(query);
    if (!cleanQuery) {
        return false;
    }
    const cleanName = removeConfusables(name);
    if (localeIncludes(cleanName, cleanQuery, comparer)) {
        return true;
    }
    // Also check raw name for users searching with special characters
    return localeIncludes(name, cleanQuery, comparer);
}

/**
 * Check whether a query starts the name (for prioritizing prefix matches).
 * @param {string} name
 * @param {string} query
 * @param {Intl.Collator} comparer
 * @returns {boolean}
 */
export function isPrefixMatch(name, query, comparer) {
    if (!name || !query) {
        return false;
    }
    const cleanQuery = removeWhitespace(query);
    if (!cleanQuery) {
        return false;
    }
    return (
        comparer.compare(name.substring(0, cleanQuery.length), cleanQuery) === 0
    );
}

/**
 * Search friends from the friends Map.
 * @param {string} query
 * @param {Map} friends        - friendStore.friends Map
 * @param {Intl.Collator} comparer
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string, ref: object}>}
 */
export function searchFriends(query, friends, comparer, limit = 10) {
    if (!query || !friends) {
        return [];
    }
    const results = [];
    for (const ctx of friends.values()) {
        if (typeof ctx.ref === 'undefined') {
            continue;
        }
        let match = matchName(ctx.name, query, comparer);
        let matchedField = match ? 'name' : null;
        // Include memo and note matching for friends (with raw query for spaces)
        if (!match && ctx.memo) {
            match = localeIncludes(ctx.memo, query, comparer);
            if (match) matchedField = 'memo';
        }
        if (!match && ctx.ref.note) {
            match = localeIncludes(ctx.ref.note, query, comparer);
            if (match) matchedField = 'note';
        }
        if (match) {
            results.push({
                id: ctx.id,
                name: ctx.name,
                type: 'friend',
                imageUrl: ctx.ref.currentAvatarThumbnailImageUrl,
                memo: ctx.memo || '',
                note: ctx.ref.note || '',
                matchedField,
                ref: ctx.ref
            });
        }
    }
    // Sort: prefix matches first, then alphabetically
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}

/**
 * Search avatars from a Map (cachedAvatars or favorite avatars).
 * @param {string} query
 * @param {Map} avatarMap
 * @param {Intl.Collator} comparer
 * @param {string|null} [authorId] - If provided, only match avatars by this author
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string}>}
 */
export function searchAvatars(
    query,
    avatarMap,
    comparer,
    authorId = null,
    limit = 10
) {
    if (!query || !avatarMap) {
        return [];
    }
    const results = [];
    for (const ref of avatarMap.values()) {
        if (!ref || !ref.name) {
            continue;
        }
        if (authorId && ref.authorId !== authorId) {
            continue;
        }
        if (matchName(ref.name, query, comparer)) {
            results.push({
                id: ref.id,
                name: ref.name,
                type: 'avatar',
                imageUrl: ref.thumbnailImageUrl || ref.imageUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}

/**
 * Search worlds from a Map (cachedWorlds or favorite worlds).
 * @param {string} query
 * @param {Map} worldMap
 * @param {Intl.Collator} comparer
 * @param {string|null} [ownerId] - If provided, only match worlds owned by this user
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string}>}
 */
export function searchWorlds(
    query,
    worldMap,
    comparer,
    ownerId = null,
    limit = 10
) {
    if (!query || !worldMap) {
        return [];
    }
    const results = [];
    for (const ref of worldMap.values()) {
        if (!ref || !ref.name) {
            continue;
        }
        if (ownerId && ref.authorId !== ownerId) {
            continue;
        }
        if (matchName(ref.name, query, comparer)) {
            results.push({
                id: ref.id,
                name: ref.name,
                type: 'world',
                imageUrl: ref.thumbnailImageUrl || ref.imageUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}

/**
 * Search groups from a Map (currentUserGroups).
 * @param {string} query
 * @param {Map} groupMap
 * @param {Intl.Collator} comparer
 * @param {string|null} [ownerId] - If provided, only match groups owned by this user
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string}>}
 */
export function searchGroups(
    query,
    groupMap,
    comparer,
    ownerId = null,
    limit = 10
) {
    if (!query || !groupMap) {
        return [];
    }
    const results = [];
    for (const ref of groupMap.values()) {
        if (!ref || !ref.name) {
            continue;
        }
        if (ownerId && ref.ownerId !== ownerId) {
            continue;
        }
        if (matchName(ref.name, query, comparer)) {
            results.push({
                id: ref.id,
                name: ref.name,
                type: 'group',
                imageUrl: ref.iconUrl || ref.bannerUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}

/**
 * Search favorite avatars from the favoriteStore array.
 * @param {string} query
 * @param {Array} favoriteAvatars - favoriteStore.favoriteAvatars array of { name, ref }
 * @param {Intl.Collator} comparer
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string}>}
 */
export function searchFavoriteAvatars(
    query,
    favoriteAvatars,
    comparer,
    limit = 10
) {
    if (!query || !favoriteAvatars) {
        return [];
    }
    const results = [];
    for (const ctx of favoriteAvatars) {
        if (!ctx?.ref?.name) {
            continue;
        }
        if (matchName(ctx.ref.name, query, comparer)) {
            results.push({
                id: ctx.ref.id,
                name: ctx.ref.name,
                type: 'avatar',
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}

/**
 * Search favorite worlds from the favoriteStore array.
 * @param {string} query
 * @param {Array} favoriteWorlds - favoriteStore.favoriteWorlds array of { name, ref }
 * @param {Intl.Collator} comparer
 * @param {number} [limit]
 * @returns {Array<{id: string, name: string, type: string, imageUrl: string}>}
 */
export function searchFavoriteWorlds(
    query,
    favoriteWorlds,
    comparer,
    limit = 10
) {
    if (!query || !favoriteWorlds) {
        return [];
    }
    const results = [];
    for (const ctx of favoriteWorlds) {
        if (!ctx?.ref?.name) {
            continue;
        }
        if (matchName(ctx.ref.name, query, comparer)) {
            results.push({
                id: ctx.ref.id,
                name: ctx.ref.name,
                type: 'world',
                imageUrl: ctx.ref.thumbnailImageUrl || ctx.ref.imageUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) {
        results.length = limit;
    }
    return results;
}
