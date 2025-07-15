<template>
    <safe-dialog
        ref="dialogRef"
        :visible="previousInstancesInfoDialogVisible"
        :title="$t('dialog.previous_instances.info')"
        width="800px"
        :fullscreen="fullscreen"
        destroy-on-close
        @close="closeDialog">
        <div style="display: flex; align-items: center; justify-content: space-between">
            <Location :location="location.tag" style="font-size: 14px" />
            <el-input
                v-model="dataTable.filters[0].value"
                :placeholder="$t('dialog.previous_instances.search_placeholder')"
                style="width: 150px"
                clearable></el-input>
        </div>
        <data-tables v-loading="loading" v-bind="dataTable" style="margin-top: 10px">
            <el-table-column :label="$t('table.previous_instances.date')" prop="created_at" sortable width="110">
                <template slot-scope="scope">
                    <el-tooltip placement="left">
                        <template slot="content">
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.gameLog.icon')" prop="isFriend" width="70" align="center">
                <template slot-scope="scope">
                    <template v-if="gameLogIsFriend(scope.row)">
                        <el-tooltip v-if="gameLogIsFavorite(scope.row)" placement="top" content="Favorite">
                            <span>⭐</span>
                        </el-tooltip>
                        <el-tooltip v-else placement="top" content="Friend">
                            <span>💚</span>
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.display_name')" prop="displayName" sortable>
                <template slot-scope="scope">
                    <span class="x-link" @click="lookupUser(scope.row)">{{ scope.row.displayName }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.time')" prop="time" width="100" sortable>
                <template slot-scope="scope">
                    <span>{{ scope.row.timer }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="$t('table.previous_instances.count')" prop="count" width="100" sortable>
                <template slot-scope="scope">
                    <span>{{ scope.row.count }}</span>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, nextTick } from 'vue';
    import { storeToRefs } from 'pinia';
    import { database } from '../../../service/database';
    import {
        adjustDialogZ,
        compareByCreatedAt,
        parseLocation,
        timeToText,
        formatDateFilter
    } from '../../../shared/utils';
    import { useGameLogStore, useInstanceStore, useUserStore } from '../../../stores';

    const { lookupUser } = useUserStore();
    const { previousInstancesInfoDialogVisible, previousInstancesInfoDialogInstanceId } =
        storeToRefs(useInstanceStore());
    const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();

    const dialogRef = ref(null);

    const loading = ref(false);
    const location = ref({});
    const dataTable = ref({
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
    });
    const fullscreen = ref(false);

    watch(
        () => previousInstancesInfoDialogVisible.value,
        (value) => {
            if (value) {
                nextTick(() => {
                    init();
                    refreshPreviousInstancesInfoTable();
                });
            }
        }
    );

    function init() {
        adjustDialogZ(dialogRef.value.$el);
        loading.value = true;
        location.value = parseLocation(previousInstancesInfoDialogInstanceId.value);
    }

    function refreshPreviousInstancesInfoTable() {
        database.getPlayersFromInstance(location.value.tag).then((data) => {
            const array = [];
            for (const entry of Array.from(data.values())) {
                entry.timer = timeToText(entry.time);
                array.push(entry);
            }
            array.sort(compareByCreatedAt);
            dataTable.value.data = array;
            loading.value = false;
        });
    }

    function closeDialog() {
        previousInstancesInfoDialogVisible.value = false;
    }
</script>
