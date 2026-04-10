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
    fast: 2000,
    normal: 4000,
    slow: 10000
};

export const useGroupInviteStore = defineStore('GroupInvite', () => {
    const friendStore = useFriendStore();
    const groupStore = useGroupStore();
    const locationStore = useLocationStore();
    const userStore = useUserStore();

    // ── State ──────────────────────────────────────────────────
    const selectedGroupId = ref('');
    const autoInviteEnabled = ref(false);
    const delayPreset = ref('normal'); // 'fast' | 'normal' | 'slow'
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
     * Session-only invite cache.
     * Keys are `${userId}::${groupId}` strings.
     * @type {Set<string>}
     */
    const inviteCache = reactive(new Set());

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

    // ── Reset on logout ────────────────────────────────────────

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (!isLoggedIn) {
                autoInviteEnabled.value = false;
                isRunning.value = false;
                isCancelled.value = false;
                inviteCache.clear();
                inviteLog.value = [];
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
    }

    function clearCache() {
        inviteCache.clear();
        toast.success('Invite cache cleared — everyone can be re-invited.');
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
    }

    // ── Core invite function ───────────────────────────────────

    /**
     * Parses common VRChat API errors into clean UI strings
     */
    function parseApiError(err) {
        const msg = err?.error?.message || err?.message || 'Unknown API Error';
        const lower = msg.toLowerCase();
        if (lower.includes('rate limit') || err?.status === 429) return 'Rate Limited (429)';
        if (lower.includes('already a member')) return 'Already a group member';
        if (lower.includes('too many') || lower.includes('limit reached')) return 'User has too many invites/groups';
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
     * @returns {Promise<boolean>} true if invite was sent
     */
    async function sendSingleInvite(userId, displayName, groupId) {
        if (!userId || !groupId) return false;

        // Skip self
        if (userId === userStore.currentUser.id) {
            console.log(`[GroupInvite] Skipped self (${displayName})`);
            return false;
        }

        // Check blacklist
        if (isBlacklisted(userId, displayName)) {
            addLog(userId, displayName, groupId, 'skipped', 'User is blacklisted');
            console.log(`[GroupInvite] Skipped ${displayName} (${userId}) - Blacklisted.`);
            return false;
        }

        // Check cache
        if (isAlreadyInvited(userId, groupId)) {
            addLog(userId, displayName, groupId, 'cached', 'Already invited (cached)');
            console.log(`[GroupInvite] Skipped ${displayName} (${userId}) - Already present in session cache.`);
            return false;
        }

        try {
            await groupRequest.sendGroupInvite({
                groupId,
                userId
            });
            markInvited(userId, groupId);
            rateLimitStrikes.value = 0; // Reset consecutive strikes on success
            addLog(userId, displayName, groupId, 'sent', 'Group Invite');
            console.log(`[GroupInvite] SUCCESS: Group Invite sent to ${displayName} (${userId})!`);
            return true;
        } catch (err) {
            const rawMsg = err?.error?.message || err?.message || 'Unknown API Error';
            const uiMsg = parseApiError(err);
            if (uiMsg === 'Rate Limited (429)') {
                rateLimitStrikes.value++;
            }
            addLog(userId, displayName, groupId, 'error', uiMsg);
            console.error(`[GroupInvite] FAILED to invite ${displayName} (${userId}). Reason: ${uiMsg} | Raw: ${rawMsg}`, err);
            return false;
        }
    }

    // ── Sleep utility ──────────────────────────────────────────

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
            const sent = await sendSingleInvite(userId, displayName, groupId);

            // Absolute 3-Strike Killswitch
            if (rateLimitStrikes.value >= 3) {
                toast.error('API rate limit cutoff engaged (3 fail strikes). Cancelling batch.');
                cancelOperation();
                break;
            }

            if (sent) {
                sentCount++;
                await sleep(delayMs.value);
            } else if (rateLimitStrikes.value > previousStrikes) {
                // Hit a rate limit on this exact iteration — perform exponential backoff
                toast.warning(`Rate limit strike (${rateLimitStrikes.value}/3). Waiting longer...`);
                await sleep(delayMs.value * rateLimitStrikes.value);
                skippedCount++;
            } else {
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
                console.log(`[InstanceInvite] Engine Skipped: Ignoring own user account or invalid ID (${displayName})`);
                continue;
            }

            // Check blacklist
            if (isBlacklisted(userId, displayName)) {
                skippedCount++;
                addLog(userId, displayName, L.tag, 'skipped', 'User is blacklisted');
                console.log(`[InstanceInvite] Skipped ${displayName} (${userId}) - Blacklisted.`);
                continue;
            }

            // Check Cache
            if (isAlreadyInvited(userId, L.tag)) {
                skippedCount++;
                addLog(userId, displayName, L.tag, 'cached', 'Already invited (cached)');
                console.log(`[InstanceInvite] Skipped ${displayName} (${userId}) - Already present in session cache.`);
                continue;
            }

            try {
                // Use notification request (instance invite)
                await notificationRequest.sendInvite(
                    {
                        instanceId: L.tag,
                        worldId: L.tag,
                        worldName: worldName
                    },
                    userId
                );
                markInvited(userId, L.tag);
                rateLimitStrikes.value = 0; // Reset consecutive strikes
                sentCount++;
                addLog(userId, displayName, L.tag, 'sent', 'Instance Invite');
                console.log(`[InstanceInvite] SUCCESS: Instant Invite sent to ${displayName} (${userId}) for World: ${worldName}`);
                await sleep(delayMs.value);
            } catch (err) {
                const rawMsg = err?.error?.message || err?.message || 'Unknown API Error';
                const uiMsg = parseApiError(err);
                
                if (uiMsg === 'Rate Limited (429)') {
                    rateLimitStrikes.value++;
                }

                console.error(`[InstanceInvite] FAILED to invite ${displayName} (${userId}). Reason: ${uiMsg} | Raw: ${rawMsg}`, err);
                addLog(userId, displayName, L.tag, 'error', uiMsg);
                skippedCount++;

                if (rateLimitStrikes.value >= 3) {
                    toast.error('API rate limit cutoff engaged (3 fail strikes). Cancelling batch.');
                    cancelOperation();
                    break;
                }

                if (uiMsg === 'Rate Limited (429)') {
                    toast.warning(`Rate limit strike (${rateLimitStrikes.value}/3). Waiting longer...`);
                    await sleep(delayMs.value * rateLimitStrikes.value);
                }
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
        
        if (isAlreadyInvited(userId, selectedGroupId.value)) {
            addLog(userId, displayName, selectedGroupId.value, 'cached', 'Auto-invite skipped (cached)');
            console.log(`[AutoInvite] Skipped ${displayName} (${userId}) - Already present in session cache.`);
            return;
        }

        console.log(`[AutoInvite] Join Event Detected! Queueing group invite for ${displayName} (${userId})...`);
        
        // Small delay to let the user fully join
        await sleep(1500);

        const groupName = selectedGroup.value?.name || selectedGroupId.value;
        const sent = await sendSingleInvite(
            userId,
            displayName,
            selectedGroupId.value
        );
        if (sent) {
            console.log(`[AutoInvite] AUTO-DISPATCH SUCCESS: Invited ${displayName} to ${groupName}`);
        } else {
            console.log(`[AutoInvite] AUTO-DISPATCH FAILED OR CANCELLED for ${displayName}`);
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
