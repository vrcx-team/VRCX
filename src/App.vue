<script>
    import Vue, { onMounted } from 'vue';
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

    export default {
        template,
        components: {
            LoginPage,
            NavMenu,
            Sidebar,
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
        setup() {
            const store = createGlobalStores();
            Vue.prototype.store = store;
            Vue.prototype.utils = utils;

            store.updateLoop.updateLoop();
            AppApi.CheckGameRunning();

            onMounted(async () => {
                store.gameLog.getGameLogTable();
                await store.auth.migrateStoredUsers();
                store.auth.autoLoginAfterMounted();
                store.vrcx.checkAutoBackupRestoreVrcRegistry();
                store.game.checkVRChatDebugLogging();
                try {
                    if (await AppApi.IsRunningUnderWine()) {
                        store.vrcx.isRunningUnderWine = true;
                        store.vrcx.applyWineEmojis();
                    }
                } catch (err) {
                    console.error(err, 'Failed to check if running under Wine');
                }
            });

            return {
                store
            };
        }
    };
</script>
