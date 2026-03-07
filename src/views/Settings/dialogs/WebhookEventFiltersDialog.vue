<template>
    <Dialog
        :open="isWebhookEventFiltersDialogVisible"
        @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-150">
            <DialogHeader>
                <DialogTitle>{{ t('view.settings.notifications.notifications.webhook.events.header') }}</DialogTitle>
            </DialogHeader>
            <div class="text-[15px] h-[75vh] overflow-y-auto">
                <div
                    v-for="group in webhookEventGroups"
                    :key="group.category"
                    class="mb-2">
                    <div class="mb-1 font-medium text-sm">
                        {{ t(group.titleKey) }}
                    </div>
                    <div
                        v-for="eventDef in group.items"
                        :key="eventDef.key"
                        class="mb-[6px]">
                        <SimpleSwitch
                            :label="t(eventDef.labelKey)"
                            :value="Boolean(webhookEventEnabledMap[eventDef.key])"
                            @change="setWebhookEventEnabled(eventDef.key, Boolean($event))" />
                        <div class="ml-[235px] text-[11px] text-muted-foreground">
                            {{ t(eventDef.descriptionKey) }} ({{ eventDef.key }})
                        </div>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button size="sm" variant="outline" @click="setAllWebhookEventsEnabled(true)">
                    {{ t('view.settings.notifications.notifications.webhook.events.actions.enable_all') }}
                </Button>
                <Button size="sm" variant="outline" @click="setAllWebhookEventsEnabled(false)">
                    {{ t('view.settings.notifications.notifications.webhook.events.actions.disable_all') }}
                </Button>
                <Button size="sm" variant="outline" @click="resetWebhookEventEnabledDefaults">
                    {{ t('view.settings.notifications.notifications.webhook.events.actions.reset_defaults') }}
                </Button>
                <Button size="sm" @click="closeDialog">
                    {{ t('dialog.shared_feed_filters.close') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';

    import { WEBHOOK_DYNAMIC_EVENT_RULES, WEBHOOK_EVENT_DEFS } from '../../../shared/constants/webhookEvents';
    import { useNotificationsSettingsStore } from '../../../stores';
    import SimpleSwitch from '../components/SimpleSwitch.vue';

    defineProps({
        isWebhookEventFiltersDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:isWebhookEventFiltersDialogVisible']);

    const { t } = useI18n();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const { webhookEventEnabledMap } = storeToRefs(notificationsSettingsStore);
    const {
        setWebhookEventEnabled,
        setAllWebhookEventsEnabled,
        resetWebhookEventEnabledDefaults
    } = notificationsSettingsStore;

    const webhookEventCategoryOrder = [
        'notification',
        'friend',
        'self',
        'instance',
        'favorite',
        'vrchat',
        'app'
    ];

    const webhookEventGroups = computed(() => {
        const allEvents = [...WEBHOOK_EVENT_DEFS, ...WEBHOOK_DYNAMIC_EVENT_RULES];
        const grouped = new Map();
        for (const category of webhookEventCategoryOrder) {
            grouped.set(category, []);
        }
        for (const eventDef of allEvents) {
            if (!grouped.has(eventDef.category)) {
                grouped.set(eventDef.category, []);
            }
            grouped.get(eventDef.category).push(eventDef);
        }
        return Array.from(grouped.entries())
            .filter(([, items]) => items.length > 0)
            .map(([category, items]) => ({
                category,
                titleKey: `view.settings.notifications.notifications.webhook.events.categories.${category}`,
                items
            }));
    });

    function closeDialog() {
        emit('update:isWebhookEventFiltersDialogVisible', false);
    }
</script>
