<template>
    <safe-dialog
        ref="worldDialogRef"
        class="x-dialog x-world-dialog"
        :visible.sync="isDialogVisible"
        :show-close="false"
        width="770px">
        <div v-loading="worldDialog.loading">
            <div style="display: flex">
                <el-popover placement="right" width="500px" trigger="click">
                    <img
                        slot="reference"
                        :src="worldDialog.ref.thumbnailImageUrl"
                        class="x-link"
                        style="flex: none; width: 160px; height: 120px; border-radius: 12px" />
                    <img
                        v-lazy="worldDialog.ref.imageUrl"
                        class="x-link"
                        style="width: 500px; height: 375px"
                        @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)" />
                </el-popover>
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <i
                                v-show="
                                    currentUser.$homeLocation && currentUser.$homeLocation.worldId === worldDialog.id
                                "
                                class="el-icon-s-home"
                                style="margin-right: 5px" />
                            <span class="dialog-title" v-text="worldDialog.ref.name" />
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                class="x-link x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(worldDialog.ref.authorId)"
                                v-text="worldDialog.ref.authorName" />
                        </div>
                        <div>
                            <el-tag
                                v-if="worldDialog.ref.$isLabs"
                                type="primary"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.labs') }}
                            </el-tag>
                            <el-tag
                                v-else-if="worldDialog.ref.releaseStatus === 'public'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.public') }}
                            </el-tag>
                            <el-tag
                                v-else
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.private') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.isPC"
                                class="x-tag-platform-pc"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                PC<span
                                    v-if="worldDialog.bundleSizes['standalonewindows']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                    {{ worldDialog.bundleSizes['standalonewindows'].fileSize }}
                                </span>
                            </el-tag>

                            <el-tag
                                v-if="worldDialog.isQuest"
                                class="x-tag-platform-quest"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                Android<span
                                    v-if="worldDialog.bundleSizes['android']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                    {{ worldDialog.bundleSizes['android'].fileSize }}
                                </span>
                            </el-tag>

                            <el-tag
                                v-if="worldDialog.isIos"
                                class="x-tag-platform-ios"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                iOS<span
                                    v-if="worldDialog.bundleSizes['ios']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px">
                                    {{ worldDialog.bundleSizes['ios'].fileSize }}
                                </span>
                            </el-tag>

                            <el-tag
                                v-if="worldDialog.avatarScalingDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.avatar_scaling_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.focusViewDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.focus_view_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.ref.unityPackageUrl"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.future_proofing') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.inCache"
                                class="x-link"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(worldDialog.cachePath)">
                                <span v-text="worldDialog.cacheSize" />
                                | {{ t('dialog.world.tags.cache') }}
                            </el-tag>
                        </div>
                        <div>
                            <template v-for="tag in worldDialog.ref.tags">
                                <el-tag
                                    v-if="tag.startsWith('content_')"
                                    :key="tag"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <template v-if="tag === 'content_horror'">
                                        {{ t('dialog.world.tags.content_horror') }}
                                    </template>
                                    <template v-else-if="tag === 'content_gore'">
                                        {{ t('dialog.world.tags.content_gore') }}
                                    </template>
                                    <template v-else-if="tag === 'content_violence'">
                                        {{ t('dialog.world.tags.content_violence') }}
                                    </template>
                                    <template v-else-if="tag === 'content_adult'">
                                        {{ t('dialog.world.tags.content_adult') }}
                                    </template>
                                    <template v-else-if="tag === 'content_sex'">
                                        {{ t('dialog.world.tags.content_sex') }}
                                    </template>
                                    <template v-else>
                                        {{ tag.replace('content_', '') }}
                                    </template>
                                </el-tag>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                v-show="worldDialog.ref.name !== worldDialog.ref.description"
                                style="font-size: 12px"
                                >{{ worldDialog.ref.description }}</span
                            >
                        </div>
                    </div>
                    <div style="flex: none; margin-left: 10px">
                        <el-tooltip
                            v-if="worldDialog.inCache"
                            placement="top"
                            :content="t('dialog.world.actions.delete_cache_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                icon="el-icon-delete"
                                circle
                                :disabled="isGameRunning && worldDialog.cacheLocked"
                                @click="deleteVRChatCache(worldDialog.ref)" />
                        </el-tooltip>
                        <el-tooltip
                            placement="top"
                            :content="t('dialog.world.actions.favorites_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                :type="worldDialog.isFavorite ? 'warning' : 'default'"
                                :icon="worldDialog.isFavorite ? 'el-icon-star-on' : 'el-icon-star-off'"
                                circle
                                style="margin-left: 5px"
                                @click="worldDialogCommand('Add Favorite')" />
                        </el-tooltip>
                        <el-dropdown
                            trigger="click"
                            size="small"
                            style="margin-left: 5px"
                            @command="worldDialogCommand">
                            <el-button type="default" icon="el-icon-more" circle />
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">
                                    {{ t('dialog.world.actions.refresh') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">
                                    {{ t('dialog.world.actions.share') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-s-flag" command="New Instance" divided>
                                    {{ t('dialog.world.actions.new_instance') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-message" command="New Instance and Self Invite">
                                    {{ t('dialog.world.actions.new_instance_and_self_invite') }}
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="
                                        currentUser.$homeLocation &&
                                        currentUser.$homeLocation.worldId === worldDialog.id
                                    "
                                    icon="el-icon-magic-stick"
                                    command="Reset Home"
                                    divided>
                                    {{ t('dialog.world.actions.reset_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item v-else icon="el-icon-s-home" command="Make Home" divided>
                                    {{ t('dialog.world.actions.make_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-tickets" command="Previous Instances">
                                    {{ t('dialog.world.actions.show_previous_instances') }}
                                </el-dropdown-item>
                                <template v-if="currentUser.id !== worldDialog.ref.authorId">
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Previous Images">
                                        {{ t('dialog.world.actions.show_previous_images') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                </template>
                                <template v-else>
                                    <el-dropdown-item icon="el-icon-edit" command="Rename">
                                        {{ t('dialog.world.actions.rename') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Description">
                                        {{ t('dialog.world.actions.change_description') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Capacity">
                                        {{ t('dialog.world.actions.change_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Recommended Capacity">
                                        {{ t('dialog.world.actions.change_recommended_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change YouTube Preview">
                                        {{ t('dialog.world.actions.change_preview') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Tags">
                                        {{ t('dialog.world.actions.change_warnings_settings_tags') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Allowed Domains">
                                        {{ t('dialog.world.actions.change_allowed_video_player_domains') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Change Image">
                                        {{ t('dialog.world.actions.change_image') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="worldDialog.ref.unityPackageUrl"
                                        icon="el-icon-download"
                                        command="Download Unity Package">
                                        {{ t('dialog.world.actions.download_package') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="
                                            worldDialog.ref?.tags?.includes('system_approved') ||
                                            worldDialog.ref?.tags?.includes('system_labs')
                                        "
                                        icon="el-icon-view"
                                        command="Unpublish"
                                        divided>
                                        {{ t('dialog.world.actions.unpublish') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-view" command="Publish" divided>
                                        {{ t('dialog.world.actions.publish_to_labs') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-delete" command="Delete" style="color: #f56c6c">
                                        {{ t('dialog.world.actions.delete') }}
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs>
                <el-tab-pane :label="t('dialog.world.instances.header')">
                    <div class="">
                        <i class="el-icon-user" />
                        {{ t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
                        <i class="el-icon-user-solid" style="margin-left: 10px" />
                        {{
                            t('dialog.world.instances.private_count', {
                                count: worldDialog.ref.privateOccupants
                            })
                        }}
                        <i class="el-icon-check" style="margin-left: 10px" />
                        {{
                            t('dialog.world.instances.capacity_count', {
                                count: worldDialog.ref.recommendedCapacity,
                                max: worldDialog.ref.capacity
                            })
                        }}
                    </div>
                    <div v-for="room in worldDialog.rooms" :key="room.id">
                        <template
                            v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                            <div style="margin: 5px 0">
                                <LocationWorld
                                    :locationobject="room.$location"
                                    :currentuserid="currentUser.id"
                                    :worlddialogshortname="worldDialog.$location.shortName" />
                                <Launch :location="room.tag" style="margin-left: 5px" />
                                <el-tooltip
                                    placement="top"
                                    :content="t('dialog.world.instances.self_invite_tooltip')"
                                    :disabled="hideTooltips">
                                    <InviteYourself
                                        :location="room.$location.tag"
                                        :shortname="room.$location.shortName"
                                        style="margin-left: 5px" />
                                </el-tooltip>
                                <el-tooltip
                                    placement="top"
                                    :content="t('dialog.world.instances.refresh_instance_info')"
                                    :disabled="hideTooltips">
                                    <el-button
                                        size="mini"
                                        icon="el-icon-refresh"
                                        style="margin-left: 5px"
                                        circle
                                        @click="refreshInstancePlayerCount(room.tag)" />
                                </el-tooltip>
                                <el-tooltip
                                    v-if="instanceJoinHistory.get(room.$location.tag)"
                                    placement="top"
                                    :content="t('dialog.previous_instances.info')"
                                    :disabled="hideTooltips">
                                    <el-button
                                        size="mini"
                                        icon="el-icon-s-data"
                                        style="margin-left: 5px"
                                        plain
                                        circle
                                        @click="showPreviousInstancesInfoDialog(room.location)" />
                                </el-tooltip>
                                <LastJoin :location="room.$location.tag" :currentlocation="lastLocation.location" />
                                <InstanceInfo
                                    :location="room.tag"
                                    :instance="room.ref"
                                    :friendcount="room.friendCount" />
                                <div
                                    v-if="room.$location.userId || room.users.length"
                                    class="x-friend-list"
                                    style="margin: 10px 0; max-height: unset">
                                    <div
                                        v-if="room.$location.userId"
                                        class="x-friend-item x-friend-item-border"
                                        @click="showUserDialog(room.$location.userId)">
                                        <template v-if="room.$location.user">
                                            <div class="avatar" :class="userStatusClass(room.$location.user)">
                                                <img v-lazy="userImage(room.$location.user, true)" />
                                            </div>
                                            <div class="detail">
                                                <span
                                                    class="name"
                                                    :style="{ color: room.$location.user.$userColour }"
                                                    v-text="room.$location.user.displayName" />
                                                <span class="extra">
                                                    {{ t('dialog.world.instances.instance_creator') }}
                                                </span>
                                            </div>
                                        </template>
                                        <span v-else v-text="room.$location.userId" />
                                    </div>
                                    <div
                                        v-for="user in room.users"
                                        :key="user.id"
                                        class="x-friend-item x-friend-item-border"
                                        @click="showUserDialog(user.id)">
                                        <div class="avatar" :class="userStatusClass(user)">
                                            <img v-lazy="userImage(user, true)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: user.$userColour }"
                                                v-text="user.displayName" />
                                            <span v-if="user.location === 'traveling'" class="extra">
                                                <i class="el-icon-loading" style="margin-right: 5px" />
                                                <Timer :epoch="user.$travelingToTime" />
                                            </span>
                                            <span v-else class="extra">
                                                <Timer :epoch="user.$location_at" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.world.info.header')" lazy>
                    <div class="x-friend-list" style="max-height: none">
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.memo') }}
                                </span>
                                <el-input
                                    v-model="memo"
                                    class="extra"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="t('dialog.world.info.memo_placeholder')"
                                    size="mini"
                                    resize="none"
                                    @change="onWorldMemoChange" />
                            </div>
                        </div>
                        <div style="width: 100%; display: flex">
                            <div class="x-friend-item" style="width: 100%; cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.world.info.id') }}
                                    </span>
                                    <span class="extra" style="display: inline">
                                        {{ worldDialog.id }}
                                    </span>
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.world.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            size="mini"
                                            style="margin-left: 5px"
                                            @click.native.stop>
                                            <el-button type="default" icon="el-icon-s-order" size="mini" circle />
                                            <el-dropdown-menu slot="dropdown">
                                                <el-dropdown-item @click.native="copyWorldId()">
                                                    {{ t('dialog.world.info.copy_id') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldUrl()">
                                                    {{ t('dialog.world.info.copy_url') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldName()">
                                                    {{ t('dialog.world.info.copy_name') }}
                                                </el-dropdown-item>
                                            </el-dropdown-menu>
                                        </el-dropdown>
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.previewYoutubeId"
                            class="x-friend-item"
                            style="width: 350px"
                            @click="
                                openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)
                            ">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.youtube_preview') }}
                                </span>
                                <span class="extra">
                                    https://www.youtube.com/watch?v={{ worldDialog.ref.previewYoutubeId }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.author_tags') }}
                                </span>
                                <span
                                    v-if="
                                        worldDialog.ref.tags?.filter((tag) => tag.startsWith('author_tag')).length > 0
                                    "
                                    class="extra">
                                    {{ worldTags }}
                                </span>
                                <span v-else class="extra"> - </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.players') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.occupants) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.favorites') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.favorites)
                                    }}<span
                                        v-if="worldDialog.ref?.favorites > 0 && worldDialog.ref?.visits > 0"
                                        class="extra">
                                        ({{ favoriteRate }}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.visits') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.visits) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.capacity') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.recommendedCapacity) }} ({{
                                        commaNumber(worldDialog.ref.capacity)
                                    }})
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.created_at') }}
                                </span>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.created_at, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.last_updated') }}
                                </span>
                                <span v-if="worldDialog.lastUpdated" class="extra">
                                    {{ formatDateFilter(worldDialog.lastUpdated, 'long') }}
                                </span>
                                <span v-else class="extra">
                                    {{ formatDateFilter(worldDialog.ref.updated_at, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.labsPublicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.labs_publication_date') }}
                                </span>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.labsPublicationDate, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.publicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name" style="display: inline">
                                    {{ t('dialog.world.info.publication_date') }}
                                </span>
                                <el-tooltip v-if="isTimeInLabVisible" placement="top" style="margin-left: 5px">
                                    <template slot="content">
                                        <span>
                                            {{ t('dialog.world.info.time_in_labs') }}
                                            {{ timeInLab }}
                                        </span>
                                    </template>
                                    <i class="el-icon-arrow-down" />
                                </el-tooltip>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.publicationDate, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.version') }}
                                </span>
                                <span class="extra" v-text="worldDialog.ref.version" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.heat') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.heat) }} {{ '🔥'.repeat(worldDialog.ref.heat) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.popularity') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.popularity) }}
                                    {{ '💖'.repeat(worldDialog.ref.popularity) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.platform') }}
                                </span>
                                <span class="extra" style="white-space: normal">{{ worldDialogPlatform }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.last_visited') }}
                                    <el-tooltip
                                        v-if="!hideTooltips"
                                        placement="top"
                                        style="margin-left: 5px"
                                        :content="t('dialog.world.info.accuracy_notice')"
                                        ><i class="el-icon-warning"></i
                                    ></el-tooltip>
                                </span>
                                <span class="extra">{{ formatDateFilter(worldDialog.lastVisit, 'long') }}</span>
                            </div>
                        </div>
                        <el-tooltip
                            :disabled="hideTooltips"
                            placement="top"
                            :content="t('dialog.user.info.open_previouse_instance')">
                            <div class="x-friend-item" @click="showPreviousInstancesWorldDialog(worldDialog.ref)">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.world.info.visit_count') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.world.info.accuracy_notice')"
                                            ><i class="el-icon-warning"></i
                                        ></el-tooltip>
                                    </span>
                                    <span class="extra">
                                        {{ worldDialog.visitCount }}
                                    </span>
                                </div>
                            </div>
                        </el-tooltip>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name"
                                    >{{ t('dialog.world.info.time_spent') }}
                                    <el-tooltip
                                        v-if="!hideTooltips"
                                        placement="top"
                                        style="margin-left: 5px"
                                        :content="t('dialog.world.info.accuracy_notice')">
                                        <i class="el-icon-warning"></i>
                                    </el-tooltip>
                                </span>
                                <span class="extra">
                                    {{ worldDialog.timeSpent === 0 ? ' - ' : timeSpent }}
                                </span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.world.json.header')" style="max-height: 50vh" lazy>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        @click="refreshWorldDialogTreeData()"></el-button>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(worldDialog.id, worldDialog.ref)"></el-button>
                    <el-tree
                        v-if="Object.keys(worldDialog.fileAnalysis).length > 0"
                        :data="worldDialog.fileAnalysis"
                        style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                    <el-tree :data="treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="{ data }">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="data.key"></span>
                                <span v-if="!data.children" v-text="data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>

        <!-- Nested -->
        <WorldAllowedDomainsDialog :world-allowed-domains-dialog.sync="worldAllowedDomainsDialog" />
        <SetWorldTagsDialog
            :is-set-world-tags-dialog-visible.sync="isSetWorldTagsDialogVisible"
            :old-tags="worldDialog.ref?.tags"
            :world-id="worldDialog.id"
            :is-world-dialog-visible="worldDialog.visible" />
        <PreviousInstancesWorldDialog :previous-instances-world-dialog.sync="previousInstancesWorldDialog" />
        <NewInstanceDialog
            :new-instance-dialog-location-tag="newInstanceDialogLocationTag"
            :last-location="lastLocation" />
        <ChangeWorldImageDialog
            :change-world-image-dialog-visible.sync="changeWorldImageDialogVisible"
            :previous-images-file-id="previousImagesFileId"
            :world-dialog="worldDialog"
            @refresh="displayPreviousImages" />
        <PreviousImagesDialog />
    </safe-dialog>
</template>

<script setup>
    import { computed, ref, watch, nextTick, getCurrentInstance } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { favoriteRequest, imageRequest, miscRequest, userRequest, worldRequest } from '../../../api';
    import { database } from '../../../service/database.js';
    import {
        adjustDialogZ,
        buildTreeData,
        downloadAndSaveJson,
        extractFileId,
        openExternalLink,
        refreshInstancePlayerCount,
        replaceVrcPackageUrl,
        timeToText,
        userImage,
        userStatusClass,
        openFolderGeneric,
        deleteVRChatCache,
        commaNumber,
        formatDateFilter
    } from '../../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import NewInstanceDialog from '../NewInstanceDialog.vue';
    import PreviousImagesDialog from '../PreviousImagesDialog.vue';
    import PreviousInstancesWorldDialog from '../PreviousInstancesDialog/PreviousInstancesWorldDialog.vue';
    import ChangeWorldImageDialog from './ChangeWorldImageDialog.vue';
    import SetWorldTagsDialog from './SetWorldTagsDialog.vue';
    import WorldAllowedDomainsDialog from './WorldAllowedDomainsDialog.vue';

    const { proxy } = getCurrentInstance();

    const { hideTooltips, isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { currentUser, userDialog } = storeToRefs(useUserStore());
    const { worldDialog, cachedWorlds } = storeToRefs(useWorldStore());
    const { showWorldDialog } = useWorldStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { newInstanceSelfInvite } = useInviteStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { previousImagesDialogVisible, previousImagesTable } = storeToRefs(useGalleryStore());
    const { checkPreviousImageAvailable, showFullscreenImageDialog } = useGalleryStore();
    const { t } = useI18n();

    const treeData = ref([]);
    const worldAllowedDomainsDialog = ref({
        visible: false,
        worldId: '',
        urlList: []
    });
    const isSetWorldTagsDialogVisible = ref(false);
    const previousInstancesWorldDialog = ref({
        visible: false,
        openFlg: false,
        worldRef: {}
    });
    const newInstanceDialogLocationTag = ref('');
    const changeWorldImageDialogVisible = ref(false);
    const previousImagesFileId = ref('');

    const isDialogVisible = computed({
        get() {
            return worldDialog.value.visible;
        },
        set(value) {
            worldDialog.value.visible = value;
        }
    });

    const memo = computed({
        get() {
            return worldDialog.value.memo;
        },
        set(value) {
            worldDialog.value.memo = value;
        }
    });

    const isTimeInLabVisible = computed(() => {
        return (
            worldDialog.value.ref.publicationDate &&
            worldDialog.value.ref.publicationDate !== 'none' &&
            worldDialog.value.ref.labsPublicationDate &&
            worldDialog.value.ref.labsPublicationDate !== 'none'
        );
    });

    const timeInLab = computed(() => {
        return timeToText(
            new Date(worldDialog.value.ref.publicationDate).getTime() -
                new Date(worldDialog.value.ref.labsPublicationDate).getTime()
        );
    });

    const favoriteRate = computed(() => {
        return (
            Math.round(
                (((worldDialog.value.ref?.favorites - worldDialog.value.ref?.visits) / worldDialog.value.ref?.visits) *
                    100 +
                    100) *
                    100
            ) / 100
        );
    });

    const worldTags = computed(() => {
        return worldDialog.value.ref?.tags
            .filter((tag) => tag.startsWith('author_tag'))
            .map((tag) => tag.replace('author_tag_', ''))
            .join(', ');
    });

    const timeSpent = computed(() => {
        return timeToText(worldDialog.value.timeSpent);
    });

    const worldDialogPlatform = computed(() => {
        const { ref } = worldDialog.value;
        const platforms = [];
        if (ref.unityPackages) {
            for (const unityPackage of ref.unityPackages) {
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    ({ platform } = unityPackage);
                }
                platforms.unshift(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    });

    const worldDialogRef = ref(null);

    watch(
        () => worldDialog.value.loading,
        (newVal) => {
            if (newVal) {
                nextTick(() => {
                    if (worldDialogRef.value?.$el) {
                        adjustDialogZ(worldDialogRef.value.$el);
                    }
                });
            }
        }
    );

    function displayPreviousImages(command) {
        previousImagesFileId.value = '';
        previousImagesTable.value = [];
        const { imageUrl } = worldDialog.value.ref;

        const fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        const params = {
            fileId
        };
        if (command === 'Display') {
            previousImagesDialogVisible.value = true;
        }
        if (command === 'Change') {
            changeWorldImageDialogVisible.value = true;
        }
        imageRequest.getWorldImages(params).then((args) => {
            previousImagesFileId.value = args.json.id;
            const images = [];
            args.json.versions.forEach((item) => {
                if (!item.deleted) {
                    images.unshift(item);
                }
            });
            checkPreviousImageAvailable(images);
        });
    }

    function showNewInstanceDialog(tag) {
        // trigger watcher
        newInstanceDialogLocationTag.value = '';
        nextTick(() => (newInstanceDialogLocationTag.value = tag));
    }

    function worldDialogCommand(command) {
        const D = worldDialog.value;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Delete Favorite':
            case 'Make Home':
            case 'Reset Home':
            case 'Publish':
            case 'Unpublish':
            case 'Delete Persistent Data':
            case 'Delete':
                proxy.$confirm(`Continue? ${command}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action !== 'confirm') {
                            return;
                        }
                        switch (command) {
                            case 'Delete Favorite':
                                favoriteRequest.deleteFavorite({
                                    objectId: D.id
                                });
                                break;
                            case 'Make Home':
                                userRequest
                                    .saveCurrentUser({
                                        homeLocation: D.id
                                    })
                                    .then((args) => {
                                        proxy.$message({
                                            message: 'Home world updated',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Reset Home':
                                userRequest
                                    .saveCurrentUser({
                                        homeLocation: ''
                                    })
                                    .then((args) => {
                                        proxy.$message({
                                            message: 'Home world has been reset',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Publish':
                                worldRequest
                                    .publishWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        proxy.$message({
                                            message: 'World has been published',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Unpublish':
                                worldRequest
                                    .unpublishWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        proxy.$message({
                                            message: 'World has been unpublished',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Delete Persistent Data':
                                miscRequest
                                    .deleteWorldPersistData({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        if (args.params.worldId === worldDialog.value.id && worldDialog.value.visible) {
                                            worldDialog.value.hasPersistData = false;
                                        }
                                        proxy.$message({
                                            message: 'Persistent data has been deleted',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Delete':
                                worldRequest
                                    .deleteWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        const { json } = args;
                                        cachedWorlds.value.delete(json.id);
                                        if (worldDialog.value.ref.authorId === json.authorId) {
                                            const map = new Map();
                                            for (const ref of cachedWorlds.value.values()) {
                                                if (ref.authorId === json.authorId) {
                                                    map.set(ref.id, ref);
                                                }
                                            }
                                            const array = Array.from(map.values());
                                            userDialog.value.worlds = array;
                                        }
                                        proxy.$message({
                                            message: 'World has been deleted',
                                            type: 'success'
                                        });
                                        D.visible = false;
                                        return args;
                                    });
                                break;
                        }
                    }
                });
                break;
            case 'Previous Instances':
                showPreviousInstancesWorldDialog(D.ref);
                break;
            case 'Share':
                copyWorldUrl();
                break;
            case 'Change Allowed Domains':
                showWorldAllowedDomainsDialog();
                break;
            case 'Change Tags':
                isSetWorldTagsDialogVisible.value = true;
                break;
            case 'Download Unity Package':
                openExternalLink(replaceVrcPackageUrl(worldDialog.value.ref.unityPackageUrl));
                break;
            case 'Change Image':
                displayPreviousImages('Change');
                break;
            case 'Previous Images':
                displayPreviousImages('Display');
                break;
            case 'Refresh':
                showWorldDialog(D.id);
                break;
            case 'New Instance':
                showNewInstanceDialog(D.$location.tag);
                break;
            case 'Add Favorite':
                showFavoriteDialog('world', D.id);
                break;
            case 'New Instance and Self Invite':
                newInstanceSelfInvite(D.id);
                break;
            case 'Rename':
                promptRenameWorld(D);
                break;
            case 'Change Description':
                promptChangeWorldDescription(D);
                break;
            case 'Change Capacity':
                promptChangeWorldCapacity(D);
                break;
            case 'Change Recommended Capacity':
                promptChangeWorldRecommendedCapacity(D);
                break;
            case 'Change YouTube Preview':
                promptChangeWorldYouTubePreview(D);
                break;
            default:
                break;
        }
    }

    function promptRenameWorld(world) {
        proxy.$prompt(t('prompt.rename_world.description'), t('prompt.rename_world.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.rename_world.ok'),
            cancelButtonText: t('prompt.rename_world.cancel'),
            inputValue: world.ref.name,
            inputErrorMessage: t('prompt.rename_world.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== world.ref.name) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            name: instance.inputValue
                        })
                        .then((args) => {
                            proxy.$message({
                                message: t('prompt.rename_world.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
    }
    function promptChangeWorldDescription(world) {
        proxy.$prompt(t('prompt.change_world_description.description'), t('prompt.change_world_description.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.change_world_description.ok'),
            cancelButtonText: t('prompt.change_world_description.cancel'),
            inputValue: world.ref.description,
            inputErrorMessage: t('prompt.change_world_description.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== world.ref.description) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            description: instance.inputValue
                        })
                        .then((args) => {
                            proxy.$message({
                                message: t('prompt.change_world_description.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
    }

    function promptChangeWorldCapacity(world) {
        proxy.$prompt(t('prompt.change_world_capacity.description'), t('prompt.change_world_capacity.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.change_world_capacity.ok'),
            cancelButtonText: t('prompt.change_world_capacity.cancel'),
            inputValue: world.ref.capacity,
            inputPattern: /\d+$/,
            inputErrorMessage: t('prompt.change_world_capacity.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== world.ref.capacity) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            capacity: Number(instance.inputValue)
                        })
                        .then((args) => {
                            proxy.$message({
                                message: t('prompt.change_world_capacity.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
    }

    function promptChangeWorldRecommendedCapacity(world) {
        proxy.$prompt(
            t('prompt.change_world_recommended_capacity.description'),
            t('prompt.change_world_recommended_capacity.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.change_world_capacity.ok'),
                cancelButtonText: t('prompt.change_world_capacity.cancel'),
                inputValue: world.ref.recommendedCapacity,
                inputPattern: /\d+$/,
                inputErrorMessage: t('prompt.change_world_recommended_capacity.input_error'),
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue !== world.ref.recommendedCapacity) {
                        worldRequest
                            .saveWorld({
                                id: world.id,
                                recommendedCapacity: Number(instance.inputValue)
                            })
                            .then((args) => {
                                proxy.$message({
                                    message: t('prompt.change_world_recommended_capacity.message.success'),
                                    type: 'success'
                                });
                                return args;
                            });
                    }
                }
            }
        );
    }

    function promptChangeWorldYouTubePreview(world) {
        proxy.$prompt(t('prompt.change_world_preview.description'), t('prompt.change_world_preview.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.change_world_preview.ok'),
            cancelButtonText: t('prompt.change_world_preview.cancel'),
            inputValue: world.ref.previewYoutubeId,
            inputErrorMessage: t('prompt.change_world_preview.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== world.ref.previewYoutubeId) {
                    if (instance.inputValue.length > 11) {
                        try {
                            const url = new URL(instance.inputValue);
                            const id1 = url.pathname;
                            const id2 = url.searchParams.get('v');
                            if (id1 && id1.length === 12) {
                                instance.inputValue = id1.substring(1, 12);
                            }
                            if (id2 && id2.length === 11) {
                                instance.inputValue = id2;
                            }
                        } catch {
                            proxy.$message({
                                message: t('prompt.change_world_preview.message.error'),
                                type: 'error'
                            });
                            return;
                        }
                    }
                    if (instance.inputValue !== world.ref.previewYoutubeId) {
                        worldRequest
                            .saveWorld({
                                id: world.id,
                                previewYoutubeId: instance.inputValue
                            })
                            .then((args) => {
                                proxy.$message({
                                    message: t('prompt.change_world_preview.message.success'),
                                    type: 'success'
                                });
                                return args;
                            });
                    }
                }
            }
        });
    }
    function onWorldMemoChange() {
        const worldId = worldDialog.value.id;
        const memo = worldDialog.value.memo;
        if (memo) {
            database.setWorldMemo({
                worldId,
                editedAt: new Date().toJSON(),
                memo
            });
        } else {
            database.deleteWorldMemo(worldId);
        }
    }
    function showPreviousInstancesWorldDialog(worldRef) {
        const D = previousInstancesWorldDialog.value;
        D.worldRef = worldRef;
        D.visible = true;
        // trigger watcher
        D.openFlg = true;
        nextTick(() => (D.openFlg = false));
    }
    function refreshWorldDialogTreeData() {
        treeData.value = buildTreeData(worldDialog.value.ref);
    }
    function copyWorldId() {
        navigator.clipboard
            .writeText(worldDialog.value.id)
            .then(() => {
                proxy.$message({
                    message: 'World ID copied to clipboard',
                    type: 'success'
                });
            })
            .catch((err) => {
                console.error('copy failed:', err);
                proxy.$message({
                    message: 'Copy failed',
                    type: 'error'
                });
            });
    }
    function copyWorldUrl() {
        navigator.clipboard
            .writeText(`https://vrchat.com/home/world/${worldDialog.value.id}`)
            .then(() => {
                proxy.$message({
                    message: 'World URL copied to clipboard',
                    type: 'success'
                });
            })
            .catch((err) => {
                console.error('copy failed:', err);
                proxy.$message({
                    message: 'Copy failed',
                    type: 'error'
                });
            });
    }
    function copyWorldName() {
        navigator.clipboard
            .writeText(worldDialog.value.ref.name)
            .then(() => {
                proxy.$message({
                    message: 'World name copied to clipboard',
                    type: 'success'
                });
            })
            .catch((err) => {
                console.error('copy failed:', err);
                proxy.$message({
                    message: 'Copy failed',
                    type: 'error'
                });
            });
    }
    function showWorldAllowedDomainsDialog() {
        const D = worldAllowedDomainsDialog.value;
        D.worldId = worldDialog.value.id;
        D.urlList = worldDialog.value.ref?.urlList ?? [];
        D.visible = true;
    }
</script>
