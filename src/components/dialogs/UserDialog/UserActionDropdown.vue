<template>
    <div style="flex: none" class="flex items-center">
        <template v-if="(currentUser.id !== userDialog.ref.id && userDialog.isFriend) || userDialog.isFavorite">
            <TooltipWrapper
                v-if="userDialog.isFavorite"
                side="top"
                :ignore-non-keyboard-focus="true"
                :content="t('dialog.user.actions.unfavorite_tooltip')">
                <Button class="rounded-full" size="icon-lg" @click="userDialogCommand('Add Favorite')"><Star /></Button>
            </TooltipWrapper>
            <TooltipWrapper
                v-else
                side="top"
                :ignore-non-keyboard-focus="true"
                :content="t('dialog.user.actions.favorite_tooltip')">
                <Button class="rounded-full" size="icon-lg" variant="outline" @click="userDialogCommand('Add Favorite')"
                    ><Star
                /></Button>
            </TooltipWrapper>
        </template>
        <DropdownMenu>
            <DropdownMenuTrigger as-child>
                <div class="ml-2">
                    <Button variant="outline" size="icon-lg" class="rounded-full">
                        <MoreHorizontal />
                        <span
                            class="absolute right-6 top-15.5 h-2.5 w-2.5 rounded-full ring-2 ring-background"
                            :class="dotClass" />
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem @click="onCommand('RefreshCw')">
                    <RefreshCw class="size-4" />
                    {{ t('dialog.user.actions.refresh') }}
                </DropdownMenuItem>
                <DropdownMenuItem @click="onCommand('Share2')">
                    <Share2 class="size-4" />
                    {{ t('dialog.user.actions.share') }}
                </DropdownMenuItem>
                <template v-if="userDialog.ref.id === currentUser.id">
                    <DropdownMenuItem @click="onCommand('Show Avatar Author')">
                        <User class="size-4" />
                        {{ t('dialog.user.actions.show_avatar_author') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Show Fallback Avatar Details')">
                        <User class="size-4" />
                        {{ t('dialog.user.actions.show_fallback_avatar') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Pencil Social Status')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_status') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Pencil Language')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_language') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Pencil Bio')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_bio') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Pencil Pronouns')">
                        <Pencil class="size-4" />
                        {{ t('dialog.user.actions.edit_pronouns') }}
                    </DropdownMenuItem>
                </template>
                <template v-else>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="onCommand('Request Invite')">
                            <Mail class="size-4" />
                            {{ t('dialog.user.actions.request_invite') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Request Invite MessageSquare')">
                            <Mail class="size-4" />
                            {{ t('dialog.user.actions.request_invite_with_message') }}
                        </DropdownMenuItem>
                        <template v-if="isGameRunning">
                            <DropdownMenuItem
                                :disabled="!checkCanInvite(lastLocation.location)"
                                @click="onCommand('Invite')">
                                <MessageSquare class="size-4" />
                                {{ t('dialog.user.actions.invite') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                :disabled="!checkCanInvite(lastLocation.location)"
                                @click="onCommand('Invite MessageSquare')">
                                <MessageSquare class="size-4" />
                                {{ t('dialog.user.actions.invite_with_message') }}
                            </DropdownMenuItem>
                        </template>
                        <DropdownMenuItem :disabled="!currentUser.isBoopingEnabled" @click="onCommand('Send Boop')">
                            <MousePointer class="size-4" />
                            {{ t('dialog.user.actions.send_boop') }}
                        </DropdownMenuItem>
                    </template>
                    <template v-else-if="userDialog.incomingRequest">
                        <DropdownMenuItem @click="onCommand('Accept Friend Request')">
                            <Check class="size-4" />
                            {{ t('dialog.user.actions.accept_friend_request') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="onCommand('Decline Friend Request')">
                            <X class="size-4" />
                            {{ t('dialog.user.actions.decline_friend_request') }}
                        </DropdownMenuItem>
                    </template>
                    <DropdownMenuItem
                        v-else-if="userDialog.outgoingRequest"
                        @click="onCommand('Cancel Friend Request')">
                        <X class="size-4" />
                        {{ t('dialog.user.actions.cancel_friend_request') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Send Friend Request')">
                        <Plus class="size-4" />
                        {{ t('dialog.user.actions.send_friend_request') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Invite To Group')">
                        <MessageSquare class="size-4" />
                        {{ t('dialog.user.actions.invite_to_group') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Group Moderation')">
                        <Settings class="size-4" />
                        {{ t('dialog.user.actions.group_moderation') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Pencil Note Memo')">
                        <Pencil class="size-4" />
                        Pencil Note and Memo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="onCommand('Show Avatar Author')">
                        <User class="size-4" />
                        {{ t('dialog.user.actions.show_avatar_author') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Show Fallback Avatar Details')">
                        <User class="size-4" />
                        {{ t('dialog.user.actions.show_fallback_avatar') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="onCommand('Previous Instances')">
                        <LineChart class="size-4" />
                        {{ t('dialog.user.actions.show_previous_instances') }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        v-if="userDialog.isBlock"
                        variant="destructive"
                        @click="onCommand('Moderation Unblock')">
                        <CheckCircle class="size-4" />
                        {{ t('dialog.user.actions.moderation_unblock') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-else
                        :disabled="userDialog.ref.$isModerator"
                        @click="onCommand('Moderation Block')">
                        <XCircle class="size-4" />
                        {{ t('dialog.user.actions.moderation_block') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="userDialog.isMute"
                        variant="destructive"
                        @click="onCommand('Moderation Unmute')">
                        <Mic class="size-4" />
                        {{ t('dialog.user.actions.moderation_unmute') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-else
                        :disabled="userDialog.ref.$isModerator"
                        @click="onCommand('Moderation VolumeX')">
                        <VolumeX class="size-4" />
                        {{ t('dialog.user.actions.moderation_mute') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        v-if="userDialog.isMuteChat"
                        variant="destructive"
                        @click="onCommand('Moderation Enable Chatbox')">
                        <MessageCircle class="size-4" />
                        {{ t('dialog.user.actions.moderation_enable_chatbox') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Moderation Disable Chatbox')">
                        <MessageCircle class="size-4" />
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
                        <MousePointer class="size-4" />
                        {{ t('dialog.user.actions.moderation_enable_avatar_interaction') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem v-else @click="onCommand('Moderation Disable Avatar Interaction')">
                        <XCircle class="size-4" />
                        {{ t('dialog.user.actions.moderation_disable_avatar_interaction') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem :disabled="userDialog.ref.$isModerator" @click="onCommand('Report Hacking')">
                        <Flag class="size-4" />
                        {{ t('dialog.user.actions.report_hacking') }}
                    </DropdownMenuItem>
                    <template v-if="userDialog.isFriend">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @click="onCommand('Unfriend')">
                            <Trash2 class="size-4" />
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
        Check,
        CheckCircle,
        Flag,
        LineChart,
        Mail,
        MessageCircle,
        MessageSquare,
        Mic,
        MoreHorizontal,
        MousePointer,
        Pencil,
        Plus,
        RefreshCw,
        Settings,
        Share2,
        Star,
        Trash2,
        User,
        VolumeX,
        X,
        XCircle
    } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
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

    const hasRequest = computed(() => userDialog.value.incomingRequest || userDialog.value.outgoingRequest);
    const hasRisk = computed(() => userDialog.value.isBlock || userDialog.value.isMute);

    const dotClass = computed(() => {
        if (hasRequest.value) return 'bg-emerald-500';
        if (hasRisk.value) return 'bg-destructive';
        return null;
    });

    function onCommand(command) {
        props.userDialogCommand(command);
    }
</script>
