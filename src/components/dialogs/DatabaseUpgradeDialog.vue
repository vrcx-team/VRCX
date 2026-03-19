<template>
    <AlertDialog :open="isOpen">
        <AlertDialogContent
            class="sm:max-w-[460px]"
            @interact-outside.prevent
            @escape-key-down.prevent
            @pointer-down-outside.prevent
            @close-auto-focus.prevent>
            <AlertDialogHeader>
                <AlertDialogTitle>{{ t('message.database.upgrade_in_progress_title') }}</AlertDialogTitle>
                <AlertDialogDescription>
                    {{ description }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div class="flex items-center gap-3 pt-2">
                <Spinner class="h-5 w-5" />
                <span class="text-sm text-muted-foreground">
                    {{ t('message.database.upgrade_in_progress_wait') }}
                </span>
            </div>
        </AlertDialogContent>
    </AlertDialog>
</template>

<script setup>
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import {
        AlertDialog,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogHeader,
        AlertDialogTitle
    } from '@/components/ui/alert-dialog';
    import { Spinner } from '@/components/ui/spinner';
    import { useI18n } from 'vue-i18n';

    import { useVrcxStore } from '../../stores';

    const { t } = useI18n();
    const { databaseUpgradeState } = storeToRefs(useVrcxStore());

    const isOpen = computed(() => databaseUpgradeState.value.visible);
    const description = computed(() => {
        if (databaseUpgradeState.value.fromVersion > 0) {
            return t('message.database.upgrade_in_progress_description', {
                from: databaseUpgradeState.value.fromVersion,
                to: databaseUpgradeState.value.toVersion
            });
        }
        return t('message.database.upgrade_in_progress_initializing');
    });
</script>
