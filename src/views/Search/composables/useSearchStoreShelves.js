import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { useModalStore, useSearchStore, useUserStore } from '../../../stores';
import { commaNumber, replaceBioSymbols } from '../../../shared/utils';
import { marketplaceRequest } from '../../../api';

const VRCHAT_STORE_IDS = [
    'esto_00000000-0000-0000-0000-000000000000',
    'esto_00000000-0000-0000-0000-000000000001',
    'esto_00000000-0000-0000-0000-000000000002'
];

/**
 * VRChat store shelves composable for Search view.
 * Fetches the official store shelves, tracks owned listings and handles purchases.
 */
export function useSearchStoreShelves() {
    const { t } = useI18n();
    const { searchText } = storeToRefs(useSearchStore());
    const userStore = useUserStore();
    const { currentUserCredits, isLocalUserVrcPlusSupporter, ownedListingIds, ownedProductIds } = storeToRefs(userStore);
    const modalStore = useModalStore();

    const storeShelves = ref([]);
    const isStoreShelvesLoading = ref(false);
    const purchasingListingId = ref('');

    const filteredStoreShelves = computed(() => {
        const query = searchText.value.trim().toLowerCase();
        if (!query) {
            return storeShelves.value;
        }
        return storeShelves.value
            .map((shelf) => ({
                ...shelf,
                listings: shelf.listings.filter(
                    (listing) =>
                        listing.displayName.toLowerCase().includes(query) ||
                        listing.subtitle?.toLowerCase().includes(query)
                )
            }))
            .filter((shelf) => shelf.listings.length > 0);
    });

    function isListingOwned(listing) {
        if (ownedListingIds.value.has(listing.id)) {
            return true;
        }
        const productIds = listing.productIds ?? [];
        return productIds.length > 0 && productIds.every((id) => ownedProductIds.value.has(id));
    }

    function getListingPrice(listing) {
        if (isLocalUserVrcPlusSupporter.value && listing.vrcPlusDiscountPrice != null) {
            return listing.vrcPlusDiscountPrice;
        }
        return listing.priceTokens;
    }

    function canPurchaseListing(listing) {
        return (
            !purchasingListingId.value &&
            currentUserCredits.value !== null &&
            currentUserCredits.value >= getListingPrice(listing)
        );
    }

    async function refreshCredits() {
        try {
            const args = await marketplaceRequest.getVRChatCredits();
            userStore.setCurrentUserCredits(args.json?.balance ?? null);
        } catch (err) {
            console.error(err);
        }
    }

    async function getStoreShelves() {
        isStoreShelvesLoading.value = true;
        try {
            const [results] = await Promise.all([
                Promise.all(
                    VRCHAT_STORE_IDS.map((storeId) =>
                        marketplaceRequest.getStoreShelves({
                            storeId,
                            fetch: 'public',
                            hydrateListings: true
                        })
                    )
                ),
                userStore.getAllProductPurchases()
            ]);
            storeShelves.value = results
                .flatMap((args) => args.json ?? [])
                .map((shelf) => ({
                    ...shelf,
                    listings: (shelf.listings ?? [])
                        .filter((listing) => listing.active)
                        .map((listing) => ({
                            ...listing,
                            displayName: replaceBioSymbols(listing.displayName),
                            description: replaceBioSymbols(listing.description)
                        }))
                }));
        } catch (err) {
            console.error(err);
        } finally {
            isStoreShelvesLoading.value = false;
        }
    }

    async function purchaseListing(listing) {
        const price = getListingPrice(listing);
        const { ok } = await modalStore.confirm({
            title: t('confirm.title'),
            description: t('dialog.avatar.info.purchase_confirm', {
                name: listing.displayName,
                price: commaNumber(price)
            })
        });
        if (!ok) {
            return;
        }
        purchasingListingId.value = listing.id;
        try {
            await marketplaceRequest.purchaseListing({
                listingId: listing.id,
                totalPrice: price,
                quantity: 1
            });
            toast.success(t('dialog.avatar.info.purchase_success'));
            await refreshCredits();
        } catch (err) {
            console.error('Failed to purchase listing', err);
        } finally {
            purchasingListingId.value = '';
            userStore.getAllProductPurchases();
        }
    }

    return {
        filteredStoreShelves,
        isStoreShelvesLoading,
        purchasingListingId,
        getStoreShelves,
        isListingOwned,
        getListingPrice,
        canPurchaseListing,
        purchaseListing
    };
}
