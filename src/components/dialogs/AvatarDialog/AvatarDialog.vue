<template>
    <el-dialog
        :z-index="avatarDialogIndex"
        class="x-dialog x-avatar-dialog"
        v-model="avatarDialog.visible"
        :show-close="false"
        width="700px">
        <div v-loading="avatarDialog.loading">
            <div style="display: flex">
                <el-popover placement="right" :width="500" trigger="click">
                    <template #reference>
                        <img
                            :src="avatarDialog.ref.thumbnailImageUrl"
                            class="x-link"
                            style="flex: none; width: 160px; height: 120px; border-radius: 12px"
                            loading="lazy" />
                    </template>
                    <img
                        :src="avatarDialog.ref.imageUrl"
                        :class="['x-link', 'x-popover-image']"
                        @click="showFullscreenImageDialog(avatarDialog.ref.imageUrl)"
                        loading="lazy" />
                </el-popover>
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <el-popover placement="top" trigger="click">
                                <template #reference>
                                    <span
                                        class="dialog-title"
                                        style="margin-right: 5px; cursor: pointer"
                                        v-text="avatarDialog.ref.name"
                                        @click="copyToClipboard(avatarDialog.ref.name)"></span>
                                </template>
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
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.public') }}</el-tag
                            >
                            <el-tag
                                v-else
                                type="danger"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.private') }}</el-tag
                            >
                            <el-tag
                                v-if="avatarDialog.isPC"
                                class="x-tag-platform-pc"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >PC
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
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isQuest"
                                class="x-tag-platform-quest"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >Android
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
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isIos"
                                class="x-tag-platform-ios"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >iOS
                                <span
                                    v-if="avatarDialog.platformInfo.ios"
                                    :class="['x-grey', 'x-tag-platform-ios', 'x-tag-border-left']"
                                    >{{ avatarDialog.platformInfo.ios.performanceRating }}</span
                                >
                                <span
                                    v-if="avatarDialog.bundleSizes['ios']"
                                    :class="['x-grey', 'x-tag-platform-ios', 'x-tag-border-left']"
                                    >{{ avatarDialog.bundleSizes['ios'].fileSize }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.inCache"
                                class="x-link"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(avatarDialog.cachePath)">
                                <span v-text="avatarDialog.cacheSize"></span>
                                &nbsp;{{ t('dialog.avatar.tags.cache') }}
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.ref.styles?.primary || avatarDialog.ref.styles?.secondary"
                                type="info"
                                effect="plain"
                                size="small"
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
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.isQuestFallback"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.fallback') }}</el-tag
                            >
                            <el-tag
                                v-if="avatarDialog.hasImposter"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.impostor') }}
                                <span v-if="avatarDialog.imposterVersion" :class="['x-grey', 'x-tag-border-left']"
                                    >v{{ avatarDialog.imposterVersion }}</span
                                >
                            </el-tag>
                            <el-tag
                                v-if="avatarDialog.ref.unityPackageUrl"
                                type="success"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px; margin-top: 5px"
                                >{{ t('dialog.avatar.tags.future_proofing') }}</el-tag
                            >
                            <div>
                                <template v-for="tag in avatarDialog.ref.tags" :key="tag">
                                    <el-tag
                                        v-if="tag.startsWith('content_')"
                                        effect="plain"
                                        size="small"
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
                                    </el-tag>
                                    <el-tag
                                        v-if="tag.startsWith('author_tag_')"
                                        effect="plain"
                                        size="small"
                                        style="margin-right: 5px; margin-top: 5px">
                                        <span>
                                            {{ tag.replace('author_tag_', '') }}
                                        </span>
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
                            :content="t('dialog.avatar.actions.delete_cache_tooltip')">
                            <el-button
                                :icon="Delete"
                                size="large"
                                circle
                                :disabled="isGameRunning && avatarDialog.cacheLocked"
                                @click="deleteVRChatCache(avatarDialog.ref)"></el-button>
                        </el-tooltip>
                        <el-tooltip
                            v-if="avatarDialog.isFavorite"
                            placement="top"
                            :content="t('dialog.avatar.actions.favorite_tooltip')">
                            <el-button
                                type="warning"
                                :icon="Star"
                                size="large"
                                circle
                                style="margin-left: 5px"
                                @click="avatarDialogCommand('Add Favorite')"></el-button>
                        </el-tooltip>
                        <el-tooltip v-else placement="top" :content="t('dialog.avatar.actions.favorite_tooltip')">
                            <el-button
                                type="default"
                                :icon="StarFilled"
                                size="large"
                                circle
                                style="margin-left: 5px"
                                @click="avatarDialogCommand('Add Favorite')"></el-button>
                        </el-tooltip>
                        <el-tooltip placement="top" :content="t('dialog.avatar.actions.select')">
                            <el-button
                                type="default"
                                :icon="Check"
                                size="large"
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
                                :icon="MoreFilled"
                                size="large"
                                circle></el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item :icon="Refresh" command="Refresh">{{
                                        t('dialog.avatar.actions.refresh')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item :icon="Share" command="Share">{{
                                        t('dialog.avatar.actions.share')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="avatarDialog.isBlocked"
                                        :icon="CircleCheck"
                                        command="Unblock Avatar"
                                        style="color: #f56c6c"
                                        divided
                                        >{{ t('dialog.avatar.actions.unblock') }}</el-dropdown-item
                                    >
                                    <el-dropdown-item v-else :icon="CircleClose" command="Block Avatar" divided>{{
                                        t('dialog.avatar.actions.block')
                                    }}</el-dropdown-item>
                                    <el-dropdown-item
                                        v-if="/quest/.test(avatarDialog.ref.tags)"
                                        :icon="Check"
                                        command="Select Fallback Avatar"
                                        >{{ t('dialog.avatar.actions.select_fallback') }}</el-dropdown-item
                                    >
                                    <template v-if="avatarDialog.ref.authorId === currentUser.id">
                                        <el-dropdown-item
                                            v-if="avatarDialog.ref.releaseStatus === 'public'"
                                            :icon="User"
                                            command="Make Private"
                                            divided
                                            >{{ t('dialog.avatar.actions.make_private') }}</el-dropdown-item
                                        >
                                        <el-dropdown-item v-else :icon="User" command="Make Public" divided>{{
                                            t('dialog.avatar.actions.make_public')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Rename">{{
                                            t('dialog.avatar.actions.rename')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Change Description">{{
                                            t('dialog.avatar.actions.change_description')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Change Content Tags">{{
                                            t('dialog.avatar.actions.change_content_tags')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Edit" command="Change Styles and Author Tags">{{
                                            t('dialog.avatar.actions.change_styles_author_tags')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Picture" command="Change Image">{{
                                            t('dialog.avatar.actions.change_image')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item
                                            v-if="avatarDialog.ref.unityPackageUrl"
                                            :icon="Download"
                                            command="Download Unity Package"
                                            >{{ t('dialog.avatar.actions.download_package') }}</el-dropdown-item
                                        >
                                        <el-dropdown-item
                                            v-if="avatarDialog.hasImposter"
                                            :icon="Refresh"
                                            command="Regenerate Imposter"
                                            style="color: #f56c6c"
                                            divided
                                            >{{ t('dialog.avatar.actions.regenerate_impostor') }}</el-dropdown-item
                                        >
                                        <el-dropdown-item
                                            v-if="avatarDialog.hasImposter"
                                            :icon="Delete"
                                            command="Delete Imposter"
                                            style="color: #f56c6c"
                                            >{{ t('dialog.avatar.actions.delete_impostor') }}</el-dropdown-item
                                        >
                                        <el-dropdown-item v-else :icon="User" command="Create Imposter" divided>{{
                                            t('dialog.avatar.actions.create_impostor')
                                        }}</el-dropdown-item>
                                        <el-dropdown-item :icon="Delete" command="Delete" style="color: #f56c6c">{{
                                            t('dialog.avatar.actions.delete')
                                        }}</el-dropdown-item>
                                    </template>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </div>
            </div>
            <el-tabs v-model="avatarDialogLastActiveTab" @tab-click="avatarDialogTabClick">
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
                                :icon="Upload"
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
                                        @click="showFullscreenImageDialog(imageUrl)"
                                        loading="lazy" />
                                    <div
                                        v-if="avatarDialog.ref.authorId === currentUser.id"
                                        style="position: absolute; bottom: 5px; left: 33.3%">
                                        <el-button
                                            size="small"
                                            :icon="Back"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, -1)"></el-button>
                                        <el-button
                                            size="small"
                                            :icon="Right"
                                            circle
                                            class="x-link"
                                            style="margin-left: 0"
                                            @click.stop="reorderAvatarGalleryImage(imageUrl, 1)"></el-button>
                                        <el-button
                                            size="small"
                                            :icon="Delete"
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
                                <el-input
                                    v-model="memo"
                                    class="extra"
                                    size="small"
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
                                    }}<el-tooltip placement="top" :content="t('dialog.avatar.info.id_tooltip')">
                                        <el-dropdown trigger="click" size="small" style="margin-left: 5px">
                                            <el-button
                                                type="default"
                                                :icon="CopyDocument"
                                                size="small"
                                                circle
                                                @click.stop></el-button>
                                            <template #dropdown>
                                                <el-dropdown-menu>
                                                    <el-dropdown-item @click="copyAvatarId(avatarDialog.id)">{{
                                                        t('dialog.avatar.info.copy_id')
                                                    }}</el-dropdown-item>
                                                    <el-dropdown-item @click="copyAvatarUrl(avatarDialog.id)">{{
                                                        t('dialog.avatar.info.copy_url')
                                                    }}</el-dropdown-item>
                                                </el-dropdown-menu>
                                            </template>
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
                                    }}<el-tooltip placement="top" :content="t('dialog.world.info.accuracy_notice')">
                                        <el-icon style="margin-left: 3px"><Warning /></el-icon></el-tooltip
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
                        size="small"
                        :icon="Refresh"
                        circle
                        @click="refreshAvatarDialogTreeData"></el-button>
                    <el-button
                        type="default"
                        size="small"
                        :icon="Download"
                        circle
                        style="margin-left: 5px"
                        @click="downloadAndSaveJson(avatarDialog.id, avatarDialog.ref)"></el-button>
                    <el-tree :data="treeData" style="margin-top: 5px; font-size: 12px">
                        <template #default="scope">
                            <span>
                                <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                                <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                            </span>
                        </template>
                    </el-tree>
                    <br />
                    <el-tree
                        v-if="avatarDialog.fileAnalysis.length > 0"
                        :data="avatarDialog.fileAnalysis"
                        style="margin-top: 5px; font-size: 12px">
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
        <template v-if="avatarDialog.visible">
            <SetAvatarTagsDialog :set-avatar-tags-dialog="setAvatarTagsDialog" />
            <SetAvatarStylesDialog :set-avatar-styles-dialog="setAvatarStylesDialog" />
            <ChangeAvatarImageDialog
                v-model:changeAvatarImageDialogVisible="changeAvatarImageDialogVisible"
                v-model:previousImageUrl="previousImageUrl" />
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage, ElMessageBox } from 'element-plus';

    import {
        Delete,
        Star,
        StarFilled,
        Check,
        MoreFilled,
        Refresh,
        Share,
        CircleCheck,
        CircleClose,
        Picture,
        User,
        Edit,
        Download,
        Upload,
        Back,
        Right,
        CopyDocument,
        Warning
    } from '@element-plus/icons-vue';

    import { storeToRefs } from 'pinia';
    import { computed, defineAsyncComponent, nextTick, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { avatarModerationRequest, avatarRequest, favoriteRequest, miscRequest } from '../../../api';
    import { database } from '../../../service/database';
    import {
        buildTreeData,
        commaNumber,
        copyToClipboard,
        downloadAndSaveJson,
        extractFileId,
        openExternalLink,
        openFolderGeneric,
        replaceVrcPackageUrl,
        timeToText,
        moveArrayItem,
        formatDateFilter,
        textToHex
    } from '../../../shared/utils';
    import { getNextDialogIndex } from '../../../shared/utils/base/ui';
    import { useAvatarStore, useFavoriteStore, useGalleryStore, useGameStore, useUserStore } from '../../../stores';

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

    const { t } = useI18n();

    const avatarDialogIndex = ref(2000);
    const avatarDialogLastActiveTab = ref('Info');
    const changeAvatarImageDialogVisible = ref(false);
    const previousImageUrl = ref('');

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
                    avatarDialogIndex.value = getNextDialogIndex();
                });
                handleDialogOpen();
                !avatarDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    function handleAvatarDialogTab(tabName) {
        if (tabName === 'JSON') {
            refreshAvatarDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleAvatarDialogTab(avatarDialogLastActiveTab.value);
    }

    function avatarDialogTabClick(obj) {
        if (obj.props.name === avatarDialogLastActiveTab.value) {
            return;
        }
        handleAvatarDialogTab(obj.props.name);
        avatarDialogLastActiveTab.value = obj.props.name;
    }

    function getImageUrlFromImageId(imageId) {
        return `https://api.vrchat.cloud/api/1/file/${imageId}/1/`;
    }

    function handleDialogOpen() {
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
                ElMessageBox.confirm(`Continue? ${command}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info'
                })
                    .then((action) => {
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
                                        ElMessage({
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
                                        ElMessage({
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
                                        ElMessage({
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
                                        ElMessage({
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

                                        ElMessage({
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
                                        ElMessage({
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
                                        ElMessage({
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
                                                ElMessage({
                                                    message: 'Imposter deleted and queued for creation',
                                                    type: 'success'
                                                });
                                                return args;
                                            });
                                    });
                                break;
                        }
                    })
                    .catch(() => {});
                break;
        }
    }

    function showChangeAvatarImageDialog() {
        const { imageUrl } = avatarDialog.value.ref;
        previousImageUrl.value = imageUrl;
        changeAvatarImageDialogVisible.value = true;
    }

    function promptChangeAvatarDescription(avatar) {
        ElMessageBox.prompt(
            t('prompt.change_avatar_description.description'),
            t('prompt.change_avatar_description.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.change_avatar_description.ok'),
                cancelButtonText: t('prompt.change_avatar_description.cancel'),
                inputValue: avatar.ref.description,
                inputErrorMessage: t('prompt.change_avatar_description.input_error')
            }
        )
            .then(({ value }) => {
                if (value && value !== avatar.ref.description) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            description: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            ElMessage({
                                message: t('prompt.change_avatar_description.message.success'),
                                type: 'success'
                            });
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    function promptRenameAvatar(avatar) {
        ElMessageBox.prompt(t('prompt.rename_avatar.description'), t('prompt.rename_avatar.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.rename_avatar.ok'),
            cancelButtonText: t('prompt.rename_avatar.cancel'),
            inputValue: avatar.ref.name,
            inputErrorMessage: t('prompt.rename_avatar.input_error')
        })
            .then(({ value }) => {
                if (value && value !== avatar.ref.name) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            name: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            ElMessage({
                                message: t('prompt.rename_avatar.message.success'),
                                type: 'success'
                            });
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
        for (const ref of cachedAvatars.values()) {
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
            ElMessage({
                message: t('message.file.too_large'),
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            ElMessage({
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
                    ElMessage({
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
            ElMessage({
                message: t('message.avatar_gallery.not_found'),
                type: 'error'
            });
            return;
        }
        if (direction === -1 && index === 0) {
            ElMessage({
                message: t('message.avatar_gallery.already_first'),
                type: 'warning'
            });
            return;
        }
        if (direction === 1 && index === fileIds.length - 1) {
            ElMessage({
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
            ElMessage({
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
            ElMessage({
                message: t('message.avatar_gallery.deleted'),
                type: 'success'
            });
            getAvatarGallery(avatarDialog.value.id);
            return args;
        });
    }
</script>
