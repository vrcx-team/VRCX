<template>
    <div class="photon-event-table">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap">
            <Select
                :model-value="photonEventTableTypeFilter"
                multiple
                @update:modelValue="
                    (v) => {
                        photonEventTableTypeFilter = v;
                        photonEventTableFilterChange();
                    }
                ">
                <SelectTrigger style="width: 220px">
                    <SelectValue :placeholder="t('view.player_list.photon.filter_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="type in photonEventTableTypeFilterList" :key="type" :value="type">{{
                        type
                    }}</SelectItem>
                </SelectContent>
            </Select>
            <el-input
                v-model="photonEventTableFilter"
                :placeholder="t('view.player_list.photon.search_placeholder')"
                clearable
                style="width: 150px"
                @input="photonEventTableFilterChange"></el-input>
            <Button variant="outline" @click="emitShowChatboxBlacklist">{{
                t('view.player_list.photon.chatbox_blacklist')
            }}</Button>
            <TooltipWrapper side="bottom" :content="t('view.player_list.photon.status_tooltip')">
                <div style="display: inline-flex; align-items: center; font-size: 14px">
                    <span v-if="ipcEnabled && !photonEventIcon">🟢</span>
                    <span v-else-if="ipcEnabled">⚪</span>
                    <span v-else>🔴</span>
                </div>
            </TooltipWrapper>
        </div>
        <el-tabs type="card">
            <el-tab-pane :label="t('view.player_list.photon.current')">
                <DataTable v-bind="photonEventTable" style="margin-bottom: 10px">
                    <el-table-column :label="t('table.playerList.date')" prop="created_at" width="130">
                        <template #default="scope">
                            <TooltipWrapper side="right">
                                <template #content>
                                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                                </template>
                                <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                            </TooltipWrapper>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.user')" prop="photonId" width="160">
                        <template #default="scope">
                            <span
                                class="x-link"
                                style="padding-right: 10px"
                                @click="showUserFromPhotonId(scope.row.photonId)"
                                v-text="scope.row.displayName"></span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.type')" prop="type" width="140"></el-table-column>
                    <el-table-column :label="t('table.playerList.detail')" prop="text">
                        <template #default="scope">
                            <template v-if="scope.row.type === 'ChangeAvatar'">
                                <span
                                    class="x-link"
                                    @click="showAvatarDialog(scope.row.avatar.id)"
                                    v-text="scope.row.avatar.name"></span>
                                &nbsp;
                                <span v-if="!scope.row.inCache" style="color: #aaa"
                                    ><el-icon><Download /></el-icon>&nbsp;</span
                                >
                                <span v-if="scope.row.avatar.releaseStatus === 'public'" class="avatar-info-public">{{
                                    t('dialog.avatar.labels.public')
                                }}</span>
                                <span
                                    v-else-if="scope.row.avatar.releaseStatus === 'private'"
                                    class="avatar-info-own"
                                    >{{ t('dialog.avatar.labels.private') }}</span
                                >
                            </template>
                            <template v-else-if="scope.row.type === 'ChangeStatus'">
                                <template v-if="scope.row.status !== scope.row.previousStatus">
                                    <TooltipWrapper side="top">
                                        <template #content>
                                            <span v-if="scope.row.previousStatus === 'active'">{{
                                                t('dialog.user.status.active')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'join me'">{{
                                                t('dialog.user.status.join_me')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'ask me'">{{
                                                t('dialog.user.status.ask_me')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'busy'">{{
                                                t('dialog.user.status.busy')
                                            }}</span>
                                            <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                        </template>
                                        <i class="x-user-status" :class="statusClass(scope.row.previousStatus)"></i>
                                    </TooltipWrapper>
                                    <span>
                                        <el-icon><ArrowRight /></el-icon>
                                    </span>
                                    <TooltipWrapper side="top">
                                        <template #content>
                                            <span v-if="scope.row.status === 'active'">{{
                                                t('dialog.user.status.active')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'join me'">{{
                                                t('dialog.user.status.join_me')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'ask me'">{{
                                                t('dialog.user.status.ask_me')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'busy'">{{
                                                t('dialog.user.status.busy')
                                            }}</span>
                                            <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                        </template>
                                        <i
                                            class="x-user-status"
                                            :class="statusClass(scope.row.status)"
                                            style="margin-right: 5px"></i>
                                    </TooltipWrapper>
                                </template>
                                <span
                                    v-if="scope.row.statusDescription !== scope.row.previousStatusDescription"
                                    v-text="scope.row.statusDescription"></span>
                            </template>
                            <template v-else-if="scope.row.type === 'ChangeGroup'">
                                <span
                                    v-if="scope.row.previousGroupName"
                                    class="x-link"
                                    style="margin-right: 5px"
                                    @click="showGroupDialog(scope.row.previousGroupId)"
                                    v-text="scope.row.previousGroupName"></span>
                                <span
                                    v-else
                                    class="x-link"
                                    style="margin-right: 5px"
                                    @click="showGroupDialog(scope.row.previousGroupId)"
                                    v-text="scope.row.previousGroupId"></span>
                                <span>
                                    <el-icon><ArrowRight /></el-icon>
                                </span>
                                <span
                                    v-if="scope.row.groupName"
                                    class="x-link"
                                    style="margin-left: 5px"
                                    @click="showGroupDialog(scope.row.groupId)"
                                    v-text="scope.row.groupName"></span>
                                <span
                                    v-else
                                    class="x-link"
                                    style="margin-left: 5px"
                                    @click="showGroupDialog(scope.row.groupId)"
                                    v-text="scope.row.groupId"></span>
                            </template>
                            <span
                                v-else-if="scope.row.type === 'PortalSpawn'"
                                class="x-link"
                                @click="showWorldDialog(scope.row.location, scope.row.shortName)">
                                <Location
                                    :location="scope.row.location"
                                    :hint="scope.row.worldName"
                                    :grouphint="scope.row.groupName"
                                    :link="false" />
                            </span>
                            <span v-else-if="scope.row.type === 'ChatBoxMessage'" v-text="scope.row.text"></span>
                            <span v-else-if="scope.row.type === 'OnPlayerJoined'">
                                <span v-if="scope.row.platform === 'Desktop'" style="color: var(--el-color-primary)"
                                    >Desktop&nbsp;</span
                                >
                                <span v-else-if="scope.row.platform === 'VR'" style="color: var(--el-color-primary)"
                                    >VR&nbsp;</span
                                >
                                <span v-else-if="scope.row.platform === 'Quest'" style="color: var(--el-color-success)"
                                    >Android&nbsp;</span
                                >
                                <span
                                    class="x-link"
                                    @click="showAvatarDialog(scope.row.avatar.id)"
                                    v-text="scope.row.avatar.name"></span>
                                &nbsp;
                                <span v-if="!scope.row.inCache" style="color: #aaa"
                                    ><el-icon><Download /></el-icon>&nbsp;</span
                                >
                                <span v-if="scope.row.avatar.releaseStatus === 'public'" class="avatar-info-public">{{
                                    t('dialog.avatar.labels.public')
                                }}</span>
                                <span
                                    v-else-if="scope.row.avatar.releaseStatus === 'private'"
                                    class="avatar-info-own"
                                    >{{ t('dialog.avatar.labels.private') }}</span
                                >
                            </span>
                            <span v-else-if="scope.row.type === 'SpawnEmoji'">
                                <span v-if="scope.row.imageUrl">
                                    <TooltipWrapper side="right">
                                        <template #content>
                                            <img
                                                :src="scope.row.imageUrl"
                                                class="friends-list-avatar"
                                                style="height: 500px; cursor: pointer"
                                                @click="showFullscreenImageDialog(scope.row.imageUrl)"
                                                loading="lazy" />
                                        </template>
                                        <span v-text="scope.row.fileId"></span>
                                    </TooltipWrapper>
                                </span>
                                <span v-else v-text="scope.row.text"></span>
                            </span>
                            <span
                                v-else-if="scope.row.color === 'yellow'"
                                style="color: yellow"
                                v-text="scope.row.text"></span>
                            <span v-else v-text="scope.row.text"></span>
                        </template>
                    </el-table-column>
                </DataTable>
            </el-tab-pane>
            <el-tab-pane :label="t('view.player_list.photon.previous')">
                <DataTable v-bind="photonEventTablePrevious" style="margin-bottom: 10px">
                    <el-table-column :label="t('table.playerList.date')" prop="created_at" width="130">
                        <template #default="scope">
                            <TooltipWrapper side="right">
                                <template #content>
                                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                                </template>
                                <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                            </TooltipWrapper>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.user')" prop="photonId" width="160">
                        <template #default="scope">
                            <span
                                class="x-link"
                                style="padding-right: 10px"
                                @click="lookupUser(scope.row)"
                                v-text="scope.row.displayName"></span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.type')" prop="type" width="140"></el-table-column>
                    <el-table-column :label="t('table.playerList.detail')" prop="text">
                        <template #default="scope">
                            <template v-if="scope.row.type === 'ChangeAvatar'">
                                <span
                                    class="x-link"
                                    @click="showAvatarDialog(scope.row.avatar.id)"
                                    v-text="scope.row.avatar.name"></span>
                                &nbsp;
                                <span v-if="!scope.row.inCache" style="color: #aaa"
                                    ><el-icon><Download /></el-icon>&nbsp;</span
                                >
                                <span v-if="scope.row.avatar.releaseStatus === 'public'" class="avatar-info-public">{{
                                    t('dialog.avatar.labels.public')
                                }}</span>
                                <span
                                    v-else-if="scope.row.avatar.releaseStatus === 'private'"
                                    class="avatar-info-own"
                                    >{{ t('dialog.avatar.labels.private') }}</span
                                >
                                <template
                                    v-if="
                                        scope.row.avatar.description &&
                                        scope.row.avatar.name !== scope.row.avatar.description
                                    ">
                                    | - {{ scope.row.avatar.description }}
                                </template>
                            </template>
                            <template v-else-if="scope.row.type === 'ChangeStatus'">
                                <template v-if="scope.row.status !== scope.row.previousStatus">
                                    <TooltipWrapper side="top">
                                        <template #content>
                                            <span v-if="scope.row.previousStatus === 'active'">{{
                                                t('dialog.user.status.active')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'join me'">{{
                                                t('dialog.user.status.join_me')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'ask me'">{{
                                                t('dialog.user.status.ask_me')
                                            }}</span>
                                            <span v-else-if="scope.row.previousStatus === 'busy'">{{
                                                t('dialog.user.status.busy')
                                            }}</span>
                                            <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                        </template>
                                        <i class="x-user-status" :class="statusClass(scope.row.previousStatus)"></i>
                                    </TooltipWrapper>
                                    <span>
                                        <el-icon><ArrowRight /></el-icon>
                                    </span>
                                    <TooltipWrapper side="top">
                                        <template #content>
                                            <span v-if="scope.row.status === 'active'">{{
                                                t('dialog.user.status.active')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'join me'">{{
                                                t('dialog.user.status.join_me')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'ask me'">{{
                                                t('dialog.user.status.ask_me')
                                            }}</span>
                                            <span v-else-if="scope.row.status === 'busy'">{{
                                                t('dialog.user.status.busy')
                                            }}</span>
                                            <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                        </template>
                                        <i
                                            class="x-user-status"
                                            :class="statusClass(scope.row.status)"
                                            style="margin-right: 5px"></i>
                                    </TooltipWrapper>
                                </template>
                                <span
                                    v-if="scope.row.statusDescription !== scope.row.previousStatusDescription"
                                    v-text="scope.row.statusDescription"></span>
                            </template>
                            <template v-else-if="scope.row.type === 'ChangeGroup'">
                                <span
                                    v-if="scope.row.previousGroupName"
                                    class="x-link"
                                    style="margin-right: 5px"
                                    @click="showGroupDialog(scope.row.previousGroupId)"
                                    v-text="scope.row.previousGroupName"></span>
                                <span
                                    v-else
                                    class="x-link"
                                    style="margin-right: 5px"
                                    @click="showGroupDialog(scope.row.previousGroupId)"
                                    v-text="scope.row.previousGroupId"></span>
                                <span>
                                    <el-icon><ArrowRight /></el-icon>
                                </span>
                                <span
                                    v-if="scope.row.groupName"
                                    class="x-link"
                                    style="margin-left: 5px"
                                    @click="showGroupDialog(scope.row.groupId)"
                                    v-text="scope.row.groupName"></span>
                                <span
                                    v-else
                                    class="x-link"
                                    style="margin-left: 5px"
                                    @click="showGroupDialog(scope.row.groupId)"
                                    v-text="scope.row.groupId"></span>
                            </template>
                            <span
                                v-else-if="scope.row.type === 'PortalSpawn'"
                                class="x-link"
                                @click="showWorldDialog(scope.row.location, scope.row.shortName)">
                                <Location
                                    :location="scope.row.location"
                                    :hint="scope.row.worldName"
                                    :grouphint="scope.row.groupName"
                                    :link="false" />
                            </span>
                            <span v-else-if="scope.row.type === 'ChatBoxMessage'" v-text="scope.row.text"></span>
                            <span v-else-if="scope.row.type === 'SpawnEmoji'">
                                <span v-if="scope.row.imageUrl">
                                    <TooltipWrapper side="right">
                                        <template #content>
                                            <img
                                                :src="scope.row.imageUrl"
                                                class="friends-list-avatar"
                                                style="height: 500px; cursor: pointer"
                                                @click="showFullscreenImageDialog(scope.row.imageUrl)"
                                                loading="lazy" />
                                        </template>
                                        <span v-text="scope.row.fileId"></span>
                                    </TooltipWrapper>
                                </span>
                                <span v-else v-text="scope.row.text"></span>
                            </span>
                            <span
                                v-else-if="scope.row.color === 'yellow'"
                                style="color: yellow"
                                v-text="scope.row.text"></span>
                            <span v-else v-text="scope.row.text"></span>
                        </template>
                    </el-table-column>
                </DataTable>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
    import { ArrowRight, Download } from '@element-plus/icons-vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAvatarStore,
        useGalleryStore,
        useGroupStore,
        usePhotonStore,
        useUserStore,
        useVrcxStore,
        useWorldStore
    } from '../../../stores';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
    import { formatDateFilter, statusClass } from '../../../shared/utils';
    import { photonEventTableTypeFilterList } from '../../../shared/constants/photon';

    const emit = defineEmits(['show-chatbox-blacklist']);
    const { t } = useI18n();

    const photonStore = usePhotonStore();
    const {
        photonEventTableTypeFilter,
        photonEventTableFilter,
        photonEventTable,
        photonEventTablePrevious,
        photonEventIcon
    } = storeToRefs(photonStore);
    const { photonEventTableFilterChange, showUserFromPhotonId } = photonStore;

    const { lookupUser } = useUserStore();
    const { showAvatarDialog } = useAvatarStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { ipcEnabled } = storeToRefs(useVrcxStore());

    function emitShowChatboxBlacklist() {
        emit('show-chatbox-blacklist');
    }
</script>
