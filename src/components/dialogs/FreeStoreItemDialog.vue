<template>
    <Dialog :open="freeStoreItemDialog.visible" @update:open="(open) => !open && closeDialog()">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.free_store_item_dialog.header') }}</DialogTitle>
                <DialogDescription>{{ t('dialog.free_store_item_dialog.description') }}</DialogDescription>
            </DialogHeader>

            <div class="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
                <div v-for="listing in freeStoreItemDialog.listings" :key="listing.id" class="flex items-center gap-3">
                    <img
                        :src="listing.imageUrl || getFileImageUrl(listing.imageId)"
                        loading="lazy"
                        class="size-12 shrink-0 rounded object-cover" />
                    <div class="min-w-0">
                        <div class="truncate text-sm">{{ listing.displayName }}</div>
                        <div v-if="listing.subtitle" class="truncate text-xs text-muted-foreground">
                            {{ listing.subtitle }}
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter>
                <label class="inline-flex items-center gap-2 text-sm sm:mr-auto">
                    <Checkbox v-model="dontShowAgain" />
                    <span>{{ t('dialog.free_store_item_dialog.dont_show_again') }}</span>
                </label>
                <Button size="sm" variant="secondary" @click="closeDialog">{{
                    t('dialog.free_store_item_dialog.close')
                }}</Button>
                <Button size="sm" :disabled="isClaiming" @click="claimListings">{{
                    t('dialog.free_store_item_dialog.claim')
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

    import { marketplaceRequest } from '../../api';
    import { AppDebug } from '../../services/appConfig';
    import { useNotificationStore, useNotificationsSettingsStore, useUserStore } from '../../stores';

    const { t } = useI18n();

    const { freeStoreItemDialog } = storeToRefs(useNotificationStore());
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const userStore = useUserStore();

    const dontShowAgain = ref(false);
    const isClaiming = ref(false);

    function getFileImageUrl(fileId) {
        return `${AppDebug.endpointDomain}/file/${fileId}/1/`;
    }

    function closeDialog() {
        freeStoreItemDialog.value.visible = false;
        if (dontShowAgain.value && notificationsSettingsStore.freeStoreItemNotifications) {
            notificationsSettingsStore.setFreeStoreItemNotifications();
        }
        dontShowAgain.value = false;
    }

    async function claimListings() {
        isClaiming.value = true;
        let claimed = 0;
        for (const listing of freeStoreItemDialog.value.listings) {
            try {
                await marketplaceRequest.purchaseListing({
                    listingId: listing.id,
                    totalPrice: 0,
                    quantity: 1
                });
                claimed++;
            } catch (err) {
                console.error('Error claiming free store item:', err);
            }
        }
        if (claimed > 0) {
            toast.success(t('dialog.free_store_item_dialog.claim_success', { count: claimed }));
        }
        isClaiming.value = false;
        closeDialog();
        userStore.getAllProductPurchases();
    }
</script>
