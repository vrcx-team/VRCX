<template>
    <template v-if="watchState.isLoggedIn">
        <div class="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">
            <SidebarProvider
                :open="sidebarOpen"
                :width="navWidth"
                :width-icon="48"
                class="relative flex-1 h-full min-w-0 min-h-0"
                @update:open="handleSidebarOpenChange">
                <NavMenu />

                <div
                    v-show="sidebarOpen"
                    class="absolute top-0 bottom-0 z-30 w-1 cursor-ew-resize select-none"
                    :style="{ left: 'var(--sidebar-width)' }"
                    @pointerdown.prevent="startNavResize" />

                <SidebarInset class="min-w-0 bg-sidebar">
                    <ResizablePanelGroup
                        direction="horizontal"
                        auto-save-id="vrcx-main-layout-right-sidebar"
                        :class="[
                            'group/main-layout flex-1 h-full min-w-0',
                            { 'aside-collapsed': isAsideCollapsedStatic }
                        ]"
                        @layout="handleLayout">
                        <template #default="{ layout }">
                            <ResizablePanel :default-size="mainDefaultSize" :order="1">
                                <RouterView v-slot="{ Component }">
                                    <KeepAlive exclude="ChartsInstance, ChartsMutual">
                                        <component :is="Component" />
                                    </KeepAlive>
                                </RouterView>
                            </ResizablePanel>

                            <ResizableHandle class="z-20 opacity-0"></ResizableHandle>
                            <ResizablePanel
                                ref="asidePanelRef"
                                :default-size="asideDefaultSize"
                                :min-size="asideMinSize"
                                :collapsed-size="0"
                                collapsible
                                :order="2"
                                :style="{ maxWidth: `${asideMaxPx}px` }">
                                <Sidebar></Sidebar>
                            </ResizablePanel>
                        </template>
                    </ResizablePanelGroup>
                    <TooltipWrapper v-if="showAsideExpandButton" side="left" :content="t('nav_tooltip.expand_sidebar')">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            class="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-r-none"
                            :aria-label="t('nav_tooltip.expand_sidebar')"
                            @click="asidePanelRef?.expand()">
                            <ChevronLeft />
                        </Button>
                    </TooltipWrapper>
                </SidebarInset>
            </SidebarProvider>
            <StatusBar />
        </div>

        <!-- ## Dialogs ## -->
        <MainDialogContainer />
        <InviteGroupDialog />
        <GroupEditDialog />
        <GroupEventEditDialog />
        <FullscreenImagePreview />
        <LaunchDialog />
        <LaunchOptionsDialog />
        <FriendImportDialog />
        <WorldImportDialog />
        <AvatarImportDialog />
        <ChooseFavoriteGroupDialog />
        <VRChatConfigDialog />
        <PrimaryPasswordDialog />
        <SendBoopDialog />
        <ModerationReportDialog />
        <GlobalToolsDialogs />
        <ChangelogDialog />
        <WhatsNewDialog />
        <SpotlightDialog />
    </template>
</template>

<script setup>
    import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useRouter } from 'vue-router';
    import { useI18n } from 'vue-i18n';
    import { ChevronLeft } from 'lucide-vue-next';

    import { Button } from '../../components/ui/button';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar';
    import { useAppearanceSettingsStore } from '../../stores';
    import { useMainLayoutResizable } from '../../composables/useMainLayoutResizable';
    import { watchState } from '../../services/watchState';

    import AvatarImportDialog from '../Favorites/dialogs/AvatarImportDialog.vue';
    import ChangelogDialog from '../Settings/dialogs/ChangelogDialog.vue';
    import ChooseFavoriteGroupDialog from '../../components/dialogs/ChooseFavoriteGroupDialog.vue';
    import FriendImportDialog from '../Favorites/dialogs/FriendImportDialog.vue';
    import FullscreenImagePreview from '../../components/FullscreenImagePreview.vue';
    import GlobalToolsDialogs from '../Tools/components/GlobalToolsDialogs.vue';
    import GroupEditDialog from '../../components/dialogs/GroupDialog/GroupEditDialog.vue';
    import GroupEventEditDialog from '../../components/dialogs/GroupDialog/GroupEventEditDialog.vue';
    import InviteGroupDialog from '../../components/dialogs/InviteGroupDialog.vue';
    import LaunchDialog from '../../components/dialogs/LaunchDialog.vue';
    import LaunchOptionsDialog from '../Settings/dialogs/LaunchOptionsDialog.vue';
    import MainDialogContainer from '../../components/dialogs/MainDialogContainer.vue';
    import ModerationReportDialog from '../../components/dialogs/ModerationReportDialog.vue';
    import NavMenu from '../../components/nav-menu/NavMenu.vue';
    import PrimaryPasswordDialog from '../Settings/dialogs/PrimaryPasswordDialog.vue';
    import SendBoopDialog from '../../components/dialogs/SendBoopDialog.vue';
    import Sidebar from '../Sidebar/Sidebar.vue';
    import StatusBar from '../../components/StatusBar.vue';
    import VRChatConfigDialog from '../Settings/dialogs/VRChatConfigDialog.vue';
    import WorldImportDialog from '../Favorites/dialogs/WorldImportDialog.vue';
    import WhatsNewDialog from '../../components/onboarding/WhatsNewDialog.vue';
    import SpotlightDialog from '../../components/onboarding/SpotlightDialog.vue';

    const router = useRouter();
    const { t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { navWidth, isNavCollapsed } = storeToRefs(appearanceSettingsStore);

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
        asideDefaultSize,
        asideMinSize,
        asideMaxPx,
        mainDefaultSize,
        handleLayout,
        isAsideCollapsedStatic,
        isSideBarTabShow
    } = useMainLayoutResizable();

    const asidePanelRef = ref(null);
    const showAsideExpandButton = computed(() => isSideBarTabShow.value && isAsideCollapsedStatic.value);
    let restoreAsideAfterHiddenRoute = false;

    watch(isSideBarTabShow, async (show) => {
        if (!show) {
            restoreAsideAfterHiddenRoute = asidePanelRef.value?.isCollapsed === false;
        }

        await nextTick();
        if (show) {
            if (restoreAsideAfterHiddenRoute) {
                asidePanelRef.value?.expand();
            }
        } else {
            asidePanelRef.value?.collapse();
        }
    });

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
