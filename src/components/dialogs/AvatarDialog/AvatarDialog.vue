<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ avatarDialog.ref?.name || t('dialog.avatar.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ avatarDialog.ref?.description || avatarDialog.ref?.name || t('dialog.avatar.info.header') }}
            </DialogDescription>
        </DialogHeader>
        <div>
            <div class="flex">
                <div style="flex: none; width: 160px; height: 120px">
                    <img
                        v-if="!imageError"
                        :src="avatarDialog.ref.thumbnailImageUrl"
                        class="cursor-pointer"
                        @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)"
                        style="width: 160px; height: 120px; border-radius: var(--radius-xl); object-fit: cover"
                        @error="imageError = true"
                        loading="lazy" />
                    <div
                        v-else
                        class="flex items-center justify-center bg-muted"
                        style="width: 160px; height: 120px; border-radius: var(--radius-xl)">
                        <Image class="size-8 text-muted-foreground" />
                    </div>
                </div>
                <div class="ml-4" style="flex: 1; display: flex; align-items: flex-start">
                    <div style="flex: 1">
                        <div>
                            <span
                                class="font-bold mr-1.5"
                                style="cursor: pointer"
                                v-text="avatarDialog.ref.name"
                                @click="copyToClipboard(avatarDialog.ref.name)"></span>
                        </div>
                        <div class="mt-1.5">
                            <span
                                class="cursor-pointer x-grey font-mono"
                                @click="showUserDialog(avatarDialog.ref.authorId)"
                                v-text="avatarDialog.ref.authorName"></span>
                        </div>
                        <div>
                            <Badge
                                class="mr-1.5 mt-1.5"
                                v-if="avatarDialog.ref.releaseStatus === 'public'"
                                variant="outline">
                                {{ t('dialog.avatar.tags.public') }}
                            </Badge>
                            <Badge class="mr-1.5 mt-1.5" v-else variant="outline">
                                {{ t('dialog.avatar.tags.private') }}
                            </Badge>
                            <TooltipWrapper v-if="avatarDialog.isPC" side="top" content="PC">
                                <Badge class="text-platform-pc border-platform-pc! mr-1.5 mt-1.5" variant="outline"
                                    ><Monitor class="h-4 w-4 text-platform-pc" />
                                    <span
                                        v-if="avatarDialog.platformInfo.pc"
                                        class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.platformInfo.pc.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.fileAnalysis.standalonewindows?._fileSize"
                                        class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.fileAnalysis.standalonewindows._fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <TooltipWrapper v-if="avatarDialog.isQuest" side="top" content="Android">
                                <Badge
                                    class="text-platform-quest border-platform-quest! mr-1.5 mt-1.5"
                                    variant="outline"
                                    ><Smartphone class="h-4 w-4 text-platform-quest" />
                                    <span
                                        v-if="avatarDialog.platformInfo.android"
                                        class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.platformInfo.android.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.fileAnalysis.android?._fileSize"
                                        class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.fileAnalysis.android._fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <TooltipWrapper v-if="avatarDialog.isIos" side="top" content="iOS">
                                <Badge class="text-platform-ios border-platform-ios mr-1.5 mt-1.5" variant="outline"
                                    ><Apple class="h-4 w-4 text-platform-ios" />
                                    <span
                                        v-if="avatarDialog.platformInfo.ios"
                                        class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.platformInfo.ios.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.fileAnalysis.ios?._fileSize"
                                        class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                        >{{ avatarDialog.fileAnalysis.ios._fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <Badge
                                v-if="avatarDialog.inCache"
                                variant="outline"
                                class="cursor-pointer mr-1.5 mt-1.5"
                                @click="openFolderGeneric(avatarDialog.cachePath)">
                                <span v-text="avatarDialog.cacheSize"></span>
                                &nbsp;{{ t('dialog.avatar.tags.cache') }}
                            </Badge>
                            <Badge
                                class="mr-1.5 mt-1.5"
                                v-if="avatarDialog.ref.styles?.primary || avatarDialog.ref.styles?.secondary"
                                variant="outline"
                                >{{ t('view.favorite.avatars.styles') }}
                                <span
                                    v-if="avatarDialog.ref.styles.primary"
                                    class="x-grey border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                    >{{ avatarDialog.ref.styles.primary }}</span
                                >
                                <span
                                    v-if="avatarDialog.ref.styles.secondary"
                                    class="x-grey border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                    >{{ avatarDialog.ref.styles.secondary }}</span
                                >
                            </Badge>
                            <Badge class="mr-1.5 mt-1.5" v-if="avatarDialog.isQuestFallback" variant="outline">
                                {{ t('dialog.avatar.tags.fallback') }}
                            </Badge>
                            <Badge class="mr-1.5 mt-1.5" v-if="avatarDialog.hasImposter" variant="outline"
                                >{{ t('dialog.avatar.tags.impostor') }}
                                <span
                                    v-if="avatarDialog.imposterVersion"
                                    class="x-grey border-l-[0.8px] border-solid ml-1.5 pl-1.5 pb-px"
                                    >v{{ avatarDialog.imposterVersion }}</span
                                >
                            </Badge>
                            <Badge class="mr-1.5 mt-1.5" v-if="avatarDialog.ref.unityPackageUrl" variant="outline">
                                {{ t('dialog.avatar.tags.future_proofing') }}
                            </Badge>
                            <div>
                                <template v-for="tag in avatarDialog.ref.tags" :key="tag">
                                    <Badge class="mr-1.5 mt-1.5" v-if="tag.startsWith('content_')" variant="outline">
                                        <span v-if="tag === 'content_horror'">{{
                                            t('dialog.avatar.tags.content_horror')
                                        }}</span>
                                        <span v-else-if="tag === 'content_gore'">{{
                                            t('dialog.avatar.tags.content_gore')
                                        }}</span>
                                        <span v-else-if="tag === 'content_violence'">{{
                                            t('dialog.avatar.tags.content_violence')
                                        }}</span>
                                        <span v-else-if="tag === 'content_adult'">{{
                                            t('dialog.avatar.tags.content_adult')
                                        }}</span>
                                        <span v-else-if="tag === 'content_sex'">{{
                                            t('dialog.avatar.tags.content_sex')
                                        }}</span>
                                        <span v-else>{{ tag.replace('content_', '') }}</span>
                                    </Badge>
                                    <Badge class="mr-1.5 mt-1.5" v-if="tag.startsWith('author_tag_')" variant="outline">
                                        <span>
                                            {{ tag.replace('author_tag_', '') }}
                                        </span>
                                    </Badge>
                                </template>
                            </div>
                        </div>
                        <div style="margin-top: 6px">
                            <span
                                v-show="avatarDialog.ref.name !== avatarDialog.ref.description"
                                class="text-xs"
                                v-text="avatarDialog.ref.description"></span>
                        </div>
                    </div>
                    <div class="ml-2 mt-12">
                        <TooltipWrapper
                            v-if="avatarDialog.inCache"
                            side="top"
                            :content="t('dialog.avatar.actions.delete_cache_tooltip')">
                            <Button
                                class="rounded-full mr-2"
                                size="icon-lg"
                                variant="outline"
                                :disabled="isGameRunning && avatarDialog.cacheLocked"
                                @click="deleteVRChatCache(avatarDialog.ref)"
                                ><Trash2
                            /></Button>
                        </TooltipWrapper>

                        <TooltipWrapper
                            v-if="avatarDialog.isFavorite"
                            side="top"
                            :content="t('dialog.avatar.actions.favorite_tooltip')">
                            <Button class="rounded-full" size="icon-lg" @click="avatarDialogCommand('Add Favorite')"
                                ><Star
                            /></Button>
                        </TooltipWrapper>
                        <TooltipWrapper v-else side="top" :content="t('dialog.avatar.actions.favorite_tooltip')">
                            <Button
                                class="rounded-full"
                                size="icon-lg"
                                variant="outline"
                                @click="avatarDialogCommand('Add Favorite')"
                                ><Star
                            /></Button>
                        </TooltipWrapper>

                        <TooltipWrapper side="top" :content="t('dialog.avatar.actions.select')">
                            <Button
                                class="rounded-full ml-2"
                                size="icon-lg"
                                variant="outline"
                                :disabled="currentUser.currentAvatar === avatarDialog.id"
                                @click="selectAvatarWithoutConfirmation(avatarDialog.id)">
                                <CheckCircle
                            /></Button>
                        </TooltipWrapper>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button
                                    class="rounded-full ml-2"
                                    :variant="avatarDialog.isBlocked ? 'destructive' : 'outline'"
                                    size="icon-lg">
                                    <Ellipsis />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="avatarDialogCommand('Refresh')">
                                    <RefreshCw class="size-4" />
                                    {{ t('dialog.avatar.actions.refresh') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="avatarDialogCommand('Share')">
                                    <Share2 class="size-4" />
                                    {{ t('dialog.avatar.actions.share') }}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    v-if="avatarDialog.isBlocked"
                                    variant="destructive"
                                    @click="avatarDialogCommand('Unblock Avatar')">
                                    <CheckCircle class="size-4" />
                                    {{ t('dialog.avatar.actions.unblock') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem v-else @click="avatarDialogCommand('Block Avatar')">
                                    <XCircle class="size-4" />
                                    {{ t('dialog.avatar.actions.block') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    v-if="/quest/.test(avatarDialog.ref.tags)"
                                    @click="avatarDialogCommand('Select Fallback Avatar')">
                                    <Check class="size-4" />
                                    {{ t('dialog.avatar.actions.select_fallback') }}
                                </DropdownMenuItem>
                                <template v-if="avatarDialog.ref.authorId === currentUser.id">
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        v-if="avatarDialog.ref.releaseStatus === 'public'"
                                        @click="avatarDialogCommand('Make Private')">
                                        <User class="size-4" />
                                        {{ t('dialog.avatar.actions.make_private') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-else @click="avatarDialogCommand('Make Public')">
                                        <User class="size-4" />
                                        {{ t('dialog.avatar.actions.make_public') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="avatarDialogCommand('Rename')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.avatar.actions.rename') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="avatarDialogCommand('Change Description')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.avatar.actions.change_description') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="avatarDialogCommand('Change Content Tags')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.avatar.actions.change_content_tags') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="avatarDialogCommand('Change Styles and Author Tags')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.avatar.actions.change_styles_author_tags') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="avatarDialogCommand('Change Image')">
                                        <Image class="size-4" />
                                        {{ t('dialog.avatar.actions.change_image') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        v-if="avatarDialog.ref.unityPackageUrl"
                                        @click="avatarDialogCommand('Download Unity Package')">
                                        <Download class="size-4" />
                                        {{ t('dialog.avatar.actions.download_package') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        v-if="avatarDialog.hasImposter"
                                        variant="destructive"
                                        @click="avatarDialogCommand('Regenerate Imposter')">
                                        <RefreshCw class="size-4" />
                                        {{ t('dialog.avatar.actions.regenerate_impostor') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        v-if="avatarDialog.hasImposter"
                                        variant="destructive"
                                        @click="avatarDialogCommand('Delete Imposter')">
                                        <Trash2 class="size-4" />
                                        {{ t('dialog.avatar.actions.delete_impostor') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-else @click="avatarDialogCommand('Create Imposter')">
                                        <User class="size-4" />
                                        {{ t('dialog.avatar.actions.create_impostor') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" @click="avatarDialogCommand('Delete')">
                                        <Trash2 class="size-4" />
                                        {{ t('dialog.avatar.actions.delete') }}
                                    </DropdownMenuItem>
                                </template>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <TabsUnderline
                v-model="avatarDialog.activeTab"
                :items="avatarDialogTabs"
                :unmount-on-hide="false"
                @update:modelValue="avatarDialogTabClick">
                <template #Info>
                    <div class="flex flex-wrap items-start px-2.5" style="max-height: unset">
                        <div
                            v-if="avatarDialog.galleryImages.length || avatarDialog.ref.authorId === currentUser.id"
                            style="width: 100%">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.avatar.info.gallery')
                            }}</span>
                            <input
                                id="AvatarGalleryUploadButton"
                                type="file"
                                accept="image/*"
                                style="display: none"
                                @change="onFileChangeAvatarGallery" />
                            <Button
                                v-if="avatarDialog.ref.authorId === currentUser.id"
                                variant="outline"
                                size="sm"
                                :disabled="avatarDialog.galleryLoading"
                                class="ml-1"
                                @click="displayAvatarGalleryUpload">
                                <Upload />
                                {{ t('dialog.screenshot_metadata.upload') }}
                            </Button>
                            <div class="mt-2 w-[80%] ml-20">
                                <Carousel v-if="avatarDialog.galleryImages.length" class="w-full">
                                    <CarouselContent class="h-50">
                                        <CarouselItem v-for="imageUrl in avatarDialog.galleryImages" :key="imageUrl">
                                            <div class="relative h-50 w-full">
                                                <img
                                                    :src="imageUrl"
                                                    style="width: 100%; height: 100%; object-fit: contain"
                                                    @click="showFullscreenImageDialog(imageUrl)"
                                                    @error="
                                                        $event.target.style.display = 'none';
                                                        $event.target.nextElementSibling.style.display = 'flex';
                                                    "
                                                    loading="lazy" />
                                                <div
                                                    class="absolute inset-0 items-center justify-center bg-muted"
                                                    style="display: none">
                                                    <Image class="size-8 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>
                        </div>
                        <div v-if="avatarDialog.ref.publishedListings?.length">
                            <span class="block truncate font-medium leading-[18px]">{{
                                t('dialog.avatar.info.listings')
                            }}</span>
                            <div
                                v-for="listing in avatarDialog.ref.publishedListings"
                                :key="listing.id"
                                class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                                <div class="relative inline-block flex-none size-9 mr-2.5">
                                    <img
                                        class="size-full rounded-full object-cover"
                                        :src="getImageUrlFromImageId(listing.imageId)"
                                        @click="showFullscreenImageDialog(getImageUrlFromImageId(listing.imageId))"
                                        loading="lazy" />
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <span class="block truncate font-medium leading-[18px]">{{
                                        listing.displayName
                                    }}</span>
                                    <span
                                        class="block truncate text-xs"
                                        style="text-decoration: underline; font-style: italic"
                                        >${{ commaNumber(listing.priceTokens) }}V</span
                                    >
                                    <span
                                        class="block truncate text-xs"
                                        style="text-overflow: ellipsis; text-wrap: auto"
                                        v-text="listing.description"></span>
                                </div>
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]" style="margin-bottom: 6px">{{
                                    t('dialog.avatar.info.memo')
                                }}</span>
                                <InputGroupTextareaField
                                    v-model="memo"
                                    class="text-xs"
                                    :rows="2"
                                    :placeholder="t('dialog.avatar.info.memo_placeholder')"
                                    input-class="resize-none min-h-0"
                                    @change="onAvatarMemoChange" />
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.avatar.info.id')
                                }}</span>
                                <span class="block truncate text-xs"
                                    >{{ avatarDialog.id
                                    }}<TooltipWrapper side="top" :content="t('dialog.avatar.info.id_tooltip')">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button
                                                    class="rounded-full text-xs"
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    @click.stop
                                                    ><Copy class="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem @click="copyAvatarId(avatarDialog.id)">
                                                    {{ t('dialog.avatar.info.copy_id') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="copyAvatarUrl(avatarDialog.id)">
                                                    {{ t('dialog.avatar.info.copy_url') }}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TooltipWrapper></span
                                >
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.avatar.info.created_at')
                                }}</span>
                                <span class="block truncate text-xs">{{
                                    formatDateFilter(avatarDialog.ref.created_at, 'long')
                                }}</span>
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block font-medium leading-[18px]" style="display: inline">{{
                                    t('dialog.avatar.info.last_updated')
                                }}</span>
                                <TooltipWrapper
                                    v-if="Object.keys(avatarDialog.fileAnalysis).length"
                                    side="top"
                                    style="margin-left: 6px">
                                    <template #content>
                                        <template
                                            v-for="(created_at, platform) in avatarDialogPlatformCreatedAt"
                                            :key="platform">
                                            <div class="flex justify-between w-full">
                                                <span class="mr-1">{{ platform }}:</span>
                                                <span>{{ formatDateFilter(created_at, 'long') }}</span>
                                            </div>
                                        </template>
                                    </template>
                                    <ChevronDown class="inline-block" />
                                </TooltipWrapper>
                                <span class="block truncate text-xs">{{
                                    formatDateFilter(avatarDialog.ref.updated_at, 'long')
                                }}</span>
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.avatar.info.version')
                                }}</span>
                                <span
                                    v-if="avatarDialog.ref.version !== 0"
                                    class="block truncate text-xs"
                                    v-text="avatarDialog.ref.version"></span>
                                <span v-else class="block truncate text-xs">-</span>
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.avatar.info.time_spent')
                                }}</span>

                                <span v-if="avatarDialog.timeSpent === 0" class="block truncate text-xs">-</span>
                                <span v-else class="block truncate text-xs">{{
                                    timeToText(avatarDialog.timeSpent)
                                }}</span>
                            </div>
                        </div>
                        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">{{
                                    t('dialog.avatar.info.platform')
                                }}</span>
                                <span
                                    v-if="avatarDialogPlatform"
                                    class="block truncate text-xs"
                                    v-text="avatarDialogPlatform"></span>
                                <span v-else class="block truncate text-xs">-</span>
                            </div>
                        </div>
                    </div>
                </template>
                <template #JSON>
                    <DialogJsonTab
                        :tree-data="treeData"
                        :tree-data-key="treeData?.id"
                        :dialog-id="avatarDialog.id"
                        :dialog-ref="avatarDialog.ref"
                        :file-analysis="avatarDialog.fileAnalysis"
                        @refresh="refreshAvatarDialogTreeData()" />
                </template>
            </TabsUnderline>
            <template v-if="avatarDialog.visible">
                <SetAvatarTagsDialog v-model:setAvatarTagsDialog="setAvatarTagsDialog" />
                <SetAvatarStylesDialog v-model:setAvatarStylesDialog="setAvatarStylesDialog" />
                <input
                    id="AvatarImageUploadButton"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="onFileChangeAvatarImage" />
                <ImageCropDialog
                    :open="cropDialogOpen"
                    :title="t('dialog.change_content_image.avatar')"
                    :aspect-ratio="4 / 3"
                    :file="cropDialogFile"
                    @update:open="cropDialogOpen = $event"
                    @confirm="onCropConfirmAvatar" />
            </template>
        </div>
    </div>
</template>

<script setup>
    import {
        Apple,
        Check,
        CheckCircle,
        ChevronDown,
        Copy,
        Download,
        Ellipsis,
        Image,
        Monitor,
        Pencil,
        RefreshCw,
        Share2,
        Smartphone,
        Star,
        Trash2,
        Upload,
        User,
        XCircle
    } from 'lucide-vue-next';
    import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
    import { computed, nextTick, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';


    import {
        useAuthStore,
        useAvatarStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useModalStore,
        useUiStore,
        useUserStore
    } from '../../../stores';
    import {
        commaNumber,
        compareUnityVersion,
        copyToClipboard,
        formatDateFilter,
        openFolderGeneric,
        timeToText
    } from '../../../shared/utils';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { Badge } from '../../ui/badge';
    import { avatarRequest } from '../../../api';
    import { database } from '../../../services/database';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { handleImageUploadInput } from '../../../coordinators/imageUploadCoordinator';
    import { runDeleteVRChatCacheFlow as deleteVRChatCache } from '../../../coordinators/gameCoordinator';
    import {
        showAvatarDialog,
        applyAvatar,
        selectAvatarWithoutConfirmation
    } from '../../../coordinators/avatarCoordinator';
    import { useAvatarDialogCommands } from './useAvatarDialogCommands';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import ImageCropDialog from '../ImageCropDialog.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    import SetAvatarStylesDialog from './SetAvatarStylesDialog.vue';
    import SetAvatarTagsDialog from './SetAvatarTagsDialog.vue';

    const { sortUserDialogAvatars } = useUserStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const avatarStore = useAvatarStore();
    const { cachedAvatarModerations, cachedAvatars } = avatarStore;
    const { avatarDialog } = storeToRefs(avatarStore);
    const { getAvatarGallery, applyAvatarModeration } = avatarStore;
    const { showFavoriteDialog } = useFavoriteStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const authStore = useAuthStore();
    const modalStore = useModalStore();
    const uiStore = useUiStore();

    const { t } = useI18n();

    const {
        cropDialogOpen,
        cropDialogFile,
        avatarDialogCommand,
        onFileChangeAvatarImage,
        onCropConfirmAvatar,
        registerCallbacks
    } = useAvatarDialogCommands(avatarDialog, {
        t,
        toast,
        modalStore,
        userDialog,
        currentUser,
        cachedAvatars,
        cachedAvatarModerations,
        showAvatarDialog,
        showFavoriteDialog,
        applyAvatarModeration,
        applyAvatar,
        sortUserDialogAvatars,
        uiStore
    });

    const avatarDialogTabs = computed(() => [
        { value: 'Info', label: t('dialog.avatar.info.header') },
        { value: 'JSON', label: t('dialog.avatar.json.header') }
    ]);

    const treeData = ref({});
    const memo = ref('');
    const imageError = ref(false);

    watch(
        () => avatarDialog.value.id,
        () => {
            imageError.value = false;
        }
    );
    const setAvatarTagsDialog = ref({
        visible: false,
        loading: false,
        ownAvatars: [],
        selectedAvatarIds: [],
        selectedTags: [],
        selectedTagsCsv: '',
        contentHorror: false,
        contentGore: false,
        contentViolence: false,
        contentAdult: false,
        contentSex: false
    });
    const setAvatarStylesDialog = ref({
        visible: false,
        loading: false,
        avatarId: '',
        initialPrimaryStyle: '',
        initialSecondaryStyle: '',
        primaryStyle: '',
        secondaryStyle: '',
        availableAvatarStyles: [],
        availableAvatarStylesMap: new Map(),
        initialTags: [],
        authorTags: ''
    });

    const avatarDialogPlatform = computed(() => {
        const { ref } = avatarDialog.value;
        const platforms = [];
        if (ref.unityPackages) {
            for (const unityPackage of ref.unityPackages) {
                if (unityPackage.variant && unityPackage.variant !== 'standard' && unityPackage.variant !== 'security') {
                    // skip imposters
                    continue;
                }
                if (!compareUnityVersion(unityPackage.unitySortNumber, authStore.cachedConfig.sdkUnityVersion)) {
                    continue;
                }
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    platform = unityPackage.platform;
                }
                platforms.push(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    });

    const avatarDialogPlatformCreatedAt = computed(() => {
        const { ref } = avatarDialog.value;
        if (!ref.unityPackages) {
            return null;
        }
        let newest = {};
        for (const unityPackage of ref.unityPackages) {
            if (unityPackage.variant && unityPackage.variant !== 'standard' && unityPackage.variant !== 'security') {
                continue;
            }
            const platform = unityPackage.platform;
            const createdAt = unityPackage.created_at;
            if (!newest[platform] || new Date(createdAt) > new Date(newest[platform])) {
                newest[platform] = createdAt;
            }
        }
        return newest;
    });

    watch(
        () => avatarDialog.value.loading,
        () => {
            if (avatarDialog.value.visible) {
                handleDialogOpen();
                !avatarDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    /**
     *
     * @param tabName
     */
    function handleAvatarDialogTab(tabName) {
        avatarDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshAvatarDialogTreeData();
        }
    }

    /**
     *
     */
    function loadLastActiveTab() {
        handleAvatarDialogTab(avatarDialog.value.lastActiveTab);
    }

    /**
     *
     * @param tabName
     */
    function avatarDialogTabClick(tabName) {
        if (tabName === avatarDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshAvatarDialogTreeData();
            }
            return;
        }
        handleAvatarDialogTab(tabName);
    }

    /**
     *
     * @param imageId
     */
    function getImageUrlFromImageId(imageId) {
        return `${AppDebug.endpointDomain}/file/${imageId}/1/`;
    }

    /**
     *
     */
    function handleDialogOpen() {
        setAvatarTagsDialog.value.visible = false;
        avatarDialog.value.timeSpent = 0;
        memo.value = '';
        treeData.value = {};
        getAvatarTimeSpent();
        getAvatarMemo();
    }

    /**
     *
     */
    function getAvatarTimeSpent() {
        const D = avatarDialog.value;
        avatarDialog.value.timeSpent = 0;
        database.getAvatarTimeSpent(D.id).then((aviTime) => {
            if (D.id === aviTime.avatarId) {
                avatarDialog.value.timeSpent = aviTime.timeSpent;
                if (D.id === currentUser.value.currentAvatar && currentUser.value.$previousAvatarSwapTime) {
                    avatarDialog.value.timeSpent += Date.now() - currentUser.value.$previousAvatarSwapTime;
                }
            }
        });
    }

    /**
     *
     */
    function getAvatarMemo() {
        const D = avatarDialog.value;
        database.getAvatarMemoDB(D.id).then((res) => {
            if (D.id === res.avatarId) {
                memo.value = res.memo;
            }
        });
    }

    /**
     *
     * @param command
     */
    // Register component callbacks for the command composable
    registerCallbacks({
        showSetAvatarTagsDialog: () => showSetAvatarTagsDialog(avatarDialog.value.id),
        showSetAvatarStylesDialog
    });

    /**
     *
     */
    function onAvatarMemoChange() {
        if (memo.value) {
            database.setAvatarMemo({
                avatarId: avatarDialog.value.id,
                editedAt: new Date().toJSON(),
                memo: memo.value
            });
        } else {
            database.deleteAvatarMemo(avatarDialog.value.id);
        }
    }

    /**
     *
     * @param id
     */
    function copyAvatarId(id) {
        copyToClipboard(id);
    }

    /**
     *
     */
    function refreshAvatarDialogTreeData() {
        treeData.value = formatJsonVars(avatarDialog.value.ref);
    }

    /**
     *
     * @param avatarId
     */
    function showSetAvatarTagsDialog(avatarId) {
        const D = setAvatarTagsDialog.value;
        D.selectedAvatarIds = [avatarId];
        D.visible = true;
        D.loading = true;
        D.ownAvatars = [];
        D.selectedTags = [];
        D.selectedTagsCsv = '';
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const oldTags = avatarDialog.value.ref.tags;
        oldTags.forEach((tag) => {
            switch (tag) {
                case 'content_horror':
                    D.contentHorror = true;
                    break;
                case 'content_gore':
                    D.contentGore = true;
                    break;
                case 'content_violence':
                    D.contentViolence = true;
                    break;
                case 'content_adult':
                    D.contentAdult = true;
                    break;
                case 'content_sex':
                    D.contentSex = true;
                    break;
                default:
                    if (tag.startsWith('content_')) {
                        D.selectedTags.push(tag.substring(8));
                    }
                    break;
            }
        });
        for (const ref of cachedAvatars.values()) {
            if (ref.authorId === currentUser.value.id) {
                D.ownAvatars.push(ref);
            }
        }
        nextTick(() => {
            D.loading = false;
        });
    }

    /**
     *
     */
    function showSetAvatarStylesDialog() {
        const D = setAvatarStylesDialog.value;
        D.visible = true;
        D.loading = true;
        D.avatarId = avatarDialog.value.id;
        D.primaryStyle = avatarDialog.value.ref.styles?.primary || '';
        D.secondaryStyle = avatarDialog.value.ref.styles?.secondary || '';
        D.initialPrimaryStyle = D.primaryStyle;
        D.initialSecondaryStyle = D.secondaryStyle;
        D.initialTags = avatarDialog.value.ref.tags;
        D.authorTags = '';
        for (const tag of D.initialTags) {
            if (tag.startsWith('author_tag_')) {
                if (D.authorTags) {
                    D.authorTags += ',';
                }
                D.authorTags += tag.substring(11);
            }
        }
        nextTick(() => {
            D.loading = false;
        });
    }

    /**
     *
     */
    function displayAvatarGalleryUpload() {
        document.getElementById('AvatarGalleryUploadButton').click();
    }

    /**
     *
     * @param e
     */
    function onFileChangeAvatarGallery(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#AvatarGalleryUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        const r = new FileReader();
        const resetLoading = () => {
            avatarDialog.value.galleryLoading = false;
            clearInput();
        };
        r.onerror = resetLoading;
        r.onabort = resetLoading;
        r.onload = function () {
            try {
                avatarDialog.value.galleryLoading = true;
                const base64Body = btoa(r.result.toString());
                const uploadPromise = (async () => {
                    const args = await avatarRequest.uploadAvatarGalleryImage(base64Body, avatarDialog.value.id);
                    avatarDialog.value.galleryImages = await getAvatarGallery(avatarDialog.value.id);
                    return args;
                })();
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload image', error);
                    })
                    .finally(resetLoading);
            } catch (error) {
                console.error('Failed to process image', error);
                resetLoading();
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            console.error('Failed to read file', error);
            resetLoading();
        }
    }
</script>
