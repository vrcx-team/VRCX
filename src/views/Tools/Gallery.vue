<template>
    <div class="gallery-page x-container">
        <div class="gallery-page__header">
            <Button variant="ghost" class="gallery-page__back" @click="goBack">
                {{ t('nav_tooltip.tools') }}
            </Button>
            <span class="header">{{ t('dialog.gallery_icons.header') }}</span>
        </div>
        <TabsUnderline default-value="gallery" :items="galleryTabs" :unmount-on-hide="false">
            <template #label-gallery>
                <span>
                    {{ t('dialog.gallery_icons.gallery') }}
                    <span class="gallery-tab-count"> {{ galleryTable.length }}/64 </span>
                </span>
            </template>
            <template #label-icons>
                <span>
                    {{ t('dialog.gallery_icons.icons') }}
                    <span class="gallery-tab-count"> {{ VRCPlusIconsTable.length }}/64 </span>
                </span>
            </template>
            <template #label-emojis>
                <span>
                    {{ t('dialog.gallery_icons.emojis') }}
                    <span class="gallery-tab-count">
                        {{ emojiTable.length }}/{{ cachedConfigTyped.maxUserEmoji }}
                    </span>
                </span>
            </template>
            <template #label-stickers>
                <span>
                    {{ t('dialog.gallery_icons.stickers') }}
                    <span class="gallery-tab-count">
                        {{ stickerTable.length }}/{{ cachedConfigTyped.maxUserStickers }}
                    </span>
                </span>
            </template>
            <template #label-prints>
                <span>
                    {{ t('dialog.gallery_icons.prints') }}
                    <span class="gallery-tab-count"> {{ printTable.length }}/64 </span>
                </span>
            </template>
            <template #label-inventory>
                <span>
                    {{ t('dialog.gallery_icons.inventory') }}
                    <span class="gallery-tab-count">
                        {{ inventoryTable.length }}
                    </span>
                </span>
            </template>
            <template #gallery>
                <div v-loading="galleryDialogGalleryLoading">
                    <input
                        id="GalleryUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeGallery"
                        style="display: none" />
                    <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1200x900px (4:3)</span>
                    <br />
                    <br />
                    <ButtonGroup>
                        <Button variant="outline" size="sm" @click="refreshGalleryTable">
                            <RefreshCw />
                            {{ t('dialog.gallery_icons.refresh') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!isLocalUserVrcPlusSupporter || isUploading"
                            @click="displayGalleryUpload">
                            <Upload />
                            {{ t('dialog.gallery_icons.upload') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!currentUser.profilePicOverride"
                            @click="setProfilePicOverride('')">
                            <X />
                            {{ t('dialog.gallery_icons.clear') }}
                        </Button>
                    </ButtonGroup>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="image in galleryTable"
                        :key="image.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <template v-if="image.versions && image.versions.length > 0">
                            <div
                                class="vrcplus-icon"
                                v-if="image.versions[image.versions.length - 1].file.url"
                                @click="setProfilePicOverride(image.id)"
                                :class="{ 'current-vrcplus-icon': compareCurrentProfilePic(image.id) }">
                                <img
                                    class="avatar"
                                    :src="image.versions[image.versions.length - 1].file.url"
                                    loading="lazy" />
                            </div>
                            <div class="float-right" style="margin-top: 5px">
                                <Button
                                    class="rounded-full mr-2"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    ">
                                    <Maximize2 />
                                </Button>
                                <Button
                                    class="rounded-full"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="deleteGalleryImage(image.id)">
                                    <Trash2 />
                                </Button>
                            </div>
                        </template>
                    </div>
                </div>
            </template>

            <template #icons>
                <div v-loading="galleryDialogIconsLoading">
                    <input
                        id="VRCPlusIconUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeVRCPlusIcon"
                        style="display: none" />
                    <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 2048x2048px (1:1)</span>
                    <br />
                    <br />
                    <ButtonGroup>
                        <Button variant="outline" size="sm" @click="refreshVRCPlusIconsTable">
                            <RefreshCw />
                            {{ t('dialog.gallery_icons.refresh') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!isLocalUserVrcPlusSupporter || isUploading"
                            @click="displayVRCPlusIconUpload">
                            <Upload />
                            {{ t('dialog.gallery_icons.upload') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!currentUser.userIcon"
                            @click="setVRCPlusIcon('')">
                            <X />
                            {{ t('dialog.gallery_icons.clear') }}
                        </Button>
                    </ButtonGroup>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="image in VRCPlusIconsTable"
                        :key="image.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <template v-if="image.versions && image.versions.length > 0"
                            ><div
                                class="vrcplus-icon"
                                v-if="image.versions[image.versions.length - 1].file.url"
                                @click="setVRCPlusIcon(image.id)"
                                :class="{ 'current-vrcplus-icon': compareCurrentVRCPlusIcon(image.id) }">
                                <img
                                    class="avatar"
                                    :src="image.versions[image.versions.length - 1].file.url"
                                    loading="lazy" />
                            </div>
                            <div class="float-right" style="margin-top: 5px">
                                <Button
                                    class="rounded-full mr-2"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    ">
                                    <Maximize2 />
                                </Button>
                                <Button
                                    class="rounded-full"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="deleteVRCPlusIcon(image.id)"
                                    ><Trash2
                                /></Button></div
                        ></template>
                    </div>
                </div>
            </template>

            <template #emojis>
                <div v-loading="galleryDialogEmojisLoading">
                    <input
                        id="EmojiUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeEmoji"
                        style="display: none" />
                    <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1024x1024px (1:1)</span>
                    <br />
                    <br />
                    <div>
                        <ButtonGroup style="margin-right: 10px">
                            <Button variant="outline" size="sm" @click="refreshEmojiTable">
                                <RefreshCw />
                                {{ t('dialog.gallery_icons.refresh') }}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="!isLocalUserVrcPlusSupporter || isUploading"
                                @click="displayEmojiUpload">
                                <Upload />
                                {{ t('dialog.gallery_icons.upload') }}
                            </Button>
                        </ButtonGroup>
                        <br />
                        <br />
                        <VirtualCombobox
                            v-model="emojiAnimationStyle"
                            :groups="emojiStylePickerGroups"
                            :placeholder="t('dialog.gallery_icons.emoji_animation_styles')"
                            :search-placeholder="t('dialog.gallery_icons.emoji_animation_styles')"
                            :clearable="false"
                            :close-on-select="true">
                            <template #item="{ item, selected }">
                                <div class="flex w-full items-center gap-2">
                                    <div class="h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-black/5">
                                        <img
                                            class="h-full w-full object-cover"
                                            :src="`${emojiAnimationStyleUrl}${item.fileName}`"
                                            loading="lazy" />
                                    </div>
                                    <span class="truncate text-sm" v-text="item.label"></span>
                                    <span v-if="selected" class="ml-auto opacity-70">✓</span>
                                </div>
                            </template>
                        </VirtualCombobox>
                        <label class="inline-flex items-center gap-2">
                            <Checkbox v-model="emojiAnimType" />
                            <span>{{ t('dialog.gallery_icons.emoji_animation_type') }}</span>
                        </label>
                        <template v-if="emojiAnimType">
                            <Button
                                size="sm"
                                variant="outline"
                                class="mr-3"
                                @click="openExternalLink('https://vrcemoji.com')">
                                {{ t('dialog.gallery_icons.create_animated_emoji') }}
                            </Button>
                            <span style="margin-right: 10px">{{ t('dialog.gallery_icons.emoji_animation_fps') }}</span>
                            <NumberField
                                v-model="emojiAnimFps"
                                :min="1"
                                :max="64"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="mr-2.5 w-28">
                                <NumberFieldContent>
                                    <NumberFieldDecrement />
                                    <NumberFieldInput />
                                    <NumberFieldIncrement />
                                </NumberFieldContent>
                            </NumberField>
                            <span style="margin-right: 10px">{{
                                t('dialog.gallery_icons.emoji_animation_frame_count')
                            }}</span>
                            <NumberField
                                v-model="emojiAnimFrameCount"
                                :min="2"
                                :max="64"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="mr-2.5 w-28">
                                <NumberFieldContent>
                                    <NumberFieldDecrement />
                                    <NumberFieldInput />
                                    <NumberFieldIncrement />
                                </NumberFieldContent>
                            </NumberField>
                            <label class="inline-flex items-center gap-2" style="margin-left: 10px; margin-right: 10px">
                                <Checkbox v-model="emojiAnimLoopPingPong" />
                                <span>{{ t('dialog.gallery_icons.emoji_loop_pingpong') }}</span>
                            </label>
                            <br />
                            <br />
                            <span>{{ t('dialog.gallery_icons.flipbook_info') }}</span>
                        </template>
                    </div>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="image in emojiTable"
                        :key="image.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <template v-if="image.versions && image.versions.length > 0">
                            <div
                                class="vrcplus-icon"
                                v-if="image.versions[image.versions.length - 1].file.url"
                                style="overflow: hidden"
                                @click="
                                    showFullscreenImageDialog(
                                        image.versions[image.versions.length - 1].file.url,
                                        getEmojiFileName(image)
                                    )
                                ">
                                <Emoji
                                    :imageUrl="image.versions[image.versions.length - 1].file.url"
                                    :size="200"></Emoji>
                            </div>
                            <div style="display: inline-block; margin: 5px">
                                <span v-if="image.loopStyle === 'pingpong'">
                                    <RefreshCw style="margin-right: 5px" />
                                </span>
                                <span style="margin-right: 5px">{{ image.animationStyle }}</span>
                                <span v-if="image.framesOverTime" style="margin-right: 5px"
                                    >{{ image.framesOverTime }}fps</span
                                >
                                <span v-if="image.frames" style="margin-right: 5px">{{ image.frames }}frames</span>
                                <br />
                            </div>
                            <div class="float-right" style="margin-top: 5px">
                                <Button
                                    class="rounded-full mr-2"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="
                                        showFullscreenImageDialog(
                                            image.versions[image.versions.length - 1].file.url,
                                            getEmojiFileName(image)
                                        )
                                    "
                                    ><Maximize2
                                /></Button>
                                <Button
                                    class="rounded-full mr-2"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="deleteEmoji(image.id)">
                                    <Trash2
                                /></Button></div
                        ></template>
                    </div>
                </div>
            </template>

            <template #stickers>
                <div v-loading="galleryDialogStickersLoading">
                    <input
                        id="StickerUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeSticker"
                        style="display: none" />
                    <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1024x1024px (1:1)</span>
                    <br />
                    <br />
                    <ButtonGroup>
                        <Button variant="outline" size="sm" @click="refreshStickerTable">
                            <RefreshCw />
                            {{ t('dialog.gallery_icons.refresh') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!isLocalUserVrcPlusSupporter || isUploading"
                            @click="displayStickerUpload">
                            <Upload />
                            {{ t('dialog.gallery_icons.upload') }}
                        </Button>
                    </ButtonGroup>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="image in stickerTable"
                        :key="image.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <template v-if="image.versions && image.versions.length > 0">
                            <div
                                class="vrcplus-icon"
                                v-if="image.versions[image.versions.length - 1].file.url"
                                style="overflow: hidden"
                                @click="showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)">
                                <img
                                    class="avatar"
                                    :src="image.versions[image.versions.length - 1].file.url"
                                    loading="lazy" />
                            </div>
                            <div class="float-right" style="margin-top: 5px">
                                <Button
                                    class="rounded-full mr-2"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    "
                                    ><Maximize2
                                /></Button>
                                <Button
                                    class="rounded-full"
                                    size="icon-sm"
                                    variant="outline"
                                    @click="deleteSticker(image.id)"
                                    ><Trash2
                                /></Button></div
                        ></template>
                    </div>
                </div>
            </template>

            <template #prints>
                <div v-loading="galleryDialogPrintsLoading">
                    <input
                        id="PrintUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangePrint"
                        style="display: none" />
                    <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1920x1080px (16:9)</span>
                    <br />
                    <br />
                    <div style="display: flex; align-items: center">
                        <ButtonGroup>
                            <Button variant="outline" size="sm" @click="refreshPrintTable">
                                <RefreshCw />
                                {{ t('dialog.gallery_icons.refresh') }}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                :disabled="!isLocalUserVrcPlusSupporter || isUploading"
                                @click="displayPrintUpload">
                                <Upload />
                                {{ t('dialog.gallery_icons.upload') }}
                            </Button>
                        </ButtonGroup>
                        <InputGroupTextareaField
                            v-model="printUploadNote"
                            :rows="1"
                            maxlength="32"
                            style="margin-left: 10px; width: 300px"
                            :placeholder="t('dialog.gallery_icons.note')"
                            input-class="resize-none min-h-0" />
                        <label class="inline-flex items-center gap-2" style="margin-left: 10px; margin-right: 10px">
                            <Checkbox v-model="printCropBorder" />
                            <span>{{ t('dialog.gallery_icons.crop_print_border') }}</span>
                        </label>
                    </div>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="image in printTable"
                        :key="image.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <div
                            class="vrcplus-icon"
                            style="overflow: hidden"
                            @click="showFullscreenImageDialog(image.files.image, getPrintFileName(image))">
                            <img class="avatar" :src="image.files.image" loading="lazy" />
                        </div>
                        <div style="margin-top: 5px; width: 208px">
                            <span
                                class="x-ellipsis"
                                v-if="image.note"
                                v-text="image.note"
                                style="display: block"></span>
                            <span v-else style="display: block">&nbsp;</span>
                            <Location
                                class="x-ellipsis"
                                v-if="image.worldId"
                                :location="image.worldId"
                                :hint="image.worldName"
                                style="display: block" />
                            <span v-else style="display: block">&nbsp;</span>
                            <DisplayName
                                class="x-ellipsis gallery-meta"
                                v-if="image.authorId"
                                :userid="image.authorId"
                                :hint="image.authorName" />
                            <span v-else class="gallery-meta">&nbsp;</span>
                            <span v-if="image.createdAt" class="x-ellipsis gallery-meta gallery-meta--small">
                                {{ formatDateFilter(image.createdAt, 'long') }}
                            </span>
                            <span v-else style="display: block">&nbsp;</span>
                        </div>
                        <div class="float-right">
                            <Button
                                class="rounded-full mr-2"
                                size="icon-sm"
                                variant="outline"
                                @click="showFullscreenImageDialog(image.files.image, getPrintFileName(image))">
                                <Maximize2
                            /></Button>
                            <Button
                                class="rounded-full"
                                size="icon-sm"
                                variant="outline"
                                @click="deletePrint(image.id)">
                                <Trash2
                            /></Button>
                        </div>
                    </div>
                </div>
            </template>

            <template #inventory>
                <div v-loading="galleryDialogInventoryLoading">
                    <br />
                    <br />
                    <div style="display: flex; align-items: center">
                        <ButtonGroup>
                            <Button variant="outline" size="sm" @click="getInventory">
                                <RefreshCw />
                                {{ t('dialog.gallery_icons.refresh') }}
                            </Button>
                            <Button variant="outline" size="sm" @click="redeemReward">
                                <Gift />
                                {{ t('dialog.gallery_icons.redeem') }}
                            </Button>
                        </ButtonGroup>
                    </div>
                    <br />
                    <div
                        class="x-friend-item"
                        v-for="item in inventoryTable"
                        :key="item.id"
                        style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                        <div class="vrcplus-icon" style="overflow: hidden; cursor: default">
                            <img class="avatar" :src="item.imageUrl" loading="lazy" />
                        </div>
                        <div style="margin-top: 5px; width: 208px">
                            <span class="x-ellipsis" v-text="item.name" style="display: block"></span>
                            <span
                                v-if="item.description"
                                class="x-ellipsis"
                                v-text="item.description"
                                style="display: block"></span>
                            <span v-else style="display: block">&nbsp;</span>
                            <span class="x-ellipsis gallery-meta gallery-meta--small">
                                {{ formatDateFilter(item.created_at, 'long') }}
                            </span>
                            <span v-if="item.itemType === 'prop'">{{ t('dialog.gallery_icons.item') }}</span>
                            <span v-else-if="item.itemType === 'sticker'">{{ t('dialog.gallery_icons.sticker') }}</span>
                            <span v-else-if="item.itemType === 'droneskin'">{{
                                t('dialog.gallery_icons.drone_skin')
                            }}</span>
                            <span v-else-if="item.itemType === 'emoji'">{{ t('dialog.gallery_icons.emoji') }}</span>
                            <span v-else v-text="item.itemTypeLabel"></span>
                        </div>
                        <Button
                            size="sm"
                            v-if="item.itemType === 'bundle'"
                            @click="consumeInventoryBundle(item.id)"
                            class="float-right">
                            {{ t('dialog.gallery_icons.consume_bundle') }}
                        </Button>
                    </div>
                </div>
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { Gift, Maximize2, RefreshCw, Trash2, Upload, X } from 'lucide-vue-next';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';

    import {
        extractFileId,
        formatDateFilter,
        getEmojiFileName,
        getPrintFileName,
        openExternalLink
    } from '../../shared/utils';
    import { inventoryRequest, miscRequest, userRequest, vrcPlusIconRequest, vrcPlusImageRequest } from '../../api';
    import { useAdvancedSettingsStore, useAuthStore, useGalleryStore, useModalStore, useUserStore } from '../../stores';
    import { emojiAnimationStyleList, emojiAnimationStyleUrl } from '../../shared/constants';
    import { AppDebug } from '../../service/appConfig';
    import { handleImageUploadInput } from '../../shared/utils/imageUpload';

    import Emoji from '../../components/Emoji.vue';

    const { t } = useI18n();
    const router = useRouter();
    const modalStore = useModalStore();

    const {
        galleryTable,
        galleryDialogVisible,
        galleryDialogGalleryLoading,
        galleryDialogIconsLoading,
        galleryDialogEmojisLoading,
        galleryDialogStickersLoading,
        galleryDialogPrintsLoading,
        galleryDialogInventoryLoading,
        VRCPlusIconsTable,
        printUploadNote,
        printCropBorder,
        stickerTable,
        printTable,
        emojiTable,
        inventoryTable
    } = storeToRefs(useGalleryStore());
    const {
        loadGalleryData,
        refreshGalleryTable,
        refreshVRCPlusIconsTable,
        refreshStickerTable,
        refreshPrintTable,
        refreshEmojiTable,
        getInventory,
        handleStickerAdd,
        handleGalleryImageAdd
    } = useGalleryStore();

    const { currentUserInventory } = storeToRefs(useAdvancedSettingsStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { cachedConfig } = storeToRefs(useAuthStore());
    const cachedConfigTyped = computed(
        () => /** @type {{ maxUserEmoji?: number, maxUserStickers?: number }} */ (cachedConfig.value ?? {})
    );
    const galleryTabs = computed(() => [
        { value: 'gallery', label: t('dialog.gallery_icons.gallery') },
        { value: 'icons', label: t('dialog.gallery_icons.icons') },
        { value: 'emojis', label: t('dialog.gallery_icons.emojis') },
        { value: 'stickers', label: t('dialog.gallery_icons.stickers') },
        { value: 'prints', label: t('dialog.gallery_icons.prints') },
        { value: 'inventory', label: t('dialog.gallery_icons.inventory') }
    ]);

    const emojiAnimFps = ref(15);
    const emojiAnimFrameCount = ref(4);
    const emojiAnimType = ref(false);
    const emojiAnimationStyle = ref('Stop');
    const emojiAnimLoopPingPong = ref(false);

    const emojiStylePickerGroups = computed(() => [
        {
            key: 'emojiAnimationStyles',
            label: t('dialog.gallery_icons.emoji_animation_styles'),
            items: Object.entries(emojiAnimationStyleList).map(([styleName, fileName]) => ({
                value: styleName,
                label: styleName,
                search: styleName,
                fileName
            }))
        }
    ]);

    const pendingUploads = ref(0);
    const isUploading = computed(() => pendingUploads.value > 0);

    onMounted(() => {
        galleryDialogVisible.value = true;
        loadGalleryData();
    });

    onBeforeUnmount(() => {
        galleryDialogVisible.value = false;
    });

    function startUpload() {
        pendingUploads.value += 1;
    }

    function finishUpload() {
        pendingUploads.value = Math.max(0, pendingUploads.value - 1);
    }

    function goBack() {
        galleryDialogVisible.value = false;
        router.push({ name: 'tools' });
    }

    function onFileChangeGallery(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#GalleryUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        startUpload();
        const r = new FileReader();
        const handleReaderError = () => finishUpload();
        r.onerror = handleReaderError;
        r.onabort = handleReaderError;
        r.onload = function () {
            try {
                const base64Body = btoa(r.result.toString());
                const uploadPromise = vrcPlusImageRequest.uploadGalleryImage(base64Body).then((args) => {
                    handleGalleryImageAdd(args);
                    return args;
                });
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload', error);
                    })
                    .finally(() => finishUpload());
            } catch (error) {
                finishUpload();
                console.error('Failed to process image', error);
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            clearInput();
            finishUpload();
            console.error('Failed to read file', error);
        }
        clearInput();
    }

    function displayGalleryUpload() {
        document.getElementById('GalleryUploadButton').click();
    }

    function setProfilePicOverride(fileId) {
        if (!isLocalUserVrcPlusSupporter.value) {
            toast.error('VRCPlus required');
            return;
        }
        let profilePicOverride = '';
        if (fileId) {
            profilePicOverride = `${AppDebug.endpointDomain}/file/${fileId}/1`;
        }
        if (profilePicOverride === currentUser.value.profilePicOverride) {
            return;
        }
        userRequest
            .saveCurrentUser({
                profilePicOverride
            })
            .then((args) => {
                toast.success('Profile picture changed');
                return args;
            });
    }

    function compareCurrentProfilePic(fileId) {
        const currentProfilePicOverride = extractFileId(currentUser.value.profilePicOverride);
        if (fileId === currentProfilePicOverride) {
            return true;
        }
        return false;
    }

    function deleteGalleryImage(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            const array = galleryTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.fileId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }

            return args;
        });
    }

    function onFileChangeVRCPlusIcon(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#VRCPlusIconUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        startUpload();
        const r = new FileReader();
        const handleReaderError = () => finishUpload();
        r.onerror = handleReaderError;
        r.onabort = handleReaderError;
        r.onload = function () {
            try {
                const base64Body = btoa(r.result.toString());
                const uploadPromise = vrcPlusIconRequest.uploadVRCPlusIcon(base64Body).then((args) => {
                    if (Object.keys(VRCPlusIconsTable.value).length !== 0) {
                        VRCPlusIconsTable.value.unshift(args.json);
                    }
                    return args;
                });
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload VRC+ icon', error);
                    })
                    .finally(() => finishUpload());
            } catch (error) {
                finishUpload();
                console.error('Failed to process upload', error);
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            clearInput();
            finishUpload();
            console.error('Failed to read file', error);
        }
        clearInput();
    }

    function displayVRCPlusIconUpload() {
        document.getElementById('VRCPlusIconUploadButton').click();
    }

    function setVRCPlusIcon(fileId) {
        if (!isLocalUserVrcPlusSupporter.value) {
            toast.error('VRCPlus required');
            return;
        }
        let userIcon = '';
        if (fileId) {
            userIcon = `${AppDebug.endpointDomain}/file/${fileId}/1`;
        }
        if (userIcon === currentUser.value.userIcon) {
            return;
        }
        userRequest
            .saveCurrentUser({
                userIcon
            })
            .then((args) => {
                toast.success('Icon changed');
                return args;
            });
    }

    function compareCurrentVRCPlusIcon(userIcon) {
        const currentUserIcon = extractFileId(currentUser.value.userIcon);
        if (userIcon === currentUserIcon) {
            return true;
        }
        return false;
    }

    function deleteVRCPlusIcon(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            const array = VRCPlusIconsTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.fileId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }
            return args;
        });
    }

    function parseEmojiFileName(fileName) {
        // remove file extension
        fileName = fileName.replace(/\.[^/.]+$/, '');
        const array = fileName.split('_');
        for (let i = 0; i < array.length; ++i) {
            const value = array[i];
            if (value.endsWith('animationStyle')) {
                emojiAnimType.value = false;
                emojiAnimationStyle.value = value.replace('animationStyle', '').toLowerCase();
            }
            if (value.endsWith('frames')) {
                emojiAnimType.value = true;
                emojiAnimFrameCount.value = parseInt(value.replace('frames', ''));
            }
            if (value.endsWith('fps')) {
                emojiAnimFps.value = parseInt(value.replace('fps', ''));
            }
            if (value.endsWith('loopStyle')) {
                emojiAnimLoopPingPong.value = value.replace('loopStyle', '').toLowerCase();
            }
        }
    }

    function onFileChangeEmoji(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#EmojiUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        startUpload();
        // set Emoji settings from fileName
        parseEmojiFileName(file.name);
        const r = new FileReader();
        const handleReaderError = () => finishUpload();
        r.onerror = handleReaderError;
        r.onabort = handleReaderError;
        r.onload = function () {
            try {
                const params = {
                    tag: emojiAnimType.value ? 'emojianimated' : 'emoji',
                    animationStyle: emojiAnimationStyle.value.toLowerCase(),
                    maskTag: 'square'
                };
                if (emojiAnimType.value) {
                    params.frames = emojiAnimFrameCount.value;
                    params.framesOverTime = emojiAnimFps.value;
                }
                if (emojiAnimLoopPingPong.value) {
                    params.loopStyle = 'pingpong';
                }
                const base64Body = btoa(r.result.toString());
                const uploadPromise = vrcPlusImageRequest.uploadEmoji(base64Body, params).then((args) => {
                    if (Object.keys(emojiTable.value).length !== 0) {
                        emojiTable.value.unshift(args.json);
                    }
                    return args;
                });
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload', error);
                    })
                    .finally(() => finishUpload());
            } catch (error) {
                finishUpload();
                console.error('Failed to process upload', error);
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            clearInput();
            finishUpload();
            console.error('Failed to read file', error);
        }
        clearInput();
    }

    function displayEmojiUpload() {
        document.getElementById('EmojiUploadButton').click();
    }

    function deleteEmoji(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            const array = emojiTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.fileId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }
            return args;
        });
    }

    function onFileChangeSticker(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#StickerUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        startUpload();
        const r = new FileReader();
        const handleReaderError = () => finishUpload();
        r.onerror = handleReaderError;
        r.onabort = handleReaderError;
        r.onload = function () {
            try {
                const params = {
                    tag: 'sticker',
                    maskTag: 'square'
                };
                const base64Body = btoa(r.result.toString());
                const uploadPromise = vrcPlusImageRequest.uploadSticker(base64Body, params).then((args) => {
                    handleStickerAdd(args);
                    return args;
                });
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload', error);
                    })
                    .finally(() => finishUpload());
            } catch (error) {
                finishUpload();
                console.error('Failed to process upload', error);
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            clearInput();
            finishUpload();
            console.error('Failed to read file', error);
        }
        clearInput();
    }

    function displayStickerUpload() {
        document.getElementById('StickerUploadButton').click();
    }

    function deleteSticker(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            const array = stickerTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.fileId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }

            return args;
        });
    }

    function onFileChangePrint(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#PrintUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        startUpload();
        const r = new FileReader();
        const handleReaderError = () => finishUpload();
        r.onerror = handleReaderError;
        r.onabort = handleReaderError;
        r.onload = function () {
            try {
                const date = new Date();
                // why the fuck isn't this UTC
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                const timestamp = date.toISOString().slice(0, 19);
                const params = {
                    note: printUploadNote.value,
                    // worldId: '',
                    timestamp
                };
                const base64Body = btoa(r.result.toString());
                const cropWhiteBorder = printCropBorder.value;
                const uploadPromise = vrcPlusImageRequest
                    .uploadPrint(base64Body, cropWhiteBorder, params)
                    .then((args) => {
                        if (Object.keys(printTable.value).length !== 0) {
                            printTable.value.unshift(args.json);
                        }
                        return args;
                    });
                toast.promise(uploadPromise, {
                    loading: t('message.upload.loading'),
                    success: t('message.upload.success'),
                    error: t('message.upload.error')
                });
                uploadPromise
                    .catch((error) => {
                        console.error('Failed to upload', error);
                    })
                    .finally(() => finishUpload());
            } catch (error) {
                finishUpload();
                console.error('Failed to process upload', error);
            }
        };
        try {
            r.readAsBinaryString(file);
        } catch (error) {
            clearInput();
            finishUpload();
            console.error('Failed to read file', error);
        }
        clearInput();
    }

    function displayPrintUpload() {
        document.getElementById('PrintUploadButton').click();
    }

    function deletePrint(printId) {
        vrcPlusImageRequest.deletePrint(printId).then((args) => {
            const array = printTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.printId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }
        });
    }

    async function consumeInventoryBundle(inventoryId) {
        try {
            await inventoryRequest.consumeInventoryBundle({
                inventoryId
            });
            currentUserInventory.value.delete(inventoryId);
            const array = inventoryTable.value;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (inventoryId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }
            getInventory();
        } catch (error) {
            console.error('Error consuming inventory bundle:', error);
        }
        // -- response --
        // errors: []
        // inventoryItems : []
        // inventoryItemsCreated: 0
    }

    async function redeemReward() {
        modalStore
            .prompt({
                title: t('prompt.redeem.header'),
                description: t('prompt.redeem.description'),
                confirmText: t('prompt.redeem.redeem'),
                cancelText: t('prompt.redeem.cancel')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value) {
                    inventoryRequest
                        .redeemReward({
                            code: value.trim()
                        })
                        .then((args) => {
                            toast.success(t('prompt.redeem.success'));
                            getInventory();
                            return args;
                        })
                        .catch((error) => {
                            console.error('Error redeeming reward:', error);
                        });
                }
            })
            .catch(() => {});
    }
</script>

<style scoped>
    .gallery-page__header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .gallery-tab-count {
        font-size: 12px;
        margin-left: 5px;
    }

    .gallery-meta {
        font-family: monospace;
        display: block;
    }

    .gallery-meta--small {
        font-size: 11px;
    }
</style>
