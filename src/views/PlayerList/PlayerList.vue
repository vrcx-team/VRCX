<template>
    <div v-show="menuActiveIndex === 'playerList'" class="x-container" style="padding-top: 5px">
        <div style="display: flex; flex-direction: column; height: 100%">
            <div v-if="currentInstanceWorld.ref.id" style="display: flex">
                <el-popover placement="right" width="500px" trigger="click" style="height: 120px">
                    <img
                        slot="reference"
                        v-lazy="currentInstanceWorld.ref.thumbnailImageUrl"
                        class="x-link"
                        style="flex: none; width: 160px; height: 120px; border-radius: 4px" />
                    <img
                        v-lazy="currentInstanceWorld.ref.imageUrl"
                        class="x-link"
                        style="width: 500px; height: 375px"
                        @click="showFullscreenImageDialog(currentInstanceWorld.ref.imageUrl)" />
                </el-popover>
                <div style="margin-left: 10px; display: flex; flex-direction: column; min-width: 320px; width: 100%">
                    <div>
                        <span
                            class="x-link"
                            style="
                                font-weight: bold;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                display: -webkit-box;
                                -webkit-box-orient: vertical;
                                -webkit-line-clamp: 1;
                            "
                            @click="showWorldDialog(currentInstanceWorld.ref.id)">
                            <i
                                v-show="
                                    currentUser.$homeLocation &&
                                    currentUser.$homeLocation.worldId === currentInstanceWorld.ref.id
                                "
                                class="el-icon-s-home"
                                style="margin-right: 5px"></i>
                            {{ currentInstanceWorld.ref.name }}
                        </span>
                    </div>
                    <div>
                        <span
                            class="x-link x-grey"
                            style="font-family: monospace"
                            @click="showUserDialog(currentInstanceWorld.ref.authorId)"
                            v-text="currentInstanceWorld.ref.authorName"></span>
                    </div>
                    <div style="margin-top: 5px">
                        <el-tag
                            v-if="currentInstanceWorld.ref.$isLabs"
                            type="primary"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.labs') }}</el-tag
                        >
                        <el-tag
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'public'"
                            type="success"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.public') }}</el-tag
                        >
                        <el-tag
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'private'"
                            type="danger"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.private') }}</el-tag
                        >
                        <el-tag
                            v-if="currentInstanceWorld.isPC"
                            class="x-tag-platform-pc"
                            type="info"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >PC
                            <span
                                v-if="currentInstanceWorld.bundleSizes['standalonewindows']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                >{{ currentInstanceWorld.bundleSizes['standalonewindows'].fileSize }}</span
                            >
                        </el-tag>
                        <el-tag
                            v-if="currentInstanceWorld.isQuest"
                            class="x-tag-platform-quest"
                            type="info"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >Android
                            <span
                                v-if="currentInstanceWorld.bundleSizes['android']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                >{{ currentInstanceWorld.bundleSizes['android'].fileSize }}</span
                            >
                        </el-tag>
                        <el-tag
                            v-if="currentInstanceWorld.isIOS"
                            class="x-tag-platform-ios"
                            type="info"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px"
                            >iOS
                            <span
                                v-if="currentInstanceWorld.bundleSizes['ios']"
                                class="x-grey"
                                style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                >{{ currentInstanceWorld.bundleSizes['ios'].fileSize }}</span
                            >
                        </el-tag>
                        <el-tag
                            v-if="currentInstanceWorld.avatarScalingDisabled"
                            type="warning"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px; margin-top: 5px"
                            >{{ t('dialog.world.tags.avatar_scaling_disabled') }}</el-tag
                        >
                        <el-tag
                            v-if="currentInstanceWorld.inCache"
                            type="info"
                            effect="plain"
                            size="mini"
                            style="margin-right: 5px">
                            <span>{{ currentInstanceWorld.cacheSize }} {{ t('dialog.world.tags.cache') }}</span>
                        </el-tag>
                    </div>
                    <div style="margin-top: 5px">
                        <LocationWorld :locationobject="currentInstanceLocation" :currentuserid="currentUser.id" />
                        <span v-if="lastLocation.playerList.size > 0" style="margin-left: 5px">
                            {{ lastLocation.playerList.size }}
                            <template v-if="lastLocation.friendList.size > 0"
                                >({{ lastLocation.friendList.size }})</template
                            >
                            &nbsp;&horbar; <Timer v-if="lastLocation.date" :epoch="lastLocation.date" />
                        </span>
                    </div>
                    <div style="margin-top: 5px">
                        <span
                            v-show="currentInstanceWorld.ref.name !== currentInstanceWorld.ref.description"
                            :style="{
                                fontSize: '12px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: currentInstanceWorldDescriptionExpanded ? 'none' : '2'
                            }"
                            v-text="currentInstanceWorld.ref.description"></span>
                        <div style="display: flex; justify-content: end">
                            <el-button
                                v-if="
                                    currentInstanceWorld.ref.description.length > 50 &&
                                    !currentInstanceWorldDescriptionExpanded
                                "
                                type="text"
                                size="mini"
                                @click="currentInstanceWorldDescriptionExpanded = true"
                                >{{ !currentInstanceWorldDescriptionExpanded && 'Show more' }}</el-button
                            >
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; margin-left: 20px">
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.capacity') }}</span>
                            <span class="extra"
                                >{{ commaNumber(currentInstanceWorld.ref.recommendedCapacity) }} ({{
                                    commaNumber(currentInstanceWorld.ref.capacity)
                                }})</span
                            >
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.last_updated') }}</span>
                            <span class="extra">{{ formatDateFilter(currentInstanceWorld.lastUpdated, 'long') }}</span>
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.created_at') }}</span>
                            <span class="extra">{{
                                formatDateFilter(currentInstanceWorld.ref.created_at, 'long')
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="photonLoggingEnabled" class="photon-event-table">
                <div style="position: absolute; width: 600px; margin-left: 215px; z-index: 1">
                    <el-select
                        v-model="photonEventTableTypeFilter"
                        multiple
                        clearable
                        collapse-tags
                        style="flex: 1; width: 220px"
                        :placeholder="t('view.player_list.photon.filter_placeholder')"
                        @change="photonEventTableFilterChange">
                        <el-option
                            v-for="type in photonEventTableTypeFilterList"
                            :key="type"
                            :label="type"
                            :value="type"></el-option>
                    </el-select>
                    <el-input
                        v-model="photonEventTableFilter"
                        :placeholder="t('view.player_list.photon.search_placeholder')"
                        clearable
                        style="width: 150px; margin-left: 10px"
                        @input="photonEventTableFilterChange"></el-input>
                    <el-button style="margin-left: 10px" @click="showChatboxBlacklistDialog">{{
                        t('view.player_list.photon.chatbox_blacklist')
                    }}</el-button>
                    <el-tooltip
                        placement="bottom"
                        :content="t('view.player_list.photon.status_tooltip')"
                        :disabled="hideTooltips">
                        <div
                            style="
                                display: inline-block;
                                margin-left: 15px;
                                font-size: 14px;
                                vertical-align: text-top;
                                margin-top: 1px;
                            ">
                            <span v-if="ipcEnabled && !photonEventIcon">🟢</span>
                            <span v-else-if="ipcEnabled">⚪</span>
                            <span v-else>🔴</span>
                        </div>
                    </el-tooltip>
                </div>
                <el-tabs type="card">
                    <el-tab-pane :label="t('view.player_list.photon.current')">
                        <data-tables v-bind="photonEventTable" style="margin-bottom: 10px">
                            <el-table-column :label="t('table.playerList.date')" prop="created_at" width="120">
                                <template #default="scope">
                                    <el-tooltip placement="right">
                                        <template #content>
                                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                                        </template>
                                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                                    </el-tooltip>
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
                            <el-table-column
                                :label="t('table.playerList.type')"
                                prop="type"
                                width="140"></el-table-column>
                            <el-table-column :label="t('table.playerList.detail')" prop="text">
                                <template #default="scope">
                                    <template v-if="scope.row.type === 'ChangeAvatar'">
                                        <span
                                            class="x-link"
                                            @click="showAvatarDialog(scope.row.avatar.id)"
                                            v-text="scope.row.avatar.name"></span>
                                        &nbsp;
                                        <span v-if="!scope.row.inCache" style="color: #aaa"
                                            ><i class="el-icon-download"></i>&nbsp;</span
                                        >
                                        <span
                                            v-if="scope.row.avatar.releaseStatus === 'public'"
                                            class="avatar-info-public"
                                            >{{ t('dialog.avatar.labels.public') }}</span
                                        >
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
                                            - {{ scope.row.avatar.description }}
                                        </template>
                                    </template>
                                    <template v-else-if="scope.row.type === 'ChangeStatus'">
                                        <template v-if="scope.row.status !== scope.row.previousStatus">
                                            <el-tooltip placement="top">
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
                                                <i
                                                    class="x-user-status"
                                                    :class="statusClass(scope.row.previousStatus)"></i>
                                            </el-tooltip>
                                            <span>
                                                <i class="el-icon-right"></i>
                                            </span>
                                            <el-tooltip placement="top">
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
                                            </el-tooltip>
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
                                            <i class="el-icon-right"></i>
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
                                    <span
                                        v-else-if="scope.row.type === 'ChatBoxMessage'"
                                        v-text="scope.row.text"></span>
                                    <span v-else-if="scope.row.type === 'OnPlayerJoined'">
                                        <span v-if="scope.row.platform === 'Desktop'" style="color: #409eff"
                                            >Desktop&nbsp;</span
                                        >
                                        <span v-else-if="scope.row.platform === 'VR'" style="color: #409eff"
                                            >VR&nbsp;</span
                                        >
                                        <span v-else-if="scope.row.platform === 'Quest'" style="color: #67c23a"
                                            >Android&nbsp;</span
                                        >
                                        <span
                                            class="x-link"
                                            @click="showAvatarDialog(scope.row.avatar.id)"
                                            v-text="scope.row.avatar.name"></span>
                                        &nbsp;
                                        <span v-if="!scope.row.inCache" style="color: #aaa"
                                            ><i class="el-icon-download"></i>&nbsp;</span
                                        >
                                        <span
                                            v-if="scope.row.avatar.releaseStatus === 'public'"
                                            class="avatar-info-public"
                                            >{{ t('dialog.avatar.labels.public') }}</span
                                        >
                                        <span
                                            v-else-if="scope.row.avatar.releaseStatus === 'private'"
                                            class="avatar-info-own"
                                            >{{ t('dialog.avatar.labels.private') }}</span
                                        >
                                    </span>
                                    <span v-else-if="scope.row.type === 'SpawnEmoji'">
                                        <span v-if="scope.row.imageUrl">
                                            <el-tooltip placement="right">
                                                <template #content>
                                                    <img
                                                        v-lazy="scope.row.imageUrl"
                                                        class="friends-list-avatar"
                                                        style="height: 500px; cursor: pointer"
                                                        @click="showFullscreenImageDialog(scope.row.imageUrl)" />
                                                </template>
                                                <span v-text="scope.row.fileId"></span>
                                            </el-tooltip>
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
                        </data-tables>
                    </el-tab-pane>
                    <el-tab-pane :label="t('view.player_list.photon.previous')">
                        <data-tables v-bind="photonEventTablePrevious" style="margin-bottom: 10px">
                            <el-table-column :label="t('table.playerList.date')" prop="created_at" width="120">
                                <template #default="scope">
                                    <el-tooltip placement="right">
                                        <template #content>
                                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                                        </template>
                                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                                    </el-tooltip>
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
                            <el-table-column
                                :label="t('table.playerList.type')"
                                prop="type"
                                width="140"></el-table-column>
                            <el-table-column :label="t('table.playerList.detail')" prop="text">
                                <template #default="scope">
                                    <template v-if="scope.row.type === 'ChangeAvatar'">
                                        <span
                                            class="x-link"
                                            @click="showAvatarDialog(scope.row.avatar.id)"
                                            v-text="scope.row.avatar.name"></span>
                                        &nbsp;
                                        <span v-if="!scope.row.inCache" style="color: #aaa"
                                            ><i class="el-icon-download"></i>&nbsp;</span
                                        >
                                        <span
                                            v-if="scope.row.avatar.releaseStatus === 'public'"
                                            class="avatar-info-public"
                                            >{{ t('dialog.avatar.labels.public') }}</span
                                        >
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
                                            <el-tooltip placement="top">
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
                                                <i
                                                    class="x-user-status"
                                                    :class="statusClass(scope.row.previousStatus)"></i>
                                            </el-tooltip>
                                            <span>
                                                <i class="el-icon-right"></i>
                                            </span>
                                            <el-tooltip placement="top">
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
                                            </el-tooltip>
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
                                            <i class="el-icon-right"></i>
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
                                    <span
                                        v-else-if="scope.row.type === 'ChatBoxMessage'"
                                        v-text="scope.row.text"></span>
                                    <span v-else-if="scope.row.type === 'OnPlayerJoined'">
                                        <span v-if="scope.row.platform === 'Desktop'" style="color: #409eff"
                                            >Desktop&nbsp;</span
                                        >
                                        <span v-else-if="scope.row.platform === 'VR'" style="color: #409eff"
                                            >VR&nbsp;</span
                                        >
                                        <span v-else-if="scope.row.platform === 'Quest'" style="color: #67c23a"
                                            >Android&nbsp;</span
                                        >
                                        <span
                                            class="x-link"
                                            @click="showAvatarDialog(scope.row.avatar.id)"
                                            v-text="scope.row.avatar.name"></span>
                                        &nbsp;
                                        <span v-if="!scope.row.inCache" style="color: #aaa"
                                            ><i class="el-icon-download"></i>&nbsp;</span
                                        >
                                        <span
                                            v-if="scope.row.avatar.releaseStatus === 'public'"
                                            class="avatar-info-public"
                                            >{{ t('dialog.avatar.labels.public') }}</span
                                        >
                                        <span
                                            v-else-if="scope.row.avatar.releaseStatus === 'private'"
                                            class="avatar-info-own"
                                            >{{ t('dialog.avatar.labels.private') }}</span
                                        >
                                    </span>
                                    <span v-else-if="scope.row.type === 'SpawnEmoji'">
                                        <span v-if="scope.row.imageUrl">
                                            <el-tooltip placement="right">
                                                <template #content>
                                                    <img
                                                        v-lazy="scope.row.imageUrl"
                                                        class="friends-list-avatar"
                                                        style="height: 500px; cursor: pointer"
                                                        @click="showFullscreenImageDialog(scope.row.imageUrl)" />
                                                </template>
                                                <span v-text="scope.row.fileId"></span>
                                            </el-tooltip>
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
                        </data-tables>
                    </el-tab-pane>
                </el-tabs>
            </div>
            <div class="current-instance-table">
                <data-tables
                    v-bind="currentInstanceWorld.ref.id ? currentInstanceUserList : {}"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="selectCurrentInstanceRow">
                    <el-table-column :label="t('table.playerList.avatar')" width="70" prop="photo">
                        <template #default="scope">
                            <template v-if="userImage(scope.row.ref)">
                                <el-popover placement="right" height="500px" trigger="hover">
                                    <img
                                        slot="reference"
                                        v-lazy="userImage(scope.row.ref)"
                                        class="friends-list-avatar" />
                                    <img
                                        v-lazy="userImageFull(scope.row.ref)"
                                        class="friends-list-avatar"
                                        style="height: 500px; cursor: pointer"
                                        @click="showFullscreenImageDialog(userImageFull(scope.row.ref))" />
                                </el-popover>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.timer')" width="90" prop="timer" sortable>
                        <template #default="scope">
                            <Timer :epoch="scope.row.timer" />
                        </template>
                    </el-table-column>
                    <el-table-column
                        v-if="photonLoggingEnabled"
                        :label="t('table.playerList.photonId')"
                        width="110"
                        prop="photonId"
                        sortable>
                        <template #default="scope">
                            <template v-if="chatboxUserBlacklist.has(scope.row.ref.id)">
                                <el-tooltip placement="left" content="Unblock chatbox messages">
                                    <el-button
                                        type="text"
                                        icon="el-icon-turn-off-microphone"
                                        size="mini"
                                        style="color: red; margin-right: 5px"
                                        @click.stop="deleteChatboxUserBlacklist(scope.row.ref.id)"></el-button>
                                </el-tooltip>
                            </template>
                            <template v-else>
                                <el-tooltip placement="left" content="Block chatbox messages">
                                    <el-button
                                        type="text"
                                        icon="el-icon-microphone"
                                        size="mini"
                                        style="margin-right: 5px"
                                        @click.stop="addChatboxUserBlacklist(scope.row.ref)"></el-button>
                                </el-tooltip>
                            </template>
                            <span v-text="scope.row.photonId"></span>
                        </template>
                    </el-table-column>
                    <el-table-column
                        :label="t('table.playerList.icon')"
                        prop="isMaster"
                        width="80"
                        align="center"
                        sortable
                        :sort-method="sortInstanceIcon">
                        <template #default="scope">
                            <el-tooltip v-if="scope.row.isMaster" placement="left" content="Instance Master">
                                <span>👑</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isModerator" placement="left" content="Moderator">
                                <span>⚔️</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isFriend" placement="left" content="Friend">
                                <span>💚</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isBlocked" placement="left" content="Blocked">
                                <i class="el-icon el-icon-circle-close" style="color: red"></i>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isMuted" placement="left" content="Muted">
                                <i class="el-icon el-icon-turn-off-microphone" style="color: orange"></i>
                            </el-tooltip>
                            <el-tooltip
                                v-if="scope.row.isAvatarInteractionDisabled"
                                placement="left"
                                content="Avatar Interaction Disabled
                                    ">
                                <i class="el-icon el-icon-thumb" style="color: orange"></i>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isChatBoxMuted" placement="left" content="Chatbox Muted">
                                <i class="el-icon el-icon-chat-line-round" style="color: orange"></i>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.timeoutTime" placement="left" content="Timeout">
                                <span style="color: red">🔴{{ scope.row.timeoutTime }}s</span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.platform')" prop="inVRMode" width="80">
                        <template #default="scope">
                            <template v-if="scope.row.ref.$platform">
                                <span v-if="scope.row.ref.$platform === 'standalonewindows'" style="color: #409eff"
                                    >PC</span
                                >
                                <span v-else-if="scope.row.ref.$platform === 'android'" style="color: #67c23a">A</span>
                                <span v-else-if="scope.row.ref.$platform === 'ios'" style="color: #c7c7ce">iOS</span>
                                <span v-else>{{ scope.row.ref.$platform }}</span>
                            </template>
                            <template v-if="scope.row.inVRMode !== null">
                                <span v-if="scope.row.inVRMode">VR</span>
                                <span
                                    v-else-if="
                                        scope.row.ref.last_platform === 'android' ||
                                        scope.row.ref.last_platform === 'ios'
                                    "
                                    >M</span
                                >
                                <span v-else>D</span>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column
                        :label="t('table.playerList.displayName')"
                        min-width="140"
                        prop="displayName"
                        sortable="custom">
                        <template #default="scope">
                            <span
                                v-if="randomUserColours"
                                :style="{ color: scope.row.ref.$userColour }"
                                v-text="scope.row.ref.displayName"></span>
                            <span v-else v-text="scope.row.ref.displayName"></span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.status')" min-width="180" prop="ref.status">
                        <template #default="scope">
                            <template v-if="scope.row.ref.status">
                                <i
                                    class="x-user-status"
                                    :class="statusClass(scope.row.ref.status)"
                                    style="margin-right: 3px"></i>
                                <span v-text="scope.row.ref.statusDescription"></span>
                                <!--//- el-table-column(label="Group" min-width="180" prop="groupOnNameplate" sortable)-->
                                <!--//-     template(v-once #default="scope")-->
                                <!--//-         span(v-text="scope.row.groupOnNameplate")-->
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column
                        :label="t('table.playerList.rank')"
                        width="110"
                        prop="$trustSortNum"
                        sortable="custom">
                        <template #default="scope">
                            <span
                                class="name"
                                :class="scope.row.ref.$trustClass"
                                v-text="scope.row.ref.$trustLevel"></span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.language')" width="100" prop="ref.$languages">
                        <template #default="scope">
                            <el-tooltip v-for="item in scope.row.ref.$languages" :key="item.key" placement="top">
                                <template #content>
                                    <span>{{ item.value }} ({{ item.key }})</span>
                                </template>
                                <span
                                    class="flags"
                                    :class="languageClass(item.key)"
                                    style="display: inline-block; margin-right: 5px"></span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.bioLink')" width="100" prop="ref.bioLinks">
                        <template #default="scope">
                            <div style="display: flex; align-items: center">
                                <el-tooltip v-for="(link, index) in scope.row.ref.bioLinks" v-if="link" :key="index">
                                    <template #content>
                                        <span v-text="link"></span>
                                    </template>
                                    <img
                                        :src="getFaviconUrl(link)"
                                        style="
                                            width: 16px;
                                            height: 16px;
                                            vertical-align: middle;
                                            margin-right: 5px;
                                            cursor: pointer;
                                        "
                                        @click.stop="openExternalLink(link)" />
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.note')" width="150" prop="ref.note">
                        <template #default="scope">
                            <span v-text="scope.row.ref.note"></span>
                        </template>
                    </el-table-column>
                </data-tables>
            </div>
        </div>
        <ChatboxBlacklistDialog
            :chatbox-blacklist-dialog="chatboxBlacklistDialog"
            @delete-chatbox-user-blacklist="deleteChatboxUserBlacklist" />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import {
        languageClass,
        getFaviconUrl,
        openExternalLink,
        statusClass,
        userImage,
        userImageFull,
        commaNumber,
        formatDateFilter
    } from '../../shared/utils';
    import {
        useLocationStore,
        useAppearanceSettingsStore,
        usePhotonStore,
        useUserStore,
        useAvatarStore,
        useWorldStore,
        useGroupStore,
        useInstanceStore,
        useUiStore,
        useGalleryStore,
        useVrcxStore
    } from '../../stores';
    import ChatboxBlacklistDialog from './dialogs/ChatboxBlacklistDialog.vue';
    import { photonEventTableTypeFilterList } from '../../shared/constants';

    const { hideTooltips, randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const {
        photonLoggingEnabled,
        photonEventIcon,
        photonEventTableTypeFilter,
        photonEventTable,
        photonEventTablePrevious,
        chatboxUserBlacklist,
        photonEventTableFilter
    } = storeToRefs(usePhotonStore());
    const { saveChatboxUserBlacklist, photonEventTableFilterChange, showUserFromPhotonId } = usePhotonStore();
    const { showUserDialog, lookupUser } = useUserStore();
    const { showAvatarDialog } = useAvatarStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { currentInstanceLocation, currentInstanceWorld } = storeToRefs(useInstanceStore());
    const { currentInstanceUserList, getCurrentInstanceUserList } = useInstanceStore();
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { ipcEnabled } = storeToRefs(useVrcxStore());
    const { currentUser } = storeToRefs(useUserStore());

    const { t } = useI18n();

    const chatboxBlacklistDialog = ref({
        visible: false,
        loading: false
    });

    const currentInstanceWorldDescriptionExpanded = ref(false);

    function showChatboxBlacklistDialog() {
        const D = chatboxBlacklistDialog.value;
        D.visible = true;
    }

    function selectCurrentInstanceRow(val) {
        if (val === null) {
            return;
        }
        const ref = val.ref;
        if (ref.id) {
            showUserDialog(ref.id);
        } else {
            lookupUser(ref);
        }
    }

    async function deleteChatboxUserBlacklist(userId) {
        chatboxUserBlacklist.value.delete(userId);
        await saveChatboxUserBlacklist();
        getCurrentInstanceUserList();
    }

    async function addChatboxUserBlacklist(user) {
        chatboxUserBlacklist.value.set(user.id, user.displayName);
        await saveChatboxUserBlacklist();
        getCurrentInstanceUserList();
    }

    function sortInstanceIcon(a, b) {
        const getValue = (item) => {
            let value = 0;
            if (item.isMaster) value += 1000;
            if (item.isModerator) value += 500;
            if (item.isFriend) value += 200;
            if (item.isBlocked) value -= 100;
            if (item.isMuted) value -= 50;
            if (item.isAvatarInteractionDisabled) value -= 20;
            if (item.isChatBoxMuted) value -= 10;
            return value;
        };
        return getValue(b) - getValue(a);
    }
</script>
