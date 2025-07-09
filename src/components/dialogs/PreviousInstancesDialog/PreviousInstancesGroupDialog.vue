<template>
    <safe-dialog
        ref="previousInstancesGroupDialog"
        :visible.sync="isVisible"
        :title="$t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesGroupDialog.groupRef.name"></span>
            <el-input
                v-model="previousInstancesGroupDialogTable.filters[0].value"
                :placeholder="$t('dialog.previous_instances.search_placeholder')"
                style="display: block; width: 150px"></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="previousInstancesGroupDialogTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.previous_instances.date')" prop="created_at" sortable width="170">
                <template slot-scope="scope">
                    <span>{{ scope.row.created_at | formatDate('long') }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.instance_name')" prop="name">
                <template slot-scope="scope">
                    <location-world
                        :locationobject="scope.row.$location"
                        :grouphint="scope.row.groupName"
                        :currentuserid="API.currentUser.id"
                        @show-launch-dialog="showLaunchDialog"></location-world>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.instance_creator')" prop="location">
                <template slot-scope="scope">
                    <display-name
                        :userid="scope.row.$location.userId"
                        :location="scope.row.$location.tag"
                        :force-update-key="previousInstancesGroupDialog.forceUpdate"></display-name>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template slot-scope="scope">
                    <span v-text="scope.row.timer"></span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.action')" width="90" align="right">
                <template slot-scope="scope">
                    <el-button
                        type="text"
                        icon="el-icon-s-data"
                        size="mini"
                        @click="showPreviousInstancesInfoDialog(scope.row.location)"></el-button>
                    <el-button
                        v-if="shiftHeld"
                        style="color: #f56c6c"
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogGroupInstance(scope.row)"></el-button>
                    <el-button
                        v-else
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogGroupInstancePrompt(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script>
import utils from '../../../classes/utils';
import { parseLocation } from '../../../composables/instance/utils';
import database from '../../../service/database';

export default {
    name: 'PreviousInstancesGroupDialog',
    inject: ['API', 'showLaunchDialog', 'showPreviousInstancesInfoDialog', 'adjustDialogZ'],
    props: {
        previousInstancesGroupDialog: {
            type: Object,
            required: true
        },
        shiftHeld: Boolean
    },
    data() {
        return {
            previousInstancesGroupDialogTable: {
                data: [],
                filters: [
                    {
                        prop: 'worldName',
                        value: ''
                    }
                ],
                tableProps: {
                    stripe: true,
                    size: 'mini',
                    defaultSort: {
                        prop: 'created_at',
                        order: 'descending'
                    }
                },
                pageSize: 10,
                paginationProps: {
                    small: true,
                    layout: 'sizes,prev,pager,next,total',
                    pageSizes: [10, 25, 50, 100]
                }
            },
            loading: false
        };
    },
    computed: {
        isVisible: {
            get() {
                return this.previousInstancesGroupDialog.visible;
            },
            set(value) {
                this.$emit('update:previousInstancesGroupDialog', {
                    ...this.previousInstancesGroupDialog,
                    visible: value
                });
            }
        }
    },
    watch: {
        'previousInstancesGroupDialog.openFlg'() {
            if (this.previousInstancesGroupDialog.visible) {
                this.$nextTick(() => {
                    this.adjustDialogZ(this.$refs.previousInstancesGroupDialog.$el);
                });
                this.refreshPreviousInstancesGroupTable();
            }
        }
    },
    methods: {
        refreshPreviousInstancesGroupTable() {
            this.loading = true;
            const D = this.previousInstancesGroupDialog;
            database.getpreviousInstancesByGroupName(D.groupRef.name).then((data) => {
                const array = [];
                for (const ref of data.values()) {
                    ref.$location = parseLocation(ref.location);
                    if (ref.time > 0) {
                        ref.timer = utils.timeToText(ref.time);
                    } else {
                        ref.timer = '';
                    }
                    array.push(ref);
                }
                array.sort(utils.compareByCreatedAt);
                this.previousInstancesGroupDialogTable.data = array;
                this.loading = false;
            });
        },
        deleteGameLogGroupInstance(row) {
            database.deleteGameLogInstanceByInstanceId({
                location: row.location
            });
            utils.removeFromArray(this.previousInstancesGroupDialogTable.data, row);
        },
        deleteGameLogGroupInstancePrompt(row) {
            this.$confirm('Continue? Delete GameLog Instance', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        this.deleteGameLogGroupInstance(row);
                    }
                }
            });
        }
    }
};
</script>
