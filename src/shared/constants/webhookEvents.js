/**
 * Static webhook events that VRCX can emit.
 *
 * Each entry includes semantic metadata used by:
 * - export gating (enabled/disabled per event)
 * - settings UI rendering (grouped toggles)
 * - localization lookups (label/description)
 */
export const WEBHOOK_EVENT_DEFS = [
    // App lifecycle: emitted once when VRCX bootstraps.
    { key: 'app.started', category: 'app', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.app_started.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.app_started.description' },
    // App auth: emitted when login flow returns an error.
    { key: 'app.login_failed', category: 'app', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.app_login_failed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.app_login_failed.description' },
    // App auth: emitted when login succeeds and session is ready.
    { key: 'app.login_succeeded', category: 'app', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.app_login_succeeded.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.app_login_succeeded.description' },

    // VRChat process: game process started.
    { key: 'vrchat.started', category: 'vrchat', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_started.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_started.description' },
    // VRChat process: game process exited.
    { key: 'vrchat.closed', category: 'vrchat', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_closed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_closed.description' },
    // VRChat process: crash detector identified an abnormal close.
    { key: 'vrchat.crash_detected', category: 'vrchat', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_crash_detected.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_crash_detected.description' },
    // VRChat process: auto-restart flow triggered by watchdog logic.
    { key: 'vrchat.auto_restart_triggered', category: 'vrchat', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_auto_restart_triggered.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_auto_restart_triggered.description' },
    // VRChat process: rejoin-last-instance action requested.
    { key: 'vrchat.rejoin_last_instance', category: 'vrchat', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_rejoin_last_instance.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.vrchat_rejoin_last_instance.description' },

    // Self location: user joined a new world.
    { key: 'self.world_joined', category: 'self', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.self_world_joined.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.self_world_joined.description' },
    // Self location: user switched to another instance in same/different world.
    { key: 'self.instance_changed', category: 'self', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.self_instance_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.self_instance_changed.description' },
    // Self location: user left current world.
    { key: 'self.world_left', category: 'self', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.self_world_left.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.self_world_left.description' },

    // Favorites: world was added to favorites.
    { key: 'favorite.world.added', category: 'favorite', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_world_added.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_world_added.description' },
    // Favorites: world was removed from favorites.
    { key: 'favorite.world.removed', category: 'favorite', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_world_removed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_world_removed.description' },
    // Favorites: avatar was added to favorites.
    { key: 'favorite.avatar.added', category: 'favorite', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_avatar_added.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_avatar_added.description' },
    // Favorites: avatar was removed from favorites.
    { key: 'favorite.avatar.removed', category: 'favorite', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_avatar_removed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.favorite_avatar_removed.description' },

    // Friend presence: a friend came online.
    { key: 'friend.online', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_online.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_online.description' },
    // Friend presence: a friend went offline.
    { key: 'friend.offline', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_offline.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_offline.description' },
    // Friend profile: display name changed.
    { key: 'friend.name_changed', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_name_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_name_changed.description' },
    // Friend profile: last seen timestamp changed.
    { key: 'friend.last_seen_updated', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_last_seen_updated.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_last_seen_updated.description' },
    // Friend stats: time-together value changed.
    { key: 'friend.time_together_updated', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_time_together_updated.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_time_together_updated.description' },
    // Friend location: location tag changed.
    { key: 'friend.location_changed', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_location_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_location_changed.description' },
    // Friend avatar: avatar id/name changed.
    { key: 'friend.avatar_changed', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_avatar_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_avatar_changed.description' },
    // Friend status: status/statusDescription changed.
    { key: 'friend.status_changed', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_status_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_status_changed.description' },
    // Friend memo: local note text updated.
    { key: 'friend.note_updated', category: 'friend', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.friend_note_updated.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.friend_note_updated.description' },

    // Instance metric: player count changed in tracked instance.
    { key: 'instance.player_count_changed', category: 'instance', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.instance_player_count_changed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.instance_player_count_changed.description' },

    // Notification action: friend request accepted in UI/API flow.
    { key: 'notification.friend_request.accepted', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_friend_request_accepted.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_friend_request_accepted.description' },
    // Notification action: friend request declined/hidden in UI/API flow.
    { key: 'notification.friend_request.declined', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_friend_request_declined.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_friend_request_declined.description' },
    // Notification action: invite sent as response to requestInvite.
    { key: 'notification.invite.sent', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_invite_sent.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_invite_sent.description' },
    // Notification V2: notification payload updated by websocket update action.
    { key: 'notification.v2.updated', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_updated.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_updated.description' },
    // Notification V2: notification hidden/expired from user or server action.
    { key: 'notification.v2.hidden', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_hidden.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_hidden.description' },
    // Notification V2: notification marked as seen.
    { key: 'notification.v2.seen', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_seen.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_seen.description' },
    // Notification V2: response action sent successfully.
    { key: 'notification.v2.response_sent', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_response_sent.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_response_sent.description' },
    // Notification V2: response action failed to send.
    { key: 'notification.v2.response_failed', category: 'notification', defaultEnabled: true, labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_response_failed.label', descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_v2_response_failed.description' }
];

/**
 * Dynamic webhook rules for events with runtime-generated keys.
 */
export const WEBHOOK_DYNAMIC_EVENT_RULES = [
    {
        // Notification receive feed: notification.<type>.received
        key: 'notification.received.dynamic',
        category: 'notification',
        defaultEnabled: true,
        labelKey: 'view.settings.notifications.notifications.webhook.events.items.notification_received_dynamic.label',
        descriptionKey: 'view.settings.notifications.notifications.webhook.events.items.notification_received_dynamic.description',
        pattern: /^notification\.[a-z0-9_]+\.received$/
    }
];

export function createDefaultWebhookEventEnabledMap() {
    const map = {};
    for (const eventDef of WEBHOOK_EVENT_DEFS) {
        map[eventDef.key] = Boolean(eventDef.defaultEnabled);
    }
    for (const dynamicDef of WEBHOOK_DYNAMIC_EVENT_RULES) {
        map[dynamicDef.key] = Boolean(dynamicDef.defaultEnabled);
    }
    return map;
}

export function normalizeWebhookEventEnabledMap(rawMap) {
    const defaults = createDefaultWebhookEventEnabledMap();
    if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) {
        return defaults;
    }

    const normalized = {};
    for (const key of Object.keys(defaults)) {
        const rawValue = rawMap[key];
        normalized[key] = typeof rawValue === 'boolean' ? rawValue : defaults[key];
    }
    return normalized;
}

export function isWebhookEventAllowed(event, enabledMap) {
    if (!event || typeof event !== 'string') {
        return false;
    }

    const normalizedMap = normalizeWebhookEventEnabledMap(enabledMap);
    const exact = WEBHOOK_EVENT_DEFS.find((item) => item.key === event);
    if (exact) {
        return Boolean(normalizedMap[exact.key]);
    }

    const dynamic = WEBHOOK_DYNAMIC_EVENT_RULES.find((item) => item.pattern.test(event));
    if (dynamic) {
        return Boolean(normalizedMap[dynamic.key]);
    }

    return false;
}

export function getWebhookEventDefinitions() {
    return {
        staticEvents: WEBHOOK_EVENT_DEFS,
        dynamicRules: WEBHOOK_DYNAMIC_EVENT_RULES
    };
}
