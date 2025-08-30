<template>
    <!DOCTYPE html>
    <el-config-provider :locale="currentLocale">
        <div
            id="x-app"
            class="x-app"
            ondragenter="event.preventDefault()"
            ondragover="event.preventDefault()"
            ondrop="event.preventDefault()">
            <!-- ### Login ### -->
            <Login v-if="!watchState.isLoggedIn"></Login>

            <VRCXUpdateDialog></VRCXUpdateDialog>

            <template v-if="watchState.isLoggedIn">
                <!-- ### Menu ### -->
                <NavMenu></NavMenu>

                <!-- ### Sidebar ### -->
                <Sidebar></Sidebar>

                <!-- ### Tabs ### -->
                <Feed></Feed>

                <GameLog></GameLog>

                <PlayerList></PlayerList>

                <Search></Search>

                <Favorites></Favorites>

                <FriendLog></FriendLog>

                <Moderation></Moderation>

                <Notification></Notification>

                <FriendList></FriendList>

                <Charts></Charts>

                <Tools></Tools>

                <Profile></Profile>

                <Settings></Settings>

                <!-- ## Dialogs ## -->
                <UserDialog></UserDialog>

                <WorldDialog></WorldDialog>

                <AvatarDialog></AvatarDialog>

                <GroupDialog></GroupDialog>

                <GroupMemberModerationDialog></GroupMemberModerationDialog>

                <GalleryDialog></GalleryDialog>

                <FullscreenImageDialog></FullscreenImageDialog>

                <PreviousInstancesInfoDialog></PreviousInstancesInfoDialog>

                <LaunchDialog></LaunchDialog>

                <LaunchOptionsDialog></LaunchOptionsDialog>

                <FriendImportDialog></FriendImportDialog>

                <WorldImportDialog></WorldImportDialog>

                <AvatarImportDialog></AvatarImportDialog>

                <ChooseFavoriteGroupDialog></ChooseFavoriteGroupDialog>

                <EditInviteMessageDialog></EditInviteMessageDialog>

                <VRChatConfigDialog></VRChatConfigDialog>

                <PrimaryPasswordDialog></PrimaryPasswordDialog>
            </template>
        </div>
    </el-config-provider>
</template>

<script>
    // @ts-ignore
    // import template from './app.pug';
    import { onMounted, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import * as ElementPlusLocale from 'element-plus/es/locale/lang/en';

    import { createGlobalStores } from './stores';
    import { watchState } from './service/watchState';

    import Login from './views/Login/Login.vue';
    import NavMenu from './components/NavMenu.vue';
    import Sidebar from './views/Sidebar/Sidebar.vue';
    import Feed from './views/Feed/Feed.vue';
    import GameLog from './views/GameLog/GameLog.vue';
    import PlayerList from './views/PlayerList/PlayerList.vue';
    import Search from './views/Search/Search.vue';
    import Favorites from './views/Favorites/Favorites.vue';
    import FriendLog from './views/FriendLog/FriendLog.vue';
    import Moderation from './views/Moderation/Moderation.vue';
    import Notification from './views/Notifications/Notification.vue';
    import FriendList from './views/FriendList/FriendList.vue';
    import Charts from './views/Charts/Charts.vue';
    import Tools from './views/Tools/Tools.vue';
    import Profile from './views/Profile/Profile.vue';
    import Settings from './views/Settings/Settings.vue';

    import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
    import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
    import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
    import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
    import GroupMemberModerationDialog from './components/dialogs/GroupDialog/GroupMemberModerationDialog.vue';
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

    // import { utils } from './shared/utils/_utils';

    export default {
        // template,
        components: {
            Login,
            NavMenu,
            Sidebar,
            Feed,
            GameLog,
            PlayerList,
            Search,
            Favorites,
            FriendLog,
            Moderation,
            Notification,
            FriendList,
            Charts,
            Tools,
            Profile,
            Settings,

            UserDialog,
            WorldDialog,
            AvatarDialog,
            GroupDialog,
            GroupMemberModerationDialog,
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
            // window.$app.store = store;
            // Vue.prototype.utils = utils;

            const { locale } = useI18n();

            // Element Plus locale mapping
            const currentLocale = computed(() => {
                const localeMap = {
                    en: () => import('element-plus/es/locale/lang/en'),
                    es: () => import('element-plus/es/locale/lang/es'),
                    fr: () => import('element-plus/es/locale/lang/fr'),
                    ja_JP: () => import('element-plus/es/locale/lang/ja'),
                    ko: () => import('element-plus/es/locale/lang/ko'),
                    pl: () => import('element-plus/es/locale/lang/pl'),
                    pt: () => import('element-plus/es/locale/lang/pt'),
                    vi: () => import('element-plus/es/locale/lang/vi'),
                    zh_CN: () => import('element-plus/es/locale/lang/zh-CN'),
                    zh_TW: () => import('element-plus/es/locale/lang/zh-TW'),
                    th: () => import('element-plus/es/locale/lang/th')
                };
                // For now, return English as default since dynamic imports need async handling
                return ElementPlusLocale.default || ElementPlusLocale;
            });

            store.updateLoop.updateLoop();

            onMounted(async () => {
                store.gameLog.getGameLogTable();
                await store.auth.migrateStoredUsers();
                store.auth.autoLoginAfterMounted();
                store.vrcx.checkAutoBackupRestoreVrcRegistry();
                store.game.checkVRChatDebugLogging();
            });

            return {
                store,
                watchState,
                currentLocale
            };
        }
    };
</script>
