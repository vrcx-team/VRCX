import Noty from 'noty';
import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import * as workerTimers from 'worker-timers';
import {
    inventoryRequest,
    userRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest
} from '../api';
import { $app } from '../app';
import { AppGlobal } from '../service/appConfig';
import { watchState } from '../service/watchState';
import {
    getEmojiFileName,
    getPrintFileName,
    getPrintLocalDate
} from '../shared/utils';
import { useAdvancedSettingsStore } from './settings/advanced';
import { useI18n } from 'vue-i18n-bridge';

export const useGalleryStore = defineStore('Gallery', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const { t } = useI18n();

    const state = reactive({
        galleryTable: [],
        // galleryDialog: {},
        galleryDialogVisible: false,
        galleryDialogGalleryLoading: false,
        galleryDialogIconsLoading: false,
        galleryDialogEmojisLoading: false,
        galleryDialogStickersLoading: false,
        galleryDialogPrintsLoading: false,
        galleryDialogInventoryLoading: false,
        uploadImage: '',
        VRCPlusIconsTable: [],
        printUploadNote: '',
        printCropBorder: true,
        printCache: [],
        printQueue: [],
        printQueueWorker: null,
        stickerTable: [],
        instanceStickersCache: [],
        printTable: [],
        emojiTable: [],
        inventoryTable: [],
        previousImagesDialogVisible: false,
        previousImagesTable: [],
        fullscreenImageDialog: {
            visible: false,
            imageUrl: '',
            fileName: ''
        },
        instanceInventoryCache: [],
        instanceInventoryQueue: [],
        instanceInventoryQueueWorker: null
    });

    const galleryTable = computed({
        get: () => state.galleryTable,
        set: (value) => {
            state.galleryTable = value;
        }
    });

    const galleryDialogVisible = computed({
        get: () => state.galleryDialogVisible,
        set: (value) => {
            state.galleryDialogVisible = value;
        }
    });

    const galleryDialogGalleryLoading = computed({
        get: () => state.galleryDialogGalleryLoading,
        set: (value) => {
            state.galleryDialogGalleryLoading = value;
        }
    });

    const galleryDialogIconsLoading = computed({
        get: () => state.galleryDialogIconsLoading,
        set: (value) => {
            state.galleryDialogIconsLoading = value;
        }
    });

    const galleryDialogEmojisLoading = computed({
        get: () => state.galleryDialogEmojisLoading,
        set: (value) => {
            state.galleryDialogEmojisLoading = value;
        }
    });

    const galleryDialogStickersLoading = computed({
        get: () => state.galleryDialogStickersLoading,
        set: (value) => {
            state.galleryDialogStickersLoading = value;
        }
    });

    const galleryDialogPrintsLoading = computed({
        get: () => state.galleryDialogPrintsLoading,
        set: (value) => {
            state.galleryDialogPrintsLoading = value;
        }
    });

    const galleryDialogInventoryLoading = computed({
        get: () => state.galleryDialogInventoryLoading,
        set: (value) => {
            state.galleryDialogInventoryLoading = value;
        }
    });

    const uploadImage = computed({
        get: () => state.uploadImage,
        set: (value) => {
            state.uploadImage = value;
        }
    });

    const VRCPlusIconsTable = computed({
        get: () => state.VRCPlusIconsTable,
        set: (value) => {
            state.VRCPlusIconsTable = value;
        }
    });

    const printUploadNote = computed({
        get: () => state.printUploadNote,
        set: (value) => {
            state.printUploadNote = value;
        }
    });

    const printCropBorder = computed({
        get: () => state.printCropBorder,
        set: (value) => {
            state.printCropBorder = value;
        }
    });

    const stickerTable = computed({
        get: () => state.stickerTable,
        set: (value) => {
            state.stickerTable = value;
        }
    });

    const instanceStickersCache = computed({
        get: () => state.instanceStickersCache,
        set: (value) => {
            state.instanceStickersCache = value;
        }
    });

    const printTable = computed({
        get: () => state.printTable,
        set: (value) => {
            state.printTable = value;
        }
    });

    const emojiTable = computed({
        get: () => state.emojiTable,
        set: (value) => {
            state.emojiTable = value;
        }
    });

    const inventoryTable = computed({
        get: () => state.inventoryTable,
        set: (value) => {
            state.inventoryTable = value;
        }
    });

    const previousImagesDialogVisible = computed({
        get: () => state.previousImagesDialogVisible,
        set: (value) => {
            state.previousImagesDialogVisible = value;
        }
    });

    const previousImagesTable = computed({
        get: () => state.previousImagesTable,
        set: (value) => {
            state.previousImagesTable = value;
        }
    });

    const fullscreenImageDialog = computed({
        get: () => state.fullscreenImageDialog,
        set: (value) => {
            state.fullscreenImageDialog = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.previousImagesTable = [];
            state.galleryTable = [];
            state.VRCPlusIconsTable = [];
            state.stickerTable = [];
            state.printTable = [];
            state.emojiTable = [];
            state.galleryDialogVisible = false;
            state.previousImagesDialogVisible = false;
            state.fullscreenImageDialog.visible = false;
            if (isLoggedIn) {
                tryDeleteOldPrints();
            }
        },
        { flush: 'sync' }
    );

    function handleFilesList(args) {
        if (args.params.tag === 'gallery') {
            state.galleryTable = args.json.reverse();
        }
        if (args.params.tag === 'icon') {
            state.VRCPlusIconsTable = args.json.reverse();
        }
        if (args.params.tag === 'sticker') {
            state.stickerTable = args.json.reverse();
            state.galleryDialogStickersLoading = false;
        }
        if (args.params.tag === 'emoji') {
            state.emojiTable = args.json.reverse();
            state.galleryDialogEmojisLoading = false;
        }
    }

    function handleGalleryImageAdd(args) {
        if (Object.keys(state.galleryTable).length !== 0) {
            state.galleryTable.unshift(args.json);
        }
    }

    function showGalleryDialog() {
        state.galleryDialogVisible = true;
        refreshGalleryTable();
        refreshVRCPlusIconsTable();
        refreshEmojiTable();
        refreshStickerTable();
        refreshPrintTable();
        getInventory();
    }

    function refreshGalleryTable() {
        state.galleryDialogGalleryLoading = true;
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
                state.galleryDialogGalleryLoading = false;
            });
    }

    function refreshVRCPlusIconsTable() {
        state.galleryDialogIconsLoading = true;
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
                state.galleryDialogIconsLoading = false;
            });
    }

    function inviteImageUpload(e) {
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $app.$message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearInviteImageUpload();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $app.$message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearInviteImageUpload();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            state.uploadImage = btoa(r.result);
        };
        r.readAsBinaryString(files[0]);
    }

    function clearInviteImageUpload() {
        const buttonList = document.querySelectorAll(
            '.inviteImageUploadButton'
        );
        buttonList.forEach((button) => (button.value = ''));
        state.uploadImage = '';
    }

    function refreshStickerTable() {
        state.galleryDialogStickersLoading = true;
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
                state.galleryDialogStickersLoading = false;
            });
    }

    function handleStickerAdd(args) {
        if (Object.keys(state.stickerTable).length !== 0) {
            state.stickerTable.unshift(args.json);
        }
    }

    async function trySaveStickerToFile(displayName, userId, inventoryId) {
        if (state.instanceStickersCache.includes(inventoryId)) {
            return;
        }
        state.instanceStickersCache.push(inventoryId);
        if (state.instanceStickersCache.size > 100) {
            state.instanceStickersCache.shift();
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
        state.galleryDialogPrintsLoading = true;
        const params = {
            n: 100
        };
        try {
            const args = await vrcPlusImageRequest.getPrints(params);
            args.json.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            state.printTable = args.json;
        } catch (error) {
            console.error('Error fetching prints:', error);
        } finally {
            state.galleryDialogPrintsLoading = false;
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
        state.galleryDialogEmojisLoading = true;
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
                state.galleryDialogEmojisLoading = false;
            });
    }

    async function getInventory() {
        state.inventoryTable = [];
        advancedSettingsStore.currentUserInventory.clear();
        const params = {
            n: 100,
            offset: 0,
            order: 'newest'
        };
        state.galleryDialogInventoryLoading = true;
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
                        state.inventoryTable.push(item);
                    }
                }
                if (args.json.data.length === 0) {
                    break;
                }
            }
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        } finally {
            state.galleryDialogInventoryLoading = false;
        }
    }

    async function tryDeleteOldPrints() {
        if (!advancedSettingsStore.autoDeleteOldPrints) {
            return;
        }
        await refreshPrintTable();
        const printLimit = 64 - 2; // 2 reserved for new prints
        const printCount = state.printTable.length;
        if (printCount <= printLimit) {
            return;
        }
        const deleteCount = printCount - printLimit;
        if (deleteCount <= 0) {
            return;
        }
        const idList = [];
        for (let i = 0; i < deleteCount; i++) {
            const print = state.printTable[printCount - 1 - i];
            idList.push(print.id);
        }
        console.log(`Deleting ${deleteCount} old prints`, idList);
        try {
            for (const printId of idList) {
                await vrcPlusImageRequest.deletePrint(printId);
                const text = `Old print automatically deleted: ${printId}`;
                if (AppGlobal.errorNoty) {
                    AppGlobal.errorNoty.close();
                }
                AppGlobal.errorNoty = new Noty({
                    type: 'info',
                    text
                }).show();
            }
        } catch (err) {
            console.error('Failed to delete old print:', err);
        }
        await refreshPrintTable();
    }

    async function checkPreviousImageAvailable(images) {
        state.previousImagesTable = [];
        for (const image of images) {
            if (image.file && image.file.url) {
                const response = await fetch(image.file.url, {
                    method: 'HEAD',
                    redirect: 'follow'
                }).catch((error) => {
                    console.error('Failed to check image availability:', error);
                    return null;
                });
                if (response && response.status === 200) {
                    state.previousImagesTable.push(image);
                }
            }
        }
    }

    function showFullscreenImageDialog(imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = state.fullscreenImageDialog;
        D.imageUrl = imageUrl;
        D.fileName = fileName;
        D.visible = true;
    }

    function queueCheckInstanceInventory(inventoryId, userId) {
        if (
            state.instanceInventoryCache.includes(inventoryId) ||
            state.instanceStickersCache.includes(inventoryId)
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
        previousImagesDialogVisible,
        previousImagesTable,
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
        checkPreviousImageAvailable,
        showFullscreenImageDialog,
        handleStickerAdd,
        handleGalleryImageAdd,
        handleFilesList,
        queueCheckInstanceInventory
    };
});
