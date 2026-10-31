// The last raw NexVR response for each API path, for the dialogs' JSON tabs.
// Everything else in the app sees Nexy's VRChat-shaped copies; these are what
// the server actually sent, except that the account email is masked.

import { toJson } from '@bufbuild/protobuf';

import { FriendPresenceSchema } from './realtimeSchema';
import { maskEmail } from './mappers';
import { realtime } from './realtime';

const MAX_ENTRIES = 300;
// responses that carry session tokens are never kept
const NEVER_KEPT = /^\/auth\/(login|refresh|2fa|passkey|reauth)/;

/** @type {Map<string, any>} insertion order doubles as least-recently-stored order */
const responses = new Map();

/**
 * @param {string} path NexVR gateway path, e.g. '/users/123'
 * @param {any} data Parsed response body
 */
export function keepRawResponse(path, data) {
    if (NEVER_KEPT.test(path)) {
        return;
    }
    if (path === '/auth/me' && data?.primaryEmail) {
        // the JSON tab can be on screen or in a screenshot; never show the address in full
        data = { ...data, primaryEmail: maskEmail(data.primaryEmail) };
    }
    responses.delete(path);
    responses.set(path, data);
    if (responses.size > MAX_ENTRIES) {
        responses.delete(responses.keys().next().value);
    }
}

/**
 * @param {string} path NexVR gateway path
 * @returns {any} The last response for that path, or undefined if none this session
 */
export function getRawResponse(path) {
    return responses.get(path);
}

/**
 * A friend's presence as received over the realtime socket, in protobuf's
 * standard JSON form (enum names rather than numbers).
 *
 * @param {string} userId
 * @returns {any} Undefined when the user isn't a friend
 */
export function getRawPresence(userId) {
    const presence = realtime.friends.get(userId);
    return presence ? toJson(FriendPresenceSchema, presence) : undefined;
}

/**
 * The given sections, without the ones that have nothing to show.
 *
 * @param {Record<string, any>} sections
 * @returns {Record<string, any>}
 */
export function presentSections(sections) {
    return Object.fromEntries(Object.entries(sections).filter(([, value]) => value !== undefined));
}
