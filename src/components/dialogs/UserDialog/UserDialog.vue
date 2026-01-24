<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{
                userDialog.ref?.displayName || userDialog.id || t('dialog.user.info.header')
            }}</DialogTitle>
            <DialogDescription>{{ getUserStateText(userDialog.ref || {}) }}</DialogDescription>
        </DialogHeader>
        <UserSummaryHeader
            :get-user-state-text="getUserStateText"
            :copy-user-display-name="copyUserDisplayName"
            :toggle-badge-visibility="toggleBadgeVisibility"
            :toggle-badge-showcased="toggleBadgeShowcased"
            :user-dialog-command="userDialogCommand" />

        <TabsUnderline
            v-model="userDialog.activeTab"
            :items="userDialogTabs"
            :unmount-on-hide="false"
            @update:modelValue="userDialogTabClick">
            <template #Info>
                <template v-if="isFriendOnline(userDialog.friend) || currentUser.id === userDialog.id">
                    <div
                        v-if="userDialog.ref.location"
                        style="
                            display: flex;
                            flex-direction: column;
                            margin-bottom: 10px;
                            padding-bottom: 10px;
                            border-bottom: 1px solid #e4e7ed14;
                        ">
                        <div style="flex: none">
                            <template v-if="isRealInstance(userDialog.$location.tag)">
                                <InstanceActionBar
                                    class="mb-1"
                                    :location="userDialog.$location.tag"
                                    :shortname="userDialog.$location.shortName"
                                    :currentlocation="lastLocation.location"
                                    :instance="userDialog.instance.ref"
                                    :friendcount="userDialog.instance.friendCount"
                                    :refresh-tooltip="t('dialog.user.info.refresh_instance_info')"
                                    :on-refresh="() => refreshInstancePlayerCount(userDialog.$location.tag)" />
                            </template>
                            <Location
                                class="text-sm"
                                :location="userDialog.ref.location"
                                :traveling="userDialog.ref.travelingToLocation" />
                        </div>
                        <div class="x-friend-list" style="flex: 1; margin-top: 10px; max-height: 150px">
                            <div
                                v-if="userDialog.$location.userId"
                                class="x-friend-item x-friend-item-border"
                                @click="showUserDialog(userDialog.$location.userId)">
                                <template v-if="userDialog.$location.user">
                                    <div class="avatar" :class="userStatusClass(userDialog.$location.user)">
                                        <img :src="userImage(userDialog.$location.user, true)" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span
                                            class="name"
                                            :style="{ color: userDialog.$location.user.$userColour }"
                                            v-text="userDialog.$location.user.displayName"></span>
                                        <span class="extra">{{ t('dialog.user.info.instance_creator') }}</span>
                                    </div>
                                </template>
                                <span v-else v-text="userDialog.$location.userId"></span>
                            </div>
                            <div
                                v-for="user in userDialog.users"
                                :key="user.id"
                                class="x-friend-item x-friend-item-border"
                                @click="showUserDialog(user.id)">
                                <div class="avatar" :class="userStatusClass(user)">
                                    <img :src="userImage(user, true)" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span
                                        class="name"
                                        :style="{ color: user.$userColour }"
                                        v-text="user.displayName"></span>
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
                </template>

                <div class="x-friend-list" style="max-height: none">
                    <div
                        v-if="userDialog.note && !hideUserNotes"
                        class="x-friend-item"
                        style="width: 100%; cursor: pointer">
                        <div class="detail" @click="isEditNoteAndMemoDialogVisible = true">
                            <span class="name">{{ t('dialog.user.info.note') }}</span>
                            <pre
                                class="extra"
                                style="
                                    font-family: inherit;
                                    font-size: 12px;
                                    white-space: pre-wrap;
                                    margin: 0 0.5em 0 0;
                                    max-height: 210px;
                                    overflow-y: auto;
                                "
                                >{{ userDialog.note }}</pre
                            >
                        </div>
                    </div>
                    <div
                        v-if="userDialog.memo && !hideUserMemos"
                        class="x-friend-item"
                        style="width: 100%; cursor: pointer">
                        <div class="detail" @click="isEditNoteAndMemoDialogVisible = true">
                            <span class="name">{{ t('dialog.user.info.memo') }}</span>
                            <pre
                                class="extra"
                                style="
                                    font-family: inherit;
                                    font-size: 12px;
                                    white-space: pre-wrap;
                                    margin: 0 0.5em 0 0;
                                    max-height: 210px;
                                    overflow-y: auto;
                                "
                                >{{ userDialog.memo }}</pre
                            >
                        </div>
                    </div>
                    <div class="x-friend-item" style="width: 100%; cursor: default">
                        <div class="detail">
                            <span class="name">
                                {{
                                    userDialog.id !== currentUser.id &&
                                    userDialog.ref.profilePicOverride &&
                                    userDialog.ref.currentAvatarImageUrl
                                        ? t('dialog.user.info.avatar_info_last_seen')
                                        : t('dialog.user.info.avatar_info')
                                }}
                                <TooltipWrapper
                                    v-if="userDialog.ref.profilePicOverride && !userDialog.ref.currentAvatarImageUrl"
                                    side="top"
                                    :content="t('dialog.user.info.vrcplus_hides_avatar')">
                                    <Info />
                                </TooltipWrapper>
                            </span>
                            <div class="extra">
                                <AvatarInfo
                                    :imageurl="userDialog.ref.currentAvatarImageUrl"
                                    :userid="userDialog.id"
                                    :avatartags="userDialog.ref.currentAvatarTags"
                                    style="display: inline-block" />
                            </div>
                        </div>
                    </div>
                    <div class="x-friend-item" style="width: 100%; cursor: default">
                        <div class="detail">
                            <span class="name" style="margin-bottom: 5px">{{
                                t('dialog.user.info.represented_group')
                            }}</span>
                            <div
                                v-if="
                                    userDialog.isRepresentedGroupLoading ||
                                    (userDialog.representedGroup && userDialog.representedGroup.isRepresenting)
                                "
                                class="extra">
                                <div style="display: inline-block; flex: none; margin-right: 5px">
                                    <Avatar
                                        class="cursor-pointer size-15! rounded-lg!"
                                        :style="{
                                            background: userDialog.isRepresentedGroupLoading ? '#f5f7fa' : ''
                                        }"
                                        @click="showFullscreenImageDialog(userDialog.representedGroup.iconUrl)">
                                        <AvatarImage
                                            :src="userDialog.representedGroup.$thumbnailUrl"
                                            @load="userDialog.isRepresentedGroupLoading = false"
                                            @error="userDialog.isRepresentedGroupLoading = false" />
                                        <AvatarFallback class="rounded-lg!" />
                                    </Avatar>
                                </div>
                                <span
                                    v-if="userDialog.representedGroup.isRepresenting"
                                    style="vertical-align: top; cursor: pointer"
                                    @click="showGroupDialog(userDialog.representedGroup.groupId)">
                                    <span
                                        v-if="userDialog.representedGroup.ownerId === userDialog.id"
                                        style="margin-right: 5px"
                                        >👑</span
                                    >
                                    <span style="margin-right: 5px" v-text="userDialog.representedGroup.name"></span>
                                    <span>({{ userDialog.representedGroup.memberCount }})</span>
                                </span>
                            </div>
                            <div v-else class="extra">-</div>
                        </div>
                    </div>
                    <div class="x-friend-item" style="width: 100%; cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.user.info.bio') }}</span>
                            <pre
                                class="extra truncate"
                                style="
                                    font-family: inherit;
                                    font-size: 12px;
                                    white-space: pre-wrap;
                                    margin: 0 0.5em 0 0;
                                    max-height: 210px;
                                    overflow-y: auto;
                                "
                                >{{ bioCache.translated || userDialog.ref.bio || '-' }}</pre
                            >
                            <div style="float: right">
                                <Button
                                    v-if="translationApi && userDialog.ref.bio"
                                    class="w-3 h-6 text-xs mr-0.5"
                                    size="icon-sm"
                                    variant="ghost"
                                    @click="translateBio">
                                    <Spinner v-if="translateLoading" class="size-1" />
                                    <Languages v-else class="h-3 w-3" />
                                </Button>
                                <Button
                                    class="w-3 h-6 text-xs"
                                    size="icon-sm"
                                    variant="ghost"
                                    v-if="userDialog.id === currentUser.id"
                                    style="margin-left: 5px; padding: 0"
                                    @click="showBioDialog"
                                    ><Pencil class="h-3 w-3" />
                                </Button>
                            </div>
                            <div style="margin-top: 5px" class="flex items-center">
                                <TooltipWrapper v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
                                    <template #content>
                                        <span v-text="link"></span>
                                    </template>
                                    <!-- onerror="this.onerror=null;this.class='icon-error'" -->
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
                            </div>
                        </div>
                    </div>
                    <template v-if="currentUser.id !== userDialog.id">
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.user.info.last_seen') }}
                                </span>
                                <span class="extra">{{ formatDateFilter(userDialog.lastSeen, 'long') }}</span>
                            </div>
                        </div>

                        <div class="x-friend-item" @click="showPreviousInstancesListDialog(userDialog.ref)">
                            <div class="detail">
                                <div
                                    class="name"
                                    style="display: flex; justify-content: space-between; align-items: center">
                                    <div>
                                        {{ t('dialog.user.info.join_count') }}
                                    </div>

                                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                        <MoreHorizontal style="margin-right: 16px" />
                                    </TooltipWrapper>
                                </div>
                                <span v-if="userDialog.joinCount === 0" class="extra">-</span>
                                <span v-else class="extra" v-text="userDialog.joinCount"></span>
                            </div>
                        </div>

                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.user.info.time_together') }}
                                </span>
                                <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <TooltipWrapper
                            :disabled="currentUser.id !== userDialog.id"
                            side="top"
                            :content="t('dialog.user.info.open_previous_instance')">
                            <div class="x-friend-item" @click="showPreviousInstancesListDialog(userDialog.ref)">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.user.info.play_time') }}
                                    </span>
                                    <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                    <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                                </div>
                            </div>
                        </TooltipWrapper>
                    </template>
                    <div class="x-friend-item" style="cursor: default">
                        <TooltipWrapper :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                            <template #content>
                                <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'short') }}</span>
                            </template>
                            <div class="detail">
                                <span
                                    v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for"
                                    class="name">
                                    {{ t('dialog.user.info.online_for') }}
                                </span>
                                <span v-else class="name">
                                    {{ t('dialog.user.info.offline_for') }}
                                </span>
                                <span class="extra">{{ userOnlineFor(userDialog.ref) }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <TooltipWrapper :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                            <template #content>
                                <span
                                    >{{ t('dialog.user.info.last_login') }}
                                    {{ formatDateFilter(userDialog.ref.last_login, 'long') }}</span
                                >
                                <br />
                                <span
                                    >{{ t('dialog.user.info.last_activity') }}
                                    {{ formatDateFilter(userDialog.ref.last_activity, 'long') }}</span
                                >
                            </template>
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.last_activity') }}</span>
                                <span v-if="userDialog.ref.last_activity" class="extra">{{
                                    timeToText(Date.now() - Date.parse(userDialog.ref.last_activity))
                                }}</span>
                                <span v-else class="extra">-</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.user.info.date_joined') }}</span>
                            <span class="extra" v-text="userDialog.ref.date_joined"></span>
                        </div>
                    </div>
                    <div v-if="currentUser.id !== userDialog.id" class="x-friend-item" style="cursor: default">
                        <TooltipWrapper side="top" :disabled="!userDialog.dateFriendedInfo.length">
                            <template v-if="userDialog.dateFriendedInfo.length" #content>
                                <template v-for="ref in userDialog.dateFriendedInfo" :key="ref.type">
                                    <span>{{ ref.type }}: {{ formatDateFilter(ref.created_at, 'long') }}</span
                                    ><br />
                                </template>
                            </template>
                            <div class="detail">
                                <span v-if="userDialog.unFriended" class="name">
                                    {{ t('dialog.user.info.unfriended') }}
                                </span>
                                <span v-else class="name">
                                    {{ t('dialog.user.info.friended') }}
                                </span>
                                <span class="extra">{{ formatDateFilter(userDialog.dateFriended, 'long') }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <template v-if="currentUser.id === userDialog.id">
                        <div class="x-friend-item" @click="toggleAvatarCopying">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.avatar_cloning') }}</span>
                                <span v-if="currentUser.allowAvatarCopying" class="extra">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="extra">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" @click="toggleAllowBooping">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.booping') }}</span>
                                <span v-if="currentUser.isBoopingEnabled" class="extra">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="extra">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" @click="toggleSharedConnectionsOptOut">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.show_mutual_friends') }}</span>
                                <span v-if="!currentUser.hasSharedConnectionsOptOut" class="extra">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="extra">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.avatar_cloning') }}</span>
                                <span v-if="userDialog.ref.allowAvatarCopying" class="extra">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="extra">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                            </div>
                        </div>
                    </template>
                    <div v-if="userDialog.ref.id === currentUser.id" class="x-friend-item" @click="getVRChatCredits()">
                        <div class="detail">
                            <span class="name">{{ t('view.profile.profile.vrchat_credits') }}</span>
                            <span class="extra">{{ vrchatCredit ?? t('view.profile.profile.refresh') }}</span>
                        </div>
                    </div>
                    <div
                        v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
                        class="x-friend-item"
                        style="width: 100%"
                        @click="showWorldDialog(currentUser.homeLocation)">
                        <div class="detail">
                            <span class="name">{{ t('dialog.user.info.home_location') }}</span>
                            <span class="extra">
                                <span v-text="userDialog.$homeLocationName"></span>
                                <Button
                                    class="rounded-full ml-1 text-xs"
                                    size="icon-sm"
                                    variant="outline"
                                    @click.stop="resetHome()"
                                    ><Trash2 class="h-4 w-4" />
                                </Button>
                            </span>
                        </div>
                    </div>
                    <div class="x-friend-item" style="width: 100%; cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.user.info.id') }}</span>
                            <span class="extra">
                                {{ userDialog.id }}
                                <TooltipWrapper side="top" :content="t('dialog.user.info.id_tooltip')">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button
                                                class="rounded-full ml-1 text-xs"
                                                size="icon-sm"
                                                variant="outline"
                                                @click.stop
                                                ><Copy class="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem @click="copyUserId(userDialog.id)">
                                                {{ t('dialog.user.info.copy_id') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="copyUserURL(userDialog.id)">
                                                {{ t('dialog.user.info.copy_url') }}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem @click="copyUserDisplayName(userDialog.ref.displayName)">
                                                {{ t('dialog.user.info.copy_display_name') }}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TooltipWrapper>
                            </span>
                        </div>
                    </div>
                </div>
            </template>

            <template v-if="userDialog.id !== currentUser.id && !currentUser.hasSharedConnectionsOptOut" #mutual>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div style="display: flex; align-items: center">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="userDialog.isMutualFriendsLoading"
                            @click="getUserMutualFriends(userDialog.id)">
                            <Spinner v-if="userDialog.isMutualFriendsLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="margin-left: 5px">{{
                            t('dialog.user.groups.total_count', { count: userDialog.mutualFriends.length })
                        }}</span>
                    </div>
                    <div style="display: flex; align-items: center">
                        <span style="margin-right: 5px">{{ t('dialog.user.groups.sort_by') }}</span>
                        <Select
                            :model-value="userDialogMutualFriendSortingKey"
                            :disabled="userDialog.isMutualFriendsLoading"
                            @update:modelValue="setUserDialogMutualFriendSortingByKey">
                            <SelectTrigger size="sm" @click.stop>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="(item, key) in userDialogMutualFriendSortingOptions"
                                    :key="String(key)"
                                    :value="String(key)">
                                    {{ t(item.name) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div
                    v-if="mutualFriendsError"
                    @click="openExternalLink('https://docs.vrchat.com/docs/vrchat-202542#mutuals')"
                    style="
                        margin-top: 20px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: #f56c6c;
                        cursor: pointer;
                    ">
                    <AlertTriangle style="margin-right: 5px" />
                    <span>Mutual Friends unavailable due to VRChat staged rollout, click for more info</span>
                </div>
                <ul class="x-friend-list" style="margin-top: 10px; overflow: auto; max-height: 250px; min-width: 130px">
                    <li
                        v-for="user in userDialog.mutualFriends"
                        :key="user.id"
                        class="x-friend-item x-friend-item-border"
                        @click="showUserDialog(user.id)">
                        <div class="avatar">
                            <img :src="userImage(user)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" :style="{ color: user.$userColour }" v-text="user.displayName"></span>
                        </div>
                    </li>
                </ul>
            </template>

            <template #Groups>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div style="display: flex; align-items: center">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="userDialog.isGroupsLoading"
                            @click="getUserGroups(userDialog.id)">
                            <Spinner v-if="userDialog.isGroupsLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="margin-left: 5px">{{
                            t('dialog.user.groups.total_count', { count: userGroups.groups.length })
                        }}</span>
                        <template v-if="userDialogGroupEditMode">
                            <span
                                style="
                                    margin-left: 10px;

                                    font-size: 10px;
                                "
                                >{{ t('dialog.user.groups.hold_shift') }}</span
                            >
                        </template>
                    </div>
                    <div style="display: flex; align-items: center">
                        <template v-if="!userDialogGroupEditMode">
                            <span style="margin-right: 5px">{{ t('dialog.user.groups.sort_by') }}</span>
                            <Select
                                :model-value="userDialogGroupSortingKey"
                                :disabled="userDialog.isGroupsLoading"
                                @update:modelValue="setUserDialogGroupSortingByKey">
                                <SelectTrigger size="sm" @click.stop>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        v-for="(item, key) in userDialogGroupSortingOptions"
                                        :key="String(key)"
                                        :value="String(key)"
                                        :disabled="
                                            item === userDialogGroupSortingOptions.inGame &&
                                            userDialog.id !== currentUser.id
                                        ">
                                        {{ t(item.name) }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </template>
                        <Button
                            variant="outline"
                            size="sm"
                            v-if="userDialogGroupEditMode"
                            @click="exitEditModeCurrentUserGroups">
                            {{ t('dialog.user.groups.exit_edit_mode') }}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            v-else-if="currentUser.id === userDialog.id"
                            class="ml-2"
                            @click="editModeCurrentUserGroups">
                            {{ t('dialog.user.groups.edit_mode') }}
                        </Button>
                    </div>
                </div>
                <div style="margin-top: 10px">
                    <template v-if="userDialogGroupEditMode">
                        <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; max-height: unset">
                            <!-- Bulk actions dropdown (shown only in edit mode) -->
                            <Select :model-value="bulkGroupActionValue" @update:modelValue="handleBulkGroupAction">
                                <SelectTrigger size="sm" style="margin-right: 5px; margin-bottom: 5px" @click.stop>
                                    <SelectValue :placeholder="t('dialog.group.actions.manage_selected')" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="visibility:visible">
                                        {{ t('dialog.group.actions.visibility_everyone') }}
                                    </SelectItem>
                                    <SelectItem value="visibility:friends">
                                        {{ t('dialog.group.actions.visibility_friends') }}
                                    </SelectItem>
                                    <SelectItem value="visibility:hidden">
                                        {{ t('dialog.group.actions.visibility_hidden') }}
                                    </SelectItem>
                                    <SelectItem value="leave">
                                        {{ t('dialog.user.groups.leave_group_tooltip') }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <!-- Select All button -->
                            <Button
                                size="sm"
                                variant="outline"
                                style="padding: 7px 15px; margin-bottom: 5px"
                                @click="selectAllGroups">
                                {{
                                    userDialogGroupAllSelected
                                        ? t('dialog.group.actions.deselect_all')
                                        : t('dialog.group.actions.select_all')
                                }}
                            </Button>

                            <div
                                v-for="group in userDialogGroupEditGroups"
                                :key="group.id"
                                class="x-friend-item x-friend-item-border"
                                style="width: 100%"
                                @click="showGroupDialog(group.id)">
                                <!-- Manual checkbox -->
                                <div
                                    style="
                                        margin-left: 5px;
                                        margin-right: 5px;
                                        transform: scale(0.8);
                                        transform-origin: left center;
                                    "
                                    @click.stop>
                                    <Checkbox
                                        :model-value="userDialogGroupEditSelectedGroupIds.includes(group.id)"
                                        @update:modelValue="() => toggleGroupSelection(group.id)" />
                                </div>

                                <div style="margin-right: 3px; margin-left: 5px" @click.stop>
                                    <Button
                                        size="icon-sm"
                                        variant="outline"
                                        style="
                                            display: block;
                                            padding: 7px;
                                            font-size: 9px;
                                            margin-left: 0;
                                            rotate: 180deg;
                                        "
                                        @click="moveGroupTop(group.id)">
                                        <DownloadIcon />
                                    </Button>
                                    <Button
                                        size="icon-sm"
                                        variant="outline"
                                        style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                        @click="moveGroupBottom(group.id)">
                                        <DownloadIcon />
                                    </Button>
                                </div>
                                <div style="margin-right: 10px" @click.stop>
                                    <Button
                                        size="icon-sm"
                                        variant="outline"
                                        style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                        @click="moveGroupUp(group.id)">
                                        <ArrowUp />
                                    </Button>
                                    <Button
                                        size="icon-sm"
                                        variant="outline"
                                        style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                        @click="moveGroupDown(group.id)">
                                        <ArrowDown />
                                    </Button>
                                </div>
                                <div class="avatar">
                                    <img :src="group.iconUrl" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span class="name" v-text="group.name"></span>
                                    <span class="extra">
                                        <TooltipWrapper
                                            v-if="group.isRepresenting"
                                            side="top"
                                            :content="t('dialog.group.members.representing')">
                                            <Tag style="margin-right: 5px" />
                                        </TooltipWrapper>
                                        <TooltipWrapper v-if="group.myMember?.visibility !== 'visible'" side="top">
                                            <template #content>
                                                <span
                                                    >{{ t('dialog.group.members.visibility') }}
                                                    {{ group.myMember.visibility }}</span
                                                >
                                            </template>
                                            <Eye style="margin-right: 5px" />
                                        </TooltipWrapper>
                                        <span>({{ group.memberCount }})</span>
                                    </span>
                                </div>
                                <Select
                                    v-if="group.myMember?.visibility"
                                    :model-value="group.myMember.visibility"
                                    :disabled="group.privacy !== 'default'"
                                    @update:modelValue="(value) => setGroupVisibility(group.id, value)">
                                    <SelectTrigger size="sm" @click.stop>
                                        <SelectValue
                                            :placeholder="
                                                group.myMember.visibility === 'visible'
                                                    ? t('dialog.group.tags.visible')
                                                    : group.myMember.visibility === 'friends'
                                                      ? t('dialog.group.tags.friends')
                                                      : group.myMember.visibility === 'hidden'
                                                        ? t('dialog.group.tags.hidden')
                                                        : group.myMember.visibility
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="visible">
                                            {{ t('dialog.group.actions.visibility_everyone') }}
                                        </SelectItem>
                                        <SelectItem value="friends">
                                            {{ t('dialog.group.actions.visibility_friends') }}
                                        </SelectItem>
                                        <SelectItem value="hidden">
                                            {{ t('dialog.group.actions.visibility_hidden') }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <!--//- JSON is missing isSubscribedToAnnouncements, can't be implemented-->
                                <!-- <Button size="sm" variant="outline"
                                        @click.stop="
                                            setGroupSubscription(group.id, !group.myMember.isSubscribedToAnnouncements)
                                        ">
                                        <span v-if="group.myMember.isSubscribedToAnnouncements"
                                            ><BellOff style="margin-left: 5px" />
                                            {{ t('dialog.group.tags.subscribed') }}</span
                                        >
                                        <span v-else
                                            ><Bell style="margin-left: 5px" />
                                            {{ t('dialog.group.tags.unsubscribed') }}</span
                                        >
                                    </Button> -->
                                <TooltipWrapper side="right" :content="t('dialog.user.groups.leave_group_tooltip')">
                                    <Button
                                        class="rounded-full h-6 w-6"
                                        size="icon-sm"
                                        variant="outline"
                                        v-if="shiftHeld"
                                        style="margin-left: 5px"
                                        @click.stop="leaveGroup(group.id)">
                                        <LogOut />
                                    </Button>
                                    <Button
                                        class="rounded-full h-6 w-6 text-red-600"
                                        size="icon-sm"
                                        variant="outline"
                                        v-else
                                        style="margin-left: 5px"
                                        @click.stop="leaveGroupPrompt(group.id)">
                                        <LogOut />
                                    </Button>
                                </TooltipWrapper>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <template v-if="userGroups.ownGroups.length > 0">
                            <span style="font-weight: bold; font-size: 16px">{{
                                t('dialog.user.groups.own_groups')
                            }}</span>
                            <span style="font-size: 12px; margin-left: 5px"
                                >{{ userGroups.ownGroups.length }}/{{
                                    cachedConfig?.constants?.GROUPS?.MAX_OWNED
                                }}</span
                            >
                            <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                <div
                                    v-for="group in userGroups.ownGroups"
                                    :key="group.id"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showGroupDialog(group.id)">
                                    <div class="avatar">
                                        <img :src="group.iconUrl" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <span class="extra inline-flex! items-center">
                                            <TooltipWrapper
                                                v-if="group.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <Tag style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ group.memberVisibility }}</span
                                                    >
                                                </template>
                                                <Eye style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <span>({{ group.memberCount }})</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-if="userGroups.mutualGroups.length > 0">
                            <span style="font-weight: bold; font-size: 16px">{{
                                t('dialog.user.groups.mutual_groups')
                            }}</span>
                            <span style="font-size: 12px; margin-left: 5px">{{ userGroups.mutualGroups.length }}</span>
                            <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                <div
                                    v-for="group in userGroups.mutualGroups"
                                    :key="group.id"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showGroupDialog(group.id)">
                                    <div class="avatar">
                                        <img :src="group.iconUrl" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <span class="extra inline-flex! items-center">
                                            <TooltipWrapper
                                                v-if="group.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <Tag style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ group.memberVisibility }}</span
                                                    >
                                                </template>
                                                <Eye style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <span>({{ group.memberCount }})</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-if="userGroups.remainingGroups.length > 0">
                            <span style="font-weight: bold; font-size: 16px">{{ t('dialog.user.groups.groups') }}</span>
                            <span style="font-size: 12px; margin-left: 5px">
                                {{ userGroups.remainingGroups.length }}
                                <template v-if="currentUser.id === userDialog.id">
                                    /
                                    <template v-if="isLocalUserVrcPlusSupporter">
                                        {{ cachedConfig?.constants?.GROUPS?.MAX_JOINED_PLUS }}
                                    </template>
                                    <template v-else>
                                        {{ cachedConfig?.constants?.GROUPS?.MAX_JOINED }}
                                    </template>
                                </template>
                            </span>
                            <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
                                <div
                                    v-for="group in userGroups.remainingGroups"
                                    :key="group.id"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showGroupDialog(group.id)">
                                    <div class="avatar">
                                        <img :src="group.iconUrl" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <div class="extra inline-flex! items-center">
                                            <TooltipWrapper
                                                v-if="group.isRepresenting"
                                                side="top"
                                                :content="t('dialog.group.members.representing')">
                                                <Tag style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ group.memberVisibility }}</span
                                                    >
                                                </template>
                                                <Eye style="margin-right: 5px" />
                                            </TooltipWrapper>
                                            <span>({{ group.memberCount }})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </template>

            <template #Worlds>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div style="display: flex; align-items: center">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="userDialog.isWorldsLoading"
                            @click="refreshUserDialogWorlds()">
                            <Spinner v-if="userDialog.isWorldsLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="margin-left: 5px">{{
                            t('dialog.user.worlds.total_count', { count: userDialog.worlds.length })
                        }}</span>
                    </div>
                    <div style="display: flex; align-items: center">
                        <span class="mr-1">{{ t('dialog.user.worlds.sort_by') }}</span>
                        <Select
                            :model-value="userDialogWorldSortingKey"
                            :disabled="userDialog.isWorldsLoading"
                            @update:modelValue="setUserDialogWorldSortingByKey">
                            <SelectTrigger size="sm" @click.stop>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="(item, key) in userDialogWorldSortingOptions"
                                    :key="String(key)"
                                    :value="String(key)">
                                    {{ t(item.name) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <span class="ml-2 mr-1">{{ t('dialog.user.worlds.order_by') }}</span>
                        <Select
                            :model-value="userDialogWorldOrderKey"
                            :disabled="userDialog.isWorldsLoading"
                            @update:modelValue="setUserDialogWorldOrderByKey">
                            <SelectTrigger size="sm" @click.stop>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="(item, key) in userDialogWorldOrderOptions"
                                    :key="String(key)"
                                    :value="String(key)">
                                    {{ t(item.name) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div class="x-friend-list" style="margin-top: 10px; min-height: 60px">
                    <template v-if="userDialog.worlds.length">
                        <div
                            v-for="world in userDialog.worlds"
                            :key="world.id"
                            class="x-friend-item x-friend-item-border"
                            @click="showWorldDialog(world.id)">
                            <div class="avatar">
                                <img :src="world.thumbnailImageUrl" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="world.name"></span>
                                <span v-if="world.occupants" class="extra">({{ world.occupants }})</span>
                            </div>
                        </div>
                    </template>
                    <div
                        v-else-if="!userDialog.isWorldsLoading"
                        style="
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 120px;
                            width: 100%;
                        ">
                        <DataTableEmpty type="nodata" />
                    </div>
                </div>
            </template>

            <template #favorite-worlds>
                <!-- <Button
                        variant="outline"
                        v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0"
                        type="default"
                        :loading="userDialog.isFavoriteWorldsLoading"
                        size="small"
                        :icon="RefreshCw"
                        circle
                        style="position: absolute; right: 15px; bottom: 15px; z-index: 99"
                        @click="getUserFavoriteWorlds(userDialog.id)">
                    </Button> -->
                <template v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0">
                    <TabsUnderline
                        v-model="favoriteWorldsTab"
                        :items="favoriteWorldTabs"
                        :unmount-on-hide="false"
                        class="zero-margin-tabs"
                        style="margin-top: 10px; height: 50vh">
                        <template
                            v-for="(list, index) in userFavoriteWorlds"
                            :key="`favorite-worlds-label-${index}`"
                            v-slot:[`label-${index}`]>
                            <span>
                                <i
                                    class="x-status-icon"
                                    style="margin-right: 6px"
                                    :class="userFavoriteWorldsStatus(list[1])">
                                </i>
                                <span style="font-weight: bold; font-size: 14px" v-text="list[0]"></span>
                                <span style="font-size: 10px; margin-left: 5px"
                                    >{{ list[2].length }}/{{ favoriteLimits.maxFavoritesPerGroup.world }}</span
                                >
                            </span>
                        </template>
                        <template
                            v-for="(list, index) in userFavoriteWorlds"
                            :key="`favorite-worlds-content-${index}`"
                            v-slot:[String(index)]>
                            <div
                                class="x-friend-list"
                                style="margin-top: 10px; margin-bottom: 15px; min-height: 60px; max-height: none">
                                <div
                                    v-for="world in list[2]"
                                    :key="world.favoriteId"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showWorldDialog(world.id)">
                                    <div class="avatar">
                                        <img :src="world.thumbnailImageUrl" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="world.name"></span>
                                        <span v-if="world.occupants" class="extra">({{ world.occupants }})</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </TabsUnderline>
                </template>
                <template v-else-if="!userDialog.isFavoriteWorldsLoading">
                    <div style="display: flex; justify-content: center; align-items: center; height: 100%">
                        <DataTableEmpty type="nodata" />
                    </div>
                </template>
            </template>

            <template #Avatars>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div style="display: flex; align-items: center">
                        <Button
                            v-if="userDialog.ref.id === currentUser.id"
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="userDialog.isAvatarsLoading"
                            @click="refreshUserDialogAvatars()">
                            <Spinner v-if="userDialog.isAvatarsLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <Button
                            v-else
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="userDialog.isAvatarsLoading"
                            @click="setUserDialogAvatarsRemote(userDialog.id)">
                            <Spinner v-if="userDialog.isAvatarsLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="margin-left: 5px">{{
                            t('dialog.user.avatars.total_count', { count: userDialogAvatars.length })
                        }}</span>
                    </div>
                    <div class="flex items-center">
                        <template v-if="userDialog.ref.id === currentUser.id">
                            <span class="mr-1">{{ t('dialog.user.avatars.sort_by') }}</span>
                            <Select
                                :model-value="userDialog.avatarSorting"
                                :disabled="userDialog.isWorldsLoading"
                                @update:modelValue="changeUserDialogAvatarSorting">
                                <SelectTrigger size="sm" @click.stop>
                                    <SelectValue
                                        :placeholder="t(`dialog.user.avatars.sort_by_${userDialog.avatarSorting}`)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">{{ t('dialog.user.avatars.sort_by_name') }}</SelectItem>
                                    <SelectItem value="update">{{
                                        t('dialog.user.avatars.sort_by_update')
                                    }}</SelectItem>
                                    <SelectItem value="createdAt">{{
                                        t('dialog.user.avatars.sort_by_uploaded')
                                    }}</SelectItem>
                                </SelectContent>
                            </Select>
                            <span class="ml-2 mr-1">{{ t('dialog.user.avatars.group_by') }}</span>
                            <Select
                                :model-value="userDialog.avatarReleaseStatus"
                                :disabled="userDialog.isWorldsLoading"
                                @update:modelValue="(value) => (userDialog.avatarReleaseStatus = value)">
                                <SelectTrigger size="sm" @click.stop>
                                    <SelectValue
                                        :placeholder="t(`dialog.user.avatars.${userDialog.avatarReleaseStatus}`)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{{ t('dialog.user.avatars.all') }}</SelectItem>
                                    <SelectItem value="public">{{ t('dialog.user.avatars.public') }}</SelectItem>
                                    <SelectItem value="private">{{ t('dialog.user.avatars.private') }}</SelectItem>
                                </SelectContent>
                            </Select>
                        </template>
                    </div>
                </div>
                <div class="x-friend-list" style="margin-top: 10px; min-height: 60px; max-height: 50vh">
                    <template v-if="userDialogAvatars.length">
                        <div
                            v-for="avatar in userDialogAvatars"
                            :key="avatar.id"
                            class="x-friend-item x-friend-item-border"
                            @click="showAvatarDialog(avatar.id)">
                            <div class="avatar">
                                <img v-if="avatar.thumbnailImageUrl" :src="avatar.thumbnailImageUrl" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="avatar.name"></span>
                                <span
                                    v-if="avatar.releaseStatus === 'public'"
                                    class="extra"
                                    v-text="avatar.releaseStatus">
                                </span>
                                <span
                                    v-else-if="avatar.releaseStatus === 'private'"
                                    class="extra"
                                    v-text="avatar.releaseStatus">
                                </span>
                                <span v-else class="extra" v-text="avatar.releaseStatus"></span>
                            </div>
                        </div>
                    </template>
                    <div
                        v-else-if="!userDialog.isAvatarsLoading"
                        style="
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 120px;
                            width: 100%;
                        ">
                        <DataTableEmpty type="nodata" />
                    </div>
                </div>
            </template>

            <template #JSON>
                <Button class="rounded-full mr-2" size="icon-sm" variant="outline" @click="refreshUserDialogTreeData()">
                    <RefreshCw />
                </Button>
                <Button
                    class="rounded-full"
                    size="icon-sm"
                    variant="outline"
                    @click="downloadAndSaveJson(userDialog.id, userDialog.ref)">
                    <Download />
                </Button>
                <vue-json-pretty
                    :key="treeData?.id"
                    :data="treeData"
                    :deep="2"
                    :theme="isDarkMode ? 'dark' : 'light'"
                    show-icon />
            </template>
        </TabsUnderline>
        <SendInviteDialog
            v-model:sendInviteDialogVisible="sendInviteDialogVisible"
            v-model:sendInviteDialog="sendInviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteRequestDialog
            v-model:sendInviteRequestDialogVisible="sendInviteRequestDialogVisible"
            v-model:sendInviteDialog="sendInviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <SocialStatusDialog
            :social-status-dialog="socialStatusDialog"
            :social-status-history-table="socialStatusHistoryTable" />
        <LanguageDialog />
        <BioDialog :bio-dialog="bioDialog" />
        <PronounsDialog :pronouns-dialog="pronounsDialog" />
        <ModerateGroupDialog />
        <EditNoteAndMemoDialog v-model:visible="isEditNoteAndMemoDialogVisible" />
    </div>
</template>

<script setup>
    import {
        AlertTriangle,
        ArrowDown,
        ArrowUp,
        Copy,
        Download,
        DownloadIcon,
        Eye,
        Info,
        Languages,
        LogOut,
        MoreHorizontal,
        Pencil,
        RefreshCw,
        Tag,
        Trash2
    } from 'lucide-vue-next';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
        compareByDisplayName,
        compareByFriendOrder,
        compareByLastActiveRef,
        compareByMemberCount,
        compareByName,
        copyToClipboard,
        downloadAndSaveJson,
        formatDateFilter,
        getFaviconUrl,
        isFriendOnline,
        isRealInstance,
        openExternalLink,
        parseLocation,
        refreshInstancePlayerCount,
        timeToText,
        userImage,
        userOnlineFor,
        userOnlineForTimestamp,
        userStatusClass
    } from '../../../shared/utils';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useAvatarStore,
        useFavoriteStore,
        useFriendStore,
        useGalleryStore,
        useGroupStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useModalStore,
        useModerationStore,
        useUiStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import {
        favoriteRequest,
        friendRequest,
        groupRequest,
        miscRequest,
        notificationRequest,
        playerModerationRequest,
        userRequest,
        worldRequest
    } from '../../../api';
    import { processBulk, request } from '../../../service/request';
    import { userDialogGroupSortingOptions, userDialogMutualFriendSortingOptions } from '../../../shared/constants';
    import { userDialogWorldOrderOptions, userDialogWorldSortingOptions } from '../../../shared/constants/';
    import { database } from '../../../service/database';

    import InstanceActionBar from '../../InstanceActionBar.vue';
    import SendInviteDialog from '../InviteDialog/SendInviteDialog.vue';
    import UserSummaryHeader from './UserSummaryHeader.vue';
    import { formatJsonVars } from '../../../shared/utils/base/ui';

    const BioDialog = defineAsyncComponent(() => import('./BioDialog.vue'));
    const LanguageDialog = defineAsyncComponent(() => import('./LanguageDialog.vue'));
    const PronounsDialog = defineAsyncComponent(() => import('./PronounsDialog.vue'));
    const SendInviteRequestDialog = defineAsyncComponent(() => import('./SendInviteRequestDialog.vue'));
    const SocialStatusDialog = defineAsyncComponent(() => import('./SocialStatusDialog.vue'));
    const ModerateGroupDialog = defineAsyncComponent(() => import('../ModerateGroupDialog.vue'));
    const EditNoteAndMemoDialog = defineAsyncComponent(() => import('./EditNoteAndMemoDialog.vue'));

    const { t } = useI18n();
    const userDialogTabs = computed(() => {
        const tabs = [
            { value: 'Info', label: t('dialog.user.info.header') },
            { value: 'Groups', label: t('dialog.user.groups.header') },
            { value: 'Worlds', label: t('dialog.user.worlds.header') },
            { value: 'favorite-worlds', label: t('dialog.user.favorite_worlds.header') },
            { value: 'Avatars', label: t('dialog.user.avatars.header') },
            { value: 'JSON', label: t('dialog.user.json.header') }
        ];
        if (userDialog.value.id !== currentUser.value.id && !currentUser.value.hasSharedConnectionsOptOut) {
            tabs.splice(1, 0, { value: 'mutual', label: t('dialog.user.mutual_friends.header') });
        }
        return tabs;
    });
    const favoriteWorldTabs = computed(() =>
        (userFavoriteWorlds.value || []).map((list, index) => ({
            value: String(index),
            label: list?.[0] ?? ''
        }))
    );

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { hideUserNotes, hideUserMemos, isDarkMode } = storeToRefs(useAppearanceSettingsStore());
    const { bioLanguage, avatarRemoteDatabase, translationApi, translationApiType } =
        storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { userDialog, languageDialog, currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const {
        cachedUsers,
        showUserDialog,
        sortUserDialogAvatars,
        refreshUserDialogAvatars,
        showSendBoopDialog,
        toggleSharedConnectionsOptOut
    } = useUserStore();
    const { favoriteLimits } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog, handleFavoriteWorldList } = useFavoriteStore();
    const { showAvatarDialog, lookupAvatars, showAvatarAuthorDialog } = useAvatarStore();
    const { cachedAvatars } = useAvatarStore();
    const { cachedWorlds, showWorldDialog } = useWorldStore();
    const {
        showGroupDialog,
        applyGroup,
        saveCurrentUserGroups,
        updateInGameGroupOrder,
        leaveGroup,
        leaveGroupPrompt,
        setGroupVisibility,
        handleGroupList,
        showModerateGroupDialog
    } = useGroupStore();
    const { currentUserGroups, inviteGroupDialog, inGameGroupOrder } = storeToRefs(useGroupStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { friendLogTable } = storeToRefs(useFriendStore());
    const { getFriendRequest, handleFriendDelete } = useFriendStore();
    const { clearInviteImageUpload, showFullscreenImageDialog, showGalleryPage } = useGalleryStore();

    const { cachedConfig } = storeToRefs(useAuthStore());
    const { applyPlayerModeration, handlePlayerModerationDelete } = useModerationStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                !userDialog.value.loading && loadLastActiveTab();
                if (userDialog.value.id !== bioCache.value.userId) {
                    bioCache.value = {
                        userId: null,
                        translated: null
                    };
                }
            }
        }
    );

    const userDialogGroupEditMode = ref(false); // whether edit mode is active
    const userDialogGroupEditGroups = ref([]); // editable group list
    const userDialogGroupAllSelected = ref(false);
    const userDialogGroupEditSelectedGroupIds = ref([]); // selected groups in edit mode

    const userDialogLastMutualFriends = ref('');
    const userDialogLastGroup = ref('');
    const userDialogLastAvatar = ref('');
    const userDialogLastWorld = ref('');
    const userDialogLastFavoriteWorld = ref('');
    const userFavoriteWorlds = ref([]);
    const userGroups = ref({
        groups: [],
        ownGroups: [],
        mutualGroups: [],
        remainingGroups: []
    });

    const favoriteWorldsTab = ref('0');

    const sendInviteDialogVisible = ref(false);
    const sendInviteDialog = ref({
        messageSlot: {},
        userId: '',
        params: {}
    });
    const sendInviteRequestDialogVisible = ref(false);

    const socialStatusDialog = ref({
        visible: false,
        loading: false,
        status: '',
        statusDescription: ''
    });
    const socialStatusHistoryTable = ref({
        data: [],

        layout: 'table'
    });

    const bioDialog = ref({
        visible: false,
        loading: false,
        bio: '',
        bioLinks: []
    });

    const translateLoading = ref(false);

    const pronounsDialog = ref({
        visible: false,
        loading: false,
        pronouns: ''
    });

    const bioCache = ref({
        userId: null,
        translated: null
    });

    const isEditNoteAndMemoDialogVisible = ref(false);
    const vrchatCredit = ref(null);
    const mutualFriendsError = ref(false);
    const treeData = ref({});

    const userDialogAvatars = computed(() => {
        const { avatars, avatarReleaseStatus } = userDialog.value;
        if (avatarReleaseStatus === 'public' || avatarReleaseStatus === 'private') {
            return avatars.filter((avatar) => avatar.releaseStatus === avatarReleaseStatus);
        }
        return avatars;
    });

    function userFavoriteWorldsStatus(visibility) {
        const style = {};
        if (visibility === 'public') {
            style.green = true;
        } else if (visibility === 'friends') {
            style.blue = true;
        } else {
            style.red = true;
        }
        return style;
    }

    function getUserStateText(user) {
        let state = '';
        if (user.state === 'active') {
            state = t('dialog.user.status.active');
        } else if (user.state === 'offline') {
            state = t('dialog.user.status.offline');
        } else {
            return getUserStatusText(user.status);
        }
        if (user.status && user.status !== 'active') {
            state += ` (${getUserStatusText(user.status)})`;
        }
        return state;
    }

    function getUserStatusText(status) {
        if (status === 'active') {
            return t('dialog.user.status.active');
        }
        if (status === 'join me') {
            return t('dialog.user.status.join_me');
        }
        if (status === 'ask me') {
            return t('dialog.user.status.ask_me');
        }
        if (status === 'busy') {
            return t('dialog.user.status.busy');
        }
        return t('dialog.user.status.offline');
    }

    function refreshUserDialogTreeData() {
        const D = userDialog.value;
        if (D.id === currentUser.value.id) {
            treeData.value = formatJsonVars({
                ...currentUser.value,
                ...D.ref
            });
            return;
        }
        treeData.value = formatJsonVars(D.ref);
    }

    function handleUserDialogTab(tabName) {
        userDialog.value.lastActiveTab = tabName;
        const userId = userDialog.value.id;
        if (tabName === 'Info') {
            if (vrchatCredit.value === null) {
                getVRChatCredits();
            }
        } else if (tabName === 'mutual') {
            if (userId === currentUser.value.id) {
                userDialog.value.activeTab = 'Info';
                userDialog.value.lastActiveTab = 'Info';
                return;
            }
            if (userDialogLastMutualFriends.value !== userId) {
                userDialogLastMutualFriends.value = userId;
                getUserMutualFriends(userId);
            }
        } else if (tabName === 'Groups') {
            if (userDialogLastGroup.value !== userId) {
                userDialogLastGroup.value = userId;
                getUserGroups(userId);
            }
        } else if (tabName === 'Avatars') {
            setUserDialogAvatars(userId);
            if (userDialogLastAvatar.value !== userId) {
                userDialogLastAvatar.value = userId;
                if (userId === currentUser.value.id) {
                    refreshUserDialogAvatars();
                } else {
                    setUserDialogAvatarsRemote(userId);
                }
            }
        } else if (tabName === 'Worlds') {
            setUserDialogWorlds(userId);
            if (userDialogLastWorld.value !== userId) {
                userDialogLastWorld.value = userId;
                refreshUserDialogWorlds();
            }
        } else if (tabName === 'favorite-worlds') {
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
                getUserFavoriteWorlds(userId);
            }
        } else if (tabName === 'JSON') {
            refreshUserDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleUserDialogTab(userDialog.value.lastActiveTab);
    }

    function userDialogTabClick(tabName) {
        if (tabName === userDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshUserDialogTreeData();
            }
            return;
        }
        handleUserDialogTab(tabName);
    }

    function showPronounsDialog() {
        const D = pronounsDialog.value;
        D.pronouns = currentUser.value.pronouns;
        D.visible = true;
    }

    function showLanguageDialog() {
        const D = languageDialog.value;
        D.visible = true;
    }

    function showSocialStatusDialog() {
        const D = socialStatusDialog.value;
        const { statusHistory } = currentUser.value;
        const statusHistoryArray = [];
        for (let i = 0; i < statusHistory.length; ++i) {
            const addStatus = {
                no: i + 1,
                status: statusHistory[i]
            };
            statusHistoryArray.push(addStatus);
        }
        socialStatusHistoryTable.value.data = statusHistoryArray;
        D.status = currentUser.value.status;
        D.statusDescription = currentUser.value.statusDescription;
        D.visible = true;
    }

    async function setUserDialogAvatarsRemote(userId) {
        if (avatarRemoteDatabase.value && userId !== currentUser.value.id) {
            userDialog.value.isAvatarsLoading = true;
            const data = await lookupAvatars('authorId', userId);
            const avatars = new Set();
            userDialogAvatars.value.forEach((avatar) => {
                avatars.add(avatar.id);
            });
            if (data && typeof data === 'object') {
                data.forEach((avatar) => {
                    if (avatar.id && !avatars.has(avatar.id)) {
                        if (avatar.authorId === userId) {
                            userDialog.value.avatars.push(avatar);
                        } else {
                            console.error(`Avatar authorId mismatch for ${avatar.id} - ${avatar.name}`);
                        }
                    }
                });
            }
            userDialog.value.avatarSorting = 'name';
            userDialog.value.avatarReleaseStatus = 'all';
            userDialog.value.isAvatarsLoading = false;
        }
        sortUserDialogAvatars(userDialog.value.avatars);
    }

    async function toggleBadgeVisibility(badge) {
        if (badge.hidden) {
            badge.showcased = false;
        }
        const args = await miscRequest.updateBadge({
            badgeId: badge.badgeId,
            hidden: badge.hidden,
            showcased: badge.showcased
        });
        handleBadgeUpdate(args);
    }

    async function toggleBadgeShowcased(badge) {
        if (badge.showcased) {
            badge.hidden = false;
        }
        const args = await miscRequest.updateBadge({
            badgeId: badge.badgeId,
            hidden: badge.hidden,
            showcased: badge.showcased
        });
        handleBadgeUpdate(args);
    }

    function handleBadgeUpdate(args) {
        if (args.json) {
            toast.success(t('message.badge.updated'));
        }
    }

    function setPlayerModeration(userId, type) {
        const D = userDialog.value;
        AppApi.SetVRChatUserModeration(currentUser.value.id, userId, type).then((result) => {
            if (result) {
                if (type === 4) {
                    D.isShowAvatar = false;
                    D.isHideAvatar = true;
                } else if (type === 5) {
                    D.isShowAvatar = true;
                    D.isHideAvatar = false;
                } else {
                    D.isShowAvatar = false;
                    D.isHideAvatar = false;
                }
            } else {
                toast.error(t('message.avatar.change_moderation_failed'));
            }
        });
    }

    function showSendInviteDialog(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        refreshInviteMessageTableData('message');
        clearInviteImageUpload();
        sendInviteDialogVisible.value = true;
    }

    function showSendInviteRequestDialog(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        refreshInviteMessageTableData('request');
        clearInviteImageUpload();
        sendInviteRequestDialogVisible.value = true;
    }

    function showInviteGroupDialog(groupId, userId) {
        inviteGroupDialog.value.groupId = groupId;
        inviteGroupDialog.value.userId = userId;
        inviteGroupDialog.value.visible = true;
    }

    function userDialogCommand(command) {
        let L;
        const D = userDialog.value;
        if (D.visible === false) {
            return;
        }
        if (command === 'Refresh') {
            showUserDialog(D.id);
        } else if (command === 'Share') {
            copyUserURL(D.id);
        } else if (command === 'Add Favorite') {
            showFavoriteDialog('friend', D.id);
        } else if (command === 'Edit Social Status') {
            showSocialStatusDialog();
        } else if (command === 'Edit Language') {
            showLanguageDialog();
        } else if (command === 'Edit Bio') {
            showBioDialog();
        } else if (command === 'Edit Pronouns') {
            showPronounsDialog();
        } else if (command === 'Request Invite') {
            notificationRequest
                .sendRequestInvite(
                    {
                        platform: 'standalonewindows'
                    },
                    D.id
                )
                .then((args) => {
                    toast('Request invite sent');
                    return args;
                });
        } else if (command === 'Invite Message') {
            L = parseLocation(lastLocation.value.location);
            worldRequest
                .getCachedWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    showSendInviteDialog(
                        {
                            instanceId: lastLocation.value.location,
                            worldId: lastLocation.value.location,
                            worldName: args.ref.name
                        },
                        D.id
                    );
                });
        } else if (command === 'Request Invite Message') {
            showSendInviteRequestDialog(
                {
                    platform: 'standalonewindows'
                },
                D.id
            );
        } else if (command === 'Invite') {
            let currentLocation = lastLocation.value.location;
            if (lastLocation.value.location === 'traveling') {
                currentLocation = lastLocationDestination.value;
            }
            L = parseLocation(currentLocation);
            worldRequest
                .getCachedWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    notificationRequest
                        .sendInvite(
                            {
                                instanceId: L.tag,
                                worldId: L.tag,
                                worldName: args.ref.name
                            },
                            D.id
                        )
                        .then((_args) => {
                            toast(t('message.invite.sent'));
                            return _args;
                        });
                });
        } else if (command === 'Show Avatar Author') {
            const { currentAvatarImageUrl } = D.ref;
            showAvatarAuthorDialog(D.id, D.$avatarInfo.ownerId, currentAvatarImageUrl);
        } else if (command === 'Show Fallback Avatar Details') {
            const { fallbackAvatar } = D.ref;
            if (fallbackAvatar) {
                showAvatarDialog(fallbackAvatar);
            } else {
                toast.error('No fallback avatar set');
            }
        } else if (command === 'Previous Instances') {
            showPreviousInstancesListDialog(D.ref);
        } else if (command === 'Manage Gallery') {
            userDialog.value.visible = false;
            showGalleryPage();
        } else if (command === 'Invite To Group') {
            showInviteGroupDialog('', D.id);
        } else if (command === 'Send Boop') {
            showSendBoopDialog(D.id);
        } else if (command === 'Group Moderation') {
            showModerateGroupDialog(D.id);
        } else if (command === 'Hide Avatar') {
            if (D.isHideAvatar) {
                setPlayerModeration(D.id, 0);
            } else {
                setPlayerModeration(D.id, 4);
            }
        } else if (command === 'Show Avatar') {
            if (D.isShowAvatar) {
                setPlayerModeration(D.id, 0);
            } else {
                setPlayerModeration(D.id, 5);
            }
        } else if (command === 'Edit Note Memo') {
            isEditNoteAndMemoDialogVisible.value = true;
        } else {
            const i18nPreFix = 'dialog.user.actions.';
            const formattedCommand = command.toLowerCase().replace(/ /g, '_');
            const displayCommandText = t(`${i18nPreFix}${formattedCommand}`).includes('i18nPreFix')
                ? command
                : t(`${i18nPreFix}${formattedCommand}`);

            modalStore
                .confirm({
                    description: t('confirm.message', {
                        command: displayCommandText
                    }),
                    title: t('confirm.title'),
                    confirmText: t('confirm.confirm_button'),
                    cancelText: t('confirm.cancel_button')
                })
                .then(({ ok }) => {
                    if (ok) {
                        performUserDialogCommand(command, D.id);
                    }
                })
                .catch(() => {});
        }
    }

    function handleSendFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);

        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        if (args.json.success) {
            D.isFriend = true;
        } else {
            D.outgoingRequest = true;
        }
    }

    function handleCancelFriendRequest(args) {
        const ref = cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        friendLogTable.value.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
        const D = userDialog.value;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    }

    function handleSendPlayerModeration(args) {
        const ref = applyPlayerModeration(args.json);
        const D = userDialog.value;
        if (D.visible === false || (ref.targetUserId !== D.id && ref.sourceUserId !== currentUser.value.id)) {
            return;
        }
        if (ref.type === 'block') {
            D.isBlock = true;
        } else if (ref.type === 'mute') {
            D.isMute = true;
        } else if (ref.type === 'interactOff') {
            D.isInteractOff = true;
        } else if (ref.type === 'muteChat') {
            D.isMuteChat = true;
        }
        toast.success(t('message.user.moderated'));
    }

    async function performUserDialogCommand(command, userId) {
        let args;
        let key;
        switch (command) {
            case 'Delete Favorite':
                favoriteRequest.deleteFavorite({
                    objectId: userId
                });
                break;
            case 'Accept Friend Request':
                key = getFriendRequest(userId);
                if (key === '') {
                    const args = await friendRequest.sendFriendRequest({
                        userId
                    });
                    handleSendFriendRequest(args);
                } else {
                    notificationRequest.acceptFriendRequestNotification({
                        notificationId: key
                    });
                }
                break;
            case 'Decline Friend Request':
                key = getFriendRequest(userId);
                if (key === '') {
                    const args = await friendRequest.cancelFriendRequest({
                        userId
                    });
                    handleCancelFriendRequest(args);
                } else {
                    notificationRequest.hideNotification({
                        notificationId: key
                    });
                }
                break;
            case 'Cancel Friend Request': {
                args = await friendRequest.cancelFriendRequest({
                    userId
                });
                handleCancelFriendRequest(args);
                break;
            }
            case 'Send Friend Request': {
                args = await friendRequest.sendFriendRequest({
                    userId
                });
                handleSendFriendRequest(args);
                break;
            }
            case 'Moderation Unblock':
                args = await playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                handlePlayerModerationDelete(args);
                break;
            case 'Moderation Block': {
                args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Unmute':
                args = await playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                handlePlayerModerationDelete(args);
                break;
            case 'Moderation Mute': {
                args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Enable Avatar Interaction':
                args = await playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'interactOff'
                });
                handlePlayerModerationDelete(args);
                break;
            case 'Moderation Disable Avatar Interaction': {
                args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'interactOff'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Enable Chatbox':
                args = await playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'muteChat'
                });
                handlePlayerModerationDelete(args);
                break;
            case 'Moderation Disable Chatbox': {
                args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'muteChat'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Report Hacking':
                reportUserForHacking(userId);
                break;
            case 'Unfriend':
                args = await friendRequest.deleteFriend(
                    {
                        userId
                    },
                    t('dialog.user.actions.unfriend_success_msg')
                );
                handleFriendDelete(args);
                break;
        }
    }

    function reportUserForHacking(userId) {
        miscRequest.reportUser({
            userId,
            contentType: 'user',
            reason: 'behavior-hacking',
            type: 'report'
        });
    }

    async function getUserGroups(userId) {
        exitEditModeCurrentUserGroups();
        userDialog.value.isGroupsLoading = true;
        userGroups.value = {
            groups: [],
            ownGroups: [],
            mutualGroups: [],
            remainingGroups: []
        };
        const args = await groupRequest.getGroups({ userId });
        handleGroupList(args);
        if (userId !== userDialog.value.id) {
            userDialog.value.isGroupsLoading = false;
            return;
        }
        if (userId === currentUser.value.id) {
            // update current user groups
            currentUserGroups.value.clear();
            args.json.forEach((group) => {
                const ref = applyGroup(group);
                if (!currentUserGroups.value.has(group.id)) {
                    currentUserGroups.value.set(group.id, ref);
                }
            });

            saveCurrentUserGroups();
        }
        userGroups.value.groups = args.json;
        for (let i = 0; i < args.json.length; ++i) {
            const group = args.json[i];
            if (!group?.id) {
                console.error('getUserGroups, group ID is missing', group);
                continue;
            }
            if (group.ownerId === userId) {
                userGroups.value.ownGroups.unshift(group);
            }
            if (userId === currentUser.value.id) {
                // skip mutual groups for current user
                if (group.ownerId !== userId) {
                    userGroups.value.remainingGroups.unshift(group);
                }
                continue;
            }
            if (group.mutualGroup) {
                userGroups.value.mutualGroups.unshift(group);
            }
            if (!group.mutualGroup && group.ownerId !== userId) {
                userGroups.value.remainingGroups.unshift(group);
            }
        }
        if (userId === currentUser.value.id) {
            userDialog.value.groupSorting = userDialogGroupSortingOptions.inGame;
        } else if (userDialog.value.groupSorting.value === userDialogGroupSortingOptions.inGame.value) {
            userDialog.value.groupSorting = userDialogGroupSortingOptions.alphabetical;
        }
        await sortCurrentUserGroups();
        userDialog.value.isGroupsLoading = false;
    }

    async function getUserMutualFriends(userId) {
        userDialog.value.mutualFriends = [];
        if (currentUser.value.hasSharedConnectionsOptOut) {
            return;
        }
        userDialog.value.isMutualFriendsLoading = true;
        const params = {
            userId,
            n: 100,
            offset: 0
        };
        processBulk({
            fn: userRequest.getMutualFriends,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    if (userDialog.value.mutualFriends.some((u) => u.id === json.id)) {
                        continue;
                    }
                    const ref = cachedUsers.get(json.id);
                    if (typeof ref !== 'undefined') {
                        userDialog.value.mutualFriends.push(ref);
                    } else {
                        userDialog.value.mutualFriends.push(json);
                    }
                }
                setUserDialogMutualFriendSorting(userDialog.value.mutualFriendSorting);
            },
            done: (success) => {
                userDialog.value.isMutualFriendsLoading = false;
                if (success) {
                    const mutualIds = userDialog.value.mutualFriends.map((u) => u.id);
                    database.updateMutualsForFriend(userId, mutualIds);
                }
                mutualFriendsError.value = !success;
            }
        });
    }

    function sortGroupsByInGame(a, b) {
        const aIndex = inGameGroupOrder.value.indexOf(a?.id);
        const bIndex = inGameGroupOrder.value.indexOf(b?.id);
        if (aIndex === -1 && bIndex === -1) {
            return 0;
        }
        if (aIndex === -1) {
            return 1;
        }
        if (bIndex === -1) {
            return -1;
        }
        return aIndex - bIndex;
    }

    async function sortCurrentUserGroups() {
        const D = userDialog.value;
        let sortMethod = () => 0;

        switch (D.groupSorting.value) {
            case 'alphabetical':
                sortMethod = compareByName;
                break;
            case 'members':
                sortMethod = compareByMemberCount;
                break;
            case 'inGame':
                sortMethod = sortGroupsByInGame;
                await updateInGameGroupOrder();
                break;
        }

        userGroups.value.ownGroups.sort(sortMethod);
        userGroups.value.mutualGroups.sort(sortMethod);
        userGroups.value.remainingGroups.sort(sortMethod);
    }

    function setUserDialogAvatars(userId) {
        const avatars = new Set();
        userDialogAvatars.value.forEach((avatar) => {
            avatars.add(avatar.id);
        });
        for (const ref of cachedAvatars.values()) {
            if (ref.authorId === userId && !avatars.has(ref.id)) {
                userDialog.value.avatars.push(ref);
            }
        }
        sortUserDialogAvatars(userDialog.value.avatars);
    }

    function setUserDialogWorlds(userId) {
        const worlds = [];
        for (const ref of cachedWorlds.values()) {
            if (ref.authorId === userId) {
                worlds.push(ref);
            }
        }
        userDialog.value.worlds = worlds;
    }

    function refreshUserDialogWorlds() {
        const D = userDialog.value;
        if (D.isWorldsLoading) {
            return;
        }
        D.isWorldsLoading = true;
        const params = {
            n: 50,
            offset: 0,
            sort: userDialog.value.worldSorting.value,
            order: userDialog.value.worldOrder.value,
            // user: 'friends',
            userId: D.id,
            releaseStatus: 'public'
        };
        if (params.userId === currentUser.value.id) {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        const map = new Map();
        for (const ref of cachedWorlds.values()) {
            if (ref.authorId === D.id && (ref.authorId === currentUser.value.id || ref.releaseStatus === 'public')) {
                cachedWorlds.delete(ref.id);
            }
        }
        processBulk({
            fn: worldRequest.getWorlds,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const $ref = cachedWorlds.get(json.id);
                    if (typeof $ref !== 'undefined') {
                        map.set($ref.id, $ref);
                    }
                }
            },
            done: () => {
                if (D.id === params.userId) {
                    setUserDialogWorlds(D.id);
                }
                D.isWorldsLoading = false;
            }
        });
    }

    async function getUserFavoriteWorlds(userId) {
        userDialog.value.isFavoriteWorldsLoading = true;
        favoriteWorldsTab.value = '0';
        userFavoriteWorlds.value = [];
        const worldLists = [];
        let params = {
            ownerId: userId,
            n: 100,
            offset: 0
        };
        const json = await request('favorite/groups', {
            method: 'GET',
            params
        });
        for (let i = 0; i < json.length; ++i) {
            const list = json[i];
            if (list.type !== 'world') {
                continue;
            }
            params = {
                ownerId: userId,
                n: 100,
                offset: 0,
                userId,
                tag: list.name
            };
            try {
                const args = await favoriteRequest.getFavoriteWorlds(params);
                handleFavoriteWorldList(args);
                worldLists.push([list.displayName, list.visibility, args.json]);
            } catch (err) {
                console.error('getUserFavoriteWorlds', err);
            }
        }
        userFavoriteWorlds.value = worldLists;
        userDialog.value.isFavoriteWorldsLoading = false;
    }

    function showBioDialog() {
        const D = bioDialog.value;
        D.bio = currentUser.value.bio;
        D.bioLinks = currentUser.value.bioLinks.slice();
        D.visible = true;
    }

    async function translateBio() {
        if (translateLoading.value) {
            return;
        }
        const bio = userDialog.value.ref.bio;
        if (!bio) {
            return;
        }

        const targetLang = bioLanguage.value;

        if (bioCache.value.userId !== userDialog.value.id) {
            bioCache.value.userId = userDialog.value.id;
            bioCache.value.translated = null;
        }

        if (bioCache.value.translated) {
            bioCache.value.translated = null;
            return;
        }

        translateLoading.value = true;
        try {
            const providerLabel = translationApiType.value === 'openai' ? 'OpenAI' : 'Google';
            const translated = await translateText(`${bio}\n\nTranslated by ${providerLabel}`, targetLang);
            if (!translated) {
                throw new Error('No translation returned');
            }

            bioCache.value.translated = translated;
        } catch (err) {
            console.error('Translation failed:', err);
        } finally {
            translateLoading.value = false;
        }
    }

    function showPreviousInstancesListDialog(userRef) {
        instanceStore.showPreviousInstancesListDialog('user', userRef);
    }

    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({
            allowAvatarCopying: !currentUser.value.allowAvatarCopying
        });
    }

    function toggleAllowBooping() {
        userRequest.saveCurrentUser({
            isBoopingEnabled: !currentUser.value.isBoopingEnabled
        });
    }

    function resetHome() {
        modalStore
            .confirm({
                description: 'Continue? Reset Home',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                userRequest
                    .saveCurrentUser({
                        homeLocation: ''
                    })
                    .then((args) => {
                        toast.success('Home world has been reset');
                        return args;
                    });
            })
            .catch(() => {});
    }

    function copyUserId(userId) {
        copyToClipboard(userId, 'User ID copied to clipboard');
    }

    function copyUserURL(userId) {
        copyToClipboard(`https://vrchat.com/home/user/${userId}`, 'User URL copied to clipboard');
    }

    function copyUserDisplayName(displayName) {
        copyToClipboard(displayName, 'User DisplayName copied to clipboard');
    }

    const userDialogGroupSortingKey = computed(() => {
        const current = userDialog.value.groupSorting;
        const found = Object.entries(userDialogGroupSortingOptions).find(([, option]) => {
            if (option === current) {
                return true;
            }
            return option?.value === current?.value || option?.name === current?.name;
        });
        return found ? String(found[0]) : '';
    });

    function setUserDialogGroupSortingByKey(key) {
        const option = userDialogGroupSortingOptions[key];
        if (!option) {
            return;
        }
        setUserDialogGroupSorting(option);
    }

    async function setUserDialogGroupSorting(sortOrder) {
        const D = userDialog.value;
        if (D.groupSorting.value === sortOrder.value) {
            return;
        }
        D.groupSorting = sortOrder;
        await sortCurrentUserGroups();
    }

    const userDialogMutualFriendSortingKey = computed(() => {
        const current = userDialog.value.mutualFriendSorting;
        const found = Object.entries(userDialogMutualFriendSortingOptions).find(([, option]) => {
            if (option === current) {
                return true;
            }
            return option?.value === current?.value || option?.name === current?.name;
        });
        return found ? String(found[0]) : '';
    });

    function setUserDialogMutualFriendSortingByKey(key) {
        const option = userDialogMutualFriendSortingOptions[key];
        if (!option) {
            return;
        }
        setUserDialogMutualFriendSorting(option);
    }

    async function setUserDialogMutualFriendSorting(sortOrder) {
        const D = userDialog.value;
        D.mutualFriendSorting = sortOrder;
        switch (sortOrder.value) {
            case 'alphabetical':
                D.mutualFriends.sort(compareByDisplayName);
                break;
            case 'lastActive':
                D.mutualFriends.sort(compareByLastActiveRef);
                break;
            case 'friendOrder':
                D.mutualFriends.sort(compareByFriendOrder);
                break;
        }
    }

    async function exitEditModeCurrentUserGroups() {
        userDialogGroupEditMode.value = false;
        userDialogGroupEditGroups.value = [];
        userDialogGroupEditSelectedGroupIds.value = [];
        userDialogGroupAllSelected.value = false;
        await sortCurrentUserGroups();
    }

    async function editModeCurrentUserGroups() {
        await updateInGameGroupOrder();
        userDialogGroupEditGroups.value = Array.from(currentUserGroups.value.values());
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        userDialogGroupEditMode.value = true;
    }

    async function saveInGameGroupOrder() {
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        try {
            await AppApi.SetVRChatRegistryKey(
                `VRC_GROUP_ORDER_${currentUser.value.id}`,
                JSON.stringify(inGameGroupOrder.value),
                3
            );
        } catch (err) {
            console.error(err);
            toast.error('Failed to save in-game group order');
        }
    }

    // Select all groups currently in the editable list by collecting their IDs
    function selectAllGroups() {
        const allSelected = userDialogGroupEditSelectedGroupIds.value.length === userDialogGroupEditGroups.value.length;

        // First update selection state
        userDialogGroupEditSelectedGroupIds.value = allSelected ? [] : userDialogGroupEditGroups.value.map((g) => g.id);
        userDialogGroupAllSelected.value = !allSelected;

        // Toggle editMode off and back on to force checkbox UI update
        userDialogGroupEditMode.value = false;
        nextTick(() => {
            userDialogGroupEditMode.value = true;
        });
    }

    const bulkGroupActionValue = ref('');

    function handleBulkGroupAction(value) {
        bulkGroupActionValue.value = value;

        if (value === 'leave') {
            bulkLeaveGroups();
        } else if (typeof value === 'string' && value.startsWith('visibility:')) {
            const newVisibility = value.slice('visibility:'.length);
            bulkSetVisibility(newVisibility);
        }

        nextTick(() => {
            bulkGroupActionValue.value = '';
        });
    }

    // Apply the given visibility to all selected groups
    async function bulkSetVisibility(newVisibility) {
        for (const groupId of userDialogGroupEditSelectedGroupIds.value) {
            setGroupVisibility(groupId, newVisibility);
        }
    }

    // Leave (remove user from) all selected groups
    function bulkLeaveGroups() {
        for (const groupId of userDialogGroupEditSelectedGroupIds.value) {
            leaveGroup(groupId);
        }
    }

    // Toggle individual group selection for bulk actions
    function toggleGroupSelection(groupId) {
        const index = userDialogGroupEditSelectedGroupIds.value.indexOf(groupId);
        if (index === -1) {
            userDialogGroupEditSelectedGroupIds.value.push(groupId);
        } else {
            userDialogGroupEditSelectedGroupIds.value.splice(index, 1);
        }
    }

    function moveGroupUp(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index > 0) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.splice(index - 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupDown(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index < inGameGroupOrder.value.length - 1) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.splice(index + 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupTop(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index > 0) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.unshift(groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupBottom(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index < inGameGroupOrder.value.length - 1) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.push(groupId);
            saveInGameGroupOrder();
        }
    }

    async function setUserDialogWorldSorting(sortOrder) {
        const D = userDialog.value;
        if (D.worldSorting.value === sortOrder.value) {
            return;
        }
        D.worldSorting = sortOrder;
        refreshUserDialogWorlds();
    }

    const userDialogWorldSortingKey = computed(() => {
        const current = userDialog.value.worldSorting;
        const found = Object.entries(userDialogWorldSortingOptions).find(([, option]) => {
            if (option === current) {
                return true;
            }
            return option?.value === current?.value || option?.name === current?.name;
        });
        return found ? String(found[0]) : '';
    });

    function setUserDialogWorldSortingByKey(key) {
        const option = userDialogWorldSortingOptions[key];
        if (!option) {
            return;
        }
        setUserDialogWorldSorting(option);
    }

    async function setUserDialogWorldOrder(order) {
        const D = userDialog.value;
        if (D.worldOrder.value === order.value) {
            return;
        }
        D.worldOrder = order;
        refreshUserDialogWorlds();
    }

    const userDialogWorldOrderKey = computed(() => {
        const current = userDialog.value.worldOrder;
        const found = Object.entries(userDialogWorldOrderOptions).find(([, option]) => {
            if (option === current) {
                return true;
            }
            return option?.value === current?.value || option?.name === current?.name;
        });
        return found ? String(found[0]) : '';
    });

    function setUserDialogWorldOrderByKey(key) {
        const option = userDialogWorldOrderOptions[key];
        if (!option) {
            return;
        }
        setUserDialogWorldOrder(option);
    }

    function changeUserDialogAvatarSorting(sortOption) {
        const D = userDialog.value;
        D.avatarSorting = sortOption;
        sortUserDialogAvatars(D.avatars);
    }

    function closeInviteDialog() {
        clearInviteImageUpload();
    }

    function getVRChatCredits() {
        miscRequest.getVRChatCredits().then((args) => (vrchatCredit.value = args.json?.balance));
    }
</script>
