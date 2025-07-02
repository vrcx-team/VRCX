<script>
    import Vue from 'vue';
    import template from './app.pug';
    import { createGlobalStores } from './stores';

    import LoginPage from './views/Login/Login.vue';
    import NavMenu from './components/NavMenu.vue';
    import Sidebar from './views/Sidebar/Sidebar.vue';
    import FeedTab from './views/Feed/Feed.vue';
    import GameLogTab from './views/GameLog/GameLog.vue';
    import PlayerListTab from './views/PlayerList/PlayerList.vue';
    import SearchTab from './views/Search/Search.vue';
    import FavoritesTab from './views/Favorites/Favorites.vue';
    import FriendLogTab from './views/FriendLog/FriendLog.vue';
    import ModerationTab from './views/Moderation/Moderation.vue';
    import NotificationTab from './views/Notifications/Notification.vue';
    import FriendListTab from './views/FriendList/FriendList.vue';
    import ChartsTab from './views/Charts/Charts.vue';
    import ProfileTab from './views/Profile/Profile.vue';
    import SettingsTab from './views/Settings/Settings.vue';

    import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
    import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
    import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
    import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
    import GalleryDialog from './components/dialogs/GalleryDialog.vue';
    import FullscreenImageDialog from './components/dialogs/FullscreenImageDialog.vue';
    import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
    import LaunchDialog from './components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from './views/Settings/dialogs/LaunchOptionsDialog.vue';
    import FriendImportDialog from './views/Favorites/dialogs/FriendImportDialog.vue';
    import WorldImportDialog from './views/Favorites/dialogs/WorldImportDialog.vue';
    import AvatarImportDialog from './views/Favorites/dialogs/AvatarImportDialog.vue';
    import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
    import EditInviteMessageDialog from './views/Profile/dialogs/EditInviteMessageDialog.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';
    import VRChatConfigDialog from './views/Settings/dialogs/VRChatConfigDialog.vue';
    import PrimaryPasswordDialog from './views/Settings/dialogs/PrimaryPasswordDialog.vue';

    import { utils } from './shared/utils/_utils';
    import { refreshCustomCss, refreshCustomScript } from './shared/utils';
    import configRepository from './service/config.js';
    await configRepository.init();
    const initThemeMode = await configRepository.getString('VRCX_ThemeMode', 'system');

    export default {
        template,
        setup() {
            const store = createGlobalStores();
            store.appearanceSettings.saveThemeMode(initThemeMode);
            Vue.prototype.store = store;
            Vue.prototype.utils = utils;
        },
        components: {
            LoginPage,
            NavMenu,
            FeedTab,
            GameLogTab,
            PlayerListTab,
            SearchTab,
            FavoritesTab,
            FriendLogTab,
            ModerationTab,
            NotificationTab,
            FriendListTab,
            ChartsTab,
            ProfileTab,
            SettingsTab,
            Sidebar,

            UserDialog,
            WorldDialog,
            AvatarDialog,
            GroupDialog,
            GalleryDialog,
            FullscreenImageDialog,
            PreviousInstancesInfoDialog,
            LaunchDialog,
            LaunchOptionsDialog,
            FriendImportDialog,
            WorldImportDialog,
            AvatarImportDialog,
            ChooseFavoriteGroupDialog,
            EditInviteMessageDialog,
            VRCXUpdateDialog,
            VRChatConfigDialog,
            PrimaryPasswordDialog
        },
        methods: {
            /**
             * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop zone in the app window.
             * @param {string} filePath - The full path to the file being dragged into the window
             */
            dragEnterCef(filePath) {
                this.store.vrcx.currentlyDroppingFile = filePath;
            }
        },
        created() {
            this.store.updateLoop.updateLoop();
            AppApi.SetUserAgent();
            AppApi.CheckGameRunning();
            refreshCustomCss();
            refreshCustomScript();
        },
        async mounted() {
            this.store.gameLog.getGameLogTable();
            await this.store.auth.migrateStoredUsers();
            this.store.auth.autoLoginAfterMounted();
            this.store.vrcx.checkAutoBackupRestoreVrcRegistry();
            this.store.game.checkVRChatDebugLogging();
            if (await AppApi.IsRunningUnderWine()) {
                try {
                    this.store.vrcx.isRunningUnderWine = true;
                    this.store.vrcx.applyWineEmojis();
                } catch (err) {
                    console.error(err, 'Failed to check if running under Wine');
                }
            }
        }
    };
</script>
