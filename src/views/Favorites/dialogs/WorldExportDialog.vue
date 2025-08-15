<template>
    <safe-dialog :visible.sync="isDialogVisible" :title="t('dialog.world_export.header')" width="650px">
        <el-checkbox-group
            v-model="exportSelectedOptions"
            style="margin-bottom: 10px"
            @change="updateWorldExportDialog">
            <template v-for="option in exportSelectOptions">
                <el-checkbox :key="option.value" :label="option.label"></el-checkbox>
            </template>
        </el-checkbox-group>

        <el-dropdown trigger="click" size="small" @click.native.stop>
            <el-button size="mini">
                <span v-if="worldExportFavoriteGroup">
                    {{ worldExportFavoriteGroup.displayName }} ({{ worldExportFavoriteGroup.count }}/{{
                        worldExportFavoriteGroup.capacity
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    All Favorites
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item style="display: block; margin: 10px 0" @click.native="selectWorldExportGroup(null)">
                    None
                </el-dropdown-item>
                <template v-for="groupAPI in favoriteWorldGroups">
                    <el-dropdown-item
                        :key="groupAPI.name"
                        style="display: block; margin: 10px 0"
                        @click.native="selectWorldExportGroup(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dropdown trigger="click" size="small" style="margin-left: 10px" @click.native.stop>
            <el-button size="mini">
                <span v-if="worldExportLocalFavoriteGroup">
                    {{ worldExportLocalFavoriteGroup }} ({{
                        getLocalWorldFavoriteGroupLength(worldExportLocalFavoriteGroup)
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    Select Group
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                    style="display: block; margin: 10px 0"
                    @click.native="selectWorldExportLocalGroup(null)">
                    None
                </el-dropdown-item>
                <template v-for="group in localWorldFavoriteGroups">
                    <el-dropdown-item
                        :key="group"
                        style="display: block; margin: 10px 0"
                        @click.native="selectWorldExportLocalGroup(group)">
                        {{ group }} ({{ localWorldFavorites[group].length }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>

        <br />

        <el-input
            v-model="worldExportContent"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click.native="handleCopyWorldExportData"></el-input>
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, watch, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { useFavoriteStore, useWorldStore } from '../../../stores';

    const props = defineProps({
        worldExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:worldExportDialogVisible']);

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const favoriteStore = useFavoriteStore();
    const {
        favoriteWorlds,
        favoriteWorldGroups,
        localWorldFavorites,
        localWorldFavoriteGroups,
        localWorldFavoritesList
    } = storeToRefs(favoriteStore);
    const { getLocalWorldFavoriteGroupLength } = favoriteStore;
    const { cachedWorlds } = storeToRefs(useWorldStore());

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
                proxy.$message({
                    message: 'Copied successfully!',
                    type: 'success',
                    duration: 2000
                });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                proxy.$message.error('Copy failed!');
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
                const ref = cachedWorlds.value.get(worldId);
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
