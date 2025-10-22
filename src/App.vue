<template>
    <el-config-provider :locale="currentLocale">
        <MacOSTitleBar></MacOSTitleBar>

        <div
            id="x-app"
            class="x-app"
            :class="{ 'with-macos-titlebar': isMacOS }"
            ondragenter="event.preventDefault()"
            ondragover="event.preventDefault()"
            ondrop="event.preventDefault()">
            <!-- ### Login ### -->
            <Login v-if="!watchState.isLoggedIn"></Login>

            <VRCXUpdateDialog></VRCXUpdateDialog>

            <template v-if="watchState.isLoggedIn">
                <NavMenu></NavMenu>

                <RouterView v-show="!isSideBarTabShow"></RouterView>

                <el-splitter v-show="isSideBarTabShow" @resize-end="setAsideWidth">
                    <el-splitter-panel>
                        <RouterView></RouterView>
                    </el-splitter-panel>

                    <el-splitter-panel :min="250" :max="700" :size="asideWidth" collapsible>
                        <Sidebar></Sidebar>
                    </el-splitter-panel>
                </el-splitter>

                <!-- ## Dialogs ## -->
                <UserDialog></UserDialog>

                <WorldDialog></WorldDialog>

                <AvatarDialog></AvatarDialog>

                <GroupDialog></GroupDialog>

                <GroupMemberModerationDialog></GroupMemberModerationDialog>

                <InviteGroupDialog></InviteGroupDialog>

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

                <SendBoopDialog></SendBoopDialog>

                <ChangelogDialog></ChangelogDialog>
            </template>
        </div>
    </el-config-provider>
</template>

<script setup>
    import { computed, onBeforeMount, onMounted } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import cs from 'element-plus/es/locale/lang/cs';
    import en from 'element-plus/es/locale/lang/en';
    import es from 'element-plus/es/locale/lang/es';
    import fr from 'element-plus/es/locale/lang/fr';
    import hu from 'element-plus/es/locale/lang/hu';
    import ja from 'element-plus/es/locale/lang/ja';
    import ko from 'element-plus/es/locale/lang/ko';
    import pl from 'element-plus/es/locale/lang/pl';
    import pt from 'element-plus/es/locale/lang/pt';
    import ru from 'element-plus/es/locale/lang/ru';
    import th from 'element-plus/es/locale/lang/th';
    import vi from 'element-plus/es/locale/lang/vi';
    import zhCN from 'element-plus/es/locale/lang/zh-cn';
    import zhTW from 'element-plus/es/locale/lang/zh-tw';

    import { createGlobalStores, useAppearanceSettingsStore } from './stores';
    import { initNoty } from './plugin/noty';
    import { watchState } from './service/watchState';

    import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
    import AvatarImportDialog from './views/Favorites/dialogs/AvatarImportDialog.vue';
    import ChangelogDialog from './views/Settings/dialogs/ChangelogDialog.vue';
    import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
    import EditInviteMessageDialog from './views/Profile/dialogs/EditInviteMessageDialog.vue';
    import FriendImportDialog from './views/Favorites/dialogs/FriendImportDialog.vue';
    import FullscreenImagePreview from './components/FullscreenImagePreview.vue';
    import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
    import GroupMemberModerationDialog from './components/dialogs/GroupDialog/GroupMemberModerationDialog.vue';
    import InviteGroupDialog from './components/dialogs/InviteGroupDialog.vue';
    import LaunchDialog from './components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from './views/Settings/dialogs/LaunchOptionsDialog.vue';
    import Login from './views/Login/Login.vue';
    import MacOSTitleBar from './components/TitleBar/MacOSTitleBar.vue';
    import NavMenu from './components/NavMenu.vue';
    import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
    import PrimaryPasswordDialog from './views/Settings/dialogs/PrimaryPasswordDialog.vue';
    import SendBoopDialog from './components/dialogs/SendBoopDialog.vue';
    import Sidebar from './views/Sidebar/Sidebar.vue';
    import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';
    import VRChatConfigDialog from './views/Settings/dialogs/VRChatConfigDialog.vue';
    import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
    import WorldImportDialog from './views/Favorites/dialogs/WorldImportDialog.vue';

    import './app.scss';

    console.log(`isLinux: ${LINUX}`);

    const isMacOS = computed(() => {
        return navigator.platform.indexOf('Mac') > -1;
    });

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

<style lang="scss" scoped>
    :deep(.el-splitter-bar__dragger) {
        width: 4px !important;
    }

    /* Add title bar spacing for macOS */
    .x-app.with-macos-titlebar {
        padding-top: 28px;
    }
</style>
