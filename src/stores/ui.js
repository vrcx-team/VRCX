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
                removeNotify(routeName);
                if (routeName === 'notification') {
                    notificationStore.unseenNotifications = [];
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
            notifiedMenus.value.includes('friendLog');

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

        notifyMenu,
        removeNotify
    };
});
