import { dbVars } from '../database';

import sqliteService from '../sqlite.js';

export const FRIEND_INSIGHT_DATA_TYPES = Object.freeze([
    'location',
    'status',
    'bio',
    'avatar',
    'presence',
    'relationship',
    'mutuals'
]);

const timelineTypes = new Set(
    FRIEND_INSIGHT_DATA_TYPES.filter(
        (type) => type !== 'relationship' && type !== 'mutuals'
    )
);

const DEFAULT_EVENT_LIMIT = 200;
const MAX_EVENT_LIMIT = 1000;
const DEFAULT_FRIEND_LIMIT = 20;
const MAX_FRIEND_LIMIT = 100;

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} max
 * @returns {number}
 */
function clampLimit(value, fallback, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return fallback;
    }
    return Math.max(1, Math.min(Math.floor(number), max));
}

/**
 * Only recognized data types can affect query construction. This is important
 * because this module is the fixed, read-only data boundary used by the agent.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeDataTypes(value) {
    if (!Array.isArray(value) || value.length === 0) {
        return [...FRIEND_INSIGHT_DATA_TYPES];
    }
    return [
        ...new Set(
            value.filter((type) => FRIEND_INSIGHT_DATA_TYPES.includes(type))
        )
    ];
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeFriendIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return [
        ...new Set(
            value.filter((id) => typeof id === 'string' && id.length > 0)
        )
    ];
}

/**
 * @param {string[]} friendIds
 * @param {object} args
 * @returns {string}
 */
function addFriendIdParams(friendIds, args) {
    const placeholders = [];
    friendIds.forEach((friendId, index) => {
        const key = `@friend_${index}`;
        placeholders.push(key);
        args[key] = friendId;
    });
    return placeholders.join(', ');
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeLike(value) {
    return value
        .replaceAll('\\', '\\\\')
        .replaceAll('%', '\\%')
        .replaceAll('_', '\\_');
}

/**
 * Fetches the current friend records represented by the requested IDs. Every
 * insight query starts here so deleted or arbitrary user IDs cannot be sent to
 * a model through this feature.
 *
 * @param {string[]} friendIds
 * @returns {Promise<Array<{userId: string, displayName: string, trustLevel: string, friendNumber: number}>>}
 */
async function getCurrentFriends(friendIds) {
    if (!dbVars.userPrefix || friendIds.length === 0) {
        return [];
    }
    const args = {};
    const ids = addFriendIdParams(friendIds, args);
    const friends = [];
    await sqliteService.execute(
        (row) => {
            friends.push({
                userId: row[0],
                displayName: row[1] || row[0],
                trustLevel: row[2] || '',
                friendNumber: row[3] || 0
            });
        },
        `SELECT user_id, display_name, trust_level, friend_number
         FROM ${dbVars.userPrefix}_friend_log_current
         WHERE user_id IN (${ids})
         ORDER BY friend_number ASC, display_name COLLATE NOCASE ASC`,
        args
    );
    return friends;
}

/**
 * Maps fixed data categories to a normalized timeline query. Values always use
 * bound parameters; table and column names are entirely static.
 *
 * @param {string[]} dataTypes
 * @param {string} friendIdClause
 * @param {string} dateClause
 * @returns {string[]}
 */
function buildTimelineSelects(dataTypes, friendIdClause, dateClause) {
    const tablePrefix = dbVars.userPrefix;
    const selects = [];
    if (dataTypes.includes('location')) {
        selects.push(`SELECT id, created_at, user_id, display_name, 'location' AS event_type,
            location, world_name, group_name, time AS duration_ms,
            NULL AS status, NULL AS status_description, NULL AS previous_status,
            NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio,
            NULL AS avatar_name, NULL AS owner_id, NULL AS avatar_image_url
            FROM ${tablePrefix}_feed_gps
            WHERE user_id IN (${friendIdClause}) ${dateClause}`);
    }
    if (dataTypes.includes('status')) {
        selects.push(`SELECT id, created_at, user_id, display_name, 'status' AS event_type,
            NULL AS location, NULL AS world_name, NULL AS group_name, NULL AS duration_ms,
            status, status_description, previous_status, previous_status_description,
            NULL AS bio, NULL AS previous_bio, NULL AS avatar_name, NULL AS owner_id,
            NULL AS avatar_image_url
            FROM ${tablePrefix}_feed_status
            WHERE user_id IN (${friendIdClause}) ${dateClause}`);
    }
    if (dataTypes.includes('bio')) {
        selects.push(`SELECT id, created_at, user_id, display_name, 'bio' AS event_type,
            NULL AS location, NULL AS world_name, NULL AS group_name, NULL AS duration_ms,
            NULL AS status, NULL AS status_description, NULL AS previous_status,
            NULL AS previous_status_description, bio, previous_bio, NULL AS avatar_name,
            NULL AS owner_id, NULL AS avatar_image_url
            FROM ${tablePrefix}_feed_bio
            WHERE user_id IN (${friendIdClause}) ${dateClause}`);
    }
    if (dataTypes.includes('avatar')) {
        selects.push(`SELECT id, created_at, user_id, display_name, 'avatar' AS event_type,
            NULL AS location, NULL AS world_name, NULL AS group_name, NULL AS duration_ms,
            NULL AS status, NULL AS status_description, NULL AS previous_status,
            NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio,
            avatar_name, owner_id, current_avatar_image_url AS avatar_image_url
            FROM ${tablePrefix}_feed_avatar
            WHERE user_id IN (${friendIdClause}) ${dateClause}`);
    }
    if (dataTypes.includes('presence')) {
        selects.push(`SELECT id, created_at, user_id, display_name,
            'presence:' || type AS event_type, location, world_name, group_name,
            time AS duration_ms, NULL AS status, NULL AS status_description,
            NULL AS previous_status, NULL AS previous_status_description, NULL AS bio,
            NULL AS previous_bio, NULL AS avatar_name, NULL AS owner_id,
            NULL AS avatar_image_url
            FROM ${tablePrefix}_feed_online_offline
            WHERE user_id IN (${friendIdClause}) ${dateClause}`);
    }
    return selects;
}

/**
 * @param {{createdAt?: string, id?: number}|undefined} cursor
 * @param {object} args
 * @returns {string}
 */
function addCursorClause(cursor, args) {
    if (
        !cursor ||
        typeof cursor.createdAt !== 'string' ||
        !Number.isFinite(cursor.id)
    ) {
        return '';
    }
    args['@beforeCreatedAt'] = cursor.createdAt;
    args['@beforeId'] = cursor.id;
    return 'AND (created_at < @beforeCreatedAt OR (created_at = @beforeCreatedAt AND id < @beforeId))';
}

const friendInsight = {
    /**
     * Resolves an ID or display-name fragment against current friends only.
     * This is deliberately not a general user search.
     *
     * @param {string} query
     * @param {number} [limit]
     */
    async resolveFriendInsightFriends(query, limit = DEFAULT_FRIEND_LIMIT) {
        if (!dbVars.userPrefix) {
            return [];
        }
        const normalizedQuery = typeof query === 'string' ? query.trim() : '';
        if (!normalizedQuery) {
            return [];
        }
        const friends = [];
        const args = {
            '@limit': clampLimit(limit, DEFAULT_FRIEND_LIMIT, MAX_FRIEND_LIMIT)
        };
        args['@query'] = `%${escapeLike(normalizedQuery)}%`;
        const whereClause = `WHERE user_id LIKE @query ESCAPE '\\'
                OR display_name LIKE @query ESCAPE '\\'`;
        await sqliteService.execute(
            (row) => {
                friends.push({
                    userId: row[0],
                    displayName: row[1] || row[0],
                    trustLevel: row[2] || '',
                    friendNumber: row[3] || 0
                });
            },
            `SELECT user_id, display_name, trust_level, friend_number
             FROM ${dbVars.userPrefix}_friend_log_current
             ${whereClause}
             ORDER BY friend_number ASC, display_name COLLATE NOCASE ASC
             LIMIT @limit`,
            args
        );
        return friends;
    },

    /**
     * Returns a bounded, normalized chronological feed for current friends.
     * It never accepts SQL or table names from an agent/model.
     *
     * @param {{friendIds: string[], dataTypes?: string[], from?: string, to?: string, before?: {createdAt: string, id: number}, limit?: number}} options
     */
    async getFriendInsightTimeline(options) {
        const friendIds = normalizeFriendIds(options?.friendIds);
        const selectedTypes = normalizeDataTypes(options?.dataTypes).filter(
            (type) => timelineTypes.has(type)
        );
        const currentFriends = await getCurrentFriends(friendIds);
        if (!currentFriends.length || !selectedTypes.length) {
            return {
                currentFriends,
                events: [],
                hasMore: false,
                nextCursor: null
            };
        }

        const limit = clampLimit(
            options?.limit,
            DEFAULT_EVENT_LIMIT,
            MAX_EVENT_LIMIT
        );
        const args = { '@limit': limit + 1 };
        const currentFriendIds = currentFriends.map((friend) => friend.userId);
        const friendIdClause = addFriendIdParams(currentFriendIds, args);
        let dateClause = '';
        if (typeof options?.from === 'string' && options.from) {
            args['@from'] = options.from;
            dateClause += 'AND created_at >= @from ';
        }
        if (typeof options?.to === 'string' && options.to) {
            args['@to'] = options.to;
            dateClause += 'AND created_at <= @to ';
        }
        const cursorClause = addCursorClause(options?.before, args);

        const selects = buildTimelineSelects(
            selectedTypes,
            friendIdClause,
            dateClause
        );
        const events = [];
        await sqliteService.execute(
            (row) => {
                events.push({
                    id: row[0],
                    createdAt: row[1],
                    userId: row[2],
                    displayName: row[3],
                    type: row[4],
                    location: row[5] || '',
                    worldName: row[6] || '',
                    groupName: row[7] || '',
                    durationMs: row[8] || 0,
                    status: row[9] || '',
                    statusDescription: row[10] || '',
                    previousStatus: row[11] || '',
                    previousStatusDescription: row[12] || '',
                    bio: row[13] || '',
                    previousBio: row[14] || '',
                    avatarName: row[15] || '',
                    ownerId: row[16] || '',
                    avatarImageUrl: row[17] || ''
                });
            },
            `SELECT * FROM (${selects.join(' UNION ALL ')})
             WHERE 1=1 ${cursorClause}
             ORDER BY created_at DESC, id DESC
             LIMIT @limit`,
            args
        );
        const hasMore = events.length > limit;
        if (hasMore) {
            events.pop();
        }
        const lastEvent = events.at(-1);
        return {
            currentFriends,
            events,
            hasMore,
            nextCursor: hasMore
                ? { createdAt: lastEvent.createdAt, id: lastEvent.id }
                : null
        };
    },

    /**
     * Gets friendship changes and the locally cached mutual-friend graph for
     * current friends. Historical rows are retained, but the selected people
     * must still be current friends.
     *
     * @param {{friendIds: string[], before?: {createdAt: string, id: number}, limit?: number}} options
     */
    async getFriendInsightRelationships(options) {
        const friendIds = normalizeFriendIds(options?.friendIds);
        const currentFriends = await getCurrentFriends(friendIds);
        if (!currentFriends.length) {
            return {
                currentFriends,
                history: [],
                mutuals: [],
                hasMore: false,
                nextCursor: null
            };
        }
        const limit = clampLimit(
            options?.limit,
            DEFAULT_EVENT_LIMIT,
            MAX_EVENT_LIMIT
        );
        const args = { '@limit': limit + 1 };
        const currentFriendIds = currentFriends.map((friend) => friend.userId);
        const friendIdClause = addFriendIdParams(currentFriendIds, args);
        const cursorClause = addCursorClause(options?.before, args);
        const history = [];
        await sqliteService.execute(
            (row) => {
                history.push({
                    id: row[0],
                    createdAt: row[1],
                    type: row[2],
                    userId: row[3],
                    displayName: row[4] || row[3],
                    previousDisplayName: row[5] || '',
                    trustLevel: row[6] || '',
                    previousTrustLevel: row[7] || '',
                    friendNumber: row[8] || 0
                });
            },
            `SELECT id, created_at, type, user_id, display_name,
                    previous_display_name, trust_level, previous_trust_level,
                    friend_number
             FROM ${dbVars.userPrefix}_friend_log_history
             WHERE user_id IN (${friendIdClause})
                ${cursorClause}
             ORDER BY created_at DESC, id DESC
             LIMIT @limit`,
            args
        );
        const hasMore = history.length > limit;
        if (hasMore) {
            history.pop();
        }
        const lastHistoryEntry = history.at(-1);

        const mutualsByFriendId = new Map(
            currentFriends.map((friend) => [
                friend.userId,
                {
                    friendId: friend.userId,
                    mutualIds: [],
                    lastFetchedAt: '',
                    optedOut: false
                }
            ])
        );
        await sqliteService.execute(
            (row) => {
                const mutual = mutualsByFriendId.get(row[0]);
                if (!mutual) return;
                if (row[1]) {
                    mutual.mutualIds.push(row[1]);
                }
                mutual.lastFetchedAt = row[2] || '';
                mutual.optedOut = row[3] === 1;
            },
            `SELECT friends.user_id, links.mutual_id, meta.last_fetched_at,
                    meta.opted_out
             FROM ${dbVars.userPrefix}_friend_log_current AS friends
             LEFT JOIN ${dbVars.userPrefix}_mutual_graph_meta AS meta
                ON meta.friend_id = friends.user_id
             LEFT JOIN ${dbVars.userPrefix}_mutual_graph_links AS links
                ON links.friend_id = friends.user_id
             WHERE friends.user_id IN (${friendIdClause})
             ORDER BY friends.user_id ASC, links.mutual_id ASC`,
            args
        );
        return {
            currentFriends,
            history,
            mutuals: [...mutualsByFriendId.values()],
            hasMore,
            nextCursor: hasMore
                ? {
                      createdAt: lastHistoryEntry.createdAt,
                      id: lastHistoryEntry.id
                  }
                : null
        };
    },

    /**
     * Resolves a batch of user IDs to display names, using local cache only.
     * Returns found results plus a list of unresolved IDs for follow-up API lookup.
     *
     * @param {string[]} userIds
     * @returns {Promise<{resolved: Array<{userId: string, displayName: string}>, unresolved: string[]}>}
     */
    async resolveFriendInsightUsers(userIds) {
        const ids = [...new Set(userIds.filter((id) => typeof id === 'string' && id.length > 0))];
        if (!ids.length) return { resolved: [], unresolved: [] };

        // Check local friend cache first
        const currentFriends = await getCurrentFriends(ids);
        const foundIds = new Set(currentFriends.map((f) => f.userId));
        const resolved = currentFriends.map((f) => ({
            userId: f.userId,
            displayName: f.displayName
        }));
        const unresolved = ids.filter((id) => !foundIds.has(id));

        return { resolved, unresolved };
    }
};

export { friendInsight, normalizeDataTypes };
