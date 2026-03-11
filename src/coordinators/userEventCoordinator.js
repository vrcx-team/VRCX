import { getGroupName, getWorldName, parseLocation } from '../shared/utils';
import { AppDebug } from '../services/appConfig';
import { database } from '../services/database';
import { getAvatarName } from './avatarCoordinator';
import { useFeedStore } from '../stores/feed';
import { useFriendStore } from '../stores/friend';
import { useGeneralSettingsStore } from '../stores/settings/general';
import { useGroupStore } from '../stores/group';
import { useInstanceStore } from '../stores/instance';
import { useNotificationStore } from '../stores/notification';
import { useSharedFeedStore } from '../stores/sharedFeed';
import { useUserStore } from '../stores/user';
import { useWorldStore } from '../stores/world';

/**
 * Handles user diff events and applies cross-store side effects.
 * @param {object} ref Updated user reference.
 * @param {object} props Changed props with [new, old] tuples.
 * @param {object} [options] Test seams.
 * @param {function} [options.now] Timestamp provider.
 * @param {function} [options.nowIso] ISO timestamp provider.
 * @returns {Promise<void>}
 */
export async function runHandleUserUpdateFlow(
    ref,
    props,
    { now = Date.now, nowIso = () => new Date().toJSON() } = {}
) {
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const worldStore = useWorldStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const feedStore = useFeedStore();
    const notificationStore = useNotificationStore();
    const sharedFeedStore = useSharedFeedStore();
    const generalSettingsStore = useGeneralSettingsStore();

    const { state, userDialog, applyUserDialogLocation, checkNote } = userStore;

    let feed;
    let newLocation;
    let previousLocation;
    const friend = friendStore.friends.get(ref.id);
    if (typeof friend === 'undefined') {
        return;
    }
    if (props.location) {
        // update instancePlayerCount
        previousLocation = props.location[1];
        newLocation = props.location[0];
        let oldCount = state.instancePlayerCount.get(previousLocation);
        if (typeof oldCount !== 'undefined') {
            oldCount--;
            if (oldCount <= 0) {
                state.instancePlayerCount.delete(previousLocation);
            } else {
                state.instancePlayerCount.set(previousLocation, oldCount);
            }
        }
        let newCount = state.instancePlayerCount.get(newLocation);
        if (typeof newCount === 'undefined') {
            newCount = 0;
        }
        newCount++;
        state.instancePlayerCount.set(newLocation, newCount);

        const previousLocationL = parseLocation(previousLocation);
        const newLocationL = parseLocation(newLocation);
        if (
            previousLocationL.tag === userDialog.$location.tag ||
            newLocationL.tag === userDialog.$location.tag
        ) {
            // update user dialog instance occupants
            applyUserDialogLocation(true);
        }
        if (
            previousLocationL.worldId === worldStore.worldDialog.id ||
            newLocationL.worldId === worldStore.worldDialog.id
        ) {
            instanceStore.applyWorldDialogInstances();
        }
        if (
            previousLocationL.groupId === groupStore.groupDialog.id ||
            newLocationL.groupId === groupStore.groupDialog.id
        ) {
            instanceStore.applyGroupDialogInstances();
        }
    }
    if (
        !props.state &&
        props.location &&
        props.location[0] !== 'offline' &&
        props.location[0] !== '' &&
        props.location[1] !== 'offline' &&
        props.location[1] !== '' &&
        props.location[0] !== 'traveling'
    ) {
        // skip GPS if user is offline or traveling
        previousLocation = props.location[1];
        newLocation = props.location[0];
        let time = props.location[2];
        if (previousLocation === 'traveling' && ref.$previousLocation) {
            previousLocation = ref.$previousLocation;
            const travelTime = now() - ref.$travelingToTime;
            time -= travelTime;
            if (time < 0) {
                time = 0;
            }
        }
        if (AppDebug.debugFriendState && previousLocation) {
            console.log(
                `${ref.displayName} GPS ${previousLocation} -> ${newLocation}`
            );
        }
        if (previousLocation === 'offline') {
            previousLocation = '';
        }
        if (!previousLocation) {
            // no previous location
            if (AppDebug.debugFriendState) {
                console.log(
                    ref.displayName,
                    'Ignoring GPS, no previous location',
                    newLocation
                );
            }
        } else if (ref.$previousLocation === newLocation) {
            // location traveled to is the same
            ref.$location_at = now() - time;
        } else {
            const worldName = await getWorldName(newLocation);
            const groupName = await getGroupName(newLocation);
            feed = {
                created_at: nowIso(),
                type: 'GPS',
                userId: ref.id,
                displayName: ref.displayName,
                location: newLocation,
                worldName,
                groupName,
                previousLocation,
                time
            };
            notificationStore.queueFeedNoty(feed);
            sharedFeedStore.addEntry(feed);
            feedStore.addFeedEntry(feed);
            database.addGPSToDatabase(feed);
            // clear previousLocation after GPS
            ref.$previousLocation = '';
            ref.$travelingToTime = now();
        }
    }
    if (
        props.location &&
        props.location[0] === 'traveling' &&
        props.location[1] !== 'traveling'
    ) {
        // store previous location when user is traveling
        ref.$previousLocation = props.location[1];
        ref.$travelingToTime = now();
    }
    let imageMatches = false;
    if (
        props.currentAvatarThumbnailImageUrl &&
        props.currentAvatarThumbnailImageUrl[0] &&
        props.currentAvatarThumbnailImageUrl[1] &&
        props.currentAvatarThumbnailImageUrl[0] ===
            props.currentAvatarThumbnailImageUrl[1]
    ) {
        imageMatches = true;
    }
    if (
        (((props.currentAvatarImageUrl ||
            props.currentAvatarThumbnailImageUrl) &&
            !ref.profilePicOverride) ||
            props.currentAvatarTags) &&
        !imageMatches
    ) {
        let currentAvatarImageUrl = '';
        let previousCurrentAvatarImageUrl = '';
        let currentAvatarThumbnailImageUrl = '';
        let previousCurrentAvatarThumbnailImageUrl = '';
        let currentAvatarTags = '';
        let previousCurrentAvatarTags = '';
        if (props.currentAvatarImageUrl) {
            currentAvatarImageUrl = props.currentAvatarImageUrl[0];
            previousCurrentAvatarImageUrl = props.currentAvatarImageUrl[1];
        } else {
            currentAvatarImageUrl = ref.currentAvatarImageUrl;
            previousCurrentAvatarImageUrl = ref.currentAvatarImageUrl;
        }
        if (props.currentAvatarThumbnailImageUrl) {
            currentAvatarThumbnailImageUrl =
                props.currentAvatarThumbnailImageUrl[0];
            previousCurrentAvatarThumbnailImageUrl =
                props.currentAvatarThumbnailImageUrl[1];
        } else {
            currentAvatarThumbnailImageUrl = ref.currentAvatarThumbnailImageUrl;
            previousCurrentAvatarThumbnailImageUrl =
                ref.currentAvatarThumbnailImageUrl;
        }
        if (props.currentAvatarTags) {
            currentAvatarTags = props.currentAvatarTags[0];
            previousCurrentAvatarTags = props.currentAvatarTags[1];
            if (
                ref.profilePicOverride &&
                !props.currentAvatarThumbnailImageUrl
            ) {
                // forget last seen avatar
                ref.currentAvatarImageUrl = '';
                ref.currentAvatarThumbnailImageUrl = '';
            }
        } else {
            currentAvatarTags = ref.currentAvatarTags;
            previousCurrentAvatarTags = ref.currentAvatarTags;
        }
        if (generalSettingsStore.logEmptyAvatars || ref.currentAvatarImageUrl) {
            let avatarInfo = {
                ownerId: '',
                avatarName: ''
            };
            try {
                avatarInfo = await getAvatarName(currentAvatarImageUrl);
            } catch (err) {
                console.log(err);
            }
            let previousAvatarInfo = {
                ownerId: '',
                avatarName: ''
            };
            try {
                previousAvatarInfo = await getAvatarName(
                    previousCurrentAvatarImageUrl
                );
            } catch (err) {
                console.log(err);
            }
            feed = {
                created_at: nowIso(),
                type: 'Avatar',
                userId: ref.id,
                displayName: ref.displayName,
                ownerId: avatarInfo.ownerId,
                previousOwnerId: previousAvatarInfo.ownerId,
                avatarName: avatarInfo.avatarName,
                previousAvatarName: previousAvatarInfo.avatarName,
                currentAvatarImageUrl,
                currentAvatarThumbnailImageUrl,
                previousCurrentAvatarImageUrl,
                previousCurrentAvatarThumbnailImageUrl,
                currentAvatarTags,
                previousCurrentAvatarTags
            };
            notificationStore.queueFeedNoty(feed);
            sharedFeedStore.addEntry(feed);
            feedStore.addFeedEntry(feed);
            database.addAvatarToDatabase(feed);
        }
    }
    // if status is offline, ignore status and statusDescription
    if (
        (props.status &&
            props.status[0] !== 'offline' &&
            props.status[1] !== 'offline') ||
        (!props.status && props.statusDescription)
    ) {
        let status = '';
        let previousStatus = '';
        let statusDescription = '';
        let previousStatusDescription = '';
        if (props.status) {
            if (props.status[0]) {
                status = props.status[0];
            }
            if (props.status[1]) {
                previousStatus = props.status[1];
            }
        } else if (ref.status) {
            status = ref.status;
            previousStatus = ref.status;
        }
        if (props.statusDescription) {
            if (props.statusDescription[0]) {
                statusDescription = props.statusDescription[0];
            }
            if (props.statusDescription[1]) {
                previousStatusDescription = props.statusDescription[1];
            }
        } else if (ref.statusDescription) {
            statusDescription = ref.statusDescription;
            previousStatusDescription = ref.statusDescription;
        }
        feed = {
            created_at: nowIso(),
            type: 'Status',
            userId: ref.id,
            displayName: ref.displayName,
            status,
            statusDescription,
            previousStatus,
            previousStatusDescription
        };
        notificationStore.queueFeedNoty(feed);
        sharedFeedStore.addEntry(feed);
        feedStore.addFeedEntry(feed);
        database.addStatusToDatabase(feed);
    }
    if (props.bio && props.bio[0] && props.bio[1]) {
        let bio = '';
        let previousBio = '';
        if (props.bio[0]) {
            bio = props.bio[0];
        }
        if (props.bio[1]) {
            previousBio = props.bio[1];
        }
        feed = {
            created_at: nowIso(),
            type: 'Bio',
            userId: ref.id,
            displayName: ref.displayName,
            bio,
            previousBio
        };
        notificationStore.queueFeedNoty(feed);
        sharedFeedStore.addEntry(feed);
        feedStore.addFeedEntry(feed);
        database.addBioToDatabase(feed);
    }
    if (
        props.note &&
        props.note[0] !== null &&
        props.note[0] !== props.note[1]
    ) {
        checkNote(ref.id, props.note[0]);
    }
}
