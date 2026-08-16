<template>
    <div class="flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ avatarDialog.ref?.name || t('dialog.avatar.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ avatarDialog.ref?.description || avatarDialog.ref?.name || t('dialog.avatar.info.header') }}
            </DialogDescription>
        </DialogHeader>
        <div class="contents">
            <div class="flex-none w-77 pr-4 overflow-y-auto">
                <div class="rounded-xl bg-(--profile-card) overflow-hidden flex flex-col">
                    <div class="relative aspect-4/3">
                        <img
                            v-if="!imageError"
                            :src="avatarDialog.ref.thumbnailImageUrl"
                            class="absolute inset-0 size-full cursor-pointer object-cover"
                            @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)"
                            @error="imageError = true"
                            loading="lazy" />
                        <div v-else class="absolute inset-0 flex items-center justify-center bg-muted">
                            <Image class="size-8 text-muted-foreground" />
                        </div>
                    </div>
                    <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 p-3">
                        <div class="contents">
                            <div class="col-start-1 row-start-1 overflow-hidden">
                                <span
                                    class="flex flex-wrap font-bold cursor-pointer"
                                    v-text="avatarDialog.ref.name"
                                    :title="avatarDialog.ref.name"
                                    @click="copyToClipboard(avatarDialog.ref.name)"></span>
                            </div>
                            <div class="col-start-1 row-start-2 flex flex-col gap-1">
                                <div>
                                    <span
                                        class="flex flex-wrap cursor-pointer x-grey font-mono text-xs max-w-30"
                                        @click="showUserDialog(avatarDialog.ref.authorId)"
                                        v-text="avatarDialog.ref.authorName" />
                                </div>
                            </div>
                            <div class="col-span-2 flex flex-wrap items-center">
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
                                            class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5"
                                            >{{
                                                t(
                                                    `dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.pc.performanceRating.replace(' ', '')}`
                                                )
                                            }}</span
                                        >
                                        <span
                                            v-if="avatarDialog.fileAnalysis.standalonewindows?._fileSize"
                                            class="x-grey text-platform-pc border-l-[0.8px] border-solid ml-1.5 pl-1.5"
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
                                            class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5"
                                            >{{
                                                t(
                                                    `dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.android.performanceRating.replace(' ', '')}`
                                                )
                                            }}</span
                                        >
                                        <span
                                            v-if="avatarDialog.fileAnalysis.android?._fileSize"
                                            class="x-grey text-platform-quest border-l-[0.8px] border-solid ml-1.5 pl-1.5"
                                            >{{ avatarDialog.fileAnalysis.android._fileSize }}</span
                                        >
                                    </Badge>
                                </TooltipWrapper>
                                <TooltipWrapper v-if="avatarDialog.isIos" side="top" content="iOS">
                                    <Badge class="text-platform-ios border-platform-ios mr-1.5 mt-1.5" variant="outline"
                                        ><Apple class="h-4 w-4 text-platform-ios" />
                                        <span
                                            v-if="avatarDialog.platformInfo.ios"
                                            class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5"
                                            >{{
                                                t(
                                                    `dialog.avatar.tags.performanceRating.${avatarDialog.platformInfo.ios.performanceRating.replace(' ', '')}`
                                                )
                                            }}</span
                                        >
                                        <span
                                            v-if="avatarDialog.fileAnalysis.ios?._fileSize"
                                            class="x-grey text-platform-ios border-platform-ios border-l-[0.8px] border-solid ml-1.5 pl-1.5"
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
                                        <Badge
                                            class="mr-1.5 mt-1.5"
                                            v-if="tag.startsWith('content_')"
                                            variant="outline">
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
                                    </template>
                                </div>
                            </div>
                        </div>
                        <div
                            class="col-start-2 row-start-1 row-span-2 grid grid-cols-2 flex-none items-center justify-end gap-2 self-start">
                            <TooltipWrapper
                                v-if="avatarDialog.isFavorite"
                                side="top"
                                :content="t('dialog.avatar.actions.favorite_tooltip')">
                                <Button
                                    class="rounded-lg"
                                    size="icon"
                                    @click="avatarDialogCommand('Add Favorite')"
                                    :ariaLabel="t('dialog.avatar.actions.favorite_tooltip')"
                                    ><Star
                                /></Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('dialog.avatar.actions.favorite_tooltip')">
                                <Button
                                    class="rounded-lg"
                                    size="icon"
                                    variant="outline"
                                    @click="avatarDialogCommand('Add Favorite')"
                                    :ariaLabel="t('dialog.avatar.actions.favorite_tooltip')"
                                    ><Star
                                /></Button>
                            </TooltipWrapper>

                            <DropdownMenu>
                                <DropdownMenuTrigger as-child>
                                    <Button
                                        class="rounded-lg"
                                        :variant="avatarDialog.isBlocked ? 'destructive' : 'outline'"
                                        size="icon"
                                        :ariaLabel="t('nav_tooltip.manage')">
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
                            <TooltipWrapper
                                v-if="avatarDialog.inCache"
                                class="col-start-1 row-start-2"
                                side="top"
                                :content="t('dialog.avatar.actions.delete_cache_tooltip')">
                                <Button
                                    class="rounded-lg"
                                    size="icon"
                                    variant="outline"
                                    :disabled="isGameRunning && avatarDialog.cacheLocked"
                                    @click="deleteVRChatCache(avatarDialog.ref)"
                                    :ariaLabel="t('dialog.avatar.actions.delete_cache_tooltip')"
                                    ><Trash2
                                /></Button>
                            </TooltipWrapper>
                            <TooltipWrapper
                                class="col-start-2 row-start-2"
                                side="top"
                                :content="t('dialog.avatar.actions.select')">
                                <Button
                                    class="rounded-lg"
                                    size="icon"
                                    variant="outline"
                                    :disabled="currentUser.currentAvatar === avatarDialog.id"
                                    @click="selectAvatarWithoutConfirmation(avatarDialog.id)"
                                    :ariaLabel="t('dialog.avatar.actions.select')">
                                    <CheckCircle
                                /></Button>
                            </TooltipWrapper>
                        </div>
                    </div>
                </div>

                <div class="rounded-xl bg-(--profile-card) p-3 mt-2.5">
                    <div
                        class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                        {{ t('dialog.avatar.info.header') }}
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <TooltipWrapper
                            side="top"
                            :content="formatDateFilter(avatarDialog.ref.created_at, 'long')"
                            :disabled="!avatarDialog.ref.created_at">
                            <div class="flex justify-between items-start gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">{{
                                    t('dialog.avatar.info.created_at')
                                }}</span>
                                <span class="text-right text-muted-foreground">{{
                                    timeAgo(avatarDialog.ref.created_at)
                                }}</span>
                            </div>
                        </TooltipWrapper>
                        <TooltipWrapper
                            side="top"
                            :content="formatDateFilter(avatarDialog.ref.updated_at, 'long')"
                            :disabled="!avatarDialog.ref.updated_at">
                            <div class="flex justify-between items-start gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">{{
                                    t('dialog.avatar.info.last_updated')
                                }}</span>
                                <span class="text-right text-muted-foreground">{{
                                    timeAgo(avatarDialog.ref.updated_at)
                                }}</span>
                            </div>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="avatarTags" :disabled="!avatarTags">
                            <div class="flex items-start justify-between gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">{{ t('dialog.avatar.info.tags') }}</span>
                                <span class="max-w-30 truncate text-right text-muted-foreground">
                                    {{ avatarTags || '—' }}
                                </span>
                            </div>
                        </TooltipWrapper>
                        <div class="flex justify-between items-start gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.avatar.info.version') }}</span>
                            <span class="text-right text-muted-foreground">{{ avatarDialog.ref.version || '—' }}</span>
                        </div>
                        <TooltipWrapper side="top" :content="avatarDialogPlatform" :disabled="!avatarDialogPlatform">
                            <div class="flex items-start justify-between gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">{{
                                    t('dialog.avatar.info.platform')
                                }}</span>
                                <span
                                    class="block max-w-25 truncate whitespace-nowrap text-right text-muted-foreground">
                                    {{ avatarDialogPlatform || '—' }}
                                </span>
                            </div>
                        </TooltipWrapper>
                    </div>
                </div>

                <div class="rounded-xl bg-(--profile-card) p-3 mt-2.5">
                    <div class="flex items-center mb-2 pb-2 border-b border-muted-foreground/20">
                        <span
                            class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {{ t('dialog.user.info.vrcx_info') }}
                            <TooltipWrapper side="top" :content="t('dialog.user.info.vrcx_info_tooltip')">
                                <Info class="h-3 w-3 shrink-0" />
                            </TooltipWrapper>
                        </span>
                    </div>
                    <div class="flex justify-between items-start gap-2 text-xs">
                        <span class="text-muted-foreground shrink-0">{{ t('dialog.avatar.info.time_spent') }}</span>
                        <span class="text-right text-muted-foreground">
                            {{ avatarDialog.timeSpent ? timeToText(avatarDialog.timeSpent) : '—' }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-4">
                <TabsUnderline
                    v-model="avatarDialog.activeTab"
                    :background="true"
                    :items="avatarDialogTabs"
                    :unmount-on-hide="false"
                    fill
                    @update:modelValue="avatarDialogTabClick">
                    <template #Info>
                        <div>
                            <div
                                v-if="
                                    avatarDialog.ref.description &&
                                    avatarDialog.ref.name !== avatarDialog.ref.description
                                "
                                class="my-2 text-xs rounded-xl bg-(--profile-card) p-3">
                                <div
                                    class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground pb-2 border-b border-border">
                                    {{ t('dialog.world.info.description') }}
                                </div>
                                <div class="flex items-start">
                                    <span class="flex-1 break-words py-2">
                                        {{ avatarDialog.ref.description }}
                                    </span>
                                </div>
                            </div>
                            <div
                                class="h-full min-h-0 overflow-y-auto flex flex-wrap content-start items-start rounded-xl bg-(--profile-card) p-3"
                                style="max-height: unset"
                                v-if="
                                    avatarDialog.galleryImages.length || avatarDialog.ref.authorId === currentUser.id
                                ">
                                <div class="w-full">
                                    <div
                                        class="flex justify-between text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                                        <span>{{ t('dialog.avatar.info.gallery') }}</span>
                                        <Button
                                            v-if="avatarDialog.ref.authorId === currentUser.id"
                                            size="sm"
                                            variant="outline"
                                            class="h-6"
                                            :disabled="avatarDialog.galleryLoading"
                                            @click="displayAvatarGalleryUpload"
                                            :ariaLabel="t('dialog.screenshot_metadata.upload')">
                                            <span class="text-[10px]">
                                                {{ t('dialog.screenshot_metadata.upload') }}
                                            </span>
                                            <Upload class="text-[10px]" />
                                        </Button>
                                    </div>
                                    <input
                                        id="AvatarGalleryUploadButton"
                                        type="file"
                                        accept="image/*"
                                        style="display: none"
                                        @change="onFileChangeAvatarGallery" />

                                    <div class="mt-2 w-[80%] ml-20">
                                        <Carousel v-if="avatarDialog.galleryImages.length" class="w-full">
                                            <CarouselContent class="h-50">
                                                <CarouselItem
                                                    v-for="imageUrl in avatarDialog.galleryImages"
                                                    :key="imageUrl">
                                                    <div class="relative h-50 w-full">
                                                        <img
                                                            :src="imageUrl"
                                                            style="
                                                                width: 100%;
                                                                height: 100%;
                                                                object-fit: contain;
                                                                cursor: pointer;
                                                            "
                                                            @click="showFullscreenImageDialog(imageUrl)"
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
                                        <div v-else>
                                            <DataTableEmpty type="nodata" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div
                                v-if="avatarDialog.ref.publishedListings?.length"
                                class="my-2 text-xs rounded-xl bg-(--profile-card) p-3">
                                <div
                                    class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                                    {{ t('dialog.avatar.info.listings') }}
                                </div>
                                <div
                                    v-for="listing in avatarDialog.ref.publishedListings"
                                    :key="listing.id"
                                    class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
                                    <div class="relative inline-block flex-none size-24 mr-2.5">
                                        <img
                                            class="size-full rounded-lg object-cover"
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
                            <div class="my-2 text-xs rounded-xl bg-(--profile-card) p-3">
                                <div
                                    class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-2 pb-2 border-b border-border">
                                    {{ t('dialog.world.info.memo') }}
                                </div>
                                <InputGroupTextareaField
                                    v-model="memo"
                                    class="text-xs"
                                    :rows="1"
                                    :autosize="true"
                                    :placeholder="t('dialog.avatar.info.memo_placeholder')"
                                    input-class="resize-none min-h-0"
                                    @change="onAvatarMemoChange" />
                            </div>
                        </div>
                    </template>
                    <template #JSON>
                        <DialogJsonTab
                            class="rounded-xl bg-(--profile-card) p-2"
                            :tree-data="treeData"
                            :tree-data-key="avatarDialog.id"
                            :dialog-id="avatarDialog.id"
                            :dialog-ref="avatarDialog.ref"
                            :file-analysis="avatarDialog.fileAnalysis"
                            @refresh="refreshAvatarDialogTreeData()" />
                    </template>
                </TabsUnderline>
            </div>
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
        Copy,
        Download,
        Ellipsis,
        Image,
        Info,
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
    import { DataTableEmpty } from '@/components/ui/data-table';
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
        timeAgo,
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
    import { AppDebug } from '@/services/appConfig';

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
        registerCallbacks,
        copyAvatarUrl
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
                if (
                    unityPackage.variant &&
                    unityPackage.variant !== 'standard' &&
                    unityPackage.variant !== 'security'
                ) {
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
                const platformWithVersion = `${platform}/${unityPackage.unityVersion}`;
                if (platforms.includes(platformWithVersion)) {
                    continue;
                }
                platforms.unshift(platformWithVersion);
            }
        }
        return platforms.join('\n');
    });

    const avatarTags = computed(() => {
        return avatarDialog.value.ref?.tags
            ?.filter((tag) => tag.startsWith('author_tag_'))
            .map((tag) => tag.replace('author_tag_', ''))
            .join(', ');
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
