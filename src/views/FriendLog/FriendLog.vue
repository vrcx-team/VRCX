<template>
    <div v-show="menuActiveIndex === 'friendLog'" class="x-container">
        <data-tables v-bind="friendLogTable">
            <template #tool>
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
                        style="flex: none; width: 150px; margin-left: 10px" />
                </div>
            </template>

            <el-table-column :label="t('table.friendLog.date')" prop="created_at" sortable="custom" width="200">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.type')" prop="type" width="150">
                <template #default="scope">
                    <span v-text="t('view.friend_log.filters.' + scope.row.type)"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.user')" prop="displayName">
                <template #default="scope">
                    <span v-if="scope.row.type === 'DisplayName'">
                        {{ scope.row.previousDisplayName }} <i class="el-icon-right"></i>&nbsp;
                    </span>
                    <span
                        class="x-link"
                        style="padding-right: 10px"
                        @click="showUserDialog(scope.row.userId)"
                        v-text="scope.row.displayName || scope.row.userId"></span>
                    <template v-if="scope.row.type === 'TrustLevel'">
                        <span>
                            ({{ scope.row.previousTrustLevel }} <i class="el-icon-right"></i>
                            {{ scope.row.trustLevel }})</span
                        >
                    </template>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.friendLog.action')" width="80" align="right">
                <template #default="scope">
                    <el-button
                        v-if="shiftHeld"
                        style="color: #f56c6c"
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="deleteFriendLog(scope.row)"></el-button>
                    <el-button
                        v-else
                        type="text"
                        icon="el-icon-delete"
                        size="mini"
                        @click="deleteFriendLogPrompt(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../service/config';
    import { database } from '../../service/database';
    import { removeFromArray, formatDateFilter } from '../../shared/utils';
    import { useAppearanceSettingsStore, useUiStore, useFriendStore, useUserStore } from '../../stores';

    const { hideUnfriends } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { friendLogTable } = storeToRefs(useFriendStore());
    const { shiftHeld } = storeToRefs(useUiStore());
    const { menuActiveIndex } = storeToRefs(useUiStore());

    watch(
        () => hideUnfriends.value,
        (newValue) => {
            friendLogTable.value.filters[2].value = newValue;
        },
        { immediate: true }
    );

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    function saveTableFilters() {
        configRepository.setString('VRCX_friendLogTableFilters', JSON.stringify(friendLogTable.value.filters[0].value));
    }
    function deleteFriendLogPrompt(row) {
        proxy.$confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteFriendLog(row);
                }
            }
        });
    }
    function deleteFriendLog(row) {
        removeFromArray(friendLogTable.value.data, row);
        database.deleteFriendLogHistory(row.rowId);
    }
</script>
