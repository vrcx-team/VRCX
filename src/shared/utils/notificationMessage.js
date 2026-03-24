import { displayLocation } from './locationParser';

/**
 * Extracts the notification title and body from a notification object.
 * This is the single source of truth for notification message content,
 * used by desktop toast, XS overlay, OVRT overlay, and TTS.
 * @param {object} noty - The notification object
 * @param {string} message - Pre-built invite/request message string
 * @param {string} [displayNameOverride] - Optional override for the display
 *   name used in the title (e.g. a nickname from user memo for TTS).
 * @returns {{ title: string, body: string } | null}
 */
export function getNotificationMessage(noty, message, displayNameOverride) {
    const name = displayNameOverride || noty.displayName;
    const sender = displayNameOverride || noty.senderUsername;

    switch (noty.type) {
        case 'OnPlayerJoined':
            return { title: name, body: 'has joined' };
        case 'OnPlayerLeft':
            return { title: name, body: 'has left' };
        case 'OnPlayerJoining':
            return { title: name, body: 'is joining' };
        case 'GPS':
            return {
                title: name,
                body: `is in ${displayLocation(
                    noty.location,
                    noty.worldName,
                    noty.groupName
                )}`
            };
        case 'Online': {
            let locationName = '';
            if (noty.worldName) {
                locationName = ` to ${displayLocation(
                    noty.location,
                    noty.worldName,
                    noty.groupName
                )}`;
            }
            return {
                title: name,
                body: `has logged in${locationName}`
            };
        }
        case 'Offline':
            return { title: name, body: 'has logged out' };
        case 'Status':
            return {
                title: name,
                body: `status is now ${noty.status} ${noty.statusDescription}`
            };
        case 'invite':
            return {
                title: sender,
                body: `has invited you to ${displayLocation(
                    noty.details.worldId,
                    noty.details.worldName
                )}${message}`
            };
        case 'requestInvite':
            return {
                title: sender,
                body: `has requested an invite${message}`
            };
        case 'inviteResponse':
            return {
                title: sender,
                body: `has responded to your invite${message}`
            };
        case 'requestInviteResponse':
            return {
                title: sender,
                body: `has responded to your invite request${message}`
            };
        case 'friendRequest':
            return {
                title: sender,
                body: 'has sent you a friend request'
            };
        case 'Friend':
            return { title: name, body: 'is now your friend' };
        case 'Unfriend':
            return {
                title: name,
                body: 'is no longer your friend'
            };
        case 'TrustLevel':
            return {
                title: name,
                body: `trust level is now ${noty.trustLevel}`
            };
        case 'DisplayName':
            return {
                title: displayNameOverride || noty.previousDisplayName,
                body: `changed their name to ${noty.displayName}`
            };
        case 'boop':
            return { title: sender, body: noty.message };
        case 'groupChange':
            return { title: sender, body: noty.message };
        case 'group.announcement':
            return { title: 'Group Announcement', body: noty.message };
        case 'group.informative':
            return { title: 'Group Informative', body: noty.message };
        case 'group.invite':
            return { title: 'Group Invite', body: noty.message };
        case 'group.joinRequest':
            return { title: 'Group Join Request', body: noty.message };
        case 'group.transfer':
            return { title: 'Group Transfer Request', body: noty.message };
        case 'group.queueReady':
            return { title: 'Instance Queue Ready', body: noty.message };
        case 'instance.closed':
            return { title: 'Instance Closed', body: noty.message };
        case 'PortalSpawn':
            if (name) {
                return {
                    title: name,
                    body: `has spawned a portal to ${displayLocation(
                        noty.instanceId,
                        noty.worldName,
                        noty.groupName
                    )}`
                };
            }
            return { title: '', body: 'User has spawned a portal' };
        case 'AvatarChange':
            return {
                title: name,
                body: `changed into avatar ${noty.name}`
            };
        case 'ChatBoxMessage':
            return {
                title: name,
                body: `said ${noty.text}`
            };
        case 'Event':
            return { title: 'Event', body: noty.data };
        case 'External':
            return { title: 'External', body: noty.message };
        case 'VideoPlay':
            return { title: 'Now playing', body: noty.notyName };
        case 'BlockedOnPlayerJoined':
            return {
                title: name,
                body: 'Blocked user has joined'
            };
        case 'BlockedOnPlayerLeft':
            return {
                title: name,
                body: 'Blocked user has left'
            };
        case 'MutedOnPlayerJoined':
            return {
                title: name,
                body: 'Muted user has joined'
            };
        case 'MutedOnPlayerLeft':
            return {
                title: name,
                body: 'Muted user has left'
            };
        case 'Blocked':
            return { title: name, body: 'has blocked you' };
        case 'Unblocked':
            return { title: name, body: 'has unblocked you' };
        case 'Muted':
            return { title: name, body: 'has muted you' };
        case 'Unmuted':
            return { title: name, body: 'has unmuted you' };
        default:
            return null;
    }
}

/**
 * Types where the full message is just the body (no title prefix).
 * Used by XS/OVRT notifications.
 */
const BODY_ONLY_TYPES = new Set([
    'boop',
    'group.announcement',
    'group.informative',
    'group.invite',
    'group.joinRequest',
    'group.transfer',
    'group.queueReady',
    'instance.closed',
    'Event',
    'External'
]);

/**
 * Types where title and body are joined with ": " instead of " ".
 */
const COLON_SEPARATOR_TYPES = new Set(['groupChange', 'VideoPlay']);

/**
 * Types where the full message has a custom word order
 * different from "{title} {body}".
 */
const CUSTOM_FORMAT_MESSAGES = {
    BlockedOnPlayerJoined: (title) => `Blocked user ${title} has joined`,
    BlockedOnPlayerLeft: (title) => `Blocked user ${title} has left`,
    MutedOnPlayerJoined: (title) => `Muted user ${title} has joined`,
    MutedOnPlayerLeft: (title) => `Muted user ${title} has left`
};

/**
 * Combines title and body into a single notification text string.
 * Handles per-type formatting differences for XS/OVRT overlays.
 * @param {string} title
 * @param {string} body
 * @param {string} type - The notification type
 * @returns {string}
 */
export function toNotificationText(title, body, type) {
    if (BODY_ONLY_TYPES.has(type)) {
        return body;
    }
    if (COLON_SEPARATOR_TYPES.has(type)) {
        return title ? `${title}: ${body}` : body;
    }
    const customFmt = CUSTOM_FORMAT_MESSAGES[type];
    if (customFmt) {
        return customFmt(title);
    }
    return title ? `${title} ${body}` : body;
}

/**
 * Extract a userId from a notification object by checking common fields.
 * Does NOT perform display-name-based lookups - the caller should handle
 * that fallback when a cached user map is available.
 * @param {object} noty
 * @returns {string}
 */
export function getUserIdFromNoty(noty) {
    if (noty.userId) return noty.userId;
    if (noty.senderUserId) return noty.senderUserId;
    if (noty.sourceUserId) return noty.sourceUserId;
    return '';
}
