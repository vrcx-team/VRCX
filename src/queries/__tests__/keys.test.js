import { describe, expect, test } from 'vitest';

import { queryKeys } from '../keys';

describe('query key shapes', () => {
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

    test('groupCalendarEvent key includes groupId and eventId', () => {
        const a = queryKeys.groupCalendarEvent({
            groupId: 'grp_1',
            eventId: 'evt_1'
        });
        const b = queryKeys.groupCalendarEvent({
            groupId: 'grp_1',
            eventId: 'evt_2'
        });

        expect(a).not.toEqual(b);
        expect(a).toEqual(['group', 'grp_1', 'calendarEvent', 'evt_1']);
    });

    test('userInventoryItem key scopes by both userId and inventoryId', () => {
        const a = queryKeys.userInventoryItem({
            inventoryId: 'inv_1',
            userId: 'usr_1'
        });
        const b = queryKeys.userInventoryItem({
            inventoryId: 'inv_1',
            userId: 'usr_2'
        });

        expect(a).not.toEqual(b);
    });

    test('mutualCounts key is unique per userId', () => {
        const a = queryKeys.mutualCounts('usr_1');
        const b = queryKeys.mutualCounts('usr_2');

        expect(a).not.toEqual(b);
        expect(a).toEqual(['user', 'usr_1', 'mutualCounts']);
    });

    test('representedGroup key is unique per userId', () => {
        const a = queryKeys.representedGroup('usr_1');
        const b = queryKeys.representedGroup('usr_2');

        expect(a).not.toEqual(b);
        expect(a).toEqual(['user', 'usr_1', 'representedGroup']);
    });

    test('avatarStyles returns a stable singleton key', () => {
        expect(queryKeys.avatarStyles()).toEqual(['avatar', 'styles']);
        expect(queryKeys.avatarStyles()).toEqual(queryKeys.avatarStyles());
    });

    test('vrchatCredits returns a stable singleton key', () => {
        expect(queryKeys.vrchatCredits()).toEqual(['credits']);
    });

    test('visits returns a stable singleton key', () => {
        expect(queryKeys.visits()).toEqual(['visits']);
    });

    test('favoriteLimits returns a stable singleton key', () => {
        expect(queryKeys.favoriteLimits()).toEqual(['favorite', 'limits']);
    });

    test('groupMember key includes both groupId and userId', () => {
        const key = queryKeys.groupMember({
            groupId: 'grp_1',
            userId: 'usr_1'
        });

        expect(key).toEqual(['group', 'grp_1', 'member', 'usr_1']);
    });

    test('group key differentiates includeRoles flag', () => {
        const withRoles = queryKeys.group('grp_1', true);
        const withoutRoles = queryKeys.group('grp_1', false);

        expect(withRoles).not.toEqual(withoutRoles);
    });

    test('worldPersistData key scopes by worldId', () => {
        const a = queryKeys.worldPersistData('wrld_1');
        const b = queryKeys.worldPersistData('wrld_2');

        expect(a).not.toEqual(b);
        expect(a).toEqual(['world', 'wrld_1', 'persistData']);
    });

    test('fileAnalysis key differentiates version and variant', () => {
        const a = queryKeys.fileAnalysis({
            fileId: 'file_1',
            version: 1,
            variant: 'default'
        });
        const b = queryKeys.fileAnalysis({
            fileId: 'file_1',
            version: 2,
            variant: 'default'
        });
        const c = queryKeys.fileAnalysis({
            fileId: 'file_1',
            version: 1,
            variant: 'hd'
        });

        expect(a).not.toEqual(b);
        expect(a).not.toEqual(c);
    });

    test('worldsByUser key coerces numeric params consistently', () => {
        const a = queryKeys.worldsByUser({
            userId: 'usr_1',
            n: '50',
            offset: '0'
        });
        const b = queryKeys.worldsByUser({ userId: 'usr_1', n: 50, offset: 0 });

        expect(a).toEqual(b);
    });
});
