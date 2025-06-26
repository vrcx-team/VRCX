<template>
    <safe-dialog
        ref="avatarImportDialog"
        :visible.sync="isVisible"
        :title="$t('dialog.avatar_import.header')"
        width="650px">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div style="font-size: 12px">{{ $t('dialog.avatar_import.description') }}</div>
            <div style="display: flex; align-items: center">
                <div v-if="avatarImportDialog.progress">
                    {{ $t('dialog.avatar_import.process_progress') }} {{ avatarImportDialog.progress }} /
                    {{ avatarImportDialog.progressTotal }}
                    <i class="el-icon-loading" style="margin: 0 5px"></i>
                </div>
                <el-button v-if="avatarImportDialog.loading" size="small" @click="cancelAvatarImport">
                    {{ $t('dialog.avatar_import.cancel') }}
                </el-button>
                <el-button v-else size="small" :disabled="!avatarImportDialog.input" @click="processAvatarImportList">
                    {{ $t('dialog.avatar_import.process_list') }}
                </el-button>
            </div>
        </div>
        <el-input
            v-model="avatarImportDialog.input"
            type="textarea"
            size="mini"
            rows="10"
            resize="none"
            style="margin-top: 10px"></el-input>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px">
            <div>
                <el-dropdown trigger="click" size="small" @click.native.stop>
                    <el-button size="mini">
                        <span v-if="avatarImportDialog.avatarImportFavoriteGroup">
                            {{ avatarImportDialog.avatarImportFavoriteGroup.displayName }} ({{
                                avatarImportDialog.avatarImportFavoriteGroup.count
                            }}/{{ avatarImportDialog.avatarImportFavoriteGroup.capacity }})
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <span v-else>
                            {{ $t('dialog.avatar_import.select_group_placeholder') }}
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="groupAPI in API.favoriteAvatarGroups">
                            <el-dropdown-item
                                :key="groupAPI.name"
                                style="display: block; margin: 10px 0"
                                :disabled="groupAPI.count >= groupAPI.capacity"
                                @click.native="selectAvatarImportGroup(groupAPI)">
                                {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <el-dropdown trigger="click" size="small" style="margin: 5px" @click.native.stop>
                    <el-button size="mini">
                        <span v-if="avatarImportDialog.avatarImportLocalFavoriteGroup">
                            {{ avatarImportDialog.avatarImportLocalFavoriteGroup }} ({{
                                getLocalAvatarFavoriteGroupLength(avatarImportDialog.avatarImportLocalFavoriteGroup)
                            }})
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                        <span v-else>
                            {{ $t('dialog.avatar_import.select_group_placeholder') }}
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <el-dropdown-menu slot="dropdown">
                        <template v-for="group in localAvatarFavoriteGroups">
                            <el-dropdown-item
                                :key="group"
                                style="display: block; margin: 10px 0"
                                @click.native="selectAvatarImportLocalGroup(group)">
                                {{ group }} ({{ getLocalAvatarFavoriteGroupLength(group) }})
                            </el-dropdown-item>
                        </template>
                    </el-dropdown-menu>
                </el-dropdown>
                <span v-if="avatarImportDialog.avatarImportFavoriteGroup" style="margin-left: 5px">
                    {{ avatarImportTable.data.length }} /
                    {{
                        avatarImportDialog.avatarImportFavoriteGroup.capacity -
                        avatarImportDialog.avatarImportFavoriteGroup.count
                    }}
                </span>
            </div>
            <div>
                <el-button size="small" @click="clearAvatarImportTable">
                    {{ $t('dialog.avatar_import.clear_table') }}
                </el-button>
                <el-button
                    size="small"
                    type="primary"
                    style="margin: 5px"
                    :disabled="
                        avatarImportTable.data.length === 0 ||
                        (!avatarImportDialog.avatarImportFavoriteGroup &&
                            !avatarImportDialog.avatarImportLocalFavoriteGroup)
                    "
                    @click="importAvatarImportTable">
                    {{ $t('dialog.avatar_import.import') }}
                </el-button>
            </div>
        </div>
        <span v-if="avatarImportDialog.importProgress" style="margin: 10px">
            <i class="el-icon-loading" style="margin-right: 5px"></i>
            {{ $t('dialog.avatar_import.import_progress') }}
            {{ avatarImportDialog.importProgress }}/{{ avatarImportDialog.importProgressTotal }}
        </span>
        <br />
        <template v-if="avatarImportDialog.errors">
            <el-button size="small" @click="avatarImportDialog.errors = ''">
                {{ $t('dialog.avatar_import.clear_errors') }}
            </el-button>
            <h2 style="font-weight: bold; margin: 5px 0">
                {{ $t('dialog.avatar_import.errors') }}
            </h2>
            <pre style="white-space: pre-wrap; font-size: 12px" v-text="avatarImportDialog.errors"></pre>
        </template>
        <data-tables v-loading="avatarImportDialog.loading" v-bind="avatarImportTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.import.image')" width="70" prop="thumbnailImageUrl">
                <template slot-scope="scope">
                    <el-popover placement="right" height="500px" trigger="hover">
                        <img slot="reference" v-lazy="scope.row.thumbnailImageUrl" class="friends-list-avatar" />
                        <img
                            v-lazy="scope.row.imageUrl"
                            class="friends-list-avatar"
                            style="height: 500px; cursor: pointer"
                            @click="showFullscreenImageDialog(scope.row.imageUrl)" />
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.name')" prop="name">
                <template slot-scope="scope">
                    <span class="x-link" @click="showAvatarDialog(scope.row.id)">
                        {{ scope.row.name }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.author')" width="120" prop="authorName">
                <template slot-scope="scope">
                    <span class="x-link" @click="showUserDialog(scope.row.authorId)">
                        {{ scope.row.authorName }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.status')" width="70" prop="releaseStatus">
                <template slot-scope="scope">
                    <span
                        :style="{
                            color:
                                scope.row.releaseStatus === 'public'
                                    ? '#67c23a'
                                    : scope.row.releaseStatus === 'private'
                                      ? '#f56c6c'
                                      : undefined
                        }">
                        {{ scope.row.releaseStatus.charAt(0).toUpperCase() + scope.row.releaseStatus.slice(1) }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.import.action')" width="90" align="right">
                <template slot-scope="scope">
                    <el-button type="text" icon="el-icon-close" size="mini" @click="deleteItemAvatarImport(scope.row)">
                    </el-button>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script>
    import { avatarRequest, favoriteRequest } from '../../../api';
    import utils from '../../../classes/utils';

    export default {
        name: 'AvatarImportDialog',
        inject: ['API', 'adjustDialogZ', 'showFullscreenImageDialog', 'showUserDialog', 'showAvatarDialog'],
        props: {
            getLocalAvatarFavoriteGroupLength: Function,
            localAvatarFavoriteGroups: Array,
            avatarImportDialogInput: String,
            avatarImportDialogVisible: Boolean
        },
        data() {
            return {
                avatarImportDialog: {
                    loading: false,
                    progress: 0,
                    progressTotal: 0,
                    input: '',
                    avatarIdList: new Set(),
                    errors: '',
                    avatarImportFavoriteGroup: null,
                    avatarImportLocalFavoriteGroup: null,
                    importProgress: 0,
                    importProgressTotal: 0
                },
                avatarImportTable: {
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
                    return this.avatarImportDialogVisible;
                },
                set(value) {
                    this.$emit('update:avatar-import-dialog-visible', value);
                }
            }
        },
        watch: {
            avatarImportDialogVisible(value) {
                if (value) {
                    this.adjustDialogZ(this.$refs.avatarImportDialog.$el);
                    this.clearAvatarImportTable();
                    this.resetAvatarImport();
                    if (this.avatarImportDialogInput) {
                        this.avatarImportDialog.input = this.avatarImportDialogInput;
                        this.processAvatarImportList();
                        this.$emit('update:avatar-import-dialog-input', '');
                    }
                }
            }
        },
        methods: {
            async processAvatarImportList() {
                const D = this.avatarImportDialog;
                D.loading = true;
                const regexAvatarId = /avtr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
                let match = [];
                const avatarIdList = new Set();
                while ((match = regexAvatarId.exec(D.input)) !== null) {
                    avatarIdList.add(match[0]);
                }
                D.input = '';
                D.errors = '';
                D.progress = 0;
                D.progressTotal = avatarIdList.size;
                const data = Array.from(avatarIdList);
                for (let i = 0; i < data.length; ++i) {
                    if (!this.isVisible) {
                        this.resetAvatarImport();
                    }
                    if (!D.loading || !this.isVisible) {
                        break;
                    }
                    const avatarId = data[i];
                    if (!D.avatarIdList.has(avatarId)) {
                        try {
                            const args = await avatarRequest.getAvatar({
                                avatarId
                            });
                            this.avatarImportTable.data.push(args.ref);
                            D.avatarIdList.add(avatarId);
                        } catch (err) {
                            D.errors = D.errors.concat(`AvatarId: ${avatarId}\n${err}\n\n`);
                        }
                    }
                    D.progress++;
                    if (D.progress === avatarIdList.size) {
                        D.progress = 0;
                    }
                }
                D.loading = false;
            },

            deleteItemAvatarImport(ref) {
                utils.removeFromArray(this.avatarImportTable.data, ref);
                this.avatarImportDialog.avatarIdList.delete(ref.id);
            },

            resetAvatarImport() {
                this.avatarImportDialog.input = '';
                this.avatarImportDialog.errors = '';
            },

            clearAvatarImportTable() {
                this.avatarImportTable.data = [];
                this.avatarImportDialog.avatarIdList = new Set();
            },

            selectAvatarImportGroup(group) {
                this.avatarImportDialog.avatarImportLocalFavoriteGroup = null;
                this.avatarImportDialog.avatarImportFavoriteGroup = group;
            },

            selectAvatarImportLocalGroup(group) {
                this.avatarImportDialog.avatarImportFavoriteGroup = null;
                this.avatarImportDialog.avatarImportLocalFavoriteGroup = group;
            },

            cancelAvatarImport() {
                this.avatarImportDialog.loading = false;
            },
            addFavoriteAvatar(ref, group, message) {
                return favoriteRequest
                    .addFavorite({
                        type: 'avatar',
                        favoriteId: ref.id,
                        tags: group.name
                    })
                    .then((args) => {
                        if (message) {
                            this.$message({
                                message: 'Avatar added to favorites',
                                type: 'success'
                            });
                        }
                        return args;
                    });
            },
            async importAvatarImportTable() {
                const D = this.avatarImportDialog;
                if (!D.avatarImportFavoriteGroup && !D.avatarImportLocalFavoriteGroup) {
                    return;
                }
                D.loading = true;
                const data = [...this.avatarImportTable.data].reverse();
                D.importProgressTotal = data.length;
                let ref = '';
                try {
                    for (let i = data.length - 1; i >= 0; i--) {
                        if (!D.loading || !this.isVisible) {
                            break;
                        }
                        ref = data[i];
                        if (D.avatarImportFavoriteGroup) {
                            await this.addFavoriteAvatar(ref, D.avatarImportFavoriteGroup, false);
                        } else if (D.avatarImportLocalFavoriteGroup) {
                            this.$emit('addLocalAvatarFavorite', ref.id, D.avatarImportLocalFavoriteGroup);
                        }
                        utils.removeFromArray(this.avatarImportTable.data, ref);
                        D.avatarIdList.delete(ref.id);
                        D.importProgress++;
                    }
                } catch (err) {
                    D.errors = `Name: ${ref.name}\nAvatarId: ${ref.id}\n${err}\n\n`;
                } finally {
                    D.importProgress = 0;
                    D.importProgressTotal = 0;
                    D.loading = false;
                }
            }
        }
    };
</script>
