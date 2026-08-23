<template>
    <div class="flex flex-col gap-2.5 mt-2.5">
        <div class="rounded-xl bg-(--profile-card) p-3">
            <div
                class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                {{ t('dialog.world.info.header') }}
            </div>
            <div class="flex flex-col gap-1.5">
                <div
                    v-if="worldDialog.ref.previewYoutubeId"
                    class="flex items-start justify-between gap-2 text-xs cursor-pointer"
                    @click="openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)">
                    <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.youtube_preview') }}</span>
                    <span class="truncate text-right text-muted-foreground">
                        {{ worldDialog.ref.previewYoutubeId }}
                    </span>
                </div>
                <TooltipWrapper
                    side="top"
                    :content="formatDateFilter(worldDialog.ref.created_at, 'long')"
                    :disabled="!worldDialog.ref.created_at">
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.created') }}</span>
                        <span class="truncate text-right text-muted-foreground">
                            {{ timeAgo(worldDialog.ref.created_at) }}
                        </span>
                    </div>
                </TooltipWrapper>
                <div class="flex items-start justify-between gap-2 text-xs">
                    <span class="inline-flex items-center text-muted-foreground shrink-0">
                        {{ t('dialog.world.info.last_updated') }}
                        <TooltipWrapper v-if="Object.keys(worldDialog.fileAnalysis).length" side="top">
                            <template #content>
                                <template
                                    v-for="(created_at, platform) in worldDialogPlatformCreatedAt"
                                    :key="platform">
                                    <div class="flex justify-between w-full">
                                        <span class="mr-1">{{ platform }}:</span>
                                        <span>{{ formatDateFilter(created_at, 'long') }}</span>
                                    </div>
                                </template>
                            </template>
                            <ChevronDown class="size-3" />
                        </TooltipWrapper>
                    </span>
                    <TooltipWrapper
                        side="top"
                        :content="formatDateFilter(worldDialog.ref.updated_at, 'long')"
                        :disabled="!worldDialog.ref.updated_at">
                        <span class="truncate text-right text-muted-foreground">
                            {{ timeAgo(worldDialog.ref.updated_at) }}
                        </span>
                    </TooltipWrapper>
                </div>
                <div class="flex items-start justify-between gap-2 text-xs">
                    <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.capacity') }}</span>
                    <span class="text-right text-muted-foreground">
                        {{ commaNumber(worldDialog.ref.recommendedCapacity) }}
                        ({{ commaNumber(worldDialog.ref.capacity) }})
                    </span>
                </div>
                <TooltipWrapper side="top" :content="worldTags" :disabled="!worldTags">
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.author_tags') }}</span>

                        <span class="max-w-30 truncate text-right text-muted-foreground">
                            {{ worldTags || '—' }}
                        </span>
                    </div>
                </TooltipWrapper>
                <template v-if="showMoreInfo">
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.visits') }}</span>
                        <span class="text-right text-muted-foreground">{{ commaNumber(worldDialog.ref.visits) }}</span>
                    </div>
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.favorites') }}</span>
                        <span class="text-right text-muted-foreground">
                            {{ commaNumber(worldDialog.ref.favorites) }}
                            <template v-if="worldDialog.ref?.favorites > 0 && worldDialog.ref?.visits > 0">
                                ({{ favoriteRate }}%)
                            </template>
                        </span>
                    </div>
                    <TooltipWrapper
                        v-if="worldDialog.ref.labsPublicationDate !== 'none'"
                        side="top"
                        :content="formatDateFilter(worldDialog.ref.labsPublicationDate, 'long')">
                        <div class="flex items-start justify-between gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">
                                {{ t('dialog.world.info.labs_publication_date') }}
                            </span>
                            <span class="truncate text-right text-muted-foreground">
                                {{ timeAgo(worldDialog.ref.labsPublicationDate) }}
                            </span>
                        </div>
                    </TooltipWrapper>
                    <div
                        v-if="worldDialog.ref.publicationDate !== 'none'"
                        class="flex items-start justify-between gap-2 text-xs">
                        <span class="inline-flex items-center text-muted-foreground shrink-0">
                            {{ t('dialog.world.info.publication_date') }}
                            <TooltipWrapper v-if="isTimeInLabVisible" side="top">
                                <template #content>
                                    {{ t('dialog.world.info.time_in_labs') }} {{ timeInLab }}
                                </template>
                                <ChevronDown class="size-3" />
                            </TooltipWrapper>
                        </span>
                        <TooltipWrapper side="top" :content="formatDateFilter(worldDialog.ref.publicationDate, 'long')">
                            <span class="truncate text-right text-muted-foreground">
                                {{ timeAgo(worldDialog.ref.publicationDate) }}
                            </span>
                        </TooltipWrapper>
                    </div>
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.heat') }}</span>
                        <span class="truncate text-right text-muted-foreground">
                            {{ commaNumber(worldDialog.ref.heat) }}
                        </span>
                    </div>
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.popularity') }}</span>
                        <span class="truncate text-right text-muted-foreground">
                            {{ commaNumber(worldDialog.ref.popularity) }}
                        </span>
                    </div>
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.version') }}</span>
                        <span class="text-right text-muted-foreground" v-text="worldDialog.ref.version" />
                    </div>
                    <TooltipWrapper side="top" :content="worldDialogPlatform" :disabled="!worldDialogPlatform">
                        <div class="flex items-start justify-between gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.platform') }}</span>
                            <span class="block max-w-25 truncate whitespace-nowrap text-right text-muted-foreground">
                                {{ worldDialogPlatform }}
                            </span>
                        </div>
                    </TooltipWrapper>
                </template>
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 w-full text-xs text-muted-foreground"
                    :aria-expanded="showMoreInfo"
                    @click="showMoreInfo = !showMoreInfo">
                    {{ t('dialog.world.info.more_info') }}
                    <ChevronDown class="size-3 transition-transform" :class="{ 'rotate-180': showMoreInfo }" />
                </Button>
            </div>
        </div>

        <div class="rounded-xl bg-(--profile-card) p-3">
            <div
                class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                {{ t('dialog.user.info.vrcx_info') }}
            </div>
            <div class="flex flex-col gap-1.5">
                <TooltipWrapper
                    side="top"
                    :content="formatDateFilter(worldDialog.lastVisit, 'long')"
                    :disabled="!worldDialog.lastVisit">
                    <div class="flex items-start justify-between gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.last_visited') }}</span>
                        <span class="truncate text-right text-muted-foreground">
                            {{ timeAgo(worldDialog.lastVisit) }}
                        </span>
                    </div>
                </TooltipWrapper>
                <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                    <div
                        class="flex items-start justify-between gap-2 text-xs cursor-pointer"
                        @click="showPreviousInstancesListDialog(worldDialog.ref)">
                        <span class="inline-flex items-center gap-1 text-muted-foreground shrink-0">
                            {{ t('dialog.world.info.visit_count') }}
                        </span>
                        <span class="text-right text-muted-foreground">
                            {{ worldDialog.visitCount === 0 ? '—' : worldDialog.visitCount }}
                        </span>
                    </div>
                </TooltipWrapper>
                <div class="flex items-start justify-between gap-2 text-xs">
                    <span class="text-muted-foreground shrink-0">{{ t('dialog.world.info.time_spent') }}</span>
                    <span class="text-right text-muted-foreground">
                        {{ worldDialog.timeSpent === 0 ? '—' : timeToText(worldDialog.timeSpent) }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ChevronDown } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useInstanceStore, useWorldStore } from '../../../stores';
    import { openExternalLink, timeAgo, timeToText } from '../../../shared/utils';
    import { useWorldDialogInfo } from './useWorldDialogInfo';

    const { t } = useI18n();
    const showMoreInfo = ref(false);

    const { worldDialog } = storeToRefs(useWorldStore());
    const authStore = useAuthStore();
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();

    const {
        isTimeInLabVisible,
        timeInLab,
        favoriteRate,
        worldTags,
        worldDialogPlatform,
        worldDialogPlatformCreatedAt,
        commaNumber,
        formatDateFilter
    } = useWorldDialogInfo(worldDialog, { t, toast, sdkUnityVersion: authStore.cachedConfig.sdkUnityVersion });

    /**
     *
     * @param worldRef
     */
    function showPreviousInstancesListDialog(worldRef) {
        openPreviousInstancesListDialog('world', worldRef);
    }
</script>
