<template>
    <template v-if="watchState.isLoggedIn">
        <ResizablePanelGroup
            ref="panelGroupRef"
            direction="horizontal"
            class="group/main-layout flex-1 h-full min-w-0"
            @layout="handleLayout">
            <template #default="{ layout }">
                <ResizablePanel ref="navPanelRef" :min-size="navMinSize" :max-size="navMaxSize" :order="1">
                    <NavMenu></NavMenu>
                </ResizablePanel>
                <ResizableHandle :disabled="isNavCollapsed" class="opacity-0"></ResizableHandle>
                <ResizablePanel :default-size="mainDefaultSize" :order="2">
                    <RouterView v-slot="{ Component }">
                        <KeepAlive include="Feed,GameLog,Search">
                            <component :is="Component" />
                        </KeepAlive>
                    </RouterView>
                </ResizablePanel>

                <template v-if="isSideBarTabShow">
                    <ResizableHandle
                        with-handle
                        :class="[
                            isAsideCollapsed(layout) ? 'opacity-100' : 'opacity-0',
                            'z-20 [&>div]:-translate-x-1/2'
                        ]"></ResizableHandle>
                    <ResizablePanel
                        ref="asidePanelRef"
                        :default-size="asideDefaultSize"
                        :max-size="asideMaxSize"
                        :collapsed-size="0"
                        collapsible
                        :order="3">
                        <Sidebar></Sidebar>
                    </ResizablePanel>
                </template>
            </template>
        </ResizablePanelGroup>

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
    import { useRouter } from 'vue-router';
    import { watch } from 'vue';

    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { useAuthenticatedLayoutResizable } from '../../composables/useAuthenticatedLayoutResizable';
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

    const {
        panelGroupRef,
        navPanelRef,
        asidePanelRef,
        navDefaultSize,
        navMinSize,
        navMaxSize,
        asideDefaultSize,
        asideMaxSize,
        mainDefaultSize,
        handleLayout,
        isAsideCollapsed,
        isNavCollapsed,
        isSideBarTabShow
    } = useAuthenticatedLayoutResizable();

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
