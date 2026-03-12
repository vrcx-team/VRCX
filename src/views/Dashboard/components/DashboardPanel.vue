<template>
    <div class="relative flex min-h-0 flex-1 overflow-hidden rounded-md border bg-card">
        <template v-if="isEditing">
            <div class="flex w-full min-h-0 flex-col gap-2 p-3">
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <i v-if="panelIcon" :class="panelIcon" class="text-base" />
                    <span>{{ panelLabel || t('dashboard.panel.not_selected') }}</span>
                </div>
                <Button variant="outline" class="w-full" @click="openSelector">
                    {{ panelKey ? t('dashboard.panel.replace') : t('dashboard.panel.select') }}
                </Button>
            </div>
        </template>

        <template v-else-if="panelKey && panelComponent">
            <div class="h-full w-full overflow-y-auto">
                <component :is="panelComponent" />
            </div>
        </template>

        <div v-else class="flex w-full items-center justify-center text-sm text-muted-foreground">
            {{ t('dashboard.panel.not_configured') }}
        </div>

        <PanelSelector
            :open="selectorOpen"
            :current-key="panelKey"
            @select="handleSelect"
            @close="selectorOpen = false" />
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { navDefinitions } from '@/shared/constants/ui';

    import PanelSelector from './PanelSelector.vue';
    import { panelComponentMap } from './panelRegistry';

    const props = defineProps({
        panelKey: {
            type: String,
            default: null
        },
        isEditing: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['select']);
    const { t } = useI18n();
    const selectorOpen = ref(false);

    const panelComponent = computed(() => {
        if (!props.panelKey) {
            return null;
        }
        return panelComponentMap[props.panelKey] || null;
    });

    const panelOption = computed(() => {
        if (!props.panelKey) {
            return null;
        }
        return navDefinitions.find((def) => def.key === props.panelKey) || null;
    });

    const panelLabel = computed(() => {
        if (!panelOption.value?.labelKey) {
            return props.panelKey || '';
        }
        return t(panelOption.value.labelKey);
    });

    const panelIcon = computed(() => panelOption.value?.icon || '');

    const openSelector = () => {
        selectorOpen.value = true;
    };

    const handleSelect = (value) => {
        emit('select', value);
        selectorOpen.value = false;
    };
</script>
