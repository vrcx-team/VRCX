<template>
    <safe-dialog
        ref="avatarDialogRef"
        class="x-dialog x-avatar-dialog"
        :visible.sync="avatarDialog.visible"
        :show-close="false"
        width="700px">
        <div v-loading="avatarDialog.loading">
            <div style="display: flex">
                <el-popover placement="right" width="500px" trigger="click">
                    <img
                        slot="reference"
                        v-lazy="avatarDialog.ref.thumbnailImageUrl"
                        class="x-link"
                        style="flex: none; width: 160px; height: 120px; border-radius: 12px" />
                    <img
                        v-lazy="avatarDialog.ref.imageUrl"
                        class="x-link"
                        style="width: 500px; height: 375px"
                        @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)" />
                </el-popover>
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <span class="dialog-title" v-text="avatarDialog.ref.name"></span>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                class="x-link x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(avatarDialog.ref.authorId)"
                                v-text="avatarDialog.ref.authorName"></span>
                        </div>
                        <div>
                            <el-tag
                                v-if="avatarDialog.ref.releaseStatus === 'public'"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.public') }}</el-tag
                            >
                            <el-tag
                                v-else
                                type="danger"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.private') }}</el-tag
                            >
                            <el-tag
                                v-if="avatarDialog.isPC"
                                class="x-tag-platform-pc"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >PC
                                <span
                                    v-if="avatarDialog.platformInfo.pc"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.platformInfo.pc.performanceRating }}</span
                                >
                                <span
                                    v-if="avatarDialog.bundleSizes['standalonewindows']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.bundleSizes['standalonewindows'].fileSize }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isQuest"
                                class="x-tag-platform-quest"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >Android
                                <span
                                    v-if="avatarDialog.platformInfo.android"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.platformInfo.android.performanceRating }}</span
                                >
                                <span
                                    v-if="avatarDialog.bundleSizes['android']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.bundleSizes['android'].fileSize }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isIos"
                                class="x-tag-platform-ios"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >iOS
                                <span
                                    v-if="avatarDialog.platformInfo.ios"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.platformInfo.ios.performanceRating }}</span
                                >
                                <span
                                    v-if="avatarDialog.bundleSizes['ios']"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.bundleSizes['ios'].fileSize }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.inCache"
                                class="x-link"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(avatarDialog.cachePath)">
                                <span v-text="avatarDialog.cacheSize"></span>
                                &nbsp;{{ t('dialog.avatar.tags.cache') }}
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.ref.styles?.primary || avatarDialog.ref.styles?.secondary"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >Styles
                                <span
                                    v-if="avatarDialog.ref.styles.primary"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.ref.styles.primary }}</span
                                >
                                <span
                                    v-if="avatarDialog.ref.styles.secondary"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >{{ avatarDialog.ref.styles.secondary }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isQuestFallback"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.fallback') }}</el-tag
                            >
                            <el-tag
                                v-if="avatarDialog.hasImposter"
                                type="info"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.impostor') }}
                                <span
                                    v-if="avatarDialog.imposterVersion"
                                    class="x-grey"
                                    style="margin-left: 5px; border-left: inherit; padding-left: 5px"
                                    >v{{ avatarDialog.imposterVersion }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.ref.unityPackageUrl"
                                type="success"
                                effect="plain"
                                size="mini"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.future_proofing') }}</el-tag
                            >
                            <div>
                                <template v-for="tag in avatarDialog.ref.tags">
                                    <el-tag
                                        v-if="tag.startsWith('content_')"
                                        :key="tag"
                                        effect="plain"
                                        size="mini"
                                        style="margin-right: 5px; margin-top: 5px">
                                        <template v-if="tag === 'content_horror'">{{
                                            t('dialog.avatar.tags.content_horror')
                                        }}</template>
                                        <template v-else-if="tag === 'content_gore'">{{
                                            t('dialog.avatar.tags.content_gore')
                                        }}</template>
                                        <template v-else-if="tag === 'content_violence'">{{
                                            t('dialog.avatar.tags.content_violence')
                                        }}</template>
                                        <template v-else-if="tag === 'content_adult'">{{
                                            t('dialog.avatar.tags.content_adult')
                                        }}</template>
                                        <template v-else-if="tag === 'content_sex'">{{
                                            t('dialog.avatar.tags.content_sex')
                                        }}</template>
                                        <template v-else>{{ tag.replace('content_', '') }}</template>
                                    </el-tag>
                                    <el-tag
                                        v-if="tag.startsWith('author_tag_')"
                                        :key="tag"
                                        effect="plain"
                                        size="mini"
                                        style="margin-right: 5px; margin-top: 5px">
                                        <template>
                                            {{ tag.replace('author_tag_', '') }}
                                        </template>
                                    </el-tag>
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
                    <div style="flex: none; margin-left: 10px">
                        <el-tooltip
                            v-if="avatarDialog.inCache"
                            placement="top"
                            :content="t('dialog.avatar.actions.delete_cache_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                icon="el-icon-delete"
                                circle
                                :disabled="isGameRunning && avatarDialog.cacheLocked"
                                @click="deleteVRChatCache(avatarDialog.ref)"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            v-if="avatarDialog.isFavorite"
                            placement="top"
                            :content="t('dialog.avatar.actions.favorite_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="warning"
                                icon="el-icon-star-on"
                                circle
                                style="margin-left: 5px"
                                @click="avatarDialogCommand('Add Favorite')"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            v-else
                            placement="top"
                            :content="t('dialog.avatar.actions.favorite_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
                                icon="el-icon-star-off"
                                circle
                                style="margin-left: 5px"
                                @click="avatarDialogCommand('Add Favorite')"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            placement="top"
                            :content="t('dialog.avatar.actions.select')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
                                icon="el-icon-check"
                                circle
                                :disabled="API.currentUser.currentAvatar === avatarDialog.id"
                                style="margin-left: 5px"
                                @click="selectAvatar(avatarDialog.id)"></el-button>
                        </el-tooltip>
                        <el-dropdown
                            trigger="click"
                            size="small"
                            style="margin-left: 5px"
                            @command="avatarDialogCommand">
                            <el-button
                                :type="avatarDialog.isBlocked ? 'danger' : 'default'"
                                icon="el-icon-more"
                                circle></el-button>
                            <el-dropdown-menu v-slot="dropdown">
                                <el-dropdown-item icon="el-icon-refresh" command="Refresh">{{
                                    t('dialog.avatar.actions.refresh')
                                }}</el-dropdown-item>
                                <el-dropdown-item icon="el-icon-share" command="Share">{{
                                    t('dialog.avatar.actions.share')
                                }}</el-dropdown-item>
                                <el-dropdown-item
                                    v-if="avatarDialog.isBlocked"
                                    icon="el-icon-circle-check"
                                    command="Unblock Avatar"
                                    style="color: #f56c6c"
                                    divided
                                    >{{ t('dialog.avatar.actions.unblock') }}</el-dropdown-item
                                >
                                <el-dropdown-item v-else icon="el-icon-circle-close" command="Block Avatar" divided>{{
                                    t('dialog.avatar.actions.block')
                                }}</el-dropdown-item>
                                <el-dropdown-item
                                    v-if="/quest/.test(avatarDialog.ref.tags)"
                                    icon="el-icon-check"
                                    command="Select Fallback Avatar"
                                    >{{ t('dialog.avatar.actions.select_fallback') }}</el-dropdown-item
                                >
                                <el-dropdown-item
                                    v-if="avatarDialog.ref.authorId !== API.currentUser.id"
                                    icon="el-icon-picture-outline"
                                    command="Previous Images"
                                    >{{ t('dialog.avatar.actions.show_previous_images') }}</el-dropdown-item
                                >
                                <template v-if="avatarDialog.ref.authorId === API.currentUser.id">
                                    <el-dropdown-item
                                        v-if="avatarDialog.ref.releaseStatus === 'public'"
                                        icon="el-icon-user-solid"
                                        command="Make Private"
                                        divided
                                        >{{ t('dialog.avatar.actions.make_private') }}</el-dropdown-item
                                    >
                                    <el-dropdown-item v-else icon="el-icon-user" command="Make Public" divided>{{
                                        t('dialog.avatar.actions.make_public')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Rename">{{
                                        t('dialog.avatar.actions.rename')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Description">{{
                                        t('dialog.avatar.actions.change_description')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Content Tags">{{
                                        t('dialog.avatar.actions.change_content_tags')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-edit" command="Change Styles and Author Tags">{{
                                        t('dialog.avatar.actions.change_styles_author_tags')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-picture-outline" command="Change Image">{{
                                        t('dialog.avatar.actions.change_image')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="avatarDialog.ref.unityPackageUrl"
                                        icon="el-icon-download"
                                        command="Download Unity Package"
                                        >{{ t('dialog.avatar.actions.download_package') }}</el-dropdown-item
                                    >
                                    <el-dropdown-item
                                        v-if="avatarDialog.hasImposter"
                                        icon="el-icon-refresh"
                                        command="Regenerate Imposter"
                                        style="color: #f56c6c"
                                        divided
                                        >{{ t('dialog.avatar.actions.regenerate_impostor') }}</el-dropdown-item
                                    >
                                    <el-dropdown-item
                                        v-if="avatarDialog.hasImposter"
                                        icon="el-icon-delete"
                                        command="Delete Imposter"
                                        style="color: #f56c6c"
                                        >{{ t('dialog.avatar.actions.delete_impostor') }}</el-dropdown-item
                                    >
                                    <el-dropdown-item v-else icon="el-icon-user" command="Create Imposter" divided>{{
                                        t('dialog.avatar.actions.create_impostor')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item icon="el-icon-delete" command="Delete" style="color: #f56c6c">{{
                                        t('dialog.avatar.actions.delete')
                                    }}</el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs>
                <el-tab-pane :label="t('dialog.avatar.info.header')">
                    <div class="x-friend-list" style="max-height: unset">
                        <div
                            v-if="avatarDialog.galleryImages.length || avatarDialog.ref.authorId === API.currentUser.id"
                            style="width: 100%">
                            <span class="name">{{ t('dialog.avatar.info.gallery') }}</span>
                            <input
                                id="AvatarGalleryUploadButton"
                                type="file"
                                accept="image/*"
                                style="display: none"
                                @change="onFileChangeAvatarGallery" />
                            <el-button
                                v-if="avatarDialog.ref.authorId === API.currentUser.id"
                                v-loading="avatarDialog.galleryLoading"
                                size="small"
                                icon="el-icon-upload2"
                                style="margin-left: 5px"
                                @click="displayAvatarGalleryUpload"
                                >{{ t('dialog.screenshot_metadata.upload') }}</el-button
                            >
                            <el-carousel
                                v-if="avatarDialog.galleryImages.length"
                                type="card"
                                :autoplay="false"
                                height="200px">
                                <el-carousel-item v-for="imageUrl in avatarDialog.galleryImages" :key="imageUrl">
                                    <img
                                        :src="imageUrl"
                                        style="width: 100%; height: 100%; object-fit: contain"
                                        @click="showFullscreenImageDialog(imageUrl)" />
                                    <div
                                        v-if="avatarDialog.ref.authorId === API.currentUser.id"
                                        style="position: absolute; bottom: 5px; left: 33.3%">
                                        <el-button
                                            size="mini"
                                            icon="el-icon-back"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0px"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, -1)"></el-button>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-right"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0px"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, 1)"></el-button>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-delete"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0px"
                                            @click.stop="deleteAvatarGalleryImage(imageUrl)"></el-button>
                                    </div>
                                </el-carousel-item>
                            </el-carousel>
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
                                        @click="showFullscreenImageDialog(getImageUrlFromImageId(listing.imageId))" />
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
                                <el-input
                                    v-model="memo"
                                    class="extra"
                                    size="mini"
                                    type="textarea"
                                    :rows="2"
                                    :autosize="{ minRows: 1, maxRows: 20 }"
                                    :placeholder="t('dialog.avatar.info.memo_placeholder')"
                                    resize="none"
                                    @change="onAvatarMemoChange"></el-input>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.id') }}</span>
                                <span class="extra"
                                    >{{ avatarDialog.id
                                    }}<el-tooltip
                                        placement="top"
                                        :content="t('dialog.avatar.info.id_tooltip')"
                                        :disabled="hideTooltips">
                                        <el-dropdown
                                            trigger="click"
                                            size="mini"
                                            style="margin-left: 5px"
                                            @click.native.stop>
                                            <el-button
                                                type="default"
                                                icon="el-icon-s-order"
                                                size="mini"
                                                circle></el-button>
                                            <el-dropdown-menu v-slot="dropdown">
                                                <el-dropdown-item @click.native="copyAvatarId(avatarDialog.id)">{{
                                                    t('dialog.avatar.info.copy_id')
                                                }}</el-dropdown-item>
                                                <el-dropdown-item @click.native="copyAvatarUrl(avatarDialog.id)">{{
                                                    t('dialog.avatar.info.copy_url')
                                                }}</el-dropdown-item>
                                            </el-dropdown-menu>
                                        </el-dropdown>
                                    </el-tooltip></span
                                >
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.created_at') }}</span>
                                <span class="extra">{{ avatarDialog.ref.created_at | formatDate('long') }}</span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('dialog.avatar.info.last_updated') }}</span>
                                <span v-if="avatarDialog.lastUpdated" class="extra">{{
                                    avatarDialog.lastUpdated | formatDate('long')
                                }}</span>
                                <span v-else class="extra">{{ avatarDialog.ref.updated_at | formatDate('long') }}</span>
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
                                <span class="name"
                                    >{{ t('dialog.avatar.info.time_spent')
                                    }}<el-tooltip
                                        v-if="!hideTooltips"
                                        placement="top"
                                        style="margin-left: 5px"
                                        :content="t('dialog.world.info.accuracy_notice')">
                                        <i class="el-icon-warning"></i> </el-tooltip
                                ></span>

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
                </el-tab-pane>
                <el-tab-pane :label="t('dialog.avatar.json.header')">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        @click="refreshAvatarDialogTreeData"></el-button>
                    <el-tooltip
                        placement="top"
                        :content="t('dialog.avatar.json.file_analysis')"
                        :disabled="hideTooltips">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-s-data"
                            circle
                            style="margin-left: 5px"
                            @click="getAvatarFileAnalysis"></el-button>
                    </el-tooltip>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(avatarDialog.id, avatarDialog.ref)"></el-button>
                    <el-tree
                        v-if="Object.keys(fileAnalysis).length > 0"
                        :data="fileAnalysis"
                        style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                    <el-tree :data="treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                </el-tab-pane>
            </el-tabs>
        </div>
        <SetAvatarTagsDialog :set-avatar-tags-dialog="setAvatarTagsDialog" />
        <SetAvatarStylesDialog :set-avatar-styles-dialog="setAvatarStylesDialog" />
        <ChangeAvatarImageDialog
            :change-avatar-image-dialog-visible.sync="changeAvatarImageDialogVisible"
            :previous-images-table="previousImagesTable"
            :avatar-dialog="avatarDialog"
            :previous-images-file-id="previousImagesFileId"
            @refresh="displayPreviousImages" />
        <PreviousImagesDialog
            :previous-images-dialog-visible.sync="previousImagesDialogVisible"
            :previous-images-table="previousImagesTable" />
    </safe-dialog>
</template>

<script setup>
    import { computed, getCurrentInstance, inject, nextTick, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { avatarModerationRequest, avatarRequest, favoriteRequest, imageRequest, miscRequest } from '../../../api';
    import utils from '../../../classes/utils';
    import { compareUnityVersion, storeAvatarImage } from '../../../composables/avatar/utils';
    import {
        copyToClipboard,
        downloadAndSaveJson,
        extractFileId,
        extractFileVersion,
        replaceVrcPackageUrl
    } from '../../../composables/shared/utils';
    import database from '../../../service/database';
    import PreviousImagesDialog from '../PreviousImagesDialog.vue';
    import ChangeAvatarImageDialog from './ChangeAvatarImageDialog.vue';
    import SetAvatarStylesDialog from './SetAvatarStylesDialog.vue';
    import SetAvatarTagsDialog from './SetAvatarTagsDialog.vue';

    const API = inject('API');
    const showFullscreenImageDialog = inject('showFullscreenImageDialog');
    const showUserDialog = inject('showUserDialog');
    const showAvatarDialog = inject('showAvatarDialog');
    const showFavoriteDialog = inject('showFavoriteDialog');
    const openExternalLink = inject('openExternalLink');
    const adjustDialogZ = inject('adjustDialogZ');
    const getImageUrlFromImageId = inject('getImageUrlFromImageId');
    const getAvatarGallery = inject('getAvatarGallery');

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const { $message, $confirm, $prompt } = instance.proxy;

    const emit = defineEmits(['openFolderGeneric', 'deleteVRChatCache', 'openPreviousImagesDialog']);

    const props = defineProps({
        avatarDialog: {
            type: Object,
            required: true
        },
        hideTooltips: {
            type: Boolean,
            default: false
        },
        isGameRunning: {
            type: Boolean,
            default: false
        }
    });

    const avatarDialogRef = ref(null);
    const changeAvatarImageDialogVisible = ref(false);
    const previousImagesFileId = ref('');
    const previousImagesDialogVisible = ref(false);
    const previousImagesTable = ref([]);

    const treeData = ref([]);
    const timeSpent = ref(0);
    const memo = ref('');
    const fileAnalysis = ref({});
    const setAvatarTagsDialog = reactive({
        visible: false,
        loading: false,
        ownAvatars: [],
        selectedCount: 0,
        forceUpdate: 0,
        selectedTags: [],
        selectedTagsCsv: '',
        contentHorror: false,
        contentGore: false,
        contentViolence: false,
        contentAdult: false,
        contentSex: false
    });
    const setAvatarStylesDialog = reactive({
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
        const { ref } = props.avatarDialog;
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
        () => props.avatarDialog.loading,
        (newVal) => {
            if (newVal) {
                nextTick(() => {
                    const D = props.avatarDialog;
                    if (D.visible) {
                        adjustDialogZ(avatarDialogRef.value.$el);
                    }
                });
                handleDialogOpen();
            }
        }
    );

    function handleDialogOpen() {
        fileAnalysis.value = {};
        memo.value = '';
        treeData.value = [];
        getAvatarTimeSpent();
        getAvatarMemo();
    }

    function getAvatarTimeSpent() {
        const D = props.avatarDialog;
        database.getAvatarTimeSpent(D.id).then((aviTime) => {
            if (D.id === aviTime.avatarId) {
                timeSpent.value = aviTime.timeSpent;
                if (D.id === API.currentUser.currentAvatar && API.currentUser.$previousAvatarSwapTime) {
                    timeSpent.value += Date.now() - API.currentUser.$previousAvatarSwapTime;
                }
            }
        });
    }

    function getAvatarMemo() {
        const D = props.avatarDialog;
        database.getAvatarMemoDB(D.id).then((res) => {
            if (D.id === res.avatarId) {
                memo.value = res.memo;
            }
        });
    }

    function openFolderGeneric(path) {
        emit('openFolderGeneric', path);
    }

    function deleteVRChatCache(ref) {
        emit('deleteVRChatCache', ref);
    }

    function commaNumber(num) {
        return utils.commaNumber(num);
    }

    function avatarDialogCommand(command) {
        const D = props.avatarDialog;
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
                displayPreviousImages('Change');
                break;
            case 'Previous Images':
                displayPreviousImages('Display');
                break;
            case 'Change Description':
                promptChangeAvatarDescription(D);
                break;
            case 'Change Content Tags':
                showSetAvatarTagsDialog(D.id);
                break;
            case 'Change Styles and Author Tags':
                showSetAvatarStylesDialog(D.id);
                break;
            case 'Download Unity Package':
                openExternalLink(replaceVrcPackageUrl(props.avatarDialog.ref.unityPackageUrl));
                break;
            case 'Add Favorite':
                showFavoriteDialog('avatar', D.id);
                break;
            default:
                $confirm(`Continue? ${command}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action !== 'confirm') {
                            return;
                        }
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
                                        $message({
                                            message: 'Fallback avatar changed',
                                            type: 'success'
                                        });
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
                                        args.ref = API.applyAvatarModeration(args.json);
                                        $message({
                                            message: 'Avatar blocked',
                                            type: 'success'
                                        });
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
                                        // 'AVATAR-MODERATION:DELETE';
                                        API.cachedAvatarModerations.delete(args.params.targetAvatarId);
                                        const D = props.avatarDialog;
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
                                        $message({
                                            message: 'Avatar updated to public',
                                            type: 'success'
                                        });
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
                                        $message({
                                            message: 'Avatar updated to private',
                                            type: 'success'
                                        });
                                        return args;
                                    });
                                break;
                            case 'Delete':
                                avatarRequest
                                    .deleteAvatar({
                                        avatarId: D.id
                                    })
                                    .then((args) => {
                                        $message({
                                            message: 'Avatar deleted',
                                            type: 'success'
                                        });
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
                                        $message({
                                            message: 'Imposter deleted',
                                            type: 'success'
                                        });
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
                                        $message({
                                            message: 'Imposter queued for creation',
                                            type: 'success'
                                        });
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
                                                $message({
                                                    message: 'Imposter deleted and queued for creation',
                                                    type: 'success'
                                                });
                                                return args;
                                            });
                                    });
                                break;
                        }
                    }
                });
                break;
        }
    }

    function displayPreviousImages(command) {
        previousImagesTable.value = [];
        previousImagesFileId.value = '';
        const { imageUrl } = props.avatarDialog.ref;
        const fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        const params = {
            fileId
        };
        if (command === 'Display') {
            previousImagesDialogVisible.value = true;
        }
        if (command === 'Change') {
            changeAvatarImageDialogVisible.value = true;
        }
        imageRequest.getAvatarImages(params).then((args) => {
            storeAvatarImage(args);
            previousImagesFileId.value = args.json.id;

            const images = [];
            args.json.versions.forEach((item) => {
                if (!item.deleted) {
                    images.unshift(item);
                }
            });
            checkPreviousImageAvailable(images);
        });
    }

    async function checkPreviousImageAvailable(images) {
        previousImagesTable.value = [];
        for (const image of images) {
            if (image.file && image.file.url) {
                const response = await fetch(image.file.url, {
                    method: 'HEAD',
                    redirect: 'follow'
                }).catch((error) => {
                    console.log(error);
                });
                if (response.status === 200) {
                    previousImagesTable.value.push(image);
                }
            }
        }
    }

    function selectAvatar(id) {
        avatarRequest
            .selectAvatar({
                avatarId: id
            })
            .then((args) => {
                $message({
                    message: 'Avatar changed',
                    type: 'success'
                });
                return args;
            });
    }

    function promptChangeAvatarDescription(avatar) {
        $prompt(t('prompt.change_avatar_description.description'), t('prompt.change_avatar_description.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.change_avatar_description.ok'),
            cancelButtonText: t('prompt.change_avatar_description.cancel'),
            inputValue: avatar.ref.description,
            inputErrorMessage: t('prompt.change_avatar_description.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== avatar.ref.description) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            description: instance.inputValue
                        })
                        .then((args) => {
                            $message({
                                message: t('prompt.change_avatar_description.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
    }

    function promptRenameAvatar(avatar) {
        $prompt(t('prompt.rename_avatar.description'), t('prompt.rename_avatar.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.rename_avatar.ok'),
            cancelButtonText: t('prompt.rename_avatar.cancel'),
            inputValue: avatar.ref.name,
            inputErrorMessage: t('prompt.rename_avatar.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue !== avatar.ref.name) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            name: instance.inputValue
                        })
                        .then((args) => {
                            $message({
                                message: t('prompt.rename_avatar.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            }
        });
    }

    function onAvatarMemoChange() {
        if (memo.value) {
            database.setAvatarMemo({
                avatarId: props.avatarDialog.id,
                editedAt: new Date().toJSON(),
                memo: memo.value
            });
        } else {
            database.deleteAvatarMemo(props.avatarDialog.id);
        }
    }

    function copyAvatarId(id) {
        copyToClipboard(id);
    }

    function copyAvatarUrl(id) {
        copyToClipboard(`https://vrchat.com/home/avatar/${id}`);
    }

    function timeToText(time) {
        return utils.timeToText(time);
    }

    function refreshAvatarDialogTreeData() {
        treeData.value = utils.buildTreeData(props.avatarDialog.ref);
    }

    function getAvatarFileAnalysis() {
        let unityPackage;
        const D = props.avatarDialog;
        const avatarId = D.ref.id;
        let assetUrl = '';
        let variant = 'security';
        for (let i = D.ref.unityPackages.length - 1; i > -1; i--) {
            unityPackage = D.ref.unityPackages[i];
            if (unityPackage.variant !== 'security') {
                continue;
            }
            if (unityPackage.platform === 'standalonewindows' && compareUnityVersion(unityPackage.unitySortNumber)) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
        if (!assetUrl) {
            for (let i = D.ref.unityPackages.length - 1; i > -1; i--) {
                unityPackage = D.ref.unityPackages[i];
                if (unityPackage.variant !== 'standard') {
                    continue;
                }
                if (
                    unityPackage.platform === 'standalonewindows' &&
                    compareUnityVersion(unityPackage.unitySortNumber)
                ) {
                    variant = 'standard';
                    assetUrl = unityPackage.assetUrl;
                    break;
                }
            }
        }
        const fileId = extractFileId(assetUrl);
        const version = parseInt(extractFileVersion(assetUrl), 10);
        if (!fileId || !version) {
            $message({
                message: 'File Analysis unavailable',
                type: 'error'
            });
            return;
        }
        miscRequest.getFileAnalysis({ fileId, version, variant, avatarId }).then((args) => {
            // API.$on('FILE:ANALYSIS', function (args) {
            if (!props.avatarDialog.visible || props.avatarDialog.id !== args.params.avatarId) {
                return;
            }
            const ref = args.json;
            if (typeof ref.fileSize !== 'undefined') {
                ref._fileSize = `${(ref.fileSize / 1048576).toFixed(2)} MB`;
            }
            if (typeof ref.uncompressedSize !== 'undefined') {
                ref._uncompressedSize = `${(ref.uncompressedSize / 1048576).toFixed(2)} MB`;
            }
            if (typeof ref.avatarStats?.totalTextureUsage !== 'undefined') {
                ref._totalTextureUsage = `${(ref.avatarStats.totalTextureUsage / 1048576).toFixed(2)} MB`;
            }

            fileAnalysis.value = utils.buildTreeData(args.json);
        });
        // });
    }

    function showSetAvatarTagsDialog(avatarId) {
        const D = setAvatarTagsDialog;
        D.visible = true;
        D.loading = true;
        D.ownAvatars = [];
        D.forceUpdate = 0;
        D.selectedTags = [];
        D.selectedTagsCsv = '';
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const oldTags = props.avatarDialog.ref.tags;
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
        for (const ref of API.cachedAvatars.values()) {
            if (ref.authorId === API.currentUser.id) {
                ref.$selected = false;
                ref.$tagString = '';
                if (avatarId === ref.id) {
                    ref.$selected = true;
                    const conentTags = [];
                    ref.tags.forEach((tag) => {
                        if (tag.startsWith('content_')) {
                            conentTags.push(tag.substring(8));
                        }
                    });
                    for (let i = 0; i < conentTags.length; ++i) {
                        const tag = conentTags[i];
                        if (i < conentTags.length - 1) {
                            ref.$tagString += `${tag}, `;
                        } else {
                            ref.$tagString += tag;
                        }
                    }
                }
                D.ownAvatars.push(ref);
            }
        }
        nextTick(() => {
            D.loading = false;
        });
    }

    function showSetAvatarStylesDialog() {
        const D = setAvatarStylesDialog;
        D.visible = true;
        D.loading = true;
        D.avatarId = props.avatarDialog.id;
        D.primaryStyle = props.avatarDialog.ref.styles?.primary || '';
        D.secondaryStyle = props.avatarDialog.ref.styles?.secondary || '';
        D.initialPrimaryStyle = D.primaryStyle;
        D.initialSecondaryStyle = D.secondaryStyle;
        D.initialTags = props.avatarDialog.ref.tags;
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
        const clearFile = function () {
            if (document.querySelector('#AvatarGalleryUploadButton')) {
                document.querySelector('#AvatarGalleryUploadButton').value = '';
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
            props.avatarDialog.galleryLoading = true;
            const base64Body = btoa(r.result);
            avatarRequest
                .uploadAvatarGalleryImage(base64Body, props.avatarDialog.id)
                .then((args) => {
                    $message({
                        message: t('message.avatar_gallery.uploaded'),
                        type: 'success'
                    });
                    console.log(args);
                    props.avatarDialog.galleryImages = getAvatarGallery(props.avatarDialog.id);
                    return args;
                })
                .finally(() => {
                    props.avatarDialog.galleryLoading = false;
                });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function deleteAvatarGalleryImage(imageUrl) {
        const fileId = extractFileId(imageUrl);
        miscRequest.deleteFile(fileId).then((args) => {
            $message({
                message: t('message.avatar_gallery.deleted'),
                type: 'success'
            });
            props.avatarDialog.galleryImages = getAvatarGallery(props.avatarDialog.id);
            return args;
        });
    }

    function reorderAvatarGalleryImage(imageUrl, direction) {
        const fileId = extractFileId(imageUrl);
        let fileIds = [];
        props.avatarDialog.ref.gallery.forEach((item) => {
            fileIds.push(extractFileId(item.id));
        });
        const index = fileIds.indexOf(fileId);
        if (index === -1) {
            $message({
                message: t('message.avatar_gallery.not_found'),
                type: 'error'
            });
            return;
        }
        if (direction === -1 && index === 0) {
            $message({
                message: t('message.avatar_gallery.already_first'),
                type: 'warning'
            });
            return;
        }
        if (direction === 1 && index === fileIds.length - 1) {
            $message({
                message: t('message.avatar_gallery.already_last'),
                type: 'warning'
            });
            return;
        }
        if (direction === -1) {
            utils.moveArrayItem(fileIds, index, index - 1);
        } else {
            utils.moveArrayItem(fileIds, index, index + 1);
        }
        avatarRequest.setAvatarGalleryOrder(fileIds).then((args) => {
            $message({
                message: t('message.avatar_gallery.reordered'),
                type: 'success'
            });
            props.avatarDialog.galleryImages = getAvatarGallery(props.avatarDialog.id);
            return args;
        });
    }
</script>
