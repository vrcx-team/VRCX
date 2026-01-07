<template>
    <el-dialog
        :z-index="groupDialogIndex"
        v-model="groupDialog.visible"
        :show-close="false"
        top="10vh"
        width="940px"
        class="x-dialog x-group-dialog">
        <div v-loading="groupDialog.loading" class="group-body">
            <div style="display: flex">
                <img
                    :src="groupDialog.ref.iconUrl"
                    style="flex: none; width: 120px; height: 120px; border-radius: 12px"
                    class="x-link"
                    @click="showFullscreenImageDialog(groupDialog.ref.iconUrl)"
                    loading="lazy" />
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div class="group-header" style="flex: 1">
                        <span v-if="groupDialog.ref.ownerId === currentUser.id" style="margin-right: 5px">👑</span>
                        <span
                            class="dialog-title"
                            style="margin-right: 5px; cursor: pointer"
                            v-text="groupDialog.ref.name"
                            @click="copyToClipboard(groupDialog.ref.name)"></span>
                        <span
                            class="group-discriminator x-grey"
                            style="font-family: monospace; font-size: 12px; margin-right: 5px">
                            {{ groupDialog.ref.shortCode }}.{{ groupDialog.ref.discriminator }}
                        </span>
                        <TooltipWrapper v-for="item in groupDialog.ref.$languages" :key="item.key" side="top">
                            <template #content>
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                class="flags"
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 5px"></span>
                        </TooltipWrapper>
                        <div style="margin-top: 5px">
                            <span
                                class="x-link x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(groupDialog.ref.ownerId)"
                                v-text="groupDialog.ownerDisplayName"></span>
                        </div>
                        <div class="group-tags">
                            <Badge
                                v-if="groupDialog.ref.isVerified"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.verified') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.privacy === 'private'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.private') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.privacy === 'default'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.public') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.joinState === 'open'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.open') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'request'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.request') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'invite'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.invite') }}
                            </Badge>
                            <Badge
                                v-else-if="groupDialog.ref.joinState === 'closed'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.closed') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.inGroup"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.joined') }}
                            </Badge>
                            <Badge
                                v-if="groupDialog.ref.myMember && groupDialog.ref.myMember.bannedAt"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.group.tags.banned') }}
                            </Badge>
                            <template v-if="groupDialog.inGroup && groupDialog.ref.myMember">
                                <Badge
                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.visible') }}
                                </Badge>
                                <Badge
                                    v-else-if="groupDialog.ref.myMember.visibility === 'friends'"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.friends') }}
                                </Badge>
                                <Badge
                                    v-else-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.hidden') }}
                                </Badge>
                                <Badge
                                    v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    {{ t('dialog.group.tags.subscribed') }}
                                </Badge>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <pre
                                v-show="groupDialog.ref.name !== groupDialog.ref.description"
                                style="
                                    font-family: inherit;
                                    font-size: 12px;
                                    white-space: pre-wrap;
                                    max-height: 40vh;
                                    overflow-y: auto;
                                "
                                v-text="groupDialog.ref.description"></pre>
                        </div>
                    </div>
                    <div style="flex: none; margin-left: 10px">
                        <template v-if="groupDialog.inGroup && groupDialog.ref?.myMember">
                            <TooltipWrapper
                                v-if="groupDialog.ref.myMember?.isRepresenting"
                                side="top"
                                :content="t('dialog.group.actions.unrepresent_tooltip')">
                                <el-button
                                    type="warning"
                                    :icon="Star"
                                    size="large"
                                    circle
                                    style="margin-left: 5px"
                                    @click="clearGroupRepresentation(groupDialog.id)"></el-button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('dialog.group.actions.represent_tooltip')">
                                <span>
                                    <el-button
                                        type="default"
                                        :icon="StarFilled"
                                        size="large"
                                        circle
                                        style="margin-left: 5px"
                                        :disabled="groupDialog.ref.privacy === 'private'"
                                        @click="setGroupRepresentation(groupDialog.id)"></el-button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'requested'">
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.cancel_join_request_tooltip')">
                                <span>
                                    <el-button
                                        type="default"
                                        :icon="Close"
                                        size="large"
                                        circle
                                        style="margin-left: 5px"
                                        @click="cancelGroupRequest(groupDialog.id)"></el-button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'invited'">
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.pending_request_tooltip')">
                                <span>
                                    <el-button
                                        type="default"
                                        :icon="Check"
                                        size="large"
                                        circle
                                        style="margin-left: 5px"
                                        @click="joinGroup(groupDialog.id)"></el-button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'request'"
                                side="top"
                                :content="t('dialog.group.actions.request_join_tooltip')">
                                <el-button
                                    type="default"
                                    :icon="Message"
                                    size="large"
                                    circle
                                    style="margin-left: 5px"
                                    @click="joinGroup(groupDialog.id)"></el-button>
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'invite'"
                                side="top"
                                :content="t('dialog.group.actions.invite_required_tooltip')">
                                <span>
                                    <el-button
                                        type="default"
                                        :icon="Message"
                                        size="large"
                                        disabled
                                        circle
                                        style="margin-left: 5px"></el-button>
                                </span>
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'open'"
                                side="top"
                                :content="t('dialog.group.actions.join_group_tooltip')">
                                <el-button
                                    type="default"
                                    :icon="Check"
                                    size="large"
                                    circle
                                    style="margin-left: 5px"
                                    @click="joinGroup(groupDialog.id)"></el-button>
                            </TooltipWrapper>
                        </template>
                        <el-dropdown trigger="click" style="margin-left: 5px" @command="groupDialogCommand">
                            <el-button
                                :type="groupDialog.ref.membershipStatus === 'userblocked' ? 'danger' : 'default'"
                                :icon="MoreFilled"
                                size="large"
                                circle></el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item :icon="Refresh" command="Refresh">
                                        {{ t('dialog.group.actions.refresh') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item :icon="Share" command="Share">
                                        {{ t('dialog.group.actions.share') }}
                                    </el-dropdown-item>
                                    <template v-if="groupDialog.inGroup">
                                        <template v-if="groupDialog.ref.myMember">
                                            <el-dropdown-item
                                                v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                                :icon="MuteNotification"
                                                command="Unsubscribe To Announcements"
                                                divided>
                                                {{ t('dialog.group.actions.unsubscribe') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item
                                                v-else
                                                :icon="Bell"
                                                command="Subscribe To Announcements"
                                                divided>
                                                {{ t('dialog.group.actions.subscribe') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item
                                                v-if="hasGroupPermission(groupDialog.ref, 'group-invites-manage')"
                                                :icon="Message"
                                                command="Invite To Group">
                                                {{ t('dialog.group.actions.invite_to_group') }}
                                            </el-dropdown-item>
                                            <template
                                                v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                                <el-dropdown-item :icon="Tickets" command="Create Post">
                                                    {{ t('dialog.group.actions.create_post') }}
                                                </el-dropdown-item>
                                            </template>
                                            <el-dropdown-item
                                                :disabled="!hasGroupModerationPermission(groupDialog.ref)"
                                                :icon="Operation"
                                                command="Moderation Tools">
                                                {{ t('dialog.group.actions.moderation_tools') }}
                                            </el-dropdown-item>
                                            <template
                                                v-if="
                                                    groupDialog.ref.myMember && groupDialog.ref.privacy === 'default'
                                                ">
                                                <el-dropdown-item :icon="View" command="Visibility Everyone" divided>
                                                    <el-icon v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{ t('dialog.group.actions.visibility_everyone') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item :icon="View" command="Visibility Friends">
                                                    <el-icon v-if="groupDialog.ref.myMember.visibility === 'friends'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{ t('dialog.group.actions.visibility_friends') }}
                                                </el-dropdown-item>
                                                <el-dropdown-item :icon="View" command="Visibility Hidden">
                                                    <el-icon v-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{ t('dialog.group.actions.visibility_hidden') }}
                                                </el-dropdown-item>
                                            </template>
                                            <el-dropdown-item
                                                :icon="Delete"
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
                                            :icon="CircleCheck"
                                            command="Unblock Group"
                                            style="color: #f56c6c"
                                            divided>
                                            {{ t('dialog.group.actions.unblock') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item v-else :icon="CircleClose" command="Block Group" divided>
                                            {{ t('dialog.group.actions.block') }}
                                        </el-dropdown-item>
                                    </template>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs v-model="groupDialogLastActiveTab" @tab-click="groupDialogTabClick">
                <el-tab-pane name="Info" :label="t('dialog.group.info.header')">
                    <div class="group-banner-image-info">
                        <img
                            :src="groupDialog.ref.bannerUrl"
                            class="x-link"
                            style="flex: none; width: 100%; aspect-ratio: 6/1; object-fit: cover; border-radius: 4px"
                            @click="showFullscreenImageDialog(groupDialog.ref.bannerUrl)"
                            loading="lazy" />
                    </div>
                    <div class="x-friend-list" style="max-height: none">
                        <span
                            v-if="groupDialog.instances.length"
                            style="font-size: 12px; font-weight: bold; margin: 5px">
                            {{ t('dialog.group.info.instances') }}
                        </span>
                        <div v-for="room in groupDialog.instances" :key="room.tag" style="width: 100%">
                            <div style="margin: 5px 0">
                                <Location :location="room.tag" style="display: inline-block" />
                                <InviteYourself :location="room.tag" style="margin-left: 5px" />
                                <TooltipWrapper side="top" content="Refresh player count">
                                    <el-button
                                        size="small"
                                        :icon="Refresh"
                                        style="margin-left: 5px"
                                        circle
                                        @click="refreshInstancePlayerCount(room.tag)" />
                                </TooltipWrapper>
                                <LastJoin :location="room.tag" :currentlocation="lastLocation.location" />
                                <InstanceInfo
                                    :location="room.tag"
                                    :instance="room.ref"
                                    :friendcount="room.friendCount" />
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
                                        <img :src="userImage(user)" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span
                                            class="name"
                                            :style="{ color: user.$userColour }"
                                            v-text="user.displayName" />
                                        <span v-if="user.location === 'traveling'" class="extra">
                                            <el-icon class="is-loading" style="margin-right: 3px"><Loading /></el-icon>
                                            <Timer :epoch="user.$travelingToTime" />
                                        </span>
                                        <span v-else class="extra">
                                            <Timer :epoch="user.$location_at" />
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
                                    <img
                                        :src="groupDialog.announcement.imageUrl"
                                        class="x-link"
                                        style="
                                            flex: none;
                                            width: 60px;
                                            height: 60px;
                                            border-radius: 4px;
                                            object-fit: cover;
                                        "
                                        @click="showFullscreenImageDialog(groupDialog.announcement.imageUrl)"
                                        loading="lazy" />
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
                                    <TooltipWrapper v-if="groupDialog.announcement.roleIds.length" side="top">
                                        <template #content>
                                            <span>{{ t('dialog.group.posts.visibility') }}</span>
                                            <br />
                                            <template v-for="roleId in groupDialog.announcement.roleIds" :key="roleId">
                                                <template v-for="role in groupDialog.ref.roles" :key="roleId + role.id"
                                                    ><span v-if="role.id === roleId" v-text="role.name"
                                                /></template>
                                                <span
                                                    v-if="
                                                        groupDialog.announcement.roleIds.indexOf(roleId) <
                                                        groupDialog.announcement.roleIds.length - 1
                                                    ">
                                                    ,&nbsp;
                                                </span>
                                            </template>
                                        </template>
                                        <el-icon style="margin-right: 5px"><View /></el-icon>
                                    </TooltipWrapper>
                                    <DisplayName
                                        :userid="groupDialog.announcement.authorId"
                                        style="margin-right: 5px" />
                                    <span v-if="groupDialog.announcement.editorId" style="margin-right: 5px">
                                        ({{ t('dialog.group.posts.edited_by') }}
                                        <DisplayName :userid="groupDialog.announcement.editorId" />)
                                    </span>
                                    <TooltipWrapper side="bottom">
                                        <template #content>
                                            <span
                                                >{{ t('dialog.group.posts.created_at') }}
                                                {{ formatDateFilter(groupDialog.announcement.createdAt, 'long') }}</span
                                            >
                                            <template
                                                v-if="
                                                    groupDialog.announcement.updatedAt !==
                                                    groupDialog.announcement.createdAt
                                                ">
                                                <br />
                                                <span
                                                    >{{ t('dialog.group.posts.edited_at') }}
                                                    {{
                                                        formatDateFilter(groupDialog.announcement.updatedAt, 'long')
                                                    }}</span
                                                >
                                            </template>
                                        </template>
                                        <Timer :epoch="Date.parse(groupDialog.announcement.updatedAt)" />
                                    </TooltipWrapper>
                                    <template v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                        <TooltipWrapper side="top" :content="t('dialog.group.posts.edit_tooltip')">
                                            <el-button
                                                text
                                                :icon="Edit"
                                                size="small"
                                                style="margin-left: 5px; padding: 0"
                                                @click="
                                                    showGroupPostEditDialog(groupDialog.id, groupDialog.announcement)
                                                " />
                                        </TooltipWrapper>
                                        <TooltipWrapper side="top" :content="t('dialog.group.posts.delete_tooltip')">
                                            <el-button
                                                text
                                                :icon="Delete"
                                                size="small"
                                                style="margin-left: 5px; padding: 0"
                                                @click="confirmDeleteGroupPost(groupDialog.announcement)" />
                                        </TooltipWrapper>
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
                        <div class="x-friend-item x-friend-item-no-hover" style="width: 100%; cursor: default">
                            <div class="detail" style="overflow: visible">
                                <span class="name">{{ t('dialog.group.info.upcoming_events') }}</span>
                                <template v-if="upcomingCalenderEvents.length > 0">
                                    <br />
                                    <div class="grid-view events-row">
                                        <GroupCalendarEventCard
                                            v-for="value in upcomingCalenderEvents"
                                            :key="value.id"
                                            :event="value"
                                            :is-following="value.userInterest?.isFollowing"
                                            @update-following-calendar-data="updateFollowingCalendarData"
                                            mode="grid"
                                            card-class="group-dialog-grid-card" />
                                    </div>
                                </template>
                                <span v-else class="extra">-</span>
                            </div>
                        </div>
                        <div class="x-friend-item x-friend-item-no-hover" style="width: 100%; cursor: default">
                            <div class="detail" style="overflow: visible">
                                <span class="name">{{ t('dialog.group.info.past_events') }}</span>
                                <template v-if="pastCalenderEvents.length > 0">
                                    <br />
                                    <div class="grid-view events-row">
                                        <GroupCalendarEventCard
                                            v-for="value in pastCalenderEvents"
                                            :key="value.id"
                                            :event="value"
                                            :is-following="value.userInterest?.isFollowing"
                                            @update-following-calendar-data="updateFollowingCalendarData"
                                            mode="grid"
                                            card-class="group-dialog-grid-card" />
                                    </div>
                                </template>
                                <span v-else class="extra">-</span>
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
                                <span class="extra">{{ formatDateFilter(groupDialog.ref.createdAt, 'long') }}</span>
                            </div>
                        </div>
                        <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                            <div class="x-friend-item" @click="showPreviousInstancesGroupDialog(groupDialog.ref)">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.group.info.last_visited') }}
                                        <TooltipWrapper side="top" :content="t('dialog.user.info.accuracy_notice')">
                                            <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                        </TooltipWrapper>
                                    </span>
                                    <span class="extra">{{ formatDateFilter(groupDialog.lastVisit, 'long') }}</span>
                                </div>
                            </div>
                        </TooltipWrapper>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.links') }}</span>
                                <div
                                    v-if="groupDialog.ref.links && groupDialog.ref.links.length > 0"
                                    style="margin-top: 5px"
                                    class="flex">
                                    <template v-for="(link, index) in groupDialog.ref.links" :key="index">
                                        <TooltipWrapper v-if="link">
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
                                                @click.stop="openExternalLink(link)"
                                                loading="lazy" />
                                        </TooltipWrapper>
                                    </template>
                                </div>
                                <div v-else class="extra">-</div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 350px; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.url') }}</span>
                                <span class="extra"
                                    >{{ groupDialog.ref.$url }}
                                    <TooltipWrapper side="top" :content="t('dialog.group.info.url_tooltip')">
                                        <el-button
                                            type="default"
                                            size="small"
                                            :icon="CopyDocument"
                                            circle
                                            style="margin-left: 5px"
                                            @click="copyToClipboard(groupDialog.ref.$url)" /> </TooltipWrapper
                                ></span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 350px; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.group.info.id') }}</span>
                                <span class="extra"
                                    >{{ groupDialog.id }}
                                    <TooltipWrapper side="top" :content="t('dialog.group.info.id_tooltip')">
                                        <el-button
                                            type="default"
                                            size="small"
                                            :icon="CopyDocument"
                                            circle
                                            style="margin-left: 5px"
                                            @click="copyToClipboard(groupDialog.id)" /> </TooltipWrapper
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
                                            formatDateFilter(groupDialog.ref.myMember.joinedAt, 'long')
                                        }}</span>
                                    </div>
                                </div>
                                <div class="x-friend-item" style="cursor: default">
                                    <div class="detail">
                                        <span class="name">{{ t('dialog.group.info.roles') }}</span>
                                        <span v-if="groupDialog.memberRoles.length === 0" class="extra"> - </span>
                                        <span v-else class="extra">
                                            <template v-for="(role, rIndex) in groupDialog.memberRoles" :key="rIndex">
                                                <TooltipWrapper side="top">
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
                                                            {{ formatDateFilter(role.updatedAt, 'long') }}</span
                                                        >
                                                        <span v-else
                                                            >{{ t('dialog.group.info.role_created_at') }}
                                                            {{ formatDateFilter(role.createdAt, 'long') }}</span
                                                        >
                                                        <br />
                                                        <span>{{ t('dialog.group.info.role_permissions') }}</span>
                                                        <br />
                                                        <template
                                                            v-for="(permission, pIndex) in role.permissions"
                                                            :key="pIndex">
                                                            <span>{{ permission }}</span>
                                                            <br />
                                                        </template>
                                                    </template>
                                                    <span
                                                        >{{ role.name
                                                        }}{{
                                                            rIndex < groupDialog.memberRoles.length - 1 ? ', ' : ''
                                                        }}</span
                                                    >
                                                </TooltipWrapper>
                                            </template>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>
                <el-tab-pane name="Posts" :label="t('dialog.group.posts.header')" lazy>
                    <template v-if="groupDialog.visible">
                        <span style="margin-right: 10px; vertical-align: top"
                            >{{ t('dialog.group.posts.posts_count') }} {{ groupDialog.posts.length }}</span
                        >
                        <el-input
                            v-model="groupDialog.postsSearch"
                            clearable
                            size="small"
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
                                        <img
                                            :src="post.imageUrl"
                                            class="x-link"
                                            style="
                                                flex: none;
                                                width: 60px;
                                                height: 60px;
                                                border-radius: 4px;
                                                object-fit: cover;
                                            "
                                            @click="showFullscreenImageDialog(post.imageUrl)"
                                            loading="lazy" />
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
                                        <TooltipWrapper v-if="post.roleIds.length" side="top">
                                            <template #content>
                                                <span>{{ t('dialog.group.posts.visibility') }}</span>
                                                <br />
                                                <template v-for="roleId in post.roleIds" :key="roleId">
                                                    <template
                                                        v-for="role in groupDialog.ref.roles"
                                                        :key="role.id + roleId"
                                                        ><span v-if="role.id === roleId" v-text="role.name" />
                                                    </template>
                                                    <template
                                                        v-if="post.roleIds.indexOf(roleId) < post.roleIds.length - 1"
                                                        ><span>,&nbsp;</span></template
                                                    >
                                                </template>
                                            </template>
                                            <el-icon style="margin-right: 5px"><View /></el-icon>
                                        </TooltipWrapper>
                                        <DisplayName :userid="post.authorId" style="margin-right: 5px" />
                                        <span v-if="post.editorId" style="margin-right: 5px"
                                            >({{ t('dialog.group.posts.edited_by') }}
                                            <DisplayName :userid="post.editorId" />)</span
                                        >
                                        <TooltipWrapper side="bottom">
                                            <template #content>
                                                <span
                                                    >{{ t('dialog.group.posts.created_at') }}
                                                    {{ formatDateFilter(post.createdAt, 'long') }}</span
                                                >
                                                <template v-if="post.updatedAt !== post.createdAt">
                                                    <br />
                                                    <span
                                                        >{{ t('dialog.group.posts.edited_at') }}
                                                        {{ formatDateFilter(post.updatedAt, 'long') }}</span
                                                    >
                                                </template>
                                            </template>
                                            <Timer :epoch="Date.parse(post.updatedAt)" />
                                        </TooltipWrapper>
                                        <template
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                            <TooltipWrapper side="top" :content="t('dialog.group.posts.edit_tooltip')">
                                                <el-button
                                                    text
                                                    :icon="Edit"
                                                    size="small"
                                                    style="margin-left: 5px"
                                                    @click="showGroupPostEditDialog(groupDialog.id, post)" />
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                side="top"
                                                :content="t('dialog.group.posts.delete_tooltip')">
                                                <el-button
                                                    text
                                                    :icon="Delete"
                                                    size="small"
                                                    style="margin-left: 5px"
                                                    @click="confirmDeleteGroupPost(post)" />
                                            </TooltipWrapper>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </el-tab-pane>
                <el-tab-pane name="Members" :label="t('dialog.group.members.header')" lazy>
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
                                size="small"
                                :icon="Refresh"
                                :loading="isGroupMembersLoading"
                                circle
                                @click="loadAllGroupMembers" />
                            <el-button
                                type="default"
                                size="small"
                                :icon="Download"
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
                                    :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0">
                                    <el-button size="small" @click.stop>
                                        <span
                                            >{{ t(groupDialog.memberSortOrder.name) }}
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon>
                                        </span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item
                                                v-for="item in groupDialogSortingOptions"
                                                :key="item.name"
                                                @click="setGroupMemberSortOrder(item)"
                                                v-text="t(item.name)" />
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                                <span style="margin-right: 5px">{{ t('dialog.group.members.filter') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0">
                                    <el-button size="small" @click.stop>
                                        <span
                                            >{{ t(groupDialog.memberFilter.name) }}
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                                        ></span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item
                                                v-for="item in groupDialogFilterOptions"
                                                :key="item.name"
                                                @click="setGroupMemberFilter(item)"
                                                v-text="t(item.name)" />
                                            <template v-for="role in groupDialog.ref.roles" :key="role.name">
                                                <el-dropdown-item
                                                    v-if="!role.defaultRole"
                                                    @click="setGroupMemberFilter(role)"
                                                    v-text="role.name" />
                                            </template>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                            <el-input
                                v-model="groupDialog.memberSearch"
                                :disabled="!hasGroupPermission(groupDialog.ref, 'group-members-manage')"
                                clearable
                                size="small"
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
                                    <img :src="userImage(user.user)" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span
                                        class="name"
                                        :style="{ color: user.user?.$userColour }"
                                        v-text="user.user.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <TooltipWrapper
                                                v-if="user.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <el-icon style="margin-right: 5px"><View /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                v-if="!user.isSubscribedToAnnouncements"
                                                side="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <el-icon style="margin-right: 5px"><ChatLineSquare /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                                <template #content>
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <el-icon style="margin-right: 5px"><Edit /></el-icon>
                                            </TooltipWrapper>
                                        </template>
                                        <template v-for="roleId in user.roleIds" :key="roleId">
                                            <template v-for="role in groupDialog.ref.roles" :key="role.id + roleId"
                                                ><span v-if="role.id === roleId" v-text="role.name" /></template
                                            ><template v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                                ><span>,&nbsp;</span></template
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
                                    <img :src="userImage(user.user)" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span
                                        class="name"
                                        :style="{ color: user.user?.$userColour }"
                                        v-text="user.user.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <TooltipWrapper
                                                v-if="user.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <el-icon style="margin-right: 5px"><View /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                v-if="!user.isSubscribedToAnnouncements"
                                                side="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <el-icon style="margin-right: 5px"><ChatLineSquare /></el-icon>
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                                <template #content>
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <el-icon style="margin-right: 5px"><Edit /></el-icon>
                                            </TooltipWrapper>
                                        </template>
                                        <template v-for="roleId in user.roleIds" :key="roleId">
                                            <template v-for="role in groupDialog.ref.roles" :key="roleId + role.id"
                                                ><span v-if="role.id === roleId" v-text="role.name" /></template
                                            ><template v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                                ><span>&nbsp;</span></template
                                            >
                                        </template>
                                    </span>
                                </div>
                            </li>
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
                <el-tab-pane name="Photos" :label="t('dialog.group.gallery.header')" lazy>
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        :loading="isGroupGalleryLoading"
                        circle
                        @click="getGroupGalleries" />
                    <el-tabs
                        v-model="groupDialogGalleryCurrentName"
                        v-loading="isGroupGalleryLoading"
                        style="margin-top: 10px">
                        <template v-for="(gallery, index) in groupDialog.ref.galleries" :key="index">
                            <el-tab-pane>
                                <template #label>
                                    <span style="font-weight: bold; font-size: 16px" v-text="gallery.name" />
                                    <i
                                        class="x-status-icon"
                                        style="margin-left: 5px"
                                        :class="groupGalleryStatus(gallery)" />
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupDialog.galleries[gallery.id] ? groupDialog.galleries[gallery.id].length : 0
                                    }}</span>
                                </template>
                                <span style="color: #c7c7c7; padding: 10px" v-text="gallery.description" />
                                <div
                                    style="
                                        display: grid;
                                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                                        gap: 15px;
                                        margin-top: 10px;
                                        max-height: 600px;
                                        overflow-y: auto;
                                    ">
                                    <el-card
                                        v-for="image in groupDialog.galleries[gallery.id]"
                                        :key="image.id"
                                        :body-style="{ padding: '0' }"
                                        shadow="hover">
                                        <img
                                            :src="image.imageUrl"
                                            :class="['x-link', 'x-popover-image']"
                                            @click="showFullscreenImageDialog(image.imageUrl)"
                                            loading="lazy" />
                                    </el-card>
                                </div>
                            </el-tab-pane>
                        </template>
                    </el-tabs>
                </el-tab-pane>
                <el-tab-pane name="JSON" :label="t('dialog.group.json.header')" lazy>
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        @click="refreshGroupDialogTreeData()" />
                    <el-button
                        type="default"
                        size="small"
                        :icon="Download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(groupDialog.id, groupDialog.ref)" />
                    <el-tree :data="groupDialog.treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key" />
                                <span v-if="!scope.data.children" v-text="scope.data.value" />
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>
        <GroupPostEditDialog :dialog-data="groupPostEditDialog" :selected-gallery-file="selectedGalleryFile" />
        <PreviousInstancesGroupDialog
            :previous-instances-group-dialog="previousInstancesGroupDialog"
            :current-user="currentUser" />
    </el-dialog>
</template>

<script setup>
    import {
        ArrowDown,
        Bell,
        ChatLineSquare,
        Check,
        CircleCheck,
        CircleClose,
        Close,
        CollectionTag,
        CopyDocument,
        Delete,
        Download,
        Edit,
        Loading,
        Message,
        MoreFilled,
        MuteNotification,
        Operation,
        Refresh,
        Share,
        Star,
        StarFilled,
        Tickets,
        View,
        Warning
    } from '@element-plus/icons-vue';
    import { computed, nextTick, reactive, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        buildTreeData,
        copyToClipboard,
        debounce,
        downloadAndSaveJson,
        formatDateFilter,
        getFaviconUrl,
        hasGroupModerationPermission,
        hasGroupPermission,
        languageClass,
        openExternalLink,
        refreshInstancePlayerCount,
        removeFromArray,
        userImage,
        userStatusClass
    } from '../../../shared/utils';
    import { useGalleryStore, useGroupStore, useLocationStore, useUserStore } from '../../../stores';
    import { groupDialogFilterOptions, groupDialogSortingOptions } from '../../../shared/constants';
    import { Badge } from '../../ui/badge';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { groupRequest } from '../../../api';

    import GroupCalendarEventCard from '../../../views/Tools/components/GroupCalendarEventCard.vue';
    import GroupPostEditDialog from './GroupPostEditDialog.vue';
    import PreviousInstancesGroupDialog from '../PreviousInstancesDialog/PreviousInstancesGroupDialog.vue';

    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();

    const { showUserDialog } = useUserStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog, inviteGroupDialog } = storeToRefs(useGroupStore());
    const {
        getGroupDialogGroup,
        updateGroupPostSearch,
        showGroupDialog,
        leaveGroupPrompt,
        setGroupVisibility,
        setGroupSubscription,
        applyGroupMember,
        handleGroupMember,
        showGroupMemberModerationDialog
    } = useGroupStore();

    const { lastLocation } = storeToRefs(useLocationStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const groupDialogLastActiveTab = ref('Info');
    const groupDialogIndex = ref(2000);
    const isGroupMembersDone = ref(false);
    const isGroupMembersLoading = ref(false);
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

    const previousInstancesGroupDialog = ref({
        visible: false,
        openFlg: false,
        groupRef: {}
    });

    let loadMoreGroupMembersParams = ref({
        n: 100,
        offset: 0,
        groupId: '',
        sort: '',
        roleId: ''
    });

    const pastCalenderEvents = computed(() => {
        if (!groupDialog.value.calendar) {
            return [];
        }
        const now = Date.now();
        return groupDialog.value.calendar.filter((event) => {
            const eventEnd = new Date(event.endsAt).getTime();
            return eventEnd < now;
        });
    });

    const upcomingCalenderEvents = computed(() => {
        if (!groupDialog.value.calendar) {
            return [];
        }
        const now = Date.now();
        return groupDialog.value.calendar.filter((event) => {
            const eventEnd = new Date(event.endsAt).getTime();
            return eventEnd >= now;
        });
    });

    watch(
        () => groupDialog.value.loading,
        () => {
            if (groupDialog.value.visible) {
                nextTick(() => {
                    groupDialogIndex.value = getNextDialogIndex();
                });
            }
        }
    );

    watch(
        () => groupDialog.value.isGetGroupDialogGroupLoading,
        (val) => {
            if (val) {
                loadLastActiveTab();
            }
        }
    );

    function showInviteGroupDialog(groupId, userId) {
        if (groupId) {
            inviteGroupDialog.value.groupId = groupId;
        }
        if (userId) {
            inviteGroupDialog.value.userId = userId;
        }
        inviteGroupDialog.value.visible = true;
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

    function groupMembersSearch() {
        if (groupDialog.value.memberSearch.length < 3) {
            groupDialog.value.memberSearchResults = [];
            isGroupMembersLoading.value = false;
            return;
        }
        debounce(groupMembersSearchDebounced, 200)();
    }

    function groupMembersSearchDebounced() {
        const D = groupDialog.value;
        const search = D.memberSearch;
        D.memberSearchResults = [];
        if (!search || search.length < 3) {
            return;
        }
        isGroupMembersLoading.value = true;
        groupRequest
            .getGroupMembersSearch({
                groupId: D.id,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                for (const json of args.json.results) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
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
                if (groupDialog.value.visible && groupDialog.value.id === args.groupId) {
                    updateGroupDialogData({
                        ...groupDialog.value,
                        ref: { ...groupDialog.value.ref, isRepresenting: args.params.isRepresenting }
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
            .then(() => {
                if (groupDialog.value.visible && groupDialog.value.id === id) {
                    getGroupDialogGroup(id);
                }
            });
    }
    function confirmDeleteGroupPost(post) {
        ElMessageBox.confirm('Are you sure you want to delete this post?', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    groupRequest
                        .deleteGroupPost({
                            groupId: post.groupId,
                            postId: post.id
                        })
                        .then((args) => {
                            const D = groupDialog.value;
                            if (D.id !== args.params.groupId) {
                                return;
                            }

                            const postId = args.params.postId;
                            // remove existing post
                            for (const item of D.posts) {
                                if (item.id === postId) {
                                    removeFromArray(D.posts, item);
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
                        });
                }
            })
            .catch(() => {});
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
        const D = groupDialog.value;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Share':
                copyToClipboard(groupDialog.value.ref.$url);
                break;
            case 'Create Post':
                showGroupPostEditDialog(groupDialog.value.id, null);
                break;
            case 'Moderation Tools':
                showGroupMemberModerationDialog(groupDialog.value.id);
                break;
            case 'Invite To Group':
                showInviteGroupDialog(D.id, '');
                break;
            case 'Refresh':
                showGroupDialog(D.id);
                break;
            case 'Leave Group':
                leaveGroupPrompt(D.id);
                break;
            case 'Block Group':
                blockGroup(D.id);
                break;
            case 'Unblock Group':
                unblockGroup(D.id);
                break;
            case 'Visibility Everyone':
                setGroupVisibility(D.id, 'visible');
                break;
            case 'Visibility Friends':
                setGroupVisibility(D.id, 'friends');
                break;
            case 'Visibility Hidden':
                setGroupVisibility(D.id, 'hidden');
                break;
            case 'Subscribe To Announcements':
                setGroupSubscription(D.id, true);
                break;
            case 'Unsubscribe To Announcements':
                setGroupSubscription(D.id, false);
                break;
        }
    }

    function blockGroup(groupId) {
        ElMessageBox.confirm('Are you sure you want to block this group?', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    groupRequest
                        .blockGroup({
                            groupId
                        })
                        .then((args) => {
                            if (groupDialog.value.visible && groupDialog.value.id === args.params.groupId) {
                                showGroupDialog(args.params.groupId);
                            }
                        });
                }
            })
            .catch(() => {});
    }

    function unblockGroup(groupId) {
        ElMessageBox.confirm('Are you sure you want to unblock this group?', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    groupRequest
                        .unblockGroup({
                            groupId,
                            userId: currentUser.value.id
                        })
                        .then((args) => {
                            if (groupDialog.value.visible && groupDialog.value.id === args.params.groupId) {
                                showGroupDialog(args.params.groupId);
                            }
                        });
                }
            })
            .catch(() => {});
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
                if (groupDialog.value.visible && groupDialog.value.id === id) {
                    updateGroupDialogData({
                        ...groupDialog.value,
                        inGroup: args.json.membershipStatus === 'member'
                    });
                    // groupDialog.value.inGroup = json.membershipStatus === 'member';
                    getGroupDialogGroup(id);
                }
                if (args.json.membershipStatus === 'member') {
                    toast.success('Group joined');
                } else if (args.json.membershipStatus === 'requested') {
                    toast.success('Group join request sent');
                }
                return args;
            });
    }

    function handleGroupDialogTab(tabName) {
        if (tabName === 'Members') {
            getGroupDialogGroupMembers();
        } else if (tabName === 'Photos') {
            getGroupGalleries();
        } else if (tabName === 'JSON') {
            refreshGroupDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleGroupDialogTab(groupDialogLastActiveTab.value);
    }

    function groupDialogTabClick(obj) {
        if (obj.props.name === groupDialogTabCurrentName.value) {
            return;
        }
        handleGroupDialogTab(obj.props.name);
        groupDialogTabCurrentName.value = obj.props.name;
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
        groupRequest.getCachedGroup({ groupId }).then((args) => {
            D.groupRef = args.ref;
        });
        D.visible = true;
    }

    async function getGroupDialogGroupMembers() {
        const D = groupDialog.value;
        D.members = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams.value = {
            sort: 'joinedAt:desc',
            roleId: '',
            n: 100,
            offset: 0,
            groupId: D.id
        };
        if (D.memberSortOrder.value) {
            loadMoreGroupMembersParams.value.sort = D.memberSortOrder.value;
        }
        if (D.memberFilter.id !== null) {
            loadMoreGroupMembersParams.value.roleId = D.memberFilter.id;
        }
        if (D.inGroup) {
            await groupRequest
                .getGroupMember({
                    groupId: D.id,
                    userId: currentUser.value.id
                })
                .then((args) => {
                    args.ref = applyGroupMember(args.json);
                    if (args.json) {
                        args.json.user = currentUser.value;
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
        const D = groupDialog.value;
        const params = loadMoreGroupMembersParams.value;
        if (params.roleId === '') {
            delete params.roleId;
        }
        D.memberSearch = '';
        isGroupMembersLoading.value = true;
        await groupRequest
            .getGroupMembers(params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (const json of args.json) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === currentUser.value.id) {
                        if (D.members.length > 0 && D.members[0].userId === currentUser.value.id) {
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

    async function getGroupGalleries() {
        updateGroupDialogData({ ...groupDialog.value, galleries: {} });
        groupDialogGalleryCurrentName.value = '0';
        isGroupGalleryLoading.value = true;
        for (let i = 0; i < groupDialog.value.ref.galleries.length; i++) {
            const gallery = groupDialog.value.ref.galleries[i];
            await getGroupGallery(groupDialog.value.id, gallery.id);
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
                    for (const json of args.json) {
                        if (groupDialog.value.id === json.groupId) {
                            if (!groupDialog.value.galleries[json.galleryId]) {
                                groupDialog.value.galleries[json.galleryId] = [];
                            }
                            groupDialog.value.galleries[json.galleryId].push(json);
                        }
                    }
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
        const D = groupDialog.value;
        const treeData = buildTreeData({
            group: D.ref,
            posts: D.posts,
            instances: D.instances,
            members: D.members,
            galleries: D.galleries
        });
        updateGroupDialogData({
            ...groupDialog.value,
            treeData
        });
    }

    async function loadAllGroupMembers() {
        if (isGroupMembersLoading.value) {
            return;
        }
        await getGroupDialogGroupMembers();
        while (groupDialog.value.visible && !isGroupMembersDone.value) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await loadMoreGroupMembers();
        }
    }

    async function setGroupMemberSortOrder(sortOrder) {
        const D = groupDialog.value;
        if (D.memberSortOrder.value === sortOrder) {
            return;
        }
        D.memberSortOrder = sortOrder;
        await getGroupDialogGroupMembers();
    }

    async function setGroupMemberFilter(filter) {
        const D = groupDialog.value;
        if (D.memberFilter === filter) {
            return;
        }
        D.memberFilter = filter;
        await getGroupDialogGroupMembers();
    }

    function updateGroupDialogData(obj) {
        groupDialog.value = {
            ...groupDialog.value,
            ...obj
        };
    }

    function updateFollowingCalendarData(event) {
        const calendar = groupDialog.value.calendar;
        for (let i = 0; i < calendar.length; i++) {
            if (calendar[i].id === event.id) {
                calendar[i] = {
                    ...calendar[i],
                    ...event
                };
                break;
            }
        }
    }
</script>
<style scoped>
    .time-group-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: visible;
    }
    .events-row {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        overflow: visible;
    }
</style>
