<template>
    <div class="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
        <Input
            :model-value="name"
            :placeholder="t('dashboard.toolbar.name_placeholder')"
            class="mx-2 h-7 max-w-[200px] text-sm"
            @update:model-value="emit('update:name', $event)" />
        <div class="flex gap-2">
            <Button variant="secondary" size="sm" @click="emit('cancel')">{{ t('dashboard.actions.cancel') }}</Button>
            <Button variant="destructive" size="sm" @click="emit('delete')">{{ t('dashboard.actions.delete') }}</Button>
        </div>
        <Button class="ml-auto" size="sm" @click="emit('save')">{{ t('dashboard.actions.save') }}</Button>
    </div>
</template>

<script setup>
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';

    defineProps({
        name: {
            type: String,
            default: ''
        }
    });
    const emit = defineEmits(['save', 'cancel', 'delete', 'update:name']);
    const { t } = useI18n();
</script>
