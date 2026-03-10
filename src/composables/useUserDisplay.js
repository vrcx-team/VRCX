import { useAppearanceSettingsStore, useUserStore } from '../stores';
import {
    userImage as userImagePure,
    userImageFull as userImageFullPure,
    userStatusClass as userStatusClassPure
} from '../shared/utils/user';

/**
 * Composable that provides store-aware user display functions.
 * Delegates to the pure utility functions after resolving store data.
 */
export function useUserDisplay() {
    const userStore = useUserStore();
    const appearanceStore = useAppearanceSettingsStore();

    function userStatusClass(user, pendingOffline = false) {
        return userStatusClassPure(user, pendingOffline, userStore.currentUser);
    }

    function userImage(
        user,
        isIcon = false,
        resolution = '128',
        isUserDialogIcon = false
    ) {
        return userImagePure(
            user,
            isIcon,
            resolution,
            isUserDialogIcon,
            appearanceStore.displayVRCPlusIconsAsAvatar
        );
    }

    function userImageFull(user) {
        return userImageFullPure(
            user,
            appearanceStore.displayVRCPlusIconsAsAvatar
        );
    }

    return { userStatusClass, userImage, userImageFull };
}
