import dayjs from 'dayjs';

/**
 * Default visibility flags for StatusBar indicators.
 */
export const defaultVisibility = {
    vrchat: true,
    steamvr: true,
    proxy: true,
    ws: true,
    uptime: true,
    clocks: true,
    zoom: true,
    servers: true
};

/**
 * Clamp and round a numeric value to a valid UTC offset range [-12, 14].
 * Returns 0 for non-finite values.
 * @param {*} value - raw offset value
 * @returns {number} normalised integer offset
 */
export function normalizeUtcHour(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(-12, Math.min(14, Math.round(n)));
}

/**
 * Format a numeric UTC offset as a human-readable string, e.g. "UTC+9", "UTC-5".
 * @param {number} offset
 * @returns {string}
 */
export function formatUtcHour(offset) {
    const n = normalizeUtcHour(offset);
    return `UTC${n >= 0 ? '+' : ''}${n}`;
}

/**
 * Parse a clock offset value into a normalised integer.
 *
 * Accepted inputs:
 *  - number (clamped/rounded)
 *  - numeric string like `"5"` or `"-3"`
 *  - UTC pattern like `"UTC+9"`, `"UTC-5:30"`
 *  - legacy IANA timezone name (resolved via dayjs)
 * @param {*} value
 * @returns {number}
 */
export function parseClockOffset(value) {
    if (typeof value === 'number') {
        return normalizeUtcHour(value);
    }
    if (typeof value !== 'string') {
        return 0;
    }
    if (/^[+-]?\d+$/.test(value.trim())) {
        return normalizeUtcHour(Number(value));
    }
    const utcMatch = value.match(/^UTC([+-])(\d{1,2})(?::(\d{1,2}))?$/i);
    if (utcMatch) {
        const sign = utcMatch[1] === '+' ? 1 : -1;
        const hours = Number(utcMatch[2]);
        const minutes = Number(utcMatch[3] || 0);
        return normalizeUtcHour(sign * (hours + minutes / 60));
    }
    // Backward compatibility: old clocks stored IANA timezone names.
    try {
        return normalizeUtcHour(dayjs().tz(value).utcOffset() / 60);
    } catch {
        return 0;
    }
}

/**
 * Normalise a single clock config entry.
 * Handles current `{ offset }` format and legacy `{ timezone }` format.
 * @param {*} entry
 * @returns {{ offset: number }}
 */
export function normalizeClock(entry) {
    if (entry && typeof entry === 'object') {
        if ('offset' in entry) {
            return { offset: parseClockOffset(entry.offset) };
        }
        if ('timezone' in entry) {
            return { offset: parseClockOffset(entry.timezone) };
        }
    }
    return { offset: 0 };
}

/**
 * Load visibility settings from a Storage-like object, merging with defaults.
 * @param {Storage} storage - object with `getItem(key)` method
 * @returns {object}
 */
export function loadVisibility(storage) {
    try {
        const saved = storage.getItem('VRCX_statusBarVisibility');
        if (saved) {
            return { ...defaultVisibility, ...JSON.parse(saved) };
        }
    } catch {
        // ignore
    }
    return { ...defaultVisibility };
}

/**
 * Load saved clocks array from a Storage-like object.
 * Returns the default clocks when stored data is absent or invalid.
 * @param {Storage} storage
 * @param {Array} defaults - fallback clock definitions
 * @returns {Array<{ offset: number }>}
 */
export function loadClocks(storage, defaults) {
    try {
        const saved = storage.getItem('VRCX_statusBarClocks');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 3) {
                return parsed.map(normalizeClock);
            }
        }
    } catch {
        // ignore
    }
    return defaults.map((c) => ({ ...c }));
}

/**
 * Load the clock count (0-3) from a Storage-like object.
 * Returns 2 when stored data is absent or invalid.
 * @param {Storage} storage
 * @returns {number}
 */
export function loadClockCount(storage) {
    try {
        const saved = storage.getItem('VRCX_statusBarClockCount');
        if (saved !== null) {
            const n = Number(saved);
            if (n >= 0 && n <= 3) return n;
        }
    } catch {
        // ignore
    }
    return 2;
}

/**
 * Format an elapsed-seconds value into an `HH:MM:SS` string.
 * @param {number} elapsedSeconds
 * @returns {string}
 */
export function formatAppUptime(elapsedSeconds) {
    const safe = Math.max(0, Math.floor(elapsedSeconds));
    const hours = Math.floor(safe / 3600)
        .toString()
        .padStart(2, '0');
    const minutes = Math.floor((safe % 3600) / 60)
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor(safe % 60)
        .toString()
        .padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
