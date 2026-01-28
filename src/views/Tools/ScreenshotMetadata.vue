<template>
    <div class="screenshot-metadata-page x-container">
        <div class="flex items-center gap-2 ml-2">
            <Button variant="ghost" size="sm" class="mr-3" @click="goBack">
                <ArrowLeft />
                {{ t('nav_tooltip.tools') }}
            </Button>
            <span class="header">{{ t('dialog.screenshot_metadata.header') }}</span>
        </div>
        <div @dragover.prevent @dragenter.prevent @drop="handleDrop">
            <span>{{ t('dialog.screenshot_metadata.drag') }}</span>
            <br />
            <br />
            <Button size="sm" variant="outline" class="mr-2" @click="getAndDisplayScreenshotFromFile">{{
                t('dialog.screenshot_metadata.browse')
            }}</Button>
            <Button size="sm" variant="outline" class="mr-2" @click="getAndDisplayLastScreenshot">{{
                t('dialog.screenshot_metadata.last_screenshot')
            }}</Button>
            <Button
                size="sm"
                variant="outline"
                class="mr-2"
                @click="copyImageToClipboard(screenshotMetadataDialog.metadata.filePath)"
                >{{ t('dialog.screenshot_metadata.copy_image') }}</Button
            >
            <Button
                size="sm"
                variant="outline"
                class="mr-2"
                @click="openImageFolder(screenshotMetadataDialog.metadata.filePath)"
                >{{ t('dialog.screenshot_metadata.open_folder') }}</Button
            >
            <Button
                size="sm"
                variant="outline"
                class="mr-2"
                v-if="isLocalUserVrcPlusSupporter && screenshotMetadataDialog.metadata.filePath"
                @click="uploadScreenshotToGallery"
                >{{ t('dialog.screenshot_metadata.upload') }}</Button
            >
            <Button
                size="sm"
                variant="outline"
                v-if="screenshotMetadataDialog.metadata.filePath"
                @click="deleteMetadata(screenshotMetadataDialog.metadata.filePath)"
                >{{ t('dialog.screenshot_metadata.delete_metadata') }}</Button
            >
            <br />
            <br />

            <div class="flex items-center">
                <InputGroupSearch
                    v-model="screenshotMetadataDialog.search"
                    :placeholder="t('dialog.screenshot_metadata.search_placeholder')"
                    style="width: 200px"
                    @input="screenshotMetadataSearch" />
                <Select :model-value="screenshotMetadataDialog.searchType" @update:modelValue="handleSearchTypeChange">
                    <SelectTrigger size="sm" style="width: 150px; margin-left: 10px">
                        <SelectValue :placeholder="t('dialog.screenshot_metadata.search_type_placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="type in screenshotMetadataDialog.searchTypes" :key="type" :value="type">
                                {{ t(screenshotMetadataSearchTypeLabels[type] ?? type) }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
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
            <Badge v-if="screenshotMetadataDialog.metadata.fileSize" variant="outline">{{
                screenshotMetadataDialog.metadata.fileSize
            }}</Badge>
            <br />
            <Location
                v-if="screenshotMetadataDialog.metadata.world"
                :location="screenshotMetadataDialog.metadata.world.instanceId"
                :hint="screenshotMetadataDialog.metadata.world.name" />
            <DisplayName
                v-if="screenshotMetadataDialog.metadata.author"
                :userid="screenshotMetadataDialog.metadata.author.id"
                :hint="screenshotMetadataDialog.metadata.author.displayName" />
            <br />
            <div class="my-2 w-[90%] ml-17">
                <Carousel :opts="{ loop: false }" @init-api="handleScreenshotMetadataCarouselInit">
                    <CarouselContent class="h-150">
                        <CarouselItem>
                            <div class="h-150 w-full">
                                <img
                                    :src="screenshotMetadataDialog.metadata.previousFilePath"
                                    style="width: 100%; height: 100%; object-fit: contain" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div class="h-150 w-full">
                                <img
                                    class="cursor-pointer"
                                    :src="screenshotMetadataDialog.metadata.filePath"
                                    style="width: 100%; height: 100%; object-fit: contain"
                                    @click="showFullscreenImageDialog(screenshotMetadataDialog.metadata.filePath)" />
                            </div>
                        </CarouselItem>
                        <CarouselItem>
                            <div class="h-150 w-full">
                                <img
                                    :src="screenshotMetadataDialog.metadata.nextFilePath"
                                    style="width: 100%; height: 100%; object-fit: contain" />
                            </div>
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
            <template v-if="screenshotMetadataDialog.metadata.error">
                <pre
                    style="white-space: pre-wrap; font-size: 12px"
                    v-text="screenshotMetadataDialog.metadata.error"></pre>
                <br />
            </template>
            <span v-for="user in screenshotMetadataDialog.metadata.players" :key="user.id" style="margin-top: 5px">
                <span class="cursor-pointer" @click="lookupUser(user)" v-text="user.displayName"></span>
                <span v-if="user.pos" v-text="'(' + user.pos.x + ', ' + user.pos.y + ', ' + user.pos.z + ')'"></span>
                <br />
            </span>
        </div>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
    import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
    import { useGalleryStore, useUserStore, useVrcxStore } from '@/stores';
    import { ArrowLeft } from 'lucide-vue-next';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { formatDateFilter } from '@/shared/utils';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';
    import { vrcPlusImageRequest } from '@/api';

    const router = useRouter();
    const { t } = useI18n();

    const { showFullscreenImageDialog, handleGalleryImageAdd } = useGalleryStore();
    const { currentlyDroppingFile } = storeToRefs(useVrcxStore());
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    const userStore = useUserStore();
    const { lookupUser } = userStore;

    const screenshotMetadataDialog = reactive({
        loading: false,
        search: '',
        searchType: 'Player Name',
        searchTypes: ['Player Name', 'Player ID', 'World Name', 'World ID'],
        searchIndex: null,
        searchResults: null,
        metadata: {},
        isUploading: false
    });

    const screenshotMetadataSearchTypeLabels = {
        'Player Name': 'dialog.screenshot_metadata.search_types.player_name',
        'Player ID': 'dialog.screenshot_metadata.search_types.player_id',
        'World Name': 'dialog.screenshot_metadata.search_types.world_name',
        'World ID': 'dialog.screenshot_metadata.search_types.world_id'
    };

    const screenshotMetadataSearchInputs = ref(0);
    const screenshotMetadataCarouselApi = ref(null);
    const ignoreCarouselSelect = ref(false);

    onMounted(() => {
        if (!screenshotMetadataDialog.metadata.filePath) {
            getAndDisplayLastScreenshot();
        }
        window.addEventListener('keyup', handleComponentKeyup);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keyup', handleComponentKeyup);
    });

    const handleComponentKeyup = (event) => {
        const carouselNavigation = { ArrowLeft: 0, ArrowRight: 2 }[event.key];
        if (typeof carouselNavigation !== 'undefined') {
            if (screenshotMetadataCarouselApi.value) {
                if (event.key === 'ArrowLeft') {
                    screenshotMetadataCarouselApi.value.scrollPrev();
                } else {
                    screenshotMetadataCarouselApi.value.scrollNext();
                }
                return;
            }
            screenshotMetadataCarouselChange(carouselNavigation);
        }
    };

    function goBack() {
        router.push({ name: 'tools' });
    }

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

        if (LINUX) {
            filePath = await window.electron.openFileDialog();
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
            toast.success('Image copied to clipboard');
        });
    }
    function openImageFolder(path) {
        if (!path) {
            return;
        }
        AppApi.OpenFolderAndSelectItem(path).then(() => {
            toast.success('Opened image folder');
        });
    }
    function deleteMetadata(path) {
        if (!path) {
            return;
        }
        AppApi.DeleteScreenshotMetadata(path).then((result) => {
            if (!result) {
                toast.error(t('message.screenshot_metadata.delete_failed'));
                return;
            }
            toast.success(t('message.screenshot_metadata.deleted'));
            const D = screenshotMetadataDialog;
            getAndDisplayScreenshot(D.metadata.filePath, true);
        });
    }
    function uploadScreenshotToGallery() {
        const D = screenshotMetadataDialog;
        if (D.metadata.fileSizeBytes > 10000000) {
            toast.error(t('message.file.too_large'));
            return;
        }
        D.isUploading = true;
        AppApi.GetFileBase64(D.metadata.filePath)
            .then((base64Body) => {
                vrcPlusImageRequest
                    .uploadGalleryImage(base64Body)
                    .then((args) => {
                        handleGalleryImageAdd(args);
                        toast.success(t('message.gallery.uploaded'));
                        return args;
                    })
                    .finally(() => {
                        D.isUploading = false;
                    });
            })
            .catch((err) => {
                toast.error(t('message.gallery.failed'));
                console.error(err);
                D.isUploading = false;
            });
    }
    function screenshotMetadataSearch() {
        const D = screenshotMetadataDialog;

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
                    getAndDisplayScreenshot(D.metadata.filePath, true);
                }
                return;
            }

            const searchType = D.searchTypes.indexOf(D.searchType);
            D.loading = true;
            AppApi.FindScreenshotsBySearch(D.search, searchType)
                .then((json) => {
                    const results = JSON.parse(json);

                    if (results.length === 0) {
                        D.metadata = {};
                        D.metadata.error = t('dialog.screenshot_metadata.no_results');

                        D.searchIndex = null;
                        D.searchResults = null;
                        return;
                    }

                    D.searchIndex = 0;
                    D.searchResults = results;

                    getAndDisplayScreenshot(results[0], false);
                })
                .finally(() => {
                    D.loading = false;
                });
        }, 500);
    }

    function handleSearchTypeChange(value) {
        screenshotMetadataDialog.searchType = value;
        screenshotMetadataSearch();
    }

    function screenshotMetadataCarouselChange(index) {
        const D = screenshotMetadataDialog;
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
        resetCarouselIndex();

        if (fullscreenImageDialog.value.visible) {
            // TODO
        }
    }

    function screenshotMetadataResetSearch() {
        const D = screenshotMetadataDialog;

        D.search = '';
        D.searchIndex = null;
        D.searchResults = null;
    }

    function screenshotMetadataCarouselChangeSearch(index) {
        const D = screenshotMetadataDialog;
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

        resetCarouselIndex();

        D.searchIndex = searchIndex;
    }

    function handleScreenshotMetadataCarouselInit(api) {
        screenshotMetadataCarouselApi.value = api;
        api.on('select', handleCarouselSelect);
        api.on('reInit', handleCarouselSelect);
        resetCarouselIndex();
    }

    function handleCarouselSelect() {
        if (ignoreCarouselSelect.value || !screenshotMetadataCarouselApi.value) {
            return;
        }
        const index = screenshotMetadataCarouselApi.value.selectedScrollSnap();
        screenshotMetadataCarouselChange(index);
    }

    function resetCarouselIndex() {
        const api = screenshotMetadataCarouselApi.value;
        if (!api) {
            return;
        }
        ignoreCarouselSelect.value = true;
        api.scrollTo(1, true);
        setTimeout(() => {
            ignoreCarouselSelect.value = false;
        }, 0);
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
     * @param {string} json - JSON string grabbed from PNG file
     * @param {boolean} needsCarouselFiles - Whether or not to get the last/next files for the carousel
     * @returns {Promise<void>}
     */
    async function displayScreenshotMetadata(json, needsCarouselFiles = true) {
        let time;
        let date;
        const D = screenshotMetadataDialog;
        D.metadata.author = {};
        D.metadata.world = {};
        D.metadata.players = [];
        D.metadata.creationDate = '';
        D.metadata.application = '';

        let metadata = null;
        try {
            metadata = JSON.parse(json);
        } catch (e) {
            console.error('Error parsing screenshot metadata JSON:', e);
        }
        if (!metadata?.sourceFile) {
            D.metadata = {};
            D.metadata.error = t('dialog.screenshot_metadata.invalid_file');
            return;
        }

        D.loading = true;
        const extraData = await AppApi.GetExtraScreenshotData(metadata.sourceFile, needsCarouselFiles);
        D.loading = false;
        const extraDataObj = JSON.parse(extraData);
        Object.assign(metadata, extraDataObj);

        D.metadata = metadata;

        const regex = metadata.fileName?.match(
            /VRChat_((\d{3,})x(\d{3,})_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.(\d{1,})|(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.(\d{3})_(\d{3,})x(\d{3,}))/
        );
        if (regex) {
            if (typeof regex[2] !== 'undefined' && regex[4].length === 4) {
                date = `${regex[4]}-${regex[5]}-${regex[6]}`;
                time = `${regex[7]}:${regex[8]}:${regex[9]}`;
                D.metadata.dateTime = Date.parse(`${date} ${time}`);
            } else if (typeof regex[11] !== 'undefined' && regex[11].length === 4) {
                date = `${regex[11]}-${regex[12]}-${regex[13]}`;
                time = `${regex[14]}:${regex[15]}:${regex[16]}`;
                D.metadata.dateTime = Date.parse(`${date} ${time}`);
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
