<template>
    <el-dialog
        :z-index="previousInstancesUserDialogIndex"
        v-model="isVisible"
        :title="t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesUserDialog.userRef.displayName"></span>
            <el-input
                v-model="previousInstancesUserDialogTable.filters[0].value"
                :placeholder="t('dialog.previous_instances.search_placeholder')"
                style="display: block; width: 150px"></el-input>
        </div>
        <DataTable :loading="loading" v-bind="previousInstancesUserDialogTable" style="margin-top: 10px">
            <el-table-column :label="t('table.previous_instances.date')" prop="created_at" sortable width="170">
                <template #default="scope">
                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.world')" prop="name" sortable>
                <template #default="scope">
                    <Location
                        :location="scope.row.location"
                        :hint="scope.row.worldName"
                        :grouphint="scope.row.groupName" />
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.instance_creator')" prop="location" width="170">
                <template #default="scope">
                    <DisplayName :userid="scope.row.$location.userId" :location="scope.row.$location.tag" />
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template #default="scope">
                    <span v-text="scope.row.timer"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.action')" width="90" align="right">
                <template #default="scope">
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="button-pd-0 w-6 h-6 text-xs"
                        @click="showLaunchDialog(scope.row.location)"
                        ><i class="ri-door-open-line"></i
                    ></Button>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="button-pd-0 w-6 h-6 text-xs"
                        @click="showPreviousInstancesInfoDialog(scope.row.location)"
                        ><i class="ri-information-line"></i
                    ></Button>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        v-if="shiftHeld"
                        style="color: #f56c6c"
                        class="button-pd-0 w-6 h-6 text-xs"
                        @click="deleteGameLogUserInstance(scope.row)"
                        ><i class="ri-delete-bin-line"></i
                    ></Button>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        v-else
                        class="button-pd-0 w-6 h-6 text-xs"
                        @click="deleteGameLogUserInstancePrompt(scope.row)"
                        ><i class="ri-delete-bin-line"></i
                    ></Button>
                </template>
            </el-table-column>
        </DataTable>
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, reactive, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        compareByCreatedAt,
        formatDateFilter,
        parseLocation,
        removeFromArray,
        timeToText
    } from '../../../shared/utils';
    import { useInstanceStore, useLaunchStore, useUiStore } from '../../../stores';
    import { database } from '../../../service/database';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';

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
                    tableProps: { stripe: true, size: 'small', height: '400px' }
                }
            })
        }
    });

    const emit = defineEmits(['update:previous-instances-user-dialog']);
    const loading = ref(false);
    const previousInstancesUserDialogTable = reactive({
        data: [],
        filters: [{ prop: 'worldName', value: '' }],
        tableProps: {
            stripe: true,
            size: 'small',
            defaultSort: { prop: 'created_at', order: 'descending' }
        },
        pageSize: 10,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });

    const { showLaunchDialog } = useLaunchStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { t } = useI18n();

    const previousInstancesUserDialogIndex = ref(2000);

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
                    previousInstancesUserDialogIndex.value = getNextDialogIndex();
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
        ElMessageBox.confirm('Continue? Delete User From GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') deleteGameLogUserInstance(row);
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .button-pd-0 {
        padding: 0;
    }
</style>
