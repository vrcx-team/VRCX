<template>
    <el-dialog
        ref="worldDialog"
        :before-close="beforeDialogClose"
        class="x-dialog x-world-dialog"
        :visible.sync="isDialogVisible"
        :show-close="false"
        width="770px"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
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
                                    API.currentUser.$homeLocation &&
                                    API.currentUser.$homeLocation.worldId === worldDialog.id
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
                                {{ $t('dialog.world.tags.labs') }}
                            </el-tag>
                            <el-tag
                                v-else-if="worldDialog.ref.releaseStatus === 'public'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.public') }}
                            </el-tag>
                            <el-tag
                                v-else
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.private') }}
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
                                {{ $t('dialog.world.tags.avatar_scaling_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.focusViewDisabled"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.focus_view_disabled') }}
                            </el-tag>
                            <el-tag
                                v-if="worldDialog.ref.unityPackageUrl"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ $t('dialog.world.tags.future_proofing') }}
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
                                | {{ $t('dialog.world.tags.cache') }}
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
                                        {{ $t('dialog.world.tags.content_horror') }}
                                    </template>
                                    <template v-else-if="tag === 'content_gore'">
                                        {{ $t('dialog.world.tags.content_gore') }}
                                    </template>
                                    <template v-else-if="tag === 'content_violence'">
                                        {{ $t('dialog.world.tags.content_violence') }}
                                    </template>
                                    <template v-else-if="tag === 'content_adult'">
                                        {{ $t('dialog.world.tags.content_adult') }}
                                    </template>
                                    <template v-else-if="tag === 'content_sex'">
                                        {{ $t('dialog.world.tags.content_sex') }}
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
                            :content="$t('dialog.world.actions.delete_cache_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                icon="el-icon-delete"
                                circle
                                :disabled="isGameRunning && worldDialog.cacheLocked"
                                @click="deleteVRChatCache(worldDialog.ref)" />
                        </el-tooltip>
                        <el-tooltip
                            placement="top"
                            :content="$t('dialog.world.actions.favorites_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
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
                                    {{ $t('dialog.world.actions.refresh') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">
                                    {{ $t('dialog.world.actions.share') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-s-flag" command="New Instance" divided>
                                    {{ $t('dialog.world.actions.new_instance') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-message" command="New Instance and Self Invite">
                                    {{ $t('dialog.world.actions.new_instance_and_self_invite') }}
                                </el-dropdown-item>
                                <el-dropdown-item
                                    v-if="
                                        API.currentUser.$homeLocation &&
                                        API.currentUser.$homeLocation.worldId === worldDialog.id
                                    "
                                    icon="el-icon-magic-stick"
                                    command="Reset Home"
                                    divided>
                                    {{ $t('dialog.world.actions.reset_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item v-else icon="el-icon-s-home" command="Make Home" divided>
                                    {{ $t('dialog.world.actions.make_home') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-tickets" command="Previous Instances">
                                    {{ $t('dialog.world.actions.show_previous_instances') }}
                                </el-dropdown-item>
                                <template v-if="API.currentUser.id !== worldDialog.ref.authorId">
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Previous Images">
                                        {{ $t('dialog.world.actions.show_previous_images') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ $t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                </template>
                                <template v-else>
                                    <el-dropdown-item icon="el-icon-edit" command="Rename">
                                        {{ $t('dialog.world.actions.rename') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Description">
                                        {{ $t('dialog.world.actions.change_description') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Capacity">
                                        {{ $t('dialog.world.actions.change_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Recommended Capacity">
                                        {{ $t('dialog.world.actions.change_recommended_capacity') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change YouTube Preview">
                                        {{ $t('dialog.world.actions.change_preview') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Tags">
                                        {{ $t('dialog.world.actions.change_tags') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Allowed Domains">
                                        {{ $t('dialog.world.actions.change_allowed_video_player_domains') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Change Image">
                                        {{ $t('dialog.world.actions.change_image') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="worldDialog.ref.unityPackageUrl"
                                        icon="el-icon-download"
                                        command="Download Unity Package">
                                        {{ $t('dialog.world.actions.download_package') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="
                                            worldDialog.ref?.tags?.includes('system_approved') ||
                                            worldDialog.ref?.tags?.includes('system_labs')
                                        "
                                        icon="el-icon-view"
                                        command="Unpublish"
                                        divided>
                                        {{ $t('dialog.world.actions.unpublish') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-view" command="Publish" divided>
                                        {{ $t('dialog.world.actions.publish_to_labs') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        :disabled="!worldDialog.hasPersistData"
                                        icon="el-icon-upload"
                                        command="Delete Persistent Data">
                                        {{ $t('dialog.world.actions.delete_persistent_data') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-delete" command="Delete" style="color: #f56c6c">
                                        {{ $t('dialog.world.actions.delete') }}
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs>
                <el-tab-pane :label="$t('dialog.world.instances.header')">
                    <div class="">
                        <i class="el-icon-user" />
                        {{ $t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
                        <i class="el-icon-user-solid" style="margin-left: 10px" />
                        {{
                            $t('dialog.world.instances.private_count', {
                                count: worldDialog.ref.privateOccupants
                            })
                        }}
                        <i class="el-icon-check" style="margin-left: 10px" />
                        {{
                            $t('dialog.world.instances.capacity_count', {
                                count: worldDialog.ref.recommendedCapacity,
                                max: worldDialog.ref.capacity
                            })
                        }}
                    </div>
                    <div v-for="room in worldDialog.rooms" :key="room.id">
                        <template
                            v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                            <div style="margin: 5px 0">
                                <location-world
                                    :locationobject="room.$location"
                                    :currentuserid="API.currentUser.id"
                                    :worlddialogshortname="worldDialog.$location.shortName"
                                    @show-launch-dialog="showLaunchDialog" />
                                <launch
                                    :location="room.tag"
                                    style="margin-left: 5px"
                                    @show-launch-dialog="showLaunchDialog" />
                                <el-tooltip
                                    placement="top"
                                    :content="$t('dialog.world.instances.self_invite_tooltip')"
                                    :disabled="hideTooltips">
                                    <invite-yourself
                                        :location="room.$location.tag"
                                        :shortname="room.$location.shortName"
                                        style="margin-left: 5px" />
                                </el-tooltip>
                                <el-tooltip
                                    placement="top"
                                    :content="$t('dialog.world.instances.refresh_instance_info')"
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
                                    :content="$t('dialog.previous_instances.info')"
                                    :disabled="hideTooltips">
                                    <el-button
                                        size="mini"
                                        icon="el-icon-s-data"
                                        style="margin-left: 5px"
                                        plain
                                        circle
                                        @click="showPreviousInstancesInfoDialog(room.location)" />
                                </el-tooltip>
                                <last-join :location="room.$location.tag" :currentlocation="lastLocation.location" />
                                <instance-info
                                    :location="room.tag"
                                    :instance="room.ref"
                                    :friendcount="room.friendCount"
                                    :updateelement="updateInstanceInfo" />
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
                                                    {{ $t('dialog.world.instances.instance_creator') }}
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
                                                <timer :epoch="user.$travelingToTime" />
                                            </span>
                                            <span v-else class="extra">
                                                <timer :epoch="user.$location_at" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="$t('dialog.world.info.header')" lazy>
                    <div class="x-friend-list" style="max-height: none">
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.memo') }}
                                </span>
                                <el-input
                                    v-model="memo"
                                    class="extra"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="$t('dialog.world.info.memo_placeholder')"
                                    size="mini"
                                    resize="none"
                                    @change="onWorldMemoChange" />
                            </div>
                        </div>
                        <div style="width: 100%; display: flex">
                            <div class="x-friend-item" style="width: 100%; cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ $t('dialog.world.info.id') }}
                                    </span>
                                    <span class="extra" style="display: inline">
                                        {{ worldDialog.id }}
                                    </span>
                                    <el-tooltip
                                        placement="top"
                                        :content="$t('dialog.world.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            size="mini"
                                            style="margin-left: 5px"
                                            @click.native.stop>
                                            <el-button type="default" icon="el-icon-s-order" size="mini" circle />
                                            <el-dropdown-menu slot="dropdown">
                                                <el-dropdown-item @click.native="copyWorldId(worldDialog.id)">
                                                    {{ $t('dialog.world.info.copy_id') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldUrl(worldDialog.id)">
                                                    {{ $t('dialog.world.info.copy_url') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item @click.native="copyWorldName(worldDialog.ref.name)">
                                                    {{ $t('dialog.world.info.copy_name') }}
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
                                    {{ $t('dialog.world.info.youtube_preview') }}
                                </span>
                                <span class="extra">
                                    https://www.youtube.com/watch?v={{ worldDialog.ref.previewYoutubeId }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.author_tags') }}
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
                                    {{ $t('dialog.world.info.players') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.occupants | commaNumber }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.favorites') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.favorites | commaNumber
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
                                    {{ $t('dialog.world.info.visits') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.visits | commaNumber }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.capacity') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.recommendedCapacity | commaNumber }} ({{
                                        worldDialog.ref.capacity | commaNumber
                                    }})
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.created_at') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.created_at | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.last_updated') }}
                                </span>
                                <span v-if="worldDialog.lastUpdated" class="extra">
                                    {{ worldDialog.lastUpdated | formatDate('long') }}
                                </span>
                                <span v-else class="extra">
                                    {{ worldDialog.ref.updated_at | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.labsPublicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.labs_publication_date') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.labsPublicationDate | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.publicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name" style="display: inline">
                                    {{ $t('dialog.world.info.publication_date') }}
                                </span>
                                <el-tooltip v-if="isTimeInLabVisible" placement="top" style="margin-left: 5px">
                                    <template slot="content">
                                        <span>
                                            {{ $t('dialog.world.info.time_in_labs') }}
                                            {{ timeInLab }}
                                        </span>
                                    </template>
                                    <i class="el-icon-arrow-down" />
                                </el-tooltip>
                                <span class="extra">
                                    {{ worldDialog.ref.publicationDate | formatDate('long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.version') }}
                                </span>
                                <span class="extra" v-text="worldDialog.ref.version" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.heat') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.heat | commaNumber }} {{ '🔥'.repeat(worldDialog.ref.heat) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.popularity') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.ref.popularity | commaNumber }}
                                    {{ '💖'.repeat(worldDialog.ref.popularity) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.platform') }}
                                </span>
                                <span class="extra" style="white-space: normal">{{ worldDialogPlatform }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ $t('dialog.world.info.last_visited') }}
                                    <el-tooltip
                                        v-if="!hideTooltips"
                                        placement="top"
                                        style="margin-left: 5px"
                                        :content="$t('dialog.world.info.accuracy_notice')"
                                        ><i class="el-icon-warning"></i
                                    ></el-tooltip>
                                </span>
                                <span class="extra">{{ worldDialog.lastVisit | formatDate('long') }}</span>
                            </div>
                        </div>
                        <el-tooltip
                            :disabled="hideTooltips"
                            placement="top"
                            :content="$t('dialog.user.info.open_previouse_instance')">
                            <div class="x-friend-item" @click="showPreviousInstancesWorldDialog(worldDialog.ref)">
                                <div class="detail">
                                    <span class="name">
                                        {{ $t('dialog.world.info.visit_count') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="$t('dialog.world.info.accuracy_notice')"
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
                                    >{{ $t('dialog.world.info.time_spent') }}
                                    <el-tooltip
                                        v-if="!hideTooltips"
                                        placement="top"
                                        style="margin-left: 5px"
                                        :content="$t('dialog.world.info.accuracy_notice')">
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
                <el-tab-pane :label="$t('dialog.world.json.header')" style="max-height: 50vh" lazy>
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
                    <el-tree :data="treeData" style="margin-top: 5px; font-size: 12px">
                        <template slot-scope="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
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
        <PreviousInstancesWorldDialog
            :previous-instances-world-dialog.sync="previousInstancesWorldDialog"
            :shift-held="shiftHeld" />
        <NewInstanceDialog
            :new-instance-dialog-location-tag="newInstanceDialogLocationTag"
            :create-new-instance="createNewInstance"
            :instance-content-settings="instanceContentSettings"
            :offline-friends="offlineFriends"
            :active-friends="activeFriends"
            :online-friends="onlineFriends"
            :vip-friends="vipFriends" />
    </el-dialog>
</template>

<script>
    import utils from '../../../classes/utils';
    import database from '../../../service/database.js';
    import WorldAllowedDomainsDialog from './WorldAllowedDomainsDialog.vue';
    import SetWorldTagsDialog from './SetWorldTagsDialog.vue';
    import PreviousInstancesWorldDialog from '../PreviousInstancesDialog/PreviousInstancesWorldDialog.vue';
    import NewInstanceDialog from '../NewInstanceDialog.vue';
    import { favoriteRequest, miscRequest, worldRequest } from '../../../api';

    export default {
        name: 'WorldDialog',
        components: { SetWorldTagsDialog, WorldAllowedDomainsDialog, PreviousInstancesWorldDialog, NewInstanceDialog },
        inject: [
            'API',
            'showUserDialog',
            'userStatusClass',
            'userImage',
            'adjustDialogZ',
            'showPreviousInstancesInfoDialog',
            'showLaunchDialog',
            'showFullscreenImageDialog',
            'beforeDialogClose',
            'dialogMouseDown',
            'dialogMouseUp',
            'displayPreviousImages',
            'showWorldDialog',
            'showFavoriteDialog',
            'openExternalLink'
        ],
        props: {
            worldDialog: Object,
            hideTooltips: Boolean,
            shiftHeld: Boolean,
            isGameRunning: Boolean,
            lastLocation: Object,
            instanceJoinHistory: Map,
            isAgeGatedInstancesVisible: Boolean,

            createNewInstance: Function,
            instanceContentSettings: Array,
            offlineFriends: Array,
            activeFriends: Array,
            onlineFriends: Array,
            vipFriends: Array,

            // TODO: Remove
            updateInstanceInfo: Number
        },
        data() {
            return {
                treeData: [],
                worldAllowedDomainsDialog: {
                    visible: false,
                    worldId: '',
                    urlList: []
                },
                isSetWorldTagsDialogVisible: false,
                previousInstancesWorldDialog: {
                    visible: false,
                    openFlg: false,
                    worldRef: {}
                },
                newInstanceDialogLocationTag: ''
            };
        },
        computed: {
            isDialogVisible: {
                get() {
                    return this.worldDialog.visible;
                },
                set(value) {
                    this.$emit('update:world-dialog', { ...this.worldDialog, visible: value });
                }
            },
            memo: {
                get() {
                    return this.worldDialog.memo;
                },
                set(value) {
                    this.$emit('update:world-dialog', { ...this.worldDialog, memo: value });
                }
            },
            isTimeInLabVisible() {
                return (
                    this.worldDialog.ref.publicationDate &&
                    this.worldDialog.ref.publicationDate !== 'none' &&
                    this.worldDialog.ref.labsPublicationDate &&
                    this.worldDialog.ref.labsPublicationDate !== 'none'
                );
            },
            timeInLab() {
                return utils.timeToText(
                    new Date(this.worldDialog.ref?.publicationDate) -
                        new Date(this.worldDialog.ref?.labsPublicationDate)
                );
            },
            favoriteRate() {
                return (
                    Math.round(
                        (((this.worldDialog.ref?.favorites - this.worldDialog.ref?.visits) /
                            this.worldDialog.ref?.visits) *
                            100 +
                            100) *
                            100
                    ) / 100
                );
            },
            worldTags() {
                return this.worldDialog.ref?.tags
                    .filter((tag) => tag.startsWith('author_tag'))
                    .map((tag) => tag.replace('author_tag_', ''))
                    .join(', ');
            },
            timeSpent() {
                return utils.timeToText(this.worldDialog.timeSpent);
            },
            worldDialogPlatform() {
                const { ref } = this.worldDialog;
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
            }
        },
        watch: {
            'worldDialog.loading'(value) {
                if (value) {
                    this.$nextTick(() => this.adjustDialogZ(this.$refs.worldDialog.$el));
                }
            }
        },
        methods: {
            showNewInstanceDialog(tag) {
                // trigger watcher
                this.newInstanceDialogLocationTag = '';
                this.$nextTick(() => (this.newInstanceDialogLocationTag = tag));
            },
            openFolderGeneric(path) {
                this.$emit('open-folder-generic', path);
            },
            deleteVRChatCache(world) {
                this.$emit('delete-vrchat-cache', world);
            },
            worldDialogCommand(command) {
                const D = this.worldDialog;
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
                        this.$confirm(`Continue? ${command}`, 'Confirm', {
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
                                        this.API.saveCurrentUser({
                                            homeLocation: D.id
                                        }).then((args) => {
                                            this.$message({
                                                message: 'Home world updated',
                                                type: 'success'
                                            });
                                            return args;
                                        });
                                        break;
                                    case 'Reset Home':
                                        this.API.saveCurrentUser({
                                            homeLocation: ''
                                        }).then((args) => {
                                            this.$message({
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
                                                this.$message({
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
                                                this.$message({
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
                                                this.$message({
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
                                                this.$message({
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
                        this.showPreviousInstancesWorldDialog(D.ref);
                        break;
                    case 'Share':
                        this.copyWorldUrl();
                        break;
                    case 'Change Allowed Domains':
                        this.showWorldAllowedDomainsDialog();
                        break;
                    case 'Change Tags':
                        this.isSetWorldTagsDialogVisible = true;
                        break;
                    case 'Download Unity Package':
                        this.openExternalLink(this.replaceVrcPackageUrl(this.worldDialog.ref.unityPackageUrl));
                        break;
                    case 'Change Image':
                        this.displayPreviousImages('World', 'Change');
                        break;
                    case 'Previous Images':
                        this.displayPreviousImages('World', 'Display');
                        break;
                    case 'Refresh':
                        this.showWorldDialog(D.id);
                        break;
                    case 'New Instance':
                        this.showNewInstanceDialog(D.$location.tag);
                        break;
                    case 'Add Favorite':
                        this.showFavoriteDialog('world', D.id);
                        break;
                    default:
                        this.$emit('world-dialog-command', command);
                        break;
                }
            },
            refreshInstancePlayerCount(tag) {
                this.$emit('refresh-instance-player-count', tag);
            },
            onWorldMemoChange() {
                const worldId = this.worldDialog.id;
                const memo = this.worldDialog.memo;
                if (memo) {
                    database.setWorldMemo({
                        worldId,
                        editedAt: new Date().toJSON(),
                        memo
                    });
                } else {
                    database.deleteWorldMemo(worldId);
                }
            },
            showPreviousInstancesWorldDialog(worldRef) {
                const D = this.previousInstancesWorldDialog;
                D.worldRef = worldRef;
                D.visible = true;
                // trigger watcher
                D.openFlg = true;
                this.$nextTick(() => (D.openFlg = false));
            },
            refreshWorldDialogTreeData() {
                this.treeData = utils.buildTreeData(this.worldDialog.ref);
            },
            downloadAndSaveJson(fileName, data) {
                utils.downloadAndSaveJson(fileName, data);
            },
            copyWorldId() {
                navigator.clipboard
                    .writeText(this.worldDialog.id)
                    .then(() => {
                        this.$message({
                            message: 'World ID copied to clipboard',
                            type: 'success'
                        });
                    })
                    .catch((err) => {
                        console.error('copy failed:', err);
                        this.$message({
                            message: 'Copy failed',
                            type: 'error'
                        });
                    });
            },
            copyWorldUrl() {
                navigator.clipboard
                    .writeText(`https://vrchat.com/home/world/${this.worldDialog.id}`)
                    .then(() => {
                        this.$message({
                            message: 'World URL copied to clipboard',
                            type: 'success'
                        });
                    })
                    .catch((err) => {
                        console.error('copy failed:', err);
                        this.$message({
                            message: 'Copy failed',
                            type: 'error'
                        });
                    });
            },
            copyWorldName() {
                navigator.clipboard
                    .writeText(this.worldDialog.ref.name)
                    .then(() => {
                        this.$message({
                            message: 'World name copied to clipboard',
                            type: 'success'
                        });
                    })
                    .catch((err) => {
                        console.error('copy failed:', err);
                        this.$message({
                            message: 'Copy failed',
                            type: 'error'
                        });
                    });
            },
            showWorldAllowedDomainsDialog() {
                const D = this.worldAllowedDomainsDialog;
                D.worldId = this.worldDialog.id;
                D.urlList = this.worldDialog.ref?.urlList ?? [];
                D.visible = true;
            }
        }
    };
</script>
