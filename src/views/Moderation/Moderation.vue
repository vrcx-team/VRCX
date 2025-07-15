<template>
    <div v-show="menuActiveIndex === 'moderation'" class="x-container">
        <data-tables
            :data="playerModerationTable.data"
            :pageSize="playerModerationTable.pageSize"
            :filters="filters"
            :tableProps="tableProps"
            :paginationProps="paginationProps"
            v-loading="isPlayerModerationsLoading">
            <template slot="tool">
                <div class="tool-slot">
                    <el-select
                        v-model="filters[0].value"
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
                        v-model="filters[1].value"
                        :placeholder="t('view.moderation.search_placeholder')"
                        class="filter-input" />
                    <el-tooltip
                        placement="bottom"
                        :content="t('view.moderation.refresh_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            type="default"
                            :loading="isPlayerModerationsLoading"
                            @click="refreshPlayerModerations()"
                            icon="el-icon-refresh"
                            circle />
                    </el-tooltip>
                </div>
            </template>
            <el-table-column :label="t('table.moderation.date')" prop="created" sortable="custom" width="120">
                <template slot-scope="scope">
                    <el-tooltip placement="right">
                        <template slot="content">
                            <span>{{ formatDateFilter(scope.row.created, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.type')" prop="type" width="100">
                <template slot-scope="scope">
                    <span v-text="t('view.moderation.filters.' + scope.row.type)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.source')" prop="sourceDisplayName">
                <template slot-scope="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.sourceDisplayName"
                        @click="showUserDialog(scope.row.sourceUserId)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.target')" prop="targetDisplayName">
                <template slot-scope="scope">
                    <span
                        class="x-link"
                        v-text="scope.row.targetDisplayName"
                        @click="showUserDialog(scope.row.targetUserId)"></span>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.moderation.action')" width="80" align="right">
                <template slot-scope="scope">
                    <template v-if="scope.row.sourceUserId === currentUser.id">
                        <el-button
                            v-if="shiftHeld"
                            style="color: #f56c6c"
                            type="text"
                            icon="el-icon-close"
                            size="mini"
                            @click="deletePlayerModeration(scope.row)"></el-button>
                        <el-button
                            v-else
                            type="text"
                            icon="el-icon-close"
                            size="mini"
                            @click="deletePlayerModerationPrompt(scope.row)"></el-button>
                    </template>
                </template>
            </el-table-column>
        </data-tables>
    </div>
</template>

<script setup>
    import { getCurrentInstance, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { playerModerationRequest } from '../../api';
    import configRepository from '../../service/config.js';
    import { useUiStore, useModerationStore, useUserStore, useAppearanceSettingsStore } from '../../stores';
    import { moderationTypes } from '../../shared/constants';
    import { formatDateFilter } from '../../shared/utils';

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { isPlayerModerationsLoading, playerModerationTable } = storeToRefs(useModerationStore());
    const { refreshPlayerModerations, handlePlayerModerationDelete } = useModerationStore();
    const { menuActiveIndex, shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    const filters = ref([
        {
            prop: 'type',
            value: [],
            filterFn: (row, filter) => filter.value.some((v) => v === row.type)
        },
        {
            prop: ['sourceDisplayName', 'targetDisplayName'],
            value: ''
        }
    ]);

    const tableProps = ref({
        stripe: true,
        size: 'mini',
        defaultSort: {
            prop: 'created',
            order: 'descending'
        }
    });

    const paginationProps = ref({
        small: true,
        layout: 'sizes,prev,pager,next,total',
        pageSizes: [10, 15, 20, 25, 50, 100]
    });

    async function init() {
        filters.value[0].value = JSON.parse(
            await configRepository.getString('VRCX_playerModerationTableFilters', '[]')
        );
    }

    init();

    function saveTableFilters() {
        configRepository.setString('VRCX_playerModerationTableFilters', JSON.stringify(filters.value[0].value));
    }

    async function deletePlayerModeration(row) {
        const args = await playerModerationRequest.deletePlayerModeration({
            moderated: row.targetUserId,
            type: row.type
        });
        handlePlayerModerationDelete(args);
    }

    function deletePlayerModerationPrompt(row) {
        proxy.$confirm(`Continue? Delete Moderation ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deletePlayerModeration(row);
                }
            }
        });
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
