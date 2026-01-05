<template>
    <template v-if="watchState.isLoggedIn">
        <NavMenu></NavMenu>
        <el-splitter @resize-end="handleResizeEnd">
            <el-splitter-panel>
                <RouterView v-slot="{ Component }">
                    <KeepAlive include="Feed,GameLog,PlayerList">
                        <component :is="Component" />
                    </KeepAlive>
                </RouterView>
            </el-splitter-panel>

            <el-splitter-panel v-if="isSideBarTabShow" :min="250" :max="700" :size="asideWidth" collapsible>
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

        <VRChatConfigDialog></VRChatConfigDialog>

        <PrimaryPasswordDialog></PrimaryPasswordDialog>

        <SendBoopDialog></SendBoopDialog>

        <ChangelogDialog></ChangelogDialog>
    </template>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useRouter } from 'vue-router';
    import { watch } from 'vue';

    import { useAppearanceSettingsStore } from '../../stores';
    import { watchState } from '../../service/watchState';

    import AvatarDialog from '../../components/dialogs/AvatarDialog/AvatarDialog.vue';
    import AvatarImportDialog from '../Favorites/dialogs/AvatarImportDialog.vue';
    import ChangelogDialog from '../Settings/dialogs/ChangelogDialog.vue';
    import ChooseFavoriteGroupDialog from '../../components/dialogs/ChooseFavoriteGroupDialog.vue';
    import FriendImportDialog from '../Favorites/dialogs/FriendImportDialog.vue';
    import FullscreenImagePreview from '../../components/FullscreenImagePreview.vue';
    import GroupDialog from '../../components/dialogs/GroupDialog/GroupDialog.vue';
    import GroupMemberModerationDialog from '../../components/dialogs/GroupDialog/GroupMemberModerationDialog.vue';
    import InviteGroupDialog from '../../components/dialogs/InviteGroupDialog.vue';
    import LaunchDialog from '../../components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from '../Settings/dialogs/LaunchOptionsDialog.vue';
    import NavMenu from '../../components/NavMenu.vue';
    import PreviousInstancesInfoDialog from '../../components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
    import PrimaryPasswordDialog from '../Settings/dialogs/PrimaryPasswordDialog.vue';
    import SendBoopDialog from '../../components/dialogs/SendBoopDialog.vue';
    import Sidebar from '../Sidebar/Sidebar.vue';
    import UserDialog from '../../components/dialogs/UserDialog/UserDialog.vue';
    import VRChatConfigDialog from '../Settings/dialogs/VRChatConfigDialog.vue';
    import WorldDialog from '../../components/dialogs/WorldDialog/WorldDialog.vue';
    import WorldImportDialog from '../Favorites/dialogs/WorldImportDialog.vue';

    const router = useRouter();

    const appearanceStore = useAppearanceSettingsStore();
    const { setAsideWidth } = appearanceStore;
    const { asideWidth, isSideBarTabShow } = storeToRefs(appearanceStore);

    const handleResizeEnd = (index, sizes) => {
        if (!Array.isArray(sizes) || sizes.length < 2) {
            return;
        }
        const asideSplitterIndex = sizes.length - 2;
        if (index !== asideSplitterIndex) {
            return;
        }
        const asideSize = sizes[sizes.length - 1];
        if (Number.isFinite(asideSize) && asideSize > 0) {
            setAsideWidth(asideSize);
        }
    };

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (!isLoggedIn) {
                router.replace({ name: 'login' });
            }
        },
        { immediate: true }
    );
</script>
