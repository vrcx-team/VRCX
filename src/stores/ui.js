import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useMagicKeys } from '@vueuse/core';
import { useRouter } from 'vue-router';

import { AppDebug } from '../services/appConfig';
import { refreshCustomCss } from '../shared/utils/base/ui';
import { updateLocalizedStrings } from '../plugins/i18n';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useAvatarStore } from './avatar';
import { useGroupStore } from './group';
import { showGroupDialog } from '../coordinators/groupCoordinator';
import { showWorldDialog } from '../coordinators/worldCoordinator';
import { showAvatarDialog } from '../coordinators/avatarCoordinator';
import { showUserDialog } from '../coordinators/userCoordinator';
import { useInstanceStore } from './instance';
import { useNotificationStore } from './notification';
import { useNotificationsSettingsStore } from './settings/notifications';
import { useSearchStore } from './search';
import { useUserStore } from './user';
import { useWorldStore } from './world';

export const useUiStore = defineStore('Ui', () => {
    const notificationStore = useNotificationStore();
    const instanceStore = useInstanceStore();
    const router = useRouter();
    const keys = useMagicKeys();
    const { directAccessPaste } = useSearchStore();
    const appearanceSettings = useAppearanceSettingsStore();

    const ctrlR = keys['Ctrl+R'];
    const ctrlD = keys['Ctrl+D'];
    const metaD = keys['Meta+D'];
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

    watch(metaD, (isPressed) => {
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

    function pushDialogCrumb(data) {
        const { type, id, label } = data;
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
        if (!data.label) {
            data.label = data.id;
        }
        items.push(data);
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

    function jumpBackDialogCrumb() {
        if (dialogCrumbs.value.length > 0) {
            dialogCrumbs.value.pop();
        }
        if (dialogCrumbs.value.length === 0) {
            closeMainDialog();
            return;
        }
        handleBreadcrumbClick(dialogCrumbs.value.length - 1);
    }

    function handleBreadcrumbClick(index) {
        const item = dialogCrumbs.value[index];
        if (!item) {
            return;
        }
        jumpDialogCrumb(index);
        if (item.type === 'user') {
            showUserDialog(item.id);
            return;
        }
        if (item.type === 'world') {
            showWorldDialog(item.tag, item.shortName);
            return;
        }
        if (item.type === 'avatar') {
            showAvatarDialog(item.id);
            return;
        }
        if (item.type === 'group') {
            showGroupDialog(item.id);
            return;
        }
        if (item.type === 'previous-instances-user') {
            instanceStore.showPreviousInstancesListDialog('user', item.id);
            return;
        }
        if (item.type === 'previous-instances-world') {
            instanceStore.showPreviousInstancesListDialog('world', item.id);
            return;
        }
        if (item.type === 'previous-instances-group') {
            instanceStore.showPreviousInstancesListDialog('group', item.id);
            return;
        }
        if (item.type === 'previous-instances-info') {
            instanceStore.showPreviousInstancesInfoDialog(item.id);
            return;
        }
        console.error(
            `Unknown dialog crumb type: ${item.type}, closing dialog`
        );
        closeMainDialog();
    }

    function clearDialogCrumbs() {
        dialogCrumbs.value = [];
    }

    function closeMainDialog() {
        const userStore = useUserStore();
        const worldStore = useWorldStore();
        const avatarStore = useAvatarStore();
        const groupStore = useGroupStore();
        const instanceStore = useInstanceStore();

        userStore.setUserDialogVisible(false);
        worldStore.setWorldDialogVisible(false);
        avatarStore.setAvatarDialogVisible(false);
        groupStore.setGroupDialogVisible(false);
        instanceStore.hidePreviousInstancesDialogs();
        clearDialogCrumbs();
    }

    /**
     * @param {object} data
     * @param {string} data.type
     * @param {string} data.id
     * @param {string?} data.tag
     * @param {string?} data.shortName
     * @returns {boolean}
     */
    function openDialog(data) {
        const { type } = data;
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
            userStore.setUserDialogVisible(false);
        }
        if (type !== 'world') {
            worldStore.setWorldDialogVisible(false);
        }
        if (type !== 'avatar') {
            avatarStore.setAvatarDialogVisible(false);
        }
        if (type !== 'group') {
            groupStore.setGroupDialogVisible(false);
        }
        if (!isPrevInfo) {
            instanceStore.setPreviousInstancesInfoDialogVisible(false);
        }
        if (!isPrevList) {
            instanceStore.setPreviousInstancesListDialogVisible(false);
        }
        if (!hadActiveDialog) {
            clearDialogCrumbs();
        }
        pushDialogCrumb(data);
        return hadActiveDialog;
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
                    const notificationsSettingsStore =
                        useNotificationsSettingsStore();
                    if (
                        notificationsSettingsStore.notificationLayout ===
                        'notification-center'
                    ) {
                        if (router.currentRoute.value.query?.fromCenter) {
                            router.replace({ name: 'notification' });
                        } else {
                            router.replace({ name: 'feed' });
                        }
                        return;
                    }
                    notificationStore.clearUnseenNotifications();
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

    function clearAllNotifications() {
        notifiedMenus.value = [];
        updateTrayIconNotify();
    }

    function updateTrayIconNotify(force = false) {
        const notificationsSettingsStore = useNotificationsSettingsStore();
        let newState;
        if (
            notificationsSettingsStore.notificationLayout ===
            'notification-center'
        ) {
            newState =
                appearanceSettings.notificationIconDot &&
                (notificationStore.hasUnseenNotifications ||
                    notifiedMenus.value.includes('friend-log'));
        } else {
            newState =
                appearanceSettings.notificationIconDot &&
                (notifiedMenus.value.includes('notification') ||
                    notifiedMenus.value.includes('friend-log'));
        }

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
        clearAllNotifications,
        showConsole,
        updateTrayIconNotify,
        pushDialogCrumb,
        setDialogCrumbLabel,
        jumpDialogCrumb,
        clearDialogCrumbs,
        closeMainDialog,
        openDialog,
        jumpBackDialogCrumb,
        handleBreadcrumbClick
    };
});
