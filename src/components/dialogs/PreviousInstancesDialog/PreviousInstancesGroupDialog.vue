<template>
    <safe-dialog
        ref="previousInstancesGroupDialogRef"
        :visible.sync="isVisible"
        :title="t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesGroupDialog.groupRef.name"></span>
            <el-input
                v-model="previousInstancesGroupDialogTable.filters[0].value"
                :placeholder="t('dialog.previous_instances.search_placeholder')"
                style="width: 150px" />
        </div>

        <data-tables v-loading="loading" v-bind="previousInstancesGroupDialogTable" style="margin-top: 10px">
            <el-table-column :label="t('table.previous_instances.date')" prop="created_at" sortable width="170">
                <template #default="scope">
                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.previous_instances.instance_name')" prop="name">
                <template #default="scope">
                    <Location
                        :location="scope.row.$location.tag"
                        :grouphint="scope.row.groupName"
                        :hint="scope.row.worldName" />
                </template>
            </el-table-column>

            <el-table-column :label="t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template #default="scope">
                    <span v-text="scope.row.timer"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.previous_instances.action')" width="90" align="right">
                <template #default="scope">
                    <el-button
                        type="text"
                        icon="el-icon-s-data"
                        size="mini"
                        @click="showPreviousInstancesInfoDialog(scope.row.location)" />
                    <el-button
                        v-if="shiftHeld"
                        style="color: #f56c6c"
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogGroupInstance(scope.row)" />
                    <el-button
                        v-else
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteGameLogGroupInstancePrompt(scope.row)" />
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script setup>
    import { ref, reactive, computed, watch, nextTick, getCurrentInstance } from 'vue';
    import {
        parseLocation,
        compareByCreatedAt,
        timeToText,
        removeFromArray,
        adjustDialogZ,
        formatDateFilter
    } from '../../../shared/utils';
    import { database } from '../../../service/database';
    import { useI18n } from 'vue-i18n-bridge';
    import { useInstanceStore, useUiStore } from '../../../stores';

    const { proxy } = getCurrentInstance();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = useUiStore();
    const { t } = useI18n();

    const previousInstancesGroupDialogRef = ref(null);
    const loading = ref(false);

    const previousInstancesGroupDialogTable = reactive({
        data: [],
        filters: [{ prop: 'groupName', value: '' }],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: { prop: 'created_at', order: 'descending' }
        },
        pageSize: 10,
        paginationProps: { small: true, layout: 'sizes,prev,pager,next,total', pageSizes: [10, 25, 50, 100] }
    });

    const props = defineProps({
        previousInstancesGroupDialog: { type: Object, required: true }
    });
    const emit = defineEmits(['update:previousInstancesGroupDialog']);

    const isVisible = computed({
        get: () => props.previousInstancesGroupDialog.visible,
        set: (value) => {
            emit('update:previousInstancesGroupDialog', {
                ...props.previousInstancesGroupDialog,
                visible: value
            });
        }
    });

    watch(
        () => props.previousInstancesGroupDialog.openFlg,
        () => {
            if (props.previousInstancesGroupDialog.visible) {
                nextTick(() => {
                    adjustDialogZ(previousInstancesGroupDialogRef.value.$el);
                });
                refreshPreviousInstancesGroupTable();
            }
        }
    );

    function refreshPreviousInstancesGroupTable() {
        loading.value = true;
        const D = props.previousInstancesGroupDialog;
        database.getPreviousInstancesByGroupId(D.groupRef.id).then((data) => {
            const array = [];
            for (const ref of data.values()) {
                ref.$location = parseLocation(ref.location);
                ref.timer = ref.time > 0 ? timeToText(ref.time) : '';
                array.push(ref);
            }
            array.sort(compareByCreatedAt);
            previousInstancesGroupDialogTable.data = array;
            loading.value = false;
        });
    }

    function deleteGameLogGroupInstance(row) {
        database.deleteGameLogInstanceByInstanceId({ location: row.location });
        removeFromArray(previousInstancesGroupDialogTable.data, row);
    }

    function deleteGameLogGroupInstancePrompt(row) {
        proxy.$confirm('Continue? Delete GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteGameLogGroupInstance(row);
                }
            }
        });
    }
</script>
