<template>
    <Dialog :open="isPurchaseHistoryDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.purchase_history.header') }}</DialogTitle>
            </DialogHeader>

            <Tabs v-model="activeTab">
                <div class="flex items-center gap-2">
                    <TabsList>
                        <TabsTrigger value="purchases">{{ t('dialog.purchase_history.purchases') }}</TabsTrigger>
                        <TabsTrigger value="transactions">{{ t('dialog.purchase_history.transactions') }}</TabsTrigger>
                    </TabsList>
                    <Select v-if="activeTab === 'purchases'" v-model="typeFilter">
                        <SelectTrigger size="sm" class="w-40">
                            <SelectValue :placeholder="t('dialog.purchase_history.filter_type')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem v-for="option in typeOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" class="ml-auto" :disabled="isLoading" @click="loadActiveTab">
                        <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
                    </Button>
                </div>

                <TabsContent value="purchases" class="max-h-[60vh] overflow-y-auto">
                    <DataTableEmpty v-if="!filteredPurchases.length && !isLoading" type="nodata" />
                    <div
                        v-for="purchase in filteredPurchases"
                        :key="purchase.purchaseId"
                        class="flex items-start gap-3 border-b py-3 last:border-b-0">
                        <img
                            v-if="purchase.listingImageId"
                            :src="getFileImageUrl(purchase.listingImageId)"
                            :alt="purchase.listingDisplayName"
                            class="size-12 flex-none cursor-pointer rounded-md object-cover"
                            loading="lazy"
                            @click="showFullscreenImageDialog(getFileImageUrl(purchase.listingImageId))" />
                        <div class="min-w-0 flex-1 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="truncate font-medium">
                                    {{ replaceBioSymbols(purchase.listingDisplayName) }}
                                </span>
                                <Badge variant="outline">{{ purchase.listingType }}</Badge>
                                <Badge v-if="purchase.isGift" variant="secondary">
                                    {{ t('dialog.purchase_history.gift') }}
                                </Badge>
                                <Badge v-if="!purchase.purchaseActive" variant="destructive">
                                    {{ t('dialog.purchase_history.inactive') }}
                                </Badge>
                            </div>
                            <div v-if="purchase.listingSubtitle" class="text-muted-foreground">
                                {{ replaceBioSymbols(purchase.listingSubtitle) }}
                            </div>
                            <div class="text-muted-foreground">
                                {{ t('dialog.purchase_history.seller') }}: {{ purchase.sellerDisplayName }} ·
                                {{ formatPrice(purchase) }}
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                                {{ formatDateFilter(purchase.purchaseDate, 'long') }}
                                <template v-if="purchase.purchaseEndDate && purchase.listingType !== 'permanent'">
                                    · {{ t('dialog.purchase_history.ends') }}
                                    {{ formatDateFilter(purchase.purchaseEndDate, 'long') }}
                                </template>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="transactions" class="max-h-[60vh] overflow-y-auto">
                    <DataTableEmpty v-if="!transactions.length && !isLoading" type="nodata" />
                    <div
                        v-for="transaction in transactions"
                        :key="transaction.transactionLineId"
                        class="flex items-start gap-3 border-b py-3 last:border-b-0">
                        <div class="min-w-0 flex-1 text-sm">
                            <div class="flex items-center gap-2">
                                <span class="truncate font-medium">
                                    {{ replaceBioSymbols(transaction.listingDisplayName) }}
                                </span>
                                <Badge v-if="transaction.listingType" variant="outline">{{
                                    transaction.listingType
                                }}</Badge>
                                <Badge v-if="transaction.reasonLabel" variant="secondary">
                                    {{ transaction.reasonLabel }}
                                </Badge>
                            </div>
                            <div
                                v-if="transaction.fromUserDisplayName || transaction.toUserDisplayName"
                                class="text-muted-foreground">
                                <template v-if="transaction.fromUserDisplayName">
                                    {{ t('dialog.purchase_history.from') }}:
                                    <span
                                        :class="{ 'cursor-pointer hover:underline': transaction.fromUserId }"
                                        @click="transaction.fromUserId && showUserDialog(transaction.fromUserId)">
                                        {{ transaction.fromUserDisplayName }}
                                    </span>
                                </template>
                                <template v-if="transaction.fromUserDisplayName && transaction.toUserDisplayName">
                                    ·
                                </template>
                                <template v-if="transaction.toUserDisplayName">
                                    {{ t('dialog.purchase_history.from') }}:
                                    <span
                                        :class="{ 'cursor-pointer hover:underline': transaction.toUserId }"
                                        @click="transaction.toUserId && showUserDialog(transaction.toUserId)">
                                        {{ transaction.toUserDisplayName }}
                                    </span>
                                </template>
                            </div>
                            <div class="mt-1 text-xs text-muted-foreground">
                                {{ formatDateFilter(transaction.date, 'long') }}
                                <template v-if="transaction.platform"> · {{ transaction.platform }}</template>
                            </div>
                        </div>
                        <div class="flex-none text-right text-sm">
                            <div class="font-medium">{{ commaNumber(transaction.amount) }}V</div>
                            <div class="text-xs text-muted-foreground">
                                {{ t('dialog.purchase_history.balance') }}: {{ commaNumber(transaction.balance) }}V
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { computed, ref, watch } from 'vue';
    import { AppDebug } from '@/services/appConfig';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { RefreshCw } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { commaNumber, formatDateFilter, replaceBioSymbols } from '../../../shared/utils';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { marketplaceRequest } from '../../../api';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const props = defineProps({
        isPurchaseHistoryDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const userStore = useUserStore();
    const { cachedPurchases, currentUser } = storeToRefs(userStore);
    const { showFullscreenImageDialog } = useGalleryStore();

    const isLoading = ref(false);
    const typeFilter = ref('all');
    const activeTab = ref('purchases');
    const transactions = ref([]);

    const purchases = computed(() =>
        Array.from(cachedPurchases.value.values())
            .filter((purchase) => purchase.buyerId === currentUser.value.id)
            .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    );

    const typeOptions = computed(() => [
        { value: 'all', label: t('dialog.purchase_history.all') },
        ...[...new Set(purchases.value.map((purchase) => purchase.listingType))].map((type) => ({
            value: type,
            label: type.charAt(0).toUpperCase() + type.slice(1)
        }))
    ]);

    const filteredPurchases = computed(() =>
        typeFilter.value === 'all'
            ? purchases.value
            : purchases.value.filter((purchase) => purchase.listingType === typeFilter.value)
    );

    watch(
        () => props.isPurchaseHistoryDialogVisible,
        (visible) => {
            if (visible) {
                loadActiveTab();
            }
        }
    );

    watch(activeTab, (tab) => {
        if (tab === 'transactions' && !transactions.value.length) {
            loadTransactions();
        }
    });

    function closeDialog() {
        emit('close');
    }

    function loadActiveTab() {
        if (activeTab.value === 'transactions') {
            loadTransactions();
        } else {
            loadPurchases();
        }
    }

    async function loadPurchases() {
        isLoading.value = true;
        try {
            await userStore.getAllProductPurchases();
        } finally {
            isLoading.value = false;
        }
    }

    async function loadTransactions() {
        isLoading.value = true;
        try {
            const { json } = await marketplaceRequest.getEconomyTransactions({ n: 100 });
            transactions.value = json.transactions ?? [];
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * @param {string} fileId
     */
    function getFileImageUrl(fileId) {
        return `${AppDebug.endpointDomain}/file/${fileId}/1/`;
    }

    /**
     * @param {object} purchase
     */
    function formatPrice(purchase) {
        if (!purchase.purchasePrice) {
            return t('dialog.purchase_history.free');
        }
        return `${commaNumber(purchase.purchasePrice)}V`;
    }
</script>
