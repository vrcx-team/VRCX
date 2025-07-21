import { removeFromArray } from '../array';

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
});
