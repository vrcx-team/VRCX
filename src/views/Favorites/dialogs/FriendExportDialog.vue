<template>
    <safe-dialog
        :visible.sync="isDialogVisible"
        class="x-dialog"
        :title="t('dialog.friend_export.header')"
        width="650px"
        destroy-on-close>
        <el-dropdown trigger="click" size="small" @click.native.stop>
            <el-button size="mini">
                <span v-if="friendExportFavoriteGroup">
                    {{ friendExportFavoriteGroup.displayName }} ({{ friendExportFavoriteGroup.count }}/{{
                        friendExportFavoriteGroup.capacity
                    }})
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </span>
                <span v-else>All Favorites <i class="el-icon-arrow-down el-icon--right"></i></span>
            </el-button>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item style="display: block; margin: 10px 0" @click.native="selectFriendExportGroup(null)">
                    All Favorites
                </el-dropdown-item>
                <template v-for="groupAPI in favoriteFriendGroups">
                    <el-dropdown-item
                        :key="groupAPI.name"
                        style="display: block; margin: 10px 0"
                        @click.native="selectFriendExportGroup(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>
        <br />
        <el-input
            v-model="friendExportContent"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click.native="handleCopyFriendExportData"></el-input>
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, watch, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { useFavoriteStore } from '../../../stores';

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

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
