<template>
    <safe-dialog
        ref="userDialogRef"
        class="x-dialog x-user-dialog"
        :visible.sync="userDialog.visible"
        :show-close="false"
        width="770px"
        top="10vh">
        <div v-loading="userDialog.loading">
            <div style="display: flex">
                <el-popover
                    v-if="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                    placement="right"
                    width="500px"
                    trigger="click">
                    <img
                        slot="reference"
                        class="x-link"
                        :src="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                        style="flex: none; height: 120px; width: 213.33px; border-radius: 12px; object-fit: cover" />
                    <img
                        v-lazy="userDialog.ref.profilePicOverride"
                        class="x-link"
                        style="height: 400px"
                        @click="showFullscreenImageDialog(userDialog.ref.profilePicOverride)" />
                </el-popover>
                <el-popover v-else placement="right" width="500px" trigger="click">
                    <img
                        slot="reference"
                        class="x-link"
                        :src="userDialog.ref.currentAvatarThumbnailImageUrl"
                        style="flex: none; height: 120px; width: 160px; border-radius: 12px; object-fit: cover" />
                    <img
                        v-lazy="userDialog.ref.currentAvatarImageUrl"
                        class="x-link"
                        style="height: 500px"
                        @click="showFullscreenImageDialog(userDialog.ref.currentAvatarImageUrl)" />
                </el-popover>

                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <el-tooltip v-if="userDialog.ref.status" placement="top">
                                <template #content>
                                    <span v-if="userDialog.ref.state === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.state === 'offline'">{{
                                        t('dialog.user.status.offline')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'active'">{{
                                        t('dialog.user.status.online')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="userDialog.ref.status === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
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
                                    <i class="el-icon-caret-bottom"></i>
                                </el-tooltip>
                            </template>
                            <el-popover placement="top" trigger="click">
                                <span
                                    slot="reference"
                                    class="dialog-title"
                                    style="margin-left: 5px; margin-right: 5px; cursor: pointer"
                                    v-text="userDialog.ref.displayName"></span>
                                <span style="display: block; text-align: center; font-family: monospace">{{
                                    userDialog.ref.displayName | textToHex
                                }}</span>
                            </el-popover>
                            <el-tooltip
                                v-if="userDialog.ref.pronouns"
                                placement="top"
                                :content="t('dialog.user.pronouns')"
                                :disabled="hideTooltips">
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
                            <template v-if="userDialog.ref.id === API.currentUser.id">
                                <br />
                                <el-popover placement="top" trigger="click">
                                    <span
                                        slot="reference"
                                        class="x-grey"
                                        style="
                                            margin-right: 10px;
                                            font-family: monospace;
                                            font-size: 12px;
                                            cursor: pointer;
                                        "
                                        v-text="API.currentUser.username"></span>
                                    <span style="display: block; text-align: center; font-family: monospace">{{
                                        API.currentUser.username | textToHex
                                    }}</span>
                                </el-popover>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <el-tag
                                type="info"
                                effect="plain"
                                size="mini"
                                class="name"
                                :class="userDialog.ref.$trustClass"
                                style="margin-right: 5px; margin-top: 5px"
                                v-text="userDialog.ref.$trustLevel"></el-tag>
                            <el-tag
                                v-if="userDialog.isFriend && userDialog.friend"
                                type="info"
                                effect="plain"
                                size="mini"
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
                                size="mini"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isProbableTroll"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-troll"
                                style="margin-right: 5px; margin-top: 5px">
                                Almost Nuisance
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$isModerator"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-vip"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.user.tags.vrchat_team') }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.last_platform === 'standalonewindows'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-pc"
                                style="margin-right: 5px; margin-top: 5px">
                                PC
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.last_platform === 'android'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-quest"
                                style="margin-right: 5px; margin-top: 5px">
                                Android
                            </el-tag>
                            <el-tag
                                v-else-if="userDialog.ref.last_platform === 'ios'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-ios"
                                style="margin-right: 5px; margin-top: 5px"
                                >iOS</el-tag
                            >
                            <el-tag
                                v-else-if="userDialog.ref.last_platform"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-platform-other"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.last_platform }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.ageVerified || userDialog.ref.ageVerificationStatus !== 'hidden'"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="x-tag-age-verification"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ userDialog.ref.ageVerificationStatus }}
                            </el-tag>
                            <el-tag
                                v-if="userDialog.ref.$customTag"
                                type="info"
                                effect="plain"
                                size="mini"
                                class="name"
                                :style="{
                                    color: userDialog.ref.$customTagColour,
                                    'border-color': userDialog.ref.$customTagColour
                                }"
                                style="margin-right: 5px; margin-top: 5px"
                                v-text="userDialog.ref.$customTag"></el-tag>
                            <br />
                            <el-tooltip v-for="badge in userDialog.ref.badges" :key="badge.badgeId" placement="top">
                                <template #content>
                                    <span>{{ badge.badgeName }}</span>
                                    <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                                </template>
                                <el-popover placement="right" width="300px" trigger="click">
                                    <img
                                        slot="reference"
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
                                        :class="{ 'x-user-badge-hidden': badge.hidden }" />
                                    <img
                                        v-lazy="badge.badgeImageUrl"
                                        class="x-link"
                                        style="width: 300px"
                                        @click="showFullscreenImageDialog(badge.badgeImageUrl)" />
                                    <br />
                                    <div style="display: block; width: 300px; word-break: normal">
                                        <span>{{ badge.badgeName }}</span>
                                        <br />
                                        <span class="x-grey" style="font-size: 12px">{{ badge.badgeDescription }}</span>
                                        <br />
                                        <span
                                            v-if="badge.assignedAt"
                                            class="x-grey"
                                            style="font-family: monospace; font-size: 12px">
                                            {{ t('dialog.user.badges.assigned') }}:
                                            {{ badge.assignedAt | formatDate('long') }}
                                        </span>
                                        <template v-if="userDialog.id === API.currentUser.id">
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
                                                style="margin-top: 5px"
                                                @change="toggleBadgeShowcased(badge)">
                                                {{ t('dialog.user.badges.showcased') }}
                                            </el-checkbox>
                                        </template>
                                    </div>
                                </el-popover>
                            </el-tooltip>
                        </div>
                        <div style="margin-top: 5px">
                            <span style="font-size: 12px" v-text="userDialog.ref.statusDescription"></span>
                        </div>
                    </div>

                    <div v-if="userDialog.ref.userIcon" style="flex: none; margin-right: 10px">
                        <el-popover placement="right" width="500px" trigger="click">
                            <img
                                slot="reference"
                                class="x-link"
                                :src="userImage(userDialog.ref, true, '256', true)"
                                style="
                                    flex: none;
                                    width: 120px;
                                    height: 120px;
                                    border-radius: 12px;
                                    object-fit: cover;
                                " />
                            <img
                                v-lazy="userDialog.ref.userIcon"
                                class="x-link"
                                style="height: 500px"
                                @click="showFullscreenImageDialog(userDialog.ref.userIcon)" />
                        </el-popover>
                    </div>

                    <div style="flex: none">
                        <template
                            v-if="
                                (API.currentUser.id !== userDialog.ref.id && userDialog.isFriend) ||
                                userDialog.isFavorite
                            ">
                            <el-tooltip
                                v-if="userDialog.isFavorite"
                                placement="top"
                                :content="t('dialog.user.actions.unfavorite_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="warning"
                                    icon="el-icon-star-on"
                                    circle
                                    @click="userDialogCommand('Add Favorite')"></el-button>
                            </el-tooltip>
                            <el-tooltip
                                v-else
                                placement="top"
                                :content="t('dialog.user.actions.favorite_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    type="default"
                                    icon="el-icon-star-off"
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
                                icon="el-icon-more"
                                circle
                                style="margin-left: 5px"></el-button>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">{{
                                    t('dialog.user.actions.refresh')
                                }}</el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">{{
                                    t('dialog.user.actions.share')
                                }}</el-dropdown-item>
                                <template v-if="userDialog.ref.id === API.currentUser.id">
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Manage Gallery" divided>{{
                                        t('dialog.user.actions.manage_gallery_inventory_icon')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Avatar Author">{{
                                        t('dialog.user.actions.show_avatar_author')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Fallback Avatar Details">{{
                                        t('dialog.user.actions.show_fallback_avatar')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Social Status" divided>{{
                                        t('dialog.user.actions.edit_status')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Language">{{
                                        t('dialog.user.actions.edit_language')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Bio">{{
                                        t('dialog.user.actions.edit_bio')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Edit Pronouns">{{
                                        t('dialog.user.actions.edit_pronouns')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-switch-button" command="Logout" divided>{{
                                        t('dialog.user.actions.logout')
                                    }}</el-dropdown-item>
                                </template>
                                <template v-else>
                                    <template v-if="userDialog.isFriend">
                                        <el-dropdown-item icon="el-icon-postcard" command="Request Invite" divided>{{
                                            t('dialog.user.actions.request_invite')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item icon="el-icon-postcard" command="Request Invite Message">{{
                                            t('dialog.user.actions.request_invite_with_message')
                                        }}</el-dropdown-item>
                                        <template
                                            v-if="
                                                lastLocation.location &&
                                                isGameRunning &&
                                                checkCanInvite(lastLocation.location)
                                            ">
                                            <el-dropdown-item icon="el-icon-message" command="Invite">{{
                                                t('dialog.user.actions.invite')
                                            }}</el-dropdown-item>
                                            <el-dropdown-item icon="el-icon-message" command="Invite Message">{{
                                                t('dialog.user.actions.invite_with_message')
                                            }}</el-dropdown-item>
                                        </template>
                                    </template>
                                    <template v-else-if="userDialog.incomingRequest">
                                        <el-dropdown-item icon="el-icon-check" command="Accept Friend Request">{{
                                            t('dialog.user.actions.accept_friend_request')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item icon="el-icon-close" command="Decline Friend Request">{{
                                            t('dialog.user.actions.decline_friend_request')
                                        }}</el-dropdown-item>
                                    </template>
                                    <el-dropdown-item
                                        v-else-if="userDialog.outgoingRequest"
                                        icon="el-icon-close"
                                        command="Cancel Friend Request">
                                        {{ t('dialog.user.actions.cancel_friend_request') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item v-else icon="el-icon-plus" command="Send Friend Request">{{
                                        t('dialog.user.actions.send_friend_request')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-message" command="Invite To Group">{{
                                        t('dialog.user.actions.invite_to_group')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-remove-outline" command="Ban From Group">{{
                                        t('dialog.user.actions.ban_from_group')
                                    }}</el-dropdown-item>
                                    <!--//- el-dropdown-item(icon="el-icon-thumb" command="Send Boop" :disabled="!API.currentUser.isBoopingEnabled") {{ t('dialog.user.actions.send_boop') }}-->
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Avatar Author" divided>{{
                                        t('dialog.user.actions.show_avatar_author')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-s-custom" command="Show Fallback Avatar Details">{{
                                        t('dialog.user.actions.show_fallback_avatar')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-tickets" command="Previous Instances">{{
                                        t('dialog.user.actions.show_previous_instances')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.ref.currentAvatarImageUrl"
                                        icon="el-icon-picture-outline"
                                        command="Previous Images">
                                        {{ t('dialog.user.actions.show_previous_images') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isBlock"
                                        icon="el-icon-circle-check"
                                        command="Moderation Unblock"
                                        divided
                                        style="color: #f56c6c">
                                        {{ t('dialog.user.actions.moderation_unblock') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-circle-close"
                                        command="Moderation Block"
                                        divided
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ t('dialog.user.actions.moderation_block') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isMute"
                                        icon="el-icon-microphone"
                                        command="Moderation Unmute"
                                        style="color: #f56c6c">
                                        {{ t('dialog.user.actions.moderation_unmute') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-turn-off-microphone"
                                        command="Moderation Mute"
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ t('dialog.user.actions.moderation_mute') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isMuteChat"
                                        icon="el-icon-chat-line-round"
                                        command="Moderation Enable Chatbox"
                                        style="color: #f56c6c">
                                        {{ t('dialog.user.actions.moderation_enable_chatbox') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-chat-dot-round"
                                        command="Moderation Disable Chatbox">
                                        {{ t('dialog.user.actions.moderation_disable_chatbox') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-user-solid" command="Show Avatar">
                                        <i v-if="userDialog.isShowAvatar" class="el-icon-check el-icon--left"></i>
                                        <span>{{ t('dialog.user.actions.moderation_show_avatar') }}</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-user" command="Hide Avatar">
                                        <i v-if="userDialog.isHideAvatar" class="el-icon-check el-icon--left"></i>
                                        <span>{{ t('dialog.user.actions.moderation_hide_avatar') }}</span>
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="userDialog.isInteractOff"
                                        icon="el-icon-thumb"
                                        command="Moderation Enable Avatar Interaction"
                                        style="color: #f56c6c">
                                        {{ t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        v-else
                                        icon="el-icon-circle-close"
                                        command="Moderation Disable Avatar Interaction">
                                        {{ t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                                    </el-dropdown-item>
                                    <el-dropdown-item
                                        icon="el-icon-s-flag"
                                        command="Report Hacking"
                                        :disabled="userDialog.ref.$isModerator">
                                        {{ t('dialog.user.actions.report_hacking') }}
                                    </el-dropdown-item>
                                    <template v-if="userDialog.isFriend">
                                        <el-dropdown-item
                                            icon="el-icon-delete"
                                            command="Unfriend"
                                            divided
                                            style="color: #f56c6c">
                                            {{ t('dialog.user.actions.unfriend') }}
                                        </el-dropdown-item>
                                    </template>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>

            <el-tabs ref="userDialogTabsRef" @tab-click="userDialogTabClick">
                <el-tab-pane :label="t('dialog.user.info.header')">
                    <template v-if="isFriendOnline(userDialog.friend) || API.currentUser.id === userDialog.id">
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
                                    <launch
                                        :location="userDialog.$location.tag"
                                        @show-launch-dialog="showLaunchDialog" />
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.user.info.self_invite_tooltip')"
                                        :disabled="hideTooltips">
                                        <invite-yourself
                                            :location="userDialog.$location.tag"
                                            :shortname="userDialog.$location.shortName"
                                            style="margin-left: 5px"></invite-yourself>
                                    </el-tooltip>
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.user.info.refresh_instance_info')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            size="mini"
                                            icon="el-icon-refresh"
                                            style="margin-left: 5px"
                                            circle
                                            @click="refreshInstancePlayerCount(userDialog.$location.tag)"></el-button>
                                    </el-tooltip>
                                    <last-join
                                        :location="userDialog.$location.tag"
                                        :currentlocation="lastLocation.location"></last-join>
                                    <instance-info
                                        :location="userDialog.$location.tag"
                                        :instance="userDialog.instance.ref"
                                        :friendcount="userDialog.instance.friendCount"
                                        :updateelement="updateInstanceInfo"></instance-info>
                                </template>
                                <location
                                    :location="userDialog.ref.location"
                                    :traveling="userDialog.ref.travelingToLocation"
                                    style="display: block; margin-top: 5px"></location>
                            </div>
                            <div class="x-friend-list" style="flex: 1; margin-top: 10px; max-height: 150px">
                                <div
                                    v-if="userDialog.$location.userId"
                                    class="x-friend-item x-friend-item-border"
                                    @click="showUserDialog(userDialog.$location.userId)">
                                    <template v-if="userDialog.$location.user">
                                        <div class="avatar" :class="userStatusClass(userDialog.$location.user)">
                                            <img :src="userImage(userDialog.$location.user, true)" />
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
                                        <img :src="userImage(user, true)" />
                                    </div>
                                    <div class="detail">
                                        <span
                                            class="name"
                                            :style="{ color: user.$userColour }"
                                            v-text="user.displayName"></span>
                                        <span v-if="user.location === 'traveling'" class="extra">
                                            <i class="el-icon-loading" style="margin-right: 5px"></i>
                                            <timer :epoch="user.$travelingToTime"></timer>
                                        </span>
                                        <span v-else class="extra">
                                            <timer :epoch="user.$location_at"></timer>
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
                                    type="textarea"
                                    maxlength="256"
                                    show-word-limit
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="t('dialog.user.info.note_placeholder')"
                                    size="mini"
                                    resize="none"
                                    @change="checkNote(userDialog.ref, userDialog.note)"
                                    @input="cleanNote(userDialog.note)"></el-input>
                                <div style="float: right">
                                    <i
                                        v-if="userDialog.noteSaving"
                                        class="el-icon-loading"
                                        style="margin-left: 5px"></i>
                                    <i
                                        v-else-if="userDialog.note !== userDialog.ref.note"
                                        class="el-icon-more-outline"
                                        style="margin-left: 5px"></i>
                                    <el-button
                                        v-if="userDialog.note"
                                        type="text"
                                        icon="el-icon-delete"
                                        size="mini"
                                        style="margin-left: 5px"
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
                                    size="mini"
                                    resize="none"
                                    @change="onUserMemoChange"></el-input>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span
                                    v-if="
                                        userDialog.id !== API.currentUser.id &&
                                        userDialog.ref.profilePicOverride &&
                                        userDialog.ref.currentAvatarImageUrl
                                    "
                                    class="name">
                                    {{ t('dialog.user.info.avatar_info_last_seen') }}
                                </span>
                                <span v-else class="name">{{ t('dialog.user.info.avatar_info') }}</span>
                                <div class="extra">
                                    <avatar-info
                                        :imageurl="userDialog.ref.currentAvatarImageUrl"
                                        :userid="userDialog.id"
                                        :avatartags="userDialog.ref.currentAvatarTags"
                                        style="display: inline-block"></avatar-info>
                                    <el-tooltip
                                        v-if="
                                            userDialog.ref.profilePicOverride &&
                                            !userDialog.ref.currentAvatarImageUrl &&
                                            !hideTooltips
                                        "
                                        placement="top"
                                        :content="t('dialog.user.info.vrcplus_hides_avatar')">
                                        <i class="el-icon-warning"></i>
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
                                        <el-popover placement="right" width="500px" trigger="click">
                                            <el-image
                                                slot="reference"
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
                                                @load="userDialog.isRepresentedGroupLoading = false">
                                                <div slot="error"></div>
                                            </el-image>
                                            <img
                                                v-lazy="userDialog.representedGroup.iconUrl"
                                                class="x-link"
                                                style="height: 500px"
                                                @click="
                                                    showFullscreenImageDialog(userDialog.representedGroup.iconUrl)
                                                " />
                                        </el-popover>
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
                                <div v-if="userDialog.id === API.currentUser.id" style="float: right">
                                    <el-button
                                        type="text"
                                        icon="el-icon-edit"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="showBioDialog"></el-button>
                                </div>
                                <div style="margin-top: 5px">
                                    <el-tooltip v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
                                        <template #content>
                                            <span v-text="link"></span>
                                        </template>
                                        <img
                                            :src="getFaviconUrl(link)"
                                            onerror="this.onerror=null;this.class='el-icon-error'"
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
                            </div>
                        </div>
                        <template v-if="API.currentUser.id !== userDialog.id">
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.user.info.last_seen') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userDialog.lastSeen | formatDate('long') }}</span>
                                </div>
                            </div>
                            <el-tooltip
                                :disabled="hideTooltips"
                                placement="top"
                                :content="t('dialog.user.info.open_previouse_instance')">
                                <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                    <div class="detail">
                                        <span class="name">
                                            {{ t('dialog.user.info.join_count') }}
                                            <el-tooltip
                                                v-if="!hideTooltips"
                                                placement="top"
                                                style="margin-left: 5px"
                                                :content="t('dialog.user.info.accuracy_notice')">
                                                <i class="el-icon-warning"></i>
                                            </el-tooltip>
                                        </span>
                                        <span v-if="userDialog.joinCount === 0" class="extra">-</span>
                                        <span v-else class="extra" v-text="userDialog.joinCount"></span>
                                    </div>
                                </div>
                            </el-tooltip>
                            <div class="x-friend-item" style="cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.user.info.time_together') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                    <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <el-tooltip
                                :disabled="hideTooltips || API.currentUser.id !== userDialog.id"
                                placement="top"
                                :content="t('dialog.user.info.open_previouse_instance')">
                                <div class="x-friend-item" @click="showPreviousInstancesUserDialog(userDialog.ref)">
                                    <div class="detail">
                                        <span class="name">
                                            {{ t('dialog.user.info.play_time') }}
                                            <el-tooltip
                                                v-if="!hideTooltips"
                                                placement="top"
                                                style="margin-left: 5px"
                                                :content="t('dialog.user.info.accuracy_notice')">
                                                <i class="el-icon-warning"></i>
                                            </el-tooltip>
                                        </span>
                                        <span v-if="userDialog.timeSpent === 0" class="extra">-</span>
                                        <span v-else class="extra">{{ timeToText(userDialog.timeSpent) }}</span>
                                    </div>
                                </div>
                            </el-tooltip>
                        </template>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="API.currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                                <template #content>
                                    <span>{{ userOnlineForTimestamp(userDialog) | formatDate('short') }}</span>
                                </template>
                                <div class="detail">
                                    <span
                                        v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for"
                                        class="name">
                                        {{ t('dialog.user.info.online_for') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span v-else class="name">
                                        {{ t('dialog.user.info.offline_for') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userOnlineFor(userDialog) }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <el-tooltip :placement="API.currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                                <template #content>
                                    <span
                                        >{{ t('dialog.user.info.last_login') }}
                                        {{ userDialog.ref.last_login | formatDate('long') }}</span
                                    >
                                    <br />
                                    <span
                                        >{{ t('dialog.user.info.last_activity') }}
                                        {{ userDialog.ref.last_activity | formatDate('long') }}</span
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
                        <div v-if="API.currentUser.id !== userDialog.id" class="x-friend-item" style="cursor: default">
                            <el-tooltip placement="top" :disabled="!userDialog.dateFriendedInfo.length">
                                <template v-if="userDialog.dateFriendedInfo.length" #content>
                                    <template v-for="ref in userDialog.dateFriendedInfo">
                                        <span>{{ ref.type }}: {{ ref.created_at | formatDate('long') }}</span
                                        ><br />
                                    </template>
                                </template>
                                <div class="detail">
                                    <span v-if="userDialog.unFriended" class="name">
                                        {{ t('dialog.user.info.unfriended') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span v-else class="name">
                                        {{ t('dialog.user.info.friended') }}
                                        <el-tooltip
                                            v-if="!hideTooltips"
                                            placement="top"
                                            style="margin-left: 5px"
                                            :content="t('dialog.user.info.accuracy_notice')">
                                            <i class="el-icon-warning"></i>
                                        </el-tooltip>
                                    </span>
                                    <span class="extra">{{ userDialog.dateFriended | formatDate('long') }}</span>
                                </div>
                            </el-tooltip>
                        </div>
                        <template v-if="API.currentUser.id === userDialog.id">
                            <div class="x-friend-item" @click="toggleAvatarCopying">
                                <div class="detail">
                                    <span class="name">{{ t('dialog.user.info.avatar_cloning') }}</span>
                                    <span
                                        v-if="API.currentUser.allowAvatarCopying"
                                        class="extra"
                                        style="color: #67c23a"
                                        >{{ t('dialog.user.info.avatar_cloning_allow') }}</span
                                    >
                                    <span v-else class="extra" style="color: #f56c6c">{{
                                        t('dialog.user.info.avatar_cloning_deny')
                                    }}</span>
                                </div>
                            </div>
                            <!--//- .x-friend-item(@click="toggleAllowBooping")-->
                            <!--//-     .detail-->
                            <!--//-         span.name {{ t('dialog.user.info.booping') }}-->
                            <!--//-         span.extra(v-if="API.currentUser.isBoopingEnabled" style="color:#67C23A") {{ t('dialog.user.info.avatar_cloning_allow') }}-->
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
                            v-if="userDialog.ref.id === API.currentUser.id && API.currentUser.homeLocation"
                            class="x-friend-item"
                            style="width: 100%"
                            @click="showWorldDialog(API.currentUser.homeLocation)">
                            <div class="detail">
                                <span class="name">{{ t('dialog.user.info.home_location') }}</span>
                                <span class="extra">
                                    <span v-text="userDialog.$homeLocationName"></span>
                                    <el-button
                                        size="mini"
                                        icon="el-icon-delete"
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
                                    <el-tooltip
                                        placement="top"
                                        :content="t('dialog.user.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            size="mini"
                                            style="margin-left: 5px"
                                            @click.native.stop>
                                            <el-button
                                                type="default"
                                                icon="el-icon-s-order"
                                                size="mini"
                                                circle></el-button>
                                            <el-dropdown-menu slot="dropdown">
                                                <el-dropdown-item @click.native="copyUserId(userDialog.id)">{{
                                                    t('dialog.user.info.copy_id')
                                                }}</el-dropdown-item>
                                                <el-dropdown-item @click.native="copyUserURL(userDialog.id)">{{
                                                    t('dialog.user.info.copy_url')
                                                }}</el-dropdown-item>
                                                <el-dropdown-item
                                                    @click.native="copyUserDisplayName(userDialog.ref.displayName)"
                                                    >{{ t('dialog.user.info.copy_display_name') }}</el-dropdown-item
                                                >
                                            </el-dropdown-menu>
                                        </el-dropdown>
                                    </el-tooltip>
                                </span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('dialog.user.groups.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isGroupsLoading"
                                size="mini"
                                icon="el-icon-refresh"
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
                                    @click.native.stop>
                                    <el-button size="mini">
                                        <span
                                            >{{ t(userDialog.groupSorting.name) }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            v-for="(item, key) in userDialogGroupSortingOptions"
                                            :key="key"
                                            :disabled="
                                                item === userDialogGroupSortingOptions.inGame &&
                                                userDialog.id !== API.currentUser.id
                                            "
                                            @click.native="setUserDialogGroupSorting(item)"
                                            >{{ t(item.name) }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </template>
                            <el-button
                                v-if="userDialogGroupEditMode"
                                size="small"
                                icon="el-icon-edit"
                                style="margin-right: 5px; height: 29px; padding: 7px 15px"
                                @click="exitEditModeCurrentUserGroups">
                                {{ t('dialog.user.groups.exit_edit_mode') }}
                            </el-button>
                            <el-button
                                v-else-if="API.currentUser.id === userDialog.id"
                                size="small"
                                icon="el-icon-edit"
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
                                        icon="el-icon-setting"
                                        style="margin-right: 5px; height: 29px; padding: 7px 15px; margin-bottom: 5px">
                                        {{ t('dialog.group.actions.manage_selected') }}
                                        <i class="el-icon-arrow-down el-icon--right"></i>
                                    </el-button>
                                    <el-dropdown-menu>
                                        <el-dropdown-item @click.native="bulkSetVisibility('visible')">
                                            {{ t('dialog.group.actions.visibility_everyone') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item @click.native="bulkSetVisibility('friends')">
                                            {{ t('dialog.group.actions.visibility_friends') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item @click.native="bulkSetVisibility('hidden')">
                                            {{ t('dialog.group.actions.visibility_hidden') }}
                                        </el-dropdown-item>
                                        <el-dropdown-item divided @click.native="bulkLeaveGroups">
                                            <i class="el-icon-delete"></i>
                                            {{ t('dialog.user.groups.leave_group_tooltip') }}
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>

                                <!-- Select All button -->
                                <el-button
                                    size="small"
                                    :icon="userDialogGroupAllSelected ? 'el-icon-close' : 'el-icon-check'"
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
                                            size="mini"
                                            icon="el-icon-download"
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
                                            size="mini"
                                            icon="el-icon-download"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupBottom(group.id)">
                                        </el-button>
                                    </div>
                                    <div style="margin-right: 10px" @click.stop>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-top"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupUp(group.id)">
                                        </el-button>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-bottom"
                                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                                            @click="moveGroupDown(group.id)">
                                        </el-button>
                                    </div>
                                    <div class="avatar">
                                        <img v-lazy="group.iconUrl" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                        <span class="extra">
                                            <el-tooltip
                                                v-if="group.isRepresenting"
                                                placement="top"
                                                :content="t('dialog.group.members.representing')">
                                                <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                            </el-tooltip>
                                            <el-tooltip v-if="group.myMember.visibility !== 'visible'" placement="top">
                                                <template #content>
                                                    <span
                                                        >{{ t('dialog.group.members.visibility') }}
                                                        {{ group.myMember.visibility }}</span
                                                    >
                                                </template>
                                                <i class="el-icon-view" style="margin-right: 5px"></i>
                                            </el-tooltip>
                                            <span>({{ group.memberCount }})</span>
                                        </span>
                                    </div>
                                    <el-dropdown
                                        :disabled="group.privacy !== 'default'"
                                        trigger="click"
                                        size="small"
                                        style="margin-right: 5px"
                                        @click.native.stop>
                                        <el-button size="mini">
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
                                            <i class="el-icon-arrow-down el-icon--right" style="margin-left: 5px"></i>
                                        </el-button>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'visible')"
                                                ><i
                                                    v-if="group.myMember.visibility === 'visible'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_everyone') }}</el-dropdown-item
                                            >
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'friends')"
                                                ><i
                                                    v-if="group.myMember.visibility === 'friends'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_friends') }}</el-dropdown-item
                                            >
                                            <el-dropdown-item @click.native="setGroupVisibility(group.id, 'hidden')"
                                                ><i
                                                    v-if="group.myMember.visibility === 'hidden'"
                                                    class="el-icon-check"></i>
                                                {{ t('dialog.group.actions.visibility_hidden') }}</el-dropdown-item
                                            >
                                        </el-dropdown-menu>
                                    </el-dropdown>
                                    <!--//- JSON is missing isSubscribedToAnnouncements, can't be implemented-->
                                    <!--//- el-dropdown(@click.native.stop trigger="click" size="small" style="margin-right:5px")-->
                                    <!--//-     el-tooltip(placement="top" :disabled="hideTooltips")-->
                                    <!--//-         template(#content)-->
                                    <!--//-             span(v-if="group.myMember.isSubscribedToAnnouncements") {{ t('dialog.group.actions.unsubscribe') }}-->
                                    <!--//-             span(v-else) {{ t('dialog.group.actions.subscribe') }}-->
                                    <!--//-         el-button(v-if="group.myMember.isSubscribedToAnnouncements" @click.stop="setGroupSubscription(group.id, false)" circle size="mini")-->
                                    <!--//-             i.el-icon-chat-line-square-->
                                    <!--//-         el-button(v-else circle @click.stop="setGroupSubscription(group.id, true)" size="mini")-->
                                    <!--//-             i.el-icon-chat-square(style="color:#f56c6c")-->
                                    <el-tooltip
                                        placement="right"
                                        :content="t('dialog.user.groups.leave_group_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-button
                                            v-if="shiftHeld"
                                            size="mini"
                                            icon="el-icon-close"
                                            circle
                                            style="color: #f56c6c; margin-left: 5px"
                                            @click.stop="leaveGroup(group.id)">
                                        </el-button>
                                        <el-button
                                            v-else
                                            size="mini"
                                            icon="el-icon-delete"
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
                                        API.cachedConfig?.constants?.GROUPS?.MAX_OWNED
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
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
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
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
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
                                    <template v-if="API.currentUser.id === userDialog.id">
                                        /
                                        <template v-if="API.currentUser.$isVRCPlus">
                                            {{ API.cachedConfig?.constants?.GROUPS?.MAX_JOINED_PLUS }}
                                        </template>
                                        <template v-else>
                                            {{ API.cachedConfig?.constants?.GROUPS?.MAX_JOINED }}
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
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                            <span class="extra">
                                                <el-tooltip
                                                    v-if="group.isRepresenting"
                                                    placement="top"
                                                    :content="t('dialog.group.members.representing')">
                                                    <i class="el-icon-collection-tag" style="margin-right: 5px"></i>
                                                </el-tooltip>
                                                <el-tooltip v-if="group.memberVisibility !== 'visible'" placement="top">
                                                    <template #content>
                                                        <span
                                                            >{{ t('dialog.group.members.visibility') }}
                                                            {{ group.memberVisibility }}</span
                                                        >
                                                    </template>
                                                    <i class="el-icon-view" style="margin-right: 5px"></i>
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

                <el-tab-pane :label="t('dialog.user.worlds.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                type="default"
                                :loading="userDialog.isWorldsLoading"
                                size="mini"
                                icon="el-icon-refresh"
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
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ userDialog.worldSorting.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="(item, key) in userDialogWorldSortingOptions"
                                        :key="key"
                                        @click.native="setUserDialogWorldSorting(item)"
                                        v-text="item.name">
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                            <span style="margin: 0 5px">{{ t('dialog.user.worlds.order_by') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="userDialog.isWorldsLoading"
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ userDialog.worldOrder.name }}
                                        <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="(item, key) in userDialogWorldOrderOptions"
                                        :key="key"
                                        @click.native="setUserDialogWorldOrder(item)"
                                        v-text="item.name">
                                    </el-dropdown-item>
                                </el-dropdown-menu>
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
                                <img v-lazy="world.thumbnailImageUrl" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="world.name"></span>
                                <span v-if="world.occupants" class="extra">({{ world.occupants }})</span>
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane :label="t('dialog.user.favorite_worlds.header')" lazy>
                    <el-button
                        v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0"
                        type="default"
                        :loading="userDialog.isFavoriteWorldsLoading"
                        size="small"
                        icon="el-icon-refresh"
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
                                <span slot="label">
                                    <i
                                        class="x-status-icon"
                                        style="margin-right: 6px"
                                        :class="userFavoriteWorldsStatus(list[1])">
                                    </i>
                                    <span style="font-weight: bold; font-size: 14px" v-text="list[0]"></span>
                                    <span style="color: #909399; font-size: 10px; margin-left: 5px"
                                        >{{ list[2].length }}/{{ API.favoriteLimits.maxFavoritesPerGroup.world }}</span
                                    >
                                </span>
                                <div
                                    class="x-friend-list"
                                    style="margin-top: 10px; margin-bottom: 15px; min-height: 60px; max-height: none">
                                    <div
                                        v-for="world in list[2]"
                                        :key="world.favoriteId"
                                        class="x-friend-item x-friend-item-border"
                                        @click="showWorldDialog(world.id)">
                                        <div class="avatar">
                                            <img v-lazy="world.thumbnailImageUrl" />
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

                <el-tab-pane :label="t('dialog.user.avatars.header')" lazy>
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <el-button
                                v-if="userDialog.ref.id === API.currentUser.id"
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="mini"
                                icon="el-icon-refresh"
                                circle
                                @click="refreshUserDialogAvatars()">
                            </el-button>
                            <el-button
                                v-else
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="mini"
                                icon="el-icon-refresh"
                                circle
                                @click="setUserDialogAvatarsRemote(userDialog.id)">
                            </el-button>
                            <span style="margin-left: 5px">{{
                                t('dialog.user.avatars.total_count', { count: userDialogAvatars.length })
                            }}</span>
                        </div>
                        <div>
                            <template v-if="userDialog.ref.id === API.currentUser.id">
                                <span style="margin-right: 5px">{{ t('dialog.user.avatars.sort_by') }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading"
                                    @click.native.stop>
                                    <el-button size="mini">
                                        <span
                                            >{{ t(`dialog.user.avatars.sort_by_${userDialog.avatarSorting}`) }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            @click.native="changeUserDialogAvatarSorting('name')"
                                            v-text="t('dialog.user.avatars.sort_by_name')">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            @click.native="changeUserDialogAvatarSorting('update')"
                                            v-text="t('dialog.user.avatars.sort_by_update')">
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                                <span style="margin-right: 5px; margin-left: 10px">{{
                                    t('dialog.user.avatars.group_by')
                                }}</span>
                                <el-dropdown
                                    trigger="click"
                                    size="small"
                                    style="margin-right: 5px"
                                    :disabled="userDialog.isWorldsLoading"
                                    @click.native.stop>
                                    <el-button size="mini">
                                        <span
                                            >{{ t(`dialog.user.avatars.${userDialog.avatarReleaseStatus}`) }}
                                            <i class="el-icon-arrow-down el-icon--right"></i
                                        ></span>
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown">
                                        <el-dropdown-item
                                            @click.native="userDialog.avatarReleaseStatus = 'all'"
                                            v-text="t('dialog.user.avatars.all')">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            @click.native="userDialog.avatarReleaseStatus = 'public'"
                                            v-text="t('dialog.user.avatars.public')">
                                        </el-dropdown-item>
                                        <el-dropdown-item
                                            @click.native="userDialog.avatarReleaseStatus = 'private'"
                                            v-text="t('dialog.user.avatars.private')">
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
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
                                <img v-if="avatar.thumbnailImageUrl" v-lazy="avatar.thumbnailImageUrl" />
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

                <el-tab-pane :label="t('dialog.user.json.header')" lazy style="height: 50vh">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        @click="refreshUserDialogTreeData()">
                    </el-button>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
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
            :send-invite-dialog-visible.sync="sendInviteDialogVisible"
            :invite-message-table="inviteMessageTable"
            :send-invite-dialog="sendInviteDialog"
            :upload-image="uploadImage"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteRequestDialog
            :send-invite-request-dialog-visible.sync="sendInviteRequestDialogVisible"
            :invite-request-message-table="inviteRequestMessageTable"
            :send-invite-dialog="sendInviteDialog"
            :upload-image="uploadImage"
            @closeInviteDialog="closeInviteDialog" />
        <PreviousInstancesUserDialog
            :previous-instances-user-dialog.sync="previousInstancesUserDialog"
            :shift-held="shiftHeld" />
        <PreviousImagesDialog
            :previous-images-dialog-visible.sync="previousImagesDialogVisible"
            :previous-images-table="previousImagesTable" />
        <InviteGroupDialog
            :dialog-data.sync="inviteGroupDialog"
            :vip-friends="vipFriends"
            :online-friends="onlineFriends"
            :offline-friends="offlineFriends"
            :active-friends="activeFriends" />
        <BanGroupDialog :dialog-data.sync="banGroupDialog" />
        <SocialStatusDialog
            :social-status-dialog="socialStatusDialog"
            :social-status-history-table="socialStatusHistoryTable" />
        <LanguageDialog :language-dialog="languageDialog" />
        <BioDialog :bio-dialog="bioDialog" />
        <PronounsDialog :pronouns-dialog="pronounsDialog" />
    </safe-dialog>
</template>

<script setup>
    import { computed, getCurrentInstance, inject, nextTick, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import {
        favoriteRequest,
        friendRequest,
        groupRequest,
        imageRequest,
        inviteMessagesRequest,
        miscRequest,
        notificationRequest,
        playerModerationRequest,
        userRequest,
        worldRequest
    } from '../../../api';
    import utils from '../../../classes/utils';
    import { isRealInstance, parseLocation, refreshInstancePlayerCount } from '../../../composables/instance/utils';
    import {
        copyToClipboard,
        downloadAndSaveJson,
        extractFileId,
        getFaviconUrl
    } from '../../../composables/shared/utils';
    import { userDialogGroupSortingOptions } from '../../../composables/user/constants/userDialogGroupSortingOptions';
    import { isFriendOnline, languageClass, userOnlineForTimestamp } from '../../../composables/user/utils';
    import database from '../../../service/database';
    import Location from '../../Location.vue';
    import SendInviteDialog from '../InviteDialog/SendInviteDialog.vue';
    import InviteGroupDialog from '../InviteGroupDialog.vue';
    import BanGroupDialog from '../BanGroupDialog.vue';
    import PreviousImagesDialog from '../PreviousImagesDialog.vue';
    import BioDialog from './BioDialog.vue';
    import LanguageDialog from './LanguageDialog.vue';
    import PreviousInstancesUserDialog from './PreviousInstancesUserDialog.vue';
    import PronounsDialog from './PronounsDialog.vue';
    import SendInviteRequestDialog from './SendInviteRequestDialog.vue';
    import SocialStatusDialog from './SocialStatusDialog.vue';

    const { t } = useI18n();

    const { proxy } = getCurrentInstance();
    const { $message, $confirm } = proxy;

    const API = inject('API');
    const showFullscreenImageDialog = inject('showFullscreenImageDialog');
    const clearInviteImageUpload = inject('clearInviteImageUpload');

    const userImage = inject('userImage');
    const showLaunchDialog = inject('showLaunchDialog');
    const showUserDialog = inject('showUserDialog');
    const showGroupDialog = inject('showGroupDialog');
    const openExternalLink = inject('openExternalLink');
    const showWorldDialog = inject('showWorldDialog');
    const showAvatarDialog = inject('showAvatarDialog');
    const showFavoriteDialog = inject('showFavoriteDialog');
    const adjustDialogZ = inject('adjustDialogZ');
    const userStatusClass = inject('userStatusClass');

    const props = defineProps({
        userDialog: {
            type: Object,
            default: () => ({})
        },
        languageDialog: {
            type: Object,
            required: true
        },
        hideTooltips: {
            type: Boolean,
            default: false
        },
        lastLocation: {
            type: Object,
            default: () => ({})
        },
        lastLocationDestination: {
            type: String,
            default: ''
        },
        isGameRunning: {
            type: Boolean,
            default: false
        },
        checkCanInvite: {
            type: Function,
            default: () => {}
        },
        updateInstanceInfo: {
            type: Number,
            default: () => {}
        },
        hideUserNotes: {
            type: Boolean,
            default: false
        },
        hideUserMemos: {
            type: Boolean,
            default: false
        },
        userOnlineFor: {
            type: Function,
            default: () => {}
        },
        userDialogWorldSortingOptions: {
            type: Object,
            default: () => ({})
        },
        userDialogWorldOrderOptions: {
            type: Object,
            default: () => ({})
        },
        avatarRemoteDatabase: {
            type: Boolean,
            default: false
        },
        friendLogTable: {
            type: Object,
            default: () => ({})
        },
        lookupAvatars: {
            type: Function,
            default: () => {}
        },
        updateInGameGroupOrder: {
            type: Function,
            default: () => {}
        },
        // SendInviteDialog
        inviteMessageTable: {
            type: Object,
            default: () => ({})
        },
        uploadImage: {
            type: String
        },
        inviteRequestMessageTable: {
            type: Object,
            default: () => ({})
        },
        inGameGroupOrder: {
            type: Array,
            default: () => []
        },
        shiftHeld: {
            type: Boolean,
            default: false
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
        'sortUserDialogAvatars',
        'logout',
        'showAvatarAuthorDialog',
        'showGalleryDialog',
        'saveCurrentUserGroups',
        'refreshUserDialogAvatars',
        'refreshUserDialogTreeData',
        'saveUserMemo',
        'setGroupVisibility',
        'leaveGroup',
        'leaveGroupPrompt'
    ]);

    watch(
        () => props.userDialog.loading,
        () => {
            if (props.userDialog.visible) {
                nextTick(() => adjustDialogZ(userDialogRef.value.$el));
                !props.userDialog.loading && toggleLastActiveTab(props.userDialog.id);
            }
        }
    );

    const userDialogTabsRef = ref(null);
    const userDialogRef = ref(null);

    const userDialogGroupEditMode = ref(false); // whether edit mode is active
    const userDialogGroupEditGroups = ref([]); // editable group list
    const userDialogGroupAllSelected = ref(false);
    const userDialogGroupEditSelectedGroupIds = ref([]); // selected groups in edit mode

    const userDialogLastActiveTab = ref('');
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

    const previousImagesDialogVisible = ref(false);
    const previousImagesTable = ref([]);

    const inviteGroupDialog = ref({
        visible: false,
        loading: false,
        groupId: '',
        groupName: '',
        userId: '',
        userIds: [],
        userObject: {}
    });

    const banGroupDialog = ref({
        visible: false,
        loading: false,
        groupId: '',
        userId: ''
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
            size: 'mini'
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
        const { avatars, avatarReleaseStatus } = props.userDialog;
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

    function cleanNote(note) {
        // remove newlines because they aren't supported
        props.userDialog.note = note.replace(/[\r\n]/g, '');
    }

    function toggleLastActiveTab(userId) {
        if (userDialogTabsRef.value.currentName === '0') {
            userDialogLastActiveTab.value = t('dialog.user.info.header');
        } else if (userDialogTabsRef.value.currentName === '1') {
            userDialogLastActiveTab.value = t('dialog.user.groups.header');
            if (userDialogLastGroup.value !== userId) {
                userDialogLastGroup.value = userId;
                getUserGroups(userId);
            }
        } else if (userDialogTabsRef.value.currentName === '2') {
            userDialogLastActiveTab.value = t('dialog.user.worlds.header');
            setUserDialogWorlds(userId);
            if (userDialogLastWorld.value !== userId) {
                userDialogLastWorld.value = userId;
                refreshUserDialogWorlds();
            }
        } else if (userDialogTabsRef.value.currentName === '3') {
            userDialogLastActiveTab.value = t('dialog.user.favorite_worlds.header');
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
                getUserFavoriteWorlds(userId);
            }
        } else if (userDialogTabsRef.value.currentName === '4') {
            userDialogLastActiveTab.value = t('dialog.user.avatars.header');
            setUserDialogAvatars(userId);
            userDialogLastAvatar.value = userId;
            if (userId === API.currentUser.id) {
                refreshUserDialogAvatars();
            }
            setUserDialogAvatarsRemote(userId);
        } else if (userDialogTabsRef.value.currentName === '5') {
            userDialogLastActiveTab.value = t('dialog.user.json.header');
            refreshUserDialogTreeData();
        }
    }

    function showPronounsDialog() {
        const D = pronounsDialog.value;
        D.pronouns = API.currentUser.pronouns;
        D.visible = true;
    }

    function showLanguageDialog() {
        const D = props.languageDialog;
        D.visible = true;
    }

    function showSocialStatusDialog() {
        // this.$nextTick(() =>
        //     $app.adjustDialogZ(this.$refs.socialStatusDialog.$el)
        // );
        const D = socialStatusDialog.value;
        const { statusHistory } = API.currentUser;
        const statusHistoryArray = [];
        for (let i = 0; i < statusHistory.length; ++i) {
            const addStatus = {
                no: i + 1,
                status: statusHistory[i]
            };
            statusHistoryArray.push(addStatus);
        }
        socialStatusHistoryTable.value.data = statusHistoryArray;
        D.status = API.currentUser.status;
        D.statusDescription = API.currentUser.statusDescription;
        D.visible = true;
    }

    async function setUserDialogAvatarsRemote(userId) {
        if (props.avatarRemoteDatabase && userId !== API.currentUser.id) {
            props.userDialog.isAvatarsLoading = true;
            const data = await props.lookupAvatars('authorId', userId);
            const avatars = new Set();
            userDialogAvatars.value.forEach((avatar) => {
                avatars.add(avatar.id, avatar);
            });
            if (data && typeof data === 'object') {
                data.forEach((avatar) => {
                    if (avatar.id && !avatars.has(avatar.id)) {
                        if (avatar.authorId === userId) {
                            props.userDialog.avatars.push(avatar);
                        } else {
                            console.error(`Avatar authorId mismatch for ${avatar.id} - ${avatar.name}`);
                        }
                    }
                });
            }
            props.userDialog.avatarSorting = 'name';
            props.userDialog.avatarReleaseStatus = 'all';
            props.userDialog.isAvatarsLoading = false;
        }
        sortUserDialogAvatars(props.userDialog.avatars);
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
        // API.$on('BADGE:UPDATE')
        if (args.json) {
            $message({
                message: t('message.badge.updated'),
                type: 'success'
            });
        }
    }

    function setPlayerModeration(userId, type) {
        const D = props.userDialog;
        AppApi.SetVRChatUserModeration(API.currentUser.id, userId, type).then((result) => {
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
                $message({
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
        inviteMessagesRequest.refreshInviteMessageTableData('message');
        clearInviteImageUpload();
        sendInviteDialogVisible.value = true;
    }

    function showSendInviteRequestDialog(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        inviteMessagesRequest.refreshInviteMessageTableData('request');
        clearInviteImageUpload();
        sendInviteRequestDialogVisible.value = true;
    }

    async function checkPreviousImageAvailable(images) {
        previousImagesTable.value = [];
        for (const image of images) {
            if (image.file && image.file.url) {
                const response = await fetch(image.file.url, {
                    method: 'HEAD',
                    redirect: 'follow'
                }).catch((error) => {
                    console.log(error);
                });
                if (response.status === 200) {
                    previousImagesTable.value.push(image);
                }
            }
        }
    }

    function displayPreviousImages() {
        previousImagesTable.value = [];
        const imageUrl = props.userDialog.ref.currentAvatarImageUrl;

        const fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        const params = {
            fileId
        };
        previousImagesDialogVisible.value = true;

        imageRequest.getAvatarImages(params).then((args) => {
            const images = [];
            args.json.versions.forEach((item) => {
                if (!item.deleted) {
                    images.unshift(item);
                }
            });
            checkPreviousImageAvailable(images);
        });
    }

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

    function showBanGroupDialog(groupId, userId) {
        const D = banGroupDialog.value;
        D.groupId = groupId;
        D.userId = userId;
        D.visible = true;
    }

    function userDialogCommand(command) {
        let L;
        const D = props.userDialog;
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
                    $message('Request invite sent');
                    return args;
                });
        } else if (command === 'Invite Message') {
            L = parseLocation(props.lastLocation.location);
            worldRequest
                .getCachedWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    showSendInviteDialog(
                        {
                            instanceId: props.lastLocation.location,
                            worldId: props.lastLocation.location,
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
            let currentLocation = props.lastLocation.location;
            if (props.lastLocation.location === 'traveling') {
                currentLocation = props.lastLocationDestination;
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
                            $message('Invite sent');
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
                $message({
                    message: 'No fallback avatar set',
                    type: 'error'
                });
            }
        } else if (command === 'Previous Images') {
            displayPreviousImages();
        } else if (command === 'Previous Instances') {
            showPreviousInstancesUserDialog(D.ref);
        } else if (command === 'Manage Gallery') {
            showGalleryDialog();
        } else if (command === 'Invite To Group') {
            showInviteGroupDialog('', D.id);
        } else if (command === 'Ban From Group') {
            showBanGroupDialog('', D.id);
            // } else if (command === 'Send Boop') {
            //     this.showSendBoopDialog(D.id);
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

            $confirm(
                t('confirm.message', {
                    command: displayCommandText
                }),
                t('confirm.title'),
                {
                    confirmButtonText: t('confirm.confirm_button'),
                    cancelButtonText: t('confirm.cancel_button'),
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            performUserDialogCommand(command, D.id);
                        }
                    }
                }
            );
        }
    }

    function handleSendFriendRequest(args) {
        // API.$on('FRIEND:REQUEST')
        const ref = API.cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        props.friendLogTable.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);

        // API.$on('FRIEND:REQUEST')
        const D = props.userDialog;
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
        // API.$on('FRIEND:REQUEST:CANCEL')
        const ref = API.cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        const friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        props.friendLogTable.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);

        // API.$on('FRIEND:REQUEST:CANCEL')
        const D = props.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    }

    function handleSendPlayerModeration(args) {
        // API.$on('PLAYER-MODERATION:SEND')
        const ref = {
            json: args.json,
            params: {
                playerModerationId: args.json.id
            }
        };
        API.$emit('PLAYER-MODERATION', ref);
        API.$emit('PLAYER-MODERATION:@SEND', ref);
    }

    async function performUserDialogCommand(command, userId) {
        let key;
        switch (command) {
            case 'Delete Favorite':
                favoriteRequest.deleteFavorite({
                    objectId: userId
                });
                break;
            case 'Accept Friend Request':
                key = API.getFriendRequest(userId);
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
                key = API.getFriendRequest(userId);
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
                const args = await friendRequest.cancelFriendRequest({
                    userId
                });
                handleCancelFriendRequest(args);
                break;
            }
            case 'Send Friend Request': {
                const args = await friendRequest.sendFriendRequest({
                    userId
                });
                handleSendFriendRequest(args);
                break;
            }
            case 'Moderation Unblock':
                playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                break;
            case 'Moderation Block': {
                const args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Unmute':
                playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                break;
            case 'Moderation Mute': {
                const args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Enable Avatar Interaction':
                playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'interactOff'
                });
                break;
            case 'Moderation Disable Avatar Interaction': {
                const args = await playerModerationRequest.sendPlayerModeration({
                    moderated: userId,
                    type: 'interactOff'
                });
                handleSendPlayerModeration(args);
                break;
            }
            case 'Moderation Enable Chatbox':
                playerModerationRequest.deletePlayerModeration({
                    moderated: userId,
                    type: 'muteChat'
                });
                break;
            case 'Moderation Disable Chatbox': {
                const args = await playerModerationRequest.sendPlayerModeration({
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
                friendRequest.deleteFriend({
                    userId
                });
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
        props.userDialog.isGroupsLoading = true;
        userGroups.value = {
            groups: [],
            ownGroups: [],
            mutualGroups: [],
            remainingGroups: []
        };
        const args = await groupRequest.getGroups({ userId });
        if (userId !== props.userDialog.id) {
            props.userDialog.isGroupsLoading = false;
            return;
        }
        if (userId === API.currentUser.id) {
            // update current user groups
            API.currentUserGroups.clear();
            args.json.forEach((group) => {
                const ref = API.applyGroup(group);
                if (!API.currentUserGroups.has(group.id)) {
                    API.currentUserGroups.set(group.id, ref);
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
            if (userId === API.currentUser.id) {
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
        if (userId === API.currentUser.id) {
            props.userDialog.groupSorting = userDialogGroupSortingOptions.inGame;
        } else if (props.userDialog.groupSorting === userDialogGroupSortingOptions.inGame) {
            props.userDialog.groupSorting = userDialogGroupSortingOptions.alphabetical;
        }
        await sortCurrentUserGroups();
        props.userDialog.isGroupsLoading = false;
    }

    function compareByMemberCount(a, b) {
        if (typeof a.memberCount !== 'number' || typeof b.memberCount !== 'number') {
            return 0;
        }
        return a.memberCount - b.memberCount;
    }

    function sortGroupsByInGame(a, b) {
        const aIndex = props.inGameGroupOrder.indexOf(a?.id);
        const bIndex = props.inGameGroupOrder.indexOf(b?.id);
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
        const D = props.userDialog;
        let sortMethod = function () {};

        switch (D.groupSorting.value) {
            case 'alphabetical':
                sortMethod = utils.compareByName;
                break;
            case 'members':
                sortMethod = compareByMemberCount;
                break;
            case 'inGame':
                sortMethod = sortGroupsByInGame;
                await props.updateInGameGroupOrder();
                break;
        }

        userGroups.value.ownGroups.sort(sortMethod);
        userGroups.value.mutualGroups.sort(sortMethod);
        userGroups.value.remainingGroups.sort(sortMethod);
    }

    function setUserDialogAvatars(userId) {
        const avatars = new Set();
        userDialogAvatars.value.forEach((avatar) => {
            avatars.add(avatar.id, avatar);
        });
        for (const ref of API.cachedAvatars.values()) {
            if (ref.authorId === userId && !avatars.has(ref.id)) {
                props.userDialog.avatars.push(ref);
            }
        }
        sortUserDialogAvatars(props.userDialog.avatars);
    }

    function setUserDialogWorlds(userId) {
        const worlds = [];
        for (const ref of API.cachedWorlds.values()) {
            if (ref.authorId === userId) {
                worlds.push(ref);
            }
        }
        props.userDialog.worlds = worlds;
    }

    function refreshUserDialogWorlds() {
        const D = props.userDialog;
        if (D.isWorldsLoading) {
            return;
        }
        D.isWorldsLoading = true;
        const params = {
            n: 50,
            offset: 0,
            sort: props.userDialog.worldSorting.value,
            order: props.userDialog.worldOrder.value,
            // user: 'friends',
            userId: D.id,
            releaseStatus: 'public'
        };
        if (params.userId === API.currentUser.id) {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        const map = new Map();
        for (const ref of API.cachedWorlds.values()) {
            if (ref.authorId === D.id && (ref.authorId === API.currentUser.id || ref.releaseStatus === 'public')) {
                API.cachedWorlds.delete(ref.id);
            }
        }
        API.bulk({
            fn: worldRequest.getWorlds,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    const $ref = API.cachedWorlds.get(json.id);
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
        props.userDialog.isFavoriteWorldsLoading = true;
        if (favoriteWorldsRef.value) {
            favoriteWorldsRef.value.currentName = '0'; // select first tab
        }
        userFavoriteWorlds.value = [];
        const worldLists = [];
        let params = {
            ownerId: userId,
            n: 100
        };
        const json = await API.call('favorite/groups', {
            method: 'GET',
            params
        });
        for (let i = 0; i < json.length; ++i) {
            const list = json[i];
            if (list.type !== 'world') {
                continue;
            }
            params = {
                n: 100,
                offset: 0,
                userId,
                tag: list.name
            };
            try {
                const args = await favoriteRequest.getFavoriteWorlds(params);
                worldLists.push([list.displayName, list.visibility, args.json]);
            } catch (err) {
                console.error('getUserFavoriteWorlds', err);
            }
        }
        userFavoriteWorlds.value = worldLists;
        props.userDialog.isFavoriteWorldsLoading = false;
    }

    function userDialogTabClick(obj) {
        const userId = props.userDialog.id;
        if (userDialogLastActiveTab.value === obj.label) {
            return;
        }
        if (obj.label === t('dialog.user.groups.header')) {
            if (userDialogLastGroup.value !== userId) {
                userDialogLastGroup.value = userId;
                getUserGroups(userId);
            }
        } else if (obj.label === t('dialog.user.avatars.header')) {
            setUserDialogAvatars(userId);
            if (userDialogLastAvatar.value !== userId) {
                userDialogLastAvatar.value = userId;
                if (userId === API.currentUser.id) {
                    refreshUserDialogAvatars();
                } else {
                    setUserDialogAvatarsRemote(userId);
                }
            }
        } else if (obj.label === t('dialog.user.worlds.header')) {
            setUserDialogWorlds(userId);
            if (userDialogLastWorld.value !== userId) {
                userDialogLastWorld.value = userId;
                refreshUserDialogWorlds();
            }
        } else if (obj.label === t('dialog.user.favorite_worlds.header')) {
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
                getUserFavoriteWorlds(userId);
            }
        } else if (obj.label === t('dialog.user.json.header')) {
            refreshUserDialogTreeData();
        }
        userDialogLastActiveTab.value = obj.label;
    }

    function checkNote(ref, note) {
        if (ref.note !== note) {
            addNote(ref.id, note);
        }
    }

    async function addNote(userId, note) {
        if (props.userDialog.id === userId) {
            props.userDialog.noteSaving = true;
        }
        const args = await miscRequest.saveNote({
            targetUserId: userId,
            note
        });
        handleNoteChange(args);
    }

    function handleNoteChange(args) {
        // API.$on('NOTE')
        let _note = '';
        let targetUserId = '';
        if (typeof args.json !== 'undefined') {
            _note = utils.replaceBioSymbols(args.json.note);
        }
        if (typeof args.params !== 'undefined') {
            targetUserId = args.params.targetUserId;
        }
        if (targetUserId === props.userDialog.id) {
            if (_note === args.params.note) {
                props.userDialog.noteSaving = false;
                props.userDialog.note = _note;
            } else {
                // response is cached sadge :<
                userRequest.getUser({ userId: targetUserId });
            }
        }
        const ref = API.cachedUsers.get(targetUserId);
        if (typeof ref !== 'undefined') {
            API.applyUser({
                id: targetUserId,
                note: _note
            });
        }
    }

    async function deleteNote(userId) {
        if (props.userDialog.id === userId) {
            props.userDialog.noteSaving = true;
        }
        const args = await miscRequest.saveNote({
            targetUserId: userId,
            note: ''
        });
        handleNoteChange(args);
    }

    function onUserMemoChange() {
        const D = props.userDialog;
        saveUserMemo(D.id, D.memo);
    }

    function showBioDialog() {
        const D = bioDialog.value;
        D.bio = API.currentUser.bio;
        D.bioLinks = API.currentUser.bioLinks.slice();
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

    function timeToText(args) {
        return utils.timeToText(args);
    }

    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({
            allowAvatarCopying: !API.currentUser.allowAvatarCopying
        });
        //     .then((args) => {
        //     return args;
        // });
    }

    function resetHome() {
        $confirm('Continue? Reset Home', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    userRequest
                        .saveCurrentUser({
                            homeLocation: ''
                        })
                        .then((args) => {
                            $message({
                                message: 'Home world has been reset',
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
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
        const D = props.userDialog;
        if (D.groupSorting === sortOrder) {
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
        await props.updateInGameGroupOrder();
        userDialogGroupEditGroups.value = Array.from(API.currentUserGroups.values());
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        userDialogGroupEditMode.value = true;
    }

    async function saveInGameGroupOrder() {
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        try {
            await AppApi.SetVRChatRegistryKey(
                `VRC_GROUP_ORDER_${API.currentUser.id}`,
                JSON.stringify(props.inGameGroupOrder),
                3
            );
        } catch (err) {
            console.error(err);
            $message({
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
        const index = props.inGameGroupOrder.indexOf(groupId);
        if (index > 0) {
            props.inGameGroupOrder.splice(index, 1);
            props.inGameGroupOrder.splice(index - 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupDown(groupId) {
        const index = props.inGameGroupOrder.indexOf(groupId);
        if (index < props.inGameGroupOrder.length - 1) {
            props.inGameGroupOrder.splice(index, 1);
            props.inGameGroupOrder.splice(index + 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupTop(groupId) {
        const index = props.inGameGroupOrder.indexOf(groupId);
        if (index > 0) {
            props.inGameGroupOrder.splice(index, 1);
            props.inGameGroupOrder.unshift(groupId);
            saveInGameGroupOrder();
        }
    }

    function moveGroupBottom(groupId) {
        const index = props.inGameGroupOrder.indexOf(groupId);
        if (index < props.inGameGroupOrder.length - 1) {
            props.inGameGroupOrder.splice(index, 1);
            props.inGameGroupOrder.push(groupId);
            saveInGameGroupOrder();
        }
    }

    async function setUserDialogWorldSorting(sortOrder) {
        const D = props.userDialog;
        if (D.worldSorting === sortOrder) {
            return;
        }
        D.worldSorting = sortOrder;
        refreshUserDialogWorlds();
    }

    async function setUserDialogWorldOrder(order) {
        const D = props.userDialog;
        if (D.worldOrder === order) {
            return;
        }
        D.worldOrder = order;
        refreshUserDialogWorlds();
    }

    function changeUserDialogAvatarSorting(sortOption) {
        const D = props.userDialog;
        D.avatarSorting = sortOption;
        sortUserDialogAvatars(D.avatars);
    }

    function refreshUserDialogTreeData() {
        emit('refreshUserDialogTreeData');
    }
    function setGroupVisibility(groupId, visibility) {
        emit('setGroupVisibility', groupId, visibility);
    }
    function refreshUserDialogAvatars() {
        emit('refreshUserDialogAvatars');
    }
    function leaveGroup(id) {
        emit('leaveGroup', id);
    }
    function leaveGroupPrompt(id) {
        emit('leaveGroupPrompt', id);
    }
    function sortUserDialogAvatars(avatars) {
        emit('sortUserDialogAvatars', avatars);
    }
    function logout() {
        emit('logout');
    }
    function showAvatarAuthorDialog(userId, authorId, currentAvatarImageUrl) {
        emit('showAvatarAuthorDialog', userId, authorId, currentAvatarImageUrl);
    }
    function showGalleryDialog() {
        emit('showGalleryDialog');
    }
    function saveCurrentUserGroups() {
        emit('saveCurrentUserGroups');
    }
    function saveUserMemo(userId, memo) {
        emit('saveUserMemo', userId, memo);
    }
    function closeInviteDialog() {
        clearInviteImageUpload();
    }
</script>
