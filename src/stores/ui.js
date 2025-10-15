import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { useNotificationStore } from './notification';
import { watchState } from '../service/watchState';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();

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

    const menuActiveIndex = ref('feed');
    const notifiedMenus = ref([]);
    const shiftHeld = ref(false);

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                menuActiveIndex.value = 'feed';
            }
        },
        { flush: 'sync' }
    );

    function notifyMenu(index) {
        if (
            index !== menuActiveIndex.value &&
            !notifiedMenus.value.includes(index)
        ) {
            notifiedMenus.value.push(index);
        }
    }

    function selectMenu(index) {
        menuActiveIndex.value = index;
        removeNotify(index);
        if (index === 'notification') {
            notificationStore.unseenNotifications = [];
        }
    }

    function removeNotify(index) {
        notifiedMenus.value = notifiedMenus.value.filter((i) => i !== index);
    }

    return {
        menuActiveIndex,
        notifiedMenus,
        shiftHeld,

        notifyMenu,
        selectMenu,
        removeNotify
    };
});
