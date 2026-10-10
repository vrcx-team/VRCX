<template>
    <Dialog v-model:open="moderationReportDialog.visible">
        <DialogContent class="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.moderation_report.header') }}</DialogTitle>
                <DialogDescription>{{
                    moderationReportDialog.contentName || moderationReportDialog.contentId
                }}</DialogDescription>
            </DialogHeader>

            <div v-if="!categoryOptions.length" class="text-sm text-muted-foreground">
                {{ t('dialog.moderation_report.no_options') }}
            </div>

            <FieldGroup v-else class="gap-4">
                <Field>
                    <FieldLabel>{{ t('dialog.moderation_report.category') }}</FieldLabel>
                    <FieldContent>
                        <Select :model-value="category" @update:modelValue="setCategory">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.moderation_report.category')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="option in categoryOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FieldDescription v-if="selectedCategory?.tooltip">
                            {{ selectedCategory.tooltip }}
                        </FieldDescription>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('dialog.moderation_report.reason') }}</FieldLabel>
                    <FieldContent>
                        <Select v-model="reason" :disabled="!category">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('dialog.moderation_report.reason')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem v-for="option in reasonOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FieldDescription v-if="selectedReason?.tooltip">
                            {{ selectedReason.tooltip }}
                        </FieldDescription>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('dialog.moderation_report.description') }}</FieldLabel>
                    <FieldContent>
                        <Textarea
                            v-model="description"
                            class="resize-none"
                            rows="4"
                            :placeholder="t('dialog.moderation_report.description_placeholder')" />
                    </FieldContent>
                </Field>
            </FieldGroup>

            <DialogFooter>
                <Button size="sm" variant="secondary" @click="closeDialog">
                    {{ t('dialog.moderation_report.cancel') }}
                </Button>
                <Button size="sm" variant="destructive" :disabled="!canSubmit" @click="submitReport">
                    {{ t('dialog.moderation_report.submit') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useModerationStore } from '../../stores';
    import { moderationReportRequest } from '../../api';

    const { t } = useI18n();

    const { moderationReportDialog } = storeToRefs(useModerationStore());
    const { cachedConfig } = storeToRefs(useAuthStore());

    const category = ref('');
    const reason = ref('');
    const description = ref('');
    const isSubmitting = ref(false);

    const reportOptions = computed(() => cachedConfig.value?.reportOptions?.[moderationReportDialog.value.type] ?? {});

    const categoryOptions = computed(() => {
        const categories = cachedConfig.value?.reportCategories ?? {};
        return Object.keys(reportOptions.value)
            .map((key) => ({
                value: key,
                label: categories[key]?.text ?? key,
                order: categories[key]?.order ?? 0
            }))
            .sort((a, b) => a.order - b.order);
    });

    const reasonOptions = computed(() => {
        const reasons = cachedConfig.value?.reportReasons ?? {};
        return (reportOptions.value[category.value] ?? []).map((key) => ({
            value: key,
            label: reasons[key]?.text ?? key
        }));
    });

    const selectedCategory = computed(() => cachedConfig.value?.reportCategories?.[category.value]);
    const selectedReason = computed(() => cachedConfig.value?.reportReasons?.[reason.value]);

    const canSubmit = computed(
        () => Boolean(moderationReportDialog.value.contentId && category.value && reason.value) && !isSubmitting.value
    );

    watch(
        () => moderationReportDialog.value.visible,
        (visible) => {
            if (visible) {
                category.value = '';
                reason.value = '';
                description.value = '';
            }
        }
    );

    /**
     * @param {string} value
     */
    function setCategory(value) {
        category.value = value;
        reason.value = '';
    }

    function closeDialog() {
        moderationReportDialog.value.visible = false;
    }

    async function submitReport() {
        const D = moderationReportDialog.value;
        const params = {
            type: D.type,
            category: category.value,
            reason: reason.value,
            contentId: D.contentId
        };
        if (description.value.trim()) {
            params.description = description.value.trim();
        }
        if (D.details) {
            params.details = D.details;
        }
        isSubmitting.value = true;
        try {
            await moderationReportRequest.submitModerationReport(params);
            toast.success(t('dialog.moderation_report.success'));
            closeDialog();
        } finally {
            isSubmitting.value = false;
        }
    }
</script>
