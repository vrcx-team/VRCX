<template>
    <div class="x-container">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                <el-tooltip placement="bottom" :content="t('view.feed.favorites_only_tooltip')">
                    <el-switch
                        v-model="gameLogTable.vip"
                        active-color="#13ce66"
                        @change="gameLogTableLookup"></el-switch>
                </el-tooltip>
            </div>
            <el-select
                v-model="gameLogTable.filter"
                multiple
                clearable
                style="flex: 1"
                :placeholder="t('view.game_log.filter_placeholder')"
                @change="gameLogTableLookup">
                <el-option
                    v-for="type in [
                        'Location',
                        'OnPlayerJoined',
                        'OnPlayerLeft',
                        'VideoPlay',
                        'Event',
                        'External',
                        'StringLoad',
                        'ImageLoad'
                    ]"
                    :key="type"
                    :label="t('view.game_log.filters.' + type)"
                    :value="type"></el-option>
            </el-select>
            <el-input
                v-model="gameLogTable.search"
                :placeholder="t('view.game_log.search_placeholder')"
                clearable
                style="flex: 0.4; margin-left: 10px"
                @keyup.enter="gameLogTableLookup"
                @change="gameLogTableLookup"></el-input>
        </div>

        <DataTable v-loading="gameLogTable.loading" v-bind="gameLogTable">
            <el-table-column :label="t('table.gameLog.date')" prop="created_at" :sortable="true" width="130">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.type')" prop="type" width="120">
                <template #default="scope">
                    <el-tooltip placement="right" :show-after="500">
                        <template #content>
                            <span>{{ t('view.game_log.filters.' + scope.row.type) }}</span>
                        </template>
                        <span
                            v-if="scope.row.location && scope.row.type !== 'Location'"
                            class="x-link"
                            @click="showWorldDialog(scope.row.location)"
                            v-text="t('view.game_log.filters.' + scope.row.type)"></span>
                        <span v-else v-text="t('view.game_log.filters.' + scope.row.type)"></span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.icon')" prop="isFriend" width="70" align="center">
                <template #default="scope">
                    <template v-if="gameLogIsFriend(scope.row)">
                        <el-tooltip v-if="gameLogIsFavorite(scope.row)" placement="top" content="Favorite">
                            <span>⭐</span>
                        </el-tooltip>
                        <el-tooltip v-else placement="top" content="Friend">
                            <span>💚</span>
                        </el-tooltip>
                    </template>
                    <span v-else></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.user')" prop="displayName" width="180">
                <template #default="scope">
                    <span
                        v-if="scope.row.displayName"
                        class="x-link"
                        style="padding-right: 10px"
                        @click="lookupUser(scope.row)"
                        v-text="scope.row.displayName"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.detail')" prop="data">
                <template #default="scope">
                    <Location
                        v-if="scope.row.type === 'Location'"
                        :location="scope.row.location"
                        :hint="scope.row.worldName"
                        :grouphint="scope.row.groupName" />
                    <Location
                        v-else-if="scope.row.type === 'PortalSpawn'"
                        :location="scope.row.instanceId"
                        :hint="scope.row.worldName"
                        :grouphint="scope.row.groupName" />
                    <template v-else-if="scope.row.type === 'Event'">
                        <span v-text="scope.row.data"></span>
                    </template>
                    <template v-else-if="scope.row.type === 'External'">
                        <span v-text="scope.row.message"></span>
                    </template>
                    <template v-else-if="scope.row.type === 'VideoPlay'">
                        <span v-if="scope.row.videoId" style="margin-right: 5px">{{ scope.row.videoId }}:</span>
                        <span
                            v-if="scope.row.videoId === 'LSMedia' || scope.row.videoId === 'PopcornPalace'"
                            v-text="scope.row.videoName"></span>
                        <span
                            v-else-if="scope.row.videoName"
                            class="x-link"
                            @click="openExternalLink(scope.row.videoUrl)"
                            v-text="scope.row.videoName"></span>
                        <span
                            v-else
                            class="x-link"
                            @click="openExternalLink(scope.row.videoUrl)"
                            v-text="scope.row.videoUrl"></span>
                    </template>
                    <template v-else-if="scope.row.type === 'ImageLoad'">
                        <span
                            class="x-link"
                            @click="openExternalLink(scope.row.resourceUrl)"
                            v-text="scope.row.resourceUrl"></span>
                    </template>
                    <template v-else-if="scope.row.type === 'StringLoad'">
                        <span
                            class="x-link"
                            @click="openExternalLink(scope.row.resourceUrl)"
                            v-text="scope.row.resourceUrl"></span>
                    </template>
                    <template
                        v-else-if="
                            scope.row.type === 'Notification' ||
                            scope.row.type === 'OnPlayerJoined' ||
                            scope.row.type === 'OnPlayerLeft'
                        ">
                    </template>
                    <span v-else class="x-link" v-text="scope.row.data"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.action')" width="80" align="right">
                <template #default="scope">
                    <template
                        v-if="
                            scope.row.type !== 'OnPlayerJoined' &&
                            scope.row.type !== 'OnPlayerLeft' &&
                            scope.row.type !== 'Location' &&
                            scope.row.type !== 'PortalSpawn'
                        ">
                        <el-button
                            v-if="shiftHeld"
                            style="color: #f56c6c"
                            type="text"
                            :icon="Close"
                            size="small"
                            class="small-button"
                            @click="deleteGameLogEntry(scope.row)"></el-button>
                        <el-button
                            v-else
                            type="text"
                            :icon="Delete"
                            size="small"
                            class="small-button"
                            @click="deleteGameLogEntryPrompt(scope.row)"></el-button>
                    </template>
                    <el-tooltip placement="top" :content="t('dialog.previous_instances.info')">
                        <el-button
                            v-if="scope.row.type === 'Location'"
                            type="text"
                            :icon="DataLine"
                            size="small"
                            class="small-button"
                            @click="showPreviousInstancesInfoDialog(scope.row.location)"></el-button>
                    </el-tooltip>
                </template>
            </el-table-column>
        </DataTable>
    </div>
</template>

<script setup>
    import { Close, DataLine, Delete } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGameLogStore, useInstanceStore, useUiStore, useUserStore, useWorldStore } from '../../stores';
    import { formatDateFilter, openExternalLink, removeFromArray } from '../../shared/utils';
    import { database } from '../../service/database';
    import { useSharedFeedStore } from '../../stores';

    const { showWorldDialog } = useWorldStore();
    const { lookupUser } = useUserStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { gameLogIsFriend, gameLogIsFavorite, gameLogTableLookup } = useGameLogStore();
    const { gameLogTable } = storeToRefs(useGameLogStore());
    const { updateSharedFeed } = useSharedFeedStore();

    const { t } = useI18n();
    const emit = defineEmits(['updateGameLogSessionTable']);

    function deleteGameLogEntry(row) {
        removeFromArray(gameLogTable.value.data, row);
        database.deleteGameLogEntry(row);
        console.log('deleteGameLogEntry', row);
        database.getGamelogDatabase().then((data) => {
            emit('updateGameLogSessionTable', data);
            updateSharedFeed(true);
        });
    }

    function deleteGameLogEntryPrompt(row) {
        ElMessageBox.confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteGameLogEntry(row);
                }
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .small-button {
        padding: 0;
        height: 18px;
    }
</style>
