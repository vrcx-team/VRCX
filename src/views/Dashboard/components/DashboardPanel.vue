<template>
    <div class="relative flex min-h-0 flex-1 overflow-hidden rounded-md border bg-card">
        <template v-if="isEditing">
            <Button
                v-if="showRemove"
                variant="ghost"
                size="icon-sm"
                class="absolute right-1 top-1 z-20"
                @click="emit('remove')">
                <X class="size-4" />
            </Button>
            <div class="flex w-full min-h-0 flex-col gap-2 p-3">
                <div class="flex flex-1 items-center justify-center gap-2 text-base text-muted-foreground">
                    <i v-if="panelIcon" :class="panelIcon" class="text-base" />
                    <span>{{ panelLabel || t('dashboard.panel.not_selected') }}</span>
                </div>

                <!-- Widget config section -->
                <div v-if="isWidget && panelKey" class="border-t border-border/50 py-1">
                    <!-- Feed/GameLog: event type filters -->
                    <template v-if="widgetType === 'feed' || widgetType === 'game-log'">
                        <span class="text-xs text-muted-foreground">{{ t('dashboard.widget.config.filters') }}</span>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                            <label
                                v-for="filterType in availableFilters"
                                :key="filterType"
                                class="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="isFilterActive(filterType)"
                                    @change="toggleFilter(filterType)" />
                                {{ filterType }}
                            </label>
                        </div>
                        <div class="mt-2">
                            <label
                                v-if="widgetType === 'game-log'"
                                class="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="panelConfig.showDetail || false"
                                    @change="toggleBooleanConfig('showDetail')" />
                                {{ t('dashboard.widget.config.show_detail') }}
                            </label>
                            <label v-if="widgetType === 'feed'" class="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="panelConfig.showType || false"
                                    @change="toggleBooleanConfig('showType')" />
                                {{ t('dashboard.widget.config.show_type') }}
                            </label>
                        </div>
                    </template>

                    <!-- Instance: column visibility -->
                    <template v-if="widgetType === 'instance'">
                        <span class="text-xs text-muted-foreground">{{ t('dashboard.widget.config.columns') }}</span>
                        <div class="flex flex-wrap gap-1.5 mt-1">
                            <label
                                v-for="col in availableColumns"
                                :key="col"
                                class="flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    :checked="isColumnActive(col)"
                                    :disabled="col === 'displayName'"
                                    @change="toggleColumn(col)" />
                                {{ t(`table.playerList.${col}`) }}
                            </label>
                        </div>
                    </template>
                </div>

                <Button variant="outline" class="w-full" @click="openSelector">
                    {{ panelKey ? t('dashboard.panel.replace') : t('dashboard.panel.select') }}
                </Button>
            </div>
        </template>

        <template v-else-if="panelKey && panelComponent">
            <div class="dashboard-panel h-full w-full overflow-y-auto">
                <component :is="panelComponent" v-bind="widgetProps" />
            </div>
        </template>

        <div v-else class="flex w-full items-center justify-center text-sm text-muted-foreground">
            {{ t('dashboard.panel.not_configured') }}
        </div>

        <PanelSelector
            :open="selectorOpen"
            :current-key="panelData"
            @select="handleSelect"
            @close="selectorOpen = false" />
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { X } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { navDefinitions } from '@/shared/constants/ui';

    import PanelSelector from './PanelSelector.vue';
    import { panelComponentMap } from './panelRegistry';

    const FEED_TYPES = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];
    const GAMELOG_TYPES = [
        'Location',
        'OnPlayerJoined',
        'OnPlayerLeft',
        'VideoPlay',
        'PortalSpawn',
        'Event',
        'External'
    ];
    const INSTANCE_COLUMNS = ['icon', 'displayName', 'rank', 'timer', 'platform', 'language', 'status'];

    const props = defineProps({
        panelData: {
            type: [String, Object],
            default: null
        },
        isEditing: {
            type: Boolean,
            default: false
        },
        showRemove: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['select', 'remove']);
    const { t } = useI18n();
    const selectorOpen = ref(false);

    // Extract key from string or object format
    const panelKey = computed(() => {
        if (!props.panelData) return null;
        if (typeof props.panelData === 'string') return props.panelData;
        return props.panelData.key || null;
    });

    const panelConfig = computed(() => {
        if (!props.panelData || typeof props.panelData === 'string') return {};
        return props.panelData.config || {};
    });

    const isWidget = computed(() => {
        return panelKey.value && panelKey.value.startsWith('widget:');
    });

    const widgetType = computed(() => {
        if (!isWidget.value) return null;
        return panelKey.value.replace('widget:', '');
    });

    const panelComponent = computed(() => {
        if (!panelKey.value) return null;
        return panelComponentMap[panelKey.value] || null;
    });

    const widgetProps = computed(() => {
        if (!isWidget.value) return {};
        return { config: panelConfig.value };
    });

    const widgetDefs = {
        'widget:feed': { icon: 'ri-rss-line', labelKey: 'dashboard.widget.feed' },
        'widget:game-log': { icon: 'ri-history-line', labelKey: 'dashboard.widget.game_log' },
        'widget:instance': { icon: 'ri-group-3-line', labelKey: 'dashboard.widget.instance' }
    };

    const panelOption = computed(() => {
        if (!panelKey.value) return null;
        if (widgetDefs[panelKey.value]) return widgetDefs[panelKey.value];
        return navDefinitions.find((def) => def.key === panelKey.value) || null;
    });

    const panelLabel = computed(() => {
        if (!panelOption.value?.labelKey) return panelKey.value || '';
        return t(panelOption.value.labelKey);
    });

    const panelIcon = computed(() => panelOption.value?.icon || '');

    // Filter config helpers
    const availableFilters = computed(() => {
        if (widgetType.value === 'feed') return FEED_TYPES;
        if (widgetType.value === 'game-log') return GAMELOG_TYPES;
        return [];
    });

    function isFilterActive(filterType) {
        const filters = panelConfig.value.filters;
        if (!filters || !Array.isArray(filters) || filters.length === 0) return true;
        return filters.includes(filterType);
    }

    function toggleFilter(filterType) {
        const currentFilters = panelConfig.value.filters;
        let filters;
        if (!currentFilters || !Array.isArray(currentFilters) || currentFilters.length === 0) {
            filters = availableFilters.value.filter((f) => f !== filterType);
        } else if (currentFilters.includes(filterType)) {
            filters = currentFilters.filter((f) => f !== filterType);
            if (filters.length === 0) filters = [];
        } else {
            filters = [...currentFilters, filterType];
            if (filters.length === availableFilters.value.length) filters = [];
        }
        emitConfigUpdate({ ...panelConfig.value, filters });
    }

    const availableColumns = computed(() => INSTANCE_COLUMNS);

    function isColumnActive(col) {
        const columns = panelConfig.value.columns;
        if (!columns || !Array.isArray(columns) || columns.length === 0) {
            return ['icon', 'displayName', 'timer'].includes(col);
        }
        return columns.includes(col);
    }

    function toggleColumn(col) {
        if (col === 'displayName') return; // Always visible
        const currentColumns = panelConfig.value.columns || ['icon', 'displayName', 'timer'];
        let columns;
        if (currentColumns.includes(col)) {
            columns = currentColumns.filter((c) => c !== col);
        } else {
            columns = [...currentColumns, col];
        }
        emitConfigUpdate({ ...panelConfig.value, columns });
    }

    function toggleBooleanConfig(key) {
        emitConfigUpdate({ ...panelConfig.value, [key]: !panelConfig.value[key] });
    }

    function emitConfigUpdate(newConfig) {
        emit('select', { key: panelKey.value, config: newConfig });
    }

    const openSelector = () => {
        selectorOpen.value = true;
    };

    const handleSelect = (value) => {
        emit('select', value);
        selectorOpen.value = false;
    };
</script>

<style scoped>
    .dashboard-panel :deep(.x-container) {
        height: 100%;
        margin: 0;
        border: none;
        border-radius: 0;
        background: transparent;
    }
</style>
