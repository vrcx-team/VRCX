<template>
    <safe-dialog :visible.sync="isDialogVisible" :title="$t('dialog.avatar_export.header')" width="650px">
        <el-checkbox-group
            v-model="exportSelectedOptions"
            style="margin-bottom: 10px"
            @change="updateAvatarExportDialog()">
            <template v-for="option in exportSelectOptions">
                <el-checkbox :key="option.value" :label="option.label"></el-checkbox>
            </template>
        </el-checkbox-group>

        <el-dropdown trigger="click" size="small" @click.native.stop>
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
                <el-dropdown-item style="display: block; margin: 10px 0" @click.native="selectAvatarExportGroup(null)">
                    All Favorites
                </el-dropdown-item>
                <template v-for="groupAPI in favoriteAvatarGroups">
                    <el-dropdown-item
                        :key="groupAPI.name"
                        style="display: block; margin: 10px 0"
                        @click.native="selectAvatarExportGroup(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dropdown trigger="click" size="small" style="margin-left: 10px" @click.native.stop>
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
                <el-dropdown-item
                    style="display: block; margin: 10px 0"
                    @click.native="selectAvatarExportLocalGroup(null)">
                    None
                </el-dropdown-item>
                <template v-for="group in localAvatarFavoriteGroups">
                    <el-dropdown-item
                        :key="group"
                        style="display: block; margin: 10px 0"
                        @click.native="selectAvatarExportLocalGroup(group)">
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
            @click.native="handleCopyAvatarExportData"></el-input>
    </safe-dialog>
</template>

<script>
    import { storeToRefs } from 'pinia';
    import { useAvatarStore, useFavoriteStore } from '../../../stores';

    export default {
        name: 'AvatarExportDialog',
        props: {
            avatarExportDialogVisible: Boolean
        },
        setup() {
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
            return {
                favoriteAvatars,
                favoriteAvatarGroups,
                getLocalAvatarFavoriteGroupLength,
                localAvatarFavorites,
                localAvatarFavoritesList,
                localAvatarFavoriteGroups,
                cachedAvatars
            };
        },
        data() {
            return {
                avatarExportContent: '',
                avatarExportFavoriteGroup: null,
                avatarExportLocalFavoriteGroup: null,
                exportSelectedOptions: ['ID', 'Name'],
                exportSelectOptions: [
                    { label: 'ID', value: 'id' },
                    { label: 'Name', value: 'name' },
                    { label: 'Author ID', value: 'authorId' },
                    { label: 'Author Name', value: 'authorName' },
                    { label: 'Thumbnail', value: 'thumbnailImageUrl' }
                ]
            };
        },
        computed: {
            isDialogVisible: {
                get() {
                    return this.avatarExportDialogVisible;
                },
                set(value) {
                    this.$emit('update:avatar-export-dialog-visible', value);
                }
            }
        },
        watch: {
            avatarExportDialogVisible(visible) {
                if (visible) {
                    this.showAvatarExportDialog();
                }
            }
        },
        methods: {
            showAvatarExportDialog() {
                this.avatarExportFavoriteGroup = null;
                this.avatarExportLocalFavoriteGroup = null;
                this.updateAvatarExportDialog();
            },
            handleCopyAvatarExportData(event) {
                if (event.target.tagName === 'TEXTAREA') {
                    event.target.select();
                }
                navigator.clipboard
                    .writeText(this.avatarExportContent)
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
            updateAvatarExportDialog() {
                const formatter = function (str) {
                    if (/[\x00-\x1f,"]/.test(str) === true) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                const propsForQuery = this.exportSelectOptions
                    .filter((option) => this.exportSelectedOptions.includes(option.label))
                    .map((option) => option.value);

                function resText(ref) {
                    let resArr = [];
                    propsForQuery.forEach((e) => {
                        resArr.push(formatter(ref?.[e]));
                    });
                    return resArr.join(',');
                }

                const lines = [this.exportSelectedOptions.join(',')];

                if (this.avatarExportFavoriteGroup) {
                    this.favoriteAvatarGroups.forEach((group) => {
                        if (!this.avatarExportFavoriteGroup || this.avatarExportFavoriteGroup === group) {
                            this.favoriteAvatars.forEach((ref) => {
                                if (group.key === ref.groupKey) {
                                    lines.push(resText(ref.ref));
                                }
                            });
                        }
                    });
                } else if (this.avatarExportLocalFavoriteGroup) {
                    const favoriteGroup = this.localAvatarFavorites[this.avatarExportLocalFavoriteGroup];
                    if (!favoriteGroup) {
                        return;
                    }
                    for (let i = 0; i < favoriteGroup.length; ++i) {
                        const ref = favoriteGroup[i];
                        lines.push(resText(ref));
                    }
                } else {
                    // export all
                    this.favoriteAvatars.forEach((ref) => {
                        lines.push(resText(ref.ref));
                    });
                    for (let i = 0; i < this.localAvatarFavoritesList.length; ++i) {
                        const avatarId = this.localAvatarFavoritesList[i];
                        const ref = this.cachedAvatars.get(avatarId);
                        if (typeof ref !== 'undefined') {
                            lines.push(resText(ref));
                        }
                    }
                }
                this.avatarExportContent = lines.join('\n');
            },
            selectAvatarExportGroup(group) {
                this.avatarExportFavoriteGroup = group;
                this.avatarExportLocalFavoriteGroup = null;
                this.updateAvatarExportDialog();
            },
            selectAvatarExportLocalGroup(group) {
                this.avatarExportLocalFavoriteGroup = group;
                this.avatarExportFavoriteGroup = null;
                this.updateAvatarExportDialog();
            }
        }
    };
</script>
