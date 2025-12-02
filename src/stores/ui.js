import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { useMagicKeys } from '@vueuse/core';
import { useRouter } from 'vue-router';

import { AppDebug } from '../service/appConfig';
import { refreshCustomCss } from '../shared/utils/base/ui';
import { updateLocalizedStrings } from '../plugin/i18n';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useNotificationStore } from './notification';
import { useSearchStore } from './search';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();
    const router = useRouter();
    const keys = useMagicKeys();
    const { directAccessPaste } = useSearchStore();
    const appearanceSettings = useAppearanceSettingsStore();

    const ctrlR = keys['Ctrl+R'];
    const ctrlD = keys['Ctrl+D'];
    const shift = keys['Shift'];
    const ctrlShiftI = keys['Ctrl+Shift+I'];
    const altShiftR = keys['Alt+Shift+R'];

    const notifiedMenus = ref([]);
    const shiftHeld = ref(false);
    const trayIconNotify = ref(false);

    watch(ctrlR, (isPressed) => {
        if (isPressed) {
            location.reload();
        }
    });

    watch(ctrlD, (isPressed) => {
        if (isPressed) {
            directAccessPaste();
        }
    });

    watch(shift, (isHeld) => {
        shiftHeld.value = isHeld;
    });

    watch(ctrlShiftI, (isPressed) => {
        if (isPressed) {
            showConsole();
        }
    });

    watch(altShiftR, (isPressed) => {
        if (isPressed) {
            refreshCustomCss();
            updateLocalizedStrings();
            ElMessage({
                message: 'Custom CSS and localization strings refreshed',
                type: 'success'
            });
        }
    });

    // Make sure file drops outside of the screenshot manager don't navigate to the file path dropped.
    // This issue persists on prompts created with prompt(), unfortunately. Not sure how to fix that.
    document.body.addEventListener('drop', function (e) {
        e.preventDefault();
    });

    function showConsole() {
        AppApi.ShowDevTools();
        if (
            AppDebug.debug ||
            AppDebug.debugWebRequests ||
            AppDebug.debugWebSocket ||
            AppDebug.debugUserDiff
        ) {
            return;
        }
        console.log(
            '%cCareful! This might not do what you think.',
            'background-color: red; color: yellow; font-size: 32px; font-weight: bold'
        );
        console.log(
            '%cIf someone told you to copy-paste something here, it can give them access to your account.',
            'font-size: 20px;'
        );
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
            }
        }
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

    function removeNotify(index) {
        notifiedMenus.value = notifiedMenus.value.filter((i) => i !== index);
        updateTrayIconNotify();
    }

    function updateTrayIconNotify(force = false) {
        const newState =
            appearanceSettings.notificationIconDot &&
            (notifiedMenus.value.includes('notification') ||
                notifiedMenus.value.includes('friend-log'));

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
        removeNotify,
        showConsole,
        updateTrayIconNotify
    };
});
