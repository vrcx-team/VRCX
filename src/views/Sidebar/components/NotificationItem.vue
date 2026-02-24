<template>
    <HoverCard :open-delay="400" :close-delay="100">
        <HoverCardTrigger as-child>
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
                    <ItemTitle class="min-w-0 w-full">
                        <span class="truncate cursor-pointer" @click.stop="openSender">{{ senderName }}</span>
                        <Badge variant="secondary" class="shrink-0 text-muted-foreground text-[10px]">
                            {{ typeLabel }}
                        </Badge>
                        <span
                            v-if="!isNotificationExpired(notification) && !isSeen"
                            class="ml-auto size-2 shrink-0 rounded-full bg-blue-500" />
                    </ItemTitle>
                    <ItemDescription
                        v-if="notification.type === 'invite' && notification.details?.worldId"
                        class="text-xs">
                        <Location
                            :location="notification.details.worldId"
                            :hint="notification.details.worldName || ''"
                            :grouphint="notification.details.groupName || ''"
                            link />
                    </ItemDescription>
                    <ItemDescription
                        v-else-if="
                            (notification.type === 'group.queueReady' || notification.type === 'instance.closed') &&
                            notification.location
                        "
                        class="text-xs">
                        <Location
                            :location="notification.location"
                            :hint="notification.worldName || ''"
                            :grouphint="notification.groupName || ''"
                            link />
                    </ItemDescription>
                    <ItemDescription v-if="displayMessage" class="text-xs select-none truncate">
                        {{ displayMessage }}
                    </ItemDescription>
                </ItemContent>

                <div class="flex h-full shrink-0 flex-col items-end justify-between gap-1">
                    <TooltipWrapper v-if="relativeTime" side="top" :content="absoluteTime">
                        <span class="text-[10px] text-muted-foreground whitespace-nowrap">
                            {{ relativeTime }}
                        </span>
                    </TooltipWrapper>
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
                                <TooltipWrapper
                                    v-if="canInvite"
                                    side="top"
                                    :content="t('view.notification.actions.invite')">
                                    <button
                                        type="button"
                                        class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                        @click.stop="notificationStore.acceptRequestInvite(notification)">
                                        <Check class="size-3" />
                                    </button>
                                </TooltipWrapper>
                                <TooltipWrapper
                                    side="top"
                                    :content="t('view.notification.actions.decline_with_message')">
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

                            <TooltipWrapper
                                v-if="showDecline"
                                side="top"
                                :content="t('view.notification.actions.decline')">
                                <button
                                    type="button"
                                    class="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted"
                                    @click.stop="notificationStore.hideNotificationPrompt(notification)">
                                    <X class="size-3" />
                                </button>
                            </TooltipWrapper>
                        </template>

                        <TooltipWrapper
                            v-if="showDeleteLog"
                            side="top"
                            :content="t('view.notification.actions.delete_log')">
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
        </HoverCardTrigger>
        <HoverCardContent side="left" :side-offset="8" class="w-100 p-3">
            <!-- Group  -->
            <template v-if="isGroupType">
                <div class="flex items-center gap-2 mb-2">
                    <Avatar class="size-8 shrink-0 rounded">
                        <AvatarImage v-if="hoverImageUrl" :src="hoverImageUrl" />
                        <AvatarFallback class="text-muted-foreground rounded">
                            <Users class="size-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0">
                        <p class="text-sm font-medium truncate">{{ groupDisplayName }}</p>
                        <p class="text-xs text-muted-foreground">{{ typeLabel }}</p>
                    </div>
                </div>
                <p v-if="hoverTitle" class="text-sm font-medium mb-1">{{ hoverTitle }}</p>
                <p
                    v-if="notification.message"
                    class="text-xs text-muted-foreground whitespace-pre-line warp-break-words leading-relaxed">
                    {{ notification.message }}
                </p>
            </template>

            <!-- Friend  -->
            <template v-else-if="isFriendType">
                <div class="flex items-center gap-2 mb-2">
                    <Avatar class="size-8 shrink-0">
                        <AvatarImage v-if="avatarUrl" :src="avatarUrl" />
                        <AvatarFallback class="text-muted-foreground">
                            <component :is="typeIcon" class="size-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0">
                        <p class="text-sm font-medium truncate">{{ senderName }}</p>
                        <p class="text-xs text-muted-foreground">{{ typeLabel }}</p>
                    </div>
                </div>
                <div v-if="notification.details?.worldId" class="text-xs mb-1">
                    <Location
                        :location="notification.details.worldId"
                        :hint="notification.details.worldName || ''"
                        :grouphint="notification.details.groupName || ''"
                        link />
                </div>
                <p v-if="friendMessage" class="text-xs text-muted-foreground warp-break-words leading-relaxed">
                    {{ friendMessage }}
                </p>
            </template>

            <!-- Other  -->
            <template v-else>
                <div class="flex items-center gap-2 mb-2">
                    <Avatar class="size-8 shrink-0">
                        <AvatarImage v-if="avatarUrl" :src="avatarUrl" />
                        <AvatarFallback class="text-muted-foreground">
                            <component :is="typeIcon" class="size-4" />
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0">
                        <p class="text-sm font-medium truncate">{{ senderName || notification.type }}</p>
                        <p class="text-xs text-muted-foreground">{{ typeLabel }}</p>
                    </div>
                </div>
                <p v-if="notification.title" class="text-sm font-medium mb-1">{{ notification.title }}</p>
                <p
                    v-if="displayMessage"
                    class="text-xs text-muted-foreground whitespace-pre-line wrap-break-words leading-relaxed">
                    {{ displayMessage }}
                </p>
            </template>

            <Separator v-if="absoluteTime" class="my-2" />
            <div v-if="absoluteTime" class="flex items-center gap-2 text-[10px] text-muted-foreground">
                <CalendarDays />{{ absoluteTime }}
            </div>
        </HoverCardContent>
    </HoverCard>
</template>

<script setup>
    import {
        Ban,
        Bell,
        BellOff,
        CalendarDays,
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
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { computed, onBeforeUnmount } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { Separator } from '@/components/ui/separator';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import { useGameStore, useGroupStore, useLocationStore, useNotificationStore, useUserStore } from '../../../stores';
    import { checkCanInvite, userImage } from '../../../shared/utils';

    import Location from '../../../components/Location.vue';

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
    const { openNotificationLink, isNotificationExpired } = useNotificationStore();

    const senderName = computed(() => {
        const n = props.notification;
        // if (n.senderUsername && n.senderUsername?.Value === null) {
        //     return n.title || n.data?.groupName || n.groupName || n.details?.groupName || '';
        // }
        return n.senderUsername || n.data?.groupName || n.groupName || n.details?.groupName || '';
    });

    const avatarUrl = computed(() => {
        const n = props.notification;
        const userId = typeof n.senderUserId === 'string' ? n.senderUserId : '';

        // Group notifications: use details.imageUrl or imageUrl
        if (userId.startsWith('grp_') || n.type?.startsWith('group.') || n.type === 'groupChange') {
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

    const createdAtValue = computed(() => props.notification.created_at || props.notification.createdAt);

    const relativeTime = computed(() => {
        if (!createdAtValue.value) return '';
        return dayjs(createdAtValue.value).fromNow(true);
    });

    const absoluteTime = computed(() => {
        if (!createdAtValue.value) return '';
        return dayjs(createdAtValue.value).format('YYYY-MM-DD HH:mm:ss');
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

    const isGroupType = computed(() => {
        const type = props.notification.type;
        return type?.startsWith('group.') || type === 'groupChange';
    });

    const isFriendType = computed(() => {
        const type = props.notification.type;
        return [
            'invite',
            'requestInvite',
            'inviteResponse',
            'requestInviteResponse',
            'friendRequest',
            'ignoredFriendRequest',
            'boop'
        ].includes(type);
    });

    const groupDisplayName = computed(() => {
        const n = props.notification;
        return n.data?.groupName || n.groupName || n.details?.groupName || n.senderUsername || '';
    });

    const hoverTitle = computed(() => {
        const n = props.notification;
        return n.data?.announcementTitle || n.title || '';
    });

    const hoverImageUrl = computed(() => {
        const n = props.notification;
        return n.imageUrl || n.details?.imageUrl || null;
    });

    const friendMessage = computed(() => {
        const n = props.notification;
        return n.message || n.details?.inviteMessage || n.details?.requestMessage || n.details?.responseMessage || '';
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
        const n = props.notification;
        const userId = typeof n.senderUserId === 'string' ? n.senderUserId : '';

        // Group notifications: try to find a group ID
        if (userId.startsWith('grp_') || n.type?.startsWith('group.') || n.type === 'groupChange') {
            const groupId = userId.startsWith('grp_') ? userId : n.data?.groupId || n.details?.groupId || '';
            if (groupId) {
                groupStore.showGroupDialog(groupId);
                return;
            }
        }

        if (userId) {
            userStore.showUserDialog(userId);
            return;
        }

        const link = n.link;
        if (link) {
            openNotificationLink(link);
        }
    }

    onBeforeUnmount(() => {
        // Mark as seen (queued to avoid 429 rate-limiting)
        if (isNotificationExpired(props.notification) || isSeen.value) {
            return;
        }
        const version = props.notification.version || 1;
        notificationStore.queueMarkAsSeen(props.notification.id, version);
    });
</script>
