import {
    getNotificationMessage,
    getUserIdFromNoty,
    toNotificationText
} from '../utils/notificationMessage';

// Mock displayLocation to return a predictable string
vi.mock('../utils', () => ({
    displayLocation: (location, worldName, groupName) => {
        let text = worldName || location;
        if (groupName) text += ` (${groupName})`;
        return text;
    }
}));

describe('getNotificationMessage', () => {
    test('returns null for unknown type', () => {
        expect(getNotificationMessage({ type: 'unknown' }, '')).toBeNull();
    });

    test('OnPlayerJoined', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerJoined', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has joined' });
    });

    test('OnPlayerLeft', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerLeft', displayName: 'Bob' },
            ''
        );
        expect(result).toEqual({ title: 'Bob', body: 'has left' });
    });

    test('OnPlayerJoining', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerJoining', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'is joining' });
    });

    test('GPS', () => {
        const result = getNotificationMessage(
            {
                type: 'GPS',
                displayName: 'Alice',
                location: 'wrld_123',
                worldName: 'TestWorld',
                groupName: ''
            },
            ''
        );
        expect(result.title).toBe('Alice');
        expect(result.body).toContain('is in');
        expect(result.body).toContain('TestWorld');
    });

    test('Online with worldName', () => {
        const result = getNotificationMessage(
            {
                type: 'Online',
                displayName: 'Alice',
                worldName: 'Lobby',
                location: 'wrld_456',
                groupName: ''
            },
            ''
        );
        expect(result.title).toBe('Alice');
        expect(result.body).toContain('has logged in');
        expect(result.body).toContain('Lobby');
    });

    test('Online without worldName', () => {
        const result = getNotificationMessage(
            { type: 'Online', displayName: 'Alice', worldName: '' },
            ''
        );
        expect(result).toEqual({
            title: 'Alice',
            body: 'has logged in'
        });
    });

    test('Offline', () => {
        const result = getNotificationMessage(
            { type: 'Offline', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has logged out' });
    });

    test('Status', () => {
        const result = getNotificationMessage(
            {
                type: 'Status',
                displayName: 'Alice',
                status: 'busy',
                statusDescription: 'working'
            },
            ''
        );
        expect(result).toEqual({
            title: 'Alice',
            body: 'status is now busy working'
        });
    });

    test('invite', () => {
        const result = getNotificationMessage(
            {
                type: 'invite',
                senderUsername: 'Bob',
                details: { worldId: 'wrld_1', worldName: 'Hub' }
            },
            ' (msg)'
        );
        expect(result.title).toBe('Bob');
        expect(result.body).toContain('has invited you to');
        expect(result.body).toContain('Hub');
        expect(result.body).toContain('(msg)');
    });

    test('requestInvite', () => {
        const result = getNotificationMessage(
            { type: 'requestInvite', senderUsername: 'Bob' },
            ' hey'
        );
        expect(result).toEqual({
            title: 'Bob',
            body: 'has requested an invite hey'
        });
    });

    test('friendRequest', () => {
        const result = getNotificationMessage(
            { type: 'friendRequest', senderUsername: 'Charlie' },
            ''
        );
        expect(result).toEqual({
            title: 'Charlie',
            body: 'has sent you a friend request'
        });
    });

    test('Friend', () => {
        const result = getNotificationMessage(
            { type: 'Friend', displayName: 'Dave' },
            ''
        );
        expect(result).toEqual({
            title: 'Dave',
            body: 'is now your friend'
        });
    });

    test('DisplayName', () => {
        const result = getNotificationMessage(
            {
                type: 'DisplayName',
                previousDisplayName: 'OldName',
                displayName: 'NewName'
            },
            ''
        );
        expect(result).toEqual({
            title: 'OldName',
            body: 'changed their name to NewName'
        });
    });

    test('boop', () => {
        const result = getNotificationMessage(
            { type: 'boop', senderUsername: 'Eve', message: 'boop!' },
            ''
        );
        expect(result).toEqual({ title: 'Eve', body: 'boop!' });
    });

    test('groupChange', () => {
        const result = getNotificationMessage(
            { type: 'groupChange', senderUsername: 'Mod', message: 'rank up' },
            ''
        );
        expect(result).toEqual({ title: 'Mod', body: 'rank up' });
    });

    test('group.announcement', () => {
        const result = getNotificationMessage(
            { type: 'group.announcement', message: 'Hello all' },
            ''
        );
        expect(result).toEqual({
            title: 'Group Announcement',
            body: 'Hello all'
        });
    });

    test('PortalSpawn with displayName', () => {
        const result = getNotificationMessage(
            {
                type: 'PortalSpawn',
                displayName: 'Alice',
                instanceId: 'inst_1',
                worldName: 'Room',
                groupName: ''
            },
            ''
        );
        expect(result.title).toBe('Alice');
        expect(result.body).toContain('has spawned a portal to');
    });

    test('PortalSpawn without displayName', () => {
        const result = getNotificationMessage(
            { type: 'PortalSpawn', displayName: '' },
            ''
        );
        expect(result).toEqual({
            title: '',
            body: 'User has spawned a portal'
        });
    });

    test('VideoPlay', () => {
        const result = getNotificationMessage(
            { type: 'VideoPlay', notyName: 'Cool Song' },
            ''
        );
        expect(result).toEqual({
            title: 'Now playing',
            body: 'Cool Song'
        });
    });

    test('BlockedOnPlayerJoined', () => {
        const result = getNotificationMessage(
            { type: 'BlockedOnPlayerJoined', displayName: 'Troll' },
            ''
        );
        expect(result).toEqual({
            title: 'Troll',
            body: 'Blocked user has joined'
        });
    });

    test('Event', () => {
        const result = getNotificationMessage(
            { type: 'Event', data: 'something happened' },
            ''
        );
        expect(result).toEqual({
            title: 'Event',
            body: 'something happened'
        });
    });

    test('External', () => {
        const result = getNotificationMessage(
            { type: 'External', message: 'ext msg' },
            ''
        );
        expect(result).toEqual({ title: 'External', body: 'ext msg' });
    });

    test('inviteResponse', () => {
        const result = getNotificationMessage(
            { type: 'inviteResponse', senderUsername: 'Bob' },
            ' (accepted)'
        );
        expect(result).toEqual({
            title: 'Bob',
            body: 'has responded to your invite (accepted)'
        });
    });

    test('requestInviteResponse', () => {
        const result = getNotificationMessage(
            { type: 'requestInviteResponse', senderUsername: 'Bob' },
            ' (declined)'
        );
        expect(result).toEqual({
            title: 'Bob',
            body: 'has responded to your invite request (declined)'
        });
    });

    test('Unfriend', () => {
        const result = getNotificationMessage(
            { type: 'Unfriend', displayName: 'Eve' },
            ''
        );
        expect(result).toEqual({
            title: 'Eve',
            body: 'is no longer your friend'
        });
    });

    test('TrustLevel', () => {
        const result = getNotificationMessage(
            { type: 'TrustLevel', displayName: 'Dave', trustLevel: 'Known' },
            ''
        );
        expect(result).toEqual({
            title: 'Dave',
            body: 'trust level is now Known'
        });
    });

    test('AvatarChange', () => {
        const result = getNotificationMessage(
            { type: 'AvatarChange', displayName: 'Alice', name: 'CoolAvatar' },
            ''
        );
        expect(result).toEqual({
            title: 'Alice',
            body: 'changed into avatar CoolAvatar'
        });
    });

    test('ChatBoxMessage', () => {
        const result = getNotificationMessage(
            { type: 'ChatBoxMessage', displayName: 'Bob', text: 'hello!' },
            ''
        );
        expect(result).toEqual({ title: 'Bob', body: 'said hello!' });
    });

    test('Blocked', () => {
        const result = getNotificationMessage(
            { type: 'Blocked', displayName: 'Troll' },
            ''
        );
        expect(result).toEqual({ title: 'Troll', body: 'has blocked you' });
    });

    test('Unblocked', () => {
        const result = getNotificationMessage(
            { type: 'Unblocked', displayName: 'Troll' },
            ''
        );
        expect(result).toEqual({
            title: 'Troll',
            body: 'has unblocked you'
        });
    });

    test('Muted', () => {
        const result = getNotificationMessage(
            { type: 'Muted', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has muted you' });
    });

    test('Unmuted', () => {
        const result = getNotificationMessage(
            { type: 'Unmuted', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has unmuted you' });
    });

    test('BlockedOnPlayerLeft', () => {
        const result = getNotificationMessage(
            { type: 'BlockedOnPlayerLeft', displayName: 'Troll' },
            ''
        );
        expect(result).toEqual({
            title: 'Troll',
            body: 'Blocked user has left'
        });
    });

    test('MutedOnPlayerJoined', () => {
        const result = getNotificationMessage(
            { type: 'MutedOnPlayerJoined', displayName: 'MutedUser' },
            ''
        );
        expect(result).toEqual({
            title: 'MutedUser',
            body: 'Muted user has joined'
        });
    });

    test('MutedOnPlayerLeft', () => {
        const result = getNotificationMessage(
            { type: 'MutedOnPlayerLeft', displayName: 'MutedUser' },
            ''
        );
        expect(result).toEqual({
            title: 'MutedUser',
            body: 'Muted user has left'
        });
    });

    test('group.informative', () => {
        const result = getNotificationMessage(
            { type: 'group.informative', message: 'Info msg' },
            ''
        );
        expect(result).toEqual({
            title: 'Group Informative',
            body: 'Info msg'
        });
    });

    test('group.invite', () => {
        const result = getNotificationMessage(
            { type: 'group.invite', message: 'Join us' },
            ''
        );
        expect(result).toEqual({
            title: 'Group Invite',
            body: 'Join us'
        });
    });

    test('group.joinRequest', () => {
        const result = getNotificationMessage(
            { type: 'group.joinRequest', message: 'Request' },
            ''
        );
        expect(result).toEqual({
            title: 'Group Join Request',
            body: 'Request'
        });
    });

    test('group.transfer', () => {
        const result = getNotificationMessage(
            { type: 'group.transfer', message: 'Transfer ownership' },
            ''
        );
        expect(result).toEqual({
            title: 'Group Transfer Request',
            body: 'Transfer ownership'
        });
    });

    test('group.queueReady', () => {
        const result = getNotificationMessage(
            { type: 'group.queueReady', message: 'Queue is ready' },
            ''
        );
        expect(result).toEqual({
            title: 'Instance Queue Ready',
            body: 'Queue is ready'
        });
    });

    test('instance.closed', () => {
        const result = getNotificationMessage(
            { type: 'instance.closed', message: 'Closed' },
            ''
        );
        expect(result).toEqual({
            title: 'Instance Closed',
            body: 'Closed'
        });
    });
});

describe('toNotificationText', () => {
    test('body-only types return just the body', () => {
        expect(toNotificationText('Eve', 'boop!', 'boop')).toBe('boop!');
        expect(
            toNotificationText(
                'Group Announcement',
                'Hello',
                'group.announcement'
            )
        ).toBe('Hello');
        expect(toNotificationText('Event', 'data', 'Event')).toBe('data');
        expect(toNotificationText('External', 'msg', 'External')).toBe('msg');
        expect(
            toNotificationText('Instance Closed', 'closing', 'instance.closed')
        ).toBe('closing');
    });

    test('colon separator types use ": "', () => {
        expect(toNotificationText('Mod', 'rank up', 'groupChange')).toBe(
            'Mod: rank up'
        );
        expect(toNotificationText('Now playing', 'Song', 'VideoPlay')).toBe(
            'Now playing: Song'
        );
    });

    test('colon separator with empty title returns body only', () => {
        expect(toNotificationText('', 'rank up', 'groupChange')).toBe(
            'rank up'
        );
    });

    test('custom format messages for blocked/muted', () => {
        expect(
            toNotificationText(
                'Troll',
                'blocked user has joined',
                'BlockedOnPlayerJoined'
            )
        ).toBe('Blocked user Troll has joined');
        expect(
            toNotificationText(
                'Troll',
                'blocked user has left',
                'BlockedOnPlayerLeft'
            )
        ).toBe('Blocked user Troll has left');
        expect(
            toNotificationText(
                'Troll',
                'muted user has joined',
                'MutedOnPlayerJoined'
            )
        ).toBe('Muted user Troll has joined');
        expect(
            toNotificationText(
                'Troll',
                'muted user has left',
                'MutedOnPlayerLeft'
            )
        ).toBe('Muted user Troll has left');
    });

    test('default types use space separator', () => {
        expect(
            toNotificationText('Alice', 'has joined', 'OnPlayerJoined')
        ).toBe('Alice has joined');
        expect(toNotificationText('Bob', 'has logged out', 'Offline')).toBe(
            'Bob has logged out'
        );
    });

    test('default with empty title returns body only', () => {
        expect(
            toNotificationText('', 'User has spawned a portal', 'PortalSpawn')
        ).toBe('User has spawned a portal');
    });
});

describe('getNotificationMessage with displayNameOverride', () => {
    test('overrides displayName in title', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerJoined', displayName: 'Alice' },
            '',
            'NickAlice'
        );
        expect(result).toEqual({ title: 'NickAlice', body: 'has joined' });
    });

    test('overrides senderUsername in sender-based types', () => {
        const result = getNotificationMessage(
            { type: 'friendRequest', senderUsername: 'Bob' },
            '',
            'NickBob'
        );
        expect(result).toEqual({
            title: 'NickBob',
            body: 'has sent you a friend request'
        });
    });

    test('overrides previousDisplayName in DisplayName type', () => {
        const result = getNotificationMessage(
            {
                type: 'DisplayName',
                previousDisplayName: 'OldName',
                displayName: 'NewName'
            },
            '',
            'NickOld'
        );
        expect(result).toEqual({
            title: 'NickOld',
            body: 'changed their name to NewName'
        });
    });

    test('falls back to noty fields when override is empty', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerLeft', displayName: 'Alice' },
            '',
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has left' });
    });

    test('falls back to noty fields when override is undefined', () => {
        const result = getNotificationMessage(
            { type: 'OnPlayerLeft', displayName: 'Alice' },
            ''
        );
        expect(result).toEqual({ title: 'Alice', body: 'has left' });
    });
});

describe('getUserIdFromNoty', () => {
    test('returns userId when present', () => {
        expect(getUserIdFromNoty({ userId: 'usr_1' })).toBe('usr_1');
    });

    test('returns senderUserId when userId is missing', () => {
        expect(getUserIdFromNoty({ senderUserId: 'usr_2' })).toBe('usr_2');
    });

    test('returns sourceUserId as last priority', () => {
        expect(getUserIdFromNoty({ sourceUserId: 'usr_3' })).toBe('usr_3');
    });

    test('prefers userId over senderUserId', () => {
        expect(
            getUserIdFromNoty({ userId: 'usr_1', senderUserId: 'usr_2' })
        ).toBe('usr_1');
    });

    test('returns empty string when no id fields', () => {
        expect(getUserIdFromNoty({ displayName: 'Alice' })).toBe('');
    });

    test('returns empty string for empty object', () => {
        expect(getUserIdFromNoty({})).toBe('');
    });
});
