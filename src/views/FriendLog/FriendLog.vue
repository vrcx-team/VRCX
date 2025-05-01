<template>
    <div v-if="menuActiveIndex === 'friendLog'" class="x-container">
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
                            <span>{{ scope.row.created_at | formatDate('long') }}</span>
                        </template>
                        <span>{{ scope.row.created_at | formatDate('short') }}</span>
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

<script>
    export default {
        name: 'FriendLogTab'
    };
</script>

<script setup>
    import { getCurrentInstance, inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import utils from '../../classes/utils';
    import configRepository from '../../service/config';
    import database from '../../service/database';

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();
    const { $confirm } = proxy;

    const showUserDialog = inject('showUserDialog');

    const props = defineProps({
        menuActiveIndex: {
            type: String,
            default: ''
        },
        friendLogTable: {
            type: Object,
            default: () => ({})
        },
        shiftHeld: { type: Boolean, default: false }
    });

    function saveTableFilters() {
        configRepository.setString('VRCX_friendLogTableFilters', JSON.stringify(props.friendLogTable.filters[0].value));
    }
    function deleteFriendLogPrompt(row) {
        $confirm('Continue? Delete Log', 'Confirm', {
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
        utils.removeFromArray(props.friendLogTable.data, row);
        database.deleteFriendLogHistory(row.rowId);
    }
</script>
