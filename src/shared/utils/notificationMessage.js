import { displayLocation } from './locationParser';
import { i18n } from '../../plugins/i18n';

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
    const t = i18n.global.t;

    switch (noty.type) {
        case 'OnPlayerJoined':
            return { title: name, body: t('notifications.has_joined') };
        case 'OnPlayerLeft':
            return { title: name, body: t('notifications.has_left') };
        case 'OnPlayerJoining':
            return { title: name, body: t('notifications.is_joining') };
        case 'GPS':
            return {
                title: name,
                body: t('notifications.gps', { location: displayLocation(
                    noty.location,
                    noty.worldName,
                    noty.groupName
                )})
            };
        case 'Online': {
            let locationName = '';
            if (noty.worldName) {
                return {
                    title: name,
                    body: t('notifications.online_location', { location: displayLocation(
                        noty.location,
                        noty.worldName,
                        noty.groupName
                    ) })
                };
            }
            return {
                title: name, body: t('notifications.online')
            };
        }
        case 'Offline':
            return { title: name, body: t('notifications.offline') };
        case 'Status':
            return {
                title: name,
                body: t('notifications.status_update', { status: noty.status, description: noty.statusDescription })
            };
        case 'invite':
            return {
                title: sender,
                body: t('notifications.invite', { location: displayLocation(
                    noty.details.worldId,
                    noty.details.worldName
                ), message })
            };
        case 'requestInvite':
            return {
                title: sender,
                body: t('notifications.request_invite', { message })
            };
        case 'inviteResponse':
            return {
                title: sender,
                body: t('notifications.invite_response', { message })
            };
        case 'requestInviteResponse':
            return {
                title: sender,
                body: t('notifications.request_invite_response', { message })
            };
        case 'friendRequest':
            return {
                title: sender,
                body: t('notifications.friend_request')
            };
        case 'Friend':
            return { title: name, body: t('notifications.friend') };
        case 'Unfriend':
            return {
                title: name,
                body: t('notifications.unfriend')
            };
        case 'TrustLevel':
            return {
                title: name,
                body: t('notifications.trust_level', { trustLevel: noty.trustLevel })
            };
        case 'DisplayName':
            return {
                title: displayNameOverride || noty.previousDisplayName,
                body: t('notifications.display_name', { displayName: noty.displayName })
            };
        case 'boop':
            return { title: sender, body: noty.message };
        case 'groupChange':
            return { title: sender, body: noty.message };
        case 'group.announcement':
            return { title: t('notifications.group_announcement_title'), body: noty.message };
        case 'group.informative':
            return { title: t('notifications.group_informative_title'), body: noty.message };
        case 'group.invite':
            return { title: t('notifications.group_invite_title'), body: noty.message };
        case 'group.joinRequest':
            return { title: t('notifications.group_join_request_title'), body: noty.message };
        case 'group.transfer':
            return { title: t('notifications.group_transfer_request_title'), body: noty.message };
        case 'group.queueReady':
            return { title: t('notifications.group_queue_ready_title'), body: noty.message };
        case 'instance.closed':
            return { title: t('notifications.instance_closed_title'), body: noty.message };
        case 'PortalSpawn':
            if (name) {
                return {
                    title: name,
                    body: t('notifications.portal_spawn_name', { location: displayLocation(
                        noty.instanceId,
                        noty.worldName,
                        noty.groupName
                    ) })
                };
            }
            return { title: '', body: t('notifications.portal_spawn') };
        case 'AvatarChange':
            return {
                title: name,
                body: t('notifications.avatar_change', { avatar: noty.name })
            };
        case 'ChatBoxMessage':
            return {
                title: name,
                body: t('notifications.chat_message', { message: noty.text })
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
                body: t('notifications.blocked_player_joined')
            };
        case 'BlockedOnPlayerLeft':
            return {
                title: name,
                body: t('notifications.blocked_player_left')
            };
        case 'MutedOnPlayerJoined':
            return {
                title: name,
                body: t('notifications.muted_player_joined')
            };
        case 'MutedOnPlayerLeft':
            return {
                title: name,
                body: t('notifications.muted_player_left')
            };
        case 'Blocked':
            return { title: name, body: t('notifications.blocked') };
        case 'Unblocked':
            return { title: name, body: t('notifications.unblocked') };
        case 'Muted':
            return { title: name, body: t('notifications.muted') };
        case 'Unmuted':
            return { title: name, body: t('notifications.unmuted') };
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
