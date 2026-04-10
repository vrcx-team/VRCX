import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

import { hasGroupPermission } from '../shared/utils';
import { groupRequest, notificationRequest, queryRequest } from '../api';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useUserStore } from './user';
import { watchState } from '../services/watchState';
import { parseLocation } from '../shared/utils';

import configRepository from '../services/config';

/**
 * Delay presets in milliseconds.
 */
const DELAY_PRESETS = {
    normal: 4000,
    relaxed: 6000,
    cautious: 8000,
    slow: 10000,
    stealth: 15000
};

/** Maximum number of entries the persistent invite cache will hold. */
const MAX_CACHE_SIZE = 15000;

export const useGroupInviteStore = defineStore('GroupInvite', () => {
    const friendStore = useFriendStore();
    const groupStore = useGroupStore();
    const locationStore = useLocationStore();
    const userStore = useUserStore();

    // ── State ──────────────────────────────────────────────────
    const selectedGroupId = ref('');
    const autoInviteEnabled = ref(false);
    const delayPreset = ref('normal'); // 'normal' | 'relaxed' | 'cautious' | 'slow' | 'stealth'
    const isRunning = ref(false);
    const isCancelled = ref(false);

    // ── Tracker State ──────────────────────────────────────────
    const currentProgress = ref(0);
    const totalProgress = ref(0);
    const rateLimitStrikes = ref(0);

    /**
     * List of user IDs or display names to ignore.
     * @type {import('vue').Ref<string[]>}
     */
    const blacklist = ref([]);

    /**
     * Persistent invite cache (survives account switches and restarts).
     * Keys are `${userId}::${groupId}` strings.
     * @type {Set<string>}
     */
    const inviteCache = reactive(new Set());

    /** In-flight auto-invite dedup set to prevent concurrent API calls for the same user. */
    const autoInviteInFlight = new Set();

    /**
     * Recent invite log entries for UI display.
     * @type {import('vue').Ref<Array<{userId: string, displayName: string, groupId: string, timestamp: number, status: string, message: string}>>}
     */
    const inviteLog = ref([]);

    // ── Computed ────────────────────────────────────────────────

    const delayMs = computed(() => DELAY_PRESETS[delayPreset.value] ?? DELAY_PRESETS.normal);

    /**
     * Groups the current user has `group-invites-manage` permission for.
     */
    const groupsWithInvitePermission = computed(() => {
        return Array.from(groupStore.currentUserGroups.values()).filter(
            (group) => hasGroupPermission(group, 'group-invites-manage')
        );
    });

    const selectedGroup = computed(() => {
        if (!selectedGroupId.value) return null;
        return groupsWithInvitePermission.value.find(
            (g) => g.id === selectedGroupId.value
        ) ?? null;
    });

    const cacheSize = computed(() => inviteCache.size);

    /** Telemetry counters derived from the invite log. Only counts for currently selected group if one exists. */
    const logStats = computed(() => {
        const stats = { sent: 0, error: 0, cached: 0, skipped: 0 };
        for (const entry of inviteLog.value) {
            // Filter by selected group if one is selected, else show all stats
            if (selectedGroupId.value && entry.groupId !== selectedGroupId.value) continue;

            if (stats[entry.status] !== undefined) stats[entry.status]++;
        }
        return stats;
    });

    // ── Reset on logout ────────────────────────────────────────

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (!isLoggedIn) {
                autoInviteEnabled.value = false;
                isRunning.value = false;
                isCancelled.value = false;
                rateLimitStrikes.value = 0;
                autoInviteInFlight.clear();
                // NOTE: inviteCache and inviteLog are intentionally NOT cleared
                // on logout so they persist across account switches
                selectedGroupId.value = '';
            }
        },
        { flush: 'sync' }
    );

    // ── Persistence (selected group only) ──────────────────────

    let isSettingsLoaded = false;

    async function loadSettings() {
        selectedGroupId.value = await configRepository.getString(
            'groupInviteToolkit_selectedGroup',
            ''
        );
        delayPreset.value = await configRepository.getString(
            'groupInviteToolkit_delayPreset',
            'normal'
        );
        blacklist.value = await configRepository.getArray(
            'groupInviteToolkit_blacklist',
            []
        );

        // Load persistent invite cache
        const savedCache = await configRepository.getArray(
            'groupInviteToolkit_cache',
            []
        );
        savedCache.forEach((k) => inviteCache.add(k));
        console.log(`[GroupInvite] Loaded ${savedCache.length} cached invite entries from storage.`);

        // Load persistent invite log (telemetry)
        try {
            const savedLog = JSON.parse(
                await configRepository.getString('groupInviteToolkit_log', '[]')
            );
            if (Array.isArray(savedLog)) {
                inviteLog.value = savedLog.slice(0, MAX_LOG);
                console.log(`[GroupInvite] Loaded ${inviteLog.value.length} log entries from storage.`);
            }
        } catch {
            inviteLog.value = [];
        }

        isSettingsLoaded = true;
    }

    async function saveSettings() {
        if (!isSettingsLoaded) return;

        await configRepository.setString(
            'groupInviteToolkit_selectedGroup',
            selectedGroupId.value
        );
        await configRepository.setString(
            'groupInviteToolkit_delayPreset',
            delayPreset.value
        );
        await configRepository.setArray(
            'groupInviteToolkit_blacklist',
            blacklist.value
        );
    }

    loadSettings();

    watch(selectedGroupId, saveSettings);
    watch(delayPreset, saveSettings);
    watch(blacklist, saveSettings, { deep: true });

    // ── Cache helpers ──────────────────────────────────────────

    /**
     * @param {string} userId
     * @param {string} groupId
     * @returns {string}
     */
    function cacheKey(userId, groupId) {
        return `${userId}::${groupId}`;
    }

    /**
     * @param {string} userId
     * @param {string} groupId
     * @returns {boolean}
     */
    function isAlreadyInvited(userId, groupId) {
        return inviteCache.has(cacheKey(userId, groupId));
    }

    /**
     * @param {string} userId
     * @param {string} groupId
     */
    function markInvited(userId, groupId) {
        inviteCache.add(cacheKey(userId, groupId));
        // Cap cache at MAX_CACHE_SIZE, evicting oldest entries (Set maintains insertion order)
        if (inviteCache.size > MAX_CACHE_SIZE) {
            const excess = inviteCache.size - MAX_CACHE_SIZE;
            let count = 0;
            for (const key of inviteCache) {
                if (count >= excess) break;
                inviteCache.delete(key);
                count++;
            }
        }
        debouncedPersist();
    }

    function clearCache() {
        inviteCache.clear();
        flushPersist(); // Immediate write on explicit clear
        toast.success('Invite cache cleared — everyone can be re-invited.');
    }

    // ── Debounced Persistence ──────────────────────────────────

    let persistTimer = null;

    /**
     * Debounced write of cache + log to SQLite.
     * Batches rapid writes (e.g., 50 invites) into a single I/O operation.
     */
    function debouncedPersist() {
        if (!isSettingsLoaded) return;
        if (persistTimer) clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
            flushPersist();
        }, 2000);
    }

    /**
     * Immediately persist cache + log to SQLite.
     */
    function flushPersist() {
        if (!isSettingsLoaded) return;
        if (persistTimer) {
            clearTimeout(persistTimer);
            persistTimer = null;
        }
        configRepository.setArray('groupInviteToolkit_cache', Array.from(inviteCache));
        configRepository.setString('groupInviteToolkit_log', JSON.stringify(inviteLog.value));
    }

    // ── Logging ────────────────────────────────────────────────

    const MAX_LOG = 200;

    /**
     * @param {string} userId
     * @param {string} displayName
     * @param {string} groupId
     * @param {'sent' | 'cached' | 'error' | 'skipped'} status
     * @param {string} [message]
     */
    function addLog(userId, displayName, groupId, status, message) {
        inviteLog.value.unshift({
            userId,
            displayName,
            groupId,
            timestamp: Date.now(),
            status,
            message: message || ''
        });
        if (inviteLog.value.length > MAX_LOG) {
            inviteLog.value.length = MAX_LOG;
        }
        debouncedPersist();
    }

    // ── Core invite function ───────────────────────────────────

    /**
     * API error strings that indicate a permanent state —
     * the user should be cached and never re-requested.
     */
    const PERMANENT_ERRORS = [
        'Already invited',
        'Already a group member',
        'User has too many invites/groups',
        'User not found',
        'User blocked invites'
    ];

    /**
     * Parses common VRChat API errors into clean UI strings.
     */
    function parseApiError(err) {
        const msg = err?.error?.message || err?.message || 'Unknown API Error';
        const lower = msg.toLowerCase();
        if (lower.includes('rate limit') || err?.status === 429) return 'Rate Limited (429)';
        if (lower.includes('already invited')) return 'Already invited';
        if (lower.includes('already a member')) return 'Already a group member';
        if (lower.includes('too many') || lower.includes('limit reached')) return 'User has too many invites/groups';
        if (lower.includes('not found')) return 'User not found';
        if (lower.includes('block') || lower.includes('privacy')) return 'User blocked invites';
        if (lower.includes('permission')) return 'Permission Denied';
        return msg;
    }

    function isBlacklisted(userId, displayName) {
        if (!blacklist.value || blacklist.value.length === 0) return false;
        return blacklist.value.some(
            (b) => b.trim().toLowerCase() === userId.toLowerCase() ||
                b.trim().toLowerCase() === displayName?.toLowerCase()
        );
    }

    /**
     * @param {string} userId
     * @param {string} displayName
     * @param {string} groupId
     * @returns {Promise<{sent: boolean, apiCalled: boolean}>}
     */
    async function sendSingleInvite(userId, displayName, groupId) {
        if (!userId || !groupId) return { sent: false, apiCalled: false };

        // Skip self
        if (userId === userStore.currentUser.id) {
            console.log(`[GroupInvite] Skipped self (${displayName})`);
            return { sent: false, apiCalled: false };
        }

        // Check blacklist
        if (isBlacklisted(userId, displayName)) {
            addLog(userId, displayName, groupId, 'skipped', 'User is blacklisted');
            console.log(`[GroupInvite] Skipped ${displayName} (${userId}) - Blacklisted.`);
            return { sent: false, apiCalled: false };
        }

        // Check cache
        if (isAlreadyInvited(userId, groupId)) {
            addLog(userId, displayName, groupId, 'cached', 'Already invited (cached)');
            console.log(`[GroupInvite] Skipped ${displayName} (${userId}) - Already present in cache.`);
            return { sent: false, apiCalled: false };
        }

        try {
            await groupRequest.sendGroupInvite({
                groupId,
                userId
            });
            markInvited(userId, groupId);
            rateLimitStrikes.value = 0;
            addLog(userId, displayName, groupId, 'sent', 'Group Invite');
            console.log(`[GroupInvite] SUCCESS: Group Invite sent to ${displayName} (${userId})!`);
            return { sent: true, apiCalled: true };
        } catch (err) {
            const rawMsg = err?.error?.message || err?.message || 'Unknown API Error';
            const uiMsg = parseApiError(err);
            if (uiMsg === 'Rate Limited (429)') {
                rateLimitStrikes.value++;
            }
            // Cache permanent-state errors to prevent re-spam on next run
            if (PERMANENT_ERRORS.includes(uiMsg)) {
                markInvited(userId, groupId);
            }
            addLog(userId, displayName, groupId, 'error', uiMsg);
            console.error(`[GroupInvite] FAILED to invite ${displayName} (${userId}). Reason: ${uiMsg} | Raw: ${rawMsg}`, err);
            return { sent: false, apiCalled: true };
        }
    }

    /**
     * Unified friend/instance invite function.
     * Uses `notificationRequest.sendInvite` instead of `groupRequest.sendGroupInvite`.
     * @param {string} userId
     * @param {string} displayName
     * @param {string} locationTag  Instance location tag (used as cache key)
     * @param {string} worldName    Resolved world name for display
     * @returns {Promise<{sent: boolean, apiCalled: boolean}>}
     */
    async function sendSingleFriendInvite(userId, displayName, locationTag, worldName) {
        if (!userId || !locationTag) return { sent: false, apiCalled: false };

        if (userId === userStore.currentUser.id) {
            return { sent: false, apiCalled: false };
        }

        if (isBlacklisted(userId, displayName)) {
            addLog(userId, displayName, locationTag, 'skipped', 'User is blacklisted');
            console.log(`[InstanceInvite] Skipped ${displayName} (${userId}) - Blacklisted.`);
            return { sent: false, apiCalled: false };
        }

        if (isAlreadyInvited(userId, locationTag)) {
            addLog(userId, displayName, locationTag, 'cached', 'Already invited (cached)');
            console.log(`[InstanceInvite] Skipped ${displayName} (${userId}) - Cached.`);
            return { sent: false, apiCalled: false };
        }

        try {
            await notificationRequest.sendInvite(
                { instanceId: locationTag, worldId: locationTag, worldName },
                userId
            );
            markInvited(userId, locationTag);
            rateLimitStrikes.value = 0;
            addLog(userId, displayName, locationTag, 'sent', 'Instance Invite');
            console.log(`[InstanceInvite] SUCCESS: Invite sent to ${displayName} for ${worldName}`);
            return { sent: true, apiCalled: true };
        } catch (err) {
            const rawMsg = err?.error?.message || err?.message || 'Unknown API Error';
            const uiMsg = parseApiError(err);
            if (uiMsg === 'Rate Limited (429)') rateLimitStrikes.value++;
            if (PERMANENT_ERRORS.includes(uiMsg)) markInvited(userId, locationTag);
            addLog(userId, displayName, locationTag, 'error', uiMsg);
            console.error(`[InstanceInvite] FAILED ${displayName}. Reason: ${uiMsg} | Raw: ${rawMsg}`, err);
            return { sent: false, apiCalled: true };
        }
    }

    // ── Sleep utility ────────────────────────────────────────────

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ── Mass invite: all in instance ───────────────────────────

    async function massInviteAllInInstance(only18Plus = false) {
        const groupId = selectedGroupId.value;
        if (!groupId) {
            toast.error('Please select a group first.');
            return;
        }
        if (isRunning.value) {
            toast.warning('An invite operation is already running.');
            return;
        }

        const playerList = locationStore.lastLocation.playerList;
        if (!playerList || playerList.size === 0) {
            toast.warning('No players in the current instance.');
            return;
        }

        isRunning.value = true;
        isCancelled.value = false;

        const players = Array.from(playerList.values());
        let sentCount = 0;
        let skippedCount = 0;

        totalProgress.value = players.length;
        currentProgress.value = 0;
        rateLimitStrikes.value = 0;

        const groupName = selectedGroup.value?.name || groupId;
        toast.info(`Inviting ${players.length} players to ${groupName}...`);

        for (const player of players) {
            currentProgress.value++;

            if (isCancelled.value) {
                toast.info('Mass invite cancelled.');
                break;
            }

            const userId = player.userId;
            const displayName = player.displayName || userId;

            if (!userId || userId === userStore.currentUser.id) {
                skippedCount++;
                console.log(`[GroupInvite] Engine Skipped: Ignoring own user account or invalid ID (${displayName})`);
                continue;
            }

            if (only18Plus) {
                const cachedUser = userStore.cachedUsers.get(userId);
                if (cachedUser?.ageVerified !== true) {
                    skippedCount++;
                    const reason = !cachedUser
                        ? 'Profile not cached (cannot verify)'
                        : (cachedUser.ageVerified === false ? 'Explicitly not 18+' : 'Age verification missing');

                    addLog(userId, displayName, groupId, 'skipped', reason);
                    console.log(`[GroupInvite] 18+ Check Failed for ${displayName} (${userId}). Reason: ${reason}. DB Value:`, cachedUser?.ageVerified);
                    continue;
                } else {
                    console.log(`[GroupInvite] 18+ Check Passed for ${displayName} (${userId}).`);
                }
            }

            const previousStrikes = rateLimitStrikes.value;
            const result = await sendSingleInvite(userId, displayName, groupId);

            // Absolute 3-Strike Killswitch
            if (rateLimitStrikes.value >= 3) {
                toast.error('API rate limit cutoff engaged (3 fail strikes). Cancelling batch.');
                cancelOperation();
                break;
            }

            if (result.sent) {
                sentCount++;
                await sleep(delayMs.value);
            } else if (result.apiCalled) {
                // API was hit but failed — still respect delay to avoid spam
                skippedCount++;
                if (rateLimitStrikes.value > previousStrikes) {
                    toast.warning(`Rate limit strike (${rateLimitStrikes.value}/3). Waiting longer...`);
                    await sleep(delayMs.value * rateLimitStrikes.value);
                } else {
                    await sleep(delayMs.value);
                }
            } else {
                // Pure local skip (cache/blacklist) — no delay needed
                skippedCount++;
            }
        }

        isRunning.value = false;
        isCancelled.value = false;
        toast.success(
            `Done! Sent ${sentCount} invite(s), skipped ${skippedCount}.`
        );
    }

    // ── Mass invite: friends (Instance Invite) ─────────────────

    /**
     * @param {'public' | 'all'} scope
     *   'public'  = online (green) friends only
     *   'all'     = online + active (orange) friends
     */
    async function massInviteFriends(scope) {
        if (isRunning.value) {
            toast.warning('An invite operation is already running.');
            return;
        }

        // Determine current instance
        let currentLocation = locationStore.lastLocation?.location;
        if (currentLocation === 'traveling') {
            currentLocation = locationStore.lastLocationDestination;
        }

        if (!currentLocation || currentLocation === 'offline' || currentLocation === 'private') {
            toast.error('You must be in an instance to send instance invites.');
            return;
        }

        const L = parseLocation(currentLocation);
        if (!L.worldId) {
            toast.error('Failed to parse current instance location.');
            return;
        }

        isRunning.value = true;
        isCancelled.value = false;

        let worldName = L.worldId;
        try {
            const worldArgs = await queryRequest.fetch('world.location', { worldId: L.worldId });
            if (worldArgs?.ref?.name) {
                worldName = worldArgs.ref.name;
            }
        } catch (e) {
            console.warn('Could not fetch world name for invite.', e);
        }

        // Gather target friends
        let targets = [];
        const vip = friendStore.vipFriends || [];
        const online = friendStore.onlineFriends || [];
        const active = friendStore.activeFriends || [];

        // Public = VIP (online favorites) + online non-favorites
        targets = [...vip, ...online];

        if (scope === 'all') {
            targets = [...targets, ...active];
        }

        if (targets.length === 0) {
            toast.warning('No friends matching the selected scope.');
            isRunning.value = false;
            return;
        }

        toast.info(`Inviting ${targets.length} friends to instance...`);

        let sentCount = 0;
        let skippedCount = 0;
        totalProgress.value = targets.length;
        currentProgress.value = 0;
        rateLimitStrikes.value = 0;

        for (const friend of targets) {
            currentProgress.value++;

            if (isCancelled.value) {
                toast.info('Friend invite cancelled.');
                break;
            }

            const userId = friend.id;
            const displayName = friend.ref?.displayName || friend.name || userId;

            if (!userId || userId === userStore.currentUser.id) {
                skippedCount++;
                continue;
            }

            const previousStrikes = rateLimitStrikes.value;
            const result = await sendSingleFriendInvite(userId, displayName, L.tag, worldName);

            if (rateLimitStrikes.value >= 3) {
                toast.error('API rate limit cutoff engaged (3 fail strikes). Cancelling batch.');
                cancelOperation();
                break;
            }

            if (result.sent) {
                sentCount++;
                await sleep(delayMs.value);
            } else if (result.apiCalled) {
                skippedCount++;
                if (rateLimitStrikes.value > previousStrikes) {
                    toast.warning(`Rate limit strike (${rateLimitStrikes.value}/3). Waiting longer...`);
                    await sleep(delayMs.value * rateLimitStrikes.value);
                } else {
                    await sleep(delayMs.value);
                }
            } else {
                skippedCount++;
            }
        }

        isRunning.value = false;
        isCancelled.value = false;
        toast.success(
            `Done! Sent ${sentCount} friend invite(s), skipped ${skippedCount}.`
        );
    }

    // ── Auto-invite on player join ─────────────────────────────

    /**
     * Called from gameLogCoordinator when a player-joined event fires.
     * @param {string} userId
     * @param {string} displayName
     */
    async function handlePlayerJoined(userId, displayName) {
        if (!autoInviteEnabled.value || !selectedGroupId.value || !userId || userId === userStore.currentUser.id) return;

        // Don't auto-invite while rate limited
        if (rateLimitStrikes.value >= 3) {
            console.log(`[AutoInvite] Skipped ${displayName} — rate limit cooldown active.`);
            return;
        }

        if (isAlreadyInvited(userId, selectedGroupId.value)) {
            return; // Silent skip — already cached, no log spam
        }

        // In-flight dedup: prevent concurrent API calls for the same user
        const flightKey = cacheKey(userId, selectedGroupId.value);
        if (autoInviteInFlight.has(flightKey)) {
            console.log(`[AutoInvite] Skipped ${displayName} — already processing.`);
            return;
        }
        autoInviteInFlight.add(flightKey);

        try {
            console.log(`[AutoInvite] Join detected: Queueing invite for ${displayName}...`);
            await sleep(1500); // Let user fully join

            const result = await sendSingleInvite(userId, displayName, selectedGroupId.value);
            if (result.sent) {
                console.log(`[AutoInvite] SUCCESS: Invited ${displayName}`);
            } else {
                console.log(`[AutoInvite] SKIPPED/FAILED: ${displayName} (apiCalled: ${result.apiCalled})`);
            }
        } finally {
            autoInviteInFlight.delete(flightKey);
        }
    }

    // ── Cancel ─────────────────────────────────────────────────

    function cancelOperation() {
        if (isRunning.value) {
            isCancelled.value = true;
        }
    }

    // ── Public API ─────────────────────────────────────────────

    return {
        // State
        selectedGroupId,
        autoInviteEnabled,
        delayPreset,
        isRunning,
        inviteCache,
        inviteLog,
        blacklist,
        currentProgress,
        totalProgress,

        // Computed
        delayMs,
        groupsWithInvitePermission,
        selectedGroup,
        cacheSize,
        logStats,

        // Actions
        clearCache,
        massInviteAllInInstance,
        massInviteFriends,
        handlePlayerJoined,
        cancelOperation,
        isAlreadyInvited,

        // Constants
        DELAY_PRESETS
    };
});
