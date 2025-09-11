import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { watchState } from '../service/watchState';
import { useNotificationStore } from './notification';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();
    const state = reactive({
        menuActiveIndex: 'feed',
        notifiedMenus: [],
        shiftHeld: false
    });

    document.addEventListener('keydown', function (e) {
        if (e.shiftKey) {
            state.shiftHeld = true;
        }
    });

    document.addEventListener('keyup', function (e) {
        if (!e.shiftKey) {
            state.shiftHeld = false;
        }
    });

    const shiftHeld = computed(() => state.shiftHeld);

    const menuActiveIndex = computed({
        get: () => state.menuActiveIndex,
        set: (value) => {
            state.menuActiveIndex = value;
        }
    });

    const notifiedMenus = computed({
        get: () => state.notifiedMenus,
        set: (value) => {
            state.notifiedMenus = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                state.menuActiveIndex = 'feed';
            }
        },
        { flush: 'sync' }
    );

    function notifyMenu(index) {
        if (
            index !== state.menuActiveIndex &&
            !state.notifiedMenus.includes(index)
        ) {
            state.notifiedMenus.push(index);
        }
    }

    function selectMenu(index) {
        state.menuActiveIndex = index;
        removeNotify(index);
        if (index === 'notification') {
            notificationStore.unseenNotifications = [];
        }
    }

    function removeNotify(index) {
        state.notifiedMenus = state.notifiedMenus.filter((i) => i !== index);
    }

    return {
        state,

        menuActiveIndex,
        notifiedMenus,
        shiftHeld,

        notifyMenu,
        selectMenu,
        removeNotify
    };
});
