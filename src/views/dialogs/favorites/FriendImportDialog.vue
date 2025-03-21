<template>
    <el-dialog
        ref="friendImportDialog"
        :before-close="beforeDialogClose"
        :visible.sync="isVisible"
        :title="$t('dialog.friend_import.header')"
        width="650px"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="font-size: 12px">{{ $t('dialog.friend_import.description') }}</div>
            <div style="display: flex; align-items: center">
                <div v-if="friendImportDialog.progress">
                    {{ $t('dialog.friend_import.process_progress') }} {{ friendImportDialog.progress }} /
                    {{ friendImportDialog.progressTotal }}
                    <i class="el-icon-loading" style="margin: 0 5px"></i>
                </div>
                <el-button v-if="friendImportDialog.loading" size="small" @click="cancelFriendImport">
                    {{ $t('dialog.friend_import.cancel') }}
                </el-button>
                <el-button v-else size="small" :disabled="!friendImportDialog.input" @click="processFriendImportList">
                    {{ $t('dialog.friend_import.process_list') }}
                </el-button>
            </div>
        </div>
        <el-input
            v-model="friendImportDialog.input"
            type="textarea"
            size="mini"
            rows="10"
            resize="none"
            style="margin-top: 10px" />
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px">
            <div>
                <el-dropdown trigger="click" size="small" @click.native.stop>
                    <el-button size="mini">
                        <span v-if="friendImportDialog.friendImportFavoriteGroup">
                            {{ friendImportDialog.friendImportFavoriteGroup.displayName }} ({{
                                friendImportDialog.friendImportFavoriteGroup.count
                            }}/{{ friendImportDialog.friendImportFavoriteGroup.capacity }})
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <span v-else
                            >{{ $t('dialog.friend_import.select_group_placeholder') }}
                            <i class="el-icon-arrow-down el-icon--right"></i
                        ></span>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="groupAPI in API.favoriteFriendGroups">
                            <el-dropdown-item
                                :key="groupAPI.name"
                                style="display: block; margin: 10px 0"
                                :disabled="groupAPI.count >= groupAPI.capacity"
                                @click.native="selectFriendImportGroup(groupAPI)">
                                {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <span v-if="friendImportDialog.friendImportFavoriteGroup" style="margin-left: 5px">
                    {{ friendImportTable.data.length }} /
                    {{
                        friendImportDialog.friendImportFavoriteGroup.capacity -
                        friendImportDialog.friendImportFavoriteGroup.count
                    }}
                </span>
            </div>
            <div>
                <el-button size="small" :disabled="friendImportTable.data.length === 0" @click="clearFriendImportTable">
                    {{ $t('dialog.friend_import.clear_table') }}
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    style="margin: 5px"
                    :disabled="friendImportTable.data.length === 0 || !friendImportDialog.friendImportFavoriteGroup"
                    @click="importFriendImportTable">
                    {{ $t('dialog.friend_import.import') }}
                </el-button>
            </div>
        </div>
        <span v-if="friendImportDialog.importProgress" style="margin: 10px">
            <i class="el-icon-loading" style="margin-right: 5px"></i>
            {{ $t('dialog.friend_import.import_progress') }} {{ friendImportDialog.importProgress }}/{{
                friendImportDialog.importProgressTotal
            }}
        </span>
        <br />
        <template v-if="friendImportDialog.errors">
            <el-button size="small" @click="friendImportDialog.errors = ''">
                {{ $t('dialog.friend_import.clear_errors') }}
            </el-button>
            <h2 style="font-weight: bold; margin: 5px 0">{{ $t('dialog.friend_import.errors') }}</h2>
            <pre style="white-space: pre-wrap; font-size: 12px" v-text="friendImportDialog.errors"></pre>
        </template>
        <data-tables v-loading="friendImportDialog.loading" v-bind="friendImportTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.import.image')" width="70" prop="currentAvatarThumbnailImageUrl">
                <template slot-scope="scope">
                    <el-popover placement="right" height="500px" trigger="hover">
                        <template slot="reference">
                            <img class="friends-list-avatar" :src="userImage(scope.row)" />
                        </template>
                        <img
                            class="friends-list-avatar"
                            :src="userImageFull(scope.row)"
                            style="height: 500px; cursor: pointer"
                            @click="showFullscreenImageDialog(userImageFull(scope.row))" />
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.name')" prop="displayName">
                <template slot-scope="scope">
                    <span class="x-link" :title="scope.row.displayName" @click="showUserDialog(scope.row.id)">
                        {{ scope.row.displayName }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.action')" width="90" align="right">
                <template slot-scope="scope">
                    <el-button type="text" icon="el-icon-close" size="mini" @click="deleteItemFriendImport(scope.row)">
                    </el-button>
                </template>
            </el-table-column>
        </data-tables>
    </el-dialog>
</template>

<script>
    import utils from '../../../classes/utils';
    import { favoriteRequest, userRequest } from '../../../classes/request';

    export default {
        name: 'FriendImportDialog',
        inject: [
            'API',
            'userImage',
            'userImageFull',
            'showFullscreenImageDialog',
            'showUserDialog',
            'beforeDialogClose',
            'dialogMouseDown',
            'dialogMouseUp',
            'adjustDialogZ'
        ],
        props: {
            friendImportDialogVisible: {
                type: Boolean,
                required: true
            },
            friendImportDialogInput: {
                type: String,
                required: false,
                default: ''
            }
        },
        data() {
            return {
                friendImportDialog: {
                    loading: false,
                    progress: 0,
                    progressTotal: 0,
                    input: '',
                    userIdList: new Set(),
                    errors: '',
                    friendImportFavoriteGroup: null,
                    importProgress: 0,
                    importProgressTotal: 0
                },
                friendImportTable: {
                    data: [],
                    tableProps: {
                        stripe: true,
                        size: 'mini'
                    },
                    layout: 'table'
                }
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.friendImportDialogVisible;
                },
                set(value) {
                    this.$emit('update:friend-import-dialog-visible', value);
                }
            }
        },
        watch: {
            friendImportDialogVisible(value) {
                if (value) {
                    this.adjustDialogZ(this.$refs.friendImportDialog.$el);
                    this.clearFriendImportTable();
                    this.resetFriendImport();
                    if (this.friendImportDialogInput) {
                        this.friendImportDialog.input = this.friendImportDialogInput;
                        this.processFriendImportList();
                        this.$emit('update:friend-import-dialog-input', '');
                    }
                }
            }
        },
        methods: {
            cancelFriendImport() {
                this.friendImportDialog.loading = false;
            },
            deleteItemFriendImport(ref) {
                utils.removeFromArray(this.friendImportTable.data, ref);
                this.friendImportDialog.userIdList.delete(ref.id);
            },
            clearFriendImportTable() {
                this.friendImportTable.data = [];
                this.friendImportDialog.userIdList = new Set();
            },
            selectFriendImportGroup(group) {
                this.friendImportDialog.friendImportFavoriteGroup = group;
            },
            async importFriendImportTable() {
                const D = this.friendImportDialog;
                D.loading = true;
                if (!D.friendImportFavoriteGroup) {
                    return;
                }
                const data = [...this.friendImportTable.data].reverse();
                D.importProgressTotal = data.length;
                let ref = '';
                try {
                    for (let i = data.length - 1; i >= 0; i--) {
                        if (!D.loading || !this.isVisible) {
                            break;
                        }
                        ref = data[i];
                        await this.addFavoriteUser(ref, D.friendImportFavoriteGroup, false);
                        utils.removeFromArray(this.friendImportTable.data, ref);
                        D.userIdList.delete(ref.id);
                        D.importProgress++;
                    }
                } catch (err) {
                    D.errors = `Name: ${ref.displayName}\nUserId: ${ref.id}\n${err}\n\n`;
                } finally {
                    D.importProgress = 0;
                    D.importProgressTotal = 0;
                    D.loading = false;
                }
            },
            addFavoriteUser(ref, group, message) {
                return favoriteRequest
                    .addFavorite({
                        type: 'friend',
                        favoriteId: ref.id,
                        tags: group.name
                    })
                    .then((args) => {
                        if (message) {
                            this.$message({
                                message: 'Friend added to favorites',
                                type: 'success'
                            });
                        }
                        return args;
                    });
            },
            async processFriendImportList() {
                const D = this.friendImportDialog;
                D.loading = true;
                const regexFriendId = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
                let match = [];
                const userIdList = new Set();
                while ((match = regexFriendId.exec(D.input)) !== null) {
                    userIdList.add(match[0]);
                }
                D.input = '';
                D.errors = '';
                D.progress = 0;
                D.progressTotal = userIdList.size;
                const data = Array.from(userIdList);
                for (let i = 0; i < data.length; ++i) {
                    if (!this.isVisible) {
                        this.resetFriendImport();
                    }
                    if (!D.loading || !this.isVisible) {
                        break;
                    }
                    const userId = data[i];
                    if (!D.userIdList.has(userId)) {
                        try {
                            const args = await userRequest.getUser({
                                userId
                            });
                            this.friendImportTable.data.push(args.ref);
                            D.userIdList.add(userId);
                        } catch (err) {
                            D.errors = D.errors.concat(`UserId: ${userId}\n${err}\n\n`);
                        }
                    }
                    D.progress++;
                    if (D.progress === userIdList.size) {
                        D.progress = 0;
                    }
                }
                D.loading = false;
            },
            resetFriendImport() {
                this.friendImportDialog.input = '';
                this.friendImportDialog.errors = '';
            }
        }
    };
</script>
