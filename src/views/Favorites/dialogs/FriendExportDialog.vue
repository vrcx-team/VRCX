<template>
    <el-dialog
        v-model="isDialogVisible"
        class="x-dialog"
        :title="t('dialog.friend_export.header')"
        width="650px"
        destroy-on-close>
        <el-dropdown trigger="click" size="small">
            <el-button size="small">
                <span v-if="friendExportFavoriteGroup">
                    {{ friendExportFavoriteGroup.displayName }} ({{ friendExportFavoriteGroup.count }}/{{
                        friendExportFavoriteGroup.capacity
                    }})
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <span v-else
                    >All Favorites <el-icon class="el-icon--right"><ArrowDown /></el-icon
                ></span>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item style="display: block; margin: 10px 0" @click="selectFriendExportGroup(null)">
                        All Favorites
                    </el-dropdown-item>
                    <template v-for="groupAPI in favoriteFriendGroups" :key="groupAPI.name">
                        <el-dropdown-item
                            style="display: block; margin: 10px 0"
                            @click="selectFriendExportGroup(groupAPI)">
                            {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                        </el-dropdown-item>
                    </template>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
        <br />
        <el-input
            v-model="friendExportContent"
            type="textarea"
            size="small"
            :rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click="handleCopyFriendExportData"></el-input>
    </el-dialog>
</template>

<script setup>
    import { ArrowDown } from '@element-plus/icons-vue';
    import { ref, computed, watch } from 'vue';
    import { ElMessage } from 'element-plus';

    import { useI18n } from 'vue-i18n';
    import { storeToRefs } from 'pinia';
    import { useFavoriteStore } from '../../../stores';

    const { t } = useI18n();

    const props = defineProps({
        friendExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:friendExportDialogVisible']);

    const favoriteStore = useFavoriteStore();
    const { favoriteFriends, favoriteFriendGroups } = storeToRefs(favoriteStore);

    const friendExportFavoriteGroup = ref(null);
    const friendExportContent = ref('');

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

    function showFriendExportDialog() {
        friendExportFavoriteGroup.value = null;
        updateFriendExportDialog();
    }

    function handleCopyFriendExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(friendExportContent.value)
            .then(() => {
                ElMessage({
                    message: 'Copied successfully!',
                    type: 'success',
                    duration: 2000
                });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                ElMessage.error('Copy failed!');
            });
    }

    function updateFriendExportDialog() {
        const _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const lines = ['UserID,Name'];
        favoriteFriendGroups.value.forEach((group) => {
            if (!friendExportFavoriteGroup.value || friendExportFavoriteGroup.value === group) {
                favoriteFriends.value.forEach((ref) => {
                    if (group.key === ref.groupKey) {
                        lines.push(`${_(ref.id)},${_(ref.name)}`);
                    }
                });
            }
        });
        friendExportContent.value = lines.join('\n');
    }

    function selectFriendExportGroup(group) {
        friendExportFavoriteGroup.value = group;
        updateFriendExportDialog();
    }
</script>
