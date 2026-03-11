<template>
    <template v-if="favorite.ref">
        <ContextMenu>
            <ContextMenuTrigger as-child>
                <Item
                    variant="outline"
                    class="favorites-item cursor-pointer hover:bg-muted x-hover-list"
                    :style="itemStyle"
                    @click="handleOpenProfile">
                    <ItemMedia variant="image">
                        <Avatar>
                            <AvatarImage :src="userImage(favorite.ref, true)" loading="lazy" />
                            <AvatarFallback>{{ avatarFallback }}</AvatarFallback>
                        </Avatar>
                    </ItemMedia>
                    <ItemContent class="min-w-0">
                        <ItemTitle class="truncate max-w-full" :style="displayNameStyle">{{ displayName }}</ItemTitle>
                        <ItemDescription class="truncate line-clamp-1 text-xs!">
                            <template v-if="favorite.ref.location !== 'offline'">
                                <Location
                                    :location="favorite.ref.location"
                                    :traveling="favorite.ref.travelingToLocation"
                                    :link="false" />
                            </template>
                            <template v-else>
                                {{ favorite.ref.statusDescription }}
                            </template>
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions v-if="editMode" @click.stop>
                        <Checkbox v-model="isSelected" />
                    </ItemActions>
                    <DropdownMenu v-else>
                        <DropdownMenuTrigger as-child>
                            <Button size="icon-sm" variant="ghost" class="rounded-full" @click.stop>
                                <MoreHorizontal class="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem @click="handleOpenProfile">
                                {{ t('common.actions.view_details') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem v-if="favorite.ref.state === 'online'" @click="friendRequestInvite">
                                {{ t('dialog.user.actions.request_invite') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                v-if="isGameRunning"
                                :disabled="!canInviteToMyLocation"
                                @click="friendInvite">
                                {{ t('dialog.user.actions.invite') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem :disabled="!currentUser?.isBoopingEnabled" @click="friendSendBoop">
                                {{ t('dialog.user.actions.send_boop') }}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator v-if="favorite.ref.state === 'online' && hasFriendLocation" />
                            <DropdownMenuItem
                                v-if="favorite.ref.state === 'online' && hasFriendLocation"
                                :disabled="!canJoinFriend"
                                @click="friendJoin">
                                {{ t('dialog.user.info.launch_invite_tooltip') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                v-if="favorite.ref.state === 'online' && hasFriendLocation"
                                :disabled="!canJoinFriend"
                                @click="friendInviteSelf">
                                {{ t('dialog.user.info.self_invite_tooltip') }}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem @click="showFavoriteDialog('friend', favorite.id)">
                                {{ t('view.favorite.edit_favorite_tooltip') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" @click="handleDeleteFavorite">
                                {{ deleteMenuLabel }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Item>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem @click="handleOpenProfile">{{ t('common.actions.view_details') }}</ContextMenuItem>
                <ContextMenuItem v-if="favorite.ref.state === 'online'" @click="friendRequestInvite">
                    {{ t('dialog.user.actions.request_invite') }}
                </ContextMenuItem>
                <ContextMenuItem v-if="isGameRunning" :disabled="!canInviteToMyLocation" @click="friendInvite">
                    {{ t('dialog.user.actions.invite') }}
                </ContextMenuItem>
                <ContextMenuItem :disabled="!currentUser?.isBoopingEnabled" @click="friendSendBoop">
                    {{ t('dialog.user.actions.send_boop') }}
                </ContextMenuItem>
                <ContextMenuSeparator v-if="favorite.ref.state === 'online' && hasFriendLocation" />
                <ContextMenuItem
                    v-if="favorite.ref.state === 'online' && hasFriendLocation"
                    :disabled="!canJoinFriend"
                    @click="friendJoin">
                    {{ t('dialog.user.info.launch_invite_tooltip') }}
                </ContextMenuItem>
                <ContextMenuItem
                    v-if="favorite.ref.state === 'online' && hasFriendLocation"
                    :disabled="!canJoinFriend"
                    @click="friendInviteSelf">
                    {{ t('dialog.user.info.self_invite_tooltip') }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem @click="showFavoriteDialog('friend', favorite.id)">
                    {{ t('view.favorite.edit_favorite_tooltip') }}
                </ContextMenuItem>
                <ContextMenuItem variant="destructive" @click="handleDeleteFavorite">
                    {{ deleteMenuLabel }}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    </template>
    <template v-else>
        <Item variant="outline" class="favorites-item hover:bg-muted x-hover-list" :style="itemStyle">
            <ItemMedia variant="image">
                <Avatar>
                    <AvatarFallback>{{ avatarFallback }}</AvatarFallback>
                </Avatar>
            </ItemMedia>
            <ItemContent class="min-w-0">
                <ItemTitle class="truncate max-w-full">{{ favorite.name || favorite.id }}</ItemTitle>
                <ItemDescription class="truncate line-clamp-1">{{ favorite.id }}</ItemDescription>
            </ItemContent>
            <ItemActions>
                <Button
                    class="rounded-full h-6 w-6"
                    size="icon-sm"
                    variant="outline"
                    @click.stop="handleDeleteFavorite">
                    <Trash2 class="h-4 w-4" />
                </Button>
            </ItemActions>
        </Item>
    </template>
</template>

<script setup>
    import { MoreHorizontal, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { favoriteRequest, instanceRequest, notificationRequest, queryRequest } from '../../../api';
    import { useInviteChecks } from '../../../composables/useInviteChecks';
    import { removeLocalFriendFavorite } from '../../../coordinators/favoriteCoordinator';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { parseLocation, isRealInstance } from '../../../shared/utils';
    import { useFavoriteStore, useGameStore, useLocationStore, useLaunchStore, useUserStore } from '../../../stores';
    import { useUserDisplay } from '../../../composables/useUserDisplay';

    import Location from '../../../components/Location.vue';

    const { userImage } = useUserDisplay();
    const props = defineProps({
        favorite: { type: Object, required: true },
        group: { type: Object, default: null },
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });

    const emit = defineEmits(['toggle-select']);

    const { showFavoriteDialog } = useFavoriteStore();
    const launchStore = useLaunchStore();
    const { t } = useI18n();
    const { showSendBoopDialog } = useUserStore();
    const { checkCanInvite, checkCanInviteSelf } = useInviteChecks();
    const { currentUser } = storeToRefs(useUserStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

    const displayName = computed(() => props.favorite?.ref?.displayName || props.favorite?.name || props.favorite?.id);

    const avatarFallback = computed(() => displayName.value?.charAt(0)?.toUpperCase() || '?');

    const displayNameStyle = computed(() => {
        if (props.favorite?.ref?.$userColour) {
            return {
                color: props.favorite.ref.$userColour
            };
        }
        return {};
    });

    const itemStyle = computed(() => ({
        padding: 'var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px)',
        gap: 'var(--favorites-card-content-gap, 10px)',
        minWidth: 'var(--favorites-card-min-width, 220px)',
        maxWidth: 'var(--favorites-card-target-width, 220px)',
        width: '100%',
        fontSize: 'calc(0.875rem * var(--favorites-card-scale, 1))'
    }));

    const deleteMenuLabel = computed(() =>
        props.group?.type === 'local' ? t('view.favorite.delete_tooltip') : t('view.favorite.unfavorite_tooltip')
    );

    const canInviteToMyLocation = computed(() => checkCanInvite(lastLocation.value.location));

    const hasFriendLocation = computed(() => {
        const loc = props.favorite?.ref?.location;
        return !!loc && isRealInstance(loc);
    });

    const canJoinFriend = computed(() => {
        const loc = props.favorite?.ref?.location;
        if (!loc || !isRealInstance(loc)) {
            return false;
        }
        return checkCanInviteSelf(loc);
    });

    function handleOpenProfile() {
        showUserDialog(props.favorite.id);
    }

    function friendRequestInvite() {
        notificationRequest.sendRequestInvite({ platform: 'standalonewindows' }, props.favorite.id).then(() => {
            toast.success('Request invite sent');
        });
    }

    function friendInvite() {
        let currentLocation = lastLocation.value.location;
        if (currentLocation === 'traveling') {
            currentLocation = lastLocationDestination.value;
        }
        const location = parseLocation(currentLocation);
        queryRequest.fetch('world.location', { worldId: location.worldId }).then((args) => {
            notificationRequest
                .sendInvite(
                    {
                        instanceId: location.tag,
                        worldId: location.tag,
                        worldName: args.ref.name
                    },
                    props.favorite.id
                )
                .then(() => {
                    toast.success(t('message.invite.sent'));
                });
        });
    }

    function friendSendBoop() {
        showSendBoopDialog(props.favorite.id);
    }

    function friendJoin() {
        const loc = props.favorite?.ref?.location;
        if (!loc) {
            return;
        }
        launchStore.showLaunchDialog(loc);
    }

    function friendInviteSelf() {
        const loc = props.favorite?.ref?.location;
        if (!loc) {
            return;
        }
        const location = parseLocation(loc);
        instanceRequest
            .selfInvite({
                instanceId: location.instanceId,
                worldId: location.worldId
            })
            .then(() => {
                toast.success(t('message.invite.self_sent'));
            });
    }

    /**
     * @returns {void}
     */
    function handleDeleteFavorite() {
        if (props.group?.type === 'local') {
            removeLocalFriendFavorite(props.favorite.id, props.group.key);
        } else {
            favoriteRequest.deleteFavorite({
                objectId: props.favorite.id
            });
        }
    }
</script>

<style scoped>
    .favorites-item :deep(img) {
        filter: saturate(0.8) contrast(0.8);
        transition: filter 0.2s ease;
    }

    .favorites-item:hover :deep(img) {
        filter: saturate(1) contrast(1);
    }
</style>
