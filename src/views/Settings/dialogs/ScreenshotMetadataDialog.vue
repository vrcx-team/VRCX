<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="screenshotMetadataDialog.visible"
        :title="t('dialog.screenshot_metadata.header')"
        width="1050px"
        top="10vh">
        <div
            v-if="screenshotMetadataDialog.visible"
            v-loading="screenshotMetadataDialog.loading"
            style="-webkit-app-region: drag"
            @dragover.prevent
            @dragenter.prevent
            @drop="handleDrop">
            <span style="margin-left: 5px; color: #909399; font-family: monospace">{{
                t('dialog.screenshot_metadata.drag')
            }}</span>
            <br />
            <br />
            <el-button size="small" icon="el-icon-folder-opened" @click="getAndDisplayScreenshotFromFile">{{
                t('dialog.screenshot_metadata.browse')
            }}</el-button>
            <el-button size="small" icon="el-icon-picture-outline" @click="getAndDisplayLastScreenshot">{{
                t('dialog.screenshot_metadata.last_screenshot')
            }}</el-button>
            <el-button
                size="small"
                icon="el-icon-copy-document"
                @click="copyImageToClipboard(screenshotMetadataDialog.metadata.filePath)"
                >{{ t('dialog.screenshot_metadata.copy_image') }}</el-button
            >
            <el-button
                size="small"
                icon="el-icon-folder"
                @click="openImageFolder(screenshotMetadataDialog.metadata.filePath)"
                >{{ t('dialog.screenshot_metadata.open_folder') }}</el-button
            >
            <el-button
                v-if="currentUser.$isVRCPlus && screenshotMetadataDialog.metadata.filePath"
                size="small"
                icon="el-icon-upload2"
                @click="uploadScreenshotToGallery"
                >{{ t('dialog.screenshot_metadata.upload') }}</el-button
            >
            <br />
            <br />

            <!-- Search bar input -->
            <el-input
                v-model="screenshotMetadataDialog.search"
                size="small"
                placeholder="Search"
                clearable
                style="width: 200px"
                @input="screenshotMetadataSearch" />
            <!-- Search type dropdown -->
            <el-select
                v-model="screenshotMetadataDialog.searchType"
                size="small"
                placeholder="Search Type"
                style="width: 150px; margin-left: 10px"
                @change="screenshotMetadataSearch">
                <el-option
                    v-for="type in screenshotMetadataDialog.searchTypes"
                    :key="type"
                    :label="type"
                    :value="type" />
            </el-select>
            <!-- Search index/total label -->
            <template v-if="screenshotMetadataDialog.searchIndex !== null">
                <span style="white-space: pre-wrap; font-size: 12px; margin-left: 10px">{{
                    screenshotMetadataDialog.searchIndex + 1 + '/' + screenshotMetadataDialog.searchResults.length
                }}</span>
            </template>
            <br />
            <br />
            <span v-text="screenshotMetadataDialog.metadata.fileName"></span>
            <br />
            <template v-if="screenshotMetadataDialog.metadata.note">
                <span v-text="screenshotMetadataDialog.metadata.note"></span>
                <br />
            </template>
            <span v-if="screenshotMetadataDialog.metadata.dateTime" style="margin-right: 5px">{{
                formatDateFilter(screenshotMetadataDialog.metadata.dateTime, 'long')
            }}</span>
            <span
                v-if="screenshotMetadataDialog.metadata.fileResolution"
                style="margin-right: 5px"
                v-text="screenshotMetadataDialog.metadata.fileResolution"></span>
            <el-tag v-if="screenshotMetadataDialog.metadata.fileSize" type="info" effect="plain" size="mini">{{
                screenshotMetadataDialog.metadata.fileSize
            }}</el-tag>
            <br />
            <Location
                v-if="screenshotMetadataDialog.metadata.world"
                :location="screenshotMetadataDialog.metadata.world.instanceId"
                :hint="screenshotMetadataDialog.metadata.world.name" />
            <DisplayName
                v-if="screenshotMetadataDialog.metadata.author"
                :userid="screenshotMetadataDialog.metadata.author.id"
                :hint="screenshotMetadataDialog.metadata.author.displayName"
                style="color: #909399; font-family: monospace" />
            <br />
            <el-carousel
                ref="screenshotMetadataCarouselRef"
                :interval="0"
                :initial-index="1"
                indicator-position="none"
                arrow="always"
                height="600px"
                style="margin-top: 10px"
                @change="screenshotMetadataCarouselChange">
                <el-carousel-item>
                    <span placement="top" width="700px" trigger="click">
                        <img
                            slot="reference"
                            class="x-link"
                            :src="screenshotMetadataDialog.metadata.previousFilePath"
                            style="width: 100%; height: 100%; object-fit: contain" />
                    </span>
                </el-carousel-item>
                <el-carousel-item>
                    <span
                        placement="top"
                        width="700px"
                        trigger="click"
                        @click="showFullscreenImageDialog(screenshotMetadataDialog.metadata.filePath)">
                        <img
                            slot="reference"
                            class="x-link"
                            :src="screenshotMetadataDialog.metadata.filePath"
                            style="width: 100%; height: 100%; object-fit: contain" />
                    </span>
                </el-carousel-item>
                <el-carousel-item>
                    <span placement="top" width="700px" trigger="click">
                        <img
                            slot="reference"
                            class="x-link"
                            :src="screenshotMetadataDialog.metadata.nextFilePath"
                            style="width: 100%; height: 100%; object-fit: contain" />
                    </span>
                </el-carousel-item>
            </el-carousel>
            <br />
            <template v-if="screenshotMetadataDialog.metadata.error">
                <pre
                    style="white-space: pre-wrap; font-size: 12px"
                    v-text="screenshotMetadataDialog.metadata.error"></pre>
                <br />
            </template>
            <span v-for="user in screenshotMetadataDialog.metadata.players" :key="user.id" style="margin-top: 5px">
                <span class="x-link" @click="lookupUser(user)" v-text="user.displayName"></span>
                <span
                    v-if="user.pos"
                    style="margin-left: 5px; color: #909399; font-family: monospace"
                    v-text="'(' + user.pos.x + ', ' + user.pos.y + ', ' + user.pos.z + ')'"></span>
                <br />
            </span>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { vrcPlusImageRequest } from '../../../api';
    import { useGalleryStore, useUserStore, useVrcxStore } from '../../../stores';
    import { formatDateFilter } from '../../../shared/utils';

    const { showFullscreenImageDialog, handleGalleryImageAdd } = useGalleryStore();
    const { currentlyDroppingFile } = storeToRefs(useVrcxStore());
    const { currentUser } = storeToRefs(useUserStore());

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const userStore = useUserStore();
    const { lookupUser } = userStore;

    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    const props = defineProps({
        screenshotMetadataDialog: {
            type: Object,
            required: true
        }
    });

    watch(
        () => props.screenshotMetadataDialog.visible,
        (newVal) => {
            if (newVal) {
                if (!props.screenshotMetadataDialog.metadata.filePath) {
                    getAndDisplayLastScreenshot();
                }
                window.addEventListener('keyup', handleComponentKeyup);
            } else {
                window.removeEventListener('keyup', handleComponentKeyup);
            }
        }
    );

    const screenshotMetadataSearchInputs = ref(0);
    const screenshotMetadataCarouselRef = ref(null);

    const handleComponentKeyup = (event) => {
        const carouselNavigation = { ArrowLeft: 0, ArrowRight: 2 }[event.key];
        if (typeof carouselNavigation !== 'undefined' && props.screenshotMetadataDialog?.visible) {
            screenshotMetadataCarouselChange(carouselNavigation);
        }
    };

    function handleDrop(event) {
        if (currentlyDroppingFile.value === null) {
            return;
        }
        console.log('Dropped file into viewer: ', currentlyDroppingFile.value);

        screenshotMetadataResetSearch();
        getAndDisplayScreenshot(currentlyDroppingFile.value);

        event.preventDefault();
    }

    async function getAndDisplayScreenshotFromFile() {
        let filePath = '';
        // eslint-disable-next-line no-undef
        if (LINUX) {
            filePath = await window.electron.openFileDialog(); // PNG filter is applied in main.js
        } else {
            filePath = await AppApi.OpenFileSelectorDialog(
                await AppApi.GetVRChatPhotosLocation(),
                '.png',
                'PNG Files (*.png)|*.png'
            );
        }

        if (filePath === '') {
            return;
        }

        screenshotMetadataResetSearch();
        getAndDisplayScreenshot(filePath);
    }

    function getAndDisplayLastScreenshot() {
        screenshotMetadataResetSearch();
        AppApi.GetLastScreenshot().then((path) => {
            if (!path) {
                return;
            }
            getAndDisplayScreenshot(path);
        });
    }

    function copyImageToClipboard(path) {
        if (!path) {
            return;
        }
        AppApi.CopyImageToClipboard(path).then(() => {
            $message({
                message: 'Image copied to clipboard',
                type: 'success'
            });
        });
    }
    function openImageFolder(path) {
        if (!path) {
            return;
        }
        AppApi.OpenFolderAndSelectItem(path).then(() => {
            $message({
                message: 'Opened image folder',
                type: 'success'
            });
        });
    }
    function uploadScreenshotToGallery() {
        const D = props.screenshotMetadataDialog;
        if (D.metadata.fileSizeBytes > 10000000) {
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            return;
        }
        D.isUploading = true;
        AppApi.GetFileBase64(D.metadata.filePath)
            .then((base64Body) => {
                vrcPlusImageRequest
                    .uploadGalleryImage(base64Body)
                    .then((args) => {
                        handleGalleryImageAdd(args);
                        $message({
                            message: t('message.gallery.uploaded'),
                            type: 'success'
                        });
                        return args;
                    })
                    .finally(() => {
                        D.isUploading = false;
                    });
            })
            .catch((err) => {
                $message({
                    message: t('message.gallery.failed'),
                    type: 'error'
                });
                console.error(err);
                D.isUploading = false;
            });
    }
    function screenshotMetadataSearch() {
        const D = props.screenshotMetadataDialog;

        // Don't search if user is still typing
        screenshotMetadataSearchInputs.value++;
        let current = screenshotMetadataSearchInputs.value;
        setTimeout(() => {
            if (current !== screenshotMetadataSearchInputs.value) {
                return;
            }
            screenshotMetadataSearchInputs.value = 0;

            if (D.search === '') {
                screenshotMetadataResetSearch();
                if (D.metadata.filePath !== null) {
                    // Re-retrieve the current screenshot metadata and get previous/next files for regular carousel directory navigation
                    getAndDisplayScreenshot(D.metadata.filePath, true);
                }
                return;
            }

            const searchType = D.searchTypes.indexOf(D.searchType); // Matches the search type enum in .NET
            D.loading = true;
            AppApi.FindScreenshotsBySearch(D.search, searchType)
                .then((json) => {
                    const results = JSON.parse(json);

                    if (results.length === 0) {
                        D.metadata = {};
                        D.metadata.error = 'No results found';

                        D.searchIndex = null;
                        D.searchResults = null;
                        return;
                    }

                    D.searchIndex = 0;
                    D.searchResults = results;

                    // console.log("Search results", results)
                    getAndDisplayScreenshot(results[0], false);
                })
                .finally(() => {
                    D.loading = false;
                });
        }, 500);
    }

    function screenshotMetadataCarouselChange(index) {
        const D = props.screenshotMetadataDialog;
        const searchIndex = D.searchIndex;

        if (searchIndex !== null) {
            screenshotMetadataCarouselChangeSearch(index);
            return;
        }

        if (index === 0) {
            if (D.metadata.previousFilePath) {
                getAndDisplayScreenshot(D.metadata.previousFilePath);
            } else {
                getAndDisplayScreenshot(D.metadata.filePath);
            }
        }
        if (index === 2) {
            if (D.metadata.nextFilePath) {
                getAndDisplayScreenshot(D.metadata.nextFilePath);
            } else {
                getAndDisplayScreenshot(D.metadata.filePath);
            }
        }
        if (typeof screenshotMetadataCarouselRef.value !== 'undefined') {
            screenshotMetadataCarouselRef.value.setActiveItem(1);
        }

        if (fullscreenImageDialog.value.visible) {
            // TODO
        }
    }

    function screenshotMetadataResetSearch() {
        const D = props.screenshotMetadataDialog;

        D.search = '';
        D.searchIndex = null;
        D.searchResults = null;
    }

    function screenshotMetadataCarouselChangeSearch(index) {
        const D = props.screenshotMetadataDialog;
        let searchIndex = D.searchIndex;
        const filesArr = D.searchResults;

        if (searchIndex === null) {
            return;
        }

        if (index === 0) {
            if (searchIndex > 0) {
                getAndDisplayScreenshot(filesArr[searchIndex - 1], false);
                searchIndex--;
            } else {
                getAndDisplayScreenshot(filesArr[filesArr.length - 1], false);
                searchIndex = filesArr.length - 1;
            }
        } else if (index === 2) {
            if (searchIndex < filesArr.length - 1) {
                getAndDisplayScreenshot(filesArr[searchIndex + 1], false);
                searchIndex++;
            } else {
                getAndDisplayScreenshot(filesArr[0], false);
                searchIndex = 0;
            }
        }

        if (typeof screenshotMetadataCarouselRef.value !== 'undefined') {
            screenshotMetadataCarouselRef.value.setActiveItem(1);
        }

        D.searchIndex = searchIndex;
    }

    async function getAndDisplayScreenshot(path, needsCarouselFiles = true) {
        const metadata = await AppApi.GetScreenshotMetadata(path);
        displayScreenshotMetadata(metadata, needsCarouselFiles);
    }

    /**
     * Function receives an unmodified json string grabbed from the screenshot file
     * Error checking and and verification of data is done in .NET already; In the case that the data/file is invalid, a JSON object with the token "error" will be returned containing a description of the problem.
     * Example: {"error":"Invalid file selected. Please select a valid VRChat screenshot."}
     * See docs/screenshotMetadata.json for schema
     * @param {string} metadata - JSON string grabbed from PNG file
     * @param {boolean} needsCarouselFiles - Whether or not to get the last/next files for the carousel
     * @returns {Promise<void>}
     */
    async function displayScreenshotMetadata(json, needsCarouselFiles = true) {
        let time;
        let date;
        const D = props.screenshotMetadataDialog;
        D.metadata.author = {};
        D.metadata.world = {};
        D.metadata.players = [];
        D.metadata.creationDate = '';
        D.metadata.application = '';

        const metadata = JSON.parse(json);
        if (!metadata?.sourceFile) {
            D.metadata = {};
            D.metadata.error = 'Invalid file selected. Please select a valid VRChat screenshot.';
            return;
        }

        // Get extra data for display dialog like resolution, file size, etc
        D.loading = true;
        const extraData = await AppApi.GetExtraScreenshotData(metadata.sourceFile, needsCarouselFiles);
        D.loading = false;
        const extraDataObj = JSON.parse(extraData);
        Object.assign(metadata, extraDataObj);

        // console.log("Displaying screenshot metadata", json, "extra data", extraDataObj, "path", json.filePath)

        D.metadata = metadata;

        const regex = metadata.fileName.match(
            /VRChat_((\d{3,})x(\d{3,})_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.(\d{1,})|(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.(\d{3})_(\d{3,})x(\d{3,}))/
        );
        if (regex) {
            if (typeof regex[2] !== 'undefined' && regex[4].length === 4) {
                // old format
                // VRChat_3840x2160_2022-02-02_03-21-39.771
                date = `${regex[4]}-${regex[5]}-${regex[6]}`;
                time = `${regex[7]}:${regex[8]}:${regex[9]}`;
                D.metadata.dateTime = Date.parse(`${date} ${time}`);
                // D.metadata.resolution = `${regex[2]}x${regex[3]}`;
            } else if (typeof regex[11] !== 'undefined' && regex[11].length === 4) {
                // new format
                // VRChat_2023-02-16_10-39-25.274_3840x2160
                date = `${regex[11]}-${regex[12]}-${regex[13]}`;
                time = `${regex[14]}:${regex[15]}:${regex[16]}`;
                D.metadata.dateTime = Date.parse(`${date} ${time}`);
                // D.metadata.resolution = `${regex[18]}x${regex[19]}`;
            }
        }
        if (metadata.timestamp) {
            D.metadata.dateTime = Date.parse(metadata.timestamp);
        }
        if (!D.metadata.dateTime) {
            D.metadata.dateTime = Date.parse(metadata.creationDate);
        }

        if (fullscreenImageDialog.value.visible) {
            showFullscreenImageDialog(D.metadata.filePath);
        }
    }
</script>
