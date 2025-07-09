<template>
    <safe-dialog
        ref="groupDialogRef"
        :visible.sync="groupDialog.visible"
        :show-close="false"
        width="770px"
        top="10vh"
        class="x-dialog x-group-dialog">
        <div class="group-banner-image">
            <el-popover placement="right" width="500px" trigger="click">
                <img
                    slot="reference"
                    v-lazy="groupDialog.ref.bannerUrl"
                    style="flex: none; width: 100%; aspect-ratio: 6/1; object-fit: cover; border-radius: 4px"
                    class="x-link" />
                <img
                    v-lazy="groupDialog.ref.bannerUrl"
                    style="width: 854px; height: 480px"
                    class="x-link"
                    @click="showFullscreenImageDialog(groupDialog.ref.bannerUrl)" />
            </el-popover>
        </div>
        <div v-loading="groupDialog.loading" class="group-body">
            <div style="display: flex">
                <el-popover placement="right" width="500px" trigger="click">
                    <img
                        slot="reference"
                        v-lazy="groupDialog.ref.iconUrl"
                        style="flex: none; width: 120px; height: 120px; border-radius: 12px"
                        class="x-link" />
                    <img
                        v-lazy="groupDialog.ref.iconUrl"
                        style="width: 500px; height: 500px"
                        class="x-link"
                        @click="showFullscreenImageDialog(groupDialog.ref.iconUrl)" />
                </el-popover>
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div class="group-header" style="flex: 1">
                        <span v-if="groupDialog.ref.ownerId === API.currentUser.id" style="margin-right: 5px">👑</span>
                        <span class="dialog-title" style="margin-right: 5px" v-text="groupDialog.ref.name"></span>
                        <span
                            class="group-discriminator x-grey"
                            style="font-family: monospace; font-size: 12px; margin-right: 5px">
                            {{ groupDialog.ref.shortCode }}.{{ groupDialog.ref.discriminator }}
                        </span>
                        <el-tooltip v-for="item in groupDialog.ref.$languages" :key="item.key" placement="top">
                            <template slot="content">
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                class="flags"
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 5px"></span>
                        </el-tooltip>
                        <div style="margin-top: 5px">
                            <span
                                class="x-link x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(groupDialog.ref.ownerId)"
                                v-text="groupDialog.ownerDisplayName"></span>
                        </div>
                        <div class="group-tags">
                            <el-tag
                                v-if="groupDialog.ref.isVerified"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.verified') }}
                            </el-tag>
                            <el-tag
                                v-if="groupDialog.ref.privacy === 'private'"
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.private') }}
                            </el-tag>
                            <el-tag
                                v-if="groupDialog.ref.privacy === 'default'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.public') }}
                            </el-tag>
                            <el-tag
                                v-if="groupDialog.ref.joinState === 'open'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.open') }}
                            </el-tag>
                            <el-tag
                                v-else-if="groupDialog.ref.joinState === 'request'"
                                type="warning"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.request') }}
                            </el-tag>
                            <el-tag
                                v-else-if="groupDialog.ref.joinState === 'invite'"
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.invite') }}
                            </el-tag>
                            <el-tag
                                v-else-if="groupDialog.ref.joinState === 'closed'"
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.closed') }}
                            </el-tag>
                            <el-tag
                                v-if="groupDialog.inGroup"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.joined') }}
                            </el-tag>
                            <el-tag
                                v-if="groupDialog.ref.myMember && groupDialog.ref.myMember.bannedAt"
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.banned') }}
                            </el-tag>
                            <template v-if="groupDialog.inGroup && groupDialog.ref.myMember">
                                <el-tag
                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                    type="info"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.visible') }}
                                </el-tag>
                                <el-tag
                                    v-else-if="groupDialog.ref.myMember.visibility === 'friends'"
                                    type="info"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.friends') }}
                                </el-tag>
                                <el-tag
                                    v-else-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                    type="info"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.hidden') }}
                                </el-tag>
                                <el-tag
                                    v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                    type="info"
                                    effect="plain"
                                    size="mini"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.subscribed') }}
                                </el-tag>
                            </template>
                        </div>
                        <div class="group-description" style="margin-top: 5px">
                            <span
                                v-show="groupDialog.ref.name !== groupDialog.ref.description"
                                style="font-size: 12px"
                                v-text="groupDialog.ref.description"></span>
                        </div>
                    </div>
                    <div style="flex: none; margin-left: 10px">
                        <template v-if="groupDialog.inGroup && groupDialog.ref?.myMember">
                            <el-tooltip
                                v-if="groupDialog.ref.myMember?.isRepresenting"
                                placement="top"
                                :content="t('dialog.group.actions.unrepresent_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="warning"
                                    icon="el-icon-star-on"
                                    circle
                                    style="margin-left: 5px"
                                    @click="clearGroupRepresentation(groupDialog.id)"></el-button>
                            </el-tooltip>
                            <el-tooltip
                                v-else
                                placement="top"
                                :content="t('dialog.group.actions.represent_tooltip')"
                                :disabled="hideTooltips">
                                <span>
                                    <el-button
                                        type="default"
                                        icon="el-icon-star-off"
                                        circle
                                        style="margin-left: 5px"
                                        :disabled="groupDialog.ref.privacy === 'private'"
                                        @click="setGroupRepresentation(groupDialog.id)"></el-button>
                                </span>
                            </el-tooltip>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'requested'">
                            <el-tooltip
                                placement="top"
                                :content="t('dialog.group.actions.cancel_join_request_tooltip')"
                                :disabled="hideTooltips">
                                <span>
                                    <el-button
                                        type="default"
                                        icon="el-icon-close"
                                        circle
                                        style="margin-left: 5px"
                                        @click="cancelGroupRequest(groupDialog.id)"></el-button>
                                </span>
                            </el-tooltip>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'invited'">
                            <el-tooltip
                                placement="top"
                                :content="t('dialog.group.actions.pending_request_tooltip')"
                                :disabled="hideTooltips">
                                <span>
                                    <el-button
                                        type="default"
                                        icon="el-icon-check"
                                        circle
                                        style="margin-left: 5px"
                                        @click="joinGroup(groupDialog.id)"></el-button>
                                </span>
                            </el-tooltip>
                        </template>
                        <template v-else>
                            <el-tooltip
                                v-if="groupDialog.ref.joinState === 'request'"
                                placement="top"
                                :content="t('dialog.group.actions.request_join_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="default"
                                    icon="el-icon-message"
                                    circle
                                    style="margin-left: 5px"
                                    @click="joinGroup(groupDialog.id)"></el-button>
                            </el-tooltip>
                            <el-tooltip
                                v-if="groupDialog.ref.joinState === 'invite'"
                                placement="top"
                                :content="t('dialog.group.actions.invite_required_tooltip')"
                                :disabled="hideTooltips">
                                <span>
                                    <el-button
                                        type="default"
                                        icon="el-icon-message"
                                        disabled
                                        circle
                                        style="margin-left: 5px"></el-button>
                                </span>
                            </el-tooltip>
                            <el-tooltip
                                v-if="groupDialog.ref.joinState === 'open'"
                                placement="top"
                                :content="t('dialog.group.actions.join_group_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="default"
                                    icon="el-icon-check"
                                    circle
                                    style="margin-left: 5px"
                                    @click="joinGroup(groupDialog.id)"></el-button>
                            </el-tooltip>
                        </template>
                        <el-dropdown
                            trigger="click"
                            size="small"
                            style="margin-left: 5px"
                            @command="groupDialogCommand">
                            <el-button
                                :type="groupDialog.ref.membershipStatus === 'userblocked' ? 'danger' : 'default'"
                                icon="el-icon-more"
                                circle></el-button>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">
                                    {{ t('dialog.group.actions.refresh') }}
                                </el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">
                                    {{ t('dialog.group.actions.share') }}
                                </el-dropdown-item>
                                <template v-if="groupDialog.inGroup">
                                    <template v-if="groupDialog.ref.myMember">
                                        <el-dropdown-item
                                            v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                            icon="el-icon-close"
                                            command="Unsubscribe To Announcements"
                                            divided>
                                            {{ t('dialog.group.actions.unsubscribe') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-else
                                            icon="el-icon-check"
                                            command="Subscribe To Announcements"
                                            divided>
                                            {{ t('dialog.group.actions.subscribe') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-invites-manage')"
                                            icon="el-icon-message"
                                            command="Invite To Group">
                                            {{ t('dialog.group.actions.invite_to_group') }}
                                        </el-dropdown-item>
                                        <template
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                            <el-dropdown-item icon="el-icon-tickets" command="Create Post">
                                                {{ t('dialog.group.actions.create_post') }}
                                            </el-dropdown-item>
                                        </template>
                                        <el-dropdown-item icon="el-icon-s-operation" command="Moderation Tools">
                                            {{ t('dialog.group.actions.moderation_tools') }}
                                        </el-dropdown-item>
                                        <template
                                            v-if="groupDialog.ref.myMember && groupDialog.ref.privacy === 'default'">
                                            <el-dropdown-item icon="el-icon-view" command="Visibility Everyone" divided>
                                                <i
                                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_everyone') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item icon="el-icon-view" command="Visibility Friends">
                                                <i
                                                    v-if="groupDialog.ref.myMember.visibility === 'friends'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_friends') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item icon="el-icon-view" command="Visibility Hidden">
                                                <i
                                                    v-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_hidden') }}
                                            </el-dropdown-item>
                                        </template>
                                        <el-dropdown-item
                                            icon="el-icon-delete"
                                            command="Leave Group"
                                            style="color: #f56c6c"
                                            divided>
                                            {{ t('dialog.group.actions.leave') }}
                                        </el-dropdown-item>
                                    </template>
                                </template>
                                <template v-else>
                                    <el-dropdown-item
                                        v-if="groupDialog.ref.membershipStatus === 'userblocked'"
                                        icon="el-icon-circle-check"
                                        command="Unblock Group"
                                        style="color: #f56c6c"
                                        divided>
                                        {{ t('dialog.group.actions.unblock') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-circle-close" command="Block Group" divided>
                                        {{ t('dialog.group.actions.block') }}
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs v-model="groupDialogTabCurrentName" @tab-click="groupDialogTabClick">
                <el-tab-pane :label="t('dialog.group.info.header')">
                    <div class="group-banner-image-info">
                        <el-popover placement="right" width="500px" trigger="click">
                            <img
                                slot="reference"
                                v-lazy="groupDialog.ref.bannerUrl"
                                class="x-link"
                                style="
                                    flex: none;
                                    width: 100%;
                                    aspect-ratio: 6/1;
                                    object-fit: cover;
                                    border-radius: 4px;
                                " />
                            <img
                                v-lazy="groupDialog.ref.bannerUrl"
                                class="x-link"
                                style="width: 854px; height: 480px"
                                @click="showFullscreenImageDialog(groupDialog.ref.bannerUrl)" />
                        </el-popover>
                    </div>
                    <div class="x-friend-list" style="max-height: none">
                        <span
                            v-if="groupDialog.instances.length"
                            style="font-size: 12px; font-weight: bold; margin: 5px">
                            {{ t('dialog.group.info.instances') }}
                        </span>
                        <div v-for="room in groupDialog.instances" :key="room.tag" style="width: 100%">
                            <div style="margin: 5px 0">
                                <location :location="room.tag" style="display: inline-block" />
                                <el-tooltip placement="top" content="Invite yourself" :disabled="hideTooltips">
                                    <invite-yourself :location="room.tag" style="margin-left: 5px" />
                                </el-tooltip>
                                <el-tooltip placement="top" content="Refresh player count" :disabled="hideTooltips">
                                    <el-button
                                        size="mini"
                                        icon="el-icon-refresh"
                                        style="margin-left: 5px"
                                        circle
                                        @click="refreshInstancePlayerCount(room.tag)" />
                                </el-tooltip>
                                <last-join :location="room.tag" :currentlocation="lastLocation.location" />
                                <instance-info
                                    :location="room.tag"
                                    :instance="room.ref"
                                    :friendcount="room.friendCount"
                                    :updateelement="updateInstanceInfo" />
                            </div>
                            <div
                                v-if="room.users.length"
                                class="x-friend-list"
                                style="margin: 10px 0; padding: 0; max-height: unset">
                                <div
                                    v-for="user in room.users"
                                    :key="user.id"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showUserDialog(user.id)">
                                    <div class="avatar" :class="userStatusClass(user)">
                                        <img v-lazy="userImage(user)" />
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
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.announcement') }}</span>
                                <span style="display: block" v-text="groupDialog.announcement.title" />
                                <div
                                    v-if="groupDialog.announcement.imageUrl"
                                    style="display: inline-block; margin-right: 5px">
                                    <el-popover placement="right" width="500px" trigger="click">
                                        <img
                                            slot="reference"
                                            v-lazy="groupDialog.announcement.imageUrl"
                                            class="x-link"
                                            style="
                                                flex: none;
                                                width: 60px;
                                                height: 60px;
                                                border-radius: 4px;
                                                object-fit: cover;
                                            " />
                                        <img
                                            v-lazy="groupDialog.announcement.imageUrl"
                                            class="x-link"
                                            style="height: 500px"
                                            @click="showFullscreenImageDialog(groupDialog.announcement.imageUrl)" />
                                    </el-popover>
                                </div>
                                <pre
                                    class="extra"
                                    style="
                                        display: inline-block;
                                        vertical-align: top;
                                        font-family: inherit;
                                        font-size: 12px;
                                        white-space: pre-wrap;
                                        margin: 0;
                                    "
                                    >{{ groupDialog.announcement.text || '-' }}</pre
                                >
                                <br />
                                <div
                                    v-if="groupDialog.announcement.id"
                                    class="extra"
                                    style="float: right; margin-left: 5px">
                                    <el-tooltip v-if="groupDialog.announcement.roleIds.length" placement="top">
                                        <template #content>
                                            <span>{{ t('dialog.group.posts.visibility') }}</span>
                                            <br />
                                            <template v-for="roleId in groupDialog.announcement.roleIds">
                                                <span
                                                    v-for="(role, rIndex) in groupDialog.ref.roles"
                                                    v-if="role.id === roleId"
                                                    :key="rIndex"
                                                    v-text="role.name" />
                                                <span
                                                    :key="rIndex"
                                                    v-if="
                                                        groupDialog.announcement.roleIds.indexOf(roleId) <
                                                        groupDialog.announcement.roleIds.length - 1
                                                    ">
                                                    ,&nbsp;
                                                </span>
                                            </template>
                                        </template>
                                        <i class="el-icon-view" style="margin-right: 5px" />
                                    </el-tooltip>
                                    <display-name
                                        :userid="groupDialog.announcement.authorId"
                                        style="margin-right: 5px" />
                                    <span v-if="groupDialog.announcement.editorId" style="margin-right: 5px">
                                        ({{ t('dialog.group.posts.edited_by') }}
                                        <display-name :userid="groupDialog.announcement.editorId" />)
                                    </span>
                                    <el-tooltip placement="bottom">
                                        <template #content>
                                            <span
                                                >{{ t('dialog.group.posts.created_at') }}
                                                {{ groupDialog.announcement.createdAt | formatDate('long') }}</span
                                            >
                                            <template
                                                v-if="
                                                    groupDialog.announcement.updatedAt !==
                                                    groupDialog.announcement.createdAt
                                                ">
                                                <br />
                                                <span
                                                    >{{ t('dialog.group.posts.edited_at') }}
                                                    {{ groupDialog.announcement.updatedAt | formatDate('long') }}</span
                                                >
                                            </template>
                                        </template>
                                        <timer :epoch="Date.parse(groupDialog.announcement.updatedAt)" />
                                    </el-tooltip>
                                    <template v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                        <el-tooltip
                                            placement="top"
                                            :content="t('dialog.group.posts.edit_tooltip')"
                                            :disabled="hideTooltips">
                                            <el-button
                                                type="text"
                                                icon="el-icon-edit"
                                                size="mini"
                                                style="margin-left: 5px"
                                                @click="
                                                    showGroupPostEditDialog(groupDialog.id, groupDialog.announcement)
                                                " />
                                        </el-tooltip>
                                        <el-tooltip
                                            placement="top"
                                            :content="t('dialog.group.posts.delete_tooltip')"
                                            :disabled="hideTooltips">
                                            <el-button
                                                type="text"
                                                icon="el-icon-delete"
                                                size="mini"
                                                style="margin-left: 5px"
                                                @click="confirmDeleteGroupPost(groupDialog.announcement)" />
                                        </el-tooltip>
                                    </template>
                                </div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.rules') }}</span>
                                <pre
                                    class="extra"
                                    style="
                                        font-family: inherit;
                                        font-size: 12px;
                                        white-space: pre-wrap;
                                        margin: 0 0.5em 0 0;
                                    "
                                    >{{ groupDialog.ref.rules || '-' }}</pre
                                >
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.members') }}</span>
                                <div class="extra">
                                    {{ groupDialog.ref.memberCount }} ({{ groupDialog.ref.onlineMemberCount }})
                                </div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.created_at') }}</span>
                                <span class="extra">{{ groupDialog.ref.createdAt | formatDate('long') }}</span>
                            </div>
                        </div>
                        <el-tooltip :disabled="hideTooltips" placement="top" :content="t('dialog.user.info.open_previouse_instance')">
                            <div class="x-friend-item x-link" @click="showPreviousInstancesGroupDialog(groupDialog.ref)">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.group.info.last_visited') }}</span>
                                    <span class="extra">{{ groupDialog.lastVisit | formatDate('long') }} <span v-if="lastVisitDays">({{ lastVisitDays }})</span></span>
                                </div>
                            </div>
                        </el-tooltip>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.links') }}</span>
                                <div
                                    v-if="groupDialog.ref.links && groupDialog.ref.links.length > 0"
                                    style="margin-top: 5px">
                                    <el-tooltip v-for="(link, index) in groupDialog.ref.links" v-if="link" :key="index">
                                        <template #content>
                                            <span v-text="link" />
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
                                <div v-else class="extra">-</div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 350px; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.url') }}</span>
                                <span class="extra"
                                    >{{ groupDialog.ref.$url }}
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.group.info.url_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            type="default"
                                            size="mini"
                                            icon="el-icon-s-order"
                                            circle
                                            style="margin-left: 5px"
                                            @click="copyToClipboard(groupDialog.ref.$url)" /> </el-tooltip
                                ></span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 350px; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.id') }}</span>
                                <span class="extra"
                                    >{{ groupDialog.id }}
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.group.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            type="default"
                                            size="mini"
                                            icon="el-icon-s-order"
                                            circle
                                            style="margin-left: 5px"
                                            @click="copyToClipboard(groupDialog.id)" /> </el-tooltip
                                ></span>
                            </div>
                        </div>
                        <div
                            v-if="groupDialog.ref.membershipStatus === 'member'"
                            style="width: 100%; margin-top: 10px; border-top: 1px solid #e4e7ed14">
                            <div style="width: 100%; display: flex; margin-top: 10px">
                                <div class="x-friend-item" style="cursor: default">
                                    <div class="detail">
                                        <span class="name">{{ t('dialog.group.info.joined_at') }}</span>
                                        <span class="extra">{{
                                            groupDialog.ref.myMember.joinedAt | formatDate('long')
                                        }}</span>
                                    </div>
                                </div>
                                <div class="x-friend-item" style="cursor: default">
                                    <div class="detail">
                                        <span class="name">{{ t('dialog.group.info.roles') }}</span>
                                        <span v-if="groupDialog.memberRoles.length === 0" class="extra"> - </span>
                                        <span v-else class="extra">
                                            <template v-for="(role, rIndex) in groupDialog.memberRoles">
                                                <el-tooltip :key="rIndex" placement="top">
                                                    <template #content>
                                                        <span>{{ t('dialog.group.info.role') }} {{ role.name }}</span>
                                                        <br />
                                                        <span
                                                            >{{ t('dialog.group.info.role_description') }}
                                                            {{ role.description }}</span
                                                        >
                                                        <br />
                                                        <span v-if="role.updatedAt"
                                                            >{{ t('dialog.group.info.role_updated_at') }}
                                                            {{ role.updatedAt | formatDate('long') }}</span
                                                        >
                                                        <span v-else
                                                            >{{ t('dialog.group.info.role_created_at') }}
                                                            {{ role.createdAt | formatDate('long') }}</span
                                                        >
                                                        <br />
                                                        <span>{{ t('dialog.group.info.role_permissions') }}</span>
                                                        <br />
                                                        <template v-for="(permission, pIndex) in role.permissions">
                                                            <span :key="pIndex">{{ permission }}</span>
                                                            <br />
                                                        </template>
                                                    </template>
                                                    <span
                                                        >{{ role.name
                                                        }}{{
                                                            rIndex < groupDialog.memberRoles.length - 1 ? ', ' : ''
                                                        }}</span
                                                    >
                                                </el-tooltip>
                                            </template>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.group.posts.header')" lazy>
                    <template v-if="groupDialog.visible">
                        <span style="margin-right: 10px"
                            >{{ t('dialog.group.posts.posts_count') }} {{ groupDialog.posts.length }}</span
                        >
                        <el-input
                            v-model="groupDialog.postsSearch"
                            clearable
                            size="mini"
                            :placeholder="t('dialog.group.posts.search_placeholder')"
                            style="width: 89%; margin-bottom: 10px"
                            @input="updateGroupPostSearch" />
                        <div class="x-friend-list">
                            <div
                                v-for="post in groupDialog.postsFiltered"
                                :key="post.id"
                                class="x-friend-item"
                                style="width: 100%; cursor: default">
                                <div class="detail">
                                    <span style="display: block" v-text="post.title" />
                                    <div v-if="post.imageUrl" style="display: inline-block; margin-right: 5px">
                                        <el-popover placement="right" width="500px" trigger="click">
                                            <img
                                                slot="reference"
                                                v-lazy="post.imageUrl"
                                                class="x-link"
                                                style="
                                                    flex: none;
                                                    width: 60px;
                                                    height: 60px;
                                                    border-radius: 4px;
                                                    object-fit: cover;
                                                " />
                                            <img
                                                v-lazy="post.imageUrl"
                                                class="x-link"
                                                style="height: 500px"
                                                @click="showFullscreenImageDialog(post.imageUrl)" />
                                        </el-popover>
                                    </div>
                                    <pre
                                        class="extra"
                                        style="
                                            display: inline-block;
                                            vertical-align: top;
                                            font-family: inherit;
                                            font-size: 12px;
                                            white-space: pre-wrap;
                                            margin: 0;
                                        "
                                        >{{ post.text || '-' }}</pre
                                    >
                                    <br />
                                    <div v-if="post.authorId" class="extra" style="float: right; margin-left: 5px">
                                        <el-tooltip v-if="post.roleIds.length" placement="top">
                                            <template slot="content">
                                                <span>{{ t('dialog.group.posts.visibility') }}</span>
                                                <br />
                                                <template v-for="roleId in post.roleIds">
                                                    <span
                                                        v-for="(role, rIndex) in groupDialog.ref.roles"
                                                        v-if="role.id === roleId"
                                                        :key="rIndex"
                                                        v-text="role.name" />
                                                    <span v-if="post.roleIds.indexOf(roleId) < post.roleIds.length - 1"
                                                        >,&nbsp;</span
                                                    >
                                                </template>
                                            </template>
                                            <i class="el-icon-view" style="margin-right: 5px" />
                                        </el-tooltip>
                                        <display-name :userid="post.authorId" style="margin-right: 5px" />
                                        <span v-if="post.editorId" style="margin-right: 5px"
                                            >({{ t('dialog.group.posts.edited_by') }}
                                            <display-name :userid="post.editorId" />)</span
                                        >
                                        <el-tooltip placement="bottom">
                                            <template slot="content">
                                                <span
                                                    >{{ t('dialog.group.posts.created_at') }}
                                                    {{ post.createdAt | formatDate('long') }}</span
                                                >
                                                <template v-if="post.updatedAt !== post.createdAt">
                                                    <br />
                                                    <span
                                                        >{{ t('dialog.group.posts.edited_at') }}
                                                        {{ post.updatedAt | formatDate('long') }}</span
                                                    >
                                                </template>
                                            </template>
                                            <timer :epoch="Date.parse(post.updatedAt)" />
                                        </el-tooltip>
                                        <template
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                            <el-tooltip
                                                placement="top"
                                                :content="t('dialog.group.posts.edit_tooltip')"
                                                :disabled="hideTooltips">
                                                <el-button
                                                    type="text"
                                                    icon="el-icon-edit"
                                                    size="mini"
                                                    style="margin-left: 5px"
                                                    @click="showGroupPostEditDialog(groupDialog.id, post)" />
                                            </el-tooltip>
                                            <el-tooltip
                                                placement="top"
                                                :content="t('dialog.group.posts.delete_tooltip')"
                                                :disabled="hideTooltips">
                                                <el-button
                                                    type="text"
                                                    icon="el-icon-delete"
                                                    size="mini"
                                                    style="margin-left: 5px"
                                                    @click="confirmDeleteGroupPost(post)" />
                                            </el-tooltip>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.group.members.header')" lazy>
                    <template v-if="groupDialog.visible">
                        <span
                            v-if="hasGroupPermission(groupDialog.ref, 'group-members-viewall')"
                            style="font-weight: bold; font-size: 16px"
                            >{{ t('dialog.group.members.all_members') }}</span
                        >
                        <span v-else style="font-weight: bold; font-size: 16px">{{
                            t('dialog.group.members.friends_only')
                        }}</span>
                        <div style="margin-top: 10px">
                            <el-button
                                type="default"
                                size="mini"
                                icon="el-icon-refresh"
                                :loading="isGroupMembersLoading"
                                circle
                                @click="loadAllGroupMembers" />
                            <el-button
                                type="default"
                                size="mini"
                                icon="el-icon-download"
                                circle
                                style="margin-left: 5px"
                                @click="downloadAndSaveJson(`${groupDialog.id}_members`, groupDialog.members)" />
                            <span
                                v-if="groupDialog.memberSearch.length"
                                style="font-size: 14px; margin-left: 5px; margin-right: 5px"
                                >{{ groupDialog.memberSearchResults.length }}/{{ groupDialog.ref.memberCount }}</span
                            >
                            <span v-else style="font-size: 14px; margin-left: 5px; margin-right: 5px"
                                >{{ groupDialog.members.length }}/{{ groupDialog.ref.memberCount }}</span
                            >
                            <div
                                v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')"
                                style="float: right">
                                <span style="margin-right: 5px">{{ t('dialog.group.members.sort_by') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="isGroupMembersLoading || !!groupDialog.memberSearch.length"
                                    @click.native.stop>
                                    <el-button size="mini">
                                        <span
                                            >{{ groupDialog.memberSortOrder.name }}
                                            <i class="el-icon-arrow-down el-icon--right"
                                        /></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            v-for="item in groupDialogSortingOptions"
                                            :key="item.name"
                                            @click.native="setGroupMemberSortOrder(item)"
                                            v-text="item.name" />
                                    </el-dropdown-menu>
                                </el-dropdown>
                                <span style="margin-right: 5px">{{ t('dialog.group.members.filter') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="isGroupMembersLoading || !!groupDialog.memberSearch.length"
                                    @click.native.stop>
                                    <el-button size="mini">
                                        <span
                                            >{{ groupDialog.memberFilter.name }}
                                            <i class="el-icon-arrow-down el-icon--right"
                                        /></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            v-for="item in groupDialogFilterOptions"
                                            :key="item.name"
                                            @click.native="setGroupMemberFilter(item)"
                                            v-text="item.name" />
                                        <el-dropdown-item
                                            v-for="item in groupDialog.ref.roles"
                                            v-if="!item.defaultRole"
                                            :key="item.name"
                                            @click.native="setGroupMemberFilter(item)"
                                            v-text="item.name" />
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </div>
                            <el-input
                                v-model="groupDialog.memberSearch"
                                clearable
                                size="mini"
                                :placeholder="t('dialog.group.members.search')"
                                style="margin-top: 10px; margin-bottom: 10px"
                                @input="groupMembersSearch" />
                        </div>
                        <div
                            v-if="groupDialog.memberSearch.length"
                            v-loading="isGroupMembersLoading"
                            class="x-friend-list"
                            style="margin-top: 10px; overflow: auto; max-height: 250px; min-width: 130px">
                            <div
                                v-for="user in groupDialog.memberSearchResults"
                                :key="user.id"
                                class="x-friend-item x-friend-item-border"
                                @click="showUserDialog(user.userId)">
                                <div class="avatar">
                                    <img v-lazy="userImage(user.user)" />
                                </div>
                                <div class="detail">
                                    <span
                                        class="name"
                                        :style="{ color: user.user.$userColour }"
                                        v-text="user.user.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <el-tooltip
                                                v-if="user.isRepresenting"
                                                placement="top"
                                                :content="t('dialog.group.members.representing')">
                                                <i class="el-icon-collection-tag" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip v-if="user.visibility !== 'visible'" placement="top">
                                                <template slot="content">
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <i class="el-icon-view" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip
                                                v-if="!user.isSubscribedToAnnouncements"
                                                placement="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <i class="el-icon-chat-line-square" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip v-if="user.managerNotes" placement="top">
                                                <template slot="content">
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <i class="el-icon-edit-outline" style="margin-right: 5px" />
                                            </el-tooltip>
                                        </template>
                                        <template v-for="roleId in user.roleIds">
                                            <span
                                                v-for="(role, rIndex) in groupDialog.ref.roles"
                                                v-if="role.id === roleId"
                                                :key="rIndex"
                                                v-text="role.name" />
                                            <span v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                                >,&nbsp;</span
                                            >
                                        </template>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <ul
                            v-else-if="groupDialog.members.length > 0"
                            v-infinite-scroll="loadMoreGroupMembers"
                            class="infinite-list x-friend-list"
                            style="margin-top: 10px; overflow: auto; max-height: 250px; min-width: 130px">
                            <li
                                v-for="user in groupDialog.members"
                                :key="user.id"
                                class="infinite-list-item x-friend-item x-friend-item-border"
                                @click="showUserDialog(user.userId)">
                                <div class="avatar">
                                    <img v-lazy="userImage(user.user)" />
                                </div>
                                <div class="detail">
                                    <span
                                        class="name"
                                        :style="{ color: user.user.$userColour }"
                                        v-text="user.user.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <el-tooltip
                                                v-if="user.isRepresenting"
                                                placement="top"
                                                :content="t('dialog.group.members.representing')">
                                                <i class="el-icon-collection-tag" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip v-if="user.visibility !== 'visible'" placement="top">
                                                <template slot="content">
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <i class="el-icon-view" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip
                                                v-if="!user.isSubscribedToAnnouncements"
                                                placement="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <i class="el-icon-chat-line-square" style="margin-right: 5px" />
                                            </el-tooltip>
                                            <el-tooltip v-if="user.managerNotes" placement="top">
                                                <template slot="content">
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <i class="el-icon-edit-outline" style="margin-right: 5px" />
                                            </el-tooltip>
                                        </template>
                                        <template v-for="roleId in user.roleIds">
                                            <span
                                                v-for="(role, rIndex) in groupDialog.ref.roles"
                                                v-if="role.id === roleId"
                                                :key="rIndex"
                                                v-text="role.name" />
                                            <span v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                                >,&nbsp;</span
                                            >
                                        </template>
                                    </span>
                                </div>
                            </li>
                            <!--FIXME: div in ul-->
                            <div
                                v-if="!isGroupMembersDone"
                                v-loading="isGroupMembersLoading"
                                class="x-friend-item"
                                style="width: 100%; height: 45px; text-align: center"
                                @click="loadMoreGroupMembers">
                                <div v-if="!isGroupMembersLoading" class="detail">
                                    <span class="name">{{ t('dialog.group.members.load_more') }}</span>
                                </div>
                            </div>
                        </ul>
                    </template>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.group.gallery.header')" lazy>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        :loading="isGroupGalleryLoading"
                        circle
                        @click="getGroupGalleries" />
                    <el-tabs
                        v-model="groupDialogGalleryCurrentName"
                        v-loading="isGroupGalleryLoading"
                        type="card"
                        style="margin-top: 10px">
                        <template v-for="(gallery, index) in groupDialog.ref.galleries">
                            <el-tab-pane :key="index">
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px" v-text="gallery.name" />
                                    <i
                                        class="x-status-icon"
                                        style="margin-left: 5px"
                                        :class="groupGalleryStatus(gallery)" />
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupDialog.galleries[gallery.id] ? groupDialog.galleries[gallery.id].length : 0
                                    }}</span>
                                </span>
                                <span style="color: #c7c7c7; padding: 10px" v-text="gallery.description" />
                                <el-carousel :interval="0" height="600px" style="margin-top: 10px">
                                    <el-carousel-item
                                        v-for="image in groupDialog.galleries[gallery.id]"
                                        :key="image.id">
                                        <el-popover placement="top" width="700px" trigger="click">
                                            <img
                                                slot="reference"
                                                v-lazy="image.imageUrl"
                                                class="x-link"
                                                style="width: 100%; height: 100%; object-fit: contain" />
                                            <img
                                                v-lazy="image.imageUrl"
                                                class="x-link"
                                                style="height: 700px"
                                                @click="showFullscreenImageDialog(image.imageUrl)" />
                                        </el-popover>
                                    </el-carousel-item>
                                </el-carousel>
                            </el-tab-pane>
                        </template>
                    </el-tabs>
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.group.json.header')" lazy>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        @click="refreshGroupDialogTreeData()" />
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(groupDialog.id, groupDialog.ref)" />
                    <el-tree :data="groupDialog.treeData" style="margin-top: 5px; font-size: 12px">
                        <template slot-scope="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key" />
                                <span v-if="!scope.data.children" v-text="scope.data.value" />
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>
        <!--Nested-->
        <GroupPostEditDialog :dialog-data.sync="groupPostEditDialog" :selected-gallery-file="selectedGalleryFile" />
        <GroupMemberModerationDialog
            :group-dialog="groupDialog"
            :is-group-members-loading.sync="isGroupMembersLoading"
            :group-dialog-filter-options="groupDialogFilterOptions"
            :group-dialog-sorting-options="groupDialogSortingOptions"
            :random-user-colours="randomUserColours"
            :group-member-moderation="groupMemberModeration"
            @close-dialog="closeMemberModerationDialog"
            @group-members-search="groupMembersSearch"
            @load-all-group-members="loadAllGroupMembers"
            @set-group-member-filter="setGroupMemberFilter"
            @set-group-member-sort-order="setGroupMemberSortOrder" />
        <InviteGroupDialog
            :dialog-data.sync="inviteGroupDialog"
            :vip-friends="vipFriends"
            :online-friends="onlineFriends"
            :offline-friends="offlineFriends"
            :active-friends="activeFriends" />
        <PreviousInstancesGroupDialog
            :previous-instances-group-dialog.sync="previousInstancesGroupDialog"
        />
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance, inject, nextTick, reactive, ref, watch, computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import * as workerTimers from 'worker-timers';
    import { groupRequest } from '../../../api';
    import utils from '../../../classes/utils';
    import { hasGroupPermission } from '../../../composables/group/utils';
    import { refreshInstancePlayerCount } from '../../../composables/instance/utils';
    import { copyToClipboard, downloadAndSaveJson, getFaviconUrl } from '../../../composables/shared/utils';
    import { languageClass } from '../../../composables/user/utils';
import dayjs from 'dayjs';
    import Location from '../../Location.vue';
    import InviteGroupDialog from '../InviteGroupDialog.vue';
    import GroupMemberModerationDialog from './GroupMemberModerationDialog.vue';
    import GroupPostEditDialog from './GroupPostEditDialog.vue';
import PreviousInstancesGroupDialog from "../PreviousInstancesDialog/PreviousInstancesGroupDialog.vue";

    const API = inject('API');
    const showFullscreenImageDialog = inject('showFullscreenImageDialog');
    const showUserDialog = inject('showUserDialog');
    const userStatusClass = inject('userStatusClass');
    const userImage = inject('userImage');
    const openExternalLink = inject('openExternalLink');
    const adjustDialogZ = inject('adjustDialogZ');

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $confirm = instance.proxy.$confirm;
    const $message = instance.proxy.$message;

    const props = defineProps({
        groupDialog: {
            type: Object,
            required: true
        },
        hideTooltips: {
            type: Boolean,
            default: false
        },
        lastLocation: {
            type: Object,
            required: true
        },
        updateInstanceInfo: {
            type: Number,
            required: true
        },
        groupDialogSortingOptions: {
            type: Object,
            required: true
        },
        groupDialogFilterOptions: {
            type: Object,
            required: true
        },
        randomUserColours: {
            type: Boolean,
            default: true
        },
        vipFriends: {
            type: Array,
            default: () => []
        },
        onlineFriends: {
            type: Array,
            default: () => []
        },
        offlineFriends: {
            type: Array,
            default: () => []
        },
        activeFriends: {
            type: Array,
            default: () => []
        }
    });

    const emit = defineEmits([
        'update:group-dialog',
        'groupDialogCommand',
        'getGroupDialogGroup',
        'updateGroupPostSearch'
    ]);

    const groupDialogRef = ref(null);
    const lastVisitDays = computed(() => {
        if (!props.groupDialog.lastVisit) {
            return '';
        }
        return dayjs().diff(dayjs(props.groupDialog.lastVisit), 'day');
    });
    const isGroupMembersDone = ref(false);
    const isGroupMembersLoading = ref(false);
    const groupMembersSearchTimer = ref(null);
    const groupMembersSearchPending = ref(false);
    const groupDialogGalleryCurrentName = ref('0');
    const groupDialogTabCurrentName = ref('0');
    const isGroupGalleryLoading = ref(false);
    const selectedGalleryFile = ref({
        selectedFileId: '',
        selectedImageUrl: ''
    });
    const groupPostEditDialog = reactive({
        visible: false,
        groupRef: {},
        title: '',
        text: '',
        sendNotification: true,
        visibility: 'group',
        roleIds: [],
        postId: '',
        groupId: ''
    });
    const groupMemberModeration = reactive({
        visible: false,
        loading: false,
        id: '',
        groupRef: {},
        auditLogTypes: []
    });

    const inviteGroupDialog = ref({
        visible: false,
        loading: false,
        groupId: '',
        groupName: '',
        userId: '',
        userIds: [],
        userObject: {}
    });

    const previousInstancesGroupDialog = ref({
        visible: false,
        openFlg: false,
        groupRef: {}
    });

    let loadMoreGroupMembersParams = {};

    watch(
        () => props.groupDialog.loading,
        (val) => {
            if (val) {
                nextTick(() => adjustDialogZ(groupDialogRef.value.$el));
            }
        }
    );

    watch(
        () => props.groupDialog.isGetGroupDialogGroupLoading,
        (val) => {
            if (val) {
                getCurrentTabData();
            }
        }
    );

    function showInviteGroupDialog(groupId, userId) {
        const D = inviteGroupDialog.value;
        D.userIds = '';
        D.groups = [];
        D.groupId = groupId;
        D.groupName = groupId;
        D.userId = userId;
        D.userObject = {};
        D.visible = true;
    }

    function showPreviousInstancesGroupDialog(groupRef) {
        const D = previousInstancesGroupDialog.value;
        D.groupRef = groupRef;
        D.visible = true;
        D.openFlg = true;
        nextTick(() => (D.openFlg = false));
    }

    function setGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, true);
    }
    function clearGroupRepresentation(groupId) {
        handleGroupRepresentationChange(groupId, false);
    }

    function closeMemberModerationDialog() {
        groupMemberModeration.visible = false;
    }

    function groupMembersSearch() {
        if (groupMembersSearchTimer.value) {
            groupMembersSearchPending.value = true;
        } else {
            groupMembersSearchExecute();
            groupMembersSearchTimer.value = setTimeout(() => {
                if (groupMembersSearchPending.value) {
                    groupMembersSearchExecute();
                }
                groupMembersSearchTimer.value = null;
            }, 500);
        }
    }

    function groupMembersSearchExecute() {
        try {
            groupMembersSearchDebounce();
        } catch (err) {
            console.error(err);
        }
        groupMembersSearchTimer.value = null;
        groupMembersSearchPending.value = false;
    }

    function groupMembersSearchDebounce() {
        const D = props.groupDialog;
        const search = D.memberSearch;
        D.memberSearchResults = [];
        if (!search || search.length < 3) {
            return;
        }
        isGroupMembersLoading.value = false;
        groupRequest
            .getGroupMembersSearch({
                groupId: D.id,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                // API.$on('GROUP:MEMBERS:SEARCH', function (args) {
                for (const json of args.json.results) {
                    API.$emit('GROUP:MEMBER', {
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                // });
                if (D.id === args.params.groupId) {
                    D.memberSearchResults = args.json.results;
                }
            })
            .finally(() => {
                isGroupMembersLoading.value = false;
            });
    }

    function handleGroupRepresentationChange(groupId, isSet) {
        groupRequest
            .setGroupRepresentation(groupId, {
                isRepresenting: isSet
            })
            .then((args) => {
                // API.$on('GROUP:SETREPRESENTATION', function (args) {
                if (props.groupDialog.visible && props.groupDialog.id === groupId) {
                    updateGroupDialogData({
                        ...props.groupDialog,
                        ref: { ...props.groupDialog.ref, isRepresenting: args.params.isRepresenting }
                    });
                    getGroupDialogGroup(groupId);
                }
            });
    }

    function cancelGroupRequest(id) {
        groupRequest
            .cancelGroupRequest({
                groupId: id
            })
            .then((args) => {
                // API.$on('GROUP:CANCELJOINREQUEST', function (args) {
                if (props.groupDialog.visible && props.groupDialog.id === id) {
                    getGroupDialogGroup(id);
                }
                // });
            });
    }
    function confirmDeleteGroupPost(post) {
        $confirm('Are you sure you want to delete this post?', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    groupRequest
                        .deleteGroupPost({
                            groupId: post.groupId,
                            postId: post.id
                        })
                        .then((args) => {
                            // API.$on('GROUP:POST:DELETE', function (args) {
                            const D = props.groupDialog;
                            if (D.id !== args.params.groupId) {
                                return;
                            }

                            const postId = args.params.postId;
                            // remove existing post
                            for (const item of D.posts) {
                                if (item.id === postId) {
                                    utils.removeFromArray(D.posts, item);
                                    break;
                                }
                            }
                            // remove/update announcement
                            if (postId === D.announcement.id) {
                                if (D.posts.length > 0) {
                                    D.announcement = D.posts[0];
                                } else {
                                    D.announcement = {};
                                }
                            }
                            updateGroupPostSearch();
                            // });
                        });
                }
            }
        });
    }

    function groupGalleryStatus(gallery) {
        const style = {};
        if (!gallery.membersOnly) {
            style.blue = true;
        } else if (!gallery.roleIdsToView) {
            style.green = true;
        } else {
            style.red = true;
        }
        return style;
    }

    function groupDialogCommand(command) {
        const D = props.groupDialog;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Share':
                copyToClipboard(props.groupDialog.ref.$url);
                break;
            case 'Create Post':
                showGroupPostEditDialog(props.groupDialog.id, null);
                break;
            case 'Moderation Tools':
                showGroupMemberModerationDialog(props.groupDialog.id);
                break;
            case 'Invite To Group':
                showInviteGroupDialog(D.id, '');
                break;
            default:
                emit('groupDialogCommand', command);
        }
    }

    function showGroupMemberModerationDialog(groupId) {
        if (groupId !== props.groupDialog.id) {
            return;
        }
        const D = groupMemberModeration;
        D.id = groupId;

        D.groupRef = {};
        D.auditLogTypes = [];
        API.getCachedGroup({ groupId }).then((args) => {
            D.groupRef = args.ref;
            if (hasGroupPermission(D.groupRef, 'group-audit-view')) {
                groupRequest.getGroupAuditLogTypes({ groupId }).then((args) => {
                    // API.$on('GROUP:AUDITLOGTYPES', function (args) {
                    if (groupMemberModeration.id !== args.params.groupId) {
                        return;
                    }
                    groupMemberModeration.auditLogTypes = args.json;
                    // });
                });
            }
        });
        D.visible = true;
    }
    function joinGroup(id) {
        if (!id) {
            return null;
        }
        return groupRequest
            .joinGroup({
                groupId: id
            })
            .then((args) => {
                // API.$on('GROUP:JOIN', function (args) {
                if (props.groupDialog.visible && props.groupDialog.id === id) {
                    updateGroupDialogData({
                        ...props.groupDialog,
                        inGroup: args.json.membershipStatus === 'member'
                    });
                    // props.groupDialog.inGroup = args.json.membershipStatus === 'member';
                    getGroupDialogGroup(id);
                }
                // });
                if (args.json.membershipStatus === 'member') {
                    $message({
                        message: 'Group joined',
                        type: 'success'
                    });
                } else if (args.json.membershipStatus === 'requested') {
                    $message({
                        message: 'Group join request sent',
                        type: 'success'
                    });
                }
                return args;
            });
    }
    function groupDialogTabClick(obj) {
        if (obj.label === t('dialog.group.members.header')) {
            getGroupDialogGroupMembers();
        } else if (obj.label === t('dialog.group.gallery.header')) {
            getGroupGalleries();
        } else if (obj.label === t('dialog.group.json.header')) {
            refreshGroupDialogTreeData();
        }
    }

    function showGroupPostEditDialog(groupId, post) {
        const D = groupPostEditDialog;
        D.sendNotification = true;
        D.groupRef = {};
        D.title = '';
        D.text = '';
        D.visibility = 'group';
        D.roleIds = [];
        D.postId = '';
        D.groupId = groupId;
        selectedGalleryFile.value = {
            selectedFileId: '',
            selectedImageUrl: ''
        };

        if (post) {
            D.title = post.title;
            D.text = post.text;
            D.visibility = post.visibility;
            D.roleIds = post.roleIds;
            D.postId = post.id;
            selectedGalleryFile.value = {
                selectedFileId: post.imageId,
                selectedImageUrl: post.imageUrl
            };
        }
        API.getCachedGroup({ groupId }).then((args) => {
            D.groupRef = args.ref;
        });
        D.visible = true;
    }

    async function getGroupDialogGroupMembers() {
        const D = props.groupDialog;
        D.members = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams = {
            n: 100,
            offset: 0,
            groupId: D.id
        };
        if (D.memberSortOrder.value) {
            loadMoreGroupMembersParams.sort = D.memberSortOrder.value;
        }
        if (D.memberFilter.id !== null) {
            loadMoreGroupMembersParams.roleId = D.memberFilter.id;
        }
        if (D.inGroup) {
            await groupRequest
                .getGroupMember({
                    groupId: D.id,
                    userId: API.currentUser.id
                })
                .then((args) => {
                    args.ref = API.applyGroupMember(args.json);
                    if (args.json) {
                        args.json.user = API.currentUser;
                        if (D.memberFilter.id === null) {
                            // when flitered by role don't include self
                            D.members.push(args.json);
                        }
                    }
                    return args;
                });
        }
        await loadMoreGroupMembers();
    }

    async function loadMoreGroupMembers() {
        if (isGroupMembersDone.value || isGroupMembersLoading.value) {
            return;
        }
        const D = props.groupDialog;
        const params = loadMoreGroupMembersParams;
        D.memberSearch = '';
        isGroupMembersLoading.value = true;
        await groupRequest
            .getGroupMembers(params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === API.currentUser.id) {
                        if (D.members.length > 0 && D.members[0].userId === API.currentUser.id) {
                            // remove duplicate and keep sort order
                            D.members.splice(0, 1);
                        }
                        break;
                    }
                }
                if (args.json.length < params.n) {
                    isGroupMembersDone.value = true;
                }
                D.members = [...D.members, ...args.json];
                params.offset += params.n;
                return args;
            })
            .catch((err) => {
                isGroupMembersDone.value = true;
                throw err;
            });
    }

    function getCurrentTabData() {
        if (groupDialogTabCurrentName.value === '2') {
            getGroupDialogGroupMembers();
        } else if (groupDialogTabCurrentName.value === '3') {
            getGroupGalleries();
        } else if (groupDialogTabCurrentName.value === '4') {
            refreshGroupDialogTreeData();
        }
    }

    async function getGroupGalleries() {
        updateGroupDialogData({ ...props.groupDialog, galleries: {} });
        groupDialogGalleryCurrentName.value = '0';
        isGroupGalleryLoading.value = true;
        for (let i = 0; i < props.groupDialog.ref.galleries.length; i++) {
            const gallery = props.groupDialog.ref.galleries[i];
            await getGroupGallery(props.groupDialog.id, gallery.id);
        }
        isGroupGalleryLoading.value = false;
    }

    async function getGroupGallery(groupId, galleryId) {
        try {
            const params = {
                groupId,
                galleryId,
                n: 100,
                offset: 0
            };
            const count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupGallery(params);
                if (args) {
                    // API.$on('GROUP:GALLERY', function (args) {
                    for (const json of args.json) {
                        if (props.groupDialog.id === json.groupId) {
                            if (!props.groupDialog.galleries[json.galleryId]) {
                                props.groupDialog.galleries[json.galleryId] = [];
                            }
                            props.groupDialog.galleries[json.galleryId].push(json);
                        }
                    }
                    // });
                }
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    function refreshGroupDialogTreeData() {
        const D = props.groupDialog;
        const treeData = utils.buildTreeData({
            group: D.ref,
            posts: D.posts,
            instances: D.instances,
            members: D.members,
            galleries: D.galleries
        });
        updateGroupDialogData({
            ...props.groupDialog,
            treeData
        });
    }

    async function loadAllGroupMembers() {
        if (isGroupMembersLoading.value) {
            return;
        }
        await getGroupDialogGroupMembers();
        while (props.groupDialog.visible && !isGroupMembersDone.value) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await this.loadMoreGroupMembers();
        }
    }

    async function setGroupMemberSortOrder(sortOrder) {
        const D = props.groupDialog;
        if (D.memberSortOrder === sortOrder) {
            return;
        }
        D.memberSortOrder = sortOrder;
        await getGroupDialogGroupMembers();
    }

    async function setGroupMemberFilter(filter) {
        const D = props.groupDialog;
        if (D.memberFilter === filter) {
            return;
        }
        D.memberFilter = filter;
        await getGroupDialogGroupMembers();
    }

    function updateGroupDialogData(obj) {
        // Be careful with the deep merge
        emit('update:group-dialog', obj);
    }
    function getGroupDialogGroup(groupId) {
        emit('getGroupDialogGroup', groupId);
    }
    function updateGroupPostSearch() {
        emit('updateGroupPostSearch');
    }
</script>
