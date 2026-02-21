<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div ref="scrollViewportRef" class="flex-1 overflow-y-auto">
            <div v-if="allRows.length" class="relative w-full px-1.5 py-2" :style="virtualContainerStyle">
                <template v-for="item in virtualItems" :key="item.virtualItem.key">
                    <div
                        class="absolute left-0 top-0 w-full px-0.5 box-border"
                        :data-index="item.virtualItem.index"
                        :ref="virtualizer.measureElement"
                        :style="{ transform: `translateY(${item.virtualItem.start}px)` }">
                        <!-- Section header -->
                        <div v-if="item.row.type === 'section-header'" class="flex items-center gap-2 px-2.5 py-2">
                            <Separator class="flex-1" />
                            <span class="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wider">
                                {{ item.row.label }}
                            </span>
                            <Separator class="flex-1" />
                        </div>

                        <!-- Notification item -->
                        <NotificationItem
                            v-else-if="item.row.type === 'notification'"
                            :notification="item.row.notification"
                            :is-unseen="item.row.isUnseen"
                            @show-invite-response="$emit('show-invite-response', $event)"
                            @show-invite-request-response="$emit('show-invite-request-response', $event)" />
                    </div>
                </template>
            </div>

            <div v-if="!allRows.length" class="flex items-center justify-center p-8 text-sm text-muted-foreground">
                {{ t('side_panel.notification_center.no_new_notifications') }}
            </div>

            <div class="flex justify-center py-3">
                <Button
                    variant="ghost"
                    size="sm"
                    class="text-xs text-muted-foreground"
                    @click="$emit('navigate-to-table')">
                    {{ t('side_panel.notification_center.view_more') }}
                </Button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { useI18n } from 'vue-i18n';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    import dayjs from 'dayjs';

    import NotificationItem from './NotificationItem.vue';

    const props = defineProps({
        notifications: { type: Array, required: true },
        recentNotifications: { type: Array, default: () => [] }
    });

    defineEmits(['show-invite-response', 'show-invite-request-response', 'navigate-to-table']);

    const { t } = useI18n();
    const scrollViewportRef = ref(null);

    function getTs(n) {
        const raw = n?.created_at ?? n?.createdAt;
        const ts = dayjs(raw).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const sortedUnseenNotifications = computed(() => [...props.notifications].sort((a, b) => getTs(b) - getTs(a)));

    const sortedRecentNotifications = computed(() =>
        [...props.recentNotifications].sort((a, b) => getTs(b) - getTs(a))
    );

    const allRows = computed(() => {
        const rows = [];
        for (const n of sortedUnseenNotifications.value) {
            rows.push({
                type: 'notification',
                key: `unseen:${n.id}`,
                notification: n,
                isUnseen: true
            });
        }
        if (sortedRecentNotifications.value.length) {
            rows.push({
                type: 'section-header',
                key: 'header:recent',
                label: t('side_panel.notification_center.past_notifications')
            });
            for (const n of sortedRecentNotifications.value) {
                rows.push({
                    type: 'notification',
                    key: `recent:${n.id}`,
                    notification: n,
                    isUnseen: false
                });
            }
        }
        return rows;
    });

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: allRows.value.length,
            getScrollElement: () => scrollViewportRef.value,
            estimateSize: (index) => {
                const row = allRows.value[index];
                return row?.type === 'section-header' ? 32 : 56;
            },
            getItemKey: (index) => allRows.value[index]?.key ?? index,
            overscan: 8
        }))
    );

    const virtualItems = computed(() => {
        const items = virtualizer.value?.getVirtualItems?.() ?? [];
        return items.map((virtualItem) => ({
            virtualItem,
            row: allRows.value[virtualItem.index]
        }));
    });

    const virtualContainerStyle = computed(() => ({
        height: `${virtualizer.value?.getTotalSize?.() ?? 0}px`,
        width: '100%'
    }));

    watch(allRows, () => {
        nextTick(() => {
            virtualizer.value?.measure?.();
        });
    });
</script>
