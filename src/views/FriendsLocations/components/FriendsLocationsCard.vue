<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
            <Card
                class="friend-card x-hover-card hover:bg-muted relative"
                :style="cardStyle"
                @click="showUserDialog(friend.id)">
                <div class="friend-card__header grid items-center mb-1.75">
                    <div>
                        <Avatar :style="{ width: `${avatarSize}px`, height: `${avatarSize}px` }">
                            <AvatarImage :src="userImage(friend.ref, true)" />
                            <AvatarFallback>{{ avatarFallback }}</AvatarFallback>
                        </Avatar>
                    </div>
                    <span
                        class="friend-card__status-dot absolute rounded-full pointer-events-none"
                        :class="statusDotClass"></span>
                    <div
                        class="friend-card__name font-semibold leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap ml-2"
                        :title="friend.name">
                        {{ friend.name }}
                    </div>
                </div>
                <div class="friend-card__body grid">
                    <div
                        class="friend-card__signature flex items-center overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground"
                        :title="friend.ref?.statusDescription">
                        <Pencil v-if="friend.ref?.statusDescription" class="h-3.5 w-3.5 mr-0.5" style="opacity: 0.7" />
                        {{ friend.ref?.statusDescription || '&nbsp;' }}
                    </div>
                    <div
                        v-if="displayInstanceInfo"
                        @click.stop
                        class="friend-card__world flex items-center justify-start box-border max-w-full min-w-0 overflow-hidden"
                        :title="friend.worldName">
                        <Location
                            class="friend-card__location flex w-full overflow-hidden leading-[1.3] wrap-break-word text-center"
                            :location="friend.ref?.location"
                            :traveling="friend.ref?.travelingToLocation"
                            link />
                    </div>
                </div>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem v-if="friend.state === 'online'" @click="friendRequestInvite">
                {{ t('dialog.user.actions.request_invite') }}
            </ContextMenuItem>
            <ContextMenuItem v-if="isGameRunning" :disabled="!canInviteToMyLocation" @click="friendInvite">
                {{ t('dialog.user.actions.invite') }}
            </ContextMenuItem>
            <ContextMenuItem :disabled="!currentUser?.isBoopingEnabled" @click="friendSendBoop">
                {{ t('dialog.user.actions.send_boop') }}
            </ContextMenuItem>
            <ContextMenuSeparator v-if="friend.state === 'online' && hasFriendLocation" />
            <ContextMenuItem
                v-if="friend.state === 'online' && hasFriendLocation"
                :disabled="!canJoinFriend"
                @click="friendJoin">
                {{ t('dialog.user.info.launch_invite_tooltip') }}
            </ContextMenuItem>
            <ContextMenuItem
                v-if="friend.state === 'online' && hasFriendLocation"
                :disabled="!canJoinFriend"
                @click="friendInviteSelf">
                {{ t('dialog.user.info.self_invite_tooltip') }}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Card } from '@/components/ui/card';
    import { Pencil } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { isRealInstance, parseLocation } from '../../../shared/utils';
    import { useGameStore, useLaunchStore, useLocationStore, useUserStore } from '../../../stores';
    import { instanceRequest, notificationRequest, queryRequest } from '../../../api';
    import { useInviteChecks } from '../../../composables/useInviteChecks';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    import Location from '../../../components/Location.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();
    const { showSendBoopDialog } = useUserStore();
    const launchStore = useLaunchStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { checkCanInvite, checkCanInviteSelf } = useInviteChecks();
    const { userImage, userStatusClass } = useUserDisplay();

    const props = defineProps({
        friend: {
            type: Object,
            required: true
        },
        cardScale: {
            type: Number,
            default: 1
        },
        displayInstanceInfo: {
            type: Boolean,
            default: true
        },
        cardSpacing: {
            type: Number,
            default: 1
        }
    });

    const avatarSize = computed(() => Math.max(36, 46 * props.cardScale));

    const cardStyle = computed(() => ({
        '--card-scale': props.cardScale,
        '--card-spacing': props.cardSpacing,
        cursor: 'pointer',
        padding: `${54 * props.cardScale * props.cardSpacing}px`,
        paddingBottom: `${36 * props.cardScale * props.cardSpacing}px !important`
    }));

    const avatarFallback = computed(() => props.friend?.name?.charAt(0) ?? '?');

    const statusDotClass = computed(() => {
        const status = userStatusClass(props.friend.ref, props.friend.pendingOffline);

        if (status.joinme) {
            return 'friend-card__status-dot--join';
        }
        if (status.online) {
            return 'friend-card__status-dot--online';
        }
        // sometimes appearing and sometimes disappearing
        if (status.active) {
            const friendStatus = props.friend.status;
            if (friendStatus === 'join me') {
                return 'friend-card__status-dot--active-join';
            }
            if (friendStatus === 'ask me') {
                return 'friend-card__status-dot--active-ask';
            }
            if (friendStatus === 'busy') {
                return 'friend-card__status-dot--active-busy';
            }
            return 'friend-card__status-dot--active';
        }
        if (status.askme) {
            return 'friend-card__status-dot--ask';
        }
        if (status.busy) {
            return 'friend-card__status-dot--busy';
        }
        if (status.offline) {
            return 'friend-card__status-dot--offline';
        }

        return 'friend-card__status-dot--hidden';
    });

    const canInviteToMyLocation = computed(() => checkCanInvite(lastLocation.value.location));

    const hasFriendLocation = computed(() => {
        const loc = props.friend.ref?.location;
        return !!loc && isRealInstance(loc);
    });

    const canJoinFriend = computed(() => {
        const loc = props.friend.ref?.location;
        if (!loc || !isRealInstance(loc)) return false;
        return checkCanInviteSelf(loc);
    });

    /**
     *
     */
    function friendRequestInvite() {
        notificationRequest.sendRequestInvite({ platform: 'standalonewindows' }, props.friend.id).then(() => {
            toast.success('Request invite sent');
        });
    }

    /**
     *
     */
    function friendInvite() {
        let currentLocation = lastLocation.value.location;
        if (currentLocation === 'traveling') {
            currentLocation = lastLocationDestination.value;
        }
        const L = parseLocation(currentLocation);
        queryRequest.fetch('world.location', { worldId: L.worldId }).then((args) => {
            notificationRequest
                .sendInvite(
                    {
                        instanceId: L.tag,
                        worldId: L.tag,
                        worldName: args.ref.name
                    },
                    props.friend.id
                )
                .then(() => {
                    toast.success(t('message.invite.sent'));
                });
        });
    }

    /**
     *
     */
    function friendSendBoop() {
        showSendBoopDialog(props.friend.id);
    }

    /**
     *
     */
    function friendJoin() {
        const loc = props.friend.ref?.location;
        if (!loc) return;
        launchStore.showLaunchDialog(loc);
    }

    /**
     *
     */
    function friendInviteSelf() {
        const loc = props.friend.ref?.location;
        if (!loc) return;
        const L = parseLocation(loc);
        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId
            })
            .then(() => {
                toast.success(t('message.invite.self_sent'));
            });
    }
</script>

<style scoped>
    .friend-card {
        --card-scale: 1;
        --card-spacing: 1;
        gap: calc(14px * var(--card-scale) * var(--card-spacing));
        max-width: var(--friend-card-target-width, 220px);
        min-width: var(--friend-card-min-width, 220px);
    }

    .friend-card__header {
        grid-template-columns: auto minmax(0, 1fr);
        gap: calc(10px * var(--card-scale) * var(--card-spacing));
    }

    .friend-card__status-dot {
        top: calc(8px * var(--card-scale));
        right: calc(8px * var(--card-scale));
        inline-size: calc(12px * var(--card-scale));
        block-size: calc(12px * var(--card-scale));
    }

    .friend-card__status-dot--hidden {
        display: none;
    }

    .friend-card__status-dot--online {
        background: var(--status-online);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-online) 40%, transparent);
    }

    .friend-card__status-dot--active {
        background: transparent;
        border: calc(2px * var(--card-scale)) solid var(--status-online);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-online) 40%, transparent);
    }

    .friend-card__status-dot--active-join {
        background: transparent;
        border: calc(2px * var(--card-scale)) solid var(--status-joinme);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-joinme) 40%, transparent);
    }

    .friend-card__status-dot--active-ask {
        background: transparent;
        border: calc(2px * var(--card-scale)) solid var(--status-askme);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-askme) 40%, transparent);
    }

    .friend-card__status-dot--active-busy {
        background: transparent;
        border: calc(2px * var(--card-scale)) solid var(--status-busy);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-busy) 40%, transparent);
    }

    .friend-card__status-dot--join {
        background: var(--status-joinme);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-joinme) 40%, transparent);
    }

    .friend-card__status-dot--busy {
        background: var(--status-busy);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-busy) 40%, transparent);
    }

    .friend-card__status-dot--ask {
        background: var(--status-askme);
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, var(--status-askme) 40%, transparent);
    }

    .friend-card__status-dot--offline {
        background: var(--status-offline-card);
    }

    .friend-card__body {
        gap: calc(8px * var(--card-scale) * var(--card-spacing));
    }

    .friend-card__name {
        font-size: calc(18px * var(--card-scale));
    }

    .friend-card__signature {
        font-size: calc(12px * var(--card-scale));
        line-height: 1.4;
        gap: calc(4px * var(--card-scale));
    }

    .friend-card__signature :deep(svg) {
        margin-top: calc(1px * var(--card-scale));
    }

    .friend-card__world {
        min-height: calc(40px * var(--card-scale));
        padding: calc(7px * var(--card-scale)) calc(8px * var(--card-scale));
        border-radius: calc(var(--radius-lg) * var(--card-scale));
        font-size: calc(12px * var(--card-scale));
        line-height: 1.3;
    }

    :global(html.dark) .friend-card__world,
    :global(:root.dark) .friend-card__world,
    :global(:root[data-theme='dark']) .friend-card__world {
        color: var(--color-zinc-300);
    }

    .friend-card__location {
        max-height: calc(36px * var(--card-scale));
        white-space: normal;
    }

    .friend-card__location :deep(.x-location__text) {
        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        text-overflow: ellipsis;
    }

    .friend-card__location :deep(.x-location__text:only-child) {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(24px * var(--card-scale));
    }

    .friend-card__location :deep(.x-location__text:only-child span) {
        display: block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-card__location :deep(.x-location__meta) {
        display: none;
    }

    .friend-card__location :deep(.flags) {
        scale: calc(1 * var(--card-scale));
        filter: brightness(1.05);
    }
</style>
