<template>
    <el-dialog
        :z-index="userDialogIndex"
        class="x-dialog x-user-dialog"
        v-model="userDialog.visible"
        :show-close="false"
        width="770px">
        <div v-loading="userDialog.loading">
            <div style="display: flex">
                <img
                    v-if="
                        !userDialog.loading &&
                        (userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride)
                    "
                    class="x-link"
                    :src="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                    style="flex: none; height: 120px; width: 213.33px; border-radius: 12px; object-fit: cover"
                    @click="showFullscreenImageDialog(userDialog.ref.profilePicOverride)"
                    loading="lazy" />
                <img
                    v-else-if="!userDialog.loading"
                    class="x-link"
                    :src="userDialog.ref.currentAvatarThumbnailImageUrl"
                    style="flex: none; height: 120px; width: 160px; border-radius: 12px; object-fit: cover"
                    @click="showFullscreenImageDialog(userDialog.ref.currentAvatarImageUrl)"
                    loading="lazy" />

                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <el-tooltip v-if="userDialog.ref.status" placement="top">
                                <template #content>
                                    <span>{{ getUserStateText(userDialog.ref) }}</span>
                                </template>
                                <i class="x-user-status" :class="userStatusClass(userDialog.ref)"></i>
                            </el-tooltip>
                            <template v-if="userDialog.previousDisplayNames.length > 0">
                                <el-tooltip placement="bottom">
                                    <template #content>
                                        <span>{{ t('dialog.user.previous_display_names') }}</span>
                                        <div
                                            v-for="displayName in userDialog.previousDisplayNames"
                                            :key="displayName"
                                            placement="top">
                                            <span v-text="displayName"></span>
                                        </div>
                                    </template>
                                    <el-icon><CaretBottom /></el-icon>
                                </el-tooltip>
                            </template>
                            <span
                                class="dialog-title"
                                style="margin-left: 5px; margin-right: 5px; cursor: pointer"
                                v-text="userDialog.ref.displayName"
                                @click="copyUserDisplayName(userDialog.ref.displayName)"></span>
                            <el-tooltip
                                v-if="userDialog.ref.pronouns"
                                placement="top"
                                :content="t('dialog.user.pronouns')">
                                <span
                                    class="x-grey"
                                    style="margin-right: 5px; font-family: monospace; font-size: 12px"
                                    v-text="userDialog.ref.pronouns"></span>
                            </el-tooltip>
                            <el-tooltip v-for="item in userDialog.ref.$languages" :key="item.key" placement="top">
                                <template #content>
                                    <span>{{ item.value }} ({{ item.key }})</span>
                                </template>
                                <span
                                    class="flags"
                                    :class="languageClass(item.key)"
                                    style="display: inline-block; margin-right: 5px"></span>
                            </el-tooltip>
                            <template v-if="userDialog.ref.id === currentUser.id">
                                <br />
                                <span
                                    class="x-grey"
                                    style="margin-right: 10px; font-family: monospace; font-size: 12px; cursor: pointer"
                                    v-text="currentUser.username"
                                    @click="copyUserDisplayName(currentUser.username)"></span>
                            </template>
                        </div>
                        <div style="margin-top: 5px" v-show="!userDialog.loading">
                            <el-tag
                                type="info"
                                effect="plain"
                                size="small"
                                class="name"
                                :class="userDialog.ref.$trustClass"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.$trustLevel }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.isFriend && userDialog.friend"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-friend"
                                style="margin-right: 5px; margin-top: 5px">
                                {{
                                    t('dialog.user.tags.friend_no', {
                                        number: userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : ''
                                    })
                                }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isTroll"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isProbableTroll"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Almost Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isModerator"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-vip"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.user.tags.vrchat_team') }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$platform === 'standalonewindows'"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-platform-pc"
                                style="margin-right: 5px; margin-top: 5px">
                                PC
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.$platform === 'android'"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-platform-quest"
                                style="margin-right: 5px; margin-top: 5px">
                                Android
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.$platform === 'ios'"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-platform-ios"
                                style="margin-right: 5px; margin-top: 5px"
                                >iOS</el-tag
                            >
                            <el-tag
                                v-else-if="userDialog.ref.$platform"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-platform-other"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.$platform }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.ageVerified && userDialog.ref.ageVerificationStatus"
                                type="info"
                                effect="plain"
                                size="small"
                                class="x-tag-age-verification"
                                style="margin-right: 5px; margin-top: 5px">
                                <template v-if="userDialog.ref.ageVerificationStatus === '18+'">
                                    {{ t('dialog.user.tags.18_plus_verified') }}
                                </template>
                                <template v-else>
                                    {{ t('dialog.user.tags.age_verified') }}
                                </template>
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$customTag"
                                type="info"
                                effect="plain"
                                size="small"
                                class="name"
                                :style="{
                                    color: userDialog.ref.$customTagColour,
                                    'border-color': userDialog.ref.$customTagColour
                                }"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ userDialog.ref.$customTag }}</el-tag
                            >
                            <br />
                            <el-tooltip v-for="badge in userDialog.ref.badges" :key="badge.badgeId" placement="top">
                                <template #content>
                                    <span>{{ badge.badgeName }}</span>
                                    <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                                </template>
                                <div style="display: inline-block">
                                    <el-popover placement="bottom" :width="300" trigger="click">
                                        <template #reference>
                                            <img
                                                class="x-link x-user-badge"
                                                :src="badge.badgeImageUrl"
                                                style="
                                                    flex: none;
                                                    height: 32px;
                                                    width: 32px;
                                                    border-radius: 3px;
                                                    object-fit: cover;
                                                    margin-top: 5px;
                                                    margin-right: 5px;
                                                "
                                                :class="{ 'x-user-badge-hidden': badge.hidden }"
                                                loading="lazy" />
                                        </template>
                                        <img
                                            :src="badge.badgeImageUrl"
                                            :class="['x-link', 'x-popover-image']"
                                            @click="showFullscreenImageDialog(badge.badgeImageUrl)"
                                            loading="lazy" />
                                        <br />
                                        <div style="display: block; width: 300px; word-break: normal">
                                            <span>{{ badge.badgeName }}</span>
                                            <br />
                                            <span class="x-grey" style="font-size: 12px">{{
                                                badge.badgeDescription
                                            }}</span>
                                            <br />
                                            <span
                                                v-if="badge.assignedAt"
                                                class="x-grey"
                                                style="font-family: monospace; font-size: 12px">
                                                {{ t('dialog.user.badges.assigned') }}:
                                                {{ formatDateFilter(badge.assignedAt, 'long') }}
                                            </span>
                                            <template v-if="userDialog.id === currentUser.id">
                                                <br />
                                                <el-checkbox
                                                    v-model="badge.hidden"
                                                    style="margin-top: 5px"
                                                    @change="toggleBadgeVisibility(badge)">
                                                    {{ t('dialog.user.badges.hidden') }}
                                                </el-checkbox>
                                                <br />
                                                <el-checkbox
                                                    v-model="badge.showcased"
                                                    @change="toggleBadgeShowcased(badge)">
                                                    {{ t('dialog.user.badges.showcased') }}
                                                </el-checkbox>
                                            </template>
                                        </div>
                                    </el-popover>
                                </div>
                            </el-tooltip>
                        </div>
                        <div style="margin-top: 5px">
                            <span style="font-size: 12px" v-text="userDialog.ref.statusDescription"></span>
                        </div>
                    </div>

                    <div v-if="userDialog.ref.userIcon" style="flex: none; margin-right: 10px">
                        <img
                            class="x-link"
                            :src="userImage(userDialog.ref, true, '256', true)"
                            style="flex: none; width: 120px; height: 120px; border-radius: 12px; object-fit: cover"
                            @click="showFullscreenImageDialog(userDialog.ref.userIcon)"
                            loading="lazy" />
                    </div>

                    <div style="flex: none">
                        <template
                            v-if="
                                (currentUser.id !== userDialog.ref.id && userDialog.isFriend) || userDialog.isFavorite
                            ">
                            <el-tooltip
                                v-if="userDialog.isFavorite"
                                placement="top"
                                :content="t('dialog.user.actions.unfavorite_tooltip')">
                                <el-button
                                    type="warning"
                                    :icon="StarFilled"
                                    size="large"
                                    circle
                                    @click="userDialogCommand('Add Favorite')"></el-button>
                            </el-tooltip>
                            <el-tooltip v-else placement="top" :content="t('dialog.user.actions.favorite_tooltip')">
                                <el-button
                                    type="default"
                                    :icon="Star"
                                    size="large"
                                    circle
                                    @click="userDialogCommand('Add Favorite')"></el-button>
                            </el-tooltip>
                        </template>
                        <el-dropdown trigger="click" size="small" @command="userDialogCommand">
                            <el-button
                                :type="
                                    userDialog.incomingRequest || userDialog.outgoingRequest
                                        ? 'success'
                                        : userDialog.isBlock || userDialog.isMute
                                          ? 'danger'
                                          : 'default'
                                "
                                :icon="MoreFilled"
                                size="large"
                                circle
                                style="margin-left: 5px"></el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item :icon="Refresh" command="Refresh">{{
                                        t('dialog.user.actions.refresh')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item :icon="Share" command="Share">{{
                                        t('dialog.user.actions.share')
                                    }}</el-dropdown-item>
                                    <template v-if="userDialog.ref.id === currentUser.id">
                                        <el-dropdown-item :icon="Picture" command="Manage Gallery" divided>{{
                                            t('dialog.user.actions.manage_gallery_inventory_icon')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="UserFilled" command="Show Avatar Author">{{
                                            t('dialog.user.actions.show_avatar_author')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="UserFilled" command="Show Fallback Avatar Details">{{
                                            t('dialog.user.actions.show_fallback_avatar')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Edit Social Status" divided>{{
                                            t('dialog.user.actions.edit_status')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Edit Language">{{
                                            t('dialog.user.actions.edit_language')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Edit Bio">{{
                                            t('dialog.user.actions.edit_bio')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Edit Pronouns">{{
                                            t('dialog.user.actions.edit_pronouns')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="SwitchButton" command="Logout" divided>{{
                                            t('dialog.user.actions.logout')
                                        }}</el-dropdown-item>
                                    </template>
                                    <template v-else>
                                        <template v-if="userDialog.isFriend">
                                            <el-dropdown-item :icon="Postcard" command="Request Invite" divided>{{
                                                t('dialog.user.actions.request_invite')
                                            }}</el-dropdown-item>
                                            <el-dropdown-item :icon="Postcard" command="Request Invite Message">{{
                                                t('dialog.user.actions.request_invite_with_message')
                                            }}</el-dropdown-item>
                                            <template v-if="isGameRunning">
                                                <el-dropdown-item
                                                    :disabled="!checkCanInvite(lastLocation.location)"
                                                    :icon="Message"
                                                    command="Invite"
                                                    >{{ t('dialog.user.actions.invite') }}</el-dropdown-item
                                                >
                                                <el-dropdown-item
                                                    :disabled="!checkCanInvite(lastLocation.location)"
                                                    :icon="Message"
                                                    command="Invite Message"
                                                    >{{
                                                        t('dialog.user.actions.invite_with_message')
                                                    }}</el-dropdown-item
                                                >
                                            </template>
                                        </template>
                                        <template v-else-if="userDialog.incomingRequest">
                                            <el-dropdown-item :icon="Check" command="Accept Friend Request">{{
                                                t('dialog.user.actions.accept_friend_request')
                                            }}</el-dropdown-item>
                                            <el-dropdown-item :icon="Close" command="Decline Friend Request">{{
                                                t('dialog.user.actions.decline_friend_request')
                                            }}</el-dropdown-item>
                                        </template>
                                        <el-dropdown-item
                                            v-else-if="userDialog.outgoingRequest"
                                            :icon="Close"
                                            command="Cancel Friend Request">
                                            {{ t('dialog.user.actions.cancel_friend_request') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item v-else :icon="Plus" command="Send Friend Request">{{
                                            t('dialog.user.actions.send_friend_request')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Message" command="Invite To Group">{{
                                            t('dialog.user.actions.invite_to_group')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Operation" command="Group Moderation">{{
                                            t('dialog.user.actions.group_moderation')
                                        }}</el-dropdown-item>
                                        <!--//- el-dropdown-item(:icon="Thumb" command="Send Boop" :disabled="!currentUser.isBoopingEnabled") {{ t('dialog.user.actions.send_boop') }}-->
                                        <el-dropdown-item :icon="UserFilled" command="Show Avatar Author" divided>{{
                                            t('dialog.user.actions.show_avatar_author')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="UserFilled" command="Show Fallback Avatar Details">{{
                                            t('dialog.user.actions.show_fallback_avatar')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="DataLine" command="Previous Instances">{{
                                            t('dialog.user.actions.show_previous_instances')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="userDialog.isBlock"
                                            :icon="CircleCheck"
                                            command="Moderation Unblock"
                                            divided
                                            style="color: #f56c6c">
                                            {{ t('dialog.user.actions.moderation_unblock') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-else
                                            :icon="CircleClose"
                                            command="Moderation Block"
                                            divided
                                            :disabled="userDialog.ref.$isModerator">
                                            {{ t('dialog.user.actions.moderation_block') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="userDialog.isMute"
                                            :icon="Microphone"
                                            command="Moderation Unmute"
                                            style="color: #f56c6c">
                                            {{ t('dialog.user.actions.moderation_unmute') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-else
                                            :icon="Mute"
                                            command="Moderation Mute"
                                            :disabled="userDialog.ref.$isModerator">
                                            {{ t('dialog.user.actions.moderation_mute') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="userDialog.isMuteChat"
                                            :icon="ChatLineRound"
                                            command="Moderation Enable Chatbox"
                                            style="color: #f56c6c">
                                            {{ t('dialog.user.actions.moderation_enable_chatbox') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-else
                                            :icon="ChatDotRound"
                                            command="Moderation Disable Chatbox">
                                            {{ t('dialog.user.actions.moderation_disable_chatbox') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item :icon="User" command="Show Avatar">
                                            <el-icon v-if="userDialog.isShowAvatar" style="margin-right: 5px"
                                                ><Check
                                            /></el-icon>
                                            <span>{{ t('dialog.user.actions.moderation_show_avatar') }}</span>
                                        </el-dropdown-item>
                                        <el-dropdown-item :icon="User" command="Hide Avatar">
                                            <el-icon v-if="userDialog.isHideAvatar" style="margin-right: 5px"
                                                ><Check
                                            /></el-icon>
                                            <span>{{ t('dialog.user.actions.moderation_hide_avatar') }}</span>
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="userDialog.isInteractOff"
                                            :icon="Pointer"
                                            command="Moderation Enable Avatar Interaction"
                                            style="color: #f56c6c">
                                            {{ t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            v-else
                                            :icon="CircleClose"
                                            command="Moderation Disable Avatar Interaction">
                                            {{ t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            :icon="Flag"
                                            command="Report Hacking"
                                            :disabled="userDialog.ref.$isModerator">
                                            {{ t('dialog.user.actions.report_hacking') }}
                                        </el-dropdown-item>
                                        <template v-if="userDialog.isFriend">
                                            <el-dropdown-item
                                                :icon="Delete"
                                                command="Unfriend"
                                                divided
                                                style="color: #f56c6c">
                                                {{ t('dialog.user.actions.unfriend') }}
                                            </el-dropdown-item>
                                        </template>
                                    </template>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </div>

            <el-tabs v-model="userDialogLastActiveTab" @tab-click="userDialogTabClick">
                <el-tab-pane name="Info" :label="t('dialog.user.info.header')">
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
                                    <Launch :location="userDialog.$location.tag" />
                                    <InviteYourself
                                        :location="userDialog.$location.tag"
                                        :shortname="userDialog.$location.shortName"
                                        style="margin-left: 5px" />
                                    <el-tooltip placement="top" :content="t('dialog.user.info.refresh_instance_info')"
                                        ><el-button
                                            size="small"
                                            :icon="Refresh"
                                            style="margin-left: 5px"
                                            circle
                                            @click="refreshInstancePlayerCount(userDialog.$location.tag)"></el-button>
                                    </el-tooltip>
                                    <LastJoin
                                        :location="userDialog.$location.tag"
                                        :currentlocation="lastLocation.location" />
                                    <InstanceInfo
                                        :location="userDialog.$location.tag"
                                        :instance="userDialog.instance.ref"
                                        :friendcount="userDialog.instance.friendCount" />
                                </template>
                                <Location
                                    :location="userDialog.ref.location"
                                    :traveling="userDialog.ref.travelingToLocation"
                                    style="display: block; margin-top: 5px" />
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
                    </template>

                    <div class="x-friend-list" style="max-height: none">
                        <div v-if="!hideUserNotes" class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.note') }}</span>
                                <el-input
                                    v-model="userDialog.note"
                                    class="extra"
                                    type="textarea"
                                    maxlength="256"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="t('dialog.user.info.note_placeholder')"
                                    size="small"
                                    resize="none"
                                    @change="checkNote(userDialog.ref, userDialog.note)"
                                    @input="cleanNote(userDialog.note)"></el-input>
                                <div style="float: right">
                                    <el-icon v-if="userDialog.noteSaving" class="is-loading" style="margin-left: 5px"
                                        ><Loading
                                    /></el-icon>
                                    <el-icon
                                        v-else-if="userDialog.note !== userDialog.ref.note"
                                        style="margin-left: 5px"
                                        ><More
                                    /></el-icon>
                                    <el-button
                                        v-if="userDialog.note"
                                        type="text"
                                        :icon="Delete"
                                        size="small"
                                        style="margin-left: 5px; padding: 0"
                                        @click="deleteNote(userDialog.id)"></el-button>
                                </div>
                            </div>
                        </div>
                        <div v-if="!hideUserMemos" class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.memo') }}</span>
                                <el-input
                                    v-model="userDialog.memo"
                                    class="extra"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="t('dialog.user.info.memo_placeholder')"
                                    size="small"
                                    resize="none"
                                    @change="onUserMemoChange"></el-input>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span
                                    v-if="
                                        userDialog.id !== currentUser.id &&
                                        userDialog.ref.profilePicOverride &&
                                        userDialog.ref.currentAvatarImageUrl
                                    "
                                    class="name">
                                    {{ t('dialog.user.info.avatar_info_last_seen') }}
                                </span>
                                <span v-else class="name">{{ t('dialog.user.info.avatar_info') }}</span>
                                <div class="extra">
                                    <AvatarInfo
                                        :imageurl="userDialog.ref.currentAvatarImageUrl"
                                        :userid="userDialog.id"
                                        :avatartags="userDialog.ref.currentAvatarTags"
                                        style="display: inline-block" />
                                    <el-tooltip
                                        v-if="
                                            userDialog.ref.profilePicOverride && !userDialog.ref.currentAvatarImageUrl
                                        "
                                        placement="top"
                                        :content="t('dialog.user.info.vrcplus_hides_avatar')">
                                        <el-icon><Warning /></el-icon>
                                    </el-tooltip>
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
                                        <el-image
                                            v-loading="userDialog.isRepresentedGroupLoading"
                                            class="x-link"
                                            :src="userDialog.representedGroup.$thumbnailUrl"
                                            style="
                                                flex: none;
                                                width: 60px;
                                                height: 60px;
                                                border-radius: 4px;
                                                object-fit: cover;
                                            "
                                            :style="{
                                                background: userDialog.isRepresentedGroupLoading ? '#f5f7fa' : ''
                                            }"
                                            @load="userDialog.isRepresentedGroupLoading = false"
                                            @click="showFullscreenImageDialog(userDialog.representedGroup.iconUrl)">
                                            <template #error></template>
                                        </el-image>
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
                                        <span
                                            style="margin-right: 5px"
                                            v-text="userDialog.representedGroup.name"></span>
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
                                    class="extra"
                                    style="
                                        font-family: inherit;
                                        font-size: 12px;
                                        white-space: pre-wrap;
                                        margin: 0 0.5em 0 0;
                                        max-height: 40vh;
                                        overflow-y: auto;
                                    "
                                    >{{ userDialog.ref.bio || '-' }}</pre
                                >
                                <div v-if="userDialog.id === currentUser.id" style="float: right">
                                    <el-button
                                        type="text"
                                        :icon="Edit"
                                        size="small"
                                        style="margin-left: 5px"
                                        @click="showBioDialog"></el-button>
                                </div>
                                <div style="margin-top: 5px">
                                    <el-tooltip v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
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
                                    </el-tooltip>
                                </div>
                            </div>
                        </div>
                        <template v-if="currentUser.id !== userDialog.id">
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.user.info.last_seen') }}
                                        <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                            <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ formatDateFilter(userDialog.lastSeen, 'long') }}</span>
                                </div>
                            </div>

                            <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                <div class="detail">
                                    <div
                                        class="name"
                                        style="display: flex; justify-content: space-between; align-items: center">
                                        <div>
                                            {{ t('dialog.user.info.join_count') }}
                                            <el-tooltip
                                                placement="top"
                                                :content="t('dialog.user.info.accuracy_notice')">
                                                <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                            </el-tooltip>
                                        </div>

                                        <el-tooltip
                                            placement="top"
                                            :content="t('dialog.user.info.open_previous_instance')">
                                            <el-icon style="margin-right: 16px"><MoreFilled /></el-icon>
                                        </el-tooltip>
                                    </div>
                                    <span v-if="userDialog.joinCount === 0" class="extra">-</span>
                                    <span v-else class="extra" v-text="userDialog.joinCount"></span>
                                </div>
                            </div>

                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.user.info.time_together') }}
                                        <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                            <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                        </el-tooltip>
                                    </span>
                                    <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                    <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <el-tooltip
                                :disabled="currentUser.id !== userDialog.id"
                                placement="top"
                                :content="t('dialog.user.info.open_previous_instance')">
                                <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                    <div class="detail">
                                        <span class="name">
                                            {{ t('dialog.user.info.play_time') }}
                                            <el-tooltip
                                                placement="top"
                                                :content="t('dialog.user.info.accuracy_notice')">
                                                <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                            </el-tooltip>
                                        </span>
                                        <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                        <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                                    </div>
                                </div>
                            </el-tooltip>
                        </template>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                                <template #content>
                                    <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'short') }}</span>
                                </template>
                                <div class="detail">
                                    <span
                                        v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for"
                                        class="name">
                                        {{ t('dialog.user.info.online_for') }}
                                        <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                            <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                        </el-tooltip>
                                    </span>
                                    <span v-else class="name">
                                        {{ t('dialog.user.info.offline_for') }}
                                        <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                            <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userOnlineFor(userDialog) }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
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
                            </el-tooltip>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.date_joined') }}</span>
                                <span class="extra" v-text="userDialog.ref.date_joined"></span>
                            </div>
                        </div>
                        <div v-if="currentUser.id !== userDialog.id" class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span v-if="userDialog.unFriended" class="name">
                                    {{ t('dialog.user.info.unfriended') }}
                                    <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                        <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                    </el-tooltip>
                                </span>
                                <span v-else class="name">
                                    {{ t('dialog.user.info.friended') }}
                                    <el-tooltip placement="top" :content="t('dialog.user.info.accuracy_notice')">
                                        <el-icon style="margin-left: 3px"><Warning /></el-icon>
                                    </el-tooltip>
                                </span>
                                <span class="extra">{{ formatDateFilter(userDialog.dateFriended, 'long') }}</span>
                            </div>
                        </div>
                        <template v-if="currentUser.id === userDialog.id">
                            <div class="x-friend-item" @click="toggleAvatarCopying">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.user.info.avatar_cloning') }}</span>
                                    <span v-if="currentUser.allowAvatarCopying" class="extra" style="color: #67c23a">{{
                                        t('dialog.user.info.avatar_cloning_allow')
                                    }}</span>
                                    <span v-else class="extra" style="color: #f56c6c">{{
                                        t('dialog.user.info.avatar_cloning_deny')
                                    }}</span>
                                </div>
                            </div>
                            <!--//- .x-friend-item(@click="toggleAllowBooping")-->
                            <!--//-     .detail-->
                            <!--//-         span.name {{ t('dialog.user.info.booping') }}-->
                            <!--//-         span.extra(v-if="currentUser.isBoopingEnabled" style="color:#67C23A") {{ t('dialog.user.info.avatar_cloning_allow') }}-->
                            <!--//-         span.extra(v-else style="color:#F56C6C") {{ t('dialog.user.info.avatar_cloning_deny') }}-->
                        </template>
                        <template v-else>
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.user.info.avatar_cloning') }}</span>
                                    <span
                                        v-if="userDialog.ref.allowAvatarCopying"
                                        class="extra"
                                        style="color: #67c23a"
                                        >{{ t('dialog.user.info.avatar_cloning_allow') }}</span
                                    >
                                    <span v-else class="extra" style="color: #f56c6c">{{
                                        t('dialog.user.info.avatar_cloning_deny')
                                    }}</span>
                                </div>
                            </div>
                        </template>
                        <div
                            v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
                            class="x-friend-item"
                            style="width: 100%"
                            @click="showWorldDialog(currentUser.homeLocation)">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.home_location') }}</span>
                                <span class="extra">
                                    <span v-text="userDialog.$homeLocationName"></span>
                                    <el-button
                                        size="small"
                                        :icon="Delete"
                                        circle
                                        style="margin-left: 5px"
                                        @click.stop="resetHome()">
                                    </el-button>
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.id') }}</span>
                                <span class="extra">
                                    {{ userDialog.id }}
                                    <el-tooltip placement="top" :content="t('dialog.user.info.id_tooltip')">
                                        <el-dropdown trigger="click" size="small" style="margin-left: 5px" @click.stop>
                                            <el-button
                                                type="default"
                                                :icon="CopyDocument"
                                                size="small"
                                                circle></el-button>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item @click="copyUserId(userDialog.id)">{{
                                                        t('dialog.user.info.copy_id')
                                                    }}</el-dropdown-item>
                                                    <el-dropdown-item @click="copyUserURL(userDialog.id)">{{
                                                        t('dialog.user.info.copy_url')
                                                    }}</el-dropdown-item>
                                                    <el-dropdown-item
                                                        @click="copyUserDisplayName(userDialog.ref.displayName)"
                                                        >{{ t('dialog.user.info.copy_display_name') }}</el-dropdown-item
                                                    >
                                                </el-dropdown-menu>
                                            </template>
                                        </el-dropdown>
                                    </el-tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Groups" :label="t('dialog.user.groups.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isGroupsLoading"
                                size="small"
                                :icon="Refresh"
                                circle
                                @click="getUserGroups(userDialog.id)">
                            </el-button>
                            <span style="margin-left: 5px">{{
                                t('dialog.user.groups.total_count', { count: userGroups.groups.length })
                            }}</span>
                            <template v-if="userDialogGroupEditMode">
                                <span style="margin-left: 10px; color: #909399; font-size: 10px">{{
                                    t('dialog.user.groups.hold_shift')
                                }}</span>
                            </template>
                        </div>
                        <div style="display: flex; align-items: center">
                            <template v-if="!userDialogGroupEditMode">
                                <span style="margin-right: 5px">{{ t('dialog.user.groups.sort_by') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isGroupsLoading"
                                    @click.stop>
                                    <el-button size="small">
                                        <span
                                            >{{ t(userDialog.groupSorting.name) }}
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon>
                                        </span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item
                                                v-for="(item, key) in userDialogGroupSortingOptions"
                                                :key="key"
                                                :disabled="
                                                    item === userDialogGroupSortingOptions.inGame &&
                                                    userDialog.id !== currentUser.id
                                                "
                                                @click="setUserDialogGroupSorting(item)"
                                                >{{ t(item.name) }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </template>
                            <el-button
                                v-if="userDialogGroupEditMode"
                                size="small"
                                :icon="Edit"
                                style="margin-right: 5px; height: 29px; padding: 7px 15px"
                                @click="exitEditModeCurrentUserGroups">
                                {{ t('dialog.user.groups.exit_edit_mode') }}
                            </el-button>
                            <el-button
                                v-else-if="currentUser.id === userDialog.id"
                                size="small"
                                :icon="Edit"
                                style="margin-right: 5px; height: 29px; padding: 7px 15px"
                                @click="editModeCurrentUserGroups">
                                {{ t('dialog.user.groups.edit_mode') }}
                            </el-button>
                        </div>
                    </div>
                    <div v-loading="userDialog.isGroupsLoading" style="margin-top: 10px">
                        <template v-if="userDialogGroupEditMode">
                            <div class="x-friend-list" style="margin-top: 10px; margin-bottom: 15px; max-height: unset">
                                <!-- Bulk actions dropdown (shown only in edit mode) -->
                                <el-dropdown trigger="click">
                                    <el-button
                                        size="small"
                                        :icon="Setting"
                                        style="margin-right: 5px; height: 29px; padding: 7px 15px; margin-bottom: 5px">
                                        {{ t('dialog.group.actions.manage_selected') }}
                                        <el-icon style="margin-left: 5px"><ArrowDown /></el-icon>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="bulkSetVisibility('visible')">
                                                {{ t('dialog.group.actions.visibility_everyone') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="bulkSetVisibility('friends')">
                                                {{ t('dialog.group.actions.visibility_friends') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="bulkSetVisibility('hidden')">
                                                {{ t('dialog.group.actions.visibility_hidden') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item divided @click="bulkLeaveGroups">
                                                <el-icon><Delete /></el-icon>
                                                {{ t('dialog.user.groups.leave_group_tooltip') }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>

                                <!-- Select All button -->
                                <el-button
                                    size="small"
                                    :icon="userDialogGroupAllSelected ? Close : Check"
                                    style="height: 29px; padding: 7px 15px; margin-bottom: 5px"
                                    @click="selectAllGroups">
                                    {{
                                        userDialogGroupAllSelected
                                            ? t('dialog.group.actions.deselect_all')
                                            : t('dialog.group.actions.select_all')
                                    }}
                                </el-button>

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
                                        <el-checkbox
                                            :checked="userDialogGroupEditSelectedGroupIds.includes(group.id)"
                                            @change="() => toggleGroupSelection(group.id)" />
                                    </div>

                                    <div style="margin-right: 3px; margin-left: 5px" @click.stop>
                                        <el-button
                                            size="small"
                                            :icon="Download"
                                            style="
                                                display: block;
                                                padding: 7px;
                                                font-size: 9px;
                                                margin-left: 0;
                                                rotate: 180deg;
                                            "
                                            @click="moveGroupTop(group.id)">
                                        </el-button>
                                        <el-button
                                            size="small"
                                            :icon="Download"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupBottom(group.id)">
                                        </el-button>
                                    </div>
                                    <div style="margin-right: 10px" @click.stop>
                                        <el-button
                                            size="small"
                                            :icon="Top"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupUp(group.id)">
                                        </el-button>
                                        <el-button
                                            size="small"
                                            :icon="Bottom"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupDown(group.id)">
                                        </el-button>
                                    </div>
                                    <div class="avatar">
                                        <img :src="group.iconUrl" loading="lazy" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <span class="extra">
                                            <el-tooltip
                                                v-if="group.isRepresenting"
                                                placement="top"
                                                :content="t('dialog.group.members.representing')">
                                                <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                            </el-tooltip>
                                            <el-tooltip v-if="group.myMember.visibility !== 'visible'" placement="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ group.myMember.visibility }}</span
                                                    >
                                                </template>
                                                <el-icon style="margin-right: 5px"><View /></el-icon>
                                            </el-tooltip>
                                            <span>({{ group.memberCount }})</span>
                                        </span>
                                    </div>
                                    <el-dropdown
                                        :disabled="group.privacy !== 'default'"
                                        trigger="click"
                                        size="small"
                                        style="margin-right: 5px"
                                        @click.stop>
                                        <el-button size="small">
                                            <span v-if="group.myMember.visibility === 'visible'">{{
                                                t('dialog.group.tags.visible')
                                            }}</span>
                                            <span v-else-if="group.myMember.visibility === 'friends'">{{
                                                t('dialog.group.tags.friends')
                                            }}</span>
                                            <span v-else-if="group.myMember.visibility === 'hidden'">{{
                                                t('dialog.group.tags.hidden')
                                            }}</span>
                                            <span v-else>{{ group.myMember.visibility }}</span>
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon>
                                        </el-button>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item @click="setGroupVisibility(group.id, 'visible')">
                                                    <el-icon v-if="group.myMember.visibility === 'visible'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{
                                                        t('dialog.group.actions.visibility_everyone')
                                                    }}</el-dropdown-item
                                                >
                                                <el-dropdown-item @click="setGroupVisibility(group.id, 'friends')">
                                                    <el-icon v-if="group.myMember.visibility === 'friends'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{ t('dialog.group.actions.visibility_friends') }}</el-dropdown-item
                                                >
                                                <el-dropdown-item @click="setGroupVisibility(group.id, 'hidden')"
                                                    ><el-icon v-if="group.myMember.visibility === 'hidden'"
                                                        ><Check
                                                    /></el-icon>
                                                    {{ t('dialog.group.actions.visibility_hidden') }}</el-dropdown-item
                                                >
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                    <!--//- JSON is missing isSubscribedToAnnouncements, can't be implemented-->
                                    <!--//- el-dropdown(@click.native.stop trigger="click" size="small" style="margin-right:5px")-->
                                    <!--//-     el-tooltip(placement="top")-->
                                    <!--//-         template(#content)-->
                                    <!--//-             span(v-if="group.myMember.isSubscribedToAnnouncements") {{ t('dialog.group.actions.unsubscribe') }}-->
                                    <!--//-             span(v-else) {{ t('dialog.group.actions.subscribe') }}-->
                                    <!--//-         el-button(v-if="group.myMember.isSubscribedToAnnouncements" @click.stop="setGroupSubscription(group.id, false)" circle size="small")-->
                                    <!--//-             i.el-icon-chat-line-square-->
                                    <!--//-         el-button(v-else circle @click.stop="setGroupSubscription(group.id, true)" size="small")-->
                                    <!--//-             i.el-icon-chat-square(style="color:#f56c6c")-->
                                    <el-tooltip
                                        placement="right"
                                        :content="t('dialog.user.groups.leave_group_tooltip')">
                                        <el-button
                                            v-if="shiftHeld"
                                            size="small"
                                            :icon="Close"
                                            circle
                                            style="color: #f56c6c; margin-left: 5px"
                                            @click.stop="leaveGroup(group.id)">
                                        </el-button>
                                        <el-button
                                            v-else
                                            size="small"
                                            :icon="Delete"
                                            circle
                                            style="margin-left: 5px"
                                            @click.stop="leaveGroupPrompt(group.id)">
                                        </el-button>
                                    </el-tooltip>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <template v-if="userGroups.ownGroups.length > 0">
                                <span style="font-weight: bold; font-size: 16px">{{
                                    t('dialog.user.groups.own_groups')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px"
                                    >{{ userGroups.ownGroups.length }}/{{
                                        cachedConfig?.constants?.GROUPS?.MAX_OWNED
                                    }}</span
                                >
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
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
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <el-icon style="margin-right: 5px"><View /></el-icon>
                                                </el-tooltip>
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
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                    userGroups.mutualGroups.length
                                }}</span>
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
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
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <el-icon style="margin-right: 5px"><View /></el-icon>
                                                </el-tooltip>
                                                <span>({{ group.memberCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-if="userGroups.remainingGroups.length > 0">
                                <span style="font-weight: bold; font-size: 16px">{{
                                    t('dialog.user.groups.groups')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">
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
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px">
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
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <el-icon style="margin-right: 5px"><CollectionTag /></el-icon>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <el-icon style="margin-right: 5px"><View /></el-icon>
                                                </el-tooltip>
                                                <span>({{ group.memberCount }})</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Worlds" :label="t('dialog.user.worlds.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isWorldsLoading"
                                size="small"
                                :icon="Refresh"
                                circle
                                @click="refreshUserDialogWorlds()">
                            </el-button>
                            <span style="margin-left: 5px">{{
                                t('dialog.user.worlds.total_count', { count: userDialog.worlds.length })
                            }}</span>
                        </div>
                        <div style="display: flex; align-items: center">
                            <span style="margin-right: 5px">{{ t('dialog.user.worlds.sort_by') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="userDialog.isWorldsLoading"
                                @click.stop>
                                <el-button size="small">
                                    <span
                                        >{{ t(userDialog.worldSorting.name) }}
                                        <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                                    ></span>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item
                                            v-for="(item, key) in userDialogWorldSortingOptions"
                                            :key="key"
                                            @click="setUserDialogWorldSorting(item)">
                                            {{ t(item.name) }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                            <span style="margin: 0 5px">{{ t('dialog.user.worlds.order_by') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="userDialog.isWorldsLoading"
                                @click.stop>
                                <el-button size="small">
                                    <span
                                        >{{ t(userDialog.worldOrder.name) }}
                                        <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                                    ></span>
                                </el-button>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item
                                            v-for="(item, key) in userDialogWorldOrderOptions"
                                            :key="key"
                                            @click="setUserDialogWorldOrder(item)">
                                            {{ t(item.name) }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </div>
                    <div
                        v-loading="userDialog.isWorldsLoading"
                        class="x-friend-list"
                        style="margin-top: 10px; min-height: 60px">
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
                    </div>
                </el-tab-pane>

                <el-tab-pane name="Favorite Worlds" :label="t('dialog.user.favorite_worlds.header')" lazy>
                    <el-button
                        v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0"
                        type="default"
                        :loading="userDialog.isFavoriteWorldsLoading"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="position: absolute; right: 15px; bottom: 15px; z-index: 99"
                        @click="getUserFavoriteWorlds(userDialog.id)">
                    </el-button>
                    <el-tabs
                        ref="favoriteWorldsRef"
                        v-loading="userDialog.isFavoriteWorldsLoading"
                        class="zero-margin-tabs"
                        type="card"
                        stretch
                        style="margin-top: 10px; height: 50vh">
                        <template v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0">
                            <el-tab-pane v-for="(list, index) in userFavoriteWorlds" :key="index" lazy>
                                <template #label>
                                    <span>
                                        <i
                                            class="x-status-icon"
                                            style="margin-right: 6px"
                                            :class="userFavoriteWorldsStatus(list[1])">
                                        </i>
                                        <span style="font-weight: bold; font-size: 14px" v-text="list[0]"></span>
                                        <span style="color: #909399; font-size: 10px; margin-left: 5px"
                                            >{{ list[2].length }}/{{ favoriteLimits.maxFavoritesPerGroup.world }}</span
                                        >
                                    </span>
                                </template>
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
                            </el-tab-pane>
                        </template>
                        <template v-else-if="!userDialog.isFavoriteWorldsLoading">
                            <div style="display: flex; justify-content: center; align-items: center; height: 100%">
                                <span style="font-size: 16px">No favorite worlds found.</span>
                            </div>
                        </template>
                    </el-tabs>
                </el-tab-pane>

                <el-tab-pane name="Avatars" :label="t('dialog.user.avatars.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                v-if="userDialog.ref.id === currentUser.id"
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="small"
                                :icon="Refresh"
                                circle
                                @click="refreshUserDialogAvatars()">
                            </el-button>
                            <el-button
                                v-else
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="small"
                                :icon="Refresh"
                                circle
                                @click="setUserDialogAvatarsRemote(userDialog.id)">
                            </el-button>
                            <span style="margin-left: 5px">{{
                                t('dialog.user.avatars.total_count', { count: userDialogAvatars.length })
                            }}</span>
                        </div>
                        <div>
                            <template v-if="userDialog.ref.id === currentUser.id">
                                <span style="margin-right: 5px">{{ t('dialog.user.avatars.sort_by') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading"
                                    @click.stop>
                                    <el-button size="small">
                                        <span
                                            >{{ t(`dialog.user.avatars.sort_by_${userDialog.avatarSorting}`) }}
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                                        ></span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="changeUserDialogAvatarSorting('name')">
                                                {{ t('dialog.user.avatars.sort_by_name') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="changeUserDialogAvatarSorting('update')">
                                                {{ t('dialog.user.avatars.sort_by_update') }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                                <span style="margin-right: 5px; margin-left: 10px">{{
                                    t('dialog.user.avatars.group_by')
                                }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading"
                                    @click.stop>
                                    <el-button size="small">
                                        <span
                                            >{{ t(`dialog.user.avatars.${userDialog.avatarReleaseStatus}`) }}
                                            <el-icon style="margin-left: 5px"><ArrowDown /></el-icon
                                        ></span>
                                    </el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="userDialog.avatarReleaseStatus = 'all'">
                                                {{ t('dialog.user.avatars.all') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="userDialog.avatarReleaseStatus = 'public'">
                                                {{ t('dialog.user.avatars.public') }}
                                            </el-dropdown-item>
                                            <el-dropdown-item @click="userDialog.avatarReleaseStatus = 'private'">
                                                {{ t('dialog.user.avatars.private') }}
                                            </el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </template>
                        </div>
                    </div>
                    <div class="x-friend-list" style="margin-top: 10px; min-height: 60px; max-height: 50vh">
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
                                    style="color: #67c23a"
                                    v-text="avatar.releaseStatus">
                                </span>
                                <span
                                    v-else-if="avatar.releaseStatus === 'private'"
                                    class="extra"
                                    style="color: #f56c6c"
                                    v-text="avatar.releaseStatus">
                                </span>
                                <span v-else class="extra" v-text="avatar.releaseStatus"></span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="JSON" :label="t('dialog.user.json.header')" lazy style="height: 50vh">
                    <el-button type="default" size="small" :icon="Refresh" circle @click="refreshUserDialogTreeData()">
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        :icon="Download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(userDialog.id, userDialog.ref)">
                    </el-button>
                    <el-tree :data="userDialog.treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>
        <SendInviteDialog
            v-model:sendInviteDialogVisible="sendInviteDialogVisible"
            v-model:sendInviteDialog="sendInviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteRequestDialog
            v-model:sendInviteRequestDialogVisible="sendInviteRequestDialogVisible"
            v-model:sendInviteDialog="sendInviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <PreviousInstancesUserDialog v-model:previous-instances-user-dialog="previousInstancesUserDialog" />
        <template v-if="userDialog.visible">
            <SocialStatusDialog
                :social-status-dialog="socialStatusDialog"
                :social-status-history-table="socialStatusHistoryTable" />
            <LanguageDialog />
            <BioDialog :bio-dialog="bioDialog" />
            <PronounsDialog :pronouns-dialog="pronounsDialog" />
            <ModerateGroupDialog
        /></template>
    </el-dialog>
</template>

<script setup>
    import {
        ArrowDown,
        Bottom,
        CaretBottom,
        ChatDotRound,
        ChatLineRound,
        Check,
        CircleCheck,
        CircleClose,
        Close,
        CollectionTag,
        CopyDocument,
        DataLine,
        Delete,
        Download,
        Edit,
        Flag,
        Loading,
        Message,
        Microphone,
        More,
        MoreFilled,
        Mute,
        Operation,
        Picture,
        Plus,
        Pointer,
        Postcard,
        Refresh,
        Setting,
        Share,
        Star,
        StarFilled,
        SwitchButton,
        Top,
        User,
        UserFilled,
        View,
        Warning
    } from '@element-plus/icons-vue';
    import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        checkCanInvite,
        compareByMemberCount,
        compareByName,
        copyToClipboard,
        downloadAndSaveJson,
        formatDateFilter,
        getFaviconUrl,
        isFriendOnline,
        isRealInstance,
        languageClass,
        openExternalLink,
        parseLocation,
        refreshInstancePlayerCount,
        replaceBioSymbols,
        saveUserMemo,
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
        useGameStore,
        useGroupStore,
        useInviteStore,
        useLocationStore,
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
    import { getNextDialogIndex, redirectToToolsTab } from '../../../shared/utils/base/ui';
    import { processBulk, request } from '../../../service/request';
    import { userDialogWorldOrderOptions, userDialogWorldSortingOptions } from '../../../shared/constants/';
    import { database } from '../../../service/database';
    import { userDialogGroupSortingOptions } from '../../../shared/constants';

    import SendInviteDialog from '../InviteDialog/SendInviteDialog.vue';

    const BioDialog = defineAsyncComponent(() => import('./BioDialog.vue'));
    const LanguageDialog = defineAsyncComponent(() => import('./LanguageDialog.vue'));
    const PreviousInstancesUserDialog = defineAsyncComponent(() => import('./PreviousInstancesUserDialog.vue'));
    const PronounsDialog = defineAsyncComponent(() => import('./PronounsDialog.vue'));
    const SendInviteRequestDialog = defineAsyncComponent(() => import('./SendInviteRequestDialog.vue'));
    const SocialStatusDialog = defineAsyncComponent(() => import('./SocialStatusDialog.vue'));
    const ModerateGroupDialog = defineAsyncComponent(() => import('../ModerateGroupDialog.vue'));

    const { t } = useI18n();

    const { hideUserNotes, hideUserMemos } = storeToRefs(useAppearanceSettingsStore());
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());
    const { userDialog, languageDialog, currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { cachedUsers, showUserDialog, sortUserDialogAvatars, refreshUserDialogAvatars, refreshUserDialogTreeData } =
        useUserStore();
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
    const { clearInviteImageUpload, showFullscreenImageDialog } = useGalleryStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { logout } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());
    const { applyPlayerModeration, handlePlayerModerationDelete } = useModerationStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                nextTick(() => {
                    userDialogIndex.value = getNextDialogIndex();
                });
                !userDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    const userDialogIndex = ref(2000);

    const userDialogGroupEditMode = ref(false); // whether edit mode is active
    const userDialogGroupEditGroups = ref([]); // editable group list
    const userDialogGroupAllSelected = ref(false);
    const userDialogGroupEditSelectedGroupIds = ref([]); // selected groups in edit mode

    const userDialogLastActiveTab = ref('Info');
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

    const favoriteWorldsRef = ref(null);

    const sendInviteDialogVisible = ref(false);
    const sendInviteDialog = ref({
        messageSlot: {},
        userId: '',
        params: {}
    });
    const sendInviteRequestDialogVisible = ref(false);

    const previousInstancesUserDialog = ref({
        visible: false,
        openFlg: false,
        userRef: {}
    });

    const socialStatusDialog = ref({
        visible: false,
        loading: false,
        status: '',
        statusDescription: ''
    });
    const socialStatusHistoryTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small'
        },
        layout: 'table'
    });

    const bioDialog = ref({
        visible: false,
        loading: false,
        bio: '',
        bioLinks: []
    });

    const pronounsDialog = ref({
        visible: false,
        loading: false,
        pronouns: ''
    });

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

    function cleanNote(note) {
        // remove newlines because they aren't supported
        userDialog.value.note = note.replace(/[\r\n]/g, '');
    }

    function handleUserDialogTab(tabName) {
        const userId = userDialog.value.id;
        if (tabName === 'Groups') {
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
        } else if (tabName === 'Favorite Worlds') {
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
                getUserFavoriteWorlds(userId);
            }
        } else if (tabName === 'JSON') {
            refreshUserDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleUserDialogTab(userDialogLastActiveTab.value);
    }

    function userDialogTabClick(obj) {
        if (obj.props.name === userDialogLastActiveTab.value) {
            return;
        }
        handleUserDialogTab(obj.props.name);
        userDialogLastActiveTab.value = obj.props.name;
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
            ElMessage({
                message: t('message.badge.updated'),
                type: 'success'
            });
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
                ElMessage({
                    message: t('message.avatar.change_moderation_failed'),
                    type: 'error'
                });
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
        } else if (command === 'Logout') {
            logout();
        } else if (command === 'Request Invite') {
            notificationRequest
                .sendRequestInvite(
                    {
                        platform: 'standalonewindows'
                    },
                    D.id
                )
                .then((args) => {
                    ElMessage('Request invite sent');
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
                            ElMessage('Invite sent');
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
                ElMessage({
                    message: 'No fallback avatar set',
                    type: 'error'
                });
            }
        } else if (command === 'Previous Instances') {
            showPreviousInstancesUserDialog(D.ref);
        } else if (command === 'Manage Gallery') {
            userDialog.value.visible = false;
            redirectToToolsTab();
        } else if (command === 'Invite To Group') {
            showInviteGroupDialog('', D.id);
            // } else if (command === 'Send Boop') {
            //     this.showSendBoopDialog(D.id);
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
        } else {
            const i18nPreFix = 'dialog.user.actions.';
            const formattedCommand = command.toLowerCase().replace(/ /g, '_');
            const displayCommandText = t(`${i18nPreFix}${formattedCommand}`).includes('i18nPreFix')
                ? command
                : t(`${i18nPreFix}${formattedCommand}`);

            ElMessageBox.confirm(
                t('confirm.message', {
                    command: displayCommandText
                }),
                t('confirm.title'),
                {
                    confirmButtonText: t('confirm.confirm_button'),
                    cancelButtonText: t('confirm.cancel_button'),
                    type: 'info'
                }
            )
                .then((action) => {
                    if (action === 'confirm') {
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
        ElMessage({
            message: t('message.user.moderated'),
            type: 'success'
        });
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
                args = await friendRequest.deleteFriend({
                    userId
                });
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
        } else if (userDialog.value.groupSorting === userDialogGroupSortingOptions.inGame) {
            userDialog.value.groupSorting = userDialogGroupSortingOptions.alphabetical;
        }
        await sortCurrentUserGroups();
        userDialog.value.isGroupsLoading = false;
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
        let sortMethod = (a, b) => 0;

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
        if (favoriteWorldsRef.value) {
            favoriteWorldsRef.value.currentName = '0'; // select first tab
        }
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

    function checkNote(ref, note) {
        if (ref.note !== note) {
            addNote(ref.id, note);
        }
    }

    async function addNote(userId, note) {
        if (userDialog.value.id === userId) {
            userDialog.value.noteSaving = true;
        }
        const args = await miscRequest.saveNote({
            targetUserId: userId,
            note
        });
        handleNoteChange(args);
    }

    function handleNoteChange(args) {
        let _note = '';
        let targetUserId = '';
        if (typeof args.json !== 'undefined') {
            _note = replaceBioSymbols(args.json.note);
        }
        if (typeof args.params !== 'undefined') {
            targetUserId = args.params.targetUserId;
        }
        if (targetUserId === userDialog.value.id) {
            if (_note === args.params.note) {
                userDialog.value.noteSaving = false;
                userDialog.value.note = _note;
            } else {
                // response is cached sadge :<
                userRequest.getUser({ userId: targetUserId });
            }
        }
        const ref = cachedUsers.get(targetUserId);
        if (typeof ref !== 'undefined') {
            ref.note = _note;
        }
    }

    async function deleteNote(userId) {
        if (userDialog.value.id === userId) {
            userDialog.value.noteSaving = true;
        }
        const args = await miscRequest.saveNote({
            targetUserId: userId,
            note: ''
        });
        handleNoteChange(args);
    }

    function onUserMemoChange() {
        const D = userDialog.value;
        saveUserMemo(D.id, D.memo);
    }

    function showBioDialog() {
        const D = bioDialog.value;
        D.bio = currentUser.value.bio;
        D.bioLinks = currentUser.value.bioLinks.slice();
        D.visible = true;
    }

    function showPreviousInstancesUserDialog(userRef) {
        const D = previousInstancesUserDialog.value;
        D.userRef = userRef;
        D.visible = true;
        // trigger watcher
        D.openFlg = true;
        nextTick(() => (D.openFlg = false));
    }

    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({
            allowAvatarCopying: !currentUser.value.allowAvatarCopying
        });
    }

    function resetHome() {
        ElMessageBox.confirm('Continue? Reset Home', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    userRequest
                        .saveCurrentUser({
                            homeLocation: ''
                        })
                        .then((args) => {
                            ElMessage({
                                message: 'Home world has been reset',
                                type: 'success'
                            });
                            return args;
                        });
                }
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

    async function setUserDialogGroupSorting(sortOrder) {
        const D = userDialog.value;
        if (D.groupSorting.value === sortOrder.value) {
            return;
        }
        D.groupSorting = sortOrder;
        await sortCurrentUserGroups();
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
            ElMessage({
                message: 'Failed to save in-game group order',
                type: 'error'
            });
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

    async function setUserDialogWorldOrder(order) {
        const D = userDialog.value;
        if (D.worldOrder.value === order.value) {
            return;
        }
        D.worldOrder = order;
        refreshUserDialogWorlds();
    }

    function changeUserDialogAvatarSorting(sortOption) {
        const D = userDialog.value;
        D.avatarSorting = sortOption;
        sortUserDialogAvatars(D.avatars);
    }

    function closeInviteDialog() {
        clearInviteImageUpload();
    }
</script>
