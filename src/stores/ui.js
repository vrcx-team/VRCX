import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useMagicKeys } from '@vueuse/core';
import { useRouter } from 'vue-router';

import { AppDebug } from '../service/appConfig';
import { refreshCustomCss } from '../shared/utils/base/ui';
import { updateLocalizedStrings } from '../plugin/i18n';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAvatarStore } from './avatar';
import { useGroupStore } from './group';
import { useInstanceStore } from './instance';
import { useNotificationStore } from './notification';
import { useSearchStore } from './search';
import { useUserStore } from './user';
import { useWorldStore } from './world';

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
    const dialogCrumbs = ref([]);

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
            toast.success('Custom CSS and localization strings refreshed');
        }
    });

    function pushDialogCrumb(type, id, label = '') {
        if (!type || !id) {
            return;
        }
        const items = dialogCrumbs.value;
        const last = items[items.length - 1];
        if (last && last.type === type && last.id === id) {
            if (label && last.label !== label) {
                last.label = label;
            }
            return;
        }
        const existingIndex = items.findIndex(
            (item) => item.type === type && item.id === id
        );
        if (existingIndex !== -1) {
            items.splice(existingIndex + 1);
            if (label) {
                items[existingIndex].label = label;
            }
            return;
        }
        items.push({ type, id, label: label || id });
    }

    function setDialogCrumbLabel(type, id, label) {
        if (!type || !id || !label) {
            return;
        }
        const item = dialogCrumbs.value.find(
            (entry) => entry.type === type && entry.id === id
        );
        if (item) {
            item.label = label;
        }
    }

    function jumpDialogCrumb(index) {
        if (index < 0 || index >= dialogCrumbs.value.length) {
            return;
        }
        dialogCrumbs.value.splice(index + 1);
    }

    function clearDialogCrumbs() {
        dialogCrumbs.value = [];
    }

    function openDialog({ type, id, label = '', skipBreadcrumb = false }) {
        const userStore = useUserStore();
        const worldStore = useWorldStore();
        const avatarStore = useAvatarStore();
        const groupStore = useGroupStore();
        const instanceStore = useInstanceStore();
        const isPrevInfo = type === 'previous-instances-info';
        const isPrevList =
            type &&
            type.startsWith('previous-instances-') &&
            type !== 'previous-instances-info';
        const hadActiveDialog =
            dialogCrumbs.value.length > 0 ||
            userStore.userDialog.visible ||
            worldStore.worldDialog.visible ||
            avatarStore.avatarDialog.visible ||
            groupStore.groupDialog.visible ||
            (instanceStore.previousInstancesInfoDialog.visible &&
                !isPrevInfo) ||
            (instanceStore.previousInstancesListDialog.visible && !isPrevList);

        if (type !== 'user') {
            userStore.userDialog.visible = false;
        }
        if (type !== 'world') {
            worldStore.worldDialog.visible = false;
        }
        if (type !== 'avatar') {
            avatarStore.avatarDialog.visible = false;
        }
        if (type !== 'group') {
            groupStore.groupDialog.visible = false;
        }
        if (!isPrevInfo) {
            instanceStore.previousInstancesInfoDialog.visible = false;
        }
        if (!isPrevList) {
            instanceStore.previousInstancesListDialog.visible = false;
        }
        if (!hadActiveDialog) {
            clearDialogCrumbs();
        }
        if (!skipBreadcrumb) {
            pushDialogCrumb(type, id, label);
        }
    }

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
        dialogCrumbs,

        notifyMenu,
        removeNotify,
        showConsole,
        updateTrayIconNotify,
        pushDialogCrumb,
        setDialogCrumbLabel,
        jumpDialogCrumb,
        clearDialogCrumbs,
        openDialog
    };
});
