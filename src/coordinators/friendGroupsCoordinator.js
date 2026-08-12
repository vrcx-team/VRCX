import { groupRequest } from '../api';
import { database } from '../services/database';
import { queryClient } from '../queries';
import { useFriendGroupsStore } from '../stores/friendGroups';
import { applyGroup } from './groupCoordinator';

/** 好友群组数据的新鲜度窗口（TTL），超过则增量刷新 */
const FRIEND_GROUPS_TTL_MS = 24 * 60 * 60 * 1000;

/** 请求间隔：VRChat API 限流约 30 req/min，留余量按 ~27/min 串行 */
const REQUEST_INTERVAL_MS = 2100;

/** 429 后等待重试的时长 */
const RATE_LIMIT_RETRY_MS = 30 * 1000;

/** 连续失败超过该数量则中止本轮同步 */
const MAX_CONSECUTIVE_FAILURES = 5;

let syncPromise = null;

/**
 * 同步好友加入的公开群组到本地数据库（单飞：同一时刻只跑一轮）。
 * @param {{ force?: boolean }} [options] force=true 忽略 TTL 全量刷新
 * @returns {Promise<void>}
 */
export function syncFriendGroups({ force = false } = {}) {
    if (syncPromise) {
        return syncPromise;
    }
    syncPromise = runSync(force).finally(() => {
        syncPromise = null;
    });
    return syncPromise;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
    return (
        err &&
        (err.status === 429 ||
            (typeof err.message === 'string' &&
                (err.message.includes('429') ||
                    err.message.includes('rate limit'))))
    );
}

async function runSync(force) {
    const store = useFriendGroupsStore();
    if (store.isSyncing) {
        return;
    }
    store.isSyncing = true;
    store.done = 0;
    store.failed = 0;
    store.startedAt = Date.now();

    try {
        const friends = await database.getFriendLogCurrent();
        store.total = friends.length;

        let dueFriendIds = friends.map((friend) => friend.userId);
        if (!force) {
            const fetchTimes = await database.getFriendGroupFetchTimes();
            const now = Date.now();
            dueFriendIds = dueFriendIds.filter((friendId) => {
                const fetchedAt = fetchTimes.get(friendId);
                if (!fetchedAt) {
                    return true;
                }
                const fetchedTime = new Date(fetchedAt).getTime();
                return (
                    Number.isNaN(fetchedTime) ||
                    now - fetchedTime > FRIEND_GROUPS_TTL_MS
                );
            });
        }

        const groupsToCache = [];
        const groupIdsSeen = new Set();
        let consecutiveFailures = 0;
        const dueCount = dueFriendIds.length;

        for (let i = 0; i < dueCount; i++) {
            const friendId = dueFriendIds[i];
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                break;
            }
            try {
                const { json } = await groupRequest.getGroups({
                    userId: friendId
                });
                const entries = [];
                for (const member of json || []) {
                    if (!member || !member.groupId) {
                        continue;
                    }
                    // API 只返回对请求者可见的群组，不再额外按 privacy 过滤
                    entries.push({
                        groupId: member.groupId,
                        joinedAt: member.joinedAt || '',
                        membershipStatus: member.membershipStatus || 'member',
                        visibility:
                            member.visibility || member.memberVisibility || ''
                    });
                    if (!groupIdsSeen.has(member.groupId)) {
                        groupIdsSeen.add(member.groupId);
                        groupsToCache.push({
                            id: member.groupId,
                            name: member.name,
                            shortCode: member.shortCode,
                            discriminator: member.discriminator,
                            description: member.description,
                            iconUrl: member.iconUrl,
                            bannerUrl: member.bannerUrl,
                            privacy: member.privacy,
                            memberCount: member.memberCount
                        });
                    }
                    applyGroup({
                        id: member.groupId,
                        name: member.name,
                        shortCode: member.shortCode,
                        discriminator: member.discriminator,
                        description: member.description,
                        iconUrl: member.iconUrl,
                        bannerUrl: member.bannerUrl,
                        privacy: member.privacy,
                        memberCount: member.memberCount
                    });
                }
                await database.replaceFriendGroups(friendId, entries);
                consecutiveFailures = 0;
            } catch (err) {
                console.error(`Failed to fetch groups for ${friendId}:`, err);
                store.failed += 1;
                consecutiveFailures += 1;
                if (isRateLimitError(err)) {
                    // 限流：等待后重试当前好友一次
                    await sleep(RATE_LIMIT_RETRY_MS);
                    try {
                        const { json } = await groupRequest.getGroups({
                            userId: friendId
                        });
                        const entries = [];
                        for (const member of json || []) {
                            if (!member || !member.groupId) {
                                continue;
                            }
                            // API 只返回对请求者可见的群组，不再额外按 privacy 过滤
                            entries.push({
                                groupId: member.groupId,
                                joinedAt: member.joinedAt || '',
                                membershipStatus:
                                    member.membershipStatus || 'member',
                                visibility:
                                    member.visibility ||
                                    member.memberVisibility ||
                                    ''
                            });
                            if (!groupIdsSeen.has(member.groupId)) {
                                groupIdsSeen.add(member.groupId);
                                groupsToCache.push({
                                    id: member.groupId,
                                    name: member.name,
                                    shortCode: member.shortCode,
                                    discriminator: member.discriminator,
                                    description: member.description,
                                    iconUrl: member.iconUrl,
                                    bannerUrl: member.bannerUrl,
                                    privacy: member.privacy,
                                    memberCount: member.memberCount
                                });
                            }
                            applyGroup({
                                id: member.groupId,
                                name: member.name,
                                shortCode: member.shortCode,
                                discriminator: member.discriminator,
                                description: member.description,
                                iconUrl: member.iconUrl,
                                bannerUrl: member.bannerUrl,
                                privacy: member.privacy,
                                memberCount: member.memberCount
                            });
                        }
                        await database.replaceFriendGroups(friendId, entries);
                        consecutiveFailures = 0;
                    } catch (retryErr) {
                        console.error(
                            `Retry failed for ${friendId}:`,
                            retryErr
                        );
                    }
                }
            }
            store.done += 1;
            // 限流间隔（最后一个好友不必等待）
            if (i < dueCount - 1) {
                await sleep(REQUEST_INTERVAL_MS);
            }
        }

        if (groupsToCache.length > 0) {
            await database.upsertCacheGroups(groupsToCache);
        }

        store.lastSyncedAt = new Date().toISOString();
        queryClient.invalidateQueries({
            queryKey: ['friendGroups']
        });
    } finally {
        store.isSyncing = false;
    }
}
