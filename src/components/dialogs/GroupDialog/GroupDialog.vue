<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ groupDialog.ref?.name || t('dialog.group.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ groupDialog.ref?.description || groupDialog.ref?.name || t('dialog.group.info.header') }}
            </DialogDescription>
        </DialogHeader>
        <div>
            <div style="display: flex">
                <img
                    :src="groupDialog.ref.iconUrl"
                    style="flex: none; width: 120px; height: 120px; border-radius: 12px"
                    class="cursor-pointer"
                    @click="showFullscreenImageDialog(groupDialog.ref.iconUrl)"
                    loading="lazy" />
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div class="group-header" style="flex: 1">
                        <span v-if="groupDialog.ref.ownerId === currentUser.id" style="margin-right: 5px">👑</span>
                        <span
                            class="font-bold"
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
                                class="cursor-pointer x-grey"
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
                                <Button
                                    class="rounded-full mr-2"
                                    variant="secondary"
                                    size="icon-lg"
                                    style="margin-left: 5px"
                                    @click="clearGroupRepresentation(groupDialog.id)">
                                    <BookmarkCheck />
                                </Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('dialog.group.actions.represent_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
                                        variant="outline"
                                        size="icon-lg"
                                        :disabled="groupDialog.ref.privacy === 'private'"
                                        @click="setGroupRepresentation(groupDialog.id)">
                                        <Bookmark />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'requested'">
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.cancel_join_request_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
                                        variant="outline"
                                        size="icon-lg"
                                        @click="cancelGroupRequest(groupDialog.id)">
                                        <X />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else-if="groupDialog.ref.myMember?.membershipStatus === 'invited'">
                            <TooltipWrapper side="top" :content="t('dialog.group.actions.pending_request_tooltip')">
                                <span>
                                    <Button
                                        class="rounded-full mr-2"
                                        variant="outline"
                                        size="icon-lg"
                                        @click="joinGroup(groupDialog.id)">
                                        <Check />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                        </template>
                        <template v-else>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'request'"
                                side="top"
                                :content="t('dialog.group.actions.request_join_tooltip')">
                                <Button
                                    class="rounded-full mr-2"
                                    variant="outline"
                                    size="icon-lg"
                                    @click="joinGroup(groupDialog.id)">
                                    <MessageSquare />
                                </Button>
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'invite'"
                                side="top"
                                :content="t('dialog.group.actions.invite_required_tooltip')">
                                <span>
                                    <Button class="rounded-full mr-2" variant="outline" size="icon-lg" disabled>
                                        <MessageSquare />
                                    </Button>
                                </span>
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="groupDialog.ref.joinState === 'open'"
                                side="top"
                                :content="t('dialog.group.actions.join_group_tooltip')">
                                <Button
                                    class="rounded-full mr-2"
                                    variant="outline"
                                    size="icon-lg"
                                    @click="joinGroup(groupDialog.id)">
                                    <Check />
                                </Button>
                            </TooltipWrapper>
                        </template>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button
                                    class="rounded-full"
                                    :variant="
                                        groupDialog.ref.membershipStatus === 'userblocked' ? 'destructive' : 'outline'
                                    "
                                    size="icon-lg">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="groupDialogCommand('Refresh')">
                                    <RefreshCw class="size-4" />
                                    {{ t('dialog.group.actions.refresh') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="groupDialogCommand('Share')">
                                    <Share2 class="size-4" />
                                    {{ t('dialog.group.actions.share') }}
                                </DropdownMenuItem>
                                <template v-if="groupDialog.inGroup">
                                    <template v-if="groupDialog.ref.myMember">
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            v-if="groupDialog.ref.myMember.isSubscribedToAnnouncements"
                                            @click="groupDialogCommand('Unsubscribe To Announcements')">
                                            <BellOff class="size-4" />
                                            {{ t('dialog.group.actions.unsubscribe') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            v-else
                                            @click="groupDialogCommand('Subscribe To Announcements')">
                                            <Bell class="size-4" />
                                            {{ t('dialog.group.actions.subscribe') }}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-invites-manage')"
                                            @click="groupDialogCommand('Invite To Group')">
                                            <MessageSquare class="size-4" />
                                            {{ t('dialog.group.actions.invite_to_group') }}
                                        </DropdownMenuItem>
                                        <template
                                            v-if="hasGroupPermission(groupDialog.ref, 'group-announcement-manage')">
                                            <DropdownMenuItem @click="groupDialogCommand('Create Post')">
                                                <Ticket class="size-4" />
                                                {{ t('dialog.group.actions.create_post') }}
                                            </DropdownMenuItem>
                                        </template>
                                        <DropdownMenuItem
                                            :disabled="!hasGroupModerationPermission(groupDialog.ref)"
                                            @click="groupDialogCommand('Moderation Tools')">
                                            <Settings class="size-4" />
                                            {{ t('dialog.group.actions.moderation_tools') }}
                                        </DropdownMenuItem>
                                        <template
                                            v-if="groupDialog.ref.myMember && groupDialog.ref.privacy === 'default'">
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Everyone')">
                                                <Eye class="size-4" />
                                                <Check
                                                    v-if="groupDialog.ref.myMember.visibility === 'visible'"
                                                    class="size-4" />
                                                {{ t('dialog.group.actions.visibility_everyone') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Friends')">
                                                <Eye class="size-4" />
                                                <Check
                                                    v-if="groupDialog.ref.myMember.visibility === 'friends'"
                                                    class="size-4" />
                                                {{ t('dialog.group.actions.visibility_friends') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="groupDialogCommand('Visibility Hidden')">
                                                <Eye class="size-4" />
                                                <Check
                                                    v-if="groupDialog.ref.myMember.visibility === 'hidden'"
                                                    class="size-4" />
                                                {{ t('dialog.group.actions.visibility_hidden') }}
                                            </DropdownMenuItem>
                                        </template>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            @click="groupDialogCommand('Leave Group')">
                                            <Trash2 class="size-4" />
                                            {{ t('dialog.group.actions.leave') }}
                                        </DropdownMenuItem>
                                    </template>
                                </template>
                                <template v-else>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        v-if="groupDialog.ref.membershipStatus === 'userblocked'"
                                        variant="destructive"
                                        @click="groupDialogCommand('Unblock Group')">
                                        <CheckCircle class="size-4" />
                                        {{ t('dialog.group.actions.unblock') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-else @click="groupDialogCommand('Block Group')">
                                        <XCircle class="size-4" />
                                        {{ t('dialog.group.actions.block') }}
                                    </DropdownMenuItem>
                                </template>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <TabsUnderline
                v-model="groupDialog.activeTab"
                :items="groupDialogTabs"
                :unmount-on-hide="false"
                @update:modelValue="groupDialogTabClick">
                <template #Info>
                    <div class="group-banner-image-info">
                        <img
                            :src="groupDialog.ref.bannerUrl"
                            class="cursor-pointer"
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
                            <div style="margin: 5px 0" class="flex items-center">
                                <Location :location="room.tag" class="text-sm" />
                                <InstanceActionBar
                                    class="ml-1"
                                    :location="room.tag"
                                    :currentlocation="lastLocation.location"
                                    :instance="room.ref"
                                    :friendcount="room.friendCount"
                                    :show-launch="false"
                                    refresh-tooltip="RefreshCw player count"
                                    :on-refresh="() => refreshInstancePlayerCount(room.tag)" />
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
                                            <Spinner class="inline-block mr-1" />
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
                                        class="cursor-pointer"
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
                                        <Eye style="margin-right: 5px" />
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
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                style="margin-left: 5px; padding: 0"
                                                @click="
                                                    showGroupPostEditDialog(groupDialog.id, groupDialog.announcement)
                                                "></Button>
                                        </TooltipWrapper>
                                        <TooltipWrapper side="top" :content="t('dialog.group.posts.delete_tooltip')">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                style="margin-left: 5px; padding: 0"
                                                @click="confirmDeleteGroupPost(groupDialog.announcement)"></Button>
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
                        <div class="x-friend-item" @click="showPreviousInstancesListDialog(groupDialog.ref)">
                            <div class="detail">
                                <div
                                    class="name"
                                    style="display: flex; justify-content: space-between; align-items: center">
                                    <span>
                                        {{ t('dialog.group.info.last_visited') }}
                                    </span>
                                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                        <MoreHorizontal style="margin-right: 16px" />
                                    </TooltipWrapper>
                                </div>
                                <span class="extra">{{ formatDateFilter(groupDialog.lastVisit, 'long') }}</span>
                            </div>
                        </div>
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
                        <div class="inline-flex justify-between w-full">
                            <div class="x-friend-item" style="cursor: default; width: 50%">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.group.info.url') }}</span>
                                    <span class="extra"
                                        >{{ groupDialog.ref.$url }}
                                        <TooltipWrapper side="top" :content="t('dialog.group.info.url_tooltip')">
                                            <Button
                                                class="rounded-full ml-1 text-xs"
                                                size="icon-sm"
                                                variant="outline"
                                                @click="copyToClipboard(groupDialog.ref.$url)"
                                                ><Copy class="h-4 w-4" />
                                            </Button> </TooltipWrapper
                                    ></span>
                                </div>
                            </div>
                            <div class="x-friend-item w-1/2" style="cursor: default; width: 50%">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.group.info.id') }}</span>
                                    <span class="extra"
                                        >{{ groupDialog.id }}
                                        <TooltipWrapper side="top" :content="t('dialog.group.info.id_tooltip')">
                                            <Button
                                                class="rounded-full ml-1 text-xs"
                                                size="icon-sm"
                                                variant="outline"
                                                @click="copyToClipboard(groupDialog.id)"
                                                ><Copy class="h-4 w-4" />
                                            </Button> </TooltipWrapper
                                    ></span>
                                </div>
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
                </template>
                <template #Posts>
                    <template v-if="groupDialog.visible">
                        <span style="margin-right: 10px; vertical-align: top"
                            >{{ t('dialog.group.posts.posts_count') }} {{ groupDialog.posts.length }}</span
                        >
                        <InputGroupField
                            v-model="groupDialog.postsSearch"
                            clearable
                            size="sm"
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
                                            class="cursor-pointer"
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
                                            <Eye style="margin-right: 5px" />
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
                                                <Button
                                                    size="icon-sm"
                                                    class="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                                                    variant="ghost"
                                                    @click="showGroupPostEditDialog(groupDialog.id, post)"
                                                    ><Pencil class="h-4 w-4" />
                                                </Button>
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                side="top"
                                                :content="t('dialog.group.posts.delete_tooltip')">
                                                <Button
                                                    size="icon-sm"
                                                    class="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                                                    variant="ghost"
                                                    @click="confirmDeleteGroupPost(post)"
                                                    ><Trash2 class="h-4 w-4" />
                                                </Button>
                                            </TooltipWrapper>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
                <template #Members>
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
                            <Button
                                class="rounded-full h-6 w-6"
                                variant="outline"
                                size="icon-sm"
                                :loading="isGroupMembersLoading"
                                circle
                                @click="loadAllGroupMembers">
                                <Spinner v-if="isGroupMembersLoading" /><RefreshCcw v-else
                            /></Button>
                            <Button
                                class="rounded-full h-6 w-6 ml-2"
                                size="icon-sm"
                                variant="outline"
                                style="margin-left: 5px"
                                @click="downloadAndSaveJson(`${groupDialog.id}_members`, groupDialog.members)">
                                <Download class="h-4 w-4" />
                            </Button>
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
                                style="float: right"
                                class="flex items-center">
                                <span style="margin-right: 5px">{{ t('dialog.group.members.sort_by') }}</span>
                                <Select
                                    v-model="groupDialogMemberSortValue"
                                    :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0">
                                    <SelectTrigger class="h-8 w-45 mr-1">
                                        <SelectValue :placeholder="t('dialog.group.members.sort_by')" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="item in groupDialogSortingOptions"
                                            :key="item.value"
                                            :value="item.value">
                                            {{ t(item.name) }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <span class="ml-2 mr-1">{{ t('dialog.group.members.filter') }}</span>
                                <div style="display: inline-block; width: 220px">
                                    <VirtualCombobox
                                        v-model="groupDialogMemberFilterKey"
                                        :groups="groupDialogMemberFilterGroups"
                                        :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0"
                                        :placeholder="t('dialog.group.members.filter')"
                                        :search-placeholder="t('dialog.group.members.search')"
                                        :clearable="false"
                                        :close-on-select="true">
                                        <template #trigger="{ text }">
                                            <span class="truncate">
                                                {{ text || t('dialog.group.members.filter') }}
                                            </span>
                                        </template>
                                    </VirtualCombobox>
                                </div>
                            </div>
                            <InputGroupField
                                v-model="groupDialog.memberSearch"
                                :disabled="!hasGroupPermission(groupDialog.ref, 'group-members-manage')"
                                clearable
                                size="sm"
                                :placeholder="t('dialog.group.members.search')"
                                style="margin-top: 10px; margin-bottom: 10px"
                                @input="groupMembersSearch" />
                        </div>
                        <div
                            v-if="groupDialog.memberSearch.length"
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
                                        v-text="user.user?.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <TooltipWrapper
                                                v-if="user.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <Tag style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <Eye style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                v-if="!user.isSubscribedToAnnouncements"
                                                side="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <MessageSquare style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                                <template #content>
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <Pencil style="margin-right: 5px" />
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
                                        v-text="user.user?.displayName" />
                                    <span class="extra">
                                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                                            <TooltipWrapper
                                                v-if="user.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <Tag style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ user.visibility }}</span
                                                    >
                                                </template>
                                                <Eye style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper
                                                v-if="!user.isSubscribedToAnnouncements"
                                                side="top"
                                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                                <MessageSquare style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                                <template #content>
                                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                                    <br />
                                                    <span>{{ user.managerNotes }}</span>
                                                </template>
                                                <Pencil style="margin-right: 5px" />
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
                                class="x-friend-item"
                                style="width: 100%; height: 45px; text-align: center"
                                @click="loadMoreGroupMembers">
                                <div v-if="!isGroupMembersLoading" class="detail">
                                    <span class="name">{{ t('dialog.group.members.load_more') }}</span>
                                </div>
                            </div>
                        </ul>
                    </template>
                </template>
                <template #Photos>
                    <Button
                        class="rounded-full"
                        variant="outline"
                        size="icon-sm"
                        :disabled="isGroupGalleryLoading"
                        @click="getGroupGalleries">
                        <Spinner v-if="isGroupGalleryLoading" />
                        <RefreshCw v-else />
                    </Button>
                    <TabsUnderline
                        v-model="groupDialogGalleryCurrentName"
                        :items="groupGalleryTabs"
                        :unmount-on-hide="false"
                        class="mt-2.5">
                        <template
                            v-for="(gallery, index) in groupDialog.ref.galleries"
                            :key="`label-${index}`"
                            v-slot:[`label-${index}`]>
                            <span style="font-weight: bold; font-size: 16px" v-text="gallery.name" />
                            <i class="x-status-icon" style="margin-left: 5px" :class="groupGalleryStatus(gallery)" />
                            <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                groupDialog.galleries[gallery.id] ? groupDialog.galleries[gallery.id].length : 0
                            }}</span>
                        </template>
                        <template
                            v-for="(gallery, index) in groupDialog.ref.galleries"
                            :key="`content-${index}`"
                            v-slot:[String(index)]>
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
                                <Card
                                    v-for="image in groupDialog.galleries[gallery.id]"
                                    :key="image.id"
                                    class="p-0 overflow-hidden transition-shadow hover:shadow-md">
                                    <img
                                        :src="image.imageUrl"
                                        :class="[' cursor-pointer', 'max-w-full', 'max-h-full']"
                                        @click="showFullscreenImageDialog(image.imageUrl)"
                                        loading="lazy" />
                                </Card>
                            </div>
                        </template>
                    </TabsUnderline>
                </template>
                <template #JSON>
                    <Button
                        class="rounded-full mr-2"
                        size="icon-sm"
                        variant="outline"
                        @click="refreshGroupDialogTreeData()">
                        <RefreshCw />
                    </Button>
                    <Button
                        class="rounded-full"
                        size="icon-sm"
                        variant="outline"
                        @click="downloadAndSaveJson(groupDialog.id, groupDialog.ref)">
                        <Download />
                    </Button>
                    <vue-json-pretty
                        :key="treeData?.group?.id"
                        :data="treeData"
                        :deep="2"
                        :theme="isDarkMode ? 'dark' : 'light'"
                        show-icon />
                </template>
            </TabsUnderline>
        </div>
        <GroupPostEditDialog :dialog-data="groupPostEditDialog" :selected-gallery-file="selectedGalleryFile" />
    </div>
</template>

<script setup>
    import {
        Bell,
        BellOff,
        Bookmark,
        BookmarkCheck,
        Check,
        CheckCircle,
        Copy,
        Download,
        Eye,
        MessageSquare,
        MoreHorizontal,
        Pencil,
        RefreshCw,
        Settings,
        Share2,
        Tag,
        Ticket,
        Trash2,
        X,
        XCircle
    } from 'lucide-vue-next';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, reactive, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { InputGroupField } from '@/components/ui/input-group';
    import { RefreshCcw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
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
    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useGroupStore,
        useInstanceStore,
        useLocationStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { groupDialogFilterOptions, groupDialogSortingOptions } from '../../../shared/constants';
    import { Badge } from '../../ui/badge';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { groupRequest } from '../../../api';

    import GroupCalendarEventCard from '../../../views/Tools/components/GroupCalendarEventCard.vue';
    import GroupPostEditDialog from './GroupPostEditDialog.vue';
    import InstanceActionBar from '../../InstanceActionBar.vue';

    import * as workerTimers from 'worker-timers';

    const { t } = useI18n();
    const groupDialogTabs = computed(() => [
        { value: 'Info', label: t('dialog.group.info.header') },
        { value: 'Posts', label: t('dialog.group.posts.header') },
        { value: 'Members', label: t('dialog.group.members.header') },
        { value: 'Photos', label: t('dialog.group.gallery.header') },
        { value: 'JSON', label: t('dialog.group.json.header') }
    ]);
    const groupGalleryTabs = computed(() =>
        (groupDialog.value?.ref?.galleries || []).map((gallery, index) => ({
            value: String(index),
            label: gallery?.name ?? ''
        }))
    );

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

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

    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());

    const isGroupMembersDone = ref(false);
    const isGroupMembersLoading = ref(false);
    const groupDialogGalleryCurrentName = ref('0');
    const groupDialogTabCurrentName = ref('0');
    const isGroupGalleryLoading = ref(false);
    const treeData = ref({});

    const groupDialogMemberSortValue = computed({
        get() {
            return groupDialog.value?.memberSortOrder?.value ?? '';
        },
        set(value) {
            const option = Object.values(groupDialogSortingOptions).find((item) => item.value === value);
            if (option) {
                setGroupMemberSortOrder(option);
            }
        }
    });

    const groupDialogMemberFilterKey = computed({
        get() {
            const filter = groupDialog.value?.memberFilter;
            if (!filter) return null;

            if (filter.id === null) return 'everyone';
            if (filter.id === '') return 'usersWithNoRole';
            return `role:${filter.id}`;
        },
        set(key) {
            if (!key) return;

            if (key === 'everyone') {
                setGroupMemberFilter(groupDialogFilterOptions.everyone);
                return;
            }
            if (key === 'usersWithNoRole') {
                setGroupMemberFilter(groupDialogFilterOptions.usersWithNoRole);
                return;
            }

            if (key.startsWith('role:')) {
                const roleId = key.slice('role:'.length);
                const role = groupDialog.value?.ref?.roles?.find((r) => r.id === roleId);
                if (role) {
                    setGroupMemberFilter(role);
                }
            }
        }
    });

    const groupDialogMemberFilterGroups = computed(() => {
        const filterItems = Object.values(groupDialogFilterOptions).map((item) => ({
            value: item.id === null ? 'everyone' : item.id === '' ? 'usersWithNoRole' : `role:${item.id}`,
            label: t(item.name),
            search: t(item.name)
        }));

        const roleItems = (groupDialog.value?.ref?.roles ?? [])
            .filter((role) => !role.defaultRole)
            .map((role) => ({
                value: `role:${role.id}`,
                label: role.name,
                search: role.name
            }));

        return [
            {
                key: 'filters',
                label: t('dialog.group.members.filter'),
                items: filterItems
            },
            {
                key: 'roles',
                label: 'Roles',
                items: roleItems
            }
        ].filter((group) => group.items.length);
    });
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

    function showPreviousInstancesListDialog(groupRef) {
        instanceStore.showPreviousInstancesListDialog('group', groupRef);
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
        modalStore
            .confirm({
                description: 'Are you sure you want to delete this post?',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
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
        modalStore
            .confirm({
                description: 'Are you sure you want to block this group?',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                groupRequest
                    .blockGroup({
                        groupId
                    })
                    .then((args) => {
                        if (groupDialog.value.visible && groupDialog.value.id === args.params.groupId) {
                            showGroupDialog(args.params.groupId);
                        }
                    });
            })
            .catch(() => {});
    }

    function unblockGroup(groupId) {
        modalStore
            .confirm({
                description: 'Are you sure you want to unblock this group?',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
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
        groupDialog.value.lastActiveTab = tabName;
        if (tabName === 'Members') {
            getGroupDialogGroupMembers();
        } else if (tabName === 'Photos') {
            getGroupGalleries();
        } else if (tabName === 'JSON') {
            refreshGroupDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleGroupDialogTab(groupDialog.value.lastActiveTab);
    }

    function groupDialogTabClick(tabName) {
        if (tabName === groupDialogTabCurrentName.value) {
            if (tabName === 'JSON') {
                refreshGroupDialogTreeData();
            }
            return;
        }
        handleGroupDialogTab(tabName);
        groupDialogTabCurrentName.value = tabName;
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
        treeData.value = {
            group: formatJsonVars(D.ref),
            posts: D.posts,
            instances: D.instances,
            members: D.members,
            galleries: D.galleries
        };
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
        overflow-y: auto;
        max-height: 360px;
        padding: 9px 0;
    }
</style>
