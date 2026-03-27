<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
            <slot />
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem @click="handleViewDetails">
                <ExternalLink class="size-4" />
                {{ t('common.actions.view_details') }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem v-if="isOnline" @click="handleRequestInvite">
                <Mail class="size-4" />
                {{ t('dialog.user.actions.request_invite') }}
                <ContextMenuShortcut v-if="showRecentRequestInvite">
                    <Clock class="size-3.5 text-muted-foreground" />
                </ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem
                v-if="isGameRunning"
                :disabled="!canInviteToMyLocation"
                @click="handleInvite">
                <MessageSquare class="size-4" />
                {{ t('dialog.user.actions.invite') }}
                <ContextMenuShortcut v-if="showRecentInvite">
                    <Clock class="size-3.5 text-muted-foreground" />
                </ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem :disabled="!currentUser?.isBoopingEnabled" @click="handleSendBoop">
                <MousePointer class="size-4" />
                {{ t('dialog.user.actions.send_boop') }}
            </ContextMenuItem>
            <ContextMenuSeparator v-if="isOnline && hasLocation" />
            <ContextMenuItem
                v-if="isOnline && hasLocation"
                :disabled="!canJoin"
                @click="handleJoin">
                <LogIn class="size-4" />
                {{ t('dialog.user.info.launch_invite_tooltip') }}
            </ContextMenuItem>
            <ContextMenuItem
                v-if="isOnline && hasLocation"
                :disabled="!canJoin"
                @click="handleSelfInvite">
                <Mail class="size-4" />
                {{ t('dialog.user.info.self_invite_tooltip') }}
            </ContextMenuItem>
            <slot name="append" />
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import { Clock, ExternalLink, LogIn, Mail, MessageSquare, MousePointer } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuShortcut,
        ContextMenuTrigger
    } from './ui/context-menu';
    import { isRealInstance, parseLocation } from '../shared/utils';
    import { useGameStore, useLaunchStore, useLocationStore, useUserStore } from '../stores';
    import { instanceRequest, notificationRequest, queryRequest } from '../api';
    import { useInviteChecks } from '../composables/useInviteChecks';
    import { isActionRecent, recordRecentAction } from '../composables/useRecentActions';

    import { showUserDialog } from '../coordinators/userCoordinator';

    const { t } = useI18n();
    const { showSendBoopDialog } = useUserStore();
    const launchStore = useLaunchStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { checkCanInvite, checkCanInviteSelf } = useInviteChecks();

    const props = defineProps({
        userId: {
            type: String,
            required: true
        },
        state: {
            type: String,
            default: ''
        },
        location: {
            type: String,
            default: ''
        }
    });

    const isOnline = computed(() => props.state === 'online');
    const hasLocation = computed(() => !!props.location && isRealInstance(props.location));
    const canInviteToMyLocation = computed(() => checkCanInvite(lastLocation.value.location));
    const canJoin = computed(() => {
        if (!props.location || !isRealInstance(props.location)) return false;
        return checkCanInviteSelf(props.location);
    });

    const showRecentRequestInvite = computed(() => isActionRecent(props.userId, 'Request Invite'));
    const showRecentInvite = computed(() => isActionRecent(props.userId, 'Invite'));

    function handleViewDetails() {
        showUserDialog(props.userId);
    }

    function handleRequestInvite() {
        notificationRequest.sendRequestInvite({ platform: 'standalonewindows' }, props.userId).then(() => {
            recordRecentAction(props.userId, 'Request Invite');
            toast.success(t('message.user.request_invite_sent'));
        });
    }

    function handleInvite() {
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
                    props.userId
                )
                .then(() => {
                    recordRecentAction(props.userId, 'Invite');
                    toast.success(t('message.invite.sent'));
                });
        });
    }

    function handleSendBoop() {
        showSendBoopDialog(props.userId);
    }

    function handleJoin() {
        if (!props.location) return;
        launchStore.showLaunchDialog(props.location);
    }

    function handleSelfInvite() {
        if (!props.location) return;
        const L = parseLocation(props.location);
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
