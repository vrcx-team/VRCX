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
    }

    return {
        notifiedMenus,
        shiftHeld,

        notifyMenu,
        removeNotify
    };
});
