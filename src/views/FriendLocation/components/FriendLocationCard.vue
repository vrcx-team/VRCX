<template>
    <el-card
        class="friend-card"
        shadow="never"
        :body-style="{ padding: `${16 * cardScale}px` }"
        :style="cardStyle"
        @click="showUserDialog(friend.id)">
        <div class="friend-card__header">
            <div class="friend-card__avatar-wrapper">
                <el-avatar :size="avatarSize" :src="userImage(props.friend.ref, true)" class="friend-card__avatar">
                    {{ avatarFallback }}
                </el-avatar>
            </div>
            <span class="friend-card__status-dot" :class="statusDotClass"></span>
            <div class="friend-card__name" :title="friend.name">{{ friend.name }}</div>
        </div>
        <div class="friend-card__body">
            <div class="friend-card__signature" :title="friend.ref?.statusDescription">
                <i v-if="friend.ref?.statusDescription" class="ri-pencil-line" style="opacity: 0.7"></i>
                {{ friend.ref?.statusDescription || '&nbsp;' }}
            </div>
            <div class="friend-card__world" :title="friend.worldName">
                <Location
                    class="friend-card__location"
                    :location="friend.ref?.location"
                    :traveling="friend.ref?.travelingToLocation"
                    :link="false" />
            </div>
        </div>
    </el-card>
</template>

<script setup>
    import { computed } from 'vue';

    import { userImage, userStatusClass } from '../../../shared/utils';
    import { useUserStore } from '../../../stores';

    const { showUserDialog } = useUserStore();

    const props = defineProps({
        friend: {
            type: Object,
            required: true
        },
        cardScale: {
            type: Number,
            default: 1
        }
    });

    const avatarSize = computed(() => 48 * props.cardScale);

    const cardStyle = computed(() => ({
        '--card-scale': props.cardScale,
        cursor: 'pointer'
    }));

    const avatarFallback = computed(() => props.friend.name.charAt(0) ?? '?');

    const statusDotClass = computed(() => {
        const status = userStatusClass(props.friend.ref, props.friend.pendingOffline);

        if (status.joinme) {
            return 'friend-card__status-dot--join';
        }
        if (status.online || status.active) {
            return 'friend-card__status-dot--online';
        }
        if (status.askme) {
            return 'friend-card__status-dot--ask';
        }
        if (status.busy) {
            return 'friend-card__status-dot--busy';
        }

        return 'friend-card__status-dot--hidden';
    });
</script>

<style scoped lang="scss">
    .friend-card {
        --card-scale: 1;
        position: relative;
        display: grid;
        gap: calc(14px * var(--card-scale));
        border-radius: calc(8px * var(--card-scale));
        background: #fff;
        border: 1px solid rgba(148, 163, 184, 0.32);
        box-shadow: 0 calc(6px * var(--card-scale)) calc(16px * var(--card-scale)) rgba(15, 23, 42, 0.04);
        transition:
            box-shadow 0.2s ease,
            transform 0.2s ease;
        width: 100%;
        max-width: var(--friend-card-target-width, 220px);
        min-width: var(--friend-card-min-width, 220px);

        &:hover {
            box-shadow: 0 calc(10px * var(--card-scale)) calc(24px * var(--card-scale)) rgba(15, 23, 42, 0.07);
            transform: translateY(calc(-2px * var(--card-scale)));
        }
    }

    .friend-card__header {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: flex-start;
        gap: calc(12px * var(--card-scale));
    }

    .friend-card__avatar-wrapper {
        position: static;
        flex: none;
    }

    .friend-card__avatar {
        border: 1px solid rgba(255, 255, 255, 0.85);
        box-shadow: 0 calc(5px * var(--card-scale)) calc(10px * var(--card-scale)) rgba(15, 23, 42, 0.14);
    }

    .friend-card__status-dot {
        position: absolute;
        top: calc(8px * var(--card-scale));
        right: calc(8px * var(--card-scale));
        width: calc(8px * var(--card-scale));
        height: calc(8px * var(--card-scale));
        border-radius: 999px;
        border: calc(2px * var(--card-scale)) solid #fff;
        box-shadow: 0 0 calc(4px * var(--card-scale)) rgba(15, 23, 42, 0.12);
        pointer-events: none;
    }

    .friend-card__status-dot--hidden {
        display: none;
    }

    .friend-card__status-dot--online {
        background: linear-gradient(145deg, #67c23a, #4aa12d);
        box-shadow: 0 0 calc(8px * var(--card-scale)) rgba(103, 194, 58, 0.4);
    }

    .friend-card__status-dot--join {
        background: linear-gradient(145deg, #409eff, #2f7ed9);
        box-shadow: 0 0 calc(8px * var(--card-scale)) rgba(64, 158, 255, 0.4);
    }

    .friend-card__status-dot--busy {
        background: linear-gradient(145deg, #ff2c2c, #d81f1f);
        box-shadow: 0 0 calc(8px * var(--card-scale)) rgba(255, 44, 44, 0.4);
    }

    .friend-card__status-dot--ask {
        background: linear-gradient(145deg, #ff9500, #d97800);
        box-shadow: 0 0 calc(8px * var(--card-scale)) rgba(255, 149, 0, 0.4);
    }

    .friend-card__body {
        display: grid;
        gap: calc(12px * var(--card-scale));
    }

    .friend-card__name {
        font-size: calc(17px * var(--card-scale));
        font-weight: 600;
        color: #1f2937;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-card__signature {
        margin-top: 6px;
        font-size: calc(13px * var(--card-scale));
        color: rgba(31, 41, 55, 0.7);
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-card__world {
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(40px * var(--card-scale));
        padding: calc(6px * var(--card-scale)) calc(10px * var(--card-scale));
        border-radius: calc(12px * var(--card-scale));
        background: rgba(148, 163, 184, 0.18);
        color: rgba(71, 85, 105, 0.95);
        font-size: calc(12px * var(--card-scale));
        line-height: 1.3;
        box-sizing: border-box;
    }

    .friend-card__location {
        display: flex;
        width: 100%;
        max-height: calc(36px * var(--card-scale));
        overflow: hidden;
        line-height: 1.3;
        white-space: normal;
        word-break: break-word;
        text-align: center;
    }

    .friend-card__location :deep(.x-location__text) {
        display: -webkit-box;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
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
