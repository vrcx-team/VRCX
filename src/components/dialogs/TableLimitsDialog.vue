<template>
    <Dialog v-model:open="tableLimitsDialog.visible">
        <DialogContent class="x-dialog sm:max-w-110">
            <DialogHeader>
                <DialogTitle>{{ t('prompt.change_table_size.header') }}</DialogTitle>
                <DialogDescription>{{ t('prompt.change_table_size.description') }}</DialogDescription>
            </DialogHeader>

            <FieldGroup class="mt-3 gap-3">
                <Field>
                    <FieldLabel>{{ t('prompt.change_table_size.table_max_size') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            v-model="tableLimitsDialog.maxTableSize"
                            type="text"
                            inputmode="numeric"
                            pattern="\\d*" />
                    </FieldContent>
                    <p :class="['mt-1 text-xs', maxTableSizeError ? 'text-destructive' : 'text-muted-foreground']">
                        {{ maxTableSizeError || maxTableSizeHint }}
                    </p>
                </Field>
                <Field>
                    <FieldLabel>{{ t('prompt.change_table_size.search_limit') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            v-model="tableLimitsDialog.searchLimit"
                            type="text"
                            inputmode="numeric"
                            pattern="\\d*" />
                    </FieldContent>
                    <p :class="['mt-1 text-xs', searchLimitError ? 'text-destructive' : 'text-muted-foreground']">
                        {{ searchLimitError || searchLimitHint }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                        {{ t('prompt.change_table_size.search_limit_warning') }}
                    </p>
                </Field>
            </FieldGroup>

            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="closeTableLimitsDialog">
                    {{ t('prompt.change_table_size.cancel') }}
                </Button>
                <Button :disabled="isSaveDisabled" @click="saveTableLimitsDialog">
                    {{ t('prompt.change_table_size.save') }}
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
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore } from '../../stores';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { tableLimitsDialog } = storeToRefs(appearanceSettingsStore);
    const {
        closeTableLimitsDialog,
        saveTableLimitsDialog,
        TABLE_MAX_SIZE_MIN,
        TABLE_MAX_SIZE_MAX,
        SEARCH_LIMIT_MIN,
        SEARCH_LIMIT_MAX
    } = appearanceSettingsStore;

    const { t } = useI18n();

    const maxTableSizeError = computed(() => {
        const n = Number(tableLimitsDialog.value.maxTableSize);
        if (!Number.isFinite(n) || n < TABLE_MAX_SIZE_MIN || n > TABLE_MAX_SIZE_MAX) {
            return t('prompt.change_table_size.table_max_size_error', {
                min: TABLE_MAX_SIZE_MIN,
                max: TABLE_MAX_SIZE_MAX
            });
        }
        return '';
    });

    const maxTableSizeHint = computed(() =>
        t('prompt.change_table_size.table_max_size_error', {
            min: TABLE_MAX_SIZE_MIN,
            max: TABLE_MAX_SIZE_MAX
        })
    );

    const searchLimitError = computed(() => {
        const n = Number(tableLimitsDialog.value.searchLimit);
        if (!Number.isFinite(n) || n < SEARCH_LIMIT_MIN || n > SEARCH_LIMIT_MAX) {
            return t('prompt.change_table_size.search_limit_error', {
                min: SEARCH_LIMIT_MIN,
                max: SEARCH_LIMIT_MAX
            });
        }
        return '';
    });

    const searchLimitHint = computed(() =>
        t('prompt.change_table_size.search_limit_error', {
            min: SEARCH_LIMIT_MIN,
            max: SEARCH_LIMIT_MAX
        })
    );

    const isSaveDisabled = computed(() => !!maxTableSizeError.value || !!searchLimitError.value);
</script>
