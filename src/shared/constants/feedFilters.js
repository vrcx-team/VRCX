const getOptions = (optionTypes) => {
    const optionMap = {
        Off: { label: 'Off', textKey: 'dialog.shared_feed_filters.off' },
        On: { label: 'On', textKey: 'dialog.shared_feed_filters.on' },
        VIP: {
            label: 'VIP',
            textKey: 'dialog.shared_feed_filters.favorite'
        },
        Friends: {
            label: 'Friends',
            textKey: 'dialog.shared_feed_filters.friends'
        },
        Everyone: {
            label: 'Everyone',
            textKey: 'dialog.shared_feed_filters.everyone'
        }
    };
    return optionTypes.map((type) => optionMap[type]);
};

function feedFiltersOptions() {
    const baseOptions = [
        {
            key: 'OnPlayerJoining',
            name: 'OnPlayerJoining',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'OnPlayerJoined',
            name: 'OnPlayerJoined',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'OnPlayerLeft',
            name: 'OnPlayerLeft',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'Online',
            name: 'Online',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'Offline',
            name: 'Offline',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'GPS',
            name: 'GPS',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'Status',
            name: 'Status',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'invite',
            name: 'Invite',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'requestInvite',
            name: 'Request Invite',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'inviteResponse',
            name: 'Invite Response',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'requestInviteResponse',
            name: 'Request Invite Response',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'friendRequest',
            name: 'Friend Request',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'Friend',
            name: 'New Friend',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'Unfriend',
            name: 'Unfriend',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'DisplayName',
            name: 'Display Name Change',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'TrustLevel',
            name: 'Trust Level Change',
            options: getOptions(['Off', 'VIP', 'Friends'])
        },
        {
            key: 'groupChange',
            name: 'Group Change',
            options: getOptions(['Off', 'On']),
            tooltip:
                "When you've left or been kicked from a group, group name changed, group owner changed, role added/removed"
        },
        {
            key: 'group.announcement',
            name: 'Group Announcement',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'group.informative',
            name: 'Group Join',
            options: getOptions(['Off', 'On']),
            tooltip: 'When your request to join a group has been approved'
        },
        {
            key: 'group.invite',
            name: 'Group Invite',
            options: getOptions(['Off', 'On']),
            tooltip: 'When someone invites you to join a group'
        },
        {
            key: 'group.joinRequest',
            name: 'Group Join Request',
            options: getOptions(['Off', 'On']),
            tooltip:
                "When someone requests to join a group you're a moderator for"
        },
        {
            key: 'group.transfer',
            name: 'Group Transfer Request',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'group.queueReady',
            name: 'Instance Queue Ready',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'instance.closed',
            name: 'Instance Closed',
            options: getOptions(['Off', 'On']),
            tooltip:
                "When the instance you're in has been closed preventing anyone from joining"
        },
        {
            key: 'VideoPlay',
            name: 'Video Play',
            options: getOptions(['Off', 'On']),
            tooltip: 'Requires VRCX YouTube API option enabled',
            tooltipWarning: true
        },
        {
            key: 'Event',
            name: 'Miscellaneous Events',
            options: getOptions(['Off', 'On']),
            tooltip:
                'Misc event from VRC game log: VRC crash auto rejoin, shader keyword limit, joining instance blocked by master, error loading video, audio device changed, error joining instance, kicked from instance, VRChat failing to start OSC server, etc...'
        },
        {
            key: 'External',
            name: 'External App',
            options: getOptions(['Off', 'On'])
        },
        {
            key: 'BlockedOnPlayerJoined',
            name: 'Blocked Player Joins',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'BlockedOnPlayerLeft',
            name: 'Blocked Player Leaves',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'MutedOnPlayerJoined',
            name: 'Muted Player Joins',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'MutedOnPlayerLeft',
            name: 'Muted Player Leaves',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'AvatarChange',
            name: 'Lobby Avatar Change',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        }
    ];

    const photonFeedFiltersOptions = [
        {
            key: 'PortalSpawn',
            name: 'Portal Spawn',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        {
            key: 'ChatBoxMessage',
            name: 'Lobby ChatBox Message',
            options: getOptions(['Off', 'VIP', 'Friends', 'Everyone'])
        },
        { key: 'Blocked', name: 'Blocked', options: getOptions(['Off', 'On']) },
        {
            key: 'Unblocked',
            name: 'Unblocked',
            options: getOptions(['Off', 'On'])
        },
        { key: 'Muted', name: 'Muted', options: getOptions(['Off', 'On']) },
        { key: 'Unmuted', name: 'Unmuted', options: getOptions(['Off', 'On']) }
    ];

    const notyFeedFiltersOptions = baseOptions;

    const wristFeedFiltersOptions = [
        {
            key: 'Location',
            name: 'Self Location',
            options: getOptions(['Off', 'On'])
        },
        ...baseOptions
    ];

    return {
        notyFeedFiltersOptions,
        wristFeedFiltersOptions,
        photonFeedFiltersOptions
    };
}

const sharedFeedFiltersDefaults = {
    noty: {
        Location: 'Off',
        OnPlayerJoined: 'VIP',
        OnPlayerLeft: 'VIP',
        OnPlayerJoining: 'VIP',
        Online: 'VIP',
        Offline: 'VIP',
        GPS: 'Off',
        Status: 'Off',
        invite: 'Friends',
        requestInvite: 'Friends',
        inviteResponse: 'Friends',
        requestInviteResponse: 'Friends',
        friendRequest: 'On',
        Friend: 'On',
        Unfriend: 'On',
        DisplayName: 'VIP',
        TrustLevel: 'VIP',
        boop: 'Off',
        groupChange: 'On',
        'group.announcement': 'On',
        'group.informative': 'On',
        'group.invite': 'On',
        'group.joinRequest': 'Off',
        'group.transfer': 'On',
        'group.queueReady': 'On',
        'instance.closed': 'On',
        PortalSpawn: 'Everyone',
        Event: 'On',
        External: 'On',
        VideoPlay: 'Off',
        BlockedOnPlayerJoined: 'Off',
        BlockedOnPlayerLeft: 'Off',
        MutedOnPlayerJoined: 'Off',
        MutedOnPlayerLeft: 'Off',
        AvatarChange: 'Off',
        ChatBoxMessage: 'Off',
        Blocked: 'Off',
        Unblocked: 'Off',
        Muted: 'Off',
        Unmuted: 'Off'
    },
    wrist: {
        Location: 'On',
        OnPlayerJoined: 'Everyone',
        OnPlayerLeft: 'Everyone',
        OnPlayerJoining: 'Friends',
        Online: 'Friends',
        Offline: 'Friends',
        GPS: 'Friends',
        Status: 'Friends',
        invite: 'Friends',
        requestInvite: 'Friends',
        inviteResponse: 'Friends',
        requestInviteResponse: 'Friends',
        friendRequest: 'On',
        Friend: 'On',
        Unfriend: 'On',
        DisplayName: 'Friends',
        TrustLevel: 'Friends',
        boop: 'On',
        groupChange: 'On',
        'group.announcement': 'On',
        'group.informative': 'On',
        'group.invite': 'On',
        'group.joinRequest': 'On',
        'group.transfer': 'On',
        'group.queueReady': 'On',
        'instance.closed': 'On',
        PortalSpawn: 'Everyone',
        Event: 'On',
        External: 'On',
        VideoPlay: 'On',
        BlockedOnPlayerJoined: 'Off',
        BlockedOnPlayerLeft: 'Off',
        MutedOnPlayerJoined: 'Off',
        MutedOnPlayerLeft: 'Off',
        AvatarChange: 'Everyone',
        ChatBoxMessage: 'Off',
        Blocked: 'On',
        Unblocked: 'On',
        Muted: 'On',
        Unmuted: 'On'
    }
};

export { feedFiltersOptions, sharedFeedFiltersDefaults };
