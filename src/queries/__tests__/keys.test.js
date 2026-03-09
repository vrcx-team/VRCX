import { describe, expect, test } from 'vitest';

import { queryKeys } from '../keys';

describe('query key shapes', () => {
    test('favorite world keys include owner and tag dimensions', () => {
        const a = queryKeys.favoriteWorlds({
            n: 100,
            offset: 0,
            ownerId: 'usr_1',
            userId: 'usr_1',
            tag: 'worlds1'
        });
        const b = queryKeys.favoriteWorlds({
            n: 100,
            offset: 0,
            ownerId: 'usr_2',
            userId: 'usr_2',
            tag: 'worlds1'
        });

        expect(a).not.toEqual(b);
    });

    test('world list keys include query option discriminator', () => {
        const base = {
            userId: 'usr_me',
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            user: 'me',
            releaseStatus: 'all'
        };

        const defaultKey = queryKeys.worldsByUser(base);
        const featuredKey = queryKeys.worldsByUser({
            ...base,
            option: 'featured'
        });

        expect(defaultKey).not.toEqual(featuredKey);
    });

    test('group member list keys include sort and role dimensions', () => {
        const everyone = queryKeys.groupMembers({
            groupId: 'grp_1',
            n: 100,
            offset: 0,
            sort: 'joinedAt:desc',
            roleId: ''
        });
        const roleScoped = queryKeys.groupMembers({
            groupId: 'grp_1',
            n: 100,
            offset: 0,
            sort: 'joinedAt:desc',
            roleId: 'grol_1'
        });

        expect(everyone).not.toEqual(roleScoped);
    });
});
