<template>
    <safe-dialog
        class="x-dialog"
        :visible="galleryDialogVisible"
        :title="t('dialog.gallery_icons.header')"
        width="97vw"
        top="5vh"
        append-to-body
        @close="closeGalleryDialog">
        <el-tabs type="card" ref="galleryTabs">
            <el-tab-pane v-loading="galleryDialogGalleryLoading">
                <span slot="label">
                    {{ t('dialog.gallery_icons.gallery') }}
                    <span style="color: #909399; font-size: 12px; margin-left: 5px">
                        {{ galleryTable.length }}/64
                    </span>
                </span>
                <input
                    id="GalleryUploadButton"
                    type="file"
                    accept="image/*"
                    @change="onFileChangeGallery"
                    style="display: none" />
                <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1200x900px (4:3)</span>
                <br />
                <br />
                <el-button-group>
                    <el-button type="default" size="small" @click="refreshGalleryTable" icon="el-icon-refresh">
                        {{ t('dialog.gallery_icons.refresh') }}
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        @click="displayGalleryUpload"
                        icon="el-icon-upload2"
                        :disabled="!API.currentUser.$isVRCPlus">
                        {{ t('dialog.gallery_icons.upload') }}
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        @click="setProfilePicOverride('')"
                        icon="el-icon-close"
                        :disabled="!API.currentUser.profilePicOverride">
                        {{ t('dialog.gallery_icons.clear') }}
                    </el-button>
                </el-button-group>
                <br />
                <div
                    class="x-friend-item"
                    v-if="image.versions && image.versions.length > 0"
                    v-for="image in galleryTable"
                    :key="image.id"
                    style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                    <div
                        class="vrcplus-icon"
                        v-if="image.versions[image.versions.length - 1].file.url"
                        @click="setProfilePicOverride(image.id)"
                        :class="{ 'current-vrcplus-icon': compareCurrentProfilePic(image.id) }">
                        <img class="avatar" v-lazy="image.versions[image.versions.length - 1].file.url" />
                    </div>
                    <div style="float: right; margin-top: 5px">
                        <el-button
                            type="default"
                            @click="showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)"
                            size="mini"
                            icon="el-icon-picture-outline"
                            circle></el-button>
                        <el-button
                            type="default"
                            @click="deleteGalleryImage(image.id)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"></el-button>
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane v-loading="galleryDialogIconsLoading" lazy>
                <span slot="label">
                    {{ t('dialog.gallery_icons.icons') }}
                    <span style="color: #909399; font-size: 12px; margin-left: 5px">
                        {{ VRCPlusIconsTable.length }}/64
                    </span>
                </span>
                <input
                    id="VRCPlusIconUploadButton"
                    type="file"
                    accept="image/*"
                    @change="onFileChangeVRCPlusIcon"
                    style="display: none" />
                <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 2048x2048px (1:1)</span>
                <br />
                <br />
                <el-button-group>
                    <el-button type="default" size="small" @click="refreshVRCPlusIconsTable" icon="el-icon-refresh">
                        {{ t('dialog.gallery_icons.refresh') }}
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        @click="displayVRCPlusIconUpload"
                        icon="el-icon-upload2"
                        :disabled="!API.currentUser.$isVRCPlus">
                        {{ t('dialog.gallery_icons.upload') }}
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        @click="setVRCPlusIcon('')"
                        icon="el-icon-close"
                        :disabled="!API.currentUser.userIcon">
                        {{ t('dialog.gallery_icons.clear') }}
                    </el-button>
                </el-button-group>
                <br />
                <div
                    class="x-friend-item"
                    v-if="image.versions && image.versions.length > 0"
                    v-for="image in VRCPlusIconsTable"
                    :key="image.id"
                    style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                    <div
                        class="vrcplus-icon"
                        v-if="image.versions[image.versions.length - 1].file.url"
                        @click="setVRCPlusIcon(image.id)"
                        :class="{ 'current-vrcplus-icon': compareCurrentVRCPlusIcon(image.id) }">
                        <img class="avatar" v-lazy="image.versions[image.versions.length - 1].file.url" />
                    </div>
                    <div style="float: right; margin-top: 5px">
                        <el-button
                            type="default"
                            @click="showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)"
                            size="mini"
                            icon="el-icon-picture-outline"
                            circle></el-button>
                        <el-button
                            type="default"
                            @click="deleteVRCPlusIcon(image.id)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"></el-button>
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane v-loading="galleryDialogEmojisLoading" lazy>
                <span slot="label">
                    {{ t('dialog.gallery_icons.emojis') }}
                    <span style="color: #909399; font-size: 12px; margin-left: 5px"> {{ emojiTable.length }}/9 </span>
                </span>
                <input
                    id="EmojiUploadButton"
                    type="file"
                    accept="image/*"
                    @change="onFileChangeEmoji"
                    style="display: none" />
                <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1024x1024px (1:1)</span>
                <br />
                <br />
                <div style="display: flex; align-items: center">
                    <el-button-group style="margin-right: 10px">
                        <el-button type="default" size="small" @click="refreshEmojiTable" icon="el-icon-refresh">
                            {{ t('dialog.gallery_icons.refresh') }}
                        </el-button>
                        <el-button
                            type="default"
                            size="small"
                            @click="displayEmojiUpload"
                            icon="el-icon-upload2"
                            :disabled="!API.currentUser.$isVRCPlus">
                            {{ t('dialog.gallery_icons.upload') }}
                        </el-button>
                    </el-button-group>
                    <el-select v-model="emojiAnimationStyle" popper-class="max-height-el-select">
                        <el-option-group>
                            {{ t('dialog.gallery_icons.emoji_animation_styles') }}
                            <el-option
                                class="x-friend-item"
                                v-for="(fileName, styleName) in emojiAnimationStyleList"
                                :key="styleName"
                                :label="styleName"
                                :value="styleName"
                                style="height: auto">
                                <div class="avatar" style="width: 200px; height: 200px">
                                    <img v-lazy="`${emojiAnimationStyleUrl}${fileName}`" />
                                </div>
                                <div class="detail">
                                    <span class="name" v-text="styleName" style="margin-right: 100px"></span>
                                </div>
                            </el-option>
                        </el-option-group>
                    </el-select>
                    <el-checkbox v-model="emojiAnimType" style="margin-left: 10px; margin-right: 10px">
                        <span>{{ t('dialog.gallery_icons.emoji_animation_type') }}</span>
                    </el-checkbox>
                    <template v-if="emojiAnimType">
                        <span style="margin-right: 10px">{{ t('dialog.gallery_icons.emoji_animation_fps') }}</span>
                        <el-input-number
                            size="small"
                            v-model="emojiAnimFps"
                            :min="1"
                            :max="64"
                            style="margin-right: 10px; width: 112px"></el-input-number>
                        <span style="margin-right: 10px">{{
                            t('dialog.gallery_icons.emoji_animation_frame_count')
                        }}</span>
                        <el-input-number
                            size="small"
                            v-model="emojiAnimFrameCount"
                            :min="2"
                            :max="64"
                            style="margin-right: 10px; width: 112px"></el-input-number>
                        <el-checkbox v-model="emojiAnimLoopPingPong" style="margin-left: 10px; margin-right: 10px">
                            <span>{{ t('dialog.gallery_icons.emoji_loop_pingpong') }}</span>
                        </el-checkbox>
                        <br />
                        <br />
                        <span>{{ t('dialog.gallery_icons.flipbook_info') }}</span>
                    </template>
                </div>
                <br />
                <div
                    class="x-friend-item"
                    v-if="image.versions && image.versions.length > 0"
                    v-for="image in emojiTable"
                    :key="image.id"
                    style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
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
                        <template v-if="image.frames">
                            <div
                                class="avatar"
                                :style="
                                    generateEmojiStyle(
                                        image.versions[image.versions.length - 1].file.url,
                                        image.framesOverTime,
                                        image.frames,
                                        image.loopStyle
                                    )
                                "></div>
                        </template>
                        <template v-else>
                            <img class="avatar" v-lazy="image.versions[image.versions.length - 1].file.url" />
                        </template>
                    </div>
                    <div style="display: inline-block; margin: 5px">
                        <span v-if="image.loopStyle === 'pingpong'">
                            <i class="el-icon-refresh el-icon--left"></i>
                        </span>
                        <span style="margin-right: 5px">{{ image.animationStyle }}</span>
                        <span v-if="image.framesOverTime" style="margin-right: 5px">{{ image.framesOverTime }}fps</span>
                        <span v-if="image.frames" style="margin-right: 5px">{{ image.frames }}frames</span>
                        <br />
                    </div>
                    <div style="float: right; margin-top: 5px">
                        <el-button
                            type="default"
                            @click="
                                showFullscreenImageDialog(
                                    image.versions[image.versions.length - 1].file.url,
                                    getEmojiFileName(image)
                                )
                            "
                            size="mini"
                            icon="el-icon-picture-outline"
                            circle></el-button>
                        <el-button
                            type="default"
                            @click="deleteEmoji(image.id)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"></el-button>
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane v-loading="galleryDialogStickersLoading" lazy>
                <span slot="label">
                    {{ t('dialog.gallery_icons.stickers') }}
                    <span style="color: #909399; font-size: 12px; margin-left: 5px"> {{ stickerTable.length }}/9 </span>
                </span>
                <input
                    id="StickerUploadButton"
                    type="file"
                    accept="image/*"
                    @change="onFileChangeSticker"
                    style="display: none" />
                <span>{{ t('dialog.gallery_icons.recommended_image_size') }}: 1024x1024px (1:1)</span>
                <br />
                <br />
                <el-button-group>
                    <el-button type="default" size="small" @click="refreshStickerTable" icon="el-icon-refresh">
                        {{ t('dialog.gallery_icons.refresh') }}
                    </el-button>
                    <el-button
                        type="default"
                        size="small"
                        @click="displayStickerUpload"
                        icon="el-icon-upload2"
                        :disabled="!API.currentUser.$isVRCPlus">
                        {{ t('dialog.gallery_icons.upload') }}
                    </el-button>
                </el-button-group>
                <br />
                <div
                    class="x-friend-item"
                    v-if="image.versions && image.versions.length > 0"
                    v-for="image in stickerTable"
                    :key="image.id"
                    style="display: inline-block; margin-top: 10px; width: unset; cursor: default">
                    <div
                        class="vrcplus-icon"
                        v-if="image.versions[image.versions.length - 1].file.url"
                        style="overflow: hidden"
                        @click="showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)">
                        <img class="avatar" v-lazy="image.versions[image.versions.length - 1].file.url" />
                    </div>
                    <div style="float: right; margin-top: 5px">
                        <el-button
                            type="default"
                            @click="showFullscreenImageDialog(image.versions[image.versions.length - 1].file.url)"
                            size="mini"
                            icon="el-icon-picture-outline"
                            circle></el-button>
                        <el-button
                            type="default"
                            @click="deleteSticker(image.id)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"></el-button>
                    </div>
                </div>
            </el-tab-pane>

            <el-tab-pane v-loading="galleryDialogPrintsLoading" lazy>
                <span slot="label">
                    {{ t('dialog.gallery_icons.prints') }}
                    <span style="color: #909399; font-size: 12px; margin-left: 5px"> {{ printTable.length }}/64 </span>
                </span>
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
                    <el-button-group>
                        <el-button type="default" size="small" @click="refreshPrintTable" icon="el-icon-refresh">
                            {{ t('dialog.gallery_icons.refresh') }}
                        </el-button>
                        <el-button
                            type="default"
                            size="small"
                            @click="displayPrintUpload"
                            icon="el-icon-upload2"
                            :disabled="!API.currentUser.$isVRCPlus">
                            {{ t('dialog.gallery_icons.upload') }}
                        </el-button>
                    </el-button-group>
                    <el-input
                        type="textarea"
                        v-model="printUploadNote"
                        size="mini"
                        rows="1"
                        resize="none"
                        maxlength="32"
                        style="margin-left: 10px; width: 300px"
                        :placeholder="t('dialog.gallery_icons.note')"></el-input>
                    <el-checkbox v-model="printCropBorder" style="margin-left: 10px; margin-right: 10px">
                        <span>{{ t('dialog.gallery_icons.crop_print_border') }}</span>
                    </el-checkbox>
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
                        <img class="avatar" v-lazy="image.files.image" />
                    </div>
                    <div style="margin-top: 5px; width: 208px">
                        <span class="x-ellipsis" v-if="image.note" v-text="image.note" style="display: block"></span>
                        <span v-else style="display: block">&nbsp;</span>
                        <location
                            class="x-ellipsis"
                            v-if="image.worldId"
                            :location="image.worldId"
                            :hint="image.worldName"
                            style="display: block"></location>
                        <span v-else style="display: block">&nbsp;</span>
                        <display-name
                            class="x-ellipsis"
                            v-if="image.authorId"
                            :userid="image.authorId"
                            :hint="image.authorName"
                            style="color: #909399; font-family: monospace; display: block"></display-name>
                        <span v-else style="font-family: monospace; display: block">&nbsp;</span>
                        <span
                            class="x-ellipsis"
                            v-if="image.createdAt"
                            style="color: #909399; font-family: monospace; font-size: 11px; display: block">
                            {{ image.createdAt | formatDate('long') }}
                        </span>
                        <span v-else style="display: block">&nbsp;</span>
                    </div>
                    <div style="float: right">
                        <el-button
                            type="default"
                            @click="showFullscreenImageDialog(image.files.image, getPrintFileName(image))"
                            size="mini"
                            icon="el-icon-picture-outline"
                            circle></el-button>
                        <el-button
                            type="default"
                            @click="deletePrint(image.id)"
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"></el-button>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance, inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { userRequest, vrcPlusIconRequest, vrcPlusImageRequest, miscRequest } from '../../../api';
    import { extractFileId } from '../../../composables/shared/utils';
    import { emojiAnimationStyleList, emojiAnimationStyleUrl } from '../../../composables/user/constants/emoji';
    import { getPrintFileName } from '../../../composables/user/utils';
    import Location from '../../Location.vue';

    const { t } = useI18n();

    const { proxy } = getCurrentInstance();
    const { $message } = proxy;

    const API = inject('API');
    const showFullscreenImageDialog = inject('showFullscreenImageDialog');

    const props = defineProps({
        galleryDialogVisible: {
            type: Boolean,
            required: true
        },
        galleryDialogGalleryLoading: {
            type: Boolean,
            required: true
        },
        galleryDialogIconsLoading: {
            type: Boolean,
            required: true
        },
        galleryDialogEmojisLoading: {
            type: Boolean,
            required: true
        },
        galleryDialogStickersLoading: {
            type: Boolean,
            required: true
        },
        galleryDialogPrintsLoading: {
            type: Boolean,
            required: true
        },
        galleryTable: {
            type: Array,
            required: true
        },
        // eslint-disable-next-line vue/prop-name-casing
        VRCPlusIconsTable: {
            type: Array,
            required: true
        },
        emojiTable: {
            type: Array,
            required: true
        },
        stickerTable: {
            type: Array,
            required: true
        },
        printUploadNote: {
            type: String,
            required: true
        },
        printCropBorder: {
            type: Boolean,
            required: true
        },
        printTable: {
            type: Array,
            required: true
        }
    });

    const emit = defineEmits([
        'refreshGalleryTable',
        'refreshVRCPlusIconsTable',
        'refreshStickerTable',
        'refreshEmojiTable',
        'refreshPrintTable',
        'closeGalleryDialog'
    ]);

    const emojiAnimFps = ref(15);
    const emojiAnimFrameCount = ref(4);
    const emojiAnimType = ref(false);
    const emojiAnimationStyle = ref('Stop');
    const emojiAnimLoopPingPong = ref(false);

    function refreshGalleryTable() {
        emit('refreshGalleryTable');
    }

    function closeGalleryDialog() {
        emit('closeGalleryDialog');
    }

    function onFileChangeGallery(e) {
        const clearFile = function () {
            if (document.querySelector('#GalleryUploadButton')) {
                document.querySelector('#GalleryUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            const base64Body = btoa(r.result);
            vrcPlusImageRequest.uploadGalleryImage(base64Body).then((args) => {
                $message({
                    message: t('message.gallery.uploaded'),
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function displayGalleryUpload() {
        document.getElementById('GalleryUploadButton').click();
    }

    function setProfilePicOverride(fileId) {
        if (!API.currentUser.$isVRCPlus) {
            $message({
                message: 'VRCPlus required',
                type: 'error'
            });
            return;
        }
        let profilePicOverride = '';
        if (fileId) {
            profilePicOverride = `${API.endpointDomain}/file/${fileId}/1`;
        }
        if (profilePicOverride === API.currentUser.profilePicOverride) {
            return;
        }
        userRequest
            .saveCurrentUser({
                profilePicOverride
            })
            .then((args) => {
                $message({
                    message: 'Profile picture changed',
                    type: 'success'
                });
                return args;
            });
    }

    function compareCurrentProfilePic(fileId) {
        const currentProfilePicOverride = extractFileId(API.currentUser.profilePicOverride);
        if (fileId === currentProfilePicOverride) {
            return true;
        }
        return false;
    }

    function deleteGalleryImage(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            // API.$emit('GALLERYIMAGE:DELETE', args);
            // API.$on('GALLERYIMAGE:DELETE')
            const array = props.galleryTable;
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
        const clearFile = function () {
            if (document.querySelector('#VRCPlusIconUploadButton')) {
                document.querySelector('#VRCPlusIconUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            const base64Body = btoa(r.result);
            vrcPlusIconRequest.uploadVRCPlusIcon(base64Body).then((args) => {
                $message({
                    message: t('message.icon.uploaded'),
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function refreshVRCPlusIconsTable() {
        emit('refreshVRCPlusIconsTable');
    }

    function displayVRCPlusIconUpload() {
        document.getElementById('VRCPlusIconUploadButton').click();
    }

    function setVRCPlusIcon(fileId) {
        if (!API.currentUser.$isVRCPlus) {
            $message({
                message: 'VRCPlus required',
                type: 'error'
            });
            return;
        }
        let userIcon = '';
        if (fileId) {
            userIcon = `${API.endpointDomain}/file/${fileId}/1`;
        }
        if (userIcon === API.currentUser.userIcon) {
            return;
        }
        userRequest
            .saveCurrentUser({
                userIcon
            })
            .then((args) => {
                $message({
                    message: 'Icon changed',
                    type: 'success'
                });
                return args;
            });
    }

    function compareCurrentVRCPlusIcon(userIcon) {
        const currentUserIcon = extractFileId(API.currentUser.userIcon);
        if (userIcon === currentUserIcon) {
            return true;
        }
        return false;
    }

    function deleteVRCPlusIcon(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            // API.$emit('VRCPLUSICON:DELETE', args);
            // API.$on('VRCPLUSICON:DELETE')
            const array = props.VRCPlusIconsTable;
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
                emojiAnimLoopPingPong.value = value === 'pingpong';
            }
        }
    }

    function onFileChangeEmoji(e) {
        const clearFile = function () {
            if (document.querySelector('#EmojiUploadButton')) {
                document.querySelector('#EmojiUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }
        // set Emoji settings from fileName
        parseEmojiFileName(files[0].name);
        const r = new FileReader();
        r.onload = function () {
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
            const base64Body = btoa(r.result);
            vrcPlusImageRequest.uploadEmoji(base64Body, params).then((args) => {
                $message({
                    message: t('message.emoji.uploaded'),
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function refreshEmojiTable() {
        emit('refreshEmojiTable');
    }

    function displayEmojiUpload() {
        document.getElementById('EmojiUploadButton').click();
    }

    function getEmojiFileName(emoji) {
        if (emoji.frames) {
            const loopStyle = emoji.loopStyle || 'linear';
            return `${emoji.name}_${emoji.animationStyle}animationStyle_${emoji.frames}frames_${emoji.framesOverTime}fps_${loopStyle}loopStyle.png`;
        } else {
            return `${emoji.name}_${emoji.animationStyle}animationStyle.png`;
        }
    }

    function generateEmojiStyle(url, fps, frameCount, loopStyle) {
        let framesPerLine = 2;
        if (frameCount > 4) framesPerLine = 4;
        if (frameCount > 16) framesPerLine = 8;
        const animationDurationMs = (1000 / fps) * frameCount;
        const frameSize = 1024 / framesPerLine;
        const scale = 100 / (frameSize / 200);
        const animStyle = loopStyle === 'pingpong' ? 'alternate' : 'none';
        const style = `
            transform: scale(${scale / 100});
            transform-origin: top left;
            width: ${frameSize}px;
            height: ${frameSize}px;
            background: url('${url}') 0 0;
            animation: ${animationDurationMs}ms steps(1) 0s infinite ${animStyle} running animated-emoji-${frameCount};
        `;
        return style;
    }

    function deleteEmoji(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            // API.$emit('EMOJI:DELETE', args);
            // API.$on('EMOJI:DELETE')
            const array = props.emojiTable;
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
        const clearFile = function () {
            if (document.querySelector('#StickerUploadButton')) {
                document.querySelector('#StickerUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            const params = {
                tag: 'sticker',
                maskTag: 'square'
            };
            const base64Body = btoa(r.result);
            vrcPlusImageRequest.uploadSticker(base64Body, params).then((args) => {
                $message({
                    message: t('message.sticker.uploaded'),
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function refreshStickerTable() {
        emit('refreshStickerTable');
    }

    function displayStickerUpload() {
        document.getElementById('StickerUploadButton').click();
    }

    function deleteSticker(fileId) {
        miscRequest.deleteFile(fileId).then((args) => {
            // API.$emit('STICKER:DELETE', args);
            // API.$on('STICKER:DELETE')
            const array = props.stickerTable;
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
        const clearFile = function () {
            if (document.querySelector('#PrintUploadButton')) {
                document.querySelector('#PrintUploadButton').value = '';
            }
        };
        const files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $message({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $message({
                message: t('message.file.not_image'),
                type: 'error'
            });
            clearFile();
            return;
        }
        const r = new FileReader();
        r.onload = function () {
            const date = new Date();
            // why the fuck isn't this UTC
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            const timestamp = date.toISOString().slice(0, 19);
            const params = {
                note: props.printUploadNote,
                // worldId: '',
                timestamp
            };
            const base64Body = btoa(r.result);
            const cropWhiteBorder = props.printCropBorder;
            vrcPlusImageRequest.uploadPrint(base64Body, cropWhiteBorder, params).then((args) => {
                $message({
                    message: t('message.print.uploaded'),
                    type: 'success'
                });
                // API.$on('PRINT:ADD')
                if (Object.keys(props.printTable).length !== 0) {
                    props.printTable.unshift(args.json);
                }

                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function refreshPrintTable() {
        emit('refreshPrintTable');
    }

    function displayPrintUpload() {
        document.getElementById('PrintUploadButton').click();
    }

    function deletePrint(printId) {
        vrcPlusImageRequest.deletePrint(printId).then((args) => {
            // API.$on('PRINT:DELETE');
            const array = props.printTable;
            const { length } = array;
            for (let i = 0; i < length; ++i) {
                if (args.printId === array[i].id) {
                    array.splice(i, 1);
                    break;
                }
            }
        });
    }
</script>
