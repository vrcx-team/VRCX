<template>
    <div class="x-container">
        <!-- 工具栏 -->
        <div class="tool-slot">
            <el-select
                v-model="playerModerationTable.filters[0].value"
                @change="saveTableFilters()"
                multiple
                clearable
                style="flex: 1"
                :placeholder="t('view.moderation.filter_placeholder')">
                <el-option
                    v-for="item in moderationTypes"
                    :key="item"
                    :label="t('view.moderation.filters.' + item)"
                    :value="item" />
            </el-select>
            <el-input
                v-model="playerModerationTable.filters[1].value"
                :placeholder="t('view.moderation.search_placeholder')"
                class="filter-input" />
            <el-tooltip placement="bottom" :content="t('view.moderation.refresh_tooltip')">
                <el-button
                    type="default"
                    :loading="playerModerationTable.loading"
                    @click="refreshPlayerModerations()"
                    :icon="Refresh"
                    circle />
            </el-tooltip>
        </div>

        <DataTable v-bind="playerModerationTable">
            <el-table-column :label="t('table.moderation.date')" prop="created" :sortable="true" width="130">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.type')" prop="type" width="100">
                <template #default="scope">
                    <span v-text="t('view.moderation.filters.' + scope.row.type)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.source')" prop="sourceDisplayName">
                <template #default="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.sourceDisplayName"
                        @click="showUserDialog(scope.row.sourceUserId)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.target')" prop="targetDisplayName">
                <template #default="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.targetDisplayName"
                        @click="showUserDialog(scope.row.targetUserId)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.action')" width="80" align="right">
                <template #default="scope">
                    <template v-if="scope.row.sourceUserId === currentUser.id">
                        <el-button
                            v-if="shiftHeld"
                            style="color: #f56c6c"
                            text
                            :icon="Close"
                            size="small"
                            @click="deletePlayerModeration(scope.row)"></el-button>
                        <el-button
                            v-else
                            text
                            :icon="Close"
                            size="small"
                            @click="deletePlayerModerationPrompt(scope.row)"></el-button>
                    </template>
                </template>
            </el-table-column>
        </DataTable>
    </div>
</template>

<script setup>
    import { Close, Refresh } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useModerationStore, useUiStore, useUserStore } from '../../stores';
    import { formatDateFilter } from '../../shared/utils';
    import { moderationTypes } from '../../shared/constants';
    import { playerModerationRequest } from '../../api';

    import configRepository from '../../service/config.js';

    const { t } = useI18n();
    const { showUserDialog } = useUserStore();
    const { playerModerationTable } = storeToRefs(useModerationStore());
    const { refreshPlayerModerations, handlePlayerModerationDelete } = useModerationStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    async function init() {
        playerModerationTable.value.filters[0].value = JSON.parse(
            await configRepository.getString('VRCX_playerModerationTableFilters', '[]')
        );
    }

    init();

    function saveTableFilters() {
        configRepository.setString(
            'VRCX_playerModerationTableFilters',
            JSON.stringify(playerModerationTable.value.filters[0].value)
        );
    }

    async function deletePlayerModeration(row) {
        const args = await playerModerationRequest.deletePlayerModeration({
            moderated: row.targetUserId,
            type: row.type
        });
        handlePlayerModerationDelete(args);
    }

    function deletePlayerModerationPrompt(row) {
        ElMessageBox.confirm(`Continue? Delete Moderation ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deletePlayerModeration(row);
                }
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .tool-slot {
        margin: 0 0 10px;
        display: flex;
        align-items: center;
    }
    .filter-input {
        width: 150px;
        margin: 0 10px;
    }
</style>
