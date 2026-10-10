<template>
    <div class="flex flex-col gap-2 p-2">
        <InputGroupField
            v-model="form.name"
            size="sm"
            :maxlength="64"
            show-count
            :placeholder="t('dialog.group.gallery.name')"
            :disabled="saving" />
        <InputGroupTextareaField
            v-model="form.description"
            :rows="3"
            :maxlength="512"
            show-count
            :placeholder="t('dialog.group.gallery.description')"
            :disabled="saving" />
        <label class="flex items-center gap-2 text-sm">
            <Checkbox v-model="form.membersOnly" :disabled="saving" />
            <span>{{ t('dialog.group.gallery.members_only') }}</span>
        </label>
        <div class="flex justify-end gap-2">
            <Button variant="secondary" size="sm" :disabled="saving" @click="emit('cancel')">
                {{ t('common.actions.cancel') }}
            </Button>
            <Button size="sm" :disabled="saving || !form.name.trim()" @click="emit('save')">
                {{ submitLabel }}
            </Button>
        </div>
    </div>
</template>

<script setup>
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { useI18n } from 'vue-i18n';

    defineProps({
        form: {
            type: Object,
            required: true
        },
        saving: {
            type: Boolean,
            default: false
        },
        submitLabel: {
            type: String,
            required: true
        }
    });
    const emit = defineEmits(['save', 'cancel']);

    const { t } = useI18n();
</script>
