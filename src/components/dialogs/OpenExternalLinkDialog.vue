<script setup>
    import {
        AlertDialog,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle
    } from '@/components/ui/alert-dialog';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { nextTick, ref, watch } from 'vue';

    import { useExternalLinkStore } from '@/stores';
    import { copyToClipboard } from '@/shared/utils/appActions';

    const externalLinkStore = useExternalLinkStore();
    const { externalLinkDialog } = storeToRefs(externalLinkStore);
    const openButtonRef = ref(null);

    function setOpen(open) {
        externalLinkDialog.value.visible = open;
    }

    function dismiss() {
        setOpen(false);
    }

    function copyLink() {
        if (!externalLinkDialog.value.visible) return;
        const link = externalLinkDialog.value.link;
        setOpen(false);
        copyToClipboard(link, 'Link copied to clipboard!');
    }

    function openLink() {
        if (!externalLinkDialog.value.visible) return;
        const link = externalLinkDialog.value.link;
        setOpen(false);
        AppApi.OpenLink(link);
    }

    function onKeyDown(event) {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') {
            return;
        }
        event.preventDefault();
        copyLink();
    }

    watch(
        () => externalLinkDialog.value.visible,
        async (visible) => {
            if (!visible) return;
            await nextTick();
            await nextTick();
            openButtonRef.value?.$el?.focus?.();
        }
    );
</script>

<template>
    <AlertDialog :open="externalLinkDialog.visible" @update:open="setOpen">
        <AlertDialogContent
            @keydown="onKeyDown"
            @escapeKeyDown="dismiss"
            @pointerDownOutside="dismiss"
            @interactOutside="dismiss">
            <AlertDialogHeader class="min-w-0">
                <AlertDialogTitle>Open External Link</AlertDialogTitle>
                <AlertDialogDescription class="w-full min-w-0 whitespace-normal wrap-anywhere">
                    {{ externalLinkDialog.link }}
                </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
                <Button variant="outline" @click="copyLink">Copy</Button>
                <Button ref="openButtonRef" @click="openLink">Open</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
