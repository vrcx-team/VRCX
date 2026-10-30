import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import { ClientMessageSchema, PresenceStatus, ServerMessageSchema } from '../realtimeSchema';
import {
    instanceIdFromLocation,
    makeLocation,
    normalizeRegion,
    presenceState,
    presenceToUser,
    toVrcCurrentUser,
    toVrcInstance,
    toVrcWorld
} from '../mappers';
import { parseLocation } from '../../../shared/utils/locationParser';
import { computeTrustLevel } from '../../../shared/utils/userTransforms';

const WORLD = '6a335eb4fa3baa6c11dae00d';
const INSTANCE = '6a40aa000000000000000001';

describe('realtime schema', () => {
    test('round-trips an auth ClientMessage', () => {
        const msg = create(ClientMessageSchema, {
            payload: { case: 'auth', value: { accessToken: 'tok' } }
        });
        const back = fromBinary(ClientMessageSchema, toBinary(ClientMessageSchema, msg));
        expect(back.payload.case).toBe('auth');
        expect(back.payload.value.accessToken).toBe('tok');
    });

    test('decodes a friends presence delta', () => {
        const msg = create(ServerMessageSchema, {
            payload: {
                case: 'dataUpdate',
                value: {
                    key: 'me',
                    data: {
                        case: 'friendsPresence',
                        value: {
                            update: {
                                case: 'delta',
                                value: {
                                    changed: [
                                        {
                                            userId: 'u1',
                                            displayName: 'Friend',
                                            status: PresenceStatus.JOIN_ME,
                                            location: { instanceId: INSTANCE, worldId: WORLD, region: 'eu' }
                                        }
                                    ],
                                    removed: ['u2']
                                }
                            }
                        }
                    }
                }
            }
        });
        const back = fromBinary(ServerMessageSchema, toBinary(ServerMessageSchema, msg));
        const update = back.payload.value.data.value.update;
        expect(update.case).toBe('delta');
        expect(update.value.changed[0].location.region).toBe('eu');
        expect(update.value.removed).toEqual(['u2']);
    });
});

describe('locations', () => {
    test('parseLocation reads what makeLocation writes', () => {
        const tag = makeLocation(WORLD, INSTANCE, { region: 'eu', type: 'friends-only', owner: 'u9' });
        const L = parseLocation(tag);
        expect(L.worldId).toBe(WORLD);
        expect(L.instanceName).toBe(INSTANCE);
        expect(L.region).toBe('eu');
        expect(L.accessType).toBe('friends');
        expect(L.userId).toBe('u9');
        expect(instanceIdFromLocation(tag)).toBe(INSTANCE);
    });

    test('cluster names map to flag regions', () => {
        expect(normalizeRegion('EU-Central-1')).toBe('eu');
        expect(normalizeRegion('us-west')).toBe('usw');
        expect(normalizeRegion('na-east-2')).toBe('use');
        expect(normalizeRegion('jp')).toBe('jp');
        expect(normalizeRegion('ca')).toBe('ca');
        expect(normalizeRegion('fi-1')).toBe('fi');
        expect(normalizeRegion('mars')).toBe('mars');
        expect(normalizeRegion('')).toBe('');
        expect(parseLocation(makeLocation(WORLD, INSTANCE, { region: 'eu-west' })).region).toBe('eu');
    });

    test('group instances carry their access type', () => {
        const L = parseLocation(makeLocation(WORLD, INSTANCE, { type: 'group-plus', group: 'g1' }));
        expect(L.groupId).toBe('g1');
        expect(L.accessTypeName).toBe('groupPlus');
    });
});

describe('presence', () => {
    test('in an instance is online with a location', () => {
        const s = presenceState({
            status: PresenceStatus.ONLINE,
            location: { instanceId: INSTANCE, worldId: WORLD, region: 'us' }
        });
        expect(s.state).toBe('online');
        expect(s.status).toBe('active');
        expect(parseLocation(s.location).worldId).toBe(WORLD);
    });

    test('on the platform but not in an instance is active', () => {
        expect(presenceState({ status: PresenceStatus.ASK_ME }).state).toBe('active');
    });

    test('offline wins over a stale location', () => {
        const s = presenceState({ status: PresenceStatus.OFFLINE, location: { instanceId: INSTANCE } });
        expect(s.location).toBe('offline');
    });

    test('presence frames do not wipe a cached bio, badges or languages', () => {
        const user = presenceToUser({ userId: 'u1', displayName: 'A', status: PresenceStatus.ONLINE, socialRank: 2 }, [
            'language_fin',
            'nexvr_rank_E'
        ]);
        expect('bio' in user).toBe(false);
        expect('$nexvr' in user).toBe(false);
        expect(user.tags).toContain('language_fin');
        expect(user.tags).toContain('nexvr_rank_D');
        expect(user.tags).not.toContain('nexvr_rank_E');
        expect(user.isFriend).toBe(true);
    });

    test('a hidden instance reads as private, not as an instance named private', () => {
        const s = presenceState({
            status: PresenceStatus.ASK_ME,
            location: { instanceId: 'private', worldId: 'private', region: 'ca' }
        });
        expect(s.location).toBe('private');
        expect(parseLocation(s.location).isPrivate).toBe(true);
    });

    test('social rank shows in place of trust level', () => {
        expect(computeTrustLevel(['nexvr_rank_D'], 'none').trustLevel).toBe('Rank D');
        expect(computeTrustLevel(['nexvr_rank_S+'], 'none').trustSortNum).toBeGreaterThan(
            computeTrustLevel(['nexvr_rank_A'], 'none').trustSortNum
        );
        expect(computeTrustLevel(['system_trust_known'], 'none').trustLevel).toBe('User');
    });

    test('current user splits friends by state and skips itself', () => {
        const friends = new Map([
            [
                'me',
                {
                    userId: 'me',
                    status: PresenceStatus.ONLINE,
                    location: { instanceId: INSTANCE, worldId: WORLD, region: 'ca' }
                }
            ],
            ['a', { userId: 'a', status: PresenceStatus.ONLINE, location: { instanceId: INSTANCE, worldId: WORLD } }],
            ['b', { userId: 'b', status: PresenceStatus.ONLINE }],
            ['c', { userId: 'c', status: PresenceStatus.OFFLINE }]
        ]);
        const me = toVrcCurrentUser(
            { id: 'me', username: 'me', displayName: 'Me', userPreferenceStatus: 'do-not-disturb', socialRank: 'B' },
            friends
        );
        expect(me.onlineFriends).toEqual(['a']);
        expect(me.activeFriends).toEqual(['b']);
        expect(me.offlineFriends).toEqual(['c']);
        expect(me.friends).not.toContain('me');
        expect(me.status).toBe('busy');
        expect(me.presence.world).toBe(WORLD);
        expect(parseLocation(`${me.presence.world}:${me.presence.instance}`).region).toBe('ca');
        expect(me.tags).toContain('nexvr_rank_B');
        expect(me.tags.some((tag) => tag.startsWith('system_trust_'))).toBe(false);
        expect(me.developerType).toBe('none');
    });
});

describe('content', () => {
    test('worlds map ids, images and player counts', () => {
        const world = toVrcWorld(
            {
                _id: WORLD,
                name: 'Club',
                owner: 'u1',
                visibility: 'public',
                images: { primary: 'https://cdn.nexvr.net/images/x', secondary: [] },
                platforms: ['pc', 'android'],
                stats: { publicPlayers: 7, privatePlayers: 2 }
            },
            'Owner'
        );
        expect(world.id).toBe(WORLD);
        expect(world.authorName).toBe('Owner');
        expect(world.occupants).toBe(9);
        expect(world.unityPackages.map((p) => p.platform)).toEqual(['standalonewindows', 'android']);
    });

    test('instances get a VRChat-style location id', () => {
        const instance = toVrcInstance({
            _id: INSTANCE,
            world: WORLD,
            type: 'private',
            creator: 'u1',
            region: 'eu',
            playerCount: 3,
            maxPlayers: 16,
            status: 'running'
        });
        expect(parseLocation(instance.id).accessType).toBe('invite');
        expect(instance.worldId).toBe(WORLD);
        expect(instance.n_users).toBe(3);
    });
});
