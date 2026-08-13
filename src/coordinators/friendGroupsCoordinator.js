import { groupRequest } from '../api';
import { database } from '../services/database';
import { queryClient } from '../queries';
import { useFriendGroupsStore } from '../stores/friendGroups';
import { applyGroup } from './groupCoordinator';

/** 好友群组数据的新鲜度窗口（TTL），超过则增量刷新 */
const FRIEND_GROUPS_TTL_MS = 24 * 60 * 60 * 1000;

/** 请求间隔（自适应）：初始约 30/min（VRChat 文档限流值内），给关系网等共享配额的
 *  功能留余量；无 429 时逐步提速 */
const BASE_INTERVAL_MS = 2000;

/** 提速下限（约 37/min），高于此不再加速 */
const MIN_INTERVAL_MS = 1600;

/** 连续成功 N 次后缩短一步间隔 */
const ADAPT_STEP_MS = 100;
const ADAPT_EVERY_SUCCESS = 30;

/** 429 后降速到的保守间隔 */
const RATE_LIMIT_INTERVAL_MS = 2500;

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
        let requestInterval = BASE_INTERVAL_MS;
        let adaptCounter = 0;
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
                // 自适应提速：连续成功 N 次后缩短间隔（不触发 429 的前提下）
                adaptCounter += 1;
                if (
                    adaptCounter >= ADAPT_EVERY_SUCCESS &&
                    requestInterval > MIN_INTERVAL_MS
                ) {
                    requestInterval -= ADAPT_STEP_MS;
                    adaptCounter = 0;
                }
            } catch (err) {
                console.error(`Failed to fetch groups for ${friendId}:`, err);
                store.failed += 1;
                if (isRateLimitError(err)) {
                    // 限流是暂时的：降速 + 退避后重试，不计入连续失败（否则会误中止整轮）
                    requestInterval = RATE_LIMIT_INTERVAL_MS;
                    adaptCounter = 0;
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
                } else {
                    // 非限流错误才计入连续失败（连续过多则中止，避免带病空转）
                    consecutiveFailures += 1;
                }
            }
            store.done += 1;
            // 限流间隔（最后一个好友不必等待）
            if (i < dueCount - 1) {
                await sleep(requestInterval);
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
