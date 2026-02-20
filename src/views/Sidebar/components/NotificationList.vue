<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto">
            <div v-if="activeNotifications.length" class="flex flex-col gap-0.5 p-2">
                <NotificationItem
                    v-for="n in activeNotifications"
                    :key="n.id || n.type + n.created_at"
                    :notification="n"
                    :is-unseen="unseenIds.includes(n.id)"
                    @show-invite-response="$emit('show-invite-response', $event)"
                    @show-invite-request-response="$emit('show-invite-request-response', $event)" />
            </div>
            <div v-else class="flex items-center justify-center p-8 text-sm text-muted-foreground">
                {{ t('side_panel.notification_center.no_new_notifications') }}
            </div>

            <template v-if="expiredNotifications.length">
                <div class="flex items-center gap-2 px-4 py-2">
                    <Separator class="flex-1" />
                    <span class="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {{ t('side_panel.notification_center.past_notifications') }}
                    </span>
                    <Separator class="flex-1" />
                </div>
                <div class="flex flex-col gap-0.5 px-2 pb-2">
                    <NotificationItem
                        v-for="n in expiredNotifications"
                        :key="n.id || n.type + n.created_at"
                        :notification="n"
                        :is-unseen="false" />
                </div>
            </template>
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
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import NotificationItem from './NotificationItem.vue';

    const props = defineProps({
        notifications: { type: Array, required: true },
        unseenIds: { type: Array, default: () => [] }
    });

    defineEmits(['show-invite-response', 'show-invite-request-response', 'navigate-to-table']);

    const { t } = useI18n();

    function getTs(n) {
        const raw = n?.created_at ?? n?.createdAt;
        if (typeof raw === 'number') {
            return raw > 1_000_000_000_000 ? raw : raw * 1000;
        }
        const ts = dayjs(raw).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const sortedNotifications = computed(() => [...props.notifications].sort((a, b) => getTs(b) - getTs(a)));

    const activeNotifications = computed(() =>
        sortedNotifications.value.filter((n) => getTs(n) > dayjs().subtract(1, 'week').valueOf())
    );

    const MAX_EXPIRED = 20;

    const expiredNotifications = computed(() =>
        sortedNotifications.value.filter((n) => getTs(n) <= dayjs().subtract(1, 'week').valueOf()).slice(0, MAX_EXPIRED)
    );
</script>
