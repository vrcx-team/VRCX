<template>
    <div class="x-friend-item hover:bg-muted/50" @click="showUserDialog(friend.id)">
        <template v-if="friend.ref">
            <div
                class="avatar"
                :class="isFriendActiveOrOffline ? undefined : userStatusClass(friend.ref, friend.pendingOffline)">
                <Avatar class="size-full rounded-full">
                    <AvatarImage :src="userImage(friend.ref, true)" class="object-cover" />
                    <AvatarFallback>
                        <User class="size-5 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div class="detail h-9 flex flex-col justify-between">
                <span v-if="!hideNicknames && friend.$nickName" class="name" :style="{ color: friend.ref.$userColour }">
                    {{ friend.ref.displayName }} ({{ friend.$nickName }})
                </span>
                <span v-else class="name" :style="{ color: friend.ref.$userColour }"
                    >{{ friend.ref.displayName
                    }}{{ isGroupByInstance && allFavoriteFriendIds.has(friend.id) ? ' ⭐' : '' }}</span
                >

                <span v-if="isFriendActiveOrOffline" class="block truncate text-xs">{{
                    friend.ref.statusDescription
                }}</span>
                <template v-else>
                    <div v-if="friend.pendingOffline" class="extra block truncate text-xs">
                        {{ t('side_panel.pending_offline') }}
                    </div>
                    <template v-else-if="isGroupByInstance">
                        <div class="flex items-center">
                            <Spinner v-if="isFriendTraveling" class="mr-1" />
                            <Timer
                                class="text-xs"
                                :epoch="epoch"
                                :style="
                                    isFriendTraveling ? { display: 'inline-block', overflow: 'unset' } : undefined
                                " />
                        </div>
                    </template>
                    <Location
                        v-else
                        class="extra block truncate text-xs"
                        :location="locationProp"
                        :traveling="travelingProp"
                        :link="false" />
                </template>
            </div>
        </template>
        <template v-else-if="!friend.ref && !isRefreshFriendsLoading">
            <span>{{ friend.name || friend.id }}</span>
            <Button size="sm" variant="ghost" class="mr-1 w-6 h-6 text-xs" @click.stop="confirmDeleteFriend(friend.id)"
                ><Trash2 class="h-4 w-4" />
            </Button>
        </template>
    </div>
</template>

<script setup>
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Trash2, User } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import Location from '@/components/Location.vue';
    import Timer from '@/components/Timer.vue';

    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { userImage, userStatusClass } from '../../../shared/utils';

    const props = defineProps({
        friend: { type: Object, required: true },
        isGroupByInstance: Boolean
    });

    const { hideNicknames } = storeToRefs(useAppearanceSettingsStore());
    const { isRefreshFriendsLoading, allFavoriteFriendIds } = storeToRefs(useFriendStore());
    const { confirmDeleteFriend } = useFriendStore();
    const { showUserDialog } = useUserStore();
    const { t } = useI18n();

    const isFriendTraveling = computed(() => props.friend.ref?.location === 'traveling');
    const isFriendActiveOrOffline = computed(() => props.friend.state === 'active' || props.friend.state === 'offline');
    const epoch = computed(() =>
        isFriendTraveling.value ? props.friend.ref?.$travelingToTime : props.friend.ref?.$location_at
    );

    const locationProp = computed(() => props.friend.ref?.location || '');
    const travelingProp = computed(() => props.friend.ref?.travelingToLocation || '');
</script>
