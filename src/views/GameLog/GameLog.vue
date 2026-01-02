<template>
    <div class="x-container" ref="gameLogRef">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                <el-tooltip placement="bottom" :content="t('view.feed.favorites_only_tooltip')">
                    <el-switch
                        v-model="gameLogTable.vip"
                        active-color="var(--el-color-success)"
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

        <DataTable v-bind="gameLogTable" :data="gameLogDisplayData">
            <el-table-column :label="t('table.gameLog.date')" prop="created_at" width="140">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.type')" prop="type" width="150">
                <template #default="scope">
                    <el-tag
                        v-if="scope.row.location && scope.row.type !== 'Location'"
                        type="info"
                        effect="plain"
                        size="small">
                        <span
                            class="x-link"
                            @click="showWorldDialog(scope.row.location)"
                            v-text="t('view.game_log.filters.' + scope.row.type)"></span>
                    </el-tag>
                    <el-tag v-else type="info" effect="plain" size="small">
                        <span v-text="t('view.game_log.filters.' + scope.row.type)"></span>
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.gameLog.user')" prop="displayName" width="200">
                <template #default="scope">
                    <span
                        v-if="scope.row.displayName"
                        class="x-link table-user"
                        style="padding-right: 10px"
                        @click="lookupUser(scope.row)"
                        v-text="scope.row.displayName"></span>
                    <template v-if="gameLogIsFriend(scope.row)">
                        <span v-if="gameLogIsFavorite(scope.row)">⭐</span>
                        <span v-else>💚</span>
                    </template>
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
                            text
                            :icon="Close"
                            size="small"
                            class="small-button"
                            @click="deleteGameLogEntry(scope.row)"></el-button>
                        <i
                            class="ri-delete-bin-line small-button"
                            style="opacity: 0.85"
                            v-else
                            @click="deleteGameLogEntryPrompt(scope.row)"></i>
                    </template>
                    <el-tooltip
                        v-if="scope.row.type === 'Location'"
                        placement="top"
                        :content="t('dialog.previous_instances.info')">
                        <el-button
                            v-if="shiftHeld"
                            text
                            :icon="DataLine"
                            size="small"
                            class="small-button"
                            @click="showPreviousInstancesInfoDialog(scope.row.location)"></el-button>
                        <i
                            v-else
                            style="opacity: 0.85"
                            class="ri-file-list-2-line small-button"
                            @click="showPreviousInstancesInfoDialog(scope.row.location)"></i>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column width="5"></el-table-column>
        </DataTable>
    </div>
</template>

<script setup>
    import { Close, DataLine } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useGameLogStore, useInstanceStore, useUiStore, useUserStore, useWorldStore } from '../../stores';
    import { formatDateFilter, openExternalLink, removeFromArray } from '../../shared/utils';
    import { database } from '../../service/database';
    import { useSharedFeedStore } from '../../stores';
    import { useTableHeight } from '../../composables/useTableHeight';

    const { showWorldDialog } = useWorldStore();
    const { lookupUser } = useUserStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { gameLogIsFriend, gameLogIsFavorite, gameLogTableLookup } = useGameLogStore();
    const { gameLogTable } = storeToRefs(useGameLogStore());
    const { updateSharedFeed } = useSharedFeedStore();

    function getGameLogCreatedAt(row) {
        if (typeof row?.created_at === 'string' && row.created_at.length > 0) {
            return row.created_at;
        }
        if (typeof row?.createdAt === 'string' && row.createdAt.length > 0) {
            return row.createdAt;
        }
        if (typeof row?.dt === 'string' && row.dt.length > 0) {
            return row.dt;
        }
        return '';
    }

    function getGameLogCreatedAtTs(row) {
        const createdAtRaw = row?.created_at ?? row?.createdAt ?? row?.dt;
        if (typeof createdAtRaw === 'number') {
            const ts = createdAtRaw > 1_000_000_000_000 ? createdAtRaw : createdAtRaw * 1000;
            return Number.isFinite(ts) ? ts : 0;
        }

        const createdAt = getGameLogCreatedAt(row);
        const ts = dayjs(createdAt).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const gameLogDisplayData = computed(() => {
        const data = gameLogTable.value.data;
        return data.slice().sort((a, b) => {
            const aTs = getGameLogCreatedAtTs(a);
            const bTs = getGameLogCreatedAtTs(b);
            if (aTs !== bTs) {
                return bTs - aTs;
            }

            const aRowId = typeof a?.rowId === 'number' ? a.rowId : 0;
            const bRowId = typeof b?.rowId === 'number' ? b.rowId : 0;
            if (aRowId !== bRowId) {
                return bRowId - aRowId;
            }

            const aUid = typeof a?.uid === 'string' ? a.uid : '';
            const bUid = typeof b?.uid === 'string' ? b.uid : '';
            return aUid < bUid ? 1 : aUid > bUid ? -1 : 0;
        });
    });

    const { t } = useI18n();
    const emit = defineEmits(['updateGameLogSessionTable']);

    const { containerRef: gameLogRef } = useTableHeight(gameLogTable);

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
        cursor: pointer;
    }
    .table-user {
        color: var(--x-table-user-text-color) !important;
    }
</style>
