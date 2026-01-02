<template>
    <div class="x-container" ref="friendLogRef">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <el-select
                v-model="friendLogTable.filters[0].value"
                multiple
                clearable
                style="flex: 1"
                :placeholder="t('view.friend_log.filter_placeholder')"
                @change="saveTableFilters">
                <el-option
                    v-for="type in [
                        'Friend',
                        'Unfriend',
                        'FriendRequest',
                        'CancelFriendRequest',
                        'DisplayName',
                        'TrustLevel'
                    ]"
                    :key="type"
                    :label="t('view.friend_log.filters.' + type)"
                    :value="type" />
            </el-select>
            <el-input
                v-model="friendLogTable.filters[1].value"
                :placeholder="t('view.friend_log.search_placeholder')"
                style="flex: 0.4; margin-left: 10px" />
        </div>

        <DataTable v-bind="friendLogTable" :data="friendLogDisplayData">
            <el-table-column :label="t('table.friendLog.date')" prop="created_at" width="200">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.type')" prop="type" width="200">
                <template #default="scope">
                    <el-tag type="info" effect="plain" size="small"
                        ><span v-text="t('view.friend_log.filters.' + scope.row.type)"></span
                    ></el-tag>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.user')" prop="displayName">
                <template #default="scope">
                    <span v-if="scope.row.type === 'DisplayName'">{{ scope.row.previousDisplayName }} → </span>
                    <span
                        class="x-link table-user"
                        style="padding-right: 10px"
                        @click="showUserDialog(scope.row.userId)"
                        >{{ scope.row.displayName || scope.row.userId }}
                    </span>
                    <template v-if="scope.row.type === 'TrustLevel'">
                        <span>({{ scope.row.previousTrustLevel }} → {{ scope.row.trustLevel }})</span>
                    </template>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.action')" width="80" align="right">
                <template #default="scope">
                    <el-button
                        v-if="shiftHeld"
                        style="color: var(--el-color-danger)"
                        text
                        :icon="Close"
                        size="small"
                        class="button-pd-0"
                        @click="deleteFriendLog(scope.row)"></el-button>
                    <i
                        v-else
                        class="ri-delete-bin-line"
                        style="opacity: 0.85"
                        @click="deleteFriendLogPrompt(scope.row)"></i>
                </template>
            </el-table-column>
            <el-table-column width="5"></el-table-column>
        </DataTable>
    </div>
</template>

<script setup>
    import { computed, watch } from 'vue';
    import { Close } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useAppearanceSettingsStore, useFriendStore, useUiStore, useUserStore } from '../../stores';
    import { formatDateFilter, removeFromArray } from '../../shared/utils';
    import { database } from '../../service/database';
    import { useTableHeight } from '../../composables/useTableHeight';

    import configRepository from '../../service/config';

    const { hideUnfriends } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { friendLogTable } = storeToRefs(useFriendStore());
    const { shiftHeld } = storeToRefs(useUiStore());

    const { containerRef: friendLogRef } = useTableHeight(friendLogTable);

    const friendLogDisplayData = computed(() => {
        const data = friendLogTable.value.data;
        return data.slice().sort((a, b) => {
            const aTime = typeof a?.created_at === 'string' ? a.created_at : '';
            const bTime = typeof b?.created_at === 'string' ? b.created_at : '';
            const aTs = dayjs(aTime).valueOf();
            const bTs = dayjs(bTime).valueOf();
            if (Number.isFinite(aTs) && Number.isFinite(bTs) && aTs !== bTs) {
                return bTs - aTs;
            }

            const aId = typeof a?.rowId === 'number' ? a.rowId : 0;
            const bId = typeof b?.rowId === 'number' ? b.rowId : 0;
            return bId - aId;
        });
    });

    watch(
        () => hideUnfriends.value,
        (newValue) => {
            friendLogTable.value.filters[2].value = newValue;
        },
        { immediate: true }
    );

    const { t } = useI18n();
    function saveTableFilters() {
        configRepository.setString('VRCX_friendLogTableFilters', JSON.stringify(friendLogTable.value.filters[0].value));
    }
    function deleteFriendLogPrompt(row) {
        ElMessageBox.confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteFriendLog(row);
                }
            })
            .catch(() => {});
    }
    function deleteFriendLog(row) {
        removeFromArray(friendLogTable.value.data, row);
        database.deleteFriendLogHistory(row.rowId);
    }
</script>

<style scoped>
    .button-pd-0 {
        padding: 0 !important;
    }
    .table-user {
        color: var(--x-table-user-text-color);
    }
</style>
