// Official NexVR social-rank colours. S+ uses this flat colour for names and
// other text, but the rank badge face uses the fixed ion gradient instead.
export const NEXVR_RANK_COLORS = Object.freeze({
    light: Object.freeze({
        rankE: '#6b7280',
        rankD: '#1f9d55',
        rankC: '#2563eb',
        rankB: '#7c5cd6',
        rankA: '#e0701c',
        rankS: '#b8860b',
        rankSPlus: '#0a1024'
    }),
    dark: Object.freeze({
        rankE: '#8d94a3',
        rankD: '#6fdc8c',
        rankC: '#4f9cff',
        rankB: '#b48cff',
        rankA: '#ff9a52',
        rankS: '#ffd25a',
        rankSPlus: '#ffffff'
    })
});

export const NEXVR_RANK_COLOR_KEYS = Object.freeze(Object.keys(NEXVR_RANK_COLORS.dark));

export function getNexvrRankColors(isDark, overrides = {}) {
    return { ...NEXVR_RANK_COLORS[isDark ? 'dark' : 'light'], ...overrides };
}

/** Only accept known rank keys and six-digit hex colours from saved settings. */
export function sanitizeNexvrRankColorOverrides(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
        Object.entries(value).filter(
            ([key, color]) =>
                NEXVR_RANK_COLOR_KEYS.includes(key) && typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
        )
    );
}
