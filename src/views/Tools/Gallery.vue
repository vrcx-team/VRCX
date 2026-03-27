<template>
    <div class="gallery-page x-container">
        <div class="flex items-center gap-2 ml-2">
            <Button variant="ghost" size="sm" class="mr-3" @click="goBack">
                <ArrowLeft />
                {{ t('nav_tooltip.tools') }}
            </Button>
            <span class="header">{{ t('dialog.gallery_icons.header') }}</span>
        </div>
        <TabsUnderline default-value="gallery" :items="galleryTabs" :unmount-on-hide="false">
            <template #label-gallery>
                <span>
                    {{ t('dialog.gallery_icons.gallery') }}
                    <span class="text-xs ml-[5px]"> {{ galleryTable.length }}/64 </span>
                </span>
            </template>
            <template #label-icons>
                <span>
                    {{ t('dialog.gallery_icons.icons') }}
                    <span class="text-xs ml-[5px]"> {{ VRCPlusIconsTable.length }}/64 </span>
                </span>
            </template>
            <template #label-emojis>
                <span>
                    {{ t('dialog.gallery_icons.emojis') }}
                    <span class="text-xs ml-[5px]"> {{ emojiTable.length }}/{{ cachedConfigTyped.maxUserEmoji }} </span>
                </span>
            </template>
            <template #label-stickers>
                <span>
                    {{ t('dialog.gallery_icons.stickers') }}
                    <span class="text-xs ml-[5px]">
                        {{ stickerTable.length }}/{{ cachedConfigTyped.maxUserStickers }}
                    </span>
                </span>
            </template>
            <template #label-prints>
                <span>
                    {{ t('dialog.gallery_icons.prints') }}
                    <span class="text-xs ml-[5px]"> {{ printTable.length }}/64 </span>
                </span>
            </template>
            <template #label-inventory>
                <span>
                    {{ t('dialog.gallery_icons.inventory') }}
                    <span class="text-xs ml-[5px]">
                        {{ inventoryTable.length }}
                    </span>
                </span>
            </template>
            <template #gallery>
                <div>
                    <input
                        id="GalleryUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeGallery"
                        style="display: none" />
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
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
                        <Item
                            v-for="image in galleryTable"
                            :key="image.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            :class="compareCurrentProfilePic(image.id) ? 'x-highlight-ring' : ''"
                            as-child>
                            <div
                                v-if="
                                    image.versions &&
                                    image.versions.length > 0 &&
                                    image.versions[image.versions.length - 1].file.url
                                "
                                class="overflow-hidden rounded-[inherit]">
                                <ItemHeader
                                    class="cursor-pointer"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    ">
                                    <img
                                        :src="image.versions[image.versions.length - 1].file.url"
                                        loading="lazy"
                                        class="aspect-[4/3] w-full rounded-t-md object-cover" />
                                </ItemHeader>
                                <ItemFooter class="p-2 gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        class="rounded-full text-destructive"
                                        @click="deleteGalleryImage(image.id)">
                                        <Trash2 />
                                    </Button>
                                    <Button
                                        size="icon-sm"
                                        class="rounded-full"
                                        :variant="compareCurrentProfilePic(image.id) ? 'default' : 'ghost'"
                                        @click="setProfilePicOverride(image.id)">
                                        <Check />
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>

            <template #icons>
                <div>
                    <input
                        id="VRCPlusIconUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeVRCPlusIcon"
                        style="display: none" />
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
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))">
                        <Item
                            v-for="image in VRCPlusIconsTable"
                            :key="image.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            :class="compareCurrentVRCPlusIcon(image.id) ? 'x-highlight-ring' : ''"
                            as-child>
                            <div
                                v-if="
                                    image.versions &&
                                    image.versions.length > 0 &&
                                    image.versions[image.versions.length - 1].file.url
                                "
                                class="overflow-hidden rounded-[inherit]">
                                <ItemHeader
                                    class="cursor-pointer"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    ">
                                    <img
                                        :src="image.versions[image.versions.length - 1].file.url"
                                        loading="lazy"
                                        class="aspect-square w-full rounded-t-md object-cover" />
                                </ItemHeader>
                                <ItemFooter class="p-2 gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        class="rounded-full text-destructive"
                                        @click="deleteVRCPlusIcon(image.id)">
                                        <Trash2 />
                                    </Button>
                                    <Button
                                        size="icon-sm"
                                        class="rounded-full"
                                        :variant="compareCurrentVRCPlusIcon(image.id) ? 'default' : 'ghost'"
                                        @click="setVRCPlusIcon(image.id)">
                                        <Check />
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>

            <template #emojis>
                <div>
                    <input
                        id="EmojiUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeEmoji"
                        style="display: none" />
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                            <ButtonGroup>
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
                            <div class="flex-1 min-w-0 max-w-120">
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
                            </div>
                            <label class="inline-flex items-center gap-2">
                                <Checkbox v-model="emojiAnimType" />
                                <span>{{ t('dialog.gallery_icons.emoji_animation_type') }}</span>
                            </label>
                        </div>
                        <div v-if="emojiAnimType" class="flex items-center gap-2">
                            <Button size="sm" variant="outline" @click="openExternalLink('https://vrcemoji.com')">
                                {{ t('dialog.gallery_icons.create_animated_emoji') }}
                            </Button>
                            <span class="text-sm">{{ t('dialog.gallery_icons.emoji_animation_fps') }}</span>
                            <NumberField
                                v-model="emojiAnimFps"
                                :min="1"
                                :max="64"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="w-28">
                                <NumberFieldContent>
                                    <NumberFieldDecrement />
                                    <NumberFieldInput />
                                    <NumberFieldIncrement />
                                </NumberFieldContent>
                            </NumberField>
                            <span class="text-sm">{{ t('dialog.gallery_icons.emoji_animation_frame_count') }}</span>
                            <NumberField
                                v-model="emojiAnimFrameCount"
                                :min="2"
                                :max="64"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="w-28">
                                <NumberFieldContent>
                                    <NumberFieldDecrement />
                                    <NumberFieldInput />
                                    <NumberFieldIncrement />
                                </NumberFieldContent>
                            </NumberField>
                            <label class="inline-flex items-center gap-2">
                                <Checkbox v-model="emojiAnimLoopPingPong" />
                                <span>{{ t('dialog.gallery_icons.emoji_loop_pingpong') }}</span>
                            </label>
                        </div>
                        <span v-if="emojiAnimType" class="basis-full text-sm text-muted-foreground">{{
                            t('dialog.gallery_icons.flipbook_info')
                        }}</span>
                    </div>
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))">
                        <Item
                            v-for="image in emojiTable"
                            :key="image.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            as-child>
                            <div
                                v-if="
                                    image.versions &&
                                    image.versions.length > 0 &&
                                    image.versions[image.versions.length - 1].file.url
                                "
                                class="overflow-hidden">
                                <ItemHeader
                                    class="cursor-pointer"
                                    @click="
                                        showFullscreenImageDialog(
                                            image.versions[image.versions.length - 1].file.url,
                                            getEmojiFileName(image)
                                        )
                                    ">
                                    <Emoji
                                        :imageUrl="image.versions[image.versions.length - 1].file.url"
                                        :size="200"
                                        class="aspect-square w-full rounded-t-md" />
                                </ItemHeader>
                                <ItemContent class="min-w-0 px-2.5 pt-1.5 pb-0">
                                    <ItemDescription class="text-xs flex items-center gap-1 flex-wrap">
                                        <span v-if="image.loopStyle === 'pingpong'">
                                            <RefreshCw class="size-3" />
                                        </span>
                                        <span>{{ image.animationStyle }}</span>
                                        <span v-if="image.framesOverTime">{{ image.framesOverTime }}fps</span>
                                        <span v-if="image.frames">{{ image.frames }}frames</span>
                                    </ItemDescription>
                                </ItemContent>
                                <ItemFooter class="p-2 gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        class="rounded-full text-destructive"
                                        @click="deleteEmoji(image.id)">
                                        <Trash2 />
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>

            <template #stickers>
                <div>
                    <input
                        id="StickerUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangeSticker"
                        style="display: none" />
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
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))">
                        <Item
                            v-for="image in stickerTable"
                            :key="image.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            as-child>
                            <div
                                v-if="
                                    image.versions &&
                                    image.versions.length > 0 &&
                                    image.versions[image.versions.length - 1].file.url
                                "
                                class="overflow-hidden">
                                <ItemHeader
                                    class="cursor-pointer"
                                    @click="
                                        showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)
                                    ">
                                    <img
                                        :src="image.versions[image.versions.length - 1].file.url"
                                        loading="lazy"
                                        class="aspect-square w-full rounded-t-md object-cover" />
                                </ItemHeader>
                                <ItemFooter class="p-2 gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        class="rounded-full text-destructive"
                                        @click="deleteSticker(image.id)">
                                        <Trash2 />
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>

            <template #prints>
                <div>
                    <input
                        id="PrintUploadButton"
                        type="file"
                        accept="image/*"
                        @change="onFileChangePrint"
                        style="display: none" />
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
                            :maxlength="32"
                            style="margin-left: 8px; width: 300px"
                            :placeholder="t('dialog.gallery_icons.note')"
                            input-class="resize-none min-h-0" />
                        <label class="inline-flex items-center gap-2" style="margin-left: 8px; margin-right: 8px">
                            <Checkbox v-model="printCropBorder" />
                            <span>{{ t('dialog.gallery_icons.crop_print_border') }}</span>
                        </label>
                    </div>
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))">
                        <Item
                            v-for="image in printTable"
                            :key="image.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            as-child>
                            <div class="overflow-hidden">
                                <ItemHeader
                                    class="cursor-pointer"
                                    @click="showFullscreenImageDialog(image.files.image, getPrintFileName(image))">
                                    <img
                                        :src="image.files.image"
                                        loading="lazy"
                                        class="aspect-[16/9] w-full rounded-t-md object-cover" />
                                </ItemHeader>
                                <ItemContent class="min-w-0 px-2.5 pt-1.5 pb-0">
                                    <ItemTitle v-if="image.note" class="truncate text-sm">
                                        {{ image.note }}
                                    </ItemTitle>
                                    <ItemDescription class="text-xs truncate">
                                        <Location
                                            v-if="image.worldId"
                                            :location="image.worldId"
                                            :hint="image.worldName" />
                                        <span v-else>&nbsp;</span>
                                    </ItemDescription>
                                    <ItemDescription class="text-xs truncate font-mono">
                                        <DisplayName
                                            v-if="image.authorId"
                                            :userid="image.authorId"
                                            :hint="image.authorName" />
                                        <span v-else>&nbsp;</span>
                                    </ItemDescription>
                                    <ItemDescription v-if="image.createdAt" class="text-[11px] truncate font-mono">
                                        {{ formatDateFilter(image.createdAt, 'long') }}
                                    </ItemDescription>
                                </ItemContent>
                                <ItemFooter class="p-2 gap-1">
                                    <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        class="rounded-full text-destructive"
                                        @click="deletePrint(image.id)">
                                        <Trash2 />
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>

            <template #inventory>
                <div>
                    <div class="flex items-center">
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
                    <ItemGroup
                        class="grid gap-3 mt-3"
                        style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
                        <Item
                            v-for="item in inventoryTable"
                            :key="item.id"
                            variant="outline"
                            size="sm"
                            class="p-0 x-hover-card hover:bg-accent hover:shadow-sm"
                            as-child>
                            <div class="overflow-hidden">
                                <ItemHeader class="cursor-pointer" @click="showFullscreenImageDialog(item.imageUrl)">
                                    <img
                                        :src="item.imageUrl"
                                        loading="lazy"
                                        class="aspect-square w-full rounded-t-md object-cover" />
                                </ItemHeader>
                                <ItemContent class="min-w-0 px-2.5 pt-1.5 pb-0">
                                    <ItemTitle class="truncate text-sm">
                                        {{ item.name }}
                                    </ItemTitle>
                                    <ItemDescription v-if="item.description" class="text-xs truncate">
                                        {{ item.description }}
                                    </ItemDescription>
                                    <ItemDescription class="text-[11px] truncate font-mono">
                                        {{ formatDateFilter(item.created_at, 'long') }}
                                    </ItemDescription>
                                    <ItemDescription class="text-xs">
                                        <span v-if="item.itemType === 'prop'">{{
                                            t('dialog.gallery_icons.item')
                                        }}</span>
                                        <span v-else-if="item.itemType === 'sticker'">{{
                                            t('dialog.gallery_icons.sticker')
                                        }}</span>
                                        <span v-else-if="item.itemType === 'droneskin'">{{
                                            t('dialog.gallery_icons.drone_skin')
                                        }}</span>
                                        <span v-else-if="item.itemType === 'emoji'">{{
                                            t('dialog.gallery_icons.emoji')
                                        }}</span>
                                        <span v-else v-text="item.itemTypeLabel"></span>
                                    </ItemDescription>
                                </ItemContent>
                                <ItemFooter v-if="item.itemType === 'bundle'" class="p-2">
                                    <Button size="sm" @click="consumeInventoryBundle(item.id)">
                                        {{ t('dialog.gallery_icons.consume_bundle') }}
                                    </Button>
                                </ItemFooter>
                            </div>
                        </Item>
                    </ItemGroup>
                </div>
            </template>
        </TabsUnderline>

        <ImageCropDialog
            :open="cropDialogOpen"
            :title="cropDialogTitle"
            :aspect-ratio="cropDialogAspectRatio"
            :file="cropDialogFile"
            @update:open="cropDialogOpen = $event"
            @confirm="onCropConfirm" />
    </div>
</template>

<script setup>
    import { ArrowLeft, Check, Gift, RefreshCw, Trash2, Upload, X } from 'lucide-vue-next';
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
    import { Item, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemTitle } from '@/components/ui/item';
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
    import { readFileAsBase64, withUploadTimeout } from '../../shared/utils/imageUpload';
    import { handleImageUploadInput } from '../../coordinators/imageUploadCoordinator';
    import { emojiAnimationStyleList, emojiAnimationStyleUrl } from '../../shared/constants';
    import { AppDebug } from '../../services/appConfig';

    import Emoji from '../../components/Emoji.vue';
    import ImageCropDialog from '../../components/dialogs/ImageCropDialog.vue';

    const { t } = useI18n();
    const router = useRouter();
    const modalStore = useModalStore();

    const {
        galleryTable,
        galleryDialogVisible,
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

    const cropDialogOpen = ref(false);
    const cropDialogTitle = ref('');
    const cropDialogAspectRatio = ref(4 / 3);
    const cropDialogFile = ref(null);
    const cropDialogUploadHandler = ref(null);

    onMounted(() => {
        galleryDialogVisible.value = true;
        loadGalleryData();
    });

    onBeforeUnmount(() => {
        galleryDialogVisible.value = false;
    });

    /**
     *
     */
    function startUpload() {
        pendingUploads.value += 1;
    }

    /**
     *
     */
    function finishUpload() {
        pendingUploads.value = Math.max(0, pendingUploads.value - 1);
    }

    /**
     *
     */
    function goBack() {
        galleryDialogVisible.value = false;
        router.push({ name: 'tools' });
    }

    /**
     *
     * @param {string} id
     */
    function triggerFileInput(id) {
        document.getElementById(id)?.click();
    }

    /**
     *
     * @param {Array<{ id: string }>} array
     * @param {string} itemId
     */
    function removeItemById(array, itemId) {
        const { length } = array;
        for (let i = 0; i < length; ++i) {
            if (itemId === array[i].id) {
                array.splice(i, 1);
                break;
            }
        }
    }

    /**
     *
     * @param file
     * @param title
     * @param aspectRatio
     * @param handler
     */
    function openCropDialog(file, title, aspectRatio, handler) {
        cropDialogTitle.value = title;
        cropDialogAspectRatio.value = aspectRatio;
        cropDialogFile.value = file;
        cropDialogUploadHandler.value = handler;
        cropDialogOpen.value = true;
    }

    /**
     *
     * @param blob
     */
    async function onCropConfirm(blob) {
        if (!cropDialogUploadHandler.value) {
            return;
        }
        const handler = cropDialogUploadHandler.value;
        cropDialogUploadHandler.value = null;
        cropDialogFile.value = null;
        try {
            await handler(blob);
        } finally {
            cropDialogOpen.value = false;
        }
    }

    /**
     *
     * @param {string} fileId
     * @param {Array<{ id: string }>} array
     */
    function deleteFileAndRemove(fileId, array) {
        miscRequest.deleteFile(fileId).then((args) => {
            removeItemById(array, args.fileId);
            return args;
        });
    }

    /**
     *
     * @param {string} currentUrl
     * @param {string} fileId
     * @returns {boolean}
     */
    function isCurrentFile(currentUrl, fileId) {
        return fileId === extractFileId(currentUrl);
    }

    /**
     *
     * @param {Event} e
     * @param {{
     *   inputSelector: string,
     *   aspectRatio: number,
     *   beforeCrop?: (file: File) => void,
     *   upload: (payload: { file: File, blob: Blob, base64Body: string }) => Promise<void>,
     *   errorMessage?: string
     * }} options
     */
    function openImageUploadFlow(e, { inputSelector, aspectRatio, beforeCrop, upload, errorMessage = 'Failed to upload' }) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector,
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        beforeCrop?.(file);
        clearInput();
        openCropDialog(file, t('dialog.change_content_image.upload'), aspectRatio, async (blob) => {
            startUpload();
            try {
                await withUploadTimeout(
                    (async () => {
                        const base64Body = await readFileAsBase64(blob);
                        await upload({
                            file,
                            blob,
                            base64Body
                        });
                    })()
                );
                toast.success(t('message.upload.success'));
            } catch (error) {
                console.error(errorMessage, error);
                toast.error(t('message.upload.error'));
            } finally {
                finishUpload();
            }
        });
    }

    /**
     *
     * @param e
     */
    function onFileChangeGallery(e) {
        openImageUploadFlow(e, {
            inputSelector: '#GalleryUploadButton',
            aspectRatio: 4 / 3,
            upload: async ({ base64Body }) => {
                const args = await vrcPlusImageRequest.uploadGalleryImage(base64Body);
                handleGalleryImageAdd(args);
            }
        });
    }

    /**
     *
     */
    function displayGalleryUpload() {
        triggerFileInput('GalleryUploadButton');
    }

    /**
     *
     * @param fileId
     */
    function setProfilePicOverride(fileId) {
        if (!isLocalUserVrcPlusSupporter.value) {
            toast.error(t('message.vrcplus.required'));
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
                toast.success(t('message.gallery.profile_pic_changed'));
                return args;
            });
    }

    /**
     *
     * @param fileId
     */
    function compareCurrentProfilePic(fileId) {
        return isCurrentFile(currentUser.value.profilePicOverride, fileId);
    }

    /**
     *
     * @param fileId
     */
    function deleteGalleryImage(fileId) {
        deleteFileAndRemove(fileId, galleryTable.value);
    }

    /**
     *
     * @param e
     */
    function onFileChangeVRCPlusIcon(e) {
        openImageUploadFlow(e, {
            inputSelector: '#VRCPlusIconUploadButton',
            aspectRatio: 1 / 1,
            errorMessage: 'Failed to upload VRC+ icon',
            upload: async ({ base64Body }) => {
                const args = await vrcPlusIconRequest.uploadVRCPlusIcon(base64Body);
                if (VRCPlusIconsTable.value.length > 0) {
                    VRCPlusIconsTable.value.unshift(args.json);
                }
            }
        });
    }

    /**
     *
     */
    function displayVRCPlusIconUpload() {
        triggerFileInput('VRCPlusIconUploadButton');
    }

    /**
     *
     * @param fileId
     */
    function setVRCPlusIcon(fileId) {
        if (!isLocalUserVrcPlusSupporter.value) {
            toast.error(t('message.vrcplus.required'));
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
                toast.success(t('message.gallery.profile_icon_changed'));
                return args;
            });
    }

    /**
     *
     * @param userIcon
     */
    function compareCurrentVRCPlusIcon(userIcon) {
        return isCurrentFile(currentUser.value.userIcon, userIcon);
    }

    /**
     *
     * @param fileId
     */
    function deleteVRCPlusIcon(fileId) {
        deleteFileAndRemove(fileId, VRCPlusIconsTable.value);
    }

    /**
     *
     * @param fileName
     */
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

    /**
     *
     * @param e
     */
    function onFileChangeEmoji(e) {
        openImageUploadFlow(e, {
            inputSelector: '#EmojiUploadButton',
            aspectRatio: 1 / 1,
            beforeCrop: (file) => {
                // set Emoji settings from fileName
                parseEmojiFileName(file.name);
            },
            upload: async ({ base64Body }) => {
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
                const args = await vrcPlusImageRequest.uploadEmoji(base64Body, params);
                if (emojiTable.value.length > 0) {
                    emojiTable.value.unshift(args.json);
                }
            }
        });
    }

    /**
     *
     */
    function displayEmojiUpload() {
        triggerFileInput('EmojiUploadButton');
    }

    /**
     *
     * @param fileId
     */
    function deleteEmoji(fileId) {
        deleteFileAndRemove(fileId, emojiTable.value);
    }

    /**
     *
     * @param e
     */
    function onFileChangeSticker(e) {
        openImageUploadFlow(e, {
            inputSelector: '#StickerUploadButton',
            aspectRatio: 1 / 1,
            upload: async ({ base64Body }) => {
                const params = {
                    tag: 'sticker',
                    maskTag: 'square'
                };
                const args = await vrcPlusImageRequest.uploadSticker(base64Body, params);
                handleStickerAdd(args);
            }
        });
    }

    /**
     *
     */
    function displayStickerUpload() {
        triggerFileInput('StickerUploadButton');
    }

    /**
     *
     * @param fileId
     */
    function deleteSticker(fileId) {
        deleteFileAndRemove(fileId, stickerTable.value);
    }

    /**
     *
     * @param e
     */
    function onFileChangePrint(e) {
        openImageUploadFlow(e, {
            inputSelector: '#PrintUploadButton',
            aspectRatio: 16 / 9,
            upload: async ({ base64Body }) => {
                const date = new Date();
                // why the fuck isn't this UTC
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                const timestamp = date.toISOString().slice(0, 19);
                const params = {
                    note: printUploadNote.value,
                    // worldId: '',
                    timestamp
                };
                const cropWhiteBorder = printCropBorder.value;
                const args = await vrcPlusImageRequest.uploadPrint(base64Body, cropWhiteBorder, params);
                if (printTable.value.length > 0) {
                    printTable.value.unshift(args.json);
                }
            }
        });
    }

    /**
     *
     */
    function displayPrintUpload() {
        triggerFileInput('PrintUploadButton');
    }

    /**
     *
     * @param printId
     */
    function deletePrint(printId) {
        vrcPlusImageRequest.deletePrint(printId).then((args) => {
            removeItemById(printTable.value, args.printId);
        });
    }

    /**
     *
     * @param inventoryId
     */
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

    /**
     *
     */
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
