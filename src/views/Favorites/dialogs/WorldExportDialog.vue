<template>
    <el-dialog v-model="isDialogVisible" :title="t('dialog.world_export.header')" width="650px">
        <div style="margin-bottom: 10px" class="flex flex-col gap-2">
            <label v-for="option in exportSelectOptions" :key="option.value" class="inline-flex items-center gap-2">
                <Checkbox
                    :model-value="exportSelectedOptions.includes(option.label)"
                    @update:modelValue="(val) => toggleWorldExportOption(option.label, val)" />
                <span>{{ option.label }}</span>
            </label>
        </div>

        <div class="flex items-center gap-2">
            <Select :model-value="worldExportFavoriteGroupSelection" @update:modelValue="handleWorldExportGroupSelect">
                <SelectTrigger size="sm">
                    <SelectValue placeholder="All Favorites" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem :value="WORLD_EXPORT_ALL_VALUE">None</SelectItem>
                        <SelectItem v-for="groupAPI in favoriteWorldGroups" :key="groupAPI.name" :value="groupAPI.name">
                            {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <Select
                :model-value="worldExportLocalFavoriteGroupSelection"
                @update:modelValue="handleWorldExportLocalGroupSelect"
                style="margin-left: 10px">
                <SelectTrigger size="sm">
                    <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem :value="WORLD_EXPORT_NONE_VALUE">None</SelectItem>
                        <SelectItem v-for="group in localWorldFavoriteGroups" :key="group" :value="group">
                            {{ group }} ({{ localWorldFavorites[group].length }})
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>

        <br />

        <el-input
            v-model="worldExportContent"
            type="textarea"
            size="small"
            :rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click="handleCopyWorldExportData"></el-input>
    </el-dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useWorldStore } from '../../../stores';

    const props = defineProps({
        worldExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:worldExportDialogVisible']);

    const { t } = useI18n();

    const {
        favoriteWorlds,
        favoriteWorldGroups,
        localWorldFavorites,
        localWorldFavoritesList,
        localWorldFavoriteGroups
    } = storeToRefs(useFavoriteStore());
    const { localWorldFavGroupLength } = useFavoriteStore();
    const { cachedWorlds } = useWorldStore();

    const worldExportContent = ref('');
    const worldExportFavoriteGroup = ref(null);
    const worldExportLocalFavoriteGroup = ref(null);

    const WORLD_EXPORT_ALL_VALUE = '__all__';
    const WORLD_EXPORT_NONE_VALUE = '__none__';

    const worldExportFavoriteGroupSelection = ref(WORLD_EXPORT_ALL_VALUE);
    const worldExportLocalFavoriteGroupSelection = ref(WORLD_EXPORT_NONE_VALUE);
    // Storage of selected filtering options for model and world export
    const exportSelectedOptions = ref(['ID', 'Name']);
    const exportSelectOptions = ref([
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Author ID', value: 'authorId' },
        { label: 'Author Name', value: 'authorName' },
        { label: 'Thumbnail', value: 'thumbnailImageUrl' }
    ]);

    function toggleWorldExportOption(label, checked) {
        const selection = exportSelectedOptions.value;
        const index = selection.indexOf(label);
        if (checked && index === -1) {
            selection.push(label);
        } else if (!checked && index !== -1) {
            selection.splice(index, 1);
        }
        updateWorldExportDialog();
    }

    const isDialogVisible = computed({
        get() {
            return props.worldExportDialogVisible;
        },
        set(value) {
            emit('update:worldExportDialogVisible', value);
        }
    });

    watch(
        () => props.worldExportDialogVisible,
        (value) => {
            if (value) {
                showWorldExportDialog();
            }
        }
    );

    function showWorldExportDialog() {
        worldExportFavoriteGroup.value = null;
        worldExportLocalFavoriteGroup.value = null;
        worldExportFavoriteGroupSelection.value = WORLD_EXPORT_ALL_VALUE;
        worldExportLocalFavoriteGroupSelection.value = WORLD_EXPORT_NONE_VALUE;
        updateWorldExportDialog();
    }

    function handleWorldExportGroupSelect(value) {
        worldExportFavoriteGroupSelection.value = value;
        if (value === WORLD_EXPORT_ALL_VALUE) {
            selectWorldExportGroup(null);
            return;
        }
        const group = favoriteWorldGroups.value.find((g) => g.name === value) || null;
        selectWorldExportGroup(group);
    }

    function handleWorldExportLocalGroupSelect(value) {
        worldExportLocalFavoriteGroupSelection.value = value;
        if (value === WORLD_EXPORT_NONE_VALUE) {
            selectWorldExportLocalGroup(null);
            return;
        }
        selectWorldExportLocalGroup(value);
    }

    function handleCopyWorldExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(worldExportContent.value)
            .then(() => {
                toast.success('Copied successfully!', { duration: 2000 });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                toast.error('Copy failed!');
            });
    }

    function updateWorldExportDialog() {
        const formatter = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
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

        if (worldExportFavoriteGroup.value) {
            favoriteWorldGroups.value.forEach((group) => {
                if (worldExportFavoriteGroup.value === group) {
                    favoriteWorlds.value.forEach((ref) => {
                        if (group.key === ref.groupKey) {
                            lines.push(resText(ref.ref));
                        }
                    });
                }
            });
        } else if (worldExportLocalFavoriteGroup.value) {
            const favoriteGroup = localWorldFavorites.value[worldExportLocalFavoriteGroup.value];
            if (!favoriteGroup) {
                return;
            }
            for (let i = 0; i < favoriteGroup.length; ++i) {
                const ref = favoriteGroup[i];
                lines.push(resText(ref));
            }
        } else {
            // export all
            favoriteWorlds.value.forEach((ref) => {
                lines.push(resText(ref.ref));
            });
            for (let i = 0; i < localWorldFavoritesList.length; ++i) {
                const worldId = localWorldFavoritesList[i];
                const ref = cachedWorlds.get(worldId);
                if (typeof ref !== 'undefined') {
                    lines.push(resText(ref));
                }
            }
        }
        worldExportContent.value = lines.join('\n');
    }

    function selectWorldExportGroup(group) {
        worldExportFavoriteGroup.value = group;
        worldExportLocalFavoriteGroup.value = null;
        worldExportFavoriteGroupSelection.value = group?.name ?? WORLD_EXPORT_ALL_VALUE;
        worldExportLocalFavoriteGroupSelection.value = WORLD_EXPORT_NONE_VALUE;
        updateWorldExportDialog();
    }

    function selectWorldExportLocalGroup(group) {
        worldExportLocalFavoriteGroup.value = group;
        worldExportFavoriteGroup.value = null;
        worldExportLocalFavoriteGroupSelection.value = group ?? WORLD_EXPORT_NONE_VALUE;
        worldExportFavoriteGroupSelection.value = WORLD_EXPORT_ALL_VALUE;
        updateWorldExportDialog();
    }
</script>
