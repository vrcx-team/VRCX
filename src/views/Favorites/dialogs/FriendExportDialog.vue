<template>
    <safe-dialog
        :visible.sync="isDialogVisible"
        class="x-dialog"
        :title="$t('dialog.friend_export.header')"
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
                <template v-for="groupAPI in API.favoriteFriendGroups">
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

<script>
    export default {
        name: 'FriendExportDialog',
        inject: ['API'],
        props: {
            friendExportDialogVisible: Boolean,
            favoriteFriends: Array
        },
        data() {
            return {
                friendExportFavoriteGroup: null,
                friendExportContent: ''
            };
        },
        computed: {
            isDialogVisible: {
                get() {
                    return this.friendExportDialogVisible;
                },
                set(value) {
                    this.$emit('update:friend-export-dialog-visible', value);
                }
            }
        },
        watch: {
            friendExportDialogVisible(value) {
                if (value) {
                    this.showFriendExportDialog();
                }
            }
        },
        methods: {
            showFriendExportDialog() {
                this.friendExportFavoriteGroup = null;
                this.updateFriendExportDialog();
            },

            handleCopyFriendExportData(event) {
                if (event.target.tagName === 'TEXTAREA') {
                    event.target.select();
                }
                navigator.clipboard
                    .writeText(this.friendExportContent)
                    .then(() => {
                        this.$message({
                            message: 'Copied successfully!',
                            type: 'success',
                            duration: 2000
                        });
                    })
                    .catch((err) => {
                        console.error('Copy failed:', err);
                        this.$message.error('Copy failed!');
                    });
            },

            updateFriendExportDialog() {
                const _ = function (str) {
                    if (/[\x00-\x1f,"]/.test(str) === true) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                const lines = ['UserID,Name'];
                this.API.favoriteFriendGroups.forEach((group) => {
                    if (!this.friendExportFavoriteGroup || this.friendExportFavoriteGroup === group) {
                        this.favoriteFriends.forEach((ref) => {
                            if (group.key === ref.groupKey) {
                                lines.push(`${_(ref.id)},${_(ref.name)}`);
                            }
                        });
                    }
                });
                this.friendExportContent = lines.join('\n');
            },

            selectFriendExportGroup(group) {
                this.friendExportFavoriteGroup = group;
                this.updateFriendExportDialog();
            }
        }
    };
</script>
