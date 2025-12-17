<template>
    <el-dialog
        :z-index="previousInstancesGroupDialogIndex"
        v-model="isVisible"
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

        <DataTable v-loading="loading" v-bind="previousInstancesGroupDialogTable" style="margin-top: 10px">
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
                        text
                        :icon="DataLine"
                        size="small"
                        @click="showPreviousInstancesInfoDialog(scope.row.location)" />
                    <el-button
                        v-if="shiftHeld"
                        style="color: #f56c6c"
                        text
                        :icon="Close"
                        size="small"
                        @click="deleteGameLogGroupInstance(scope.row)" />
                    <el-button
                        v-else
                        text
                        :icon="Close"
                        size="small"
                        @click="deleteGameLogGroupInstancePrompt(scope.row)" />
                </template>
            </el-table-column>
        </DataTable>
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, reactive, ref, watch } from 'vue';
    import { Close, DataLine } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { useI18n } from 'vue-i18n';

    import {
        compareByCreatedAt,
        formatDateFilter,
        parseLocation,
        removeFromArray,
        timeToText
    } from '../../../shared/utils';
    import { useInstanceStore, useUiStore } from '../../../stores';
    import { database } from '../../../service/database';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';

    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = useUiStore();
    const { t } = useI18n();

    const previousInstancesGroupDialogIndex = ref(2000);
    const loading = ref(false);

    const previousInstancesGroupDialogTable = reactive({
        data: [],
        filters: [{ prop: 'groupName', value: '' }],
        tableProps: {
            stripe: true,
            size: 'small',
            defaultSort: { prop: 'created_at', order: 'descending' }
        },
        pageSize: 10,
        paginationProps: { layout: 'sizes,prev,pager,next,total' }
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
                    previousInstancesGroupDialogIndex.value = getNextDialogIndex();
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
        ElMessageBox.confirm('Continue? Delete GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteGameLogGroupInstance(row);
                }
            })
            .catch(() => {});
    }
</script>
