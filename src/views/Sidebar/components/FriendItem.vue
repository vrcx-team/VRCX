<template>
    <div class="x-friend-item" @click="showUserDialog(friend.id)">
        <template v-if="friend.ref">
            <div
                class="avatar"
                :class="isFriendActiveOrOffline ? undefined : userStatusClass(friend.ref, friend.pendingOffline)">
                <img :src="userImage(friend.ref, true)" loading="lazy" />
            </div>
            <div class="detail h-9 flex flex-col justify-between">
                <span v-if="!hideNicknames && friend.$nickName" class="name" :style="{ color: friend.ref.$userColour }">
                    {{ friend.ref.displayName }} ({{ friend.$nickName }})
                </span>
                <span v-else class="name" :style="{ color: friend.ref.$userColour }"
                    >{{ friend.ref.displayName }}{{ isGroupByInstance && friend.isVIP ? ' ⭐' : '' }}</span
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

        <!-- <div v-else class="skeleton" aria-busy="true" aria-label="Loading">
            <div>
                <Skeleton class="h-10 w-10 rounded-full" />
                <div>
                    <Skeleton class="h-3.5 w-1/2" />
                    <Skeleton class="mt-1.5 h-3 w-full" />
                </div>
            </div>
        </div> -->
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { Trash2 } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { userImage, userStatusClass } from '../../../shared/utils';

    const props = defineProps({
        friend: { type: Object, required: true },
        isGroupByInstance: Boolean
    });

    const { hideNicknames } = storeToRefs(useAppearanceSettingsStore());
    const { isRefreshFriendsLoading } = storeToRefs(useFriendStore());
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
