<template>
    <div class="x-container grid h-full min-h-0 grid-rows-[auto_1fr] gap-4 overflow-hidden" ref="containerRef">
        <div class="flex items-center gap-2 px-0.5 pt-1.5">
            <ToggleGroup
                type="single"
                :model-value="viewMode"
                variant="outline"
                @update:model-value="handleViewModeChange">
                <TooltipWrapper :content="t('view.my_avatars.grid_view')" side="bottom" :delay-duration="300">
                    <ToggleGroupItem
                        value="grid"
                        class="px-2"
                        :class="viewMode === 'grid' && 'bg-accent text-accent-foreground'">
                        <LayoutGrid class="size-4" />
                    </ToggleGroupItem>
                </TooltipWrapper>
                <TooltipWrapper :content="t('view.my_avatars.table_view')" side="bottom" :delay-duration="300">
                    <ToggleGroupItem
                        value="table"
                        class="px-2"
                        :class="viewMode === 'table' && 'bg-accent text-accent-foreground'">
                        <List class="size-4" />
                    </ToggleGroupItem>
                </TooltipWrapper>
            </ToggleGroup>

            <Popover>
                <PopoverTrigger as-child>
                    <Button variant="outline" size="sm" class="h-8 gap-1.5">
                        <ListFilter class="size-4" />
                        {{ t('view.my_avatars.filter') }}
                        <Badge
                            v-if="activeFilterCount"
                            variant="secondary"
                            class="ml-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-xs">
                            {{ activeFilterCount }}
                        </Badge>
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80 p-3" align="start">
                    <div class="flex flex-col gap-3">
                        <Field>
                            <FieldLabel>{{ t('dialog.avatar.info.visibility') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    :model-value="releaseStatusFilter"
                                    variant="outline"
                                    @update:model-value="releaseStatusFilter = $event">
                                    <ToggleGroupItem
                                        v-for="opt in releaseStatusOptions"
                                        :key="opt.value"
                                        :value="opt.value"
                                        class="px-2.5">
                                        {{ opt.label }}
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>{{ t('dialog.avatar.info.platform') }}</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    type="single"
                                    :model-value="platformFilter"
                                    variant="outline"
                                    @update:model-value="platformFilter = $event">
                                    <ToggleGroupItem value="all" class="px-2.5">
                                        {{ t('view.search.avatar.all') }}
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        v-for="plat in platformOptions"
                                        :key="plat.value"
                                        :value="plat.value"
                                        class="px-2.5">
                                        {{ plat.label }}
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>

                        <Field v-if="allTags.length">
                            <FieldLabel>{{ t('dialog.avatar.info.tags') }}</FieldLabel>
                            <FieldContent>
                                <div class="flex flex-wrap gap-1">
                                    <Badge
                                        v-for="tag in allTags"
                                        :key="tag"
                                        :variant="tagFilters.has(tag) ? 'default' : 'outline'"
                                        class="cursor-pointer select-none"
                                        :style="
                                            tagFilters.has(tag)
                                                ? {
                                                      backgroundColor: getTagColor(tag).bg,
                                                      color: getTagColor(tag).text
                                                  }
                                                : {
                                                      borderColor: getTagColor(tag).bg,
                                                      color: getTagColor(tag).text
                                                  }
                                        "
                                        @click="toggleTagFilter(tag)">
                                        {{ tag }}
                                    </Badge>
                                </div>
                            </FieldContent>
                        </Field>

                        <Button
                            v-if="activeFilterCount"
                            variant="outline"
                            size="sm"
                            class="w-full"
                            @click="clearFilters">
                            {{ t('view.my_avatars.clear_filters') }}
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            <div class="flex-1" />

            <span v-if="isLoading" class="text-muted-foreground text-sm">
                {{ t('view.friends_locations.loading_more') }}
            </span>
            <Input v-model="searchText" :placeholder="t('view.search.search_placeholder')" class="h-8 w-80" />

            <DropdownMenu v-if="viewMode === 'grid'">
                <DropdownMenuTrigger as-child>
                    <Button class="rounded-full" size="icon-sm" variant="ghost">
                        <SettingsIcon class="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-60 p-3" align="end">
                    <div class="grid gap-3">
                        <div class="flex items-center justify-between" @click.stop>
                            <span class="text-[13px] font-medium">{{ t('view.friends_locations.scale') }}</span>
                            <span class="text-xs font-semibold min-w-[42px] text-right">{{ cardScalePercent }}%</span>
                        </div>
                        <Slider
                            v-model="cardScaleValue"
                            :min="scaleSlider.min"
                            :max="scaleSlider.max"
                            :step="scaleSlider.step"
                            @click.stop />
                        <div class="flex items-center justify-between" @click.stop>
                            <span class="text-[13px] font-medium">{{ t('view.friends_locations.spacing') }}</span>
                            <span class="text-xs font-semibold min-w-[42px] text-right">{{ cardSpacingPercent }}%</span>
                        </div>
                        <Slider
                            v-model="cardSpacingValue"
                            :min="spacingSlider.min"
                            :max="spacingSlider.max"
                            :step="spacingSlider.step"
                            @click.stop />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button size="icon-sm" variant="ghost" :disabled="isLoading" @click="refreshAvatars">
                <RefreshCw :class="{ 'animate-spin': isLoading }" />
            </Button>
        </div>

        <!-- Table View -->
        <DataTableLayout
            v-if="viewMode === 'table'"
            :table="table"
            auto-height
            :page-sizes="pageSizes"
            :total-items="filteredAvatars.length"
            :loading="isLoading"
            :on-page-size-change="handlePageSizeChange"
            :on-row-click="handleRowClick"
            :row-class="getRowClass"
            class="cursor-pointer min-h-0">
            <template #row-context-menu="{ row }">
                <ContextMenuContent>
                    <ContextMenuItem @click="handleContextMenuAction('details', row.original)">
                        <Eye class="size-4" />
                        {{ t('dialog.avatar.actions.view_details') }}
                    </ContextMenuItem>
                    <ContextMenuItem
                        :disabled="row.original.id === currentAvatarId"
                        @click="handleContextMenuAction('wear', row.original)">
                        <Check class="size-4" />
                        {{ t('view.favorite.select_avatar_tooltip') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem @click="handleContextMenuAction('manageTags', row.original)">
                        <Tag class="size-4" />
                        {{ t('dialog.avatar.actions.manage_tags') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        @click="
                            handleContextMenuAction(
                                row.original.releaseStatus === 'public' ? 'makePrivate' : 'makePublic',
                                row.original
                            )
                        ">
                        <User class="size-4" />
                        {{
                            row.original.releaseStatus === 'public'
                                ? t('dialog.avatar.actions.make_private')
                                : t('dialog.avatar.actions.make_public')
                        }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('rename', row.original)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.rename') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('changeDescription', row.original)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_description') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('changeTags', row.original)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_content_tags') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('changeStyles', row.original)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_styles_author_tags') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('changeImage', row.original)">
                        <ImageIcon class="size-4" />
                        {{ t('dialog.avatar.actions.change_image') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="handleContextMenuAction('createImpostor', row.original)">
                        <RefreshCw class="size-4" />
                        {{ t('dialog.avatar.actions.create_impostor') }}
                    </ContextMenuItem>
                </ContextMenuContent>
            </template>
        </DataTableLayout>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'" ref="gridScrollRef" class="overflow-auto min-h-0 py-2">
            <div
                v-if="gridRows.length"
                ref="gridContainerRefEl"
                class="relative w-full box-border p-1"
                :style="{ height: `${virtualizer?.getTotalSize?.() ?? 0}px` }">
                <div
                    v-for="vItem in virtualItems"
                    :key="String(vItem.virtualItem.key)"
                    class="absolute left-0 top-0 w-full box-border pb-2"
                    :data-index="vItem.virtualItem.index"
                    :ref="virtualizer.measureElement"
                    :style="{ transform: `translateY(${vItem.virtualItem.start}px)` }">
                    <div
                        class="grid gap-(--avatar-card-gap,12px) p-0.5"
                        :style="{
                            gridTemplateColumns: `repeat(var(--avatar-grid-columns, 1), minmax(var(--avatar-card-min-width, 200px), var(--avatar-card-target-width, 1fr)))`,
                            ...gridStyle(filteredAvatars.length)
                        }">
                        <MyAvatarCard
                            v-for="avatar in vItem.row.items"
                            :key="avatar.id"
                            v-memo="[currentAvatarId, cardScale]"
                            :avatar="avatar"
                            :current-avatar-id="currentAvatarId"
                            :card-scale="cardScale"
                            @click="handleWearAvatar(avatar.id)"
                            @context-action="handleContextMenuAction" />
                    </div>
                </div>
            </div>
            <div v-else class="grid place-items-center min-h-60 text-[15px]">
                <DataTableEmpty type="nomatch" />
            </div>
        </div>

        <input
            ref="imageUploadInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="onFileChangeAvatarImage" />
        <ImageCropDialog
            :open="cropDialogOpen"
            :title="t('dialog.change_content_image.avatar')"
            :aspect-ratio="4 / 3"
            :file="cropDialogFile"
            @update:open="cropDialogOpen = $event"
            @confirm="onCropConfirmAvatar" />
        <ManageTagsDialog
            v-model:open="manageTagsOpen"
            :avatar-name="manageTagsAvatar?.name || ''"
            :avatar-id="manageTagsAvatar?.id || ''"
            :initial-tags="manageTagsAvatar?.$tags || []"
            @save="onSaveTags" />
    </div>
</template>

<script setup>
    import {
        Check,
        Eye,
        Image as ImageIcon,
        LayoutGrid,
        List,
        ListFilter,
        Pencil,
        RefreshCw,
        Settings as SettingsIcon,
        Tag,
        User
    } from 'lucide-vue-next';
    import { computed, nextTick, onBeforeMount, onMounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    import { useAppearanceSettingsStore, useAvatarStore, useModalStore, useUserStore } from '../../stores';
    import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../../components/ui/context-menu';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
    import { Field, FieldContent, FieldLabel } from '../../components/ui/field';
    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { applyAvatar, selectAvatarWithoutConfirmation, showAvatarDialog } from '../../coordinators/avatarCoordinator';
    import {
        handleImageUploadInput,
        resizeImageToFitLimits,
        uploadImageLegacy
    } from '../../coordinators/imageUploadCoordinator';
    import { DataTableEmpty, DataTableLayout } from '../../components/ui/data-table';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { readFileAsBase64, withUploadTimeout } from '../../shared/utils/imageUpload';
    import { Badge } from '../../components/ui/badge';
    import { Button } from '../../components/ui/button';
    import { Input } from '../../components/ui/input';
    import { Slider } from '../../components/ui/slider';
    import { TooltipWrapper } from '../../components/ui/tooltip';
    import { avatarRequest } from '../../api';
    import { database } from '../../services/database';
    import { getColumns } from './columns';
    import { getPlatformInfo } from '../../shared/utils/avatar';
    import { getTagColor } from '../../shared/constants';
    import { processBulk } from '../../services/request';
    import { useAvatarCardGrid } from './composables/useAvatarCardGrid';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    import ImageCropDialog from '../../components/dialogs/ImageCropDialog.vue';
    import ManageTagsDialog from './ManageTagsDialog.vue';
    import MyAvatarCard from './components/MyAvatarCard.vue';
    import configRepository from '../../services/config.js';

    const { t } = useI18n();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const avatarStore = useAvatarStore();
    const modalStore = useModalStore();

    const { currentUser } = storeToRefs(useUserStore());

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    const containerRef = ref(null);
    const searchText = ref('');
    const releaseStatusFilter = ref('all');
    const tagFilters = ref(new Set());
    const platformFilter = ref('all');
    const isLoading = ref(false);
    const avatars = ref([]);
    const avatarTagsMap = ref(new Map());
    const imageUploadInput = ref(null);
    const viewMode = ref('grid');
    const gridScrollRef = ref(null);
    const gridContainerRefEl = ref(null);
    const cropDialogOpen = ref(false);
    const cropDialogFile = ref(null);
    const changeImageAvatarRef = ref(null);
    const manageTagsOpen = ref(false);
    const manageTagsAvatar = ref(null);



    const allTags = computed(() => {
        const tagSet = new Set();
        for (const tags of avatarTagsMap.value.values()) {
            for (const entry of tags) {
                tagSet.add(entry.tag);
            }
        }
        return Array.from(tagSet).sort();
    });

    const releaseStatusOptions = [
        { value: 'all', label: t('view.search.avatar.all') },
        { value: 'public', label: t('view.search.avatar.public') },
        { value: 'private', label: t('view.search.avatar.private') }
    ];

    const platformOptions = [
        { value: 'pc', label: 'PC' },
        { value: 'android', label: 'Android' },
        { value: 'ios', label: 'iOS' }
    ];

    const activeFilterCount = computed(() => {
        let count = 0;
        if (releaseStatusFilter.value !== 'all') count++;
        count += tagFilters.value.size;
        if (platformFilter.value !== 'all') count++;
        return count;
    });

    /**
     *
     * @param tag
     */
    function toggleTagFilter(tag) {
        const next = new Set(tagFilters.value);
        if (next.has(tag)) next.delete(tag);
        else next.add(tag);
        tagFilters.value = next;
    }

    /**
     *
     */
    function clearFilters() {
        releaseStatusFilter.value = 'all';
        tagFilters.value = new Set();
        platformFilter.value = 'all';
    }

    const filteredAvatars = computed(() => {
        let list = avatars.value;

        if (releaseStatusFilter.value === 'public') {
            list = list.filter((a) => a.releaseStatus === 'public');
        } else if (releaseStatusFilter.value === 'private') {
            list = list.filter((a) => a.releaseStatus === 'private');
        }

        if (tagFilters.value.size) {
            list = list.filter((a) => a.$tags?.some((t) => tagFilters.value.has(t.tag)));
        }

        if (platformFilter.value !== 'all') {
            list = list.filter((a) => {
                const info = getPlatformInfo(a.unityPackages);
                return !!info[platformFilter.value]?.performanceRating;
            });
        }

        // search filter
        if (searchText.value) {
            const query = searchText.value.toLowerCase();
            list = list.filter(
                (a) => a.name?.toLowerCase().includes(query) || a.$tags?.some((t) => t.tag.toLowerCase().includes(query))
            );
        }

        return list;
    });

    /**
     *
     * @param avatarId
     */
    function handleShowAvatarDialog(avatarId) {
        showAvatarDialog(avatarId);
    }

    /**
     *
     * @param avatarId
     */
    function handleWearAvatar(avatarId) {
        if (currentUser.value.currentAvatar === avatarId) {
            return;
        }
        const avatar = avatars.value.find((a) => a.id === avatarId);
        const avatarName = avatar?.name || avatarId;
        modalStore
            .confirm({
                title: t('confirm.title'),
                description: `${t('confirm.select_avatar')}\n${avatarName}`
            })
            .then(({ ok }) => {
                if (ok) {
                    selectAvatarWithoutConfirmation(avatarId);
                }
            });
    }

    /**
     *
     * @param command
     * @param labelKey
     * @param fn
     */
    function confirmAndRun(command, labelKey, fn) {
        modalStore
            .confirm({
                title: t('confirm.title'),
                description: t('confirm.command_question', {
                    command: t(labelKey)
                })
            })
            .then(({ ok }) => {
                if (ok) fn();
            });
    }

    /**
     *
     * @param action
     * @param avatarRef
     */
    function handleContextMenuAction(action, avatarRef) {
        switch (action) {
            case 'details':
                showAvatarDialog(avatarRef.id);
                break;
            case 'wear':
                handleWearAvatar(avatarRef.id);
                break;
            case 'makePrivate':
                confirmAndRun(action, 'dialog.avatar.actions.make_private', () => {
                    avatarRequest.saveAvatar({ id: avatarRef.id, releaseStatus: 'private' }).then((args) => {
                        applyAvatar(args.json);
                        toast.success(t('message.avatar.updated_private'));
                        refreshAvatars();
                    });
                });
                break;
            case 'makePublic':
                confirmAndRun(action, 'dialog.avatar.actions.make_public', () => {
                    avatarRequest.saveAvatar({ id: avatarRef.id, releaseStatus: 'public' }).then((args) => {
                        applyAvatar(args.json);
                        toast.success(t('message.avatar.updated_public'));
                        refreshAvatars();
                    });
                });
                break;
            case 'rename':
                modalStore
                    .prompt({
                        title: t('prompt.rename_avatar.header'),
                        description: t('prompt.rename_avatar.description'),
                        confirmText: t('prompt.rename_avatar.ok'),
                        cancelText: t('prompt.rename_avatar.cancel'),
                        inputValue: avatarRef.name,
                        errorMessage: t('prompt.rename_avatar.input_error')
                    })
                    .then(({ ok, value }) => {
                        if (!ok) return;
                        if (value && value !== avatarRef.name) {
                            avatarRequest.saveAvatar({ id: avatarRef.id, name: value }).then((args) => {
                                applyAvatar(args.json);
                                toast.success(t('prompt.rename_avatar.message.success'));
                                refreshAvatars();
                            });
                        }
                    })
                    .catch(() => {});
                break;
            case 'changeDescription':
                modalStore
                    .prompt({
                        title: t('prompt.change_avatar_description.header'),
                        description: t('prompt.change_avatar_description.description'),
                        confirmText: t('prompt.change_avatar_description.ok'),
                        cancelText: t('prompt.change_avatar_description.cancel'),
                        inputValue: avatarRef.description,
                        errorMessage: t('prompt.change_avatar_description.input_error')
                    })
                    .then(({ ok, value }) => {
                        if (!ok) return;
                        if (value && value !== avatarRef.description) {
                            avatarRequest.saveAvatar({ id: avatarRef.id, description: value }).then((args) => {
                                applyAvatar(args.json);
                                toast.success(t('prompt.change_avatar_description.message.success'));
                                refreshAvatars();
                            });
                        }
                    })
                    .catch(() => {});
                break;
            case 'createImpostor':
                confirmAndRun(action, 'dialog.avatar.actions.create_impostor', () => {
                    avatarRequest.createImposter({ avatarId: avatarRef.id }).then(() => {
                        toast.success(t('message.avatar.impostor_queued'));
                    });
                });
                break;
            case 'changeImage':
                changeImageAvatarRef.value = avatarRef;
                imageUploadInput.value?.click();
                break;
            case 'manageTags':
                manageTagsAvatar.value = avatarRef;
                manageTagsOpen.value = true;
                break;
            case 'changeTags':
            case 'changeStyles':
                showAvatarDialog(avatarRef.id);
                break;
        }
    }

    /**
     *
     * @param root0
     * @param root0.avatarId
     * @param root0.tags
     */
    async function onSaveTags({ avatarId, tags: newEntries }) {
        const avatar = avatars.value.find((a) => a.id === avatarId);
        const oldEntries = avatar?.$tags || [];
        const oldMap = new Map(oldEntries.map((e) => [e.tag, e]));
        const newMap = new Map(newEntries.map((e) => [e.tag, e]));

        for (const [name] of oldMap) {
            if (!newMap.has(name)) {
                await database.removeAvatarTag(avatarId, name);
            }
        }

        for (const [name, entry] of newMap) {
            const old = oldMap.get(name);
            if (!old) {
                await database.addAvatarTag(avatarId, name, entry.color);
            } else if (old.color !== entry.color) {
                await database.updateAvatarTagColor(avatarId, name, entry.color);
            }
        }

        if (avatar) {
            avatar.$tags = newEntries;
        }
        avatarTagsMap.value.set(avatarId, newEntries);
        avatarTagsMap.value = new Map(avatarTagsMap.value);
    }

    /**
     *
     * @param e
     */
    function onFileChangeAvatarImage(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: imageUploadInput.value,
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        clearInput();
        cropDialogFile.value = file;
        cropDialogOpen.value = true;
    }

    /**
     *
     * @param blob
     */
    async function onCropConfirmAvatar(blob) {
        const avatarRef = changeImageAvatarRef.value;
        if (!avatarRef) return;
        try {
            await withUploadTimeout(
                (async () => {
                    const base64Body = await readFileAsBase64(blob);
                    const base64File = await resizeImageToFitLimits(base64Body);
                    if (typeof LINUX !== 'undefined' && LINUX) {
                        const args = await avatarRequest.uploadAvatarImage(base64File);
                        const fileUrl = args.json.versions[args.json.versions.length - 1].file.url;
                        await avatarRequest.saveAvatar({
                            id: avatarRef.id,
                            imageUrl: fileUrl
                        });
                    } else {
                        await uploadImageLegacy('avatar', {
                            entityId: avatarRef.id,
                            imageUrl: avatarRef.imageUrl,
                            base64File,
                            blob
                        });
                    }
                })()
            );
            toast.success(t('message.upload.success'));
            refreshAvatars();
        } catch (error) {
            console.error('avatar image upload process failed:', error);
            toast.error(t('message.upload.error'));
        } finally {
            cropDialogOpen.value = false;
            changeImageAvatarRef.value = null;
        }
    }

    const currentAvatarId = computed(() => currentUser.value?.currentAvatar);

    // --- Grid view ---
    const {
        cardScale,
        cardSpacing,
        cardScalePercent,
        cardSpacingPercent,
        cardScaleValue,
        cardSpacingValue,
        scaleSlider,
        spacingSlider,
        gridContainerRef,
        gridStyle,
        chunkIntoRows,
        estimateRowHeight,
        updateContainerWidth
    } = useAvatarCardGrid();

    const gridRows = computed(() => chunkIntoRows(filteredAvatars.value, 'avatar-row'));

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: gridRows.value.length,
            getScrollElement: () => gridScrollRef.value,
            estimateSize: (index) => estimateRowHeight(gridRows.value[index]?.items?.length ?? 0),
            overscan: 5
        }))
    );

    const virtualItems = computed(() => {
        const items = virtualizer.value?.getVirtualItems?.() ?? [];
        return items.map((virtualItem) => ({
            virtualItem,
            row: gridRows.value[virtualItem.index]
        }));
    });

    watch(gridContainerRefEl, (el) => {
        gridContainerRef.value = el;
    });
    watch([cardScale, cardSpacing, gridRows], () => {
        nextTick(() => {
            updateContainerWidth();
            virtualizer.value?.measure?.();
        });
    });

    /**
     *
     * @param value
     */
    function handleViewModeChange(value) {
        if (value) {
            viewMode.value = value;
            configRepository.setString('VRCX_MyAvatarsViewMode', value);
            if (value === 'grid') {
                nextTick(() => {
                    updateContainerWidth();
                    virtualizer.value?.measure?.();
                });
            }
        }
    }

    const columns = getColumns({
        onShowAvatarDialog: handleShowAvatarDialog,
        onContextMenuAction: handleContextMenuAction,
        currentAvatarId
    });

    /**
     *
     * @param row
     */
    function handleRowClick(row) {
        handleShowAvatarDialog(row.original.id);
    }

    /**
     *
     * @param row
     */
    function getRowClass(row) {
        if (row.original.id === currentAvatarId.value) {
            return 'bg-primary/10 hover:bg-primary/15';
        }
        return '';
    }

    const { table, pagination } = useVrcxVueTable({
        get data() {
            return filteredAvatars.value;
        },
        persistKey: 'my-avatars',
        columns,
        initialSorting: [{ id: 'updated_at', desc: true }],
        initialPagination: {
            pageIndex: 0,
            pageSize: appearanceSettingsStore.tablePageSize
        }
    });

    const handlePageSizeChange = (size) => {
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
    };

    /**
     *
     */
    async function refreshAvatars() {
        if (isLoading.value) {
            return;
        }
        isLoading.value = true;

        const map = new Map();
        const params = {
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            releaseStatus: 'all',
            user: 'me'
        };

        await processBulk({
            fn: avatarRequest.getAvatars,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const ref = applyAvatar(json);
                    map.set(ref.id, ref);
                }
            },
            done: async () => {
                const list = Array.from(map.values());
                const currentAvatarId = currentUser.value.currentAvatar;
                const swapTime = currentUser.value.$previousAvatarSwapTime;
                const tagsMap = await database.getAllAvatarTags();
                avatarTagsMap.value = tagsMap;
                await Promise.all(
                    list.map(async (ref) => {
                        const aviTime = await database.getAvatarTimeSpent(ref.id);
                        ref.$timeSpent = aviTime.timeSpent;
                        if (ref.id === currentAvatarId && swapTime) {
                            ref.$timeSpent += Date.now() - swapTime;
                        }
                        ref.$tags = tagsMap.get(ref.id) || [];
                    })
                );
                avatars.value = list;
                isLoading.value = false;
            }
        });
    }

    onBeforeMount(async () => {
        try {
            const storedMode = await configRepository.getString('VRCX_MyAvatarsViewMode', 'grid');
            if (storedMode === 'grid' || storedMode === 'table') {
                viewMode.value = storedMode;
            }
        } catch (error) {
            console.error('Failed to load view mode preference', error);
        }
    });

    onMounted(() => {
        refreshAvatars();
    });
</script>

<style scoped>
    :deep(.avatar-table-thumbnail) {
        filter: saturate(0.8) contrast(0.8);
        transition: filter 0.2s ease;
    }

    :deep(tr:hover .avatar-table-thumbnail) {
        filter: saturate(1) contrast(1);
    }
</style>
