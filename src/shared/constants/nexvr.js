// VRChat features with no NexVR counterpart yet. They are hidden rather than
// deleted so each can come back once it is ported to the NexVR API.

/**
 * Navigation entries. Saved nav layouts drop these too, because the layout
 * sanitizer skips keys that have no definition.
 */
export const NEXVR_HIDDEN_NAV_KEYS = new Set([
    // VRChat's mutual-friends API
    'charts-mutual',
    // favorites, avatars and VRChat IDs/URLs are not mapped to NexVR yet
    'favorite-friends',
    'favorite-worlds',
    'favorite-avatars',
    'my-avatars',
    'direct-access'
]);

/** Tools page entries (and their nav shortcuts) */
export const NEXVR_HIDDEN_TOOL_KEYS = new Set([
    // VRChat files, folders and game settings
    'screenshot-metadata',
    'gallery',
    'vrc-photos',
    'steam-screenshots',
    'vrchat-data',
    'crash-dumps',
    'vrchat-config',
    'launch-options',
    'registry-backup',
    // driven by the VRChat game log
    'auto-change-status',
    // VRChat API features
    'group-calendar',
    'blocked-groups',
    'group-invites',
    'export-notes',
    'export-own-avatars',
    'edit-invite-message',
    'moderation-reports',
    'purchase-history',
    'info-push'
]);

/** Routes behind the hidden entries; visiting one goes to the feed instead */
export const NEXVR_HIDDEN_ROUTE_NAMES = new Set([
    'charts-mutual',
    'favorite-friends',
    'favorite-worlds',
    'favorite-avatars',
    'my-avatars',
    'gallery',
    'screenshot-metadata'
]);
