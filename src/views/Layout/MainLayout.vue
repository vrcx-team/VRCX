<template>
    <template v-if="watchState.isLoggedIn">
        <SidebarProvider
            :open="sidebarOpen"
            :width="navWidth"
            :width-icon="48"
            class="relative flex-1 h-full min-w-0"
            @update:open="handleSidebarOpenChange">
            <NavMenu />

            <div
                v-show="sidebarOpen"
                class="absolute top-0 bottom-0 z-30 w-1 cursor-ew-resize select-none"
                :style="{ left: 'var(--sidebar-width)' }"
                @pointerdown.prevent="startNavResize" />

            <SidebarInset class="min-w-0 bg-sidebar">
                <ResizablePanelGroup
                    ref="panelGroupRef"
                    direction="horizontal"
                    :class="['group/main-layout flex-1 h-full min-w-0', { 'aside-collapsed': isAsideCollapsedStatic }]"
                    @layout="handleLayout">
                    <template #default="{ layout }">
                        <ResizablePanel :default-size="mainDefaultSize" :order="1">
                            <RouterView v-slot="{ Component }">
                                <KeepAlive exclude="Charts">
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
                                :order="2"
                                :style="{ maxWidth: `${asideMaxPx}px` }">
                                <Sidebar></Sidebar>
                            </ResizablePanel>
                        </template>
                    </template>
                </ResizablePanelGroup>
            </SidebarInset>
        </SidebarProvider>

        <!-- ## Dialogs ## -->
        <MainDialogContainer></MainDialogContainer>

        <GroupMemberModerationDialog></GroupMemberModerationDialog>

        <InviteGroupDialog></InviteGroupDialog>

        <FullscreenImagePreview></FullscreenImagePreview>

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
    import { computed, onUnmounted, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRouter } from 'vue-router';

    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar';
    import { useAppearanceSettingsStore } from '../../stores';
    import { useMainLayoutResizable } from '../../composables/useMainLayoutResizable';
    import { watchState } from '../../service/watchState';

    import AvatarImportDialog from '../Favorites/dialogs/AvatarImportDialog.vue';
    import ChangelogDialog from '../Settings/dialogs/ChangelogDialog.vue';
    import ChooseFavoriteGroupDialog from '../../components/dialogs/ChooseFavoriteGroupDialog.vue';
    import FriendImportDialog from '../Favorites/dialogs/FriendImportDialog.vue';
    import FullscreenImagePreview from '../../components/FullscreenImagePreview.vue';
    import GroupMemberModerationDialog from '../../components/dialogs/GroupDialog/GroupMemberModerationDialog.vue';
    import InviteGroupDialog from '../../components/dialogs/InviteGroupDialog.vue';
    import LaunchDialog from '../../components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from '../Settings/dialogs/LaunchOptionsDialog.vue';
    import MainDialogContainer from '../../components/dialogs/MainDialogContainer.vue';
    import NavMenu from '../../components/NavMenu.vue';
    import PrimaryPasswordDialog from '../Settings/dialogs/PrimaryPasswordDialog.vue';
    import SendBoopDialog from '../../components/dialogs/SendBoopDialog.vue';
    import Sidebar from '../Sidebar/Sidebar.vue';
    import VRChatConfigDialog from '../Settings/dialogs/VRChatConfigDialog.vue';
    import WorldImportDialog from '../Favorites/dialogs/WorldImportDialog.vue';

    const router = useRouter();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { navWidth, isNavCollapsed, asideWidth } = storeToRefs(appearanceSettingsStore);

    const sidebarOpen = computed(() => !isNavCollapsed.value);

    const handleSidebarOpenChange = (open) => {
        appearanceSettingsStore.setNavCollapsed(!open);
    };

    let isResizingNav = false;
    let cleanupNavResize = null;

    const startNavResize = (event) => {
        if (!sidebarOpen.value) {
            return;
        }

        isResizingNav = true;
        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        const handleMove = (e) => {
            if (!isResizingNav) {
                return;
            }
            appearanceSettingsStore.setNavWidth(e.clientX);
        };

        const handleUp = () => {
            isResizingNav = false;
            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            cleanupNavResize = null;
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
        cleanupNavResize = handleUp;
        appearanceSettingsStore.setNavWidth(event.clientX);
    };

    onUnmounted(() => {
        cleanupNavResize?.();
    });

    const {
        panelGroupRef,
        asideDefaultSize,
        asideMaxSize,
        asideMaxPx,
        mainDefaultSize,
        handleLayout,
        isAsideCollapsed,
        isSideBarTabShow
    } = useMainLayoutResizable();

    const isAsideCollapsedStatic = computed(() => !isSideBarTabShow.value || asideWidth.value === 0);

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
