import { createPinia } from 'pinia';
import { createSentryPiniaPlugin } from '@sentry/vue';

import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAuthStore } from './auth';
import { useAvatarProviderStore } from './avatarProvider';
import { useAvatarStore } from './avatar';
import { useDiscordPresenceSettingsStore } from './settings/discordPresence';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useFriendStore } from './friend';
import { useGalleryStore } from './gallery';
import { useGameLogStore } from './gameLog';
import { useGameStore } from './game';
import { useGeneralSettingsStore } from './settings/general';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useInviteStore } from './invite';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { useNotificationsSettingsStore } from './settings/notifications';
import { usePhotonStore } from './photon';
import { useSearchStore } from './search';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVRCXUpdaterStore } from './vrcxUpdater';
import { useVrStore } from './vr';
import { useVrcStatusStore } from './vrcStatus';
import { useVrcxStore } from './vrcx';
import { useWorldStore } from './world';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';

export const pinia = createPinia();

pinia.use(
    createSentryPiniaPlugin({
        stateTransformer: (state) => ({
            ...state,
            Auth: null,
            Feed: null,
            Favorite: null,
            Friend: null,
            User: {
                // @ts-ignore
                ...state.User,
                currentUser: null,
                subsetOfLanguages: null,
                languageDialog: {
                    // @ts-ignore
                    ...state.User.languageDialog,
                    languages: null
                }
            },
            GameLog: {
                // @ts-ignore
                ...state.GameLog,
                gameLogTable: null
            },
            Notification: {
                // @ts-ignore
                ...state.Notification,
                notificationTable: null
            },
            Moderation: {
                // @ts-ignore
                ...state.Moderation,
                playerModerationTable: null
            },
            Photon: null,
            SharedFeed: {
                // @ts-ignore
                ...state.SharedFeed,
                sharedFeed: null
            },
            Group: {
                // @ts-ignore
                ...state.Group,
                groupInstances: null,
                inGameGroupOrder: null
            },
            Avatar: {
                // @ts-ignore
                ...state.Avatar,
                avatarHistory: null
            }
        })
    })
);

export function createGlobalStores() {
    return {
        advancedSettings: useAdvancedSettingsStore(),
        appearanceSettings: useAppearanceSettingsStore(),
        discordPresenceSettings: useDiscordPresenceSettingsStore(),
        generalSettings: useGeneralSettingsStore(),
        notificationsSettings: useNotificationsSettingsStore(),
        wristOverlaySettings: useWristOverlaySettingsStore(),
        avatarProvider: useAvatarProviderStore(),
        favorite: useFavoriteStore(),
        friend: useFriendStore(),
        photon: usePhotonStore(),
        user: useUserStore(),
        vrcxUpdater: useVRCXUpdaterStore(),
        avatar: useAvatarStore(),
        world: useWorldStore(),
        group: useGroupStore(),
        location: useLocationStore(),
        instance: useInstanceStore(),
        moderation: useModerationStore(),
        invite: useInviteStore(),
        gallery: useGalleryStore(),
        notification: useNotificationStore(),
        feed: useFeedStore(),
        ui: useUiStore(),
        gameLog: useGameLogStore(),
        search: useSearchStore(),
        game: useGameStore(),
        launch: useLaunchStore(),
        vr: useVrStore(),
        vrcx: useVrcxStore(),
        sharedFeed: useSharedFeedStore(),
        updateLoop: useUpdateLoopStore(),
        auth: useAuthStore(),
        vrcStatus: useVrcStatusStore()
    };
}

export {
    useAuthStore,
    useAvatarStore,
    useAvatarProviderStore,
    useFavoriteStore,
    useFeedStore,
    useFriendStore,
    useGalleryStore,
    useGameStore,
    useGameLogStore,
    useGroupStore,
    useInstanceStore,
    useInviteStore,
    useLaunchStore,
    useLocationStore,
    useModerationStore,
    useNotificationStore,
    usePhotonStore,
    useSearchStore,
    useAdvancedSettingsStore,
    useAppearanceSettingsStore,
    useDiscordPresenceSettingsStore,
    useGeneralSettingsStore,
    useNotificationsSettingsStore,
    useWristOverlaySettingsStore,
    useUiStore,
    useUserStore,
    useVrStore,
    useVrcxStore,
    useVRCXUpdaterStore,
    useWorldStore,
    useSharedFeedStore,
    useUpdateLoopStore,
    useVrcStatusStore
};
