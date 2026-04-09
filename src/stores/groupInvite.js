import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

import { hasGroupPermission } from '../shared/utils';
import { groupRequest } from '../api';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useLocationStore } from './location';
import { useUserStore } from './user';
import { watchState } from '../services/watchState';

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

    async function loadSettings() {
        selectedGroupId.value = await configRepository.getString(
            'groupInviteToolkit_selectedGroup',
            ''
        );
        delayPreset.value = await configRepository.getString(
            'groupInviteToolkit_delayPreset',
            'normal'
        );
    }

    async function saveSettings() {
        await configRepository.setString(
            'groupInviteToolkit_selectedGroup',
            selectedGroupId.value
        );
        await configRepository.setString(
            'groupInviteToolkit_delayPreset',
            delayPreset.value
        );
    }

    loadSettings();

    watch(selectedGroupId, saveSettings);
    watch(delayPreset, saveSettings);

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
     * @param {string} userId
     * @param {string} displayName
     * @param {string} groupId
     * @returns {Promise<boolean>} true if invite was sent
     */
    async function sendSingleInvite(userId, displayName, groupId) {
        if (!userId || !groupId) return false;

        // Skip self
        if (userId === userStore.currentUser.id) return false;

        // Check cache
        if (isAlreadyInvited(userId, groupId)) {
            addLog(userId, displayName, groupId, 'cached', 'Already invited (cached)');
            return false;
        }

        try {
            await groupRequest.sendGroupInvite({
                groupId,
                userId
            });
            markInvited(userId, groupId);
            addLog(userId, displayName, groupId, 'sent');
            return true;
        } catch (err) {
            const msg = err?.error?.message || err?.message || 'Unknown error';
            addLog(userId, displayName, groupId, 'error', msg);
            console.error(`[GroupInvite] Failed to invite ${displayName}:`, msg);
            return false;
        }
    }

    // ── Sleep utility ──────────────────────────────────────────

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // ── Mass invite: all in instance ───────────────────────────

    async function massInviteAllInInstance() {
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

        const groupName = selectedGroup.value?.name || groupId;
        toast.info(`Inviting ${players.length} players to ${groupName}...`);

        for (const player of players) {
            if (isCancelled.value) {
                toast.info('Mass invite cancelled.');
                break;
            }

            const userId = player.userId;
            if (!userId || userId === userStore.currentUser.id) {
                skippedCount++;
                continue;
            }

            const sent = await sendSingleInvite(userId, player.displayName, groupId);
            if (sent) {
                sentCount++;
                await sleep(delayMs.value);
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

    // ── Mass invite: friends ───────────────────────────────────

    /**
     * @param {'public' | 'all'} scope
     *   'public'  = online (green) friends only
     *   'all'     = online + active (orange) friends
     */
    async function massInviteFriends(scope) {
        const groupId = selectedGroupId.value;
        if (!groupId) {
            toast.error('Please select a group first.');
            return;
        }
        if (isRunning.value) {
            toast.warning('An invite operation is already running.');
            return;
        }

        isRunning.value = true;
        isCancelled.value = false;

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

        const groupName = selectedGroup.value?.name || groupId;
        toast.info(`Inviting ${targets.length} friends to ${groupName}...`);

        let sentCount = 0;
        let skippedCount = 0;

        for (const friend of targets) {
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

            const sent = await sendSingleInvite(userId, displayName, groupId);
            if (sent) {
                sentCount++;
                await sleep(delayMs.value);
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
        if (!autoInviteEnabled.value) return;
        if (!selectedGroupId.value) return;
        if (!userId) return;
        if (userId === userStore.currentUser.id) return;
        if (isAlreadyInvited(userId, selectedGroupId.value)) {
            addLog(userId, displayName, selectedGroupId.value, 'cached', 'Auto-invite skipped (cached)');
            return;
        }

        // Small delay to let the user fully join
        await sleep(1500);

        const sent = await sendSingleInvite(
            userId,
            displayName,
            selectedGroupId.value
        );
        if (sent) {
            const groupName = selectedGroup.value?.name || selectedGroupId.value;
            console.log(`[AutoInvite] Invited ${displayName} to ${groupName}`);
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
