import { describe, expect, test } from 'vitest';

import {
    displayLocation,
    parseLocation,
    resolveRegion,
    translateAccessType
} from '../locationParser';

// ─── parseLocation ───────────────────────────────────────────────────

describe('parseLocation', () => {
    test('returns offline context', () => {
        const ctx = parseLocation('offline');
        expect(ctx.isOffline).toBe(true);
        expect(ctx.isPrivate).toBe(false);
        expect(ctx.worldId).toBe('');
    });

    test('handles offline:offline variant', () => {
        expect(parseLocation('offline:offline').isOffline).toBe(true);
    });

    test('returns private context', () => {
        const ctx = parseLocation('private');
        expect(ctx.isPrivate).toBe(true);
        expect(ctx.isOffline).toBe(false);
    });

    test('handles private:private variant', () => {
        expect(parseLocation('private:private').isPrivate).toBe(true);
    });

    test('returns traveling context', () => {
        const ctx = parseLocation('traveling');
        expect(ctx.isTraveling).toBe(true);
    });

    test('handles traveling:traveling variant', () => {
        expect(parseLocation('traveling:traveling').isTraveling).toBe(true);
    });

    test('parses public instance', () => {
        const ctx = parseLocation('wrld_abc:12345');
        expect(ctx.worldId).toBe('wrld_abc');
        expect(ctx.instanceId).toBe('12345');
        expect(ctx.instanceName).toBe('12345');
        expect(ctx.accessType).toBe('public');
        expect(ctx.isRealInstance).toBe(true);
    });

    test('parses friends instance', () => {
        const ctx = parseLocation(
            'wrld_abc:12345~friends(usr_owner)~region(eu)'
        );
        expect(ctx.accessType).toBe('friends');
        expect(ctx.friendsId).toBe('usr_owner');
        expect(ctx.userId).toBe('usr_owner');
        expect(ctx.region).toBe('eu');
    });

    test('parses friends+ (hidden) instance', () => {
        const ctx = parseLocation('wrld_abc:12345~hidden(usr_owner)');
        expect(ctx.accessType).toBe('friends+');
        expect(ctx.hiddenId).toBe('usr_owner');
        expect(ctx.userId).toBe('usr_owner');
    });

    test('parses invite instance', () => {
        const ctx = parseLocation('wrld_abc:12345~private(usr_owner)');
        expect(ctx.accessType).toBe('invite');
        expect(ctx.privateId).toBe('usr_owner');
    });

    test('parses invite+ instance', () => {
        const ctx = parseLocation(
            'wrld_abc:12345~private(usr_owner)~canRequestInvite'
        );
        expect(ctx.accessType).toBe('invite+');
        expect(ctx.canRequestInvite).toBe(true);
    });

    test('parses group instance', () => {
        const ctx = parseLocation(
            'wrld_abc:12345~group(grp_xyz)~groupAccessType(public)'
        );
        expect(ctx.accessType).toBe('group');
        expect(ctx.groupId).toBe('grp_xyz');
        expect(ctx.groupAccessType).toBe('public');
        expect(ctx.accessTypeName).toBe('groupPublic');
    });

    test('parses group plus access type', () => {
        const ctx = parseLocation(
            'wrld_abc:12345~group(grp_xyz)~groupAccessType(plus)'
        );
        expect(ctx.accessTypeName).toBe('groupPlus');
    });

    test('handles strict and ageGate', () => {
        const ctx = parseLocation('wrld_abc:12345~strict~ageGate');
        expect(ctx.strict).toBe(true);
        expect(ctx.ageGate).toBe(true);
    });

    test('extracts shortName from URL', () => {
        const ctx = parseLocation(
            'wrld_abc:12345~friends(usr_a)&shortName=myShort'
        );
        expect(ctx.shortName).toBe('myShort');
        expect(ctx.accessType).toBe('friends');
    });

    test('handles world-only tag (no colon)', () => {
        const ctx = parseLocation('wrld_abc');
        expect(ctx.worldId).toBe('wrld_abc');
        expect(ctx.instanceId).toBe('');
        expect(ctx.isRealInstance).toBe(true);
    });

    test('handles null/empty input', () => {
        const ctx = parseLocation('');
        expect(ctx.isOffline).toBe(false);
        expect(ctx.isPrivate).toBe(false);
        expect(ctx.worldId).toBe('');
    });

    test('handles local instance (non-real)', () => {
        const ctx = parseLocation('local:12345');
        expect(ctx.isRealInstance).toBe(false);
        expect(ctx.worldId).toBe('');
    });
});

// ─── displayLocation ─────────────────────────────────────────────────

describe('displayLocation', () => {
    test('shows Offline for offline location', () => {
        expect(displayLocation('offline', 'World Name')).toBe('Offline');
    });

    test('shows Private for private location', () => {
        expect(displayLocation('private', 'World Name')).toBe('Private');
    });

    test('shows Traveling for traveling location', () => {
        expect(displayLocation('traveling', 'World Name')).toBe('Traveling');
    });

    test('shows world name with access type', () => {
        const result = displayLocation(
            'wrld_abc:12345~friends(usr_a)',
            'My World'
        );
        expect(result).toBe('My World friends');
    });

    test('includes group name when provided', () => {
        const result = displayLocation(
            'wrld_abc:12345~group(grp_xyz)~groupAccessType(public)',
            'My World',
            'My Group'
        );
        expect(result).toBe('My World groupPublic(My Group)');
    });

    test('returns worldName for world-only tag', () => {
        expect(displayLocation('wrld_abc', 'My World')).toBe('My World');
    });
});

// ─── resolveRegion ───────────────────────────────────────────────────

describe('resolveRegion', () => {
    test('returns empty for offline', () => {
        expect(resolveRegion(parseLocation('offline'))).toBe('');
    });

    test('returns region from tag', () => {
        expect(resolveRegion(parseLocation('wrld_abc:12345~region(eu)'))).toBe(
            'eu'
        );
    });

    test('defaults to us when instance has no region', () => {
        expect(resolveRegion(parseLocation('wrld_abc:12345'))).toBe('us');
    });

    test('returns empty when no instanceId', () => {
        expect(resolveRegion(parseLocation('wrld_abc'))).toBe('');
    });
});

// ─── translateAccessType ─────────────────────────────────────────────

describe('translateAccessType', () => {
    const t = (key) => `translated_${key}`;
    const keyMap = {
        public: 'access.public',
        friends: 'access.friends',
        invite: 'access.invite',
        group: 'access.group',
        groupPublic: 'access.groupPublic',
        groupPlus: 'access.groupPlus'
    };

    test('translates simple access type', () => {
        expect(translateAccessType('friends', t, keyMap)).toBe(
            'translated_access.friends'
        );
    });

    test('translates groupPublic with group prefix', () => {
        expect(translateAccessType('groupPublic', t, keyMap)).toBe(
            'translated_access.group translated_access.groupPublic'
        );
    });

    test('translates groupPlus with group prefix', () => {
        expect(translateAccessType('groupPlus', t, keyMap)).toBe(
            'translated_access.group translated_access.groupPlus'
        );
    });

    test('returns raw name when not in keyMap', () => {
        expect(translateAccessType('unknown', t, keyMap)).toBe('unknown');
    });
});
