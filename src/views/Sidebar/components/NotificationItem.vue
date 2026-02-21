<template>
    <Item size="sm" variant="muted" class="mb-1.5">
        <ItemMedia variant="image" class="cursor-pointer" @click.stop="openSender">
            <Avatar class="size-full">
                <AvatarImage v-if="avatarUrl" :src="avatarUrl" />
                <AvatarFallback class="text-muted-foreground">
                    <component :is="typeIcon" class="size-4" />
                </AvatarFallback>
            </Avatar>
        </ItemMedia>
        <ItemContent class="min-w-0">
            <ItemTitle class="min-w-0">
                <span class="truncate cursor-pointer" @click.stop="openSender">{{ senderName }}</span>
                <Badge variant="secondary" class="shrink-0 text-muted-foreground text-[10px]">
                    {{ typeLabel }}
                </Badge>
                <span
                    v-if="!isNotificationExpired(notification) && !isSeen"
                    class="ml-auto size-2 shrink-0 rounded-full bg-blue-500" />
            </ItemTitle>
            <TooltipWrapper v-if="displayMessage" side="top" :content="displayMessage" :delay-duration="600">
                <ItemDescription class="text-xs select-none line-clamp-3">
                    {{ displayMessage }}
                </ItemDescription>
            </TooltipWrapper>
        </ItemContent>

        <div class="flex shrink-0 flex-col items-end gap-1">
            <span class="text-[10px] text-muted-foreground whitespace-nowrap">
                {{ relativeTime }}
            </span>
            <div class="flex items-center gap-1">
                <template v-if="!isNotificationExpired(notification)">
                    <TooltipWrapper
                        v-if="notification.type === 'friendRequest'"
                        side="top"
                        :content="t('view.notification.actions.accept')">
                        <button
                            type="button"
                            class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            @click.stop="notificationStore.acceptFriendRequestNotification(notification)">
                            <Check class="size-3" />
                        </button>
                    </TooltipWrapper>

                    <TooltipWrapper
                        v-if="notification.type === 'invite'"
                        side="top"
                        :content="t('view.notification.actions.decline_with_message')">
                        <button
                            type="button"
                            class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            @click.stop="$emit('show-invite-response', notification)">
                            <MessageCircle class="size-3" />
                        </button>
                    </TooltipWrapper>

                    <template v-if="notification.type === 'requestInvite'">
                        <TooltipWrapper v-if="canInvite" side="top" :content="t('view.notification.actions.invite')">
                            <button
                                type="button"
                                class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                @click.stop="notificationStore.acceptRequestInvite(notification)">
                                <Check class="size-3" />
                            </button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('view.notification.actions.decline_with_message')">
                            <button
                                type="button"
                                class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                @click.stop="$emit('show-invite-request-response', notification)">
                                <MessageCircle class="size-3" />
                            </button>
                        </TooltipWrapper>
                    </template>

                    <template v-if="hasResponses">
                        <TooltipWrapper
                            v-for="response in notification.responses"
                            :key="`${response.text}:${response.type}`"
                            side="top"
                            :content="response.text">
                            <button
                                type="button"
                                class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                @click.stop="handleResponse(response)">
                                <component :is="getResponseIcon(response)" class="size-3" />
                            </button>
                        </TooltipWrapper>
                    </template>

                    <TooltipWrapper v-if="showDecline" side="top" :content="t('view.notification.actions.decline')">
                        <button
                            type="button"
                            class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                            @click.stop="notificationStore.hideNotificationPrompt(notification)">
                            <X class="size-3" />
                        </button>
                    </TooltipWrapper>
                </template>

                <TooltipWrapper v-if="showDeleteLog" side="top" :content="t('view.notification.actions.delete_log')">
                    <button
                        type="button"
                        class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                        @click.stop="notificationStore.deleteNotificationLogPrompt(notification)">
                        <Trash2 class="size-3" />
                    </button>
                </TooltipWrapper>
            </div>
        </div>
    </Item>
</template>

<script setup>
    import {
        Ban,
        Bell,
        BellOff,
        Check,
        Link,
        Mail,
        MessageCircle,
        Reply,
        Send,
        Tag,
        Trash2,
        UserPlus,
        Users,
        X
    } from 'lucide-vue-next';
    import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { computed, onMounted } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { notificationRequest } from '@/api';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useGameStore, useGroupStore, useLocationStore, useNotificationStore, useUserStore } from '../../../stores';
    import { checkCanInvite, userImage } from '../../../shared/utils';

    const props = defineProps({
        notification: { type: Object, required: true },
        isUnseen: { type: Boolean, default: false }
    });

    defineEmits(['show-invite-response', 'show-invite-request-response']);

    const { t, te } = useI18n();
    const userStore = useUserStore();
    const groupStore = useGroupStore();
    const notificationStore = useNotificationStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { openNotificationLink, isNotificationExpired, handleNotificationV2Hide } = useNotificationStore();

    const senderName = computed(() => {
        const n = props.notification;
        return n.senderUsername || n.data?.groupName || n.groupName || n.details?.groupName || '';
    });

    const avatarUrl = computed(() => {
        const n = props.notification;
        const userId = n.senderUserId;

        // Group notifications: use details.imageUrl or imageUrl
        if (userId?.startsWith('grp_') || n.type?.startsWith('group.') || n.type === 'groupChange') {
            return n.details?.imageUrl || n.imageUrl || n.senderUserIcon || null;
        }

        // User notifications: try cached user first, then fallback
        if (userId) {
            const user = userStore.cachedUsers.get(userId);
            if (user) {
                return userImage(user);
            }
        }
        return n.senderUserIcon || null;
    });

    const typeLabel = computed(() => {
        const typeKey = `view.notification.filters.${props.notification.type}`;
        return te(typeKey) ? t(typeKey) : props.notification.type;
    });

    const TYPE_ICON_MAP = {
        friendRequest: UserPlus,
        ignoredFriendRequest: UserPlus,
        invite: Send,
        requestInvite: Send,
        inviteResponse: Send,
        requestInviteResponse: Send,
        boop: MessageCircle,
        message: Mail
    };

    const typeIcon = computed(() => {
        const type = props.notification.type;
        if (TYPE_ICON_MAP[type]) return TYPE_ICON_MAP[type];
        if (type?.startsWith('group.') || type === 'groupChange') return Users;
        return Bell;
    });

    const displayMessage = computed(() => {
        const n = props.notification;
        if (n.message) return n.message;
        if (n.details?.inviteMessage) return n.details.inviteMessage;
        if (n.details?.requestMessage) return n.details.requestMessage;
        if (n.details?.responseMessage) return n.details.responseMessage;
        if (n.details?.worldName) return n.details.worldName;
        return '';
    });

    const relativeTime = computed(() => {
        const createdAt = props.notification.created_at || props.notification.createdAt;
        if (!createdAt) return '';
        return dayjs(createdAt).fromNow(true);
    });

    const showDecline = computed(() => {
        const type = props.notification.type;
        const link = props.notification.link;
        return (
            type !== 'requestInviteResponse' &&
            type !== 'inviteResponse' &&
            type !== 'message' &&
            type !== 'boop' &&
            type !== 'groupChange' &&
            !type?.includes('group.') &&
            !type?.includes('moderation.') &&
            !type?.includes('instance.') &&
            !link?.startsWith('economy.')
        );
    });

    const hasResponses = computed(() => Array.isArray(props.notification.responses));

    const showDeleteLog = computed(() => {
        const n = props.notification;
        const type = n.type;
        if (type === 'friendRequest' || type === 'ignoredFriendRequest') return false;
        return true;
    });

    const isSeen = computed(() => {
        const n = props.notification;
        if (typeof n.seen === 'boolean') {
            return n.seen;
        }
        // Fallback for v1 notifications without seen property
        return !props.isUnseen;
    });

    const canInvite = computed(() => {
        const location = lastLocation.value?.location;
        return Boolean(location) && isGameRunning.value && checkCanInvite(location);
    });

    function getResponseIcon(response) {
        if (response?.type === 'link') return Link;
        switch (response?.icon) {
            case 'check':
                return Check;
            case 'cancel':
                return X;
            case 'ban':
                return Ban;
            case 'bell-slash':
                return BellOff;
            case 'reply':
                return props.notification.type === 'boop' ? MessageCircle : Reply;
            default:
                return Tag;
        }
    }

    function handleResponse(response) {
        if (response.type === 'link') {
            openNotificationLink(response.data);
            return;
        }
        if (response.icon === 'reply' && props.notification.type === 'boop') {
            userStore.showSendBoopDialog(props.notification.senderUserId);
            return;
        }
        notificationStore.sendNotificationResponse(props.notification.id, props.notification.responses, response.type);
    }

    function openSender() {
        const userId = props.notification.senderUserId;
        if (userId) {
            if (userId.startsWith('grp_')) {
                groupStore.showGroupDialog(userId);
            } else {
                userStore.showUserDialog(userId);
            }
            return;
        }
        const link = props.notification.link;
        if (link) {
            openNotificationLink(link);
        }
    }

    onMounted(() => {
        // Mark as seen
        if (isNotificationExpired(props.notification) || isSeen.value) {
            return;
        }
        const params = { notificationId: props.notification.id };
        if (!props.notification.version || props.notification.version < 2) {
            notificationRequest.seeNotification({ notificationId: props.notification.id }).then((args) => {
                console.log('Marked notification-v1 as seen:', args.json);
                notificationStore.handleNotificationSee(props.notification.id);
            });
            return;
        }
        notificationRequest
            .seeNotificationV2(params)
            .then((args) => {
                console.log('Marked notification-v2 as seen:', args.json);
                const newArgs = {
                    params,
                    json: {
                        ...args.json,
                        seen: true
                    }
                };
                notificationStore.handleNotificationV2Update(newArgs);
            })
            .catch((err) => {
                console.error('Failed to mark notification-v2 as seen:', err);
                handleNotificationV2Hide(props.notification.id);
            });
    });
</script>
