<template>
    <Dialog v-model:open="isDialogVisible">
        <DialogContent class="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.friend_export.header') }}</DialogTitle>
            </DialogHeader>
            <Select
                :model-value="friendExportFavoriteGroupSelection"
                @update:modelValue="handleFriendExportGroupSelect">
                <SelectTrigger size="sm">
                    <SelectValue placeholder="All Favorites" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem :value="FRIEND_EXPORT_ALL_VALUE">None</SelectItem>
                        <SelectItem
                            v-for="groupAPI in favoriteFriendGroups"
                            :key="groupAPI.name"
                            :value="groupAPI.name">
                            {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <Select
                class="mt-4"
                :model-value="friendExportLocalFavoriteGroupSelection"
                @update:modelValue="handleFriendExportLocalGroupSelect">
                <SelectTrigger size="sm">
                    <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem :value="FRIEND_EXPORT_NONE_VALUE">None</SelectItem>
                        <SelectItem v-for="group in localFriendFavoriteGroups" :key="group" :value="group">
                            {{ group }} ({{ localFriendFavorites[group].length }})
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <br />

            <InputGroupTextareaField
                v-model="friendExportContent"
                :rows="15"
                readonly
                input-class="resize-none mt-4"
                @click="handleCopyFriendExportData" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useUserStore } from '../../../stores';
    import { formatCsvField } from '../../../shared/utils';

    const { t } = useI18n();

    const props = defineProps({
        friendExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:friendExportDialogVisible']);

    const {
        favoriteFriends,
        favoriteFriendGroups,
        localFriendFavorites,
        localFriendFavoriteGroups,
        localFriendFavoritesList
    } = storeToRefs(useFavoriteStore());
    const { cachedUsers } = storeToRefs(useUserStore());

    const friendExportContent = ref('');
    const friendExportFavoriteGroup = ref(null);
    const friendExportLocalFavoriteGroup = ref(null);

    const FRIEND_EXPORT_ALL_VALUE = '__all__';
    const FRIEND_EXPORT_NONE_VALUE = '__none__';

    const friendExportFavoriteGroupSelection = ref(FRIEND_EXPORT_ALL_VALUE);
    const friendExportLocalFavoriteGroupSelection = ref(FRIEND_EXPORT_NONE_VALUE);

    const isDialogVisible = computed({
        get() {
            return props.friendExportDialogVisible;
        },
        set(value) {
            emit('update:friendExportDialogVisible', value);
        }
    });

    watch(
        () => props.friendExportDialogVisible,
        (value) => {
            if (value) {
                showFriendExportDialog();
            }
        }
    );

    /**
     *
     */
    function showFriendExportDialog() {
        friendExportFavoriteGroup.value = null;
        friendExportFavoriteGroupSelection.value = FRIEND_EXPORT_ALL_VALUE;
        updateFriendExportDialog();
    }

    /**
     *
     * @param value
     */
    function handleFriendExportGroupSelect(value) {
        friendExportFavoriteGroupSelection.value = value;
        if (value === FRIEND_EXPORT_ALL_VALUE) {
            selectFriendExportGroup(null);
            return;
        }
        const group = favoriteFriendGroups.value.find((g) => g.name === value) || null;
        selectFriendExportGroup(group);
    }

    /**
     *
     * @param value
     */
    function handleFriendExportLocalGroupSelect(value) {
        friendExportLocalFavoriteGroupSelection.value = value;
        if (value === FRIEND_EXPORT_NONE_VALUE) {
            selectFriendExportLocalGroup(null);
            return;
        }
        selectFriendExportLocalGroup(value);
    }

    /**
     *
     * @param event
     */
    function handleCopyFriendExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(friendExportContent.value)
            .then(() => {
                toast.success('Copied successfully!', { duration: 2000 });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                toast.error('Copy failed!');
            });
    }

    /**
     *
     */
    function updateFriendExportDialog() {
        const lines = ['UserID,Name'];

        if (friendExportFavoriteGroup.value) {
            favoriteFriendGroups.value.forEach((group) => {
                if (friendExportFavoriteGroup.value === group) {
                    favoriteFriends.value.forEach((ref) => {
                        if (group.key === ref.groupKey) {
                            lines.push(`${formatCsvField(ref.id)},${formatCsvField(ref.name)}`);
                        }
                    });
                }
            });
        } else if (friendExportLocalFavoriteGroup.value) {
            const favoriteGroup = localFriendFavorites.value[friendExportLocalFavoriteGroup.value];
            if (!favoriteGroup) {
                return;
            }
            favoriteGroup.forEach((userId) => {
                const ref = cachedUsers.value.get(userId);
                if (typeof ref !== 'undefined') {
                    lines.push(`${formatCsvField(ref.id)},${formatCsvField(ref.displayName)}`);
                }
            });
        } else {
            // export all
            favoriteFriends.value.forEach((ref) => {
                lines.push(`${formatCsvField(ref.id)},${formatCsvField(ref.name)}`);
            });
            for (let i = 0; i < localFriendFavoritesList.value.length; ++i) {
                const userId = localFriendFavoritesList.value[i];
                const ref = cachedUsers.value.get(userId);
                if (typeof ref !== 'undefined') {
                    lines.push(`${formatCsvField(ref.id)},${formatCsvField(ref.displayName)}`);
                }
            }
        }
        friendExportContent.value = lines.reverse().join('\n');
    }

    /**
     *
     * @param group
     */
    function selectFriendExportGroup(group) {
        friendExportFavoriteGroup.value = group;
        friendExportLocalFavoriteGroup.value = null;
        friendExportFavoriteGroupSelection.value = group?.name ?? FRIEND_EXPORT_ALL_VALUE;
        friendExportLocalFavoriteGroupSelection.value = FRIEND_EXPORT_NONE_VALUE;
        updateFriendExportDialog();
    }

    /**
     *
     * @param groupName
     */
    function selectFriendExportLocalGroup(groupName) {
        friendExportLocalFavoriteGroup.value = groupName;
        friendExportFavoriteGroup.value = null;
        friendExportFavoriteGroupSelection.value = FRIEND_EXPORT_ALL_VALUE;
        friendExportLocalFavoriteGroupSelection.value = groupName ?? FRIEND_EXPORT_NONE_VALUE;
        updateFriendExportDialog();
    }
</script>
