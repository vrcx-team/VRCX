<template>
    <safe-dialog
        ref="previousInstancesUserDialog"
        :visible.sync="isVisible"
        :title="$t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesUserDialog.userRef.displayName"></span>
            <el-input
                v-model="previousInstancesUserDialogTable.filters[0].value"
                :placeholder="$t('dialog.previous_instances.search_placeholder')"
                style="display: block; width: 150px"></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="previousInstancesUserDialogTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.previous_instances.date')" prop="created_at" sortable width="170">
                <template slot-scope="scope">
                    <span>{{ scope.row.created_at | formatDate('long') }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.world')" prop="name" sortable>
                <template slot-scope="scope">
                    <location
                        :location="scope.row.location"
                        :hint="scope.row.worldName"
                        :grouphint="scope.row.groupName"></location>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.instance_creator')" prop="location" width="170">
                <template slot-scope="scope">
                    <display-name
                        :userid="scope.row.$location.userId"
                        :location="scope.row.$location.tag"></display-name>
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
                        icon="el-icon-switch-button"
                        size="mini"
                        @click="showLaunchDialog(scope.row.location)"></el-button>
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
                        @click="deleteGameLogUserInstance(scope.row)"></el-button>
                    <el-button
                        v-else
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogUserInstancePrompt(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script>
    import utils from '../../../classes/utils';
    import { parseLocation } from '../../../composables/instance/utils';
    import database from '../../../service/database';
    import Location from '../../Location.vue';

    export default {
        name: 'PreviousInstancesUserDialog',
        components: {
            Location
        },
        inject: ['adjustDialogZ', 'showLaunchDialog', 'showPreviousInstancesInfoDialog'],
        props: {
            previousInstancesUserDialog: {
                type: Object,
                default: () => ({
                    visible: false,
                    userRef: {},
                    loading: false,
                    forceUpdate: 0,
                    previousInstances: [],
                    previousInstancesTable: {
                        data: [],
                        filters: [
                            {
                                prop: 'displayName',
                                value: ''
                            }
                        ],
                        tableProps: {
                            stripe: true,
                            size: 'mini',
                            height: '400px'
                        }
                    }
                })
            },
            shiftHeld: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                previousInstancesUserDialogTable: {
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
                    return this.previousInstancesUserDialog.visible;
                },
                set(value) {
                    this.$emit('update:previous-instances-user-dialog', {
                        ...this.previousInstancesUserDialog,
                        visible: value
                    });
                }
            }
        },
        watch: {
            'previousInstancesUserDialog.openFlg'() {
                if (this.previousInstancesUserDialog.visible) {
                    this.$nextTick(() => {
                        this.adjustDialogZ(this.$refs.previousInstancesUserDialog.$el);
                    });
                    this.refreshPreviousInstancesUserTable();
                }
            }
        },
        methods: {
            refreshPreviousInstancesUserTable() {
                this.loading = true;
                database.getpreviousInstancesByUserId(this.previousInstancesUserDialog.userRef).then((data) => {
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
                    this.previousInstancesUserDialogTable.data = array;
                    this.loading = false;
                });
            },
            deleteGameLogUserInstance(row) {
                database.deleteGameLogInstance({
                    id: this.previousInstancesUserDialog.userRef.id,
                    displayName: this.previousInstancesUserDialog.userRef.displayName,
                    location: row.location
                });
                utils.removeFromArray(this.previousInstancesUserDialogTable.data, row);
            },
            deleteGameLogUserInstancePrompt(row) {
                this.$confirm('Continue? Delete User From GameLog Instance', 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            this.deleteGameLogUserInstance(row);
                        }
                    }
                });
            }
        }
    };
</script>
