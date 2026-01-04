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

                <span v-if="isFriendActiveOrOffline" class="extra">{{ friend.ref.statusDescription }}</span>
                <template v-else>
                    <div v-if="friend.pendingOffline" class="extra">
                        <el-icon><WarningFilled /></el-icon> {{ t('side_panel.pending_offline') }}
                    </div>
                    <template v-else-if="isGroupByInstance">
                        <div class="flex items-center">
                            <el-icon v-if="isFriendTraveling" class="is-loading" style="margin-right: 3px"
                                ><Loading
                            /></el-icon>
                            <Timer
                                class="extra"
                                :epoch="epoch"
                                :style="
                                    isFriendTraveling ? { display: 'inline-block', overflow: 'unset' } : undefined
                                " />
                        </div>
                    </template>
                    <Location v-else class="extra" :location="locationProp" :traveling="travelingProp" :link="false" />
                </template>
            </div>
        </template>
        <template v-else-if="!friend.ref && !isRefreshFriendsLoading">
            <span>{{ friend.name || friend.id }}</span>
            <el-button
                text
                :icon="Close"
                size="small"
                style="margin-left: 5px"
                @click.stop="$emit('confirm-delete-friend', friend.id)">
            </el-button>
        </template>

        <el-skeleton v-else animated class="skeleton" :throttle="100">
            <template #template>
                <div>
                    <el-skeleton-item variant="circle" />
                    <div>
                        <el-skeleton-item variant="text" />
                        <el-skeleton-item variant="text" />
                    </div>
                </div>
            </template>
        </el-skeleton>
    </div>
</template>

<script setup>
    import { Close, Loading, WarningFilled } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFriendStore, useUserStore } from '../../../stores';
    import { userImage, userStatusClass } from '../../../shared/utils';

    const props = defineProps({
        friend: { type: Object, required: true },
        isGroupByInstance: Boolean
    });

    defineEmits(['confirm-delete-friend']);

    const { hideNicknames } = storeToRefs(useAppearanceSettingsStore());
    const { isRefreshFriendsLoading } = storeToRefs(useFriendStore());
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

<style>
    .skeleton {
        height: 40px;
        width: 100%;
        & > div {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            & > div {
                width: calc(100% - 48px);
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
        }
        .el-skeleton__circle {
            height: 40px;
            width: 40px;
        }
        .el-skeleton__text {
            &:first-child {
                height: 14px;
                margin-bottom: 6px;
                width: 50%;
            }
            &:last-child {
                height: 12px;
            }
        }
    }
</style>
