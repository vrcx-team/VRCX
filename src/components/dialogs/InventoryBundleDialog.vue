<template>
    <Dialog :open="inventoryBundleDialog.visible" @update:open="(open) => !open && closeDialog()">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.inventory_bundle_dialog.header') }}</DialogTitle>
                <DialogDescription>{{ t('dialog.inventory_bundle_dialog.description') }}</DialogDescription>
            </DialogHeader>

            <div class="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
                <div v-for="bundle in inventoryBundleDialog.bundles" :key="bundle.id" class="flex items-center gap-3">
                    <img :src="bundle.imageUrl" loading="lazy" class="size-12 shrink-0 rounded object-cover" />
                    <div class="min-w-0">
                        <div class="truncate text-sm">{{ bundle.name }}</div>
                        <div v-if="bundle.description" class="truncate text-xs text-muted-foreground">
                            {{ bundle.description }}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <label class="inline-flex items-center gap-2 text-sm sm:mr-auto">
                    <Checkbox v-model="dontShowAgain" />
                    <span>{{ t('dialog.inventory_bundle_dialog.dont_show_again') }}</span>
                </label>
                <Button size="sm" variant="secondary" @click="closeDialog">{{
                    t('dialog.inventory_bundle_dialog.close')
                }}</Button>
                <Button size="sm" :disabled="isConsuming" @click="consumeBundles">{{
                    t('dialog.inventory_bundle_dialog.consume')
                }}</Button>
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
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { toast } from 'vue-sonner';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { inventoryRequest } from '../../api';
    import { useGalleryStore, useNotificationStore, useNotificationsSettingsStore } from '../../stores';

    const { t } = useI18n();

    const { inventoryBundleDialog } = storeToRefs(useNotificationStore());
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const { showGalleryPage } = useGalleryStore();

    const dontShowAgain = ref(false);
    const isConsuming = ref(false);

    function closeDialog() {
        inventoryBundleDialog.value.visible = false;
        if (dontShowAgain.value && notificationsSettingsStore.inventoryBundleNotifications) {
            notificationsSettingsStore.setInventoryBundleNotifications();
        }
        dontShowAgain.value = false;
    }

    async function consumeBundles() {
        isConsuming.value = true;
        for (const bundle of inventoryBundleDialog.value.bundles) {
            try {
                await inventoryRequest.consumeInventoryBundle({ inventoryId: bundle.id });
                toast.success(t('dialog.inventory_bundle_dialog.consume_success'));
            } catch (err) {
                console.error('Error consuming inventory bundle:', err);
            }
        }
        isConsuming.value = false;
        closeDialog();
        showGalleryPage('inventory');
    }
</script>
