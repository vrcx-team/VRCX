<template>
    <div class="flex flex-wrap items-start px-2.5" style="max-height: none">
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.memo') }}
                </span>
                <InputGroupTextareaField
                    v-model="memo"
                    class="text-xs"
                    :rows="2"
                    :placeholder="t('dialog.world.info.memo_placeholder')"
                    input-class="resize-none min-h-0"
                    @change="onWorldMemoChange" />
            </div>
        </div>
        <div style="width: 100%; display: flex">
            <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.world.info.id') }}
                    </span>
                    <span class="block truncate text-xs" style="display: inline">
                        {{ worldDialog.id }}
                    </span>
                    <TooltipWrapper side="top" :content="t('dialog.world.info.id_tooltip')">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button class="rounded-full text-xs" size="icon-sm" variant="ghost" @click.stop
                                    ><Copy class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="copyWorldId()">
                                    {{ t('dialog.world.info.copy_id') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="copyWorldUrl()">
                                    {{ t('dialog.world.info.copy_url') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="copyWorldName()">
                                    {{ t('dialog.world.info.copy_name') }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
        <div
            v-if="worldDialog.ref.previewYoutubeId"
            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer"
            style="width: 350px"
            @click="openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.youtube_preview') }}
                </span>
                <span class="block truncate text-xs">
                    https://www.youtube.com/watch?v={{ worldDialog.ref.previewYoutubeId }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.author_tags') }}
                </span>
                <span
                    v-if="worldDialog.ref.tags?.filter((tag) => tag.startsWith('author_tag')).length > 0"
                    class="block truncate text-xs">
                    {{ worldTags }}
                </span>
                <span v-else class="block truncate text-xs"> - </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.players') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.occupants) }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.favorites') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.favorites)
                    }}<span v-if="worldDialog.ref?.favorites > 0 && worldDialog.ref?.visits > 0" class="text-xs">
                        ({{ favoriteRate }}%)
                    </span>
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.visits') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.visits) }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.capacity') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.recommendedCapacity) }} ({{ commaNumber(worldDialog.ref.capacity) }})
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.created_at') }}
                </span>
                <span class="block truncate text-xs">
                    {{ formatDateFilter(worldDialog.ref.created_at, 'long') }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]" style="display: inline">
                    {{ t('dialog.world.info.last_updated') }}
                </span>
                <TooltipWrapper v-if="Object.keys(worldDialog.fileAnalysis).length" side="top" style="margin-left: 6px">
                    <template #content>
                        <template v-for="(created_at, platform) in worldDialogPlatformCreatedAt" :key="platform">
                            <div class="flex justify-between w-full">
                                <span class="mr-1">{{ platform }}:</span>
                                <span>{{ formatDateFilter(created_at, 'long') }}</span>
                            </div>
                        </template>
                    </template>
                    <ChevronDown class="inline-block" />
                </TooltipWrapper>
                <span class="block truncate text-xs">
                    {{ formatDateFilter(worldDialog.ref.updated_at, 'long') }}
                </span>
            </div>
        </div>
        <div
            v-if="worldDialog.ref.labsPublicationDate !== 'none'"
            class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.labs_publication_date') }}
                </span>
                <span class="block truncate text-xs">
                    {{ formatDateFilter(worldDialog.ref.labsPublicationDate, 'long') }}
                </span>
            </div>
        </div>
        <div
            v-if="worldDialog.ref.publicationDate !== 'none'"
            class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]" style="display: inline">
                    {{ t('dialog.world.info.publication_date') }}
                </span>
                <TooltipWrapper v-if="isTimeInLabVisible" side="top" style="margin-left: 6px">
                    <template #content>
                        <span>
                            {{ t('dialog.world.info.time_in_labs') }}
                            {{ timeInLab }}
                        </span>
                    </template>
                    <ChevronDown class="inline-block" />
                </TooltipWrapper>
                <span class="block truncate text-xs">
                    {{ formatDateFilter(worldDialog.ref.publicationDate, 'long') }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.version') }}
                </span>
                <span class="block truncate text-xs" v-text="worldDialog.ref.version" />
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.heat') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.heat) }} {{ '🔥'.repeat(worldDialog.ref.heat) }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.popularity') }}
                </span>
                <span class="block truncate text-xs">
                    {{ commaNumber(worldDialog.ref.popularity) }}
                    {{ '💖'.repeat(worldDialog.ref.popularity) }}
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.platform') }}
                </span>
                <span class="block truncate text-xs" style="white-space: normal">{{ worldDialogPlatform }}</span>
            </div>
        </div>

        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.last_visited') }}
                </span>
                <span class="block truncate text-xs">{{ formatDateFilter(worldDialog.lastVisit, 'long') }}</span>
            </div>
        </div>

        <div
            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
            @click="showPreviousInstancesListDialog(worldDialog.ref)">
            <div class="flex-1 overflow-hidden">
                <div
                    class="block truncate font-medium leading-[18px]"
                    style="display: flex; justify-content: space-between; align-items: center">
                    <div>
                        {{ t('dialog.world.info.visit_count') }}
                    </div>

                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                        <MoreHorizontal style="margin-right: 16px" />
                    </TooltipWrapper>
                </div>
                <span v-if="worldDialog.visitCount === 0" class="block truncate text-xs">-</span>
                <span v-else class="block truncate text-xs" v-text="worldDialog.visitCount"></span>
            </div>
        </div>

        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{ t('dialog.world.info.time_spent') }}
                </span>
                <span class="block truncate text-xs">
                    {{ worldDialog.timeSpent === 0 ? ' - ' : timeSpent }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ChevronDown, Copy, MoreHorizontal } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
    import { useAuthStore, useInstanceStore, useWorldStore } from '../../../stores';
    import { openExternalLink } from '../../../shared/utils';
    import { useWorldDialogInfo } from './useWorldDialogInfo';

    const { t } = useI18n();

    const { worldDialog } = storeToRefs(useWorldStore());
    const authStore = useAuthStore();
    const { showPreviousInstancesListDialog: openPreviousInstancesListDialog } = useInstanceStore();

    const {
        memo,
        isTimeInLabVisible,
        timeInLab,
        favoriteRate,
        worldTags,
        timeSpent,
        worldDialogPlatform,
        worldDialogPlatformCreatedAt,
        onWorldMemoChange,
        copyWorldId,
        copyWorldUrl,
        copyWorldName,
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
