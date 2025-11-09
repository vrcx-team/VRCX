import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

import { useNotificationStore } from './notification';
import { watchState } from '../service/watchState';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();
    const router = useRouter();

    document.addEventListener('keydown', function (e) {
        if (e.shiftKey) {
            shiftHeld.value = true;
        }
    });

    document.addEventListener('keyup', function (e) {
        if (!e.shiftKey) {
            shiftHeld.value = false;
        }
    });

    const notifiedMenus = ref([]);
    const shiftHeld = ref(false);
    const trayIconNotify = ref(false);
    const socialRouteNames = ['friend-log', 'friend-list', 'moderation'];
    const favoriteRouteNames = [
        'favorite-friends',
        'favorite-worlds',
        'favorite-avatars'
    ];
    const lastVisitedSocialRoute = ref(socialRouteNames[0]);
    const lastVisitedFavoritesRoute = ref(favoriteRouteNames[0]);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                router.push({ name: 'feed' });
            }
        },
        { flush: 'sync' }
    );

    function notifyMenu(index) {
        const currentRouteName = router.currentRoute.value?.name;
        if (
            index !== currentRouteName &&
            !notifiedMenus.value.includes(index)
        ) {
            notifiedMenus.value.push(index);
            updateTrayIconNotify();
        }
    }

    watch(
        () => router.currentRoute.value.name,
        (routeName) => {
            if (routeName) {
                const name = String(routeName);
                removeNotify(name);
                if (name === 'notification') {
                    notificationStore.unseenNotifications = [];
                }
                if (socialRouteNames.includes(name)) {
                    lastVisitedSocialRoute.value = name;
                } else if (favoriteRouteNames.includes(name)) {
                    lastVisitedFavoritesRoute.value = name;
                }
            }
        }
    );

    function removeNotify(index) {
        notifiedMenus.value = notifiedMenus.value.filter((i) => i !== index);
        updateTrayIconNotify();
    }

    function updateTrayIconNotify(force = false) {
        const newState =
            notifiedMenus.value.includes('notification') ||
            notifiedMenus.value.includes('friend-log');

        if (trayIconNotify.value !== newState || force) {
            trayIconNotify.value = newState;
            if (LINUX) {
                window.electron.setTrayIconNotification(trayIconNotify.value);
                return;
            }
            AppApi.SetTrayIconNotification(trayIconNotify.value);
        }
    }
    updateTrayIconNotify(true);

    return {
        notifiedMenus,
        shiftHeld,
        lastVisitedSocialRoute,
        lastVisitedFavoritesRoute,

        notifyMenu,
        removeNotify
    };
});
