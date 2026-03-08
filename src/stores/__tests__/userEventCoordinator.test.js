import { describe, expect, test, vi } from 'vitest';

import { createUserEventCoordinator } from '../coordinators/userEventCoordinator';

/**
 * @returns {object} Mock dependencies for user event tests.
 */
function makeDeps() {
    const friendRef = {
        id: 'usr_1'
    };

    return {
        friendStore: {
            friends: new Map([['usr_1', friendRef]])
        },
        state: {
            instancePlayerCount: new Map()
        },
        parseLocation: vi.fn((location) => {
            if (location === 'loc_old') {
                return {
                    tag: 'loc_old',
                    worldId: 'world_old',
                    groupId: 'group_old'
                };
            }
            if (location === 'loc_new') {
                return {
                    tag: 'loc_new',
                    worldId: 'world_new',
                    groupId: 'group_new'
                };
            }
            return {
                tag: location,
                worldId: '',
                groupId: ''
            };
        }),
        userDialog: {
            value: {
                $location: {
                    tag: 'loc_new'
                }
            }
        },
        applyUserDialogLocation: vi.fn(),
        worldStore: {
            worldDialog: {
                id: 'world_old'
            }
        },
        groupStore: {
            groupDialog: {
                id: 'group_new'
            }
        },
        instanceStore: {
            applyWorldDialogInstances: vi.fn(),
            applyGroupDialogInstances: vi.fn()
        },
        appDebug: {
            debugFriendState: false
        },
        getWorldName: vi.fn().mockResolvedValue('World'),
        getGroupName: vi.fn().mockResolvedValue('Group'),
        feedStore: {
            addFeed: vi.fn()
        },
        database: {
            addGPSToDatabase: vi.fn(),
            addAvatarToDatabase: vi.fn(),
            addStatusToDatabase: vi.fn(),
            addBioToDatabase: vi.fn()
        },
        avatarStore: {
            getAvatarName: vi.fn().mockResolvedValue({
                ownerId: 'usr_owner',
                avatarName: 'Avatar'
            })
        },
        generalSettingsStore: {
            logEmptyAvatars: false
        },
        checkNote: vi.fn(),
        now: vi.fn(() => 1000),
        nowIso: vi.fn(() => '2025-01-01T00:00:00.000Z')
    };
}

describe('createUserEventCoordinator', () => {
    test('returns early when target user is not in friend map', async () => {
        const deps = makeDeps();
        deps.friendStore.friends.clear();
        const coordinator = createUserEventCoordinator(deps);

        await coordinator.runHandleUserUpdateFlow(
            {
                id: 'usr_404',
                displayName: 'Unknown'
            },
            {
                status: ['online', 'offline']
            }
        );

        expect(deps.feedStore.addFeed).not.toHaveBeenCalled();
        expect(deps.database.addStatusToDatabase).not.toHaveBeenCalled();
    });

    test('updates location counters and dialog instance hooks on location change', async () => {
        const deps = makeDeps();
        deps.state.instancePlayerCount.set('loc_old', 2);
        const coordinator = createUserEventCoordinator(deps);
        const ref = {
            id: 'usr_1',
            displayName: 'User 1'
        };

        await coordinator.runHandleUserUpdateFlow(ref, {
            location: ['loc_new', 'loc_old', 50],
            state: ['online', 'online']
        });

        expect(deps.state.instancePlayerCount.get('loc_old')).toBe(1);
        expect(deps.state.instancePlayerCount.get('loc_new')).toBe(1);
        expect(deps.applyUserDialogLocation).toHaveBeenCalledWith(true);
        expect(deps.instanceStore.applyWorldDialogInstances).toHaveBeenCalled();
        expect(deps.instanceStore.applyGroupDialogInstances).toHaveBeenCalled();
    });

    test('writes GPS feed with adjusted traveling time contract', async () => {
        const deps = makeDeps();
        const coordinator = createUserEventCoordinator(deps);
        const ref = {
            id: 'usr_1',
            displayName: 'User 1',
            $previousLocation: 'loc_old',
            $travelingToTime: 900,
            $location_at: 700
        };

        await coordinator.runHandleUserUpdateFlow(ref, {
            location: ['loc_new', 'traveling', 300]
        });

        expect(deps.feedStore.addFeed).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'GPS',
                userId: 'usr_1',
                previousLocation: 'loc_old',
                location: 'loc_new',
                worldName: 'World',
                groupName: 'Group',
                time: 200
            })
        );
        expect(deps.database.addGPSToDatabase).toHaveBeenCalledTimes(1);
        expect(ref.$previousLocation).toBe('');
        expect(ref.$travelingToTime).toBe(1000);
    });

    test('stores previous location while user becomes traveling', async () => {
        const deps = makeDeps();
        const coordinator = createUserEventCoordinator(deps);
        const ref = {
            id: 'usr_1',
            displayName: 'User 1',
            $previousLocation: '',
            $travelingToTime: 0
        };

        await coordinator.runHandleUserUpdateFlow(ref, {
            location: ['traveling', 'loc_old']
        });

        expect(ref.$previousLocation).toBe('loc_old');
        expect(ref.$travelingToTime).toBe(1000);
    });

    test('writes status and bio feeds and triggers note check', async () => {
        const deps = makeDeps();
        const coordinator = createUserEventCoordinator(deps);
        const ref = {
            id: 'usr_1',
            displayName: 'User 1',
            status: 'busy',
            statusDescription: 'old',
            currentAvatarImageUrl: '',
            currentAvatarThumbnailImageUrl: '',
            currentAvatarTags: [],
            profilePicOverride: ''
        };

        await coordinator.runHandleUserUpdateFlow(ref, {
            status: ['join me', 'busy'],
            statusDescription: ['new desc', 'old desc'],
            bio: ['new bio', 'old bio'],
            note: ['new note', 'old note']
        });

        expect(deps.feedStore.addFeed).toHaveBeenCalledTimes(2);
        expect(deps.database.addStatusToDatabase).toHaveBeenCalledTimes(1);
        expect(deps.database.addBioToDatabase).toHaveBeenCalledTimes(1);
        expect(deps.checkNote).toHaveBeenCalledWith('usr_1', 'new note');
    });

    test('writes avatar change feed contract', async () => {
        const deps = makeDeps();
        deps.generalSettingsStore.logEmptyAvatars = true;
        deps.avatarStore.getAvatarName
            .mockResolvedValueOnce({
                ownerId: 'usr_owner_new',
                avatarName: 'Avatar New'
            })
            .mockResolvedValueOnce({
                ownerId: 'usr_owner_old',
                avatarName: 'Avatar Old'
            });
        const coordinator = createUserEventCoordinator(deps);
        const ref = {
            id: 'usr_1',
            displayName: 'User 1',
            currentAvatarImageUrl: 'img_old',
            currentAvatarThumbnailImageUrl: 'thumb_old',
            currentAvatarTags: ['tag_old'],
            profilePicOverride: ''
        };

        await coordinator.runHandleUserUpdateFlow(ref, {
            currentAvatarImageUrl: ['img_new', 'img_old'],
            currentAvatarThumbnailImageUrl: ['thumb_new', 'thumb_old'],
            currentAvatarTags: [['tag_new'], ['tag_old']]
        });

        expect(deps.database.addAvatarToDatabase).toHaveBeenCalledTimes(1);
        expect(deps.feedStore.addFeed).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'Avatar',
                userId: 'usr_1',
                ownerId: 'usr_owner_new',
                previousOwnerId: 'usr_owner_old',
                avatarName: 'Avatar New',
                previousAvatarName: 'Avatar Old',
                currentAvatarImageUrl: 'img_new',
                previousCurrentAvatarImageUrl: 'img_old'
            })
        );
    });
});
