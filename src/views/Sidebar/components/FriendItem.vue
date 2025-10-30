<template>
    <div class="x-friend-item" @click="$emit('click')">
        <template v-if="friend.ref">
            <div
                class="avatar"
                :class="isFriendActiveOrOffline ? undefined : userStatusClass(friend.ref, friend.pendingOffline)">
                <img :src="userImage(friend.ref, true)" loading="lazy" />
            </div>
            <div class="detail">
                <span v-if="!hideNicknames && friend.$nickName" class="name" :style="{ color: friend.ref.$userColour }">
                    {{ friend.ref.displayName }} ({{ friend.$nickName }})
                </span>
                <span v-else class="name" :style="{ color: friend.ref.$userColour }"
                    >{{ friend.ref.displayName }}{{ isGroupByInstance && friend.isVIP ? ' ⭐' : '' }}</span
                >

                <span v-if="isFriendActiveOrOffline" class="extra">{{ friend.ref.statusDescription }}</span>
                <template v-else>
                    <span v-if="friend.pendingOffline" class="extra">
                        <el-icon><WarningFilled /></el-icon> {{ t('side_panel.pending_offline') }}
                    </span>
                    <template v-else-if="isGroupByInstance">
                        <el-icon v-if="isFriendTraveling" class="is-loading" style="margin-right: 3px"
                            ><Loading
                        /></el-icon>
                        <Timer
                            class="extra"
                            :epoch="epoch"
                            :style="isFriendTraveling ? { display: 'inline-block', overflow: 'unset' } : undefined" />
                    </template>
                    <Location v-else class="extra" :location="locationProp" :traveling="travelingProp" :link="false" />
                </template>
            </div>
        </template>
        <template v-else-if="!friend.ref && !isRefreshFriendsLoading">
            <span>{{ friend.name || friend.id }}</span>
            <el-button
                type="text"
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

    import { useAppearanceSettingsStore, useFriendStore } from '../../../stores';
    import { userImage, userStatusClass } from '../../../shared/utils';

    const props = defineProps({
        friend: { type: Object, required: true },
        isGroupByInstance: Boolean
    });

    defineEmits(['click', 'confirm-delete-friend']);

    const { hideNicknames } = storeToRefs(useAppearanceSettingsStore());
    const { isRefreshFriendsLoading } = storeToRefs(useFriendStore());
    const { t } = useI18n();

    const isFriendTraveling = computed(() => props.friend.ref?.location === 'traveling');
    const isFriendActiveOrOffline = computed(() => props.friend.state === 'active' || props.friend.state === 'offline');
    const epoch = computed(() =>
        isFriendTraveling.value ? props.friend.ref?.$travelingToTime : props.friend.ref?.$location_at
    );

    const locationProp = computed(() => props.friend.ref?.location || '');
    const travelingProp = computed(() => props.friend.ref?.travelingToLocation || '');
</script>

<style scoped>
    .skeleton {
        height: 40px;
        width: 100%;
        :deep(.el-skeleton) {
            height: 100%;
            > div {
                height: 100%;
                display: flex;
                align-items: center;
                > :first-child {
                    margin-right: 8px;
                    height: 40px;
                    width: 40px;
                }
                > :last-child {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    > :first-child {
                        width: 50%;
                        margin-bottom: 4px;
                    }
                    > :last-child {
                        width: 90%;
                    }
                }
            }
        }
    }
</style>
