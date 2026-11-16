<template>
    <Dialog v-model:open="open">
        <DialogTrigger as-child>
            <Button variant="outline" size="sm" class="ml-2" @click="resetDraft">
                {{ t('view.game_log.url_filter.title') }}
                <span v-if="resourceLoadFilter.enabled">({{ resourceLoadFilter.patterns.length }})</span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('view.game_log.url_filter.title') }}</DialogTitle>
                <DialogDescription>{{ t('view.game_log.url_filter.description') }}</DialogDescription>
            </DialogHeader>
            <label class="flex items-center gap-2">
                <Switch v-model="enabled" :aria-label="t('view.game_log.url_filter.enabled')" />
                {{ t('view.game_log.url_filter.enabled') }}
            </label>
            <p class="text-sm text-muted-foreground">{{ t('view.game_log.url_filter.help') }}</p>
            <div class="max-h-64 overflow-y-auto space-y-3">
                <div v-for="(pattern, index) in patterns" :key="index">
                    <div class="flex items-center gap-2">
                        <Input
                            v-model="patterns[index]"
                            class="font-mono"
                            :aria-label="t('view.game_log.url_filter.pattern', { number: index + 1 })"
                            :aria-invalid="!!compiled[index].error"
                            :placeholder="String.raw`logs\.example\.com`" />
                        <Button variant="ghost" size="sm" @click="patterns.splice(index, 1)">
                            {{ t('view.game_log.url_filter.remove') }}
                        </Button>
                    </div>
                    <p v-if="compiled[index].error" role="alert" class="text-sm text-destructive">
                        {{ t('view.game_log.url_filter.invalid') }}: {{ compiled[index].error }}
                    </p>
                </div>
            </div>
            <Button variant="outline" @click="patterns.push('')">{{ t('view.game_log.url_filter.add') }}</Button>
            <p v-if="saveError" role="alert" class="text-sm text-destructive">{{ saveError }}</p>
            <DialogFooter>
                <Button variant="outline" :disabled="saving" @click="open = false">
                    {{ t('view.game_log.url_filter.cancel') }}
                </Button>
                <Button :disabled="hasErrors || saving" @click="save">
                    {{ t('view.game_log.url_filter.save') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Switch } from '@/components/ui/switch';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
        DialogTrigger
    } from '@/components/ui/dialog';
    import { useGameLogStore } from '../../../stores';
    import { compileResourceLoadFilters } from '../../../shared/utils/resourceLoadFilter';

    const emit = defineEmits(['saved']);
    const { t } = useI18n();
    const store = useGameLogStore();
    const { resourceLoadFilter } = storeToRefs(store);
    const open = ref(false);
    const enabled = ref(false);
    const patterns = ref([]);
    const saving = ref(false);
    const saveError = ref('');
    const compiled = computed(() => compileResourceLoadFilters(patterns.value));
    const hasErrors = computed(() => compiled.value.some(({ error }) => error));

    function resetDraft() {
        enabled.value = resourceLoadFilter.value.enabled;
        patterns.value = [...resourceLoadFilter.value.patterns];
        saveError.value = '';
    }

    async function save() {
        if (hasErrors.value || saving.value) return;
        saving.value = true;
        saveError.value = '';
        try {
            await store.setResourceLoadFilter({ enabled: enabled.value, patterns: patterns.value });
            emit('saved');
            open.value = false;
        } catch {
            saveError.value = t('view.game_log.url_filter.save_error');
        } finally {
            saving.value = false;
        }
    }
</script>
