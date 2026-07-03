import { aggregateFriendGroups } from '../popularGroups';

describe('aggregateFriendGroups', () => {
    it('returns an empty array when there are no links', () => {
        expect(aggregateFriendGroups(new Map(), new Map())).toEqual([]);
    });

    it('counts unique friends per group', () => {
        const links = new Map([
            ['friend1', ['grp_a', 'grp_b']],
            ['friend2', ['grp_a']],
            ['friend3', ['grp_a', 'grp_b']]
        ]);
        const groups = new Map([
            ['grp_a', { name: 'Group A', memberCount: 100 }],
            ['grp_b', { name: 'Group B', memberCount: 50 }]
        ]);

        const result = aggregateFriendGroups(links, groups);

        expect(result).toHaveLength(2);
        const groupA = result.find((g) => g.groupId === 'grp_a');
        expect(groupA.friendCount).toBe(3);
        expect(groupA.friendIds.sort()).toEqual(['friend1', 'friend2', 'friend3']);
    });

    it('sorts by friend count descending', () => {
        const links = new Map([
            ['friend1', ['grp_small']],
            ['friend2', ['grp_big']],
            ['friend3', ['grp_big']]
        ]);
        const groups = new Map([
            ['grp_small', { name: 'Small', memberCount: 10 }],
            ['grp_big', { name: 'Big', memberCount: 10 }]
        ]);

        const result = aggregateFriendGroups(links, groups);

        expect(result[0].groupId).toBe('grp_big');
        expect(result[1].groupId).toBe('grp_small');
    });

    it('breaks friend-count ties by ascending member count', () => {
        const links = new Map([
            ['friend1', ['grp_niche', 'grp_huge']],
            ['friend2', ['grp_niche', 'grp_huge']]
        ]);
        const groups = new Map([
            ['grp_niche', { name: 'Niche', memberCount: 20 }],
            ['grp_huge', { name: 'Huge', memberCount: 5000 }]
        ]);

        const result = aggregateFriendGroups(links, groups);

        expect(result[0].groupId).toBe('grp_niche');
        expect(result[1].groupId).toBe('grp_huge');
    });

    it('breaks remaining ties alphabetically by name', () => {
        const links = new Map([
            ['friend1', ['grp_z']],
            ['friend2', ['grp_a']]
        ]);
        const groups = new Map([
            ['grp_z', { name: 'Zebra', memberCount: 10 }],
            ['grp_a', { name: 'Alpha', memberCount: 10 }]
        ]);

        const result = aggregateFriendGroups(links, groups);

        expect(result[0].groupId).toBe('grp_a');
        expect(result[1].groupId).toBe('grp_z');
    });

    it('marks groups the current user has already joined', () => {
        const links = new Map([['friend1', ['grp_a']]]);
        const groups = new Map([['grp_a', { name: 'Group A' }]]);

        const result = aggregateFriendGroups(links, groups, {
            joinedGroupIds: new Set(['grp_a'])
        });

        expect(result[0].isJoined).toBe(true);
    });

    it('ignores friends with no groupIds array and empty group ids', () => {
        const links = new Map([
            ['friend1', null],
            ['friend2', ['', null, 'grp_a']]
        ]);
        const groups = new Map([['grp_a', { name: 'Group A' }]]);

        const result = aggregateFriendGroups(links, groups);

        expect(result).toHaveLength(1);
        expect(result[0].friendIds).toEqual(['friend2']);
    });

    it('falls back to an empty info object for unknown groups', () => {
        const links = new Map([['friend1', ['grp_unknown']]]);

        const result = aggregateFriendGroups(links, new Map());

        expect(result[0].info).toEqual({});
    });
});
