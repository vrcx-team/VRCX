import { dbVars } from '../database';

import {
    evaluateCondition,
    extractKeywords,
    parseExpression,
    tokenize
} from '../../shared/utils/feedSearchFormula';
import sqliteService from '../sqlite.js';

const feed = {
    addGPSToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_gps (created_at, user_id, display_name, location, world_name, previous_location, time, group_name) VALUES (@created_at, @user_id, @display_name, @location, @world_name, @previous_location, @time, @group_name)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@previous_location': entry.previousLocation,
                '@time': entry.time,
                '@group_name': entry.groupName
            }
        );
    },

    addStatusToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_status (created_at, user_id, display_name, status, status_description, previous_status, previous_status_description) VALUES (@created_at, @user_id, @display_name, @status, @status_description, @previous_status, @previous_status_description)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@status': entry.status,
                '@status_description': entry.statusDescription,
                '@previous_status': entry.previousStatus,
                '@previous_status_description': entry.previousStatusDescription
            }
        );
    },

    addBioToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_bio (created_at, user_id, display_name, bio, previous_bio) VALUES (@created_at, @user_id, @display_name, @bio, @previous_bio)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@bio': entry.bio,
                '@previous_bio': entry.previousBio
            }
        );
    },

    addAvatarToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_avatar (created_at, user_id, display_name, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url) VALUES (@created_at, @user_id, @display_name, @owner_id, @avatar_name, @current_avatar_image_url, @current_avatar_thumbnail_image_url, @previous_current_avatar_image_url, @previous_current_avatar_thumbnail_image_url)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@owner_id': entry.ownerId,
                '@avatar_name': entry.avatarName,
                '@current_avatar_image_url': entry.currentAvatarImageUrl,
                '@current_avatar_thumbnail_image_url':
                    entry.currentAvatarThumbnailImageUrl,
                '@previous_current_avatar_image_url':
                    entry.previousCurrentAvatarImageUrl,
                '@previous_current_avatar_thumbnail_image_url':
                    entry.previousCurrentAvatarThumbnailImageUrl
            }
        );
    },

    /**
     * Purges avatar feed data from the database.
     * !!!!
     * @param {string|null} cutoffDate - ISO date string. Deletes records older than this date. If null, deletes all records.
     */
    async purgeAvatarFeedData(cutoffDate) {
        if (cutoffDate) {
            await sqliteService.executeNonQuery(
                `DELETE FROM ${dbVars.userPrefix}_feed_avatar WHERE created_at < @cutoff`,
                {
                    '@cutoff': cutoffDate
                }
            );
        } else {
            await sqliteService.executeNonQuery(
                `DELETE FROM ${dbVars.userPrefix}_feed_avatar`
            );
        }
    },

    addOnlineOfflineToDatabase(entry) {
        sqliteService.executeNonQuery(
            `INSERT OR IGNORE INTO ${dbVars.userPrefix}_feed_online_offline (created_at, user_id, display_name, type, location, world_name, time, group_name) VALUES (@created_at, @user_id, @display_name, @type, @location, @world_name, @time, @group_name)`,
            {
                '@created_at': entry.created_at,
                '@user_id': entry.userId,
                '@display_name': entry.displayName,
                '@type': entry.type,
                '@location': entry.location,
                '@world_name': entry.worldName,
                '@time': entry.time,
                '@group_name': entry.groupName
            }
        );
    },

    _collectResults(results) {
        const collected = new Map();
        for (const row of results) {
            const key =
                row.rowId ||
                row.id ||
                `${row.displayName}_${row.worldName || ''}_${row.type}_${row.created_at || row.time || ''}_${row.avatarName || ''}`;
            collected.set(key, row);
        }
        return collected;
    },

    async searchFeedDatabase(
        search,
        filters,
        vipList,
        maxEntries = dbVars.searchTableSize,
        dateFrom = '',
        dateTo = ''
    ) {
        if (
            search.startsWith('wrld_') ||
            search.startsWith('grp_') ||
            search.startsWith('usr_')
        ) {
            return this.getFeedByInstanceId(
                search,
                filters,
                vipList,
                maxEntries
            );
        }

        const trimmedSearch = search.trim();
        if (trimmedSearch.startsWith('=') && trimmedSearch.length > 1) {
            try {
                // 去掉开头的 =
                const formulaSearch = trimmedSearch.substring(1);
                const tokens = tokenize(formulaSearch);
                const ast = parseExpression(tokens, formulaSearch);
                const keywords = extractKeywords(ast);

                // Try to extract time constraints from formula to optimize SQL
                const extractTimeFromAST = (node) => {
                    if (!node) return;
                    if (node.type === 'FIELD' && node.field === 'time') {
                        const v = String(node.value);
                        let start = null;
                        let end = null;

                        const safeParseDate = (dateStr) => {
                            try {
                                const d = new Date(dateStr.trim());
                                if (isNaN(d.getTime())) return null;
                                return d;
                            } catch {
                                return null;
                            }
                        };

                        const safeToISO = (date) => {
                            if (!date) return null;
                            try {
                                return date.toISOString();
                            } catch {
                                return null;
                            }
                        };

                        if (v.includes('~')) {
                            const [s, e] = v.split('~');
                            if (s.trim()) {
                                const d = safeParseDate(s.trim());
                                start = safeToISO(d);
                            }
                            if (e.trim()) {
                                const d = safeParseDate(e.trim());
                                end = safeToISO(d);
                            }
                        } else if (v.includes('+') || v.includes('-')) {
                            // Point arithmetic is harder to optimize for SQL without more logic
                            return;
                        } else if (node.op === 'EQUALS' || !node.op) {
                            // If just a date, set range for the whole day to optimize SQL
                            if (v.match(/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/)) {
                                const date = safeParseDate(v);
                                if (date) {
                                    start = new Date(date);
                                    end = new Date(date);
                                    end.setDate(end.getDate() + 1);
                                    start = safeToISO(start);
                                    end = safeToISO(end);
                                }
                            } else {
                                // Specific time point
                                const d = safeParseDate(v);
                                start = safeToISO(d);
                            }
                        } else if (node.op === 'GT' || node.op === 'GE') {
                            const d = safeParseDate(v);
                            start = safeToISO(d);
                        } else if (node.op === 'LT' || node.op === 'LE') {
                            const d = safeParseDate(v);
                            end = safeToISO(d);
                        }
                        // Union: take the earliest start and latest end
                        if (start && (!dateFrom || start < dateFrom))
                            dateFrom = start;
                        if (end && (!dateTo || end > dateTo)) dateTo = end;
                    } else if (node.type === 'AND') {
                        extractTimeFromAST(node.left);
                        extractTimeFromAST(node.right);
                    } else if (node.type === 'OR') {
                        // For OR, we need to collect time constraints from both sides and union
                        const leftResult = { dateFrom: null, dateTo: null };
                        const rightResult = { dateFrom: null, dateTo: null };
                        const originalDateFrom = dateFrom;
                        const originalDateTo = dateTo;
                        dateFrom = null;
                        dateTo = null;
                        extractTimeFromAST(node.left);
                        Object.assign(leftResult, { dateFrom, dateTo });
                        dateFrom = null;
                        dateTo = null;
                        extractTimeFromAST(node.right);
                        Object.assign(rightResult, { dateFrom, dateTo });
                        dateFrom = originalDateFrom;
                        dateTo = originalDateTo;
                        // Union both results
                        if (
                            leftResult.dateFrom &&
                            (!dateFrom || leftResult.dateFrom < dateFrom)
                        )
                            dateFrom = leftResult.dateFrom;
                        if (
                            leftResult.dateTo &&
                            (!dateTo || leftResult.dateTo > dateTo)
                        )
                            dateTo = leftResult.dateTo;
                        if (
                            rightResult.dateFrom &&
                            (!dateFrom || rightResult.dateFrom < dateFrom)
                        )
                            dateFrom = rightResult.dateFrom;
                        if (
                            rightResult.dateTo &&
                            (!dateTo || rightResult.dateTo > dateTo)
                        )
                            dateTo = rightResult.dateTo;
                    }
                };
                extractTimeFromAST(ast);

                const allResults = new Map();
                const searchStartTime = Date.now();

                if (keywords.length > 0) {
                    const mergedKeyword = keywords.join('|');
                    const keywordResults = await this.searchFeedDatabase(
                        mergedKeyword,
                        filters,
                        vipList,
                        maxEntries,
                        dateFrom,
                        dateTo
                    );
                    const collected = this._collectResults(keywordResults);
                    collected.forEach((row, key) => allResults.set(key, row));
                } else {
                    const emptyResults = await this.searchFeedDatabase(
                        '',
                        filters,
                        vipList,
                        maxEntries,
                        dateFrom,
                        dateTo
                    );
                    const collected = this._collectResults(emptyResults);
                    collected.forEach((row, key) => allResults.set(key, row));
                }

                const searchDuration = Date.now() - searchStartTime;
                if (searchDuration > 2000) {
                    console.warn(
                        `[FormulaSearch] Slow query detected: ${searchDuration}ms, keywords: ${keywords.length}`
                    );
                }

                // First filter, then sort, then limit - much more efficient
                const results = Array.from(allResults.values());
                const filtered = results.filter((row) =>
                    evaluateCondition(ast, row)
                );
                filtered.sort((a, b) => {
                    const timeA = a.created_at ? Date.parse(a.created_at) : 0;
                    const timeB = b.created_at ? Date.parse(b.created_at) : 0;
                    return timeB - timeA;
                });
                return filtered.slice(0, maxEntries);
            } catch (err) {
                console.error('[FormulaSearch] Formula search error:', err);
                throw err;
            }
        }

        let vipQuery = '';
        const vipArgs = {};
        if (vipList.length > 0) {
            const vipPlaceholders = [];
            vipList.forEach((vip, i) => {
                const key = `@vip_${i}`;
                vipArgs[key] = vip;
                vipPlaceholders.push(key);
            });
            vipQuery = `AND user_id IN (${vipPlaceholders.join(', ')})`;
        }
        let dateQuery = '';
        if (dateFrom) {
            dateQuery += 'AND created_at >= @dateFrom ';
        }
        if (dateTo) {
            dateQuery += 'AND created_at <= @dateTo ';
        }
        let gps = true;
        let status = true;
        let bio = true;
        let avatar = true;
        let online = true;
        let offline = true;
        const aviPublic = search.includes('public');
        const aviPrivate = search.includes('private');
        if (filters.length > 0) {
            gps = false;
            status = false;
            bio = false;
            avatar = false;
            online = false;
            offline = false;
            filters.forEach((filter) => {
                switch (filter) {
                    case 'GPS':
                        gps = true;
                        break;
                    case 'Status':
                        status = true;
                        break;
                    case 'Bio':
                        bio = true;
                        break;
                    case 'Avatar':
                        avatar = true;
                        break;
                    case 'Online':
                        online = true;
                        break;
                    case 'Offline':
                        offline = true;
                        break;
                }
            });
        }
        const buildSearchCondition = (fields) => {
            const searchTerms = search.includes('|')
                ? search.split('|')
                : [search];
            const conditions = [];
            const args = {};

            searchTerms.forEach((term, i) => {
                const key = `@searchLike_${i}`;
                args[key] = `%${term.trim()}%`;
                const fieldConditions = fields.map(
                    (field) => `${field} LIKE ${key}`
                );
                conditions.push(`(${fieldConditions.join(' OR ')})`);
            });

            return { condition: conditions.join(' OR '), args };
        };

        const selects = [];
        const baseColumns = [
            'id',
            'created_at',
            'user_id',
            'display_name',
            'type',
            'location',
            'world_name',
            'previous_location',
            'time',
            'group_name',
            'status',
            'status_description',
            'previous_status',
            'previous_status_description',
            'bio',
            'previous_bio',
            'owner_id',
            'avatar_name',
            'current_avatar_image_url',
            'current_avatar_thumbnail_image_url',
            'previous_current_avatar_image_url',
            'previous_current_avatar_thumbnail_image_url'
        ].join(', ');

        const gpsSearch = buildSearchCondition([
            'display_name',
            'world_name',
            'group_name'
        ]);
        const statusSearch = buildSearchCondition([
            'display_name',
            'status',
            'status_description'
        ]);
        const bioSearch = buildSearchCondition(['display_name', 'bio']);
        const avatarSearch = buildSearchCondition([
            'display_name',
            'avatar_name'
        ]);
        const onlineSearch = buildSearchCondition([
            'display_name',
            'world_name',
            'group_name'
        ]);

        if (gps) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE ${gpsSearch.condition} ${dateQuery} ${vipQuery} ORDER BY created_at DESC, id DESC LIMIT @perTable)`
            );
        }
        if (status) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Status' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, status, status_description, previous_status, previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_status WHERE ${statusSearch.condition} ${dateQuery} ${vipQuery} ORDER BY created_at DESC, id DESC LIMIT @perTable)`
            );
        }
        if (bio) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Bio' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, bio, previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_bio WHERE ${bioSearch.condition} ${dateQuery} ${vipQuery} ORDER BY created_at DESC, id DESC LIMIT @perTable)`
            );
        }
        if (avatar) {
            let avatarQuery = '';
            if (aviPrivate) {
                avatarQuery = 'OR user_id = owner_id';
            } else if (aviPublic) {
                avatarQuery = 'OR user_id != owner_id';
            }
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Avatar' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_avatar WHERE ${avatarSearch.condition} ${avatarQuery} ${dateQuery} ${vipQuery} ORDER BY created_at DESC, id DESC LIMIT @perTable)`
            );
        }
        if (online || offline) {
            let query = '';
            if (!online || !offline) {
                if (online) {
                    query = "AND type = 'Online'";
                } else if (offline) {
                    query = "AND type = 'Offline'";
                }
            }
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE ${onlineSearch.condition} ${query} ${dateQuery} ${vipQuery} ORDER BY created_at DESC, id DESC LIMIT @perTable)`
            );
        }
        if (selects.length === 0) {
            return [];
        }
        const feedDatabase = [];
        const allArgs = {
            '@limit': maxEntries,
            '@perTable': maxEntries,
            ...vipArgs,
            ...gpsSearch.args,
            ...statusSearch.args,
            ...bioSearch.args,
            ...avatarSearch.args,
            ...onlineSearch.args
        };
        if (dateFrom) {
            allArgs['@dateFrom'] = dateFrom;
        }
        if (dateTo) {
            allArgs['@dateTo'] = dateTo;
        }
        await sqliteService.execute(
            (dbRow) => {
                const type = dbRow[4];
                const row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type
                };
                switch (type) {
                    case 'GPS':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.previousLocation = dbRow[7];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                    case 'Status':
                        row.status = dbRow[10];
                        row.statusDescription = dbRow[11];
                        row.previousStatus = dbRow[12];
                        row.previousStatusDescription = dbRow[13];
                        break;
                    case 'Bio':
                        row.bio = dbRow[14];
                        row.previousBio = dbRow[15];
                        break;
                    case 'Avatar':
                        row.ownerId = dbRow[16];
                        row.avatarName = dbRow[17];
                        row.currentAvatarImageUrl = dbRow[18];
                        row.currentAvatarThumbnailImageUrl = dbRow[19];
                        row.previousCurrentAvatarImageUrl = dbRow[20];
                        row.previousCurrentAvatarThumbnailImageUrl = dbRow[21];
                        break;
                    case 'Online':
                    case 'Offline':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                }
                feedDatabase.push(row);
            },
            `SELECT ${baseColumns} FROM (${selects.join(' UNION ALL ')}) ORDER BY created_at DESC, id DESC LIMIT @limit`,
            allArgs
        );
        return feedDatabase;
    },

    async lookupFeedDatabase(
        filters,
        vipList,
        maxEntries = dbVars.maxTableSize
    ) {
        let vipQuery = '';
        const vipArgs = {};
        if (vipList.length > 0) {
            const vipPlaceholders = [];
            vipList.forEach((vip, i) => {
                const key = `@vip_${i}`;
                vipArgs[key] = vip;
                vipPlaceholders.push(key);
            });
            vipQuery = `AND user_id IN (${vipPlaceholders.join(', ')})`;
        }
        let gps = true;
        let status = true;
        let bio = true;
        let avatar = true;
        let online = true;
        let offline = true;
        if (filters.length > 0) {
            gps = false;
            status = false;
            bio = false;
            avatar = false;
            online = false;
            offline = false;
            filters.forEach((filter) => {
                switch (filter) {
                    case 'GPS':
                        gps = true;
                        break;
                    case 'Status':
                        status = true;
                        break;
                    case 'Bio':
                        bio = true;
                        break;
                    case 'Avatar':
                        avatar = true;
                        break;
                    case 'Online':
                        online = true;
                        break;
                    case 'Offline':
                        offline = true;
                        break;
                }
            });
        }
        const selects = [];
        const baseColumns = [
            'id',
            'created_at',
            'user_id',
            'display_name',
            'type',
            'location',
            'world_name',
            'previous_location',
            'time',
            'group_name',
            'status',
            'status_description',
            'previous_status',
            'previous_status_description',
            'bio',
            'previous_bio',
            'owner_id',
            'avatar_name',
            'current_avatar_image_url',
            'current_avatar_thumbnail_image_url',
            'previous_current_avatar_image_url',
            'previous_current_avatar_thumbnail_image_url'
        ].join(', ');
        if (gps) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (status) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Status' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, status, status_description, previous_status, previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_status WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (bio) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Bio' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, bio, previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_bio WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (avatar) {
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, 'Avatar' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_avatar WHERE 1=1 ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (online || offline) {
            let query = '';
            if (!online || !offline) {
                if (online) {
                    query = "AND type = 'Online'";
                } else if (offline) {
                    query = "AND type = 'Offline'";
                }
            }
            selects.push(
                `SELECT * FROM (SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE 1=1 ${query} ${vipQuery} ORDER BY id DESC LIMIT @perTable)`
            );
        }
        if (selects.length === 0) {
            return [];
        }
        const feedDatabase = [];
        const args = {
            '@limit': maxEntries,
            '@perTable': maxEntries,
            ...vipArgs
        };
        await sqliteService.execute(
            (dbRow) => {
                const type = dbRow[4];
                const row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type
                };
                switch (type) {
                    case 'GPS':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.previousLocation = dbRow[7];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                    case 'Status':
                        row.status = dbRow[10];
                        row.statusDescription = dbRow[11];
                        row.previousStatus = dbRow[12];
                        row.previousStatusDescription = dbRow[13];
                        break;
                    case 'Bio':
                        row.bio = dbRow[14];
                        row.previousBio = dbRow[15];
                        break;
                    case 'Avatar':
                        row.ownerId = dbRow[16];
                        row.avatarName = dbRow[17];
                        row.currentAvatarImageUrl = dbRow[18];
                        row.currentAvatarThumbnailImageUrl = dbRow[19];
                        row.previousCurrentAvatarImageUrl = dbRow[20];
                        row.previousCurrentAvatarThumbnailImageUrl = dbRow[21];
                        break;
                    case 'Online':
                    case 'Offline':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                }
                feedDatabase.push(row);
            },
            `SELECT ${baseColumns} FROM (${selects.join(' UNION ALL ')}) ORDER BY created_at DESC, id DESC LIMIT @limit`,
            args
        );
        return feedDatabase;
    },

    async getFeedByInstanceId(instanceId, filters, vipList, maxEntries) {
        let vipQuery = '';
        const vipArgs = {};
        if (vipList.length > 0) {
            const vipPlaceholders = [];
            vipList.forEach((vip, i) => {
                const key = `@vip_${i}`;
                vipArgs[key] = vip;
                vipPlaceholders.push(key);
            });
            vipQuery = `AND user_id IN (${vipPlaceholders.join(', ')})`;
        }
        let gps = true;
        let online = true;
        let offline = true;
        let status = true;
        let bio = true;
        let avatar = true;
        if (filters.length > 0) {
            gps = filters.includes('GPS');
            online = filters.includes('Online');
            offline = filters.includes('Offline');
            status = filters.includes('Status');
            bio = filters.includes('Bio');
            avatar = filters.includes('Avatar');
        }
        const selects = [];
        const isWorld = instanceId.startsWith('wrld_');
        const isGroup = instanceId.startsWith('grp_');
        const isUser = instanceId.startsWith('usr_');

        if (gps && (isWorld || isGroup)) {
            const field = isWorld ? 'location' : 'group_name';
            selects.push(
                `SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE ${field} LIKE @instanceId ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
            );
        }
        if ((online || offline) && (isWorld || isGroup)) {
            const field = isWorld ? 'location' : 'group_name';
            let typeQuery = '';
            if (!online || !offline) {
                typeQuery = online
                    ? "AND type = 'Online'"
                    : "AND type = 'Offline'";
            }
            selects.push(
                `SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE ${field} LIKE @instanceId ${typeQuery} ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
            );
        }

        // User specific searches
        if (isUser) {
            if (gps)
                selects.push(
                    `SELECT id, created_at, user_id, display_name, 'GPS' AS type, location, world_name, previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_gps WHERE user_id LIKE @instanceId ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
                );
            if (status)
                selects.push(
                    `SELECT id, created_at, user_id, display_name, 'Status' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, status, status_description, previous_status, previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_status WHERE user_id LIKE @instanceId ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
                );
            if (bio)
                selects.push(
                    `SELECT id, created_at, user_id, display_name, 'Bio' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, bio, previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_bio WHERE user_id LIKE @instanceId ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
                );
            if (avatar)
                selects.push(
                    `SELECT id, created_at, user_id, display_name, 'Avatar' AS type, NULL AS location, NULL AS world_name, NULL AS previous_location, NULL AS time, NULL AS group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, owner_id, avatar_name, current_avatar_image_url, current_avatar_thumbnail_image_url, previous_current_avatar_image_url, previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_avatar WHERE user_id LIKE @instanceId ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
                );
            if (online || offline) {
                let typeQuery = '';
                if (!online || !offline) {
                    typeQuery = online
                        ? "AND type = 'Online'"
                        : "AND type = 'Offline'";
                }
                selects.push(
                    `SELECT id, created_at, user_id, display_name, type, location, world_name, NULL AS previous_location, time, group_name, NULL AS status, NULL AS status_description, NULL AS previous_status, NULL AS previous_status_description, NULL AS bio, NULL AS previous_bio, NULL AS owner_id, NULL AS avatar_name, NULL AS current_avatar_image_url, NULL AS current_avatar_thumbnail_image_url, NULL AS previous_current_avatar_image_url, NULL AS previous_current_avatar_thumbnail_image_url FROM ${dbVars.userPrefix}_feed_online_offline WHERE user_id LIKE @instanceId ${typeQuery} ${vipQuery} ORDER BY created_at DESC LIMIT @limit`
                );
            }
        }

        if (selects.length === 0) return [];

        const query = `SELECT * FROM (${selects.join(' UNION ALL ')}) ORDER BY created_at DESC LIMIT @limit`;
        const feedDatabase = [];
        await sqliteService.execute(
            (dbRow) => {
                const type = dbRow[4];
                const row = {
                    rowId: dbRow[0],
                    created_at: dbRow[1],
                    userId: dbRow[2],
                    displayName: dbRow[3],
                    type
                };
                switch (type) {
                    case 'GPS':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.previousLocation = dbRow[7];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                    case 'Status':
                        row.status = dbRow[10];
                        row.statusDescription = dbRow[11];
                        row.previousStatus = dbRow[12];
                        row.previousStatusDescription = dbRow[13];
                        break;
                    case 'Bio':
                        row.bio = dbRow[14];
                        row.previousBio = dbRow[15];
                        break;
                    case 'Avatar':
                        row.ownerId = dbRow[16];
                        row.avatarName = dbRow[17];
                        row.currentAvatarImageUrl = dbRow[18];
                        row.currentAvatarThumbnailImageUrl = dbRow[19];
                        row.previousCurrentAvatarImageUrl = dbRow[20];
                        row.previousCurrentAvatarThumbnailImageUrl = dbRow[21];
                        break;
                    case 'Online':
                    case 'Offline':
                        row.location = dbRow[5];
                        row.worldName = dbRow[6];
                        row.time = dbRow[8];
                        row.groupName = dbRow[9];
                        break;
                }
                feedDatabase.push(row);
            },
            query,
            {
                '@instanceId': `${instanceId}%`,
                '@limit': maxEntries,
                ...vipArgs
            }
        );
        return feedDatabase;
    },

    /**
     * @param {number} days - Number of days to look back
     * @param {number} limit - Max number of worlds to return
     * @returns {Promise<Array>} Ranked list of hot worlds
     */
    async getHotWorlds(days = 30, limit = 30) {
        const halfDays = Math.floor(days / 2);
        const results = [];
        await sqliteService.execute(
            (dbRow) => {
                results.push({
                    worldId: dbRow[0],
                    worldName: dbRow[1],
                    visitCount: dbRow[2],
                    uniqueFriends: dbRow[3],
                    lastVisited: dbRow[4]
                });
            },
            `SELECT
                SUBSTR(location, 1, INSTR(location, ':') - 1) AS world_id,
                world_name,
                COUNT(*) AS visit_count,
                COUNT(DISTINCT user_id) AS unique_friends,
                MAX(created_at) AS last_visited
            FROM ${dbVars.userPrefix}_feed_gps
            WHERE created_at >= datetime('now', @daysOffset)
                AND location LIKE 'wrld_%'
                AND INSTR(location, ':') > 0
                AND world_name IS NOT NULL AND world_name != ''
            GROUP BY world_id
            ORDER BY unique_friends DESC, visit_count DESC
            LIMIT @limit`,
            {
                '@daysOffset': `-${days} days`,
                '@limit': limit
            }
        );

        const trendMap = new Map();
        await sqliteService.execute(
            (dbRow) => {
                trendMap.set(dbRow[0], dbRow[1]);
            },
            `SELECT
                SUBSTR(location, 1, INSTR(location, ':') - 1) AS world_id,
                COUNT(DISTINCT user_id) AS unique_friends
            FROM ${dbVars.userPrefix}_feed_gps
            WHERE created_at >= datetime('now', @daysOffset)
                AND created_at < datetime('now', @halfOffset)
                AND location LIKE 'wrld_%'
                AND INSTR(location, ':') > 0
                AND world_name IS NOT NULL AND world_name != ''
            GROUP BY world_id`,
            {
                '@daysOffset': `-${days} days`,
                '@halfOffset': `-${halfDays} days`
            }
        );

        const recentMap = new Map();
        await sqliteService.execute(
            (dbRow) => {
                recentMap.set(dbRow[0], dbRow[1]);
            },
            `SELECT
                SUBSTR(location, 1, INSTR(location, ':') - 1) AS world_id,
                COUNT(DISTINCT user_id) AS unique_friends
            FROM ${dbVars.userPrefix}_feed_gps
            WHERE created_at >= datetime('now', @halfOffset)
                AND location LIKE 'wrld_%'
                AND INSTR(location, ':') > 0
                AND world_name IS NOT NULL AND world_name != ''
            GROUP BY world_id`,
            {
                '@halfOffset': `-${halfDays} days`
            }
        );

        for (const world of results) {
            const oldFriends = trendMap.get(world.worldId) || 0;
            const newFriends = recentMap.get(world.worldId) || 0;
            if (newFriends > oldFriends) {
                world.trend = 'rising';
            } else if (newFriends < oldFriends) {
                world.trend = 'cooling';
            } else {
                world.trend = 'stable';
            }
        }

        return results;
    },

    /**
     * @param {string} worldId - The world ID (e.g. wrld_xxx)
     * @param {number} days - Number of days to look back
     * @returns {Promise<Array>} List of friends who visited
     */
    async getHotWorldFriendDetail(worldId, days = 30) {
        const results = [];
        await sqliteService.execute(
            (dbRow) => {
                results.push({
                    userId: dbRow[0],
                    displayName: dbRow[1],
                    visitCount: dbRow[2],
                    lastVisit: dbRow[3]
                });
            },
            `SELECT
                user_id,
                display_name,
                COUNT(*) AS visit_count,
                MAX(created_at) AS last_visit
            FROM ${dbVars.userPrefix}_feed_gps
            WHERE SUBSTR(location, 1, INSTR(location, ':') - 1) = @worldId
                AND created_at >= datetime('now', @daysOffset)
            GROUP BY user_id
            ORDER BY visit_count DESC`,
            {
                '@worldId': worldId,
                '@daysOffset': `-${days} days`
            }
        );
        return results;
    }
};

export { feed };
