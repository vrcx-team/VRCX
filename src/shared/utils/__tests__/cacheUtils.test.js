import { describe, expect, it, vi } from 'vitest';
import { evictMapCache } from '../cacheUtils';

describe('evictMapCache', () => {
    it('does nothing when cache is under maxSize', () => {
        const cache = new Map([
            ['a', 1],
            ['b', 2]
        ]);
        const result = evictMapCache(cache, 5, () => false);
        expect(result.deletedCount).toBe(0);
        expect(cache.size).toBe(2);
    });

    it('evicts entries when cache exceeds maxSize', () => {
        const cache = new Map();
        for (let i = 0; i < 10; i++) {
            cache.set(`key_${i}`, i);
        }
        const result = evictMapCache(cache, 5, () => false);
        expect(result.deletedCount).toBe(5);
        expect(cache.size).toBe(5);
    });

    it('retains entries matching isRetainedFn', () => {
        const cache = new Map([
            ['keep_1', 'retained'],
            ['keep_2', 'retained'],
            ['evict_1', 'evictable'],
            ['evict_2', 'evictable'],
            ['evict_3', 'evictable']
        ]);
        const result = evictMapCache(cache, 2, (_value, key) =>
            key.startsWith('keep_')
        );
        // Should have evicted evictable entries but retained keep entries
        expect(cache.has('keep_1')).toBe(true);
        expect(cache.has('keep_2')).toBe(true);
        expect(result.deletedCount).toBe(3);
    });

    it('uses custom sortFn for eviction order', () => {
        const cache = new Map([
            ['old', { age: 1 }],
            ['new', { age: 100 }],
            ['medium', { age: 50 }]
        ]);
        const result = evictMapCache(cache, 1, () => false, {
            sortFn: (a, b) => a.value.age - b.value.age
        });
        // Should evict oldest first
        expect(result.deletedCount).toBe(2);
        expect(cache.has('new')).toBe(true);
        expect(cache.has('old')).toBe(false);
        expect(cache.has('medium')).toBe(false);
    });

    it('logs when logLabel is provided', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const cache = new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3]
        ]);
        evictMapCache(cache, 1, () => false, { logLabel: 'Test cleanup' });
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('Test cleanup')
        );
        spy.mockRestore();
    });

    it('does not evict retained entries even when all need eviction', () => {
        const cache = new Map([
            ['a', 1],
            ['b', 2],
            ['c', 3]
        ]);
        const result = evictMapCache(cache, 1, () => true);
        // All entries are retained
        expect(result.deletedCount).toBe(0);
        expect(cache.size).toBe(3);
    });

    it('handles exact maxSize (no eviction needed)', () => {
        const cache = new Map([
            ['a', 1],
            ['b', 2]
        ]);
        const result = evictMapCache(cache, 2, () => false);
        expect(result.deletedCount).toBe(0);
        expect(cache.size).toBe(2);
    });
});
