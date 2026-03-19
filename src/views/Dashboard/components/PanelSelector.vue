<template>
    <Dialog :open="open" @update:open="(value) => !value && emit('close')">
        <DialogContent class="sm:max-w-110">
            <DialogHeader>
                <DialogTitle>{{ t('dashboard.selector.title') }}</DialogTitle>
            </DialogHeader>

            <div class="max-h-[50vh] overflow-y-auto">
                <!-- Widget section -->
                <div class="mb-3">
                    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                        {{ t('dashboard.selector.widgets') }}
                    </span>
                    <div class="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                            v-for="option in widgetOptions"
                            :key="option.key"
                            type="button"
                            class="flex items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent"
                            :class="
                                option.key === currentPanelKey
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                    : 'border-primary/20'
                            "
                            @click="handleSelectWidget(option)">
                            <i :class="option.icon" class="text-base"></i>
                            <span>{{ t(option.labelKey) }}</span>
                        </button>
                    </div>
                </div>

                <!-- Full pages section -->
                <div>
                    <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                        {{ t('dashboard.selector.pages') }}
                    </span>
                    <div class="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                            v-for="option in panelOptions"
                            :key="option.key"
                            type="button"
                            class="flex items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent"
                            :class="
                                option.key === currentPanelKey
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                    : ''
                            "
                            @click="emit('select', option.key)">
                            <i :class="option.icon" class="text-base"></i>
                            <span>{{ t(option.labelKey) }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="ghost" @click="emit('select', null)">{{ t('dashboard.selector.clear') }}</Button>
                <Button variant="secondary" @click="emit('close')">{{ t('dashboard.actions.cancel') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { DASHBOARD_BLOCKED_PANEL_KEYS } from '@/shared/constants/dashboard';
    import { isToolNavKey } from '@/shared/constants';
    import { navDefinitions } from '@/shared/constants/ui';

    const widgetDefinitions = [
        {
            key: 'widget:feed',
            icon: 'ri-rss-line',
            labelKey: 'dashboard.widget.feed',
            defaultConfig: { filters: [] }
        },
        {
            key: 'widget:game-log',
            icon: 'ri-history-line',
            labelKey: 'dashboard.widget.game_log',
            defaultConfig: { filters: [] }
        },
        {
            key: 'widget:instance',
            icon: 'ri-group-3-line',
            labelKey: 'dashboard.widget.instance',
            defaultConfig: { columns: ['icon', 'displayName', 'rank', 'timer'] }
        }
    ];

    const props = defineProps({
        open: {
            type: Boolean,
            default: false
        },
        currentKey: {
            type: [String, Object],
            default: null
        }
    });

    const emit = defineEmits(['select', 'close']);
    const { t } = useI18n();

    const currentPanelKey = computed(() => {
        if (!props.currentKey) return null;
        if (typeof props.currentKey === 'string') return props.currentKey;
        return props.currentKey.key || null;
    });

    const widgetOptions = computed(() => widgetDefinitions);

    const panelOptions = computed(() =>
        navDefinitions.filter(
            (def) => def.routeName && !DASHBOARD_BLOCKED_PANEL_KEYS.has(def.key) && !isToolNavKey(def.key)
        )
    );

    function handleSelectWidget(option) {
        emit('select', {
            key: option.key,
            config: { ...option.defaultConfig }
        });
    }
</script>
