<template>
    <el-dialog v-model="isDialogVisible" :title="t('dialog.avatar_export.header')" width="650px">
        <div style="margin-bottom: 10px" class="flex flex-col gap-2">
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
                :model-value="avatarExportLocalFavoriteGroupSelection"
                @update:modelValue="handleAvatarExportLocalFavoriteGroupSelect"
                style="margin-left: 10px">
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
        <el-input
            v-model="avatarExportContent"
            type="textarea"
            size="small"
            :rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click="handleCopyAvatarExportData"></el-input>
    </el-dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

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

    function showAvatarExportDialog() {
        avatarExportFavoriteGroup.value = null;
        avatarExportLocalFavoriteGroup.value = null;
        avatarExportFavoriteGroupSelection.value = AVATAR_EXPORT_ALL_VALUE;
        avatarExportLocalFavoriteGroupSelection.value = AVATAR_EXPORT_NONE_VALUE;
        updateAvatarExportDialog();
    }

    function handleAvatarExportFavoriteGroupSelect(value) {
        avatarExportFavoriteGroupSelection.value = value;
        if (value === AVATAR_EXPORT_ALL_VALUE) {
            selectAvatarExportGroup(null);
            return;
        }
        const group = favoriteAvatarGroups.value.find((g) => g.name === value) || null;
        selectAvatarExportGroup(group);
    }

    function handleAvatarExportLocalFavoriteGroupSelect(value) {
        avatarExportLocalFavoriteGroupSelection.value = value;
        if (value === AVATAR_EXPORT_NONE_VALUE) {
            selectAvatarExportLocalGroup(null);
            return;
        }
        selectAvatarExportLocalGroup(value);
    }
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
    function updateAvatarExportDialog() {
        const needsCsvQuotes = (text) => {
            for (let i = 0; i < text.length; i++) {
                if (text.charCodeAt(i) < 0x20) {
                    return true;
                }
            }
            return text.includes(',') || text.includes('"');
        };

        const formatter = function (value) {
            if (value === null || typeof value === 'undefined') {
                return '';
            }
            const text = String(value);
            if (needsCsvQuotes(text)) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        };
        const propsForQuery = exportSelectOptions.value
            .filter((option) => exportSelectedOptions.value.includes(option.label))
            .map((option) => option.value);

        function resText(ref) {
            let resArr = [];
            propsForQuery.forEach((e) => {
                resArr.push(formatter(ref?.[e]));
            });
            return resArr.join(',');
        }

        const lines = [exportSelectedOptions.value.join(',')];

        if (avatarExportFavoriteGroup.value) {
            favoriteAvatarGroups.value.forEach((group) => {
                if (!avatarExportFavoriteGroup.value || avatarExportFavoriteGroup.value === group) {
                    favoriteAvatars.value.forEach((ref) => {
                        if (group.key === ref.groupKey) {
                            lines.push(resText(ref.ref));
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
                lines.push(resText(ref));
            }
        } else {
            // export all
            favoriteAvatars.value.forEach((ref) => {
                lines.push(resText(ref.ref));
            });
            for (let i = 0; i < localAvatarFavoritesList.value.length; ++i) {
                const avatarId = localAvatarFavoritesList.value[i];
                const ref = cachedAvatars.get(avatarId);
                if (typeof ref !== 'undefined') {
                    lines.push(resText(ref));
                }
            }
        }
        avatarExportContent.value = lines.join('\n');
    }
    function selectAvatarExportGroup(group) {
        avatarExportFavoriteGroup.value = group;
        avatarExportLocalFavoriteGroup.value = null;
        avatarExportFavoriteGroupSelection.value = group?.name ?? AVATAR_EXPORT_ALL_VALUE;
        avatarExportLocalFavoriteGroupSelection.value = AVATAR_EXPORT_NONE_VALUE;
        updateAvatarExportDialog();
    }
    function selectAvatarExportLocalGroup(group) {
        avatarExportLocalFavoriteGroup.value = group;
        avatarExportFavoriteGroup.value = null;
        avatarExportLocalFavoriteGroupSelection.value = group ?? AVATAR_EXPORT_NONE_VALUE;
        avatarExportFavoriteGroupSelection.value = AVATAR_EXPORT_ALL_VALUE;
        updateAvatarExportDialog();
    }
</script>
