<template>
    <safe-dialog
        ref="previousInstancesWorldDialogRef"
        :visible.sync="isVisible"
        :title="t('dialog.previous_instances.header')"
        width="1000px"
        append-to-body>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <span style="font-size: 14px" v-text="previousInstancesWorldDialog.worldRef.name"></span>
            <el-input
                v-model="previousInstancesWorldDialogTable.filters[0].value"
                :placeholder="t('dialog.previous_instances.search_placeholder')"
                style="display: block; width: 150px"></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="previousInstancesWorldDialogTable" style="margin-top: 10px">
            <el-table-column :label="t('table.previous_instances.date')" prop="created_at" sortable width="170">
                <template #default="scope">
                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.instance_name')" prop="name">
                <template #default="scope">
                    <LocationWorld
                        :locationobject="scope.row.$location"
                        :grouphint="scope.row.groupName"
                        :currentuserid="currentUser.id" />
                </template>
            </el-table-column>
            <el-table-column :label="t('table.previous_instances.instance_creator')" prop="location">
                <template #default="scope">
                    <DisplayName
                        :userid="scope.row.$location.userId"
                        :location="scope.row.$location.tag"
                        :force-update-key="previousInstancesWorldDialog.forceUpdate" />
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
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { database } from '../../../service/database';
    import {
        adjustDialogZ,
        compareByCreatedAt,
        parseLocation,
        removeFromArray,
        timeToText,
        formatDateFilter
    } from '../../../shared/utils';
    import { useInstanceStore, useUiStore, useUserStore } from '../../../stores';

    const { proxy } = getCurrentInstance();
    const { t } = useI18n();

    const props = defineProps({
        previousInstancesWorldDialog: {
            type: Object,
            required: true
        }
    });
    const emit = defineEmits(['update:previous-instances-world-dialog']);

    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    const previousInstancesWorldDialogTable = reactive({
        data: [],
        filters: [{ prop: 'groupName', value: '' }],
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
    const loading = ref(false);
    const previousInstancesWorldDialogRef = ref(null);

    const isVisible = computed({
        get: () => props.previousInstancesWorldDialog.visible,
        set: (value) => {
            emit('update:previous-instances-world-dialog', {
                ...props.previousInstancesWorldDialog,
                visible: value
            });
        }
    });

    function refreshPreviousInstancesWorldTable() {
        loading.value = true;
        const D = props.previousInstancesWorldDialog;
        database.getPreviousInstancesByWorldId(D.worldRef).then((data) => {
            const array = [];
            for (const ref of data.values()) {
                ref.$location = parseLocation(ref.location);
                ref.timer = ref.time > 0 ? timeToText(ref.time) : '';
                array.push(ref);
            }
            array.sort(compareByCreatedAt);
            previousInstancesWorldDialogTable.data = array;
            loading.value = false;
        });
    }

    function deleteGameLogWorldInstance(row) {
        database.deleteGameLogInstanceByInstanceId({ location: row.location });
        removeFromArray(previousInstancesWorldDialogTable.data, row);
    }

    function deleteGameLogWorldInstancePrompt(row) {
        proxy.$confirm('Continue? Delete GameLog Instance', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteGameLogWorldInstance(row);
                }
            }
        });
    }

    watch(
        () => props.previousInstancesWorldDialog.openFlg,
        () => {
            if (props.previousInstancesWorldDialog.visible) {
                nextTick(() => {
                    adjustDialogZ(previousInstancesWorldDialogRef.value.$el);
                });
                refreshPreviousInstancesWorldTable();
            }
        }
    );
</script>
