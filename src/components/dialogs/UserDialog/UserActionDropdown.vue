<template>
    <div style="flex: none">
        <template v-if="(currentUser.id !== userDialog.ref.id && userDialog.isFriend) || userDialog.isFavorite">
            <TooltipWrapper
                v-if="userDialog.isFavorite"
                side="top"
                :content="t('dialog.user.actions.unfavorite_tooltip')">
                <el-button
                    type="warning"
                    :icon="StarFilled"
                    size="large"
                    circle
                    @click="userDialogCommand('Add Favorite')"></el-button>
            </TooltipWrapper>
            <TooltipWrapper v-else side="top" :content="t('dialog.user.actions.favorite_tooltip')">
                <el-button
                    type="default"
                    :icon="Star"
                    size="large"
                    circle
                    @click="userDialogCommand('Add Favorite')"></el-button>
            </TooltipWrapper>
        </template>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
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
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem @click="onCommand('Refresh')">
                    <Refresh class="size-4" />
                    {{ t('dialog.user.actions.refresh') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="onCommand('Share')">
                    <Share class="size-4" />
                    {{ t('dialog.user.actions.share') }}
                </DropdownMenuItem>
                <template v-if="userDialog.ref.id === currentUser.id">
                    <DropdownMenuItem @click="onCommand('Show Avatar Author')">
                        <UserFilled class="size-4" />
                        {{ t('dialog.user.actions.show_avatar_author') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Show Fallback Avatar Details')">
                        <UserFilled class="size-4" />
                        {{ t('dialog.user.actions.show_fallback_avatar') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Edit Social Status')">
                        <Edit class="size-4" />
                        {{ t('dialog.user.actions.edit_status') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Edit Language')">
                        <Edit class="size-4" />
                        {{ t('dialog.user.actions.edit_language') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Edit Bio')">
                        <Edit class="size-4" />
                        {{ t('dialog.user.actions.edit_bio') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Edit Pronouns')">
                        <Edit class="size-4" />
                        {{ t('dialog.user.actions.edit_pronouns') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Logout')">
                        <SwitchButton class="size-4" />
                        {{ t('dialog.user.actions.logout') }}
                    </DropdownMenuItem>
                </template>
                <template v-else>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="onCommand('Request Invite')">
                            <Postcard class="size-4" />
                            {{ t('dialog.user.actions.request_invite') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Request Invite Message')">
                            <Postcard class="size-4" />
                            {{ t('dialog.user.actions.request_invite_with_message') }}
                        </DropdownMenuItem>
                        <template v-if="isGameRunning">
                            <DropdownMenuItem
                                :disabled="!checkCanInvite(lastLocation.location)"
                                @click="onCommand('Invite')">
                                <Message class="size-4" />
                                {{ t('dialog.user.actions.invite') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                :disabled="!checkCanInvite(lastLocation.location)"
                                @click="onCommand('Invite Message')">
                                <Message class="size-4" />
                                {{ t('dialog.user.actions.invite_with_message') }}
                            </DropdownMenuItem>
                        </template>
                        <DropdownMenuItem :disabled="!currentUser.isBoopingEnabled" @click="onCommand('Send Boop')">
                            <Pointer class="size-4" />
                            {{ t('dialog.user.actions.send_boop') }}
                        </DropdownMenuItem>
                    </template>
                    <template v-else-if="userDialog.incomingRequest">
                        <DropdownMenuItem @click="onCommand('Accept Friend Request')">
                            <Check class="size-4" />
                            {{ t('dialog.user.actions.accept_friend_request') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Decline Friend Request')">
                            <Close class="size-4" />
                            {{ t('dialog.user.actions.decline_friend_request') }}
                        </DropdownMenuItem>
                    </template>
                    <DropdownMenuItem
                        v-else-if="userDialog.outgoingRequest"
                        @click="onCommand('Cancel Friend Request')">
                        <Close class="size-4" />
                        {{ t('dialog.user.actions.cancel_friend_request') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Send Friend Request')">
                        <Plus class="size-4" />
                        {{ t('dialog.user.actions.send_friend_request') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Invite To Group')">
                        <Message class="size-4" />
                        {{ t('dialog.user.actions.invite_to_group') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Group Moderation')">
                        <Operation class="size-4" />
                        {{ t('dialog.user.actions.group_moderation') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Edit Note Memo')">
                        <Edit class="size-4" />
                        Edit Note and Memo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Show Avatar Author')">
                        <UserFilled class="size-4" />
                        {{ t('dialog.user.actions.show_avatar_author') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Show Fallback Avatar Details')">
                        <UserFilled class="size-4" />
                        {{ t('dialog.user.actions.show_fallback_avatar') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Previous Instances')">
                        <DataLine class="size-4" />
                        {{ t('dialog.user.actions.show_previous_instances') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        v-if="userDialog.isBlock"
                        variant="destructive"
                        @click="onCommand('Moderation Unblock')">
                        <CircleCheck class="size-4" />
                        {{ t('dialog.user.actions.moderation_unblock') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-else
                        :disabled="userDialog.ref.$isModerator"
                        @click="onCommand('Moderation Block')">
                        <CircleClose class="size-4" />
                        {{ t('dialog.user.actions.moderation_block') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="userDialog.isMute"
                        variant="destructive"
                        @click="onCommand('Moderation Unmute')">
                        <Microphone class="size-4" />
                        {{ t('dialog.user.actions.moderation_unmute') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-else
                        :disabled="userDialog.ref.$isModerator"
                        @click="onCommand('Moderation Mute')">
                        <Mute class="size-4" />
                        {{ t('dialog.user.actions.moderation_mute') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="userDialog.isMuteChat"
                        variant="destructive"
                        @click="onCommand('Moderation Enable Chatbox')">
                        <ChatLineRound class="size-4" />
                        {{ t('dialog.user.actions.moderation_enable_chatbox') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Moderation Disable Chatbox')">
                        <ChatDotRound class="size-4" />
                        {{ t('dialog.user.actions.moderation_disable_chatbox') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Show Avatar')">
                        <User class="size-4" />
                        <Check v-if="userDialog.isShowAvatar" class="size-4" />
                        <span>{{ t('dialog.user.actions.moderation_show_avatar') }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Hide Avatar')">
                        <User class="size-4" />
                        <Check v-if="userDialog.isHideAvatar" class="size-4" />
                        <span>{{ t('dialog.user.actions.moderation_hide_avatar') }}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="userDialog.isInteractOff"
                        variant="destructive"
                        @click="onCommand('Moderation Enable Avatar Interaction')">
                        <Pointer class="size-4" />
                        {{ t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Moderation Disable Avatar Interaction')">
                        <CircleClose class="size-4" />
                        {{ t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem :disabled="userDialog.ref.$isModerator" @click="onCommand('Report Hacking')">
                        <Flag class="size-4" />
                        {{ t('dialog.user.actions.report_hacking') }}
                    </DropdownMenuItem>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @click="onCommand('Unfriend')">
                            <Delete class="size-4" />
                            {{ t('dialog.user.actions.unfriend') }}
                        </DropdownMenuItem>
                    </template>
                </template>
            </DropdownMenuContent>
        </DropdownMenu>
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

    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
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
