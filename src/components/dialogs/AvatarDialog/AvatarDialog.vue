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
                <img
                    :src="avatarDialog.ref.thumbnailImageUrl"
                    class="cursor-pointer"
                    @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)"
                    style="flex: none; width: 160px; height: 120px; border-radius: 12px"
                    loading="lazy" />
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <span
                                class="font-bold"
                                style="margin-right: 5px; cursor: pointer"
                                v-text="avatarDialog.ref.name"
                                @click="copyToClipboard(avatarDialog.ref.name)"></span>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                class="cursor-pointer x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(avatarDialog.ref.authorId)"
                                v-text="avatarDialog.ref.authorName"></span>
                        </div>
                        <div>
                            <Badge
                                v-if="avatarDialog.ref.releaseStatus === 'public'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.avatar.tags.public') }}
                            </Badge>
                            <Badge v-else variant="outline" style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.avatar.tags.private') }}
                            </Badge>
                            <TooltipWrapper v-if="avatarDialog.isPC" side="top" content="PC">
                                <Badge
                                    class="x-tag-platform-pc"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px"
                                    ><Monitor class="h-4 w-4 x-tag-platform-pc" />
                                    <span
                                        v-if="avatarDialog.platformInfo.pc"
                                        :class="['x-grey', 'x-tag-platform-pc', 'x-tag-border-left']"
                                        >{{ avatarDialog.platformInfo.pc.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.bundleSizes['standalonewindows']"
                                        :class="['x-grey', 'x-tag-platform-pc', 'x-tag-border-left']"
                                        >{{ avatarDialog.bundleSizes['standalonewindows'].fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <TooltipWrapper v-if="avatarDialog.isQuest" side="top" content="Android">
                                <Badge
                                    class="x-tag-platform-quest"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px"
                                    ><Smartphone class="h-4 w-4 x-tag-platform-quest" />
                                    <span
                                        v-if="avatarDialog.platformInfo.android"
                                        :class="['x-grey', 'x-tag-platform-quest', 'x-tag-border-left']"
                                        >{{ avatarDialog.platformInfo.android.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.bundleSizes['android']"
                                        :class="['x-grey', 'x-tag-platform-quest', 'x-tag-border-left']"
                                        >{{ avatarDialog.bundleSizes['android'].fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <TooltipWrapper v-if="avatarDialog.isIos" side="top" content="iOS">
                                <Badge
                                    class="text-[#8e8e93] border-[#8e8e93]"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px"
                                    ><Apple class="h-4 w-4 text-[#8e8e93]" />
                                    <span
                                        v-if="avatarDialog.platformInfo.ios"
                                        :class="['x-grey', 'x-tag-border-left', 'text-[#8e8e93]', 'border-[#8e8e93]']"
                                        >{{ avatarDialog.platformInfo.ios.performanceRating }}</span
                                    >
                                    <span
                                        v-if="avatarDialog.bundleSizes['ios']"
                                        :class="['x-grey', 'x-tag-border-left', 'text-[#8e8e93]', 'border-[#8e8e93]']"
                                        >{{ avatarDialog.bundleSizes['ios'].fileSize }}</span
                                    >
                                </Badge>
                            </TooltipWrapper>
                            <Badge
                                v-if="avatarDialog.inCache"
                                variant="outline"
                                class="cursor-pointer"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(avatarDialog.cachePath)">
                                <span v-text="avatarDialog.cacheSize"></span>
                                &nbsp;{{ t('dialog.avatar.tags.cache') }}
                            </Badge>
                            <Badge
                                v-if="avatarDialog.ref.styles?.primary || avatarDialog.ref.styles?.secondary"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px"
                                >Styles
                                <span v-if="avatarDialog.ref.styles.primary" :class="['x-grey', 'x-tag-border-left']">{{
                                    avatarDialog.ref.styles.primary
                                }}</span>
                                <span
                                    v-if="avatarDialog.ref.styles.secondary"
                                    :class="['x-grey', 'x-tag-border-left']"
                                    >{{ avatarDialog.ref.styles.secondary }}</span
                                >
                            </Badge>
                            <Badge
                                v-if="avatarDialog.isQuestFallback"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.avatar.tags.fallback') }}
                            </Badge>
                            <Badge
                                v-if="avatarDialog.hasImposter"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.impostor') }}
                                <span v-if="avatarDialog.imposterVersion" :class="['x-grey', 'x-tag-border-left']"
                                    >v{{ avatarDialog.imposterVersion }}</span
                                >
                            </Badge>
                            <Badge
                                v-if="avatarDialog.ref.unityPackageUrl"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.avatar.tags.future_proofing') }}
                            </Badge>
                            <div>
                                <template v-for="tag in avatarDialog.ref.tags" :key="tag">
                                    <Badge
                                        v-if="tag.startsWith('content_')"
                                        variant="outline"
                                        style="margin-right: 5px; margin-top: 5px">
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
                                    <Badge
                                        v-if="tag.startsWith('author_tag_')"
                                        variant="outline"
                                        style="margin-right: 5px; margin-top: 5px">
                                        <span>
                                            {{ tag.replace('author_tag_', '') }}
                                        </span>
                                    </Badge>
                                </template>
                            </div>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                v-show="avatarDialog.ref.name !== avatarDialog.ref.description"
                                style="font-size: 12px"
                                v-text="avatarDialog.ref.description"></span>
                        </div>
                    </div>
                    <div class="flex items-center">
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
                                    <DropdownMenuItem variant="destructive" @click="avatarDialogCommand('Trash2')">
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
                    <div class="x-friend-list" style="max-height: unset">
                        <div
                            v-if="avatarDialog.galleryImages.length || avatarDialog.ref.authorId === currentUser.id"
                            style="width: 100%">
                            <span class="name">{{ t('dialog.avatar.info.gallery') }}</span>
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
                                                    loading="lazy" />
                                            </div>
                                        </CarouselItem>
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>
                        </div>
                        <div v-if="avatarDialog.ref.publishedListings?.length">
                            <span class="name">{{ t('dialog.avatar.info.listings') }}</span>
                            <div
                                v-for="listing in avatarDialog.ref.publishedListings"
                                :key="listing.id"
                                class="x-friend-item"
                                style="width: 100%; cursor: default">
                                <div class="avatar">
                                    <img
                                        :src="getImageUrlFromImageId(listing.imageId)"
                                        @click="showFullscreenImageDialog(getImageUrlFromImageId(listing.imageId))"
                                        loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span class="name">{{ listing.displayName }}</span>
                                    <span class="extra" style="text-decoration: underline; font-style: italic"
                                        >${{ commaNumber(listing.priceTokens) }}V</span
                                    >
                                    <span
                                        class="extra"
                                        style="text-overflow: ellipsis; text-wrap: auto"
                                        v-text="listing.description"></span>
                                </div>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name" style="margin-bottom: 5px">{{ t('dialog.avatar.info.memo') }}</span>
                                <InputGroupTextareaField
                                    v-model="memo"
                                    class="extra"
                                    :rows="2"
                                    :placeholder="t('dialog.avatar.info.memo_placeholder')"
                                    input-class="resize-none min-h-0"
                                    @change="onAvatarMemoChange" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.id') }}</span>
                                <span class="extra"
                                    >{{ avatarDialog.id
                                    }}<TooltipWrapper side="top" :content="t('dialog.avatar.info.id_tooltip')">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button
                                                    class="rounded-full text-xs"
                                                    size="icon-sm"
                                                    variant="outline"
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
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.created_at') }}</span>
                                <span class="extra">{{ formatDateFilter(avatarDialog.ref.created_at, 'long') }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.last_updated') }}</span>
                                <span v-if="avatarDialog.lastUpdated" class="extra">{{
                                    formatDateFilter(avatarDialog.lastUpdated, 'long')
                                }}</span>
                                <span v-else class="extra">{{
                                    formatDateFilter(avatarDialog.ref.updated_at, 'long')
                                }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.version') }}</span>
                                <span
                                    v-if="avatarDialog.ref.version !== 0"
                                    class="extra"
                                    v-text="avatarDialog.ref.version"></span>
                                <span v-else class="extra">-</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.time_spent') }}</span>

                                <span v-if="timeSpent === 0" class="extra">-</span>
                                <span v-else class="extra">{{ timeToText(timeSpent) }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.platform') }}</span>
                                <span v-if="avatarDialogPlatform" class="extra" v-text="avatarDialogPlatform"></span>
                                <span v-else class="extra">-</span>
                            </div>
                        </div>
                    </div>
                </template>
                <template #JSON>
                    <Button
                        class="rounded-full mr-2"
                        size="icon-sm"
                        variant="outline"
                        @click="refreshAvatarDialogTreeData()">
                        <RefreshCw />
                    </Button>
                    <Button
                        class="rounded-full"
                        size="icon-sm"
                        variant="outline"
                        @click="downloadAndSaveJson(avatarDialog.id, avatarDialog.ref)">
                        <Download />
                    </Button>
                    <vue-json-pretty
                        :key="treeData?.id"
                        :data="treeData"
                        :deep="2"
                        :theme="isDarkMode ? 'dark' : 'light'"
                        show-icon />
                    <br />
                    <vue-json-pretty
                        v-if="Object.keys(avatarDialog.fileAnalysis).length > 0"
                        :data="avatarDialog.fileAnalysis"
                        :deep="2"
                        :theme="isDarkMode ? 'dark' : 'light'"
                        show-icon />
                </template>
            </TabsUnderline>
            <template v-if="avatarDialog.visible">
                <SetAvatarTagsDialog v-model:setAvatarTagsDialog="setAvatarTagsDialog" />
                <SetAvatarStylesDialog v-model:setAvatarStylesDialog="setAvatarStylesDialog" />
                <ChangeAvatarImageDialog
                    v-model:changeAvatarImageDialogVisible="changeAvatarImageDialogVisible"
                    v-model:previousImageUrl="previousImageUrl" />
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
    import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
        commaNumber,
        copyToClipboard,
        downloadAndSaveJson,
        formatDateFilter,
        openExternalLink,
        openFolderGeneric,
        replaceVrcPackageUrl,
        timeToText
    } from '../../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useAvatarStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { avatarModerationRequest, avatarRequest, favoriteRequest } from '../../../api';
    import { AppDebug } from '../../../service/appConfig.js';
    import { Badge } from '../../ui/badge';
    import { database } from '../../../service/database';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { handleImageUploadInput } from '../../../shared/utils/imageUpload';

    const ChangeAvatarImageDialog = defineAsyncComponent(() => import('./ChangeAvatarImageDialog.vue'));
    const SetAvatarStylesDialog = defineAsyncComponent(() => import('./SetAvatarStylesDialog.vue'));
    const SetAvatarTagsDialog = defineAsyncComponent(() => import('./SetAvatarTagsDialog.vue'));

    const { showUserDialog, sortUserDialogAvatars } = useUserStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const avatarStore = useAvatarStore();
    const { cachedAvatarModerations, cachedAvatars } = avatarStore;
    const { avatarDialog } = storeToRefs(avatarStore);
    const { showAvatarDialog, getAvatarGallery, applyAvatarModeration, applyAvatar, selectAvatarWithoutConfirmation } =
        avatarStore;
    const { showFavoriteDialog } = useFavoriteStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { deleteVRChatCache } = useGameStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());
    const modalStore = useModalStore();

    const { t } = useI18n();
    const avatarDialogTabs = computed(() => [
        { value: 'Info', label: t('dialog.avatar.info.header') },
        { value: 'JSON', label: t('dialog.avatar.json.header') }
    ]);

    const changeAvatarImageDialogVisible = ref(false);
    const previousImageUrl = ref('');

    const treeData = ref({});
    const timeSpent = ref(0);
    const memo = ref('');
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
                    continue;
                }
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    ({ platform } = unityPackage);
                }
                platforms.push(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
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

    function handleAvatarDialogTab(tabName) {
        avatarDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshAvatarDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleAvatarDialogTab(avatarDialog.value.lastActiveTab);
    }

    function avatarDialogTabClick(tabName) {
        if (tabName === avatarDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshAvatarDialogTreeData();
            }
            return;
        }
        handleAvatarDialogTab(tabName);
    }

    function getImageUrlFromImageId(imageId) {
        return `${AppDebug.endpointDomain}/file/${imageId}/1/`;
    }

    function handleDialogOpen() {
        setAvatarTagsDialog.value.visible = false;
        timeSpent.value = 0;
        memo.value = '';
        treeData.value = {};
        getAvatarTimeSpent();
        getAvatarMemo();
    }

    function getAvatarTimeSpent() {
        const D = avatarDialog.value;
        timeSpent.value = 0;
        database.getAvatarTimeSpent(D.id).then((aviTime) => {
            if (D.id === aviTime.avatarId) {
                timeSpent.value = aviTime.timeSpent;
                if (D.id === currentUser.value.currentAvatar && currentUser.value.$previousAvatarSwapTime) {
                    timeSpent.value += Date.now() - currentUser.value.$previousAvatarSwapTime;
                }
            }
        });
    }

    function getAvatarMemo() {
        const D = avatarDialog.value;
        database.getAvatarMemoDB(D.id).then((res) => {
            if (D.id === res.avatarId) {
                memo.value = res.memo;
            }
        });
    }

    function avatarDialogCommand(command) {
        const D = avatarDialog.value;
        switch (command) {
            case 'Refresh':
                showAvatarDialog(D.id);
                break;
            case 'Share':
                copyAvatarUrl(D.id);
                break;
            case 'Rename':
                promptRenameAvatar(D);
                break;
            case 'Change Image':
                showChangeAvatarImageDialog();
                break;
            case 'Change Description':
                promptChangeAvatarDescription(D);
                break;
            case 'Change Content Tags':
                showSetAvatarTagsDialog(D.id);
                break;
            case 'Change Styles and Author Tags':
                showSetAvatarStylesDialog();
                break;
            case 'Download Unity Package':
                openExternalLink(replaceVrcPackageUrl(avatarDialog.value.ref.unityPackageUrl));
                break;
            case 'Add Favorite':
                showFavoriteDialog('avatar', D.id);
                break;
            default:
                modalStore
                    .confirm({
                        title: 'Confirm',
                        description: `Continue? ${command}`
                    })
                    .then(({ ok }) => {
                        if (!ok) return;
                        switch (command) {
                            case 'Delete Favorite':
                                favoriteRequest.deleteFavorite({
                                    objectId: D.id
                                });
                                break;
                            case 'Select Fallback Avatar':
                                avatarRequest
                                    .selectFallbackAvatar({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        toast.success('Fallback avatar changed');
                                        return args;
                                    });
                                break;
                            case 'Block Avatar':
                                avatarModerationRequest
                                    .sendAvatarModeration({
                                        avatarModerationType: 'block',
                                        targetAvatarId: D.id
                                    })
                                    .then((args) => {
                                        // 'AVATAR-MODERATION';
                                        applyAvatarModeration(args.json);
                                        toast.success('Avatar blocked');
                                        return args;
                                    });
                                break;
                            case 'Unblock Avatar':
                                avatarModerationRequest
                                    .deleteAvatarModeration({
                                        avatarModerationType: 'block',
                                        targetAvatarId: D.id
                                    })
                                    .then((args) => {
                                        cachedAvatarModerations.delete(args.params.targetAvatarId);
                                        const D = avatarDialog.value;
                                        if (
                                            args.params.avatarModerationType === 'block' &&
                                            D.id === args.params.targetAvatarId
                                        ) {
                                            D.isBlocked = false;
                                        }
                                    });
                                break;
                            case 'Make Public':
                                avatarRequest
                                    .saveAvatar({
                                        id: D.id,
                                        releaseStatus: 'public'
                                    })
                                    .then((args) => {
                                        applyAvatar(args.json);
                                        toast.success('Avatar updated to public');
                                        return args;
                                    });
                                break;
                            case 'Make Private':
                                avatarRequest
                                    .saveAvatar({
                                        id: D.id,
                                        releaseStatus: 'private'
                                    })
                                    .then((args) => {
                                        applyAvatar(args.json);
                                        toast.success('Avatar updated to private');
                                        return args;
                                    });
                                break;
                            case 'Delete':
                                avatarRequest
                                    .deleteAvatar({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        const { json } = args;
                                        cachedAvatars.delete(json._id);
                                        if (userDialog.value.id === json.authorId) {
                                            const map = new Map();
                                            for (const ref of cachedAvatars.values()) {
                                                if (ref.authorId === json.authorId) {
                                                    map.set(ref.id, ref);
                                                }
                                            }
                                            const array = Array.from(map.values());
                                            sortUserDialogAvatars(array);
                                        }

                                        toast.success('Avatar deleted');
                                        D.visible = false;
                                        return args;
                                    });
                                break;
                            case 'Delete Imposter':
                                avatarRequest
                                    .deleteImposter({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        toast.success('Imposter deleted');
                                        showAvatarDialog(D.id);
                                        return args;
                                    });
                                break;
                            case 'Create Imposter':
                                avatarRequest
                                    .createImposter({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        toast.success('Imposter queued for creation');
                                        return args;
                                    });
                                break;
                            case 'Regenerate Imposter':
                                avatarRequest
                                    .deleteImposter({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        showAvatarDialog(D.id);
                                        return args;
                                    })
                                    .finally(() => {
                                        avatarRequest
                                            .createImposter({
                                                avatarId: D.id
                                            })
                                            .then((args) => {
                                                toast.success('Imposter deleted and queued for creation');
                                                return args;
                                            });
                                    });
                                break;
                        }
                    });
                break;
        }
    }

    function showChangeAvatarImageDialog() {
        const { imageUrl } = avatarDialog.value.ref;
        previousImageUrl.value = imageUrl;
        changeAvatarImageDialogVisible.value = true;
    }

    function promptChangeAvatarDescription(avatar) {
        modalStore
            .prompt({
                title: t('prompt.change_avatar_description.header'),
                description: t('prompt.change_avatar_description.description'),
                confirmText: t('prompt.change_avatar_description.ok'),
                cancelText: t('prompt.change_avatar_description.cancel'),
                inputValue: avatar.ref.description,
                errorMessage: t('prompt.change_avatar_description.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== avatar.ref.description) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            description: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(t('prompt.change_avatar_description.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    function promptRenameAvatar(avatar) {
        modalStore
            .prompt({
                title: t('prompt.rename_avatar.header'),
                description: t('prompt.rename_avatar.description'),
                confirmText: t('prompt.rename_avatar.ok'),
                cancelText: t('prompt.rename_avatar.cancel'),
                inputValue: avatar.ref.name,
                errorMessage: t('prompt.rename_avatar.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== avatar.ref.name) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            name: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(t('prompt.rename_avatar.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

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

    function copyAvatarId(id) {
        copyToClipboard(id);
    }

    function copyAvatarUrl(id) {
        copyToClipboard(`https://vrchat.com/home/avatar/${id}`);
    }

    function refreshAvatarDialogTreeData() {
        treeData.value = formatJsonVars(avatarDialog.value.ref);
    }

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

    function displayAvatarGalleryUpload() {
        document.getElementById('AvatarGalleryUploadButton').click();
    }

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
