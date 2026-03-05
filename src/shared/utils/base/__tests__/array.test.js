import {
    removeFromArray,
    arraysMatch,
    moveArrayItem,
    replaceReactiveObject
} from '../array';

describe('Array Utils', () => {
    describe('removeFromArray', () => {
        test('removes items', () => {
            const arr = [1, 2, 3];
            expect(removeFromArray(arr, 2)).toBe(true);
            expect(arr).toEqual([1, 3]);
        });

        test('removes objects', () => {
            const obj = { id: 1 };
            const arr = [obj, { id: 2 }];
            expect(removeFromArray(arr, obj)).toBe(true);
            expect(arr).toHaveLength(1);
        });

        test('handles missing items', () => {
            const arr = [1, 2, 3];
            expect(removeFromArray(arr, 4)).toBe(false);
        });

        test('removes first occurrence only', () => {
            const arr = [1, 2, 2, 3];
            removeFromArray(arr, 2);
            expect(arr).toEqual([1, 2, 3]);
        });

        test('handles null items', () => {
            const arr = [1, null, 2];
            // @ts-ignore
            expect(removeFromArray(arr, null)).toBe(true);
            expect(arr).toEqual([1, 2]);
        });
    });

    describe('arraysMatch', () => {
        test('returns true for identical arrays', () => {
            expect(arraysMatch([1, 2, 3], [1, 2, 3])).toBe(true);
        });

        test('returns false for different lengths', () => {
            expect(arraysMatch([1, 2], [1, 2, 3])).toBe(false);
        });

        test('returns false for different content', () => {
            expect(arraysMatch([1, 2], [1, 3])).toBe(false);
        });

        test('returns true for empty arrays', () => {
            expect(arraysMatch([], [])).toBe(true);
        });

        test('returns false for non-array first arg', () => {
            expect(arraysMatch(null, [])).toBe(false);
        });

        test('returns false for non-array second arg', () => {
            expect(arraysMatch([], null)).toBe(false);
        });

        test('deep-compares objects via JSON', () => {
            expect(arraysMatch([{ a: 1 }], [{ a: 1 }])).toBe(true);
            expect(arraysMatch([{ a: 1 }], [{ a: 2 }])).toBe(false);
        });
    });

    describe('moveArrayItem', () => {
        test('moves item forward', () => {
            const arr = ['a', 'b', 'c', 'd'];
            moveArrayItem(arr, 0, 2);
            expect(arr).toEqual(['b', 'c', 'a', 'd']);
        });

        test('moves item backward', () => {
            const arr = ['a', 'b', 'c', 'd'];
            moveArrayItem(arr, 3, 1);
            expect(arr).toEqual(['a', 'd', 'b', 'c']);
        });

        test('no-ops when fromIndex equals toIndex', () => {
            const arr = [1, 2, 3];
            moveArrayItem(arr, 1, 1);
            expect(arr).toEqual([1, 2, 3]);
        });

        test('no-ops for negative fromIndex', () => {
            const arr = [1, 2, 3];
            moveArrayItem(arr, -1, 0);
            expect(arr).toEqual([1, 2, 3]);
        });

        test('no-ops for out-of-bounds toIndex', () => {
            const arr = [1, 2, 3];
            moveArrayItem(arr, 0, 5);
            expect(arr).toEqual([1, 2, 3]);
        });

        test('no-ops for non-array input', () => {
            expect(() => moveArrayItem(null, 0, 1)).not.toThrow();
        });
    });

    describe('replaceReactiveObject', () => {
        test('replaces all keys from source', () => {
            const target = { a: 1, b: 2 };
            replaceReactiveObject(target, { c: 3 });
            expect(target).toEqual({ c: 3 });
        });

        test('clears target when source is empty', () => {
            const target = { a: 1, b: 2 };
            replaceReactiveObject(target, {});
            expect(target).toEqual({});
        });

        test('overwrites existing keys', () => {
            const target = { a: 1 };
            replaceReactiveObject(target, { a: 99, b: 2 });
            expect(target).toEqual({ a: 99, b: 2 });
        });
    });
});
