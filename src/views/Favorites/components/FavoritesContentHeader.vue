<template>
    <div class="flex items-center justify-between gap-3 mb-3">
        <div class="flex flex-col gap-0.5 text-base font-semibold pl-0.5 [&_small]:text-xs [&_small]:font-normal">
            <slot name="title" />
        </div>
        <div class="flex items-center gap-2 text-[13px]">
            <span>{{ t('view.favorite.edit_mode') }}</span>
            <Switch
                :model-value="editMode"
                :disabled="editModeDisabled"
                @update:modelValue="$emit('update:editMode', $event)" />
        </div>
    </div>
    <div class="flex items-center justify-end">
        <div v-if="editModeVisible" class="flex flex-wrap gap-2 mb-3">
            <Button size="sm" variant="outline" @click="$emit('toggle-select-all')">
                {{ isAllSelected ? t('view.favorite.deselect_all') : t('view.favorite.select_all') }}
            </Button>
            <Button size="sm" variant="secondary" :disabled="!hasSelection" @click="$emit('clear-selection')">
                {{ t('view.favorite.clear') }}
            </Button>
            <Button
                v-if="showCopyButton"
                size="sm"
                variant="outline"
                :disabled="!hasSelection"
                @click="$emit('copy-selection')">
                {{ t('view.favorite.copy') }}
            </Button>
            <Button size="sm" variant="outline" :disabled="!hasSelection" @click="$emit('bulk-unfavorite')">
                {{ t('view.favorite.bulk_unfavorite') }}
            </Button>
        </div>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { useI18n } from 'vue-i18n';

    defineProps({
        editMode: { type: Boolean, default: false },
        editModeDisabled: { type: Boolean, default: false },
        editModeVisible: { type: Boolean, default: false },
        isAllSelected: { type: Boolean, default: false },
        hasSelection: { type: Boolean, default: false },
        showCopyButton: { type: Boolean, default: true }
    });

    defineEmits(['update:editMode', 'toggle-select-all', 'clear-selection', 'copy-selection', 'bulk-unfavorite']);

    const { t } = useI18n();
</script>
