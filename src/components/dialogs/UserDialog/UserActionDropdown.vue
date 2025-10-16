<template>
    <div style="flex: none">
        <template v-if="(currentUser.id !== userDialog.ref.id && userDialog.isFriend) || userDialog.isFavorite">
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
        <el-dropdown trigger="click" size="small" @command="onCommand">
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
                                    >{{ t('dialog.user.actions.invite_with_message') }}</el-dropdown-item
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
                        <el-dropdown-item v-else :icon="ChatDotRound" command="Moderation Disable Chatbox">
                            {{ t('dialog.user.actions.moderation_disable_chatbox') }}
                        </el-dropdown-item>
                        <el-dropdown-item :icon="User" command="Show Avatar">
                            <el-icon v-if="userDialog.isShowAvatar" style="margin-right: 5px"><Check /></el-icon>
                            <span>{{ t('dialog.user.actions.moderation_show_avatar') }}</span>
                        </el-dropdown-item>
                        <el-dropdown-item :icon="User" command="Hide Avatar">
                            <el-icon v-if="userDialog.isHideAvatar" style="margin-right: 5px"><Check /></el-icon>
                            <span>{{ t('dialog.user.actions.moderation_hide_avatar') }}</span>
                        </el-dropdown-item>
                        <el-dropdown-item
                            v-if="userDialog.isInteractOff"
                            :icon="Pointer"
                            command="Moderation Enable Avatar Interaction"
                            style="color: #f56c6c">
                            {{ t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                        </el-dropdown-item>
                        <el-dropdown-item v-else :icon="CircleClose" command="Moderation Disable Avatar Interaction">
                            {{ t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                        </el-dropdown-item>
                        <el-dropdown-item :icon="Flag" command="Report Hacking" :disabled="userDialog.ref.$isModerator">
                            {{ t('dialog.user.actions.report_hacking') }}
                        </el-dropdown-item>
                        <template v-if="userDialog.isFriend">
                            <el-dropdown-item :icon="Delete" command="Unfriend" divided style="color: #f56c6c">
                                {{ t('dialog.user.actions.unfriend') }}
                            </el-dropdown-item>
                        </template>
                    </template>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script setup>
    import {
        ChatDotRound,
        ChatLineRound,
        Check,
        CircleCheck,
        CircleClose,
        Close,
        DataLine,
        Delete,
        Edit,
        Flag,
        Message,
        Microphone,
        MoreFilled,
        Mute,
        Operation,
        Picture,
        Plus,
        Pointer,
        Postcard,
        Refresh,
        Share,
        Star,
        StarFilled,
        SwitchButton,
        User,
        UserFilled
    } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGameStore, useLocationStore, useUserStore } from '../../../stores';
    import { checkCanInvite } from '../../../shared/utils';

    const props = defineProps({
        userDialogCommand: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { lastLocation } = storeToRefs(useLocationStore());

    function onCommand(command) {
        props.userDialogCommand(command);
    }
</script>
