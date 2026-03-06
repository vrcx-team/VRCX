/**
 * Evict entries from a Map cache when it exceeds maxSize.
 * Entries matching isRetainedFn are kept; the rest are evicted oldest-first
 * (or by the provided sortFn).
 * @param {Map} cache - The cache Map to evict from
 * @param {number} maxSize - Maximum allowed size
 * @param {(value: any, key: string) => boolean} isRetainedFn - Return true to keep the entry
 * @param {object} [opts] - Options
 * @param {(a: {key: string, value: any}, b: {key: string, value: any}) => number} [opts.sortFn] -
 *   Custom sort for eviction order (entries sorted ascending; first entries evicted first).
 *   If not provided, entries are evicted in insertion order.
 * @param {string} [opts.logLabel] - Label for console.log output
 * @returns {{ deletedCount: number }}
 */
export function evictMapCache(cache, maxSize, isRetainedFn, opts = {}) {
    if (cache.size <= maxSize) {
        return { deletedCount: 0 };
    }

    const { sortFn, logLabel } = opts;
    const overBy = cache.size - maxSize;

    if (sortFn) {
        // Collect removable entries, sort, then evict
        const removable = [];
        for (const [key, value] of cache) {
            if (isRetainedFn(value, key)) {
                continue;
            }
            removable.push({ key, value });
        }
        removable.sort(sortFn);
        const toDelete = Math.min(overBy, removable.length);
        for (let i = 0; i < toDelete; i++) {
            cache.delete(removable[i].key);
        }
        if (logLabel) {
            console.log(
                `${logLabel}: Deleted ${toDelete}. Current cache size: ${cache.size}`
            );
        }
        return { deletedCount: toDelete };
    }

    // Default: evict in insertion order (skip retained entries)
    let deletedCount = 0;
    const keysToDelete = [];
    for (const [key, value] of cache) {
        if (isRetainedFn(value, key)) {
            continue;
        }
        if (deletedCount >= overBy) {
            break;
        }
        keysToDelete.push(key);
        deletedCount++;
    }
    for (const key of keysToDelete) {
        cache.delete(key);
    }
    if (logLabel) {
        console.log(
            `${logLabel}: Deleted ${deletedCount}. Current cache size: ${cache.size}`
        );
    }
    return { deletedCount };
}
