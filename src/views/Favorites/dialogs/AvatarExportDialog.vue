<template>
    <safe-dialog v-model="isDialogVisible" :title="t('dialog.avatar_export.header')" width="650px">
        <el-checkbox-group
            v-model="exportSelectedOptions"
            style="margin-bottom: 10px"
            @change="updateAvatarExportDialog()">
            <template v-for="option in exportSelectOptions" :key="option.value">
                <el-checkbox :label="option.label"></el-checkbox>
            </template>
        </el-checkbox-group>

        <el-dropdown trigger="click" size="small" @click.stop>
            <el-button size="mini">
                <span v-if="avatarExportFavoriteGroup">
                    {{ avatarExportFavoriteGroup.displayName }} ({{ avatarExportFavoriteGroup.count }}/{{
                        avatarExportFavoriteGroup.capacity
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    All Favorites
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item style="display: block; margin: 10px 0" @click="selectAvatarExportGroup(null)">
                    All Favorites
                </el-dropdown-item>
                <template v-for="groupAPI in favoriteAvatarGroups" :key="groupAPI.name">
                    <el-dropdown-item style="display: block; margin: 10px 0" @click="selectAvatarExportGroup(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dropdown trigger="click" size="small" style="margin-left: 10px" @click.stop>
            <el-button size="mini">
                <span v-if="avatarExportLocalFavoriteGroup">
                    {{ avatarExportLocalFavoriteGroup }} ({{
                        getLocalAvatarFavoriteGroupLength(avatarExportLocalFavoriteGroup)
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>
                    Select Group
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item style="display: block; margin: 10px 0" @click="selectAvatarExportLocalGroup(null)">
                    None
                </el-dropdown-item>
                <template v-for="group in localAvatarFavoriteGroups" :key="group">
                    <el-dropdown-item
                        style="display: block; margin: 10px 0"
                        @click="selectAvatarExportLocalGroup(group)">
                        {{ group }} ({{ getLocalAvatarFavoriteGroupLength(group) }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>
        <br />
        <el-input
            v-model="avatarExportContent"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click="handleCopyAvatarExportData"></el-input>
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, watch, getCurrentInstance } from 'vue';
    import { ElMessage } from 'element-plus';

    import { useI18n } from 'vue-i18n';
    import { storeToRefs } from 'pinia';
    import { useAvatarStore, useFavoriteStore } from '../../../stores';

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const props = defineProps({
        avatarExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:avatarExportDialogVisible']);

    const favoriteStore = useFavoriteStore();
    const {
        favoriteAvatars,
        favoriteAvatarGroups,
        localAvatarFavorites,
        localAvatarFavoritesList,
        localAvatarFavoriteGroups
    } = storeToRefs(favoriteStore);
    const { getLocalAvatarFavoriteGroupLength } = favoriteStore;
    const avatarStore = useAvatarStore();
    const { cachedAvatars } = storeToRefs(avatarStore);

    const avatarExportContent = ref('');
    const avatarExportFavoriteGroup = ref(null);
    const avatarExportLocalFavoriteGroup = ref(null);
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
        updateAvatarExportDialog();
    }
    function handleCopyAvatarExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(avatarExportContent.value)
            .then(() => {
                ElMessage({
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
    function updateAvatarExportDialog() {
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
                const ref = cachedAvatars.value.get(avatarId);
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
        updateAvatarExportDialog();
    }
    function selectAvatarExportLocalGroup(group) {
        avatarExportLocalFavoriteGroup.value = group;
        avatarExportFavoriteGroup.value = null;
        updateAvatarExportDialog();
    }
</script>
