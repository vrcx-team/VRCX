<script setup>
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle
    } from '@/components/ui/alert-dialog';
    import { Checkbox } from '@/components/ui/checkbox';
    import { storeToRefs } from 'pinia';
    import { useModalStore } from '@/stores';
    import { nextTick, ref, watch } from 'vue';

    const modalStore = useModalStore();

    const {
        alertOpen,
        alertMode,
        alertTitle,
        alertDescription,
        alertOkText,
        alertCancelText,
        alertDismissible,
        alertDestructive,
        alertCheckboxLabel,
        alertChecked
    } = storeToRefs(modalStore);

    const actionRef = ref(null);

    function onEscapeKeyDown(event) {
        if (!alertDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleDismiss();
    }

    function onPointerDownOutside(event) {
        if (!alertDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleDismiss();
    }

    function onInteractOutside(event) {
        if (!alertDismissible.value) {
            event.preventDefault();
            return;
        }
        modalStore.handleDismiss();
    }

    watch(alertOpen, async (newVal) => {
        if (newVal) {
            await nextTick();
            await nextTick();
            actionRef.value?.$el?.focus?.();
        }
    });
</script>

<template>
    <AlertDialog :open="alertOpen" @update:open="modalStore.setAlertOpen">
        <AlertDialogContent
            @escapeKeyDown="onEscapeKeyDown"
            @pointerDownOutside="onPointerDownOutside"
            @interactOutside="onInteractOutside">
            <AlertDialogHeader class="min-w-0">
                <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
                <AlertDialogDescription class="w-full min-w-0 whitespace-normal wrap-anywhere">
                    {{ alertDescription }}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <label v-if="alertCheckboxLabel" class="inline-flex items-center gap-2 text-sm sm:mr-auto">
                    <Checkbox v-model="alertChecked" />
                    <span>{{ alertCheckboxLabel }}</span>
                </label>
                <AlertDialogCancel v-if="alertMode === 'confirm'" @click="modalStore.handleCancel">
                    {{ alertCancelText }}
                </AlertDialogCancel>

                <AlertDialogAction
                    ref="actionRef"
                    :variant="alertDestructive ? 'destructive' : undefined"
                    @click="modalStore.handleOk">
                    {{ alertOkText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
