import { moveGroupInOrder, normalizeGroupOrder } from '../groupOrderUtils';

describe('groupOrderUtils', () => {
    describe('normalizeGroupOrder', () => {
        test('appends groups missing from the saved registry order', () => {
            expect(
                normalizeGroupOrder(
                    ['group-b'],
                    ['group-a', 'group-b', 'group-c']
                )
            ).toEqual(['group-b', 'group-a', 'group-c']);
        });

        test('removes stale and duplicate group IDs', () => {
            expect(
                normalizeGroupOrder(
                    ['stale', 'group-b', 'group-b', 'group-a'],
                    ['group-a', 'group-b']
                )
            ).toEqual(['group-b', 'group-a']);
        });
    });

    describe('moveGroupInOrder', () => {
        test('preserves every group when moving one missing from the saved order', () => {
            const order = normalizeGroupOrder(
                ['group-a', 'group-b'],
                ['group-a', 'group-b', 'group-new', 'group-c']
            );

            expect(moveGroupInOrder(order, 'group-new', 3)).toBe(true);
            expect(order).toEqual([
                'group-a',
                'group-b',
                'group-c',
                'group-new'
            ]);
        });

        test('moves a known group to the requested index', () => {
            const order = ['group-a', 'group-b', 'group-c'];

            expect(moveGroupInOrder(order, 'group-c', 0)).toBe(true);
            expect(order).toEqual(['group-c', 'group-a', 'group-b']);
        });

        test('does not corrupt the order when the group ID is missing', () => {
            const order = ['group-a', 'group-b'];

            expect(moveGroupInOrder(order, 'group-new', 0)).toBe(false);
            expect(order).toEqual(['group-a', 'group-b']);
        });
    });
});
