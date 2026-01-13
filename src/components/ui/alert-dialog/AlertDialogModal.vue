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
    import { storeToRefs } from 'pinia';
    import { useModalStore } from '@/stores';

    const modalStore = useModalStore();

    const { alertOpen, alertMode, alertTitle, alertDescription, alertOkText, alertCancelText, alertDismissible } =
        storeToRefs(modalStore);

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
</script>

<template>
    <AlertDialog :open="alertOpen" @update:open="modalStore.setAlertOpen">
        <AlertDialogContent
            @escapeKeyDown="onEscapeKeyDown"
            @pointerDownOutside="onPointerDownOutside"
            @interactOutside="onInteractOutside">
            <AlertDialogHeader>
                <AlertDialogTitle>{{ alertTitle }}</AlertDialogTitle>
                <AlertDialogDescription>{{ alertDescription }}</AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <AlertDialogCancel v-if="alertMode === 'confirm'" @click="modalStore.handleCancel">
                    {{ alertCancelText }}
                </AlertDialogCancel>

                <AlertDialogAction @click="modalStore.handleOk">
                    {{ alertOkText }}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
