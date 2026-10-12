<template>
    <div class="h-full min-h-0 flex flex-col p-2 rounded-xl bg-(--profile-card)">
        <div class="flex items-center gap-1">
            <Button class="rounded-full" variant="ghost" size="icon-sm" :disabled="isLoading" @click="getWorldListings">
                <Spinner v-if="isLoading" />
                <RefreshCw v-else />
            </Button>
        </div>
        <div v-if="worldDialog.listings.length" class="flex-1 min-h-0 overflow-y-auto">
            <div
                v-for="listing in worldDialog.listings"
                :key="listing.id"
                class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                <div class="relative inline-block flex-none size-24 mr-2.5">
                    <img
                        v-if="getListingImageUrl(listing)"
                        class="size-full rounded-lg object-cover cursor-pointer"
                        :src="getListingImageUrl(listing)"
                        @click="showFullscreenImageDialog(getListingImageUrl(listing))"
                        loading="lazy" />
                </div>
                <div class="flex-1 overflow-hidden">
                    <span
                        class="block truncate font-medium leading-[18px]"
                        v-text="replaceBioSymbols(listing.displayName)" />
                    <span class="block truncate text-xs" style="text-decoration: underline; font-style: italic"
                        >${{ commaNumber(listing.priceTokens) }}V</span
                    >
                    <span
                        v-if="listing.duration"
                        class="block truncate text-xs text-muted-foreground"
                        v-text="`${listing.duration} ${listing.durationType ?? ''}`" />
                    <span
                        class="block text-xs"
                        style="text-wrap: auto"
                        v-text="replaceBioSymbols(listing.description)" />
                </div>
            </div>
        </div>
        <DataTableEmpty v-else-if="!isLoading" type="nodata" />
    </div>
</template>

<script setup>
    import { RefreshCw } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Spinner } from '@/components/ui/spinner';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useGalleryStore, useWorldStore } from '../../../stores';
    import { AppDebug } from '@/services/appConfig';
    import { commaNumber, replaceBioSymbols } from '../../../shared/utils';
    import { miscRequest } from '../../../api';

    const { worldDialog } = storeToRefs(useWorldStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const isLoading = ref(false);

    function getListingImageUrl(listing) {
        if (listing.imageUrl) {
            return listing.imageUrl;
        }
        if (listing.imageId) {
            return `${AppDebug.endpointDomain}/file/${listing.imageId}/1/`;
        }
        return '';
    }

    async function getWorldListings() {
        const worldId = worldDialog.value.id;
        const storeId = worldDialog.value.ref.storeId;
        worldDialog.value.listings = [];
        if (!storeId) {
            return;
        }
        isLoading.value = true;
        try {
            const args = await miscRequest.getStore({
                storeId,
                hydrateListings: true,
                hydrateContext: false
            });
            if (worldDialog.value.id === worldId) {
                worldDialog.value.listings = args.json.listings ?? [];
            }
        } catch (err) {
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    defineExpose({
        getWorldListings
    });
</script>
