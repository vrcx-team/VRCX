import { replaceBioSymbols } from './base/string';

/**
 * Remove null/undefined keys from a notification JSON object
 * and sanitize message/title fields with replaceBioSymbols.
 * @param {object} json - notification data (mutated in place)
 * @returns {object} the same json reference
 */
export function sanitizeNotificationJson(json) {
    for (const key in json) {
        if (json[key] === null || typeof json[key] === 'undefined') {
            delete json[key];
        }
    }
    if (json.message) {
        json.message = replaceBioSymbols(json.message);
    }
    if (json.title) {
        json.title = replaceBioSymbols(json.title);
    }
    return json;
}

/**
 * Parse a notification's details field from string to object if needed.
 * @param {*} details - raw details value
 * @returns {object} parsed details object
 */
export function parseNotificationDetails(details) {
    if (details === Object(details)) {
        return details;
    }
    if (details !== '{}' && typeof details === 'string') {
        try {
            const object = JSON.parse(details);
            if (object === Object(object)) {
                return object;
            }
        } catch (err) {
            console.log(err);
        }
    }
    return {};
}

/**
 * Build a default V1 notification ref from JSON data.
 * Does NOT perform cache lookup — caller is responsible for
 * checking existing refs and merging.
 * @param {object} json - sanitized notification JSON
 * @returns {object} default notification ref
 */
export function createDefaultNotificationRef(json) {
    const ref = {
        id: '',
        senderUserId: '',
        senderUsername: '',
        type: '',
        message: '',
        details: {},
        seen: false,
        created_at: '',
        // VRCX
        $isExpired: false,
        //
        ...json
    };
    ref.details = parseNotificationDetails(ref.details);
    return ref;
}

/**
 * Build a default V2 notification ref from JSON data.
 * Handles boop legacy formatting.
 * @param {object} json - sanitized notification JSON
 * @param {string} endpointDomain - API endpoint domain for emoji URLs
 * @returns {object} default notification V2 ref
 */
export function createDefaultNotificationV2Ref(json) {
    return {
        id: '',
        createdAt: '',
        updatedAt: '',
        expiresAt: '',
        type: '',
        link: '',
        linkText: '',
        message: '',
        title: '',
        imageUrl: '',
        seen: false,
        senderUserId: '',
        senderUsername: '',
        data: {},
        responses: [],
        details: {},
        version: 2,
        ...json
    };
}

/**
 * Apply legacy boop formatting to a V2 notification ref.
 * Mutates the ref in place.
 * @param {object} ref - notification V2 ref
 * @param {string} endpointDomain - API endpoint domain for emoji URLs
 */
export function applyBoopLegacyHandling(ref, endpointDomain) {
    if (ref.type !== 'boop' || !ref.title) {
        return;
    }
    ref.message = ref.title;
    ref.title = '';
    if (ref.details?.emojiId?.startsWith('default_')) {
        ref.imageUrl = ref.details.emojiId;
        ref.message += ` ${ref.details.emojiId.replace('default_', '')}`;
    } else {
        ref.imageUrl = `${endpointDomain}/file/${ref.details.emojiId}/${ref.details.emojiVersion}`;
    }
}
