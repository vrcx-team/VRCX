<template>
    <el-dialog
        ref="previousInstancesWorldDialog"
        :before-close="beforeDialogClose"
        :visible.sync="isVisible"
        :title="$t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesWorldDialog.worldRef.name"></span>
            <el-input
                v-model="previousInstancesWorldDialogTable.filters[0].value"
                :placeholder="$t('dialog.previous_instances.search_placeholder')"
                style="display: block; width: 150px"></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="previousInstancesWorldDialogTable" style="margin-top: 10px">
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
                        :force-update-key="previousInstancesWorldDialog.forceUpdate"></display-name>
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
                        @click="deleteGameLogWorldInstance(scope.row)"></el-button>
                    <el-button
                        v-else
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogWorldInstancePrompt(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </el-dialog>
</template>

<script>
    import utils from '../../../classes/utils';
    import database from '../../../service/database';

    export default {
        name: 'PreviousInstancesWorldDialog',
        inject: [
            'API',
            'showLaunchDialog',
            'showPreviousInstancesInfoDialog',
            'adjustDialogZ',
            'beforeDialogClose',
            'dialogMouseDown',
            'dialogMouseUp'
        ],
        props: {
            previousInstancesWorldDialog: {
                type: Object,
                required: true
            },
            shiftHeld: Boolean
        },
        data() {
            return {
                previousInstancesWorldDialogTable: {
                    data: [],
                    filters: [
                        {
                            prop: 'groupName',
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
                    return this.previousInstancesWorldDialog.visible;
                },
                set(value) {
                    this.$emit('update:previous-instances-world-dialog', {
                        ...this.previousInstancesWorldDialog,
                        visible: value
                    });
                }
            }
        },
        watch: {
            'previousInstancesWorldDialog.openFlg'() {
                if (this.previousInstancesWorldDialog.visible) {
                    this.$nextTick(() => {
                        this.adjustDialogZ(this.$refs.previousInstancesWorldDialog.$el);
                    });
                    this.refreshPreviousInstancesWorldTable();
                }
            }
        },
        methods: {
            refreshPreviousInstancesWorldTable() {
                this.loading = true;
                const D = this.previousInstancesWorldDialog;
                database.getpreviousInstancesByWorldId(D.worldRef).then((data) => {
                    const array = [];
                    for (const ref of data.values()) {
                        ref.$location = utils.parseLocation(ref.location);
                        if (ref.time > 0) {
                            ref.timer = utils.timeToText(ref.time);
                        } else {
                            ref.timer = '';
                        }
                        array.push(ref);
                    }
                    array.sort(utils.compareByCreatedAt);
                    this.previousInstancesWorldDialogTable.data = array;
                    this.loading = false;
                });
            },
            deleteGameLogWorldInstance(row) {
                database.deleteGameLogInstanceByInstanceId({
                    location: row.location
                });
                utils.removeFromArray(this.previousInstancesWorldDialogTable.data, row);
            },

            deleteGameLogWorldInstancePrompt(row) {
                this.$confirm('Continue? Delete GameLog Instance', 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            this.deleteGameLogWorldInstance(row);
                        }
                    }
                });
            }
        }
    };
</script>
