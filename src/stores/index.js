import { createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { useAvatarStore } from './avatar';
import { useAvatarProviderStore } from './avatarProvider';
import { useFavoriteStore } from './favorite';
import { useFeedStore } from './feed';
import { useFriendStore } from './friend';
import { useGalleryStore } from './gallery';
import { useGameStore } from './game';
import { useGameLogStore } from './gameLog';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useInviteStore } from './invite';
import { useLaunchStore } from './launch';
import { useLocationStore } from './location';
import { useModerationStore } from './moderation';
import { useNotificationStore } from './notification';
import { usePhotonStore } from './photon';
import { useSearchStore } from './search';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useDiscordPresenceSettingsStore } from './settings/discordPresence';
import { useGeneralSettingsStore } from './settings/general';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useWristOverlaySettingsStore } from './settings/wristOverlay';
import { useSharedFeedStore } from './sharedFeed';
import { useUiStore } from './ui';
import { useUpdateLoopStore } from './updateLoop';
import { useUserStore } from './user';
import { useVrStore } from './vr';
import { useVrcxStore } from './vrcx';
import { useVRCXUpdaterStore } from './vrcxUpdater';
import { useWorldStore } from './world';
import { useVrcStatusStore } from './vrcStatus';

import { createSentryPiniaPlugin } from '@sentry/vue';

export const pinia = createPinia();
pinia.use(createSentryPiniaPlugin());

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
