<template>
    <div class="flex h-full flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto">
            <div v-if="sortedUnseenNotifications.length" class="flex flex-col gap-0.5 p-2">
                <NotificationItem
                    v-for="n in sortedUnseenNotifications"
                    :key="n.id + n.created_at"
                    :notification="n"
                    :is-unseen="true"
                    @show-invite-response="$emit('show-invite-response', $event)"
                    @show-invite-request-response="$emit('show-invite-request-response', $event)" />
            </div>

            <div v-if="sortedRecentNotifications.length">
                <div class="flex items-center gap-2 px-4 py-2">
                    <Separator class="flex-1" />
                    <span class="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {{ t('side_panel.notification_center.past_notifications') }}
                    </span>
                    <Separator class="flex-1" />
                </div>
                <div class="flex flex-col gap-0.5 px-2 pb-2">
                    <NotificationItem
                        v-for="n in sortedRecentNotifications"
                        :key="n.id + n.created_at"
                        :notification="n"
                        :is-unseen="false" />
                </div>
            </div>

            <div
                v-if="!sortedUnseenNotifications.length && !sortedRecentNotifications.length"
                class="flex items-center justify-center p-8 text-sm text-muted-foreground">
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
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import dayjs from 'dayjs';

    import NotificationItem from './NotificationItem.vue';

    const props = defineProps({
        notifications: { type: Array, required: true },
        recentNotifications: { type: Array, default: () => [] }
    });

    defineEmits(['show-invite-response', 'show-invite-request-response', 'navigate-to-table']);

    const { t } = useI18n();

    function getTs(n) {
        const raw = n?.created_at ?? n?.createdAt;
        const ts = dayjs(raw).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const sortedUnseenNotifications = computed(() => [...props.notifications].sort((a, b) => getTs(b) - getTs(a)));

    const sortedRecentNotifications = computed(() =>
        [...props.recentNotifications].sort((a, b) => getTs(b) - getTs(a))
    );
</script>
