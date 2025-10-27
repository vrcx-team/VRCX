<template>
    <el-dialog v-model="isDialogVisible" :title="t('dialog.world_export.header')" width="650px">
        <el-checkbox-group
            v-model="exportSelectedOptions"
            style="margin-bottom: 10px"
            @change="updateWorldExportDialog">
            <template v-for="option in exportSelectOptions" :key="option.value">
                <el-checkbox :label="option.label"></el-checkbox>
            </template>
        </el-checkbox-group>

        <el-dropdown trigger="click" size="small">
            <el-button size="small">
                <span v-if="worldExportFavoriteGroup">
                    {{ worldExportFavoriteGroup.displayName }} ({{ worldExportFavoriteGroup.count }}/{{
                        worldExportFavoriteGroup.capacity
                    }})
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <span v-else>
                    All Favorites
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item style="display: block; margin: 10px 0" @click="selectWorldExportGroup(null)">
                        None
                    </el-dropdown-item>
                    <template v-for="groupAPI in favoriteWorldGroups" :key="groupAPI.name">
                        <el-dropdown-item
                            style="display: block; margin: 10px 0"
                            @click="selectWorldExportGroup(groupAPI)">
                            {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                        </el-dropdown-item>
                    </template>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-dropdown trigger="click" size="small" style="margin-left: 10px">
            <el-button size="small">
                <span v-if="worldExportLocalFavoriteGroup">
                    {{ worldExportLocalFavoriteGroup }} ({{ localWorldFavGroupLength(worldExportLocalFavoriteGroup) }})
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <span v-else>
                    Select Group
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item style="display: block; margin: 10px 0" @click="selectWorldExportLocalGroup(null)">
                        None
                    </el-dropdown-item>
                    <template v-for="group in localWorldFavoriteGroups" :key="group">
                        <el-dropdown-item
                            style="display: block; margin: 10px 0"
                            @click="selectWorldExportLocalGroup(group)">
                            {{ group }} ({{ localWorldFavorites[group].length }})
                        </el-dropdown-item>
                    </template>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

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
    import { computed, ref, watch } from 'vue';
    import { ArrowDown } from '@element-plus/icons-vue';
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
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

    const favoriteStore = useFavoriteStore();
    const {
        favoriteWorlds,
        favoriteWorldGroups,
        localWorldFavorites,
        localWorldFavoriteGroups,
        localWorldFavoritesList
    } = storeToRefs(favoriteStore);
    const { localWorldFavGroupLength } = favoriteStore;
    const { cachedWorlds } = useWorldStore();

    const worldExportContent = ref('');
    const worldExportFavoriteGroup = ref(null);
    const worldExportLocalFavoriteGroup = ref(null);
    // Storage of selected filtering options for model and world export
    const exportSelectedOptions = ref(['ID', 'Name']);
    const exportSelectOptions = ref([
        { label: 'ID', value: 'id' },
        { label: 'Name', value: 'name' },
        { label: 'Author ID', value: 'authorId' },
        { label: 'Author Name', value: 'authorName' },
        { label: 'Thumbnail', value: 'thumbnailImageUrl' }
    ]);

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
        updateWorldExportDialog();
    }

    function handleCopyWorldExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(worldExportContent.value)
            .then(() => {
                ElMessage({
                    message: 'Copied successfully!',
                    type: 'success',
                    duration: 2000
                });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                ElMessage({
                    message: 'Copy failed!',
                    type: 'error'
                });
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
            for (let i = 0; i < localWorldFavoritesList.value.length; ++i) {
                const worldId = localWorldFavoritesList.value[i];
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
        updateWorldExportDialog();
    }

    function selectWorldExportLocalGroup(group) {
        worldExportLocalFavoriteGroup.value = group;
        worldExportFavoriteGroup.value = null;
        updateWorldExportDialog();
    }
</script>
