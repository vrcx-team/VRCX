<template>
    <safe-dialog
        ref="previousInstancesUserDialogRef"
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
                <template #default="scope">
                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.world')" prop="name" sortable>
                <template #default="scope">
                    <Location
                        :location="scope.row.location"
                        :hint="scope.row.worldName"
                        :grouphint="scope.row.groupName" />
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.instance_creator')" prop="location" width="170">
                <template #default="scope">
                    <DisplayName :userid="scope.row.$location.userId" :location="scope.row.$location.tag" />
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template #default="scope">
                    <span v-text="scope.row.timer"></span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.action')" width="90" align="right">
                <template #default="scope">
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

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
    import { database } from '../../../service/database';
    import {
        adjustDialogZ,
        compareByCreatedAt,
        parseLocation,
        removeFromArray,
        timeToText,
        formatDateFilter
    } from '../../../shared/utils';
    import { useInstanceStore, useLaunchStore, useUiStore } from '../../../stores';

    const props = defineProps({
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
                    filters: [{ prop: 'displayName', value: '' }],
                    tableProps: { stripe: true, size: 'mini', height: '400px' }
                }
            })
        }
    });

    const emit = defineEmits(['update:previous-instances-user-dialog']);
    const { proxy } = getCurrentInstance();

    const loading = ref(false);
    const previousInstancesUserDialogTable = reactive({
        data: [],
        filters: [{ prop: 'worldName', value: '' }],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: { prop: 'created_at', order: 'descending' }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    });

    const { showLaunchDialog } = useLaunchStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    const previousInstancesUserDialogRef = ref(null);

    const isVisible = computed({
        get: () => props.previousInstancesUserDialog.visible,
        set: (value) => {
            emit('update:previous-instances-user-dialog', {
                ...props.previousInstancesUserDialog,
                visible: value
            });
        }
    });

    const refreshPreviousInstancesUserTable = async () => {
        loading.value = true;
        const data = await database.getPreviousInstancesByUserId(props.previousInstancesUserDialog.userRef);
        const array = [];
        for (const item of data.values()) {
            item.$location = parseLocation(item.location);
            item.timer = item.time > 0 ? timeToText(item.time) : '';
            array.push(item);
        }
        array.sort(compareByCreatedAt);
        previousInstancesUserDialogTable.data = array;
        loading.value = false;
    };

    watch(
        () => props.previousInstancesUserDialog.openFlg,
        () => {
            if (props.previousInstancesUserDialog.visible) {
                nextTick(() => {
                    adjustDialogZ(previousInstancesUserDialogRef.value.$el);
                });
                refreshPreviousInstancesUserTable();
            }
        }
    );

    function deleteGameLogUserInstance(row) {
        database.deleteGameLogInstance({
            id: props.previousInstancesUserDialog.userRef.id,
            displayName: props.previousInstancesUserDialog.userRef.displayName,
            location: row.location,
            events: row.events
        });
        removeFromArray(previousInstancesUserDialogTable.data, row);
    }

    function deleteGameLogUserInstancePrompt(row) {
        proxy.$confirm('Continue? Delete User From GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') deleteGameLogUserInstance(row);
            }
        });
    }
</script>
