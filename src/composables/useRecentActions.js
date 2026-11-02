import { useLocalStorage } from '@vueuse/core';
import * as workerTimers from 'worker-timers';

import { useGeneralSettingsStore } from '../stores/settings/general';

/**
 * Persisted Map tracking recent invite/request actions.
 * Key: `${userId}:${actionType}`, Value: timestamp (ms).
 * Stored in localStorage via @vueuse/core.
 */
const recentActions = useLocalStorage('VRCX_recentActions', {});

const TRACKED_ACTIONS = new Set([
    'Send Friend Request',
    'Invite',
    'Invite Photo',
    'Invite Message',
    'Request Invite',
    'Request Invite Photo',
    'Request Invite Message'
]);

const RECENT_ACTIONS_PURGE_MS = 30000;
let recentActionsPurgeTimer = null;

function purgeExpiredRecentActions() {
    const cooldownMs = useGeneralSettingsStore().recentActionCooldownMinutes * 60 * 1000;
    const now = Date.now();
    for (const key of Object.keys(recentActions.value)) {
        if (!recentActions.value[key] || now - recentActions.value[key] >= cooldownMs) {
            delete recentActions.value[key];
        }
    }
}

function ensureRecentActionsPurge() {
    if (recentActionsPurgeTimer !== null) {
        return;
    }
    recentActionsPurgeTimer = workerTimers.setInterval(purgeExpiredRecentActions, RECENT_ACTIONS_PURGE_MS);
}

/**
 * @param {string} userId
 * @param {string} actionType
 */
export function recordRecentAction(userId, actionType) {
    if (!TRACKED_ACTIONS.has(actionType)) {
        return;
    }
    ensureRecentActionsPurge();
    recentActions.value[`${userId}:${actionType}`] = Date.now();
}

/**
 * @param {string} userId
 * @param {string} actionType
 * @returns {boolean}
 */
export function isActionRecent(userId, actionType) {
    const generalSettings = useGeneralSettingsStore();
    if (!generalSettings.recentActionCooldownEnabled) {
        return false;
    }
    ensureRecentActionsPurge();
    const key = `${userId}:${actionType}`;
    const ts = recentActions.value[key];
    if (!ts) {
        return false;
    }
    const cooldownMs = generalSettings.recentActionCooldownMinutes * 60 * 1000;
    if (Date.now() - ts < cooldownMs) {
        return true;
    }
    // Expired, clean up
    delete recentActions.value[key];
    return false;
}

export function clearRecentActions() {
    recentActions.value = {};
}
