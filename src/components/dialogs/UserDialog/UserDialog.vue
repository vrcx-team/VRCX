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
                        class="mb-2 pb-2 border-b border-border"
                        v-if="userDialog.ref.location"
                        style="display: flex; flex-direction: column">
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
                        <div
                            class="flex flex-wrap items-start"
                            style="flex: 1; margin-top: 8px; max-height: 150px; overflow: auto">
                            <div
                                v-if="userDialog.$location.userId"
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                                @click="showUserDialog(userDialog.$location.userId)">
                                <template v-if="userDialog.$location.user">
                                    <div
                                        class="relative inline-block flex-none size-9 mr-2.5"
                                        :class="userStatusClass(userDialog.$location.user)">
                                        <img
                                            class="size-full rounded-full object-cover"
                                            :src="userImage(userDialog.$location.user, true)"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: userDialog.$location.user.$userColour }"
                                            v-text="userDialog.$location.user.displayName"></span>
                                        <span class="block truncate text-xs">{{
                                            t('dialog.user.info.instance_creator')
                                        }}</span>
                                    </div>
                                </template>
                                <span v-else v-text="userDialog.$location.userId"></span>
                            </div>
                            <div
                                v-for="user in userDialog.users"
                                :key="user.id"
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                                @click="showUserDialog(user.id)">
                                <div
                                    class="relative inline-block flex-none size-9 mr-2.5"
                                    :class="userStatusClass(user)">
                                    <img
                                        class="size-full rounded-full object-cover"
                                        :src="userImage(user, true)"
                                        loading="lazy" />
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <span
                                        class="block truncate font-medium leading-[18px]"
                                        :style="{ color: user.$userColour }"
                                        v-text="user.displayName"></span>
                                    <span v-if="user.location === 'traveling'" class="block truncate text-xs">
                                        <Spinner class="inline-block mr-1" />
                                        <Timer :epoch="user.$travelingToTime" />
                                    </span>
                                    <span v-else class="block truncate text-xs">
                                        <Timer :epoch="user.$location_at" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <div class="flex flex-wrap items-start px-2.5" style="max-height: none">
                    <div
                        v-if="userDialog.note && !hideUserNotes"
                        class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer">
                        <div class="flex-1 overflow-hidden" @click="isEditNoteAndMemoDialogVisible = true">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.note')
                            }}</span>
                            <pre
                                class="text-xs"
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
                        class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer">
                        <div class="flex-1 overflow-hidden" @click="isEditNoteAndMemoDialogVisible = true">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.memo')
                            }}</span>
                            <pre
                                class="text-xs"
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
                    <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">
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
                                    <Info class="inline-block" />
                                </TooltipWrapper>
                            </span>
                            <div class="text-xs">
                                <AvatarInfo
                                    :key="userDialog.id"
                                    :imageurl="userDialog.ref.currentAvatarImageUrl"
                                    :userid="userDialog.id"
                                    :avatartags="userDialog.ref.currentAvatarTags"
                                    style="display: inline-block" />
                            </div>
                        </div>
                    </div>
                    <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]" style="margin-bottom: 6px">{{
                                t('dialog.user.info.represented_group')
                            }}</span>
                            <div
                                v-if="
                                    userDialog.isRepresentedGroupLoading ||
                                    (userDialog.representedGroup && userDialog.representedGroup.isRepresenting)
                                "
                                class="text-xs">
                                <div style="display: inline-block; flex: none; margin-right: 6px">
                                    <Avatar
                                        class="cursor-pointer size-15! rounded-lg!"
                                        :style="{
                                            background: userDialog.isRepresentedGroupLoading ? 'var(--muted)' : ''
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
                                        style="margin-right: 6px"
                                        >👑</span
                                    >
                                    <span style="margin-right: 6px" v-text="userDialog.representedGroup.name"></span>
                                    <span>({{ userDialog.representedGroup.memberCount }})</span>
                                </span>
                            </div>
                            <div v-else class="text-xs">-</div>
                        </div>
                    </div>
                    <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.bio')
                            }}</span>
                            <pre
                                class="text-xs truncate"
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
                                    style="margin-left: 6px; padding: 0"
                                    @click="showBioDialog"
                                    ><Pencil class="h-3 w-3" />
                                </Button>
                            </div>
                            <div style="margin-top: 6px" class="flex items-center">
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
                                            margin-right: 6px;
                                            cursor: pointer;
                                        "
                                        @click.stop="openExternalLink(link)"
                                        loading="lazy" />
                                </TooltipWrapper>
                            </div>
                        </div>
                    </div>
                    <template v-if="currentUser.id !== userDialog.id">
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.last_seen') }}
                                </span>
                                <span class="block truncate text-xs">{{
                                    formatDateFilter(userDialog.lastSeen, 'long')
                                }}</span>
                            </div>
                        </div>

                        <div
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                            @click="showPreviousInstancesListDialog(userDialog.ref)">
                            <div class="flex-1 overflow-hidden">
                                <div
                                    class="block truncate font-medium leading-[18px]"
                                    style="display: flex; justify-content: space-between; align-items: center">
                                    <div>
                                        {{ t('dialog.user.info.join_count') }}
                                    </div>

                                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                        <MoreHorizontal style="margin-right: 16px" />
                                    </TooltipWrapper>
                                </div>
                                <span v-if="userDialog.joinCount === 0" class="block truncate text-xs">-</span>
                                <span v-else class="block truncate text-xs" v-text="userDialog.joinCount"></span>
                            </div>
                        </div>

                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.time_together') }}
                                </span>
                                <span v-if="userDialog.timeSpent === 0" class="block truncate text-xs">-</span>
                                <span v-else class="block truncate text-xs">{{
                                    timeToText(userDialog.timeSpent)
                                }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <TooltipWrapper
                            :disabled="currentUser.id !== userDialog.id"
                            side="top"
                            :content="t('dialog.user.info.open_previous_instance')">
                            <div
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                                @click="showPreviousInstancesListDialog(userDialog.ref)">
                                <div class="flex-1 overflow-hidden">
                                    <span class="block truncate font-medium leading-[18px]">
                                        {{ t('dialog.user.info.play_time') }}
                                    </span>
                                    <span v-if="userDialog.timeSpent === 0" class="block truncate text-xs">-</span>
                                    <span v-else class="block truncate text-xs">{{
                                        timeToText(userDialog.timeSpent)
                                    }}</span>
                                </div>
                            </div>
                        </TooltipWrapper>
                    </template>
                    <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                        <TooltipWrapper :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                            <template #content>
                                <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'short') }}</span>
                            </template>
                            <div class="flex-1 overflow-hidden">
                                <span
                                    v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for"
                                    class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.online_for') }}
                                </span>
                                <span v-else class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.offline_for') }}
                                </span>
                                <span class="block truncate text-xs">{{ userOnlineFor(userDialog.ref) }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
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
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.last_activity')
                                }}</span>
                                <span v-if="userDialog.ref.last_activity" class="block truncate text-xs">{{
                                    timeToText(Date.now() - Date.parse(userDialog.ref.last_activity))
                                }}</span>
                                <span v-else class="block truncate text-xs">-</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.date_joined')
                            }}</span>
                            <span class="block truncate text-xs" v-text="userDialog.ref.date_joined"></span>
                        </div>
                    </div>
                    <div
                        v-if="currentUser.id !== userDialog.id"
                        class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                        <TooltipWrapper side="top" :disabled="userDialog.dateFriendedInfo.length < 2">
                            <template #content>
                                <template v-for="ref in userDialog.dateFriendedInfo" :key="ref.type">
                                    <span>{{ ref.type }}: {{ formatDateFilter(ref.created_at, 'long') }}</span
                                    ><br />
                                </template>
                            </template>
                            <div class="flex-1 overflow-hidden">
                                <span v-if="userDialog.unFriended" class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.unfriended') }}
                                </span>
                                <span v-else class="block truncate font-medium leading-[18px]">
                                    {{ t('dialog.user.info.friended') }}
                                </span>
                                <span class="block truncate text-xs">{{
                                    formatDateFilter(userDialog.dateFriended, 'long')
                                }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                    <template v-if="currentUser.id === userDialog.id">
                        <div
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                            @click="toggleAvatarCopying">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.avatar_cloning')
                                }}</span>
                                <span v-if="currentUser.allowAvatarCopying" class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_deny')
                                }}</span>
                            </div>
                        </div>
                        <div
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                            @click="toggleAllowBooping">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.booping')
                                }}</span>
                                <span v-if="currentUser.isBoopingEnabled" class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_deny')
                                }}</span>
                            </div>
                        </div>
                        <div
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                            @click="toggleSharedConnectionsOptOut">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.show_mutual_friends')
                                }}</span>
                                <span v-if="!currentUser.hasSharedConnectionsOptOut" class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_deny')
                                }}</span>
                            </div>
                        </div>
                        <div
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                            @click="toggleDiscordFriendsOptOut">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.show_discord_connections')
                                }}</span>
                                <span v-if="!currentUser.hasDiscordFriendsOptOut" class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_deny')
                                }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.user.info.avatar_cloning')
                                }}</span>
                                <span v-if="userDialog.ref.allowAvatarCopying" class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_allow')
                                }}</span>
                                <span v-else class="block truncate text-xs">{{
                                    t('dialog.user.info.avatar_cloning_deny')
                                }}</span>
                            </div>
                        </div>
                    </template>
                    <div
                        v-if="userDialog.ref.id === currentUser.id"
                        class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                        @click="getVRChatCredits()">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('view.profile.profile.vrchat_credits')
                            }}</span>
                            <span class="block truncate text-xs">{{
                                vrchatCredit ?? t('view.profile.profile.refresh')
                            }}</span>
                        </div>
                    </div>
                    <div
                        v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
                        class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer"
                        @click="showWorldDialog(currentUser.homeLocation)">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.home_location')
                            }}</span>
                            <span class="block truncate text-xs">
                                <span v-text="userDialog.$homeLocationName"></span>
                                <Button
                                    class="rounded-full ml-1 text-xs"
                                    size="icon-sm"
                                    variant="ghost"
                                    @click.stop="resetHome()"
                                    ><Trash2 class="h-4 w-4" />
                                </Button>
                            </span>
                        </div>
                    </div>
                    <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.user.info.id')
                            }}</span>
                            <span class="block truncate text-xs">
                                {{ userDialog.id }}
                                <TooltipWrapper side="top" :content="t('dialog.user.info.id_tooltip')">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger as-child>
                                            <Button
                                                class="rounded-full ml-1 text-xs"
                                                size="icon-sm"
                                                variant="ghost"
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
                <UserDialogMutualFriendsTab ref="mutualFriendsTabRef" />
            </template>

            <template #Groups>
                <UserDialogGroupsTab ref="groupsTabRef" />
            </template>

            <template #Worlds>
                <UserDialogWorldsTab ref="worldsTabRef" />
            </template>

            <template #favorite-worlds>
                <UserDialogFavoriteWorldsTab ref="favoriteWorldsTabRef" />
            </template>

            <template #Avatars>
                <UserDialogAvatarsTab ref="avatarsTabRef" />
            </template>

            <template #JSON>
                <DialogJsonTab
                    :tree-data="treeData"
                    :tree-data-key="treeData?.id"
                    :dialog-id="userDialog.id"
                    :dialog-ref="userDialog.ref"
                    @refresh="refreshUserDialogTreeData()" />
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
    import { Input } from '@/components/ui/input';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import DeprecationAlert from '@/components/DeprecationAlert.vue';
    import VueJsonPretty from 'vue-json-pretty';

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
        useNotificationStore,
        useUiStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import {
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
        favoriteRequest,
        friendRequest,
        miscRequest,
        notificationRequest,
        playerModerationRequest,
        userRequest,
        worldRequest
    } from '../../../api';
    import { database } from '../../../service/database';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { processBulk } from '../../../service/request';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import InstanceActionBar from '../../InstanceActionBar.vue';
    import SendInviteDialog from '../InviteDialog/SendInviteDialog.vue';
    import UserDialogAvatarsTab from './UserDialogAvatarsTab.vue';
    import UserDialogFavoriteWorldsTab from './UserDialogFavoriteWorldsTab.vue';
    import UserDialogGroupsTab from './UserDialogGroupsTab.vue';
    import UserDialogMutualFriendsTab from './UserDialogMutualFriendsTab.vue';
    import UserDialogWorldsTab from './UserDialogWorldsTab.vue';
    import UserSummaryHeader from './UserSummaryHeader.vue';

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
    const favoriteWorldsTabRef = ref(null);
    const mutualFriendsTabRef = ref(null);
    const worldsTabRef = ref(null);
    const avatarsTabRef = ref(null);
    const groupsTabRef = ref(null);

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { hideUserNotes, hideUserMemos, isDarkMode } = storeToRefs(useAppearanceSettingsStore());
    const { bioLanguage, translationApi, translationApiType } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { userDialog, languageDialog, currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const {
        cachedUsers,
        showUserDialog,
        refreshUserDialogAvatars,
        showSendBoopDialog,
        toggleSharedConnectionsOptOut,
        toggleDiscordFriendsOptOut
    } = useUserStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showAvatarDialog, showAvatarAuthorDialog } = useAvatarStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog, showModerateGroupDialog } = useGroupStore();
    const { inviteGroupDialog } = storeToRefs(useGroupStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { friendLogTable } = storeToRefs(useFriendStore());
    const { getFriendRequest, handleFriendDelete } = useFriendStore();
    const { clearInviteImageUpload, showFullscreenImageDialog, showGalleryPage } = useGalleryStore();

    const { applyPlayerModeration, handlePlayerModerationDelete } = useModerationStore();

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

    const userDialogLastMutualFriends = ref('');
    const userDialogLastGroup = ref('');
    const userDialogLastAvatar = ref('');
    const userDialogLastWorld = ref('');
    const userDialogLastFavoriteWorld = ref('');

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
    const treeData = ref({});

    /**
     *
     * @param user
     */
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

    /**
     *
     * @param status
     */
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

    /**
     *
     */
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

    /**
     *
     * @param tabName
     */
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
                mutualFriendsTabRef.value?.getUserMutualFriends(userId);
            }
        } else if (tabName === 'Groups') {
            if (userDialogLastGroup.value !== userId) {
                userDialogLastGroup.value = userId;
                groupsTabRef.value?.getUserGroups(userId);
            }
        } else if (tabName === 'Avatars') {
            avatarsTabRef.value?.setUserDialogAvatars(userId);
            if (userDialogLastAvatar.value !== userId) {
                userDialogLastAvatar.value = userId;
                if (userId === currentUser.value.id) {
                    refreshUserDialogAvatars();
                } else {
                    avatarsTabRef.value?.setUserDialogAvatarsRemote(userId);
                }
            }
        } else if (tabName === 'Worlds') {
            worldsTabRef.value?.setUserDialogWorlds(userId);
            if (userDialogLastWorld.value !== userId) {
                userDialogLastWorld.value = userId;
                worldsTabRef.value?.refreshUserDialogWorlds();
            }
        } else if (tabName === 'favorite-worlds') {
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
                favoriteWorldsTabRef.value?.getUserFavoriteWorlds(userId);
            }
        } else if (tabName === 'JSON') {
            refreshUserDialogTreeData();
        }
    }

    /**
     *
     */
    function loadLastActiveTab() {
        handleUserDialogTab(userDialog.value.lastActiveTab);
    }

    /**
     *
     * @param tabName
     */
    function userDialogTabClick(tabName) {
        if (tabName === userDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshUserDialogTreeData();
            }
            return;
        }
        handleUserDialogTab(tabName);
    }

    /**
     *
     */
    function showPronounsDialog() {
        const D = pronounsDialog.value;
        D.pronouns = currentUser.value.pronouns;
        D.visible = true;
    }

    /**
     *
     */
    function showLanguageDialog() {
        const D = languageDialog.value;
        D.visible = true;
    }

    /**
     *
     */
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

    /**
     *
     * @param badge
     */
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

    /**
     *
     * @param badge
     */
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

    /**
     *
     * @param args
     */
    function handleBadgeUpdate(args) {
        if (args.json) {
            toast.success(t('message.badge.updated'));
        }
    }

    /**
     *
     * @param userId
     * @param type
     */
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

    /**
     *
     * @param params
     * @param userId
     */
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

    /**
     *
     * @param params
     * @param userId
     */
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

    /**
     *
     * @param groupId
     * @param userId
     */
    function showInviteGroupDialog(groupId, userId) {
        inviteGroupDialog.value.groupId = groupId;
        inviteGroupDialog.value.userId = userId;
        inviteGroupDialog.value.visible = true;
    }

    /**
     *
     * @param command
     */
    function userDialogCommand(command) {
        let L;
        const D = userDialog.value;
        if (D.visible === false) {
            return;
        }
        if (command === 'Refresh') {
            const userId = D.id;
            D.id = '';
            showUserDialog(userId);
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

    /**
     *
     * @param args
     */
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

    /**
     *
     * @param args
     */
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

    /**
     *
     * @param args
     */
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

    /**
     *
     * @param command
     * @param userId
     */
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
                    notificationRequest
                        .acceptFriendRequestNotification({
                            notificationId: key
                        })
                        .then((args) => {
                            useNotificationStore().handleNotificationAccept(args);
                        })
                        .catch((err) => {
                            if (err && err.message && err.message.includes('404')) {
                                useNotificationStore().handleNotificationHide(key);
                            }
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
                    notificationRequest
                        .hideNotification({
                            notificationId: key
                        })
                        .then(() => {
                            useNotificationStore().handleNotificationHide(key);
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

    /**
     *
     * @param userId
     */
    function reportUserForHacking(userId) {
        miscRequest.reportUser({
            userId,
            contentType: 'user',
            reason: 'behavior-hacking',
            type: 'report'
        });
    }

    /**
     *
     */
    function showBioDialog() {
        const D = bioDialog.value;
        D.bio = currentUser.value.bio;
        D.bioLinks = currentUser.value.bioLinks.slice();
        D.visible = true;
    }

    /**
     *
     */
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

    /**
     *
     * @param userRef
     */
    function showPreviousInstancesListDialog(userRef) {
        instanceStore.showPreviousInstancesListDialog('user', userRef);
    }

    /**
     *
     */
    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({
            allowAvatarCopying: !currentUser.value.allowAvatarCopying
        });
    }

    /**
     *
     */
    function toggleAllowBooping() {
        userRequest.saveCurrentUser({
            isBoopingEnabled: !currentUser.value.isBoopingEnabled
        });
    }

    /**
     *
     */
    function resetHome() {
        modalStore
            .confirm({
                description: t('confirm.command_question', {
                    command: t('dialog.user.actions.reset_home')
                }),
                title: t('confirm.title')
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

    /**
     *
     * @param userId
     */
    function copyUserId(userId) {
        copyToClipboard(userId, 'User ID copied to clipboard');
    }

    /**
     *
     * @param userId
     */
    function copyUserURL(userId) {
        copyToClipboard(`https://vrchat.com/home/user/${userId}`, 'User URL copied to clipboard');
    }

    /**
     *
     * @param displayName
     */
    function copyUserDisplayName(displayName) {
        copyToClipboard(displayName, 'User DisplayName copied to clipboard');
    }

    /**
     *
     */
    function closeInviteDialog() {
        clearInviteImageUpload();
    }

    /**
     *
     */
    function getVRChatCredits() {
        miscRequest.getVRChatCredits().then((args) => (vrchatCredit.value = args.json?.balance));
    }
</script>
