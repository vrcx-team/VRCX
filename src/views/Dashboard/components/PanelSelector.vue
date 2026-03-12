<template>
    <Dialog :open="open" @update:open="(value) => !value && emit('close')">
        <DialogContent class="sm:max-w-110">
            <DialogHeader>
                <DialogTitle>{{ t('dashboard.selector.title') }}</DialogTitle>
            </DialogHeader>

            <div class="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                <button
                    v-for="option in panelOptions"
                    :key="option.key"
                    type="button"
                    class="flex items-center gap-2 rounded-md border p-2 text-left text-sm hover:bg-accent"
                    :class="option.key === currentKey ? 'border-primary bg-primary/5 ring-1 ring-primary/40' : ''"
                    @click="emit('select', option.key)">
                    <i :class="option.icon" class="text-base" />
                    <span>{{ t(option.labelKey) }}</span>
                </button>
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
    import { navDefinitions } from '@/shared/constants/ui';

    defineProps({
        open: {
            type: Boolean,
            default: false
        },
        currentKey: {
            type: String,
            default: null
        }
    });

    const emit = defineEmits(['select', 'close']);
    const { t } = useI18n();

    const panelOptions = computed(() => navDefinitions.filter((def) => def.routeName));
</script>
