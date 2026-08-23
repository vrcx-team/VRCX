<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ worldDialog.ref?.name }}</DialogTitle>
            <DialogDescription>
                {{ worldDialog.ref?.description }}
            </DialogDescription>
        </DialogHeader>
        <!-- Summary and info rail -->
        <div class="flex-none w-77 pr-4 overflow-y-auto">
            <div class="rounded-xl bg-(--profile-card) overflow-hidden flex flex-col">
                <div class="relative aspect-4/3">
                    <img
                        v-if="!worldDialog.loading && !imageError"
                        :src="worldDialog.ref.thumbnailImageUrl"
                        class="absolute inset-0 size-full cursor-pointer object-cover"
                        @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)"
                        @error="imageError = true"
                        loading="lazy" />
                    <div
                        v-else-if="!worldDialog.loading"
                        class="absolute inset-0 flex items-center justify-center bg-muted">
                        <Image class="size-8 text-muted-foreground" />
                    </div>
                </div>
                <div class="flex flex-col p-3">
                    <div class="flex min-w-0 flex-col">
                        <div class="flex justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="overflow-hidden">
                                    <span
                                        class="flex flex-wrap font-bold cursor-pointer"
                                        @click="copyWorldName"
                                        :title="worldDialog.ref.name">
                                        <Home
                                            v-if="
                                                currentUser.$homeLocation &&
                                                currentUser.$homeLocation.worldId === worldDialog.id
                                            "
                                            class="inline-block" />
                                        {{ worldDialog.ref.name }}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <div>
                                        <span
                                            class="flex flex-wrap cursor-pointer x-grey font-mono text-xs max-w-30"
                                            @click="showUserDialog(worldDialog.ref.authorId)"
                                            v-text="worldDialog.ref.authorName" />
                                    </div>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 flex-none items-center justify-end gap-2 self-start">
                                <TooltipWrapper
                                    v-if="worldDialog.isFavorite"
                                    side="top"
                                    :content="t('dialog.world.actions.favorites_tooltip')">
                                    <Button
                                        class="rounded-lg"
                                        size="icon"
                                        @click="worldDialogCommand('Add Favorite')"
                                        :ariaLabel="t('dialog.world.actions.favorites_tooltip')"
                                        ><Star
                                    /></Button>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    v-else
                                    side="top"
                                    :content="t('dialog.world.actions.favorites_tooltip')">
                                    <Button
                                        class="rounded-lg"
                                        size="icon"
                                        variant="outline"
                                        :ariaLabel="t('dialog.world.actions.favorites_tooltip')"
                                        @click="worldDialogCommand('Add Favorite')"
                                        ><Star
                                    /></Button>
                                </TooltipWrapper>
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="outline" size="icon" class="rounded-lg">
                                            <Ellipsis />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem @click="worldDialogCommand('Refresh')">
                                            <RefreshCw class="size-4" />
                                            {{ t('dialog.world.actions.refresh') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger @click="worldDialogCommand('Share')">
                                                <Share2 class="size-4 mr-2" />
                                                <span>{{ t('dialog.world.actions.share') }}</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuSubContent side="right" align="start" class="w-56">
                                                <DropdownMenuItem @click="worldDialogCommand('Share')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_url') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="worldDialogCommand('Copy World Name')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_name') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="worldDialogCommand('Copy World ID')">
                                                    <Copy class="size-4" />
                                                    {{ t('dialog.world.info.copy_id') }}
                                                </DropdownMenuItem>
                                            </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem @click="worldDialogCommand('New Instance')">
                                            <Flag class="size-4" />
                                            {{ t('dialog.world.actions.new_instance') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="worldDialogCommand('New Instance and Self Invite')">
                                            <MessageSquare class="size-4" />
                                            {{
                                                canOpenInstanceInGame
                                                    ? t('dialog.world.actions.new_instance_and_open_ingame')
                                                    : t('dialog.world.actions.new_instance_and_self_invite')
                                            }}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            v-if="
                                                currentUser.$homeLocation &&
                                                currentUser.$homeLocation.worldId === worldDialog.id
                                            "
                                            @click="worldDialogCommand('Reset Home')">
                                            <Wand2 class="size-4" />
                                            {{ t('dialog.world.actions.reset_home') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem v-else @click="worldDialogCommand('Make Home')">
                                            <Home class="size-4" />
                                            {{ t('dialog.world.actions.make_home') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem @click="worldDialogCommand('Previous Instances')">
                                            <LineChart class="size-4" />
                                            {{ t('dialog.world.actions.show_previous_instances') }}
                                        </DropdownMenuItem>
                                        <template v-if="currentUser.id !== worldDialog.ref.authorId">
                                            <DropdownMenuItem
                                                :disabled="!worldDialog.hasPersistData"
                                                @click="worldDialogCommand('Delete Persistent Data')">
                                                <Upload class="size-4" />
                                                {{ t('dialog.world.actions.delete_persistent_data') }}
                                            </DropdownMenuItem>
                                        </template>
                                        <template v-else>
                                            <DropdownMenuItem @click="worldDialogCommand('Rename')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.rename') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change Description')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_description') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change Capacity')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_capacity') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                @click="worldDialogCommand('Change Recommended Capacity')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_recommended_capacity') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change YouTube Preview')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_preview') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change Tags')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_warnings_settings_tags') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change Allowed Domains')">
                                                <Pencil class="size-4" />
                                                {{ t('dialog.world.actions.change_allowed_video_player_domains') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="worldDialogCommand('Change Image')">
                                                <Image class="size-4" />
                                                {{ t('dialog.world.actions.change_image') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                v-if="worldDialog.ref.unityPackageUrl"
                                                @click="worldDialogCommand('Download Unity Package')">
                                                <Download class="size-4" />
                                                {{ t('dialog.world.actions.download_package') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                v-if="
                                                    worldDialog.ref?.tags?.includes('system_approved') ||
                                                    worldDialog.ref?.tags?.includes('system_labs')
                                                "
                                                @click="worldDialogCommand('Unpublish')">
                                                <Eye class="size-4" />
                                                {{ t('dialog.world.actions.unpublish') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem v-else @click="worldDialogCommand('Publish')">
                                                <Eye class="size-4" />
                                                {{ t('dialog.world.actions.publish_to_labs') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                :disabled="!worldDialog.hasPersistData"
                                                @click="worldDialogCommand('Delete Persistent Data')">
                                                <Upload class="size-4" />
                                                {{ t('dialog.world.actions.delete_persistent_data') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                @click="worldDialogCommand('Delete')">
                                                <Trash2 class="size-4" />
                                                {{ t('dialog.world.actions.delete') }}
                                            </DropdownMenuItem>
                                        </template>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <TooltipWrapper
                                    v-if="worldDialog.inCache"
                                    class="col-start-1 row-start-2"
                                    side="top"
                                    :content="t('dialog.world.actions.delete_cache_tooltip')">
                                    <Button
                                        class="rounded-lg"
                                        size="icon"
                                        variant="outline"
                                        :ariaLabel="t('common.actions.delete')"
                                        :disabled="isGameRunning && worldDialog.cacheLocked"
                                        @click="deleteVRChatCache(worldDialog.ref)"
                                        ><Trash2
                                    /></Button>
                                </TooltipWrapper>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-1 mt-2">
                            <Badge v-if="worldDialog.ref.$isLabs" variant="outline">
                                {{ t('dialog.world.tags.labs') }}
                            </Badge>
                            <Badge v-else-if="worldDialog.ref.releaseStatus === 'public'" variant="outline">
                                {{ t('dialog.world.tags.public') }}
                            </Badge>
                            <Badge v-else variant="outline">
                                {{ t('dialog.world.tags.private') }}
                            </Badge>
                            <TooltipWrapper v-if="worldDialog.isPC" side="top" content="PC">
                                <Badge class="text-platform-pc border-platform-pc!" variant="outline">
                                    <Monitor class="h-4 w-4 text-platform-pc" />
                                    <span
                                        v-if="worldDialog.fileAnalysis.standalonewindows?._fileSize"
                                        class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5">
                                        {{ worldDialog.fileAnalysis.standalonewindows._fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isQuest" side="top" content="Quest">
                                <Badge class="text-platform-quest border-platform-quest!" variant="outline">
                                    <Smartphone class="h-4 w-4 text-platform-quest" />
                                    <span
                                        v-if="worldDialog.fileAnalysis.android?._fileSize"
                                        class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5">
                                        {{ worldDialog.fileAnalysis.android._fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isIos" side="top" content="iOS">
                                <Badge class="text-platform-ios border-platform-ios" variant="outline">
                                    <Apple class="h-4 w-4 text-platform-ios" />
                                    <span
                                        v-if="worldDialog.fileAnalysis.ios?._fileSize"
                                        class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5">
                                        {{ worldDialog.fileAnalysis.ios._fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <Badge v-if="worldDialog.avatarScalingDisabled" variant="outline">
                                {{ t('dialog.world.tags.avatar_scaling_disabled') }}
                            </Badge>
                            <Badge v-if="worldDialog.focusViewDisabled" variant="outline">
                                {{ t('dialog.world.tags.focus_view_disabled') }}
                            </Badge>
                            <Badge v-if="worldDialog.ref.unityPackageUrl" variant="outline">
                                {{ t('dialog.world.tags.future_proofing') }}
                            </Badge>
                            <Badge
                                v-if="worldDialog.inCache"
                                variant="outline"
                                class="cursor-pointer"
                                @click="openFolderGeneric(worldDialog.cachePath)">
                                <span v-text="worldDialog.cacheSize" />
                                | {{ t('dialog.world.tags.cache') }}
                            </Badge>
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1">
                            <template v-for="tag in worldDialog.ref.tags" :key="tag">
                                <Badge v-if="tag.startsWith('content_')" variant="outline">
                                    <span v-if="tag === 'content_horror'">
                                        {{ t('dialog.world.tags.content_horror') }}
                                    </span>
                                    <span v-else-if="tag === 'content_gore'">
                                        {{ t('dialog.world.tags.content_gore') }}
                                    </span>
                                    <span v-else-if="tag === 'content_violence'">
                                        {{ t('dialog.world.tags.content_violence') }}
                                    </span>
                                    <span v-else-if="tag === 'content_adult'">
                                        {{ t('dialog.world.tags.content_adult') }}
                                    </span>
                                    <span v-else-if="tag === 'content_sex'">
                                        {{ t('dialog.world.tags.content_sex') }}
                                    </span>
                                    <span v-else>
                                        {{ tag.replace('content_', '') }}
                                    </span>
                                </Badge>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
            <WorldDialogInfo />
        </div>

        <!-- Right side tabs -->
        <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-4">
            <TabsUnderline
                v-model="worldDialog.activeTab"
                :background="true"
                :items="worldDialogTabs"
                :unmount-on-hide="false"
                fill
                @update:modelValue="worldDialogTabClick">
                <template #Instances>
                    <WorldDialogInstancesTab />
                </template>
                <template #JSON>
                    <DialogJsonTab
                        class="rounded-xl bg-(--profile-card) p-2"
                        :tree-data="treeData"
                        :tree-data-key="treeData?.id"
                        :dialog-id="worldDialog.id"
                        :dialog-ref="worldDialog.ref"
                        :file-analysis="worldDialog.fileAnalysis"
                        @refresh="refreshWorldDialogTreeData()" />
                </template>
            </TabsUnderline>
        </div>

        <template v-if="isDialogVisible">
            <WorldAllowedDomainsDialog :world-allowed-domains-dialog="worldAllowedDomainsDialog" />
            <SetWorldTagsDialog
                v-model:is-set-world-tags-dialog-visible="isSetWorldTagsDialogVisible"
                :old-tags="worldDialog.ref?.tags"
                :old-disabled-prop-abilities="worldDialog.ref?.disabledPropAbilities"
                :world-id="worldDialog.id"
                :is-world-dialog-visible="worldDialog.visible" />
            <NewInstanceDialog
                :new-instance-dialog-location-tag="newInstanceDialogLocationTag"
                :last-location="lastLocation" />
            <input
                id="WorldImageUploadButton"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onFileChangeWorldImage" />
            <ImageCropDialog
                :open="cropDialogOpen"
                :title="t('dialog.change_content_image.world')"
                :aspect-ratio="4 / 3"
                :file="cropDialogFile"
                @update:open="cropDialogOpen = $event"
                @confirm="onCropConfirmWorld" />
        </template>
    </div>
</template>

<script setup>
    import {
        Apple,
        Copy,
        Download,
        Ellipsis,
        Eye,
        Flag,
        Home,
        Image,
        LineChart,
        MessageSquare,
        Monitor,
        Pencil,
        RefreshCw,
        Share2,
        Smartphone,
        Star,
        Trash2,
        Upload,
        Wand2
    } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useModalStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { deleteVRChatCache, openFolderGeneric } from '../../../shared/utils';
    import { Badge } from '../../ui/badge';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { runNewInstanceSelfInviteFlow as newInstanceSelfInvite } from '../../../coordinators/inviteCoordinator';
    import { useWorldDialogCommands } from './useWorldDialogCommands';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import ImageCropDialog from '../ImageCropDialog.vue';
    import WorldDialogInfo from './WorldDialogInfo.vue';
    import WorldDialogInstancesTab from './WorldDialogInstancesTab.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    import NewInstanceDialog from '../NewInstanceDialog/NewInstanceDialog.vue';
    import SetWorldTagsDialog from './SetWorldTagsDialog.vue';
    import WorldAllowedDomainsDialog from './WorldAllowedDomainsDialog.vue';

    const { currentUser, userDialog } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { cachedWorlds } = useWorldStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { canOpenInstanceInGame } = useInviteStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const modalStore = useModalStore();

    const { t } = useI18n();

    const {
        worldAllowedDomainsDialog,
        isSetWorldTagsDialogVisible,
        newInstanceDialogLocationTag,
        cropDialogOpen,
        cropDialogFile,
        worldDialogCommand,
        onFileChangeWorldImage,
        onCropConfirmWorld,
        copyWorldName,
        showWorldAllowedDomainsDialog,
        registerCallbacks
    } = useWorldDialogCommands(worldDialog, {
        t,
        toast,
        modalStore,
        userDialog,
        cachedWorlds,
        showWorldDialog,
        showFavoriteDialog,
        newInstanceSelfInvite,
        showPreviousInstancesListDialog: openPreviousInstancesListDialog,
        showFullscreenImageDialog
    });

    registerCallbacks({
        showSetWorldTagsDialog: () => {
            isSetWorldTagsDialogVisible.value = true;
        },
        showWorldAllowedDomainsDialog: () => {
            showWorldAllowedDomainsDialog();
        },
        showChangeWorldImageDialog: () => {
            document.getElementById('WorldImageUploadButton').click();
        }
    });

    const worldDialogTabs = computed(() => [
        { value: 'Instances', label: t('dialog.world.instances.header') },
        { value: 'JSON', label: t('dialog.world.json.header') }
    ]);

    const treeData = ref({});
    const imageError = ref(false);

    watch(
        () => worldDialog.value.id,
        () => {
            imageError.value = false;
        }
    );

    const isDialogVisible = computed({
        get() {
            return worldDialog.value.visible;
        },
        set(value) {
            worldDialog.value.visible = value;
        }
    });

    watch(
        () => worldDialog.value.loading,
        () => {
            if (worldDialog.value.visible) {
                handleDialogOpen();
                !worldDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    /**
     *
     * @param tabName
     */
    function handleWorldDialogTab(tabName) {
        worldDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshWorldDialogTreeData();
        }
    }

    /**
     *
     */
    function loadLastActiveTab() {
        handleWorldDialogTab(worldDialog.value.lastActiveTab);
    }

    /**
     *
     * @param tabName
     */
    function worldDialogTabClick(tabName) {
        if (tabName === worldDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshWorldDialogTreeData();
            }
            return;
        }
        handleWorldDialogTab(tabName);
    }

    /**
     *
     */
    function handleDialogOpen() {
        treeData.value = {};
    }

    /**
     *
     */
    function refreshWorldDialogTreeData() {
        treeData.value = formatJsonVars(worldDialog.value.ref);
    }
</script>
