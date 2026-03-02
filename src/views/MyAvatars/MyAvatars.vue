<template>
    <div class="x-container" ref="containerRef">
        <DataTableLayout
            :table="table"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="filteredAvatars.length"
            :on-page-size-change="handlePageSizeChange"
            :on-row-click="handleRowClick"
            :row-class="getRowClass"
            class="cursor-pointer">
            <template #toolbar>
                <div class="mb-2.5 flex items-center gap-2">
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
                        <PopoverContent class="w-auto p-3" align="start">
                            <div class="flex flex-col gap-3">
                                <Field>
                                    <FieldLabel>{{ t('dialog.avatar.tags.public') }}</FieldLabel>
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
                    <Button size="icon-sm" variant="ghost" :disabled="isLoading" @click="refreshAvatars">
                        <RefreshCw :class="{ 'animate-spin': isLoading }" />
                    </Button>
                </div>
            </template>
            <template #row-context-menu="{ row }">
                <ContextMenuContent>
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
    import { Image as ImageIcon, ListFilter, Pencil, RefreshCw, Tag, User } from 'lucide-vue-next';
    import { computed, onMounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        handleImageUploadInput,
        readFileAsBase64,
        resizeImageToFitLimits,
        uploadImageLegacy,
        withUploadTimeout
    } from '../../shared/utils/imageUpload';
    import { useAppearanceSettingsStore, useAvatarStore, useModalStore, useUserStore } from '../../stores';
    import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '../../components/ui/context-menu';
    import { Field, FieldContent, FieldLabel } from '../../components/ui/field';
    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group';
    import { Badge } from '../../components/ui/badge';
    import { Button } from '../../components/ui/button';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { Input } from '../../components/ui/input';
    import { avatarRequest } from '../../api';
    import { database } from '../../service/database';
    import { getColumns } from './columns';
    import { getPlatformInfo } from '../../shared/utils/avatar';
    import { getTagColor } from '../../shared/constants';
    import { processBulk } from '../../service/request';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    import ImageCropDialog from '../../components/dialogs/ImageCropDialog.vue';
    import ManageTagsDialog from './ManageTagsDialog.vue';

    const { t } = useI18n();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const avatarStore = useAvatarStore();
    const modalStore = useModalStore();
    const { showAvatarDialog, selectAvatarWithoutConfirmation, applyAvatar } = avatarStore;
    const { currentUser } = storeToRefs(useUserStore());

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() => appearanceSettingsStore.tablePageSize);

    const containerRef = ref(null);
    const searchText = ref('');
    const releaseStatusFilter = ref('all');
    const tagFilters = ref(new Set());
    const platformFilter = ref('all');
    const isLoading = ref(false);
    const avatars = ref([]);
    const avatarTagsMap = ref(new Map());
    const imageUploadInput = ref(null);
    const cropDialogOpen = ref(false);
    const cropDialogFile = ref(null);
    const changeImageAvatarRef = ref(null);
    const manageTagsOpen = ref(false);
    const manageTagsAvatar = ref(null);

    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(containerRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

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

    function toggleTagFilter(tag) {
        const next = new Set(tagFilters.value);
        if (next.has(tag)) next.delete(tag);
        else next.add(tag);
        tagFilters.value = next;
    }

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
            list = list.filter((a) => a.name?.toLowerCase().includes(query));
        }

        return list;
    });

    function handleShowAvatarDialog(avatarId) {
        showAvatarDialog(avatarId);
    }

    function handleWearAvatar(avatarId) {
        if (currentUser.value.currentAvatar === avatarId) {
            return;
        }
        selectAvatarWithoutConfirmation(avatarId);
    }

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

    const columns = getColumns({
        onShowAvatarDialog: handleShowAvatarDialog,
        onContextMenuAction: handleContextMenuAction,
        currentAvatarId
    });

    function handleRowClick(row) {
        handleWearAvatar(row.original.id);
    }

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
            pageSize: pageSize.value
        }
    });

    const handlePageSizeChange = (size) => {
        appearanceSettingsStore.setTablePageSize(size);
    };

    watch(pageSize, (size) => {
        if (pagination.value.pageSize === size) return;
        pagination.value = { ...pagination.value, pageIndex: 0, pageSize: size };
        table.setPageSize(size);
    });

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

    onMounted(() => {
        refreshAvatars();
    });
</script>
