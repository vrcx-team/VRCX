import configRepository from '../config';

const STORAGE_KEY = 'NexVR_session';

/**
 * @typedef {{ accessToken: string; refreshToken: string }} NexvrTokens
 */

/** @type {NexvrTokens | null} */
let tokens = null;
let loaded = false;
/** @type {Promise<boolean> | null} */
let refreshing = null;

/**
 * Loads the persisted session once, so a restart keeps the user signed in the
 * way VRChat's cookie jar used to.
 *
 * @returns {Promise<NexvrTokens | null>}
 */
async function load() {
    if (!loaded) {
        loaded = true;
        try {
            const raw = await configRepository.getString(STORAGE_KEY, '');
            if (raw) {
                tokens = JSON.parse(raw);
            }
        } catch (err) {
            console.error('Failed to load NexVR session:', err);
        }
    }
    return tokens;
}

async function persist() {
    try {
        if (tokens) {
            await configRepository.setString(STORAGE_KEY, JSON.stringify(tokens));
        } else {
            await configRepository.remove(STORAGE_KEY);
        }
    } catch (err) {
        console.error('Failed to save NexVR session:', err);
    }
}

/**
 * @returns {Promise<string>} Access token, or '' when signed out
 */
export async function getAccessToken() {
    await load();
    return tokens?.accessToken ?? '';
}

/**
 * @param {NexvrTokens | null} next
 */
export async function setTokens(next) {
    loaded = true;
    tokens = next?.accessToken ? { accessToken: next.accessToken, refreshToken: next.refreshToken } : null;
    await persist();
}

export async function clearTokens() {
    await setTokens(null);
}

/**
 * @returns {Promise<string>} JSON blob that can be handed back to restoreTokens
 */
export async function exportTokens() {
    await load();
    return tokens ? JSON.stringify(tokens) : '';
}

/**
 * @param {string} blob
 */
export async function restoreTokens(blob) {
    try {
        await setTokens(blob ? JSON.parse(blob) : null);
    } catch {
        // a VRChat cookie jar saved by an older build; it is useless here
        await setTokens(null);
    }
}

/**
 * Exchanges the refresh token for a new pair. Concurrent callers share one
 * request, because NexVR rotates the refresh token on every use.
 *
 * @param {(refreshToken: string) => Promise<NexvrTokens | null>} exchange
 * @returns {Promise<boolean>} True when a new access token is in place
 */
export function refreshTokens(exchange) {
    if (!refreshing) {
        refreshing = (async () => {
            await load();
            const refreshToken = tokens?.refreshToken;
            if (!refreshToken) {
                return false;
            }
            const next = await exchange(refreshToken).catch(() => null);
            if (!next?.accessToken) {
                await clearTokens();
                return false;
            }
            await setTokens(next);
            return true;
        })().finally(() => {
            refreshing = null;
        });
    }
    return refreshing;
}
