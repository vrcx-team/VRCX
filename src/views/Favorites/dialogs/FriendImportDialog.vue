<template>
    <Dialog v-model:open="isVisible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.friend_import.header') }}</DialogTitle>
            </DialogHeader>
            <div style="display: flex; align-items: center; justify-content: space-between">
                <div style="font-size: 12px">{{ t('dialog.friend_import.description') }}</div>
                <div style="display: flex; align-items: center">
                    <div v-if="friendImportDialog.progress">
                        {{ t('dialog.friend_import.process_progress') }} {{ friendImportDialog.progress }} /
                        {{ friendImportDialog.progressTotal }}
                        <Loader2 style="margin: 0 5px" />
                    </div>
                    <Button v-if="friendImportDialog.loading" size="sm" variant="secondary" @click="cancelFriendImport">
                        {{ t('dialog.friend_import.cancel') }}
                    </Button>
                    <Button size="sm" v-else :disabled="!friendImportDialog.input" @click="processFriendImportList">
                        {{ t('dialog.friend_import.process_list') }}
                    </Button>
                </div>
            </div>
            <InputGroupTextareaField
                v-model="friendImportDialog.input"
                :rows="10"
                style="margin-top: 10px"
                input-class="resize-none" />
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px">
                <div>
                    <Select
                        :model-value="friendImportFavoriteGroupSelection"
                        @update:modelValue="handleFriendImportGroupSelect">
                        <SelectTrigger size="sm">
                            <SelectValue :placeholder="t('dialog.friend_import.select_group_placeholder')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="groupAPI in favoriteFriendGroups"
                                    :key="groupAPI.name"
                                    :value="groupAPI.name"
                                    :disabled="groupAPI.count >= groupAPI.capacity">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <span v-if="friendImportDialog.friendImportFavoriteGroup" style="margin-left: 5px">
                        {{ friendImportTable.data.length }} /
                        {{
                            friendImportDialog.friendImportFavoriteGroup.capacity -
                            friendImportDialog.friendImportFavoriteGroup.count
                        }}
                    </span>
                </div>
                <div>
                    <Button
                        size="sm"
                        class="mr-2"
                        variant="secondary"
                        :disabled="friendImportTable.data.length === 0"
                        @click="clearFriendImportTable">
                        {{ t('dialog.friend_import.clear_table') }}
                    </Button>
                    <Button
                        size="sm"
                        :disabled="friendImportTable.data.length === 0 || !friendImportDialog.friendImportFavoriteGroup"
                        @click="importFriendImportTable">
                        {{ t('dialog.friend_import.import') }}
                    </Button>
                </div>
            </div>
            <span v-if="friendImportDialog.importProgress" style="margin: 10px">
                <Loader2 style="margin-right: 5px" />
                {{ t('dialog.friend_import.import_progress') }} {{ friendImportDialog.importProgress }}/{{
                    friendImportDialog.importProgressTotal
                }}
            </span>
            <br />
            <template v-if="friendImportDialog.errors">
                <Button size="sm" variant="secondary" @click="friendImportDialog.errors = ''">
                    {{ t('dialog.friend_import.clear_errors') }}
                </Button>
                <h2 style="font-weight: bold; margin: 5px 0">{{ t('dialog.friend_import.errors') }}</h2>
                <pre style="white-space: pre-wrap; font-size: 12px" v-text="friendImportDialog.errors"></pre>
            </template>
            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="friendImportDialog.loading"
                :table-style="tableStyle"
                :show-pagination="false"
                style="margin-top: 10px" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Loader2 } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { removeFromArray, userImage, userImageFull } from '../../../shared/utils';
    import { useFavoriteStore, useGalleryStore, useUserStore } from '../../../stores';
    import { favoriteRequest, userRequest } from '../../../api';
    import { createColumns } from './friendImportColumns.jsx';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    const { t } = useI18n();

    const emit = defineEmits(['update:friendImportDialogInput']);

    const { showUserDialog } = useUserStore();
    const { favoriteFriendGroups, friendImportDialogInput, friendImportDialogVisible } =
        storeToRefs(useFavoriteStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { getCachedFavoritesByObjectId } = useFavoriteStore();

    const friendImportDialog = ref({
        loading: false,
        progress: 0,
        progressTotal: 0,
        input: '',
        userIdList: new Set(),
        errors: '',
        friendImportFavoriteGroup: null,
        importProgress: 0,
        importProgressTotal: 0
    });

    const friendImportFavoriteGroupSelection = ref('');

    const friendImportTable = ref({
        data: [],
        layout: 'table'
    });

    const tableStyle = { maxHeight: '400px' };

    const rows = computed(() =>
        Array.isArray(friendImportTable.value?.data) ? friendImportTable.value.data.slice() : []
    );

    const columns = computed(() =>
        createColumns({
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onDelete: deleteItemFriendImport
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'friendImportDialog',
        get data() {
            return rows.value;
        },
        columns: columns.value,
        getRowId: (row) => String(row?.id ?? ''),
        enablePagination: false,
        enableSorting: false
    });

    const isVisible = computed({
        get() {
            return friendImportDialogVisible.value;
        },
        set(value) {
            friendImportDialogVisible.value = value;
        }
    });

    watch(
        () => friendImportDialogVisible.value,
        (value) => {
            if (value) {
                clearFriendImportTable();
                resetFriendImport();
                friendImportFavoriteGroupSelection.value =
                    friendImportDialog.value.friendImportFavoriteGroup?.name ?? '';
                if (friendImportDialogInput.value) {
                    friendImportDialog.value.input = friendImportDialogInput.value;
                    processFriendImportList();
                    emit('update:friendImportDialogInput', '');
                }
            }
        }
    );

    function handleFriendImportGroupSelect(value) {
        friendImportFavoriteGroupSelection.value = value;
        const group = favoriteFriendGroups.value.find((g) => g.name === value) || null;
        if (group) {
            selectFriendImportGroup(group);
        }
    }

    function cancelFriendImport() {
        friendImportDialog.value.loading = false;
    }
    function deleteItemFriendImport(ref) {
        removeFromArray(friendImportTable.value.data, ref);
        friendImportDialog.value.userIdList.delete(ref.id);
    }
    function clearFriendImportTable() {
        friendImportTable.value.data = [];
        friendImportDialog.value.userIdList = new Set();
    }
    function selectFriendImportGroup(group) {
        friendImportDialog.value.friendImportFavoriteGroup = group;
        friendImportFavoriteGroupSelection.value = group?.name ?? '';
    }
    async function importFriendImportTable() {
        const D = friendImportDialog.value;
        D.loading = true;
        if (!D.friendImportFavoriteGroup) {
            return;
        }
        const data = [...friendImportTable.value.data].reverse();
        D.importProgressTotal = data.length;
        let ref = null;
        try {
            for (let i = data.length - 1; i >= 0; i--) {
                if (!D.loading || !isVisible.value) {
                    break;
                }
                ref = data[i];
                if (getCachedFavoritesByObjectId(ref.id)) {
                    throw new Error('Friend is already in favorites');
                }
                await addFavoriteUser(ref, D.friendImportFavoriteGroup, false);
                removeFromArray(friendImportTable.value.data, ref);
                D.userIdList.delete(ref.id);
                D.importProgress++;
            }
        } catch (err) {
            D.errors = `Name: ${ref?.displayName}\nUserId: ${ref?.id}\n${err}\n\n`;
        } finally {
            D.importProgress = 0;
            D.importProgressTotal = 0;
            D.loading = false;
        }
    }
    function addFavoriteUser(ref, group, message) {
        return favoriteRequest
            .addFavorite({
                type: group.type,
                favoriteId: ref.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    toast.success('Friend added to favorites');
                }
                return args;
            });
    }
    async function processFriendImportList() {
        const D = friendImportDialog.value;
        D.loading = true;
        const regexFriendId = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match = [];
        const userIdList = new Set();
        while ((match = regexFriendId.exec(D.input)) !== null) {
            userIdList.add(match[0]);
        }
        D.input = '';
        D.errors = '';
        D.progress = 0;
        D.progressTotal = userIdList.size;
        const data = Array.from(userIdList);
        for (let i = 0; i < data.length; ++i) {
            if (!isVisible.value) {
                resetFriendImport();
            }
            if (!D.loading || !isVisible.value) {
                break;
            }
            const userId = data[i];
            if (!D.userIdList.has(userId)) {
                try {
                    const args = await userRequest.getUser({
                        userId
                    });
                    friendImportTable.value.data.push(args.ref);
                    D.userIdList.add(userId);
                } catch (err) {
                    D.errors = D.errors.concat(`UserId: ${userId}\n${err}\n\n`);
                }
            }
            D.progress++;
            if (D.progress === userIdList.size) {
                D.progress = 0;
            }
        }
        D.loading = false;
    }
    function resetFriendImport() {
        friendImportDialog.value.input = '';
        friendImportDialog.value.errors = '';
    }
</script>
