<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader
            :title="t('dashboard.widget.feed')"
            icon="ri-rss-line"
            route-name="feed" />

        <div class="min-h-0 flex-1 overflow-y-auto" ref="listRef">
            <template v-if="filteredData.length">
                <div
                    v-for="(item, index) in filteredData"
                    :key="`${item.type}-${item.created_at}-${index}`"
                    class="flex items-center gap-1.5 border-b border-border/30 px-2.5 py-0.75 text-[13px] leading-snug hover:bg-accent/50"
                    :class="{ 'border-l-2 border-l-chart-4': item.isFavorite }">
                    <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatTime(item.created_at) }}</span>

                    <template v-if="item.type === 'GPS'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">→ {{ item.worldName || t('dashboard.widget.unknown_world') }}</span>
                    </template>
                    <template v-else-if="item.type === 'Online'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-chart-2">{{ t('dashboard.widget.feed_online') }}</span>
                        <span v-if="item.worldName" class="truncate text-muted-foreground">→ {{ item.worldName }}</span>
                    </template>
                    <template v-else-if="item.type === 'Offline'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground/60">{{ t('dashboard.widget.feed_offline') }}</span>
                    </template>
                    <template v-else-if="item.type === 'Status'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <i class="x-user-status" :class="statusClass(item.status)"></i>
                        <span class="truncate text-muted-foreground">{{ item.statusDescription }}</span>
                    </template>
                    <template v-else-if="item.type === 'Avatar'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">{{ t('dashboard.widget.feed_avatar') }} {{ item.avatarName }}</span>
                    </template>
                    <template v-else-if="item.type === 'Bio'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">{{ t('dashboard.widget.feed_bio') }}</span>
                    </template>
                    <template v-else>
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">{{ item.type }}</span>
                    </template>
                </div>
            </template>
            <div v-else class="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                {{ t('dashboard.widget.no_data') }}
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { statusClass } from '@/shared/utils/user';
    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { useFeedStore } from '@/stores';

    import WidgetHeader from './WidgetHeader.vue';

    const FEED_TYPES = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        }
    });

    const { t } = useI18n();
    const feedStore = useFeedStore();
    const listRef = ref(null);

    const activeFilters = computed(() => {
        if (props.config.filters && Array.isArray(props.config.filters) && props.config.filters.length > 0) {
            return props.config.filters;
        }
        return FEED_TYPES;
    });

    const filteredData = computed(() => {
        const filters = activeFilters.value;
        return feedStore.feedTableData.filter((item) => filters.includes(item.type));
    });

    function formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function openUser(userId) {
        if (userId) {
            showUserDialog(userId);
        }
    }

    defineExpose({ FEED_TYPES });
</script>
