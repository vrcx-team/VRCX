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
                <NavMenu></NavMenu>

                <el-splitter @resize-end="setAsideWidth" v-show="isSideBarTabShow">
                    <el-splitter-panel>
                        <Feed></Feed>

                        <GameLog></GameLog>

                        <PlayerList></PlayerList>

                        <Search></Search>

                        <Favorites></Favorites>

                        <FriendLog></FriendLog>

                        <Moderation></Moderation>

                        <Notification></Notification>

                        <Tools></Tools>

                        <Profile></Profile>

                        <Settings></Settings>
                    </el-splitter-panel>

                    <el-splitter-panel :min="200" :max="700" :size="asideWidth">
                        <Sidebar></Sidebar>
                    </el-splitter-panel>
                </el-splitter>

                <FriendList></FriendList>

                <Charts></Charts>

                <!-- ## Dialogs ## -->
                <UserDialog></UserDialog>

                <WorldDialog></WorldDialog>

                <AvatarDialog></AvatarDialog>

                <GroupDialog></GroupDialog>

                <GroupMemberModerationDialog></GroupMemberModerationDialog>

                <FullscreenImagePreview></FullscreenImagePreview>

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
    import Settings from './views/Settings/Settings.vue';

    const PlayerList = defineAsyncComponent(() => import('./views/PlayerList/PlayerList.vue'));
    const Search = defineAsyncComponent(() => import('./views/Search/Search.vue'));
    const Favorites = defineAsyncComponent(() => import('./views/Favorites/Favorites.vue'));
    const Notification = defineAsyncComponent(() => import('./views/Notifications/Notification.vue'));
    const Tools = defineAsyncComponent(() => import('./views/Tools/Tools.vue'));
    const Profile = defineAsyncComponent(() => import('./views/Profile/Profile.vue'));
    const FriendLog = defineAsyncComponent(() => import('./views/FriendLog/FriendLog.vue'));
    const Moderation = defineAsyncComponent(() => import('./views/Moderation/Moderation.vue'));
    const FriendList = defineAsyncComponent(() => import('./views/FriendList/FriendList.vue'));
    const Charts = defineAsyncComponent(() => import('./views/Charts/Charts.vue'));

    import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
    import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
    import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
    import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
    import GroupMemberModerationDialog from './components/dialogs/GroupDialog/GroupMemberModerationDialog.vue';
    import FullscreenImagePreview from './components/FullscreenImagePreview.vue';
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
    import { defineAsyncComponent, onMounted, computed, onBeforeMount } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { storeToRefs } from 'pinia';
    import { createGlobalStores, useAppearanceSettingsStore } from './stores';
    import { watchState } from './service/watchState';
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

    const appearanceStore = useAppearanceSettingsStore();
    const { setAsideWidth } = appearanceStore;
    const { asideWidth, isSideBarTabShow } = storeToRefs(appearanceStore);
</script>
