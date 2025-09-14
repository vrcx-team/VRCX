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

<script setup>
    import './app.scss';

    import en from 'element-plus/es/locale/lang/en';
    import es from 'element-plus/es/locale/lang/es';
    import fr from 'element-plus/es/locale/lang/fr';
    import hu from 'element-plus/es/locale/lang/hu';
    import ja from 'element-plus/es/locale/lang/ja';
    import ko from 'element-plus/es/locale/lang/ko';
    import pl from 'element-plus/es/locale/lang/pl';
    import pt from 'element-plus/es/locale/lang/pt';
    import cs from 'element-plus/es/locale/lang/cs';
    import ru from 'element-plus/es/locale/lang/ru';
    import vi from 'element-plus/es/locale/lang/vi';
    import zhCN from 'element-plus/es/locale/lang/zh-cn';
    import zhTW from 'element-plus/es/locale/lang/zh-tw';
    import th from 'element-plus/es/locale/lang/th';

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

    import { onMounted, computed, onBeforeMount } from 'vue';
    import { createGlobalStores } from './stores';
    import { watchState } from './service/watchState';
    import { useI18n } from 'vue-i18n';
    import { initNoty } from './plugin/noty';

    console.log(`isLinux: ${LINUX}`);

    const { locale } = useI18n();

    initNoty();

    const langMap = {
        en: en,
        es: es,
        fr: fr,
        hu: hu,
        ja: ja,
        ko: ko,
        pl: pl,
        pt: pt,
        cs: cs,
        ru: ru,
        vi: vi,
        'zh-CN': zhCN,
        'zh-TW': zhTW,
        th: th
    };

    const currentLocale = computed(() => {
        return langMap[locale.value] || en;
    });

    const store = createGlobalStores();

    if (typeof window !== 'undefined') {
        window.$pinia = store;
    }

    onBeforeMount(() => {
        store.updateLoop.updateLoop();
    });

    onMounted(async () => {
        store.gameLog.getGameLogTable();
        await store.auth.migrateStoredUsers();
        store.auth.autoLoginAfterMounted();
        store.vrcx.checkAutoBackupRestoreVrcRegistry();
        store.game.checkVRChatDebugLogging();
    });
</script>
