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
                            <el-popover placement="top" trigger="click">
                                <span
                                    slot="reference"
                                    class="dialog-title"
                                    style="margin-right: 5px; cursor: pointer"
                                    v-text="avatarDialog.ref.name"
                                    @click="copyToClipboard(avatarDialog.ref.name)"></span>
                                <span style="display: block; text-align: center; font-family: monospace">{{
                                    textToHex(avatarDialog.ref.name)
                                }}</span>
                            </el-popover>
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
                                :disabled="currentUser.currentAvatar === avatarDialog.id"
                                style="margin-left: 5px"
                                @click="selectAvatarWithoutConfirmation(avatarDialog.id)"></el-button>
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
                            <el-dropdown-menu>
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
                                    v-if="avatarDialog.ref.authorId !== currentUser.id"
                                    icon="el-icon-picture-outline"
                                    command="Previous Images"
                                    >{{ t('dialog.avatar.actions.show_previous_images') }}</el-dropdown-item
                                >
                                <template v-if="avatarDialog.ref.authorId === currentUser.id">
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
            <el-tabs ref="avatarDialogTabsRef" @tab-click="avatarDialogTabClick">
                <el-tab-pane name="Info" :label="t('dialog.avatar.info.header')">
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
                            <el-button
                                v-if="avatarDialog.ref.authorId === currentUser.id"
                                :disabled="!!avatarDialog.galleryLoading"
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
                                        v-if="avatarDialog.ref.authorId === currentUser.id"
                                        style="position: absolute; bottom: 5px; left: 33.3%">
                                        <el-button
                                            size="mini"
                                            icon="el-icon-back"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, -1)"></el-button>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-right"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, 1)"></el-button>
                                        <el-button
                                            size="mini"
                                            icon="el-icon-delete"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0"
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
                                            <el-dropdown-menu>
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
                <el-tab-pane name="JSON" :label="t('dialog.avatar.json.header')" style="max-height: 50vh" lazy>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        @click="refreshAvatarDialogTreeData"></el-button>
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(avatarDialog.id, avatarDialog.ref)"></el-button>
                    <el-tree
                        v-if="Object.keys(avatarDialog.fileAnalysis).length > 0"
                        :data="avatarDialog.fileAnalysis"
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
            :previous-images-file-id="previousImagesFileId"
            @refresh="displayPreviousImages" />
        <PreviousImagesDialog />
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { avatarModerationRequest, avatarRequest, favoriteRequest, imageRequest, miscRequest } from '../../../api';
    import { database } from '../../../service/database';
    import {
        adjustDialogZ,
        buildTreeData,
        commaNumber,
        compareUnityVersion,
        copyToClipboard,
        downloadAndSaveJson,
        extractFileId,
        extractFileVersion,
        openExternalLink,
        openFolderGeneric,
        replaceVrcPackageUrl,
        storeAvatarImage,
        timeToText,
        moveArrayItem,
        formatDateFilter,
        textToHex
    } from '../../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useAvatarStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useUserStore
    } from '../../../stores';
    import PreviousImagesDialog from '../PreviousImagesDialog.vue';
    import ChangeAvatarImageDialog from './ChangeAvatarImageDialog.vue';
    import SetAvatarStylesDialog from './SetAvatarStylesDialog.vue';
    import SetAvatarTagsDialog from './SetAvatarTagsDialog.vue';

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog, sortUserDialogAvatars } = useUserStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { avatarDialog, cachedAvatarModerations, cachedAvatars, cachedAvatarNames } = storeToRefs(useAvatarStore());
    const { showAvatarDialog, getAvatarGallery, applyAvatarModeration, applyAvatar, selectAvatarWithoutConfirmation } =
        useAvatarStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { deleteVRChatCache } = useGameStore();
    const { previousImagesDialogVisible, previousImagesTable } = storeToRefs(useGalleryStore());
    const { showFullscreenImageDialog, checkPreviousImageAvailable } = useGalleryStore();

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const { $message, $confirm, $prompt } = instance.proxy;

    defineEmits(['openPreviousImagesDialog']);

    const avatarDialogRef = ref(null);
    const avatarDialogTabsRef = ref(null);
    const avatarDialogLastActiveTab = ref('Info');
    const changeAvatarImageDialogVisible = ref(false);
    const previousImagesFileId = ref('');

    const treeData = ref([]);
    const timeSpent = ref(0);
    const memo = ref('');
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
                nextTick(() => {
                    if (avatarDialogRef.value?.$el) {
                        adjustDialogZ(avatarDialogRef.value.$el);
                    }
                });
                handleDialogOpen();
                !avatarDialog.value.loading && toggleLastActiveTab();
            }
        }
    );

    function handleAvatarDialogTab(name) {
        if (name === 'JSON') {
            refreshAvatarDialogTreeData();
        }
    }

    function toggleLastActiveTab() {
        let tabName = avatarDialogTabsRef.value.currentName;
        console.log(tabName);
        if (tabName === '0') {
            tabName = avatarDialogLastActiveTab.value;
            avatarDialogTabsRef.value.setCurrentName(tabName);
        }
        handleAvatarDialogTab(tabName);
        avatarDialogLastActiveTab.value = tabName;
    }

    function avatarDialogTabClick(obj) {
        if (avatarDialogLastActiveTab.value === obj.name) {
            return;
        }
        handleAvatarDialogTab(obj.name);
        avatarDialogLastActiveTab.value = obj.name;
    }

    function getImageUrlFromImageId(imageId) {
        return `https://api.vrchat.cloud/api/1/file/${imageId}/1/`;
    }

    function handleDialogOpen() {
        avatarDialog.value.fileAnalysis = {};
        memo.value = '';
        treeData.value = [];
        getAvatarTimeSpent();
        getAvatarMemo();
    }

    function getAvatarTimeSpent() {
        const D = avatarDialog.value;
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
                showSetAvatarStylesDialog();
                break;
            case 'Download Unity Package':
                openExternalLink(replaceVrcPackageUrl(avatarDialog.value.ref.unityPackageUrl));
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
                                        applyAvatarModeration(args.json);
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
                                        cachedAvatarModerations.value.delete(args.params.targetAvatarId);
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
                                        applyAvatar(args.json);
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
                                        const { json } = args;
                                        cachedAvatars.value.delete(json._id);
                                        if (userDialog.value.id === json.authorId) {
                                            const map = new Map();
                                            for (const ref of cachedAvatars.value.values()) {
                                                if (ref.authorId === json.authorId) {
                                                    map.set(ref.id, ref);
                                                }
                                            }
                                            const array = Array.from(map.values());
                                            sortUserDialogAvatars(array);
                                        }

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
        const { imageUrl } = avatarDialog.value.ref;
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
            storeAvatarImage(args, cachedAvatarNames.value);
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
                            applyAvatar(args.json);
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
                            applyAvatar(args.json);
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
        treeData.value = buildTreeData(avatarDialog.value.ref);
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
        for (const ref of cachedAvatars.value.values()) {
            if (ref.authorId === currentUser.value.id) {
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
        const clearFile = function () {
            const fileInput = /** @type {HTMLInputElement} */ (document.querySelector('#AvatarGalleryUploadButton'));
            if (fileInput) {
                fileInput.value = '';
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
            avatarDialog.value.galleryLoading = true;
            const base64Body = btoa(r.result.toString());
            avatarRequest
                .uploadAvatarGalleryImage(base64Body, avatarDialog.value.id)
                .then(async (args) => {
                    $message({
                        message: t('message.avatar_gallery.uploaded'),
                        type: 'success'
                    });
                    console.log(args);
                    avatarDialog.value.galleryImages = await getAvatarGallery(avatarDialog.value.id);
                    return args;
                })
                .finally(() => {
                    avatarDialog.value.galleryLoading = false;
                });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    }

    function reorderAvatarGalleryImage(imageUrl, direction) {
        const fileId = extractFileId(imageUrl);
        let fileIds = [];
        avatarDialog.value.ref.gallery.forEach((item) => {
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
            moveArrayItem(fileIds, index, index - 1);
        } else {
            moveArrayItem(fileIds, index, index + 1);
        }
        avatarRequest.setAvatarGalleryOrder(fileIds).then(async (args) => {
            $message({
                message: t('message.avatar_gallery.reordered'),
                type: 'success'
            });
            avatarDialog.value.galleryImages = await getAvatarGallery(avatarDialog.value.id);
            return args;
        });
    }

    function deleteAvatarGalleryImage(imageUrl) {
        const fileId = extractFileId(imageUrl);
        miscRequest.deleteFile(fileId).then((args) => {
            $message({
                message: t('message.avatar_gallery.deleted'),
                type: 'success'
            });
            getAvatarGallery(avatarDialog.value.id);
            return args;
        });
    }
</script>
