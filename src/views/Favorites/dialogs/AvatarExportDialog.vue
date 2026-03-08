<template>
    <Dialog v-model:open="isDialogVisible">
        <DialogContent class="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.avatar_export.header') }}</DialogTitle>
            </DialogHeader>

            <div class="flex flex-col gap-2 mb-2">
                <label v-for="option in exportSelectOptions" :key="option.value" class="inline-flex items-center gap-2">
                    <Checkbox
                        :model-value="exportSelectedOptions.includes(option.label)"
                        @update:modelValue="(val) => toggleAvatarExportOption(option.label, val)" />
                    <span>{{ option.label }}</span>
                </label>
            </div>

            <div class="flex items-center gap-2">
                <Select
                    :model-value="avatarExportFavoriteGroupSelection"
                    @update:modelValue="handleAvatarExportFavoriteGroupSelect">
                    <SelectTrigger size="sm">
                        <SelectValue placeholder="All Favorites" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem :value="AVATAR_EXPORT_ALL_VALUE">All Favorites</SelectItem>
                            <SelectItem
                                v-for="groupAPI in favoriteAvatarGroups"
                                :key="groupAPI.name"
                                :value="groupAPI.name">
                                {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Select
                    class="ml-2"
                    :model-value="avatarExportLocalFavoriteGroupSelection"
                    @update:modelValue="handleAvatarExportLocalFavoriteGroupSelect">
                    <SelectTrigger size="sm">
                        <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem :value="AVATAR_EXPORT_NONE_VALUE">None</SelectItem>
                            <SelectItem v-for="group in localAvatarFavoriteGroups" :key="group" :value="group">
                                {{ group }} ({{ localAvatarFavGroupLength(group) }})
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <br />
            <InputGroupTextareaField
                v-model="avatarExportContent"
                :rows="15"
                readonly
                input-class="resize-none mt-4"
                @click="handleCopyAvatarExportData" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { formatCsvField, formatCsvRow } from '../../../shared/utils';
    import { useAvatarStore, useFavoriteStore } from '../../../stores';

    const { t } = useI18n();

    const props = defineProps({
        avatarExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:avatarExportDialogVisible']);

    const {
        favoriteAvatars,
        favoriteAvatarGroups,
        localAvatarFavorites,
        localAvatarFavoritesList,
        localAvatarFavoriteGroups
    } = storeToRefs(useFavoriteStore());
    const { localAvatarFavGroupLength } = useFavoriteStore();
    const { cachedAvatars } = useAvatarStore();

    const avatarExportContent = ref('');
    const avatarExportFavoriteGroup = ref(null);
    const avatarExportLocalFavoriteGroup = ref(null);

    const AVATAR_EXPORT_ALL_VALUE = '__all__';
    const AVATAR_EXPORT_NONE_VALUE = '__none__';

    const avatarExportFavoriteGroupSelection = ref(AVATAR_EXPORT_ALL_VALUE);
    const avatarExportLocalFavoriteGroupSelection = ref(AVATAR_EXPORT_NONE_VALUE);
    const exportSelectedOptions = ref(['ID', 'Name']);
    const exportSelectOptions = ref([
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Author ID', value: 'authorId' },
        { label: 'Author Name', value: 'authorName' },
        { label: 'Thumbnail', value: 'thumbnailImageUrl' }
    ]);

    /**
     *
     * @param label
     * @param checked
     */
    function toggleAvatarExportOption(label, checked) {
        const selection = exportSelectedOptions.value;
        const index = selection.indexOf(label);
        if (checked && index === -1) {
            selection.push(label);
        } else if (!checked && index !== -1) {
            selection.splice(index, 1);
        }
        updateAvatarExportDialog();
    }

    const isDialogVisible = computed({
        get() {
            return props.avatarExportDialogVisible;
        },
        set(value) {
            emit('update:avatarExportDialogVisible', value);
        }
    });

    watch(
        () => props.avatarExportDialogVisible,
        (value) => {
            if (value) {
                showAvatarExportDialog();
            }
        }
    );

    /**
     *
     */
    function showAvatarExportDialog() {
        avatarExportFavoriteGroup.value = null;
        avatarExportLocalFavoriteGroup.value = null;
        avatarExportFavoriteGroupSelection.value = AVATAR_EXPORT_ALL_VALUE;
        avatarExportLocalFavoriteGroupSelection.value = AVATAR_EXPORT_NONE_VALUE;
        updateAvatarExportDialog();
    }

    /**
     *
     * @param value
     */
    function handleAvatarExportFavoriteGroupSelect(value) {
        avatarExportFavoriteGroupSelection.value = value;
        if (value === AVATAR_EXPORT_ALL_VALUE) {
            selectAvatarExportGroup(null);
            return;
        }
        const group = favoriteAvatarGroups.value.find((g) => g.name === value) || null;
        selectAvatarExportGroup(group);
    }

    /**
     *
     * @param value
     */
    function handleAvatarExportLocalFavoriteGroupSelect(value) {
        avatarExportLocalFavoriteGroupSelection.value = value;
        if (value === AVATAR_EXPORT_NONE_VALUE) {
            selectAvatarExportLocalGroup(null);
            return;
        }
        selectAvatarExportLocalGroup(value);
    }
    /**
     *
     * @param event
     */
    function handleCopyAvatarExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(avatarExportContent.value)
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
    function updateAvatarExportDialog() {
        const propsForQuery = exportSelectOptions.value
            .filter((option) => exportSelectedOptions.value.includes(option.label))
            .map((option) => option.value);

        const lines = [exportSelectedOptions.value.join(',')];

        if (avatarExportFavoriteGroup.value) {
            favoriteAvatarGroups.value.forEach((group) => {
                if (!avatarExportFavoriteGroup.value || avatarExportFavoriteGroup.value === group) {
                    favoriteAvatars.value.forEach((ref) => {
                        if (group.key === ref.groupKey) {
                            lines.push(formatCsvRow(ref.ref, propsForQuery));
                        }
                    });
                }
            });
        } else if (avatarExportLocalFavoriteGroup.value) {
            const favoriteGroup = localAvatarFavorites.value[avatarExportLocalFavoriteGroup.value];
            if (!favoriteGroup) {
                return;
            }
            for (let i = 0; i < favoriteGroup.length; ++i) {
                const ref = favoriteGroup[i];
                lines.push(formatCsvRow(ref, propsForQuery));
            }
        } else {
            // export all
            favoriteAvatars.value.forEach((ref) => {
                lines.push(formatCsvRow(ref.ref, propsForQuery));
            });
            for (let i = 0; i < localAvatarFavoritesList.value.length; ++i) {
                const avatarId = localAvatarFavoritesList.value[i];
                const ref = cachedAvatars.get(avatarId);
                if (typeof ref !== 'undefined') {
                    lines.push(formatCsvRow(ref, propsForQuery));
                }
            }
        }
        avatarExportContent.value = lines.reverse().join('\n');
    }
    /**
     *
     * @param group
     */
    function selectAvatarExportGroup(group) {
        avatarExportFavoriteGroup.value = group;
        avatarExportLocalFavoriteGroup.value = null;
        avatarExportFavoriteGroupSelection.value = group?.name ?? AVATAR_EXPORT_ALL_VALUE;
        avatarExportLocalFavoriteGroupSelection.value = AVATAR_EXPORT_NONE_VALUE;
        updateAvatarExportDialog();
    }
    /**
     *
     * @param group
     */
    function selectAvatarExportLocalGroup(group) {
        avatarExportLocalFavoriteGroup.value = group;
        avatarExportFavoriteGroup.value = null;
        avatarExportLocalFavoriteGroupSelection.value = group ?? AVATAR_EXPORT_NONE_VALUE;
        avatarExportFavoriteGroupSelection.value = AVATAR_EXPORT_ALL_VALUE;
        updateAvatarExportDialog();
    }
</script>
