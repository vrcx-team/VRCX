import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';

import Noty from 'noty';

import {
    inventoryRequest,
    userRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest
} from '../api';
import {
    getEmojiFileName,
    getPrintFileName,
    getPrintLocalDate
} from '../shared/utils';
import { AppDebug } from '../service/appConfig';
import { handleImageUploadInput } from '../shared/utils/imageUpload';
import { useAdvancedSettingsStore } from './settings/advanced';
import { watchState } from '../service/watchState';

import * as workerTimers from 'worker-timers';

export const useGalleryStore = defineStore('Gallery', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const { t } = useI18n();

    const state = reactive({
        printCache: [],
        printQueue: [],
        printQueueWorker: null,
        instanceInventoryCache: [],
        instanceInventoryQueue: [],
        instanceInventoryQueueWorker: null
    });

    const galleryTable = ref([]);

    const galleryDialogVisible = ref(false);

    const galleryDialogGalleryLoading = ref(false);

    const galleryDialogIconsLoading = ref(false);

    const galleryDialogEmojisLoading = ref(false);

    const galleryDialogStickersLoading = ref(false);

    const galleryDialogPrintsLoading = ref(false);

    const galleryDialogInventoryLoading = ref(false);

    const uploadImage = ref('');

    const VRCPlusIconsTable = ref([]);

    const printUploadNote = ref('');

    const printCropBorder = ref(true);

    const stickerTable = ref([]);

    const instanceStickersCache = ref([]);

    const printTable = ref([]);

    const emojiTable = ref([]);

    const inventoryTable = ref([]);

    const fullscreenImageDialog = ref({
        visible: false,
        imageUrl: '',
        fileName: ''
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            galleryTable.value = [];
            VRCPlusIconsTable.value = [];
            stickerTable.value = [];
            printTable.value = [];
            emojiTable.value = [];
            galleryDialogVisible.value = false;
            fullscreenImageDialog.value.visible = false;
            if (isLoggedIn) {
                tryDeleteOldPrints();
            }
        },
        { flush: 'sync' }
    );

    function handleFilesList(args) {
        if (args.params.tag === 'gallery') {
            galleryTable.value = args.json.reverse();
        }
        if (args.params.tag === 'icon') {
            VRCPlusIconsTable.value = args.json.reverse();
        }
        if (args.params.tag === 'sticker') {
            stickerTable.value = args.json.reverse();
            galleryDialogStickersLoading.value = false;
        }
        if (args.params.tag === 'emoji') {
            emojiTable.value = args.json.reverse();
            galleryDialogEmojisLoading.value = false;
        }
    }

    function handleGalleryImageAdd(args) {
        if (Object.keys(galleryTable.value).length !== 0) {
            galleryTable.value.unshift(args.json);
        }
    }

    function showGalleryDialog() {
        galleryDialogVisible.value = true;
        refreshGalleryTable();
        refreshVRCPlusIconsTable();
        refreshEmojiTable();
        refreshStickerTable();
        refreshPrintTable();
        getInventory();
    }

    function refreshGalleryTable() {
        galleryDialogGalleryLoading.value = true;
        const params = {
            n: 100,
            tag: 'gallery'
        };
        vrcPlusIconRequest
            .getFileList(params)
            .then((args) => handleFilesList(args))
            .catch((error) => {
                console.error('Error fetching gallery files:', error);
            })
            .finally(() => {
                galleryDialogGalleryLoading.value = false;
            });
    }

    function refreshVRCPlusIconsTable() {
        galleryDialogIconsLoading.value = true;
        const params = {
            n: 100,
            tag: 'icon'
        };
        vrcPlusIconRequest
            .getFileList(params)
            .then((args) => handleFilesList(args))
            .catch((error) => {
                console.error('Error fetching VRC Plus icons:', error);
            })
            .finally(() => {
                galleryDialogIconsLoading.value = false;
            });
    }

    function inviteImageUpload(e) {
        const { file } = handleImageUploadInput(e, {
            inputSelector: null,
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image'),
            onClear: clearInviteImageUpload
        });
        if (!file) {
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            uploadImage.value = btoa(r.result);
        };
        r.readAsBinaryString(file);
    }

    function clearInviteImageUpload() {
        const buttonList = document.querySelectorAll(
            '.inviteImageUploadButton'
        );
        buttonList.forEach((button) => (button.value = ''));
        uploadImage.value = '';
    }

    function refreshStickerTable() {
        galleryDialogStickersLoading.value = true;
        const params = {
            n: 100,
            tag: 'sticker'
        };
        vrcPlusIconRequest
            .getFileList(params)
            .then((args) => handleFilesList(args))
            .catch((error) => {
                console.error('Error fetching stickers:', error);
            })
            .finally(() => {
                galleryDialogStickersLoading.value = false;
            });
    }

    function handleStickerAdd(args) {
        if (Object.keys(stickerTable.value).length !== 0) {
            stickerTable.value.unshift(args.json);
        }
    }

    async function trySaveStickerToFile(displayName, userId, inventoryId) {
        if (instanceStickersCache.value.includes(inventoryId)) {
            return;
        }
        instanceStickersCache.value.push(inventoryId);
        if (instanceStickersCache.value.size > 100) {
            instanceStickersCache.value.shift();
        }
        const args = await inventoryRequest.getUserInventoryItem({
            inventoryId,
            userId
        });

        if (
            args.json.itemType !== 'sticker' ||
            !args.json.flags.includes('ugc')
        ) {
            // Not a sticker or ugc, skipping
            return;
        }
        const imageUrl = args.json.metadata?.imageUrl ?? args.json.imageUrl;
        const createdAt = args.json.created_at;
        const monthFolder = createdAt.slice(0, 7);
        const fileNameDate = createdAt
            .replace(/:/g, '-')
            .replace(/T/g, '_')
            .replace(/Z/g, '');
        const fileName = `${displayName}_${fileNameDate}_${inventoryId}.png`;
        const filePath = await AppApi.SaveStickerToFile(
            imageUrl,
            advancedSettingsStore.ugcFolderPath,
            monthFolder,
            fileName
        );
        if (filePath) {
            console.log(`Sticker saved to file: ${monthFolder}\\${fileName}`);
        }
    }

    async function refreshPrintTable() {
        galleryDialogPrintsLoading.value = true;
        const params = {
            n: 100
        };
        try {
            const args = await vrcPlusImageRequest.getPrints(params);
            args.json.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            printTable.value = args.json;
        } catch (error) {
            console.error('Error fetching prints:', error);
        } finally {
            galleryDialogPrintsLoading.value = false;
        }
    }

    function queueSavePrintToFile(printId) {
        if (state.printCache.includes(printId)) {
            return;
        }
        state.printCache.push(printId);
        if (state.printCache.length > 100) {
            state.printCache.shift();
        }

        state.printQueue.push(printId);

        if (!state.printQueueWorker) {
            state.printQueueWorker = workerTimers.setInterval(() => {
                const printId = state.printQueue.shift();
                if (printId) {
                    trySavePrintToFile(printId);
                }
            }, 2_500);
        }
    }

    async function trySavePrintToFile(printId) {
        const args = await vrcPlusImageRequest.getPrint({ printId });
        const imageUrl = args.json?.files?.image;
        if (!imageUrl) {
            console.error('Print image URL is missing', args);
            return;
        }
        const print = args.json;
        const createdAt = getPrintLocalDate(print);
        try {
            const owner = await userRequest.getCachedUser({
                userId: print.ownerId
            });
            console.log(
                `Print spawned by ${owner?.json?.displayName} id:${print.id} note:${print.note} authorName:${print.authorName} at:${new Date().toISOString()}`
            );
        } catch (err) {
            console.error(err);
        }
        const monthFolder = createdAt.toISOString().slice(0, 7);
        const fileName = getPrintFileName(print);
        const filePath = await AppApi.SavePrintToFile(
            imageUrl,
            advancedSettingsStore.ugcFolderPath,
            monthFolder,
            fileName
        );
        if (filePath) {
            console.log(`Print saved to file: ${monthFolder}\\${fileName}`);
            if (advancedSettingsStore.cropInstancePrints) {
                if (!(await AppApi.CropPrintImage(filePath))) {
                    console.error('Failed to crop print image');
                }
            }
        }

        if (state.printQueue.length === 0) {
            workerTimers.clearInterval(state.printQueueWorker);
            state.printQueueWorker = null;
        }
    }

    // #endregion
    // #region | Emoji

    function refreshEmojiTable() {
        galleryDialogEmojisLoading.value = true;
        const params = {
            n: 100,
            tag: 'emoji'
        };
        vrcPlusIconRequest
            .getFileList(params)
            .then((args) => handleFilesList(args))
            .catch((error) => {
                console.error('Error fetching emojis:', error);
            })
            .finally(() => {
                galleryDialogEmojisLoading.value = false;
            });
    }

    async function getInventory() {
        inventoryTable.value = [];
        advancedSettingsStore.currentUserInventory.clear();
        const params = {
            n: 100,
            offset: 0,
            order: 'newest'
        };
        galleryDialogInventoryLoading.value = true;
        try {
            for (let i = 0; i < 100; i++) {
                params.offset = i * params.n;
                const args = await inventoryRequest.getInventoryItems(params);
                for (const item of args.json.data) {
                    advancedSettingsStore.currentUserInventory.set(
                        item.id,
                        item
                    );
                    if (!item.flags.includes('ugc')) {
                        inventoryTable.value.push(item);
                    }
                }
                if (args.json.data.length === 0) {
                    break;
                }
            }
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        } finally {
            galleryDialogInventoryLoading.value = false;
        }
    }

    async function tryDeleteOldPrints() {
        if (!advancedSettingsStore.autoDeleteOldPrints) {
            return;
        }
        await refreshPrintTable();
        const printLimit = 64 - 2; // 2 reserved for new prints
        const printCount = printTable.value.length;
        if (printCount <= printLimit) {
            return;
        }
        const deleteCount = printCount - printLimit;
        if (deleteCount <= 0) {
            return;
        }
        const idList = [];
        for (let i = 0; i < deleteCount; i++) {
            const print = printTable.value[printCount - 1 - i];
            idList.push(print.id);
        }
        console.log(`Deleting ${deleteCount} old prints`, idList);
        try {
            for (const printId of idList) {
                await vrcPlusImageRequest.deletePrint(printId);
                const text = `Old print automatically deleted: ${printId}`;
                if (AppDebug.errorNoty) {
                    AppDebug.errorNoty.close();
                }
                AppDebug.errorNoty = new Noty({
                    type: 'info',
                    text
                }).show();
            }
        } catch (err) {
            console.error('Failed to delete old print:', err);
        }
        await refreshPrintTable();
    }

    function showFullscreenImageDialog(imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = fullscreenImageDialog.value;
        D.imageUrl = imageUrl;
        D.fileName = fileName;
        D.visible = true;
    }

    function queueCheckInstanceInventory(inventoryId, userId) {
        if (
            state.instanceInventoryCache.includes(inventoryId) ||
            instanceStickersCache.value.includes(inventoryId)
        ) {
            return;
        }
        state.instanceInventoryCache.push(inventoryId);
        if (state.instanceInventoryCache.length > 100) {
            state.instanceInventoryCache.shift();
        }

        state.instanceInventoryQueue.push({ inventoryId, userId });

        if (!state.instanceInventoryQueueWorker) {
            state.instanceInventoryQueueWorker = workerTimers.setInterval(
                () => {
                    const item = state.instanceInventoryQueue.shift();
                    if (item?.inventoryId) {
                        trySaveEmojiToFile(item.inventoryId, item.userId);
                    }
                },
                2_500
            );
        }
    }

    async function trySaveEmojiToFile(inventoryId, userId) {
        const args = await inventoryRequest.getUserInventoryItem({
            inventoryId,
            userId
        });

        if (
            args.json.itemType !== 'emoji' ||
            !args.json.flags.includes('ugc')
        ) {
            // Not an emoji or ugc, skipping
            return;
        }

        const userArgs = await userRequest.getCachedUser({
            userId: args.json.holderId
        });
        const displayName = userArgs.json?.displayName ?? '';

        const emoji = args.json.metadata;
        emoji.name = `${displayName}_${inventoryId}`;

        const emojiFileName = getEmojiFileName(emoji);
        const imageUrl = args.json.metadata?.imageUrl ?? args.json.imageUrl;
        const createdAt = args.json.created_at;
        const monthFolder = createdAt.slice(0, 7);

        const filePath = await AppApi.SaveEmojiToFile(
            imageUrl,
            advancedSettingsStore.ugcFolderPath,
            monthFolder,
            emojiFileName
        );
        if (filePath) {
            console.log(
                `Emoji saved to file: ${monthFolder}\\${emojiFileName}`
            );
        }

        if (state.instanceInventoryQueue.length === 0) {
            workerTimers.clearInterval(state.instanceInventoryQueueWorker);
            state.instanceInventoryQueueWorker = null;
        }
    }

    return {
        state,

        galleryTable,
        galleryDialogVisible,
        galleryDialogGalleryLoading,
        galleryDialogIconsLoading,
        galleryDialogEmojisLoading,
        galleryDialogStickersLoading,
        galleryDialogPrintsLoading,
        galleryDialogInventoryLoading,
        uploadImage,
        VRCPlusIconsTable,
        printUploadNote,
        printCropBorder,
        stickerTable,
        instanceStickersCache,
        printTable,
        emojiTable,
        inventoryTable,
        fullscreenImageDialog,

        showGalleryDialog,
        refreshGalleryTable,
        refreshVRCPlusIconsTable,
        inviteImageUpload,
        clearInviteImageUpload,
        refreshStickerTable,
        trySaveStickerToFile,
        refreshPrintTable,
        queueSavePrintToFile,
        refreshEmojiTable,
        getInventory,
        tryDeleteOldPrints,
        showFullscreenImageDialog,
        handleStickerAdd,
        handleGalleryImageAdd,
        handleFilesList,
        queueCheckInstanceInventory
    };
});
