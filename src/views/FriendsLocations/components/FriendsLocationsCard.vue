<template>
    <Card class="friend-card p-0 gap-0" :style="cardStyle" @click="showUserDialog(friend.id)">
        <div class="friend-card__header">
            <div class="friend-card__avatar-wrapper">
                <el-avatar :size="avatarSize" :src="userImage(props.friend.ref, true)" class="friend-card__avatar">
                    {{ avatarFallback }}
                </el-avatar>
            </div>
            <span class="friend-card__status-dot" :class="statusDotClass"></span>
            <div class="friend-card__name ml-0.5" :title="friend.name">{{ friend.name }}</div>
        </div>
        <div class="friend-card__body">
            <div class="friend-card__signature" :title="friend.ref?.statusDescription">
                <Pencil v-if="friend.ref?.statusDescription" class="h-3.5 w-3.5 mr-1" style="opacity: 0.7" />
                {{ friend.ref?.statusDescription || '&nbsp;' }}
            </div>
            <div v-if="displayInstanceInfo" @click.stop class="friend-card__world" :title="friend.worldName">
                <Location
                    class="friend-card__location"
                    :location="friend.ref?.location"
                    :traveling="friend.ref?.travelingToLocation"
                    link />
            </div>
        </div>
    </Card>
</template>

<script setup>
    import { Card } from '@/components/ui/card';
    import { Pencil } from 'lucide-vue-next';
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

    const avatarSize = computed(() => 48 * props.cardScale);

    const cardStyle = computed(() => ({
        '--card-scale': props.cardScale,
        '--card-spacing': props.cardSpacing,
        cursor: 'pointer',
        padding: `${16 * props.cardScale * props.cardSpacing}px`
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

<style scoped>
    .friend-card {
        --card-scale: 1;
        --card-spacing: 1;
        position: relative;
        display: grid;
        gap: calc(14px * var(--card-scale) * var(--card-spacing));
        border-radius: 8px;
        background: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color);
        box-shadow: var(--el-box-shadow-lighter);
        transition:
            box-shadow 0.2s ease,
            transform 0.2s ease;
        max-width: var(--friend-card-target-width, 220px);
        min-width: var(--friend-card-min-width, 220px);

        &:hover {
            box-shadow: var(--el-box-shadow-light);
            transform: translateY(calc(-2px * var(--card-scale)));
        }
    }

    .friend-card__header {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: flex-start;
        gap: calc(12px * var(--card-scale) * var(--card-spacing));
    }

    .friend-card__avatar-wrapper {
        position: static;
        flex: none;
    }

    .friend-card__avatar {
        border: 1px solid var(--el-border-color);
        box-shadow: var(--el-box-shadow-lighter);
    }

    .friend-card__status-dot {
        position: absolute;
        top: calc(8px * var(--card-scale));
        right: calc(8px * var(--card-scale));
        inline-size: calc(12px * var(--card-scale));
        block-size: calc(12px * var(--card-scale));
        border-radius: 999px;
        border: calc(2px * var(--card-scale)) solid var(--el-bg-color-overlay);
        box-shadow: var(--el-box-shadow-lighter);
        pointer-events: none;
    }

    .friend-card__status-dot--hidden {
        display: none;
    }

    .friend-card__status-dot--online {
        background: #67c23a;
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, #67c23a 40%, transparent);
    }

    .friend-card__status-dot--join {
        background: #409eff;
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, #409eff 40%, transparent);
    }

    .friend-card__status-dot--busy {
        background: #ff2c2c;
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, #ff2c2c 40%, transparent);
    }

    .friend-card__status-dot--ask {
        background: #ff9500;
        box-shadow: 0 0 calc(8px * var(--card-scale)) color-mix(in oklch, #ff9500 40%, transparent);
    }

    .friend-card__body {
        display: grid;
        gap: calc(12px * var(--card-scale) * var(--card-spacing));
    }

    .friend-card__name {
        font-size: calc(17px * var(--card-scale));
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .friend-card__signature {
        margin-top: calc(6px * var(--card-spacing));
        font-size: calc(13px * var(--card-scale));
        color: var(--el-text-color-secondary);
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: flex;
        align-items: center;
    }

    .friend-card__world {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(40px * var(--card-scale));
        padding: calc(6px * var(--card-scale)) calc(10px * var(--card-scale));
        border-radius: calc(10px * var(--card-scale));
        color: var(--el-text-color-regular);
        font-size: calc(12px * var(--card-scale));
        line-height: 1.3;
        box-sizing: border-box;
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
    }

    :global(html.dark) .friend-card__world,
    :global(:root.dark) .friend-card__world,
    :global(:root[data-theme='dark']) .friend-card__world {
        color: var(--color-zinc-300);
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
