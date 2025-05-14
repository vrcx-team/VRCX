<template>
    <safe-dialog :visible.sync="isDialogVisible" :title="$t('dialog.world_export.header')" width="650px">
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
                <template v-for="groupAPI in API.favoriteWorldGroups">
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

<script>
    export default {
        name: 'WorldExportDialog',
        inject: ['API'],
        props: {
            favoriteWorlds: Array,
            worldExportDialogVisible: Boolean,
            localWorldFavorites: Object,
            localWorldFavoriteGroups: Array,
            localWorldFavoritesList: Array
        },
        data() {
            return {
                worldExportContent: '',
                worldExportFavoriteGroup: null,
                worldExportLocalFavoriteGroup: null,
                // Storage of selected filtering options for model and world export
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
                    return this.worldExportDialogVisible;
                },
                set(value) {
                    this.$emit('update:world-export-dialog-visible', value);
                }
            }
        },
        watch: {
            worldExportDialogVisible(value) {
                if (value) {
                    this.showWorldExportDialog();
                }
            }
        },
        methods: {
            showWorldExportDialog() {
                this.worldExportFavoriteGroup = null;
                this.worldExportLocalFavoriteGroup = null;
                this.updateWorldExportDialog();
            },

            handleCopyWorldExportData(event) {
                if (event.target.tagName === 'TEXTAREA') {
                    event.target.select();
                }
                navigator.clipboard
                    .writeText(this.worldExportContent)
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

            updateWorldExportDialog() {
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

                if (this.worldExportFavoriteGroup) {
                    this.API.favoriteWorldGroups.forEach((group) => {
                        if (this.worldExportFavoriteGroup === group) {
                            this.favoriteWorlds.forEach((ref) => {
                                if (group.key === ref.groupKey) {
                                    lines.push(resText(ref.ref));
                                }
                            });
                        }
                    });
                } else if (this.worldExportLocalFavoriteGroup) {
                    const favoriteGroup = this.localWorldFavorites[this.worldExportLocalFavoriteGroup];
                    if (!favoriteGroup) {
                        return;
                    }
                    for (let i = 0; i < favoriteGroup.length; ++i) {
                        const ref = favoriteGroup[i];
                        lines.push(resText(ref));
                    }
                } else {
                    // export all
                    this.favoriteWorlds.forEach((ref) => {
                        lines.push(resText(ref.ref));
                    });
                    for (let i = 0; i < this.localWorldFavoritesList.length; ++i) {
                        const worldId = this.localWorldFavoritesList[i];
                        const ref = this.API.cachedWorlds.get(worldId);
                        if (typeof ref !== 'undefined') {
                            lines.push(resText(ref));
                        }
                    }
                }
                this.worldExportContent = lines.join('\n');
            },

            selectWorldExportGroup(group) {
                this.worldExportFavoriteGroup = group;
                this.worldExportLocalFavoriteGroup = null;
                this.updateWorldExportDialog();
            },

            selectWorldExportLocalGroup(group) {
                this.worldExportLocalFavoriteGroup = group;
                this.worldExportFavoriteGroup = null;
                this.updateWorldExportDialog();
            },
            getLocalWorldFavoriteGroupLength(group) {
                const favoriteGroup = this.localWorldFavorites[group];
                if (!favoriteGroup) {
                    return 0;
                }
                return favoriteGroup.length;
            }
        }
    };
</script>
