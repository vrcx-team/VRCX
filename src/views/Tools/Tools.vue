<template>
    <div id="chart" class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.tools.header') }}</span>

            <div class="tool-categories">
                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('group')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['group'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.group.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['group']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showGroupCalendarDialog">
                                <div class="tool-icon">
                                    <i class="ri-calendar-event-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.group.calendar') }}</div>
                                    <div class="tool-description">{{ t('view.tools.group.calendar_description') }}</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('image')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['image'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.pictures.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['image']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showScreenshotMetadataPage">
                                <div class="tool-icon">
                                    <i class="ri-screenshot-2-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.pictures.screenshot') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.pictures.screenshot_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showGalleryPage">
                                <div class="tool-icon">
                                    <i class="ri-multi-image-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.pictures.inventory') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.pictures.inventory_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openVrcPhotosFolder">
                                <div class="tool-icon">
                                    <i class="ri-folder-image-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.pictures.pictures.vrc_photos') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.pictures.pictures.vrc_photos_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openVrcScreenshotsFolder">
                                <div class="tool-icon">
                                    <i class="ri-folder-image-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">
                                        {{ t('view.tools.pictures.pictures.steam_screenshots') }}
                                    </div>
                                    <div class="tool-description">
                                        {{ t('view.tools.pictures.pictures.steam_screenshots_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('user')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['user'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.export.header') }}</span>
                    </div>

                    <div class="tools-grid" v-show="!categoryCollapsed['user']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showExportDiscordNamesDialog">
                                <div class="tool-icon">
                                    <i class="ri-discord-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.export.discord_names') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.user.discord_names_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showNoteExportDialog">
                                <div class="tool-icon">
                                    <i class="ri-user-shared-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.export.export_notes') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.export.export_notes_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showExportFriendsListDialog">
                                <div class="tool-icon">
                                    <i class="ri-user-shared-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.export.export_friend_list') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.user.export_friend_list_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showExportAvatarsListDialog">
                                <div class="tool-icon">
                                    <i class="ri-user-shared-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.export.export_own_avatars') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.user.export_own_avatars_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('other')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['other'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.other.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['other']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showEditInviteMessageDialog">
                                <div class="tool-icon">
                                    <i class="ri-edit-box-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.other.edit_invite_message') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.other.edit_invite_message_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
        <template v-if="isToolsTabVisible">
            <GroupCalendarDialog
                :visible="isGroupCalendarDialogVisible"
                @close="isGroupCalendarDialogVisible = false" />
            <NoteExportDialog
                :isNoteExportDialogVisible="isNoteExportDialogVisible"
                @close="isNoteExportDialogVisible = false" />
            <ExportDiscordNamesDialog
                v-model:discordNamesDialogVisible="isExportDiscordNamesDialogVisible"
                :friends="friends" />
            <ExportFriendsListDialog
                v-model:isExportFriendsListDialogVisible="isExportFriendsListDialogVisible"
                :friends="friends" />
            <ExportAvatarsListDialog v-model:isExportAvatarsListDialogVisible="isExportAvatarsListDialogVisible" />
            <EditInviteMessageDialog
                v-model:isEditInviteMessagesDialogVisible="isEditInviteMessagesDialogVisible"
                @close="isEditInviteMessagesDialogVisible = false" />
        </template>
    </div>
</template>

<script setup>
    import { computed, defineAsyncComponent, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { ArrowRight } from '@element-plus/icons-vue';
    import { Card } from '@/components/ui/card';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFriendStore, useGalleryStore } from '../../stores';

    const GroupCalendarDialog = defineAsyncComponent(() => import('./dialogs/GroupCalendarDialog.vue'));
    const NoteExportDialog = defineAsyncComponent(() => import('./dialogs/NoteExportDialog.vue'));
    const EditInviteMessageDialog = defineAsyncComponent(() => import('./dialogs/EditInviteMessagesDialog.vue'));
    const ExportDiscordNamesDialog = defineAsyncComponent(() => import('./dialogs/ExportDiscordNamesDialog.vue'));
    const ExportFriendsListDialog = defineAsyncComponent(() => import('./dialogs/ExportFriendsListDialog.vue'));
    const ExportAvatarsListDialog = defineAsyncComponent(() => import('./dialogs/ExportAvatarsListDialog.vue'));

    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();

    const { showGalleryPage } = useGalleryStore();
    const { friends } = storeToRefs(useFriendStore());

    const categoryCollapsed = ref({
        group: false,
        image: false,
        user: false,
        other: false
    });

    const isGroupCalendarDialogVisible = ref(false);
    const isNoteExportDialogVisible = ref(false);
    const isExportDiscordNamesDialogVisible = ref(false);
    const isExportFriendsListDialogVisible = ref(false);
    const isExportAvatarsListDialogVisible = ref(false);
    const isEditInviteMessagesDialogVisible = ref(false);
    const isToolsTabVisible = computed(() => route.name === 'tools');

    const showGroupCalendarDialog = () => {
        isGroupCalendarDialogVisible.value = true;
    };

    const showScreenshotMetadataPage = () => {
        router.push({ name: 'screenshot-metadata' });
    };

    const showNoteExportDialog = () => {
        isNoteExportDialogVisible.value = true;
    };

    const toggleCategory = (category) => {
        categoryCollapsed.value[category] = !categoryCollapsed.value[category];
    };

    const showEditInviteMessageDialog = () => {
        isEditInviteMessagesDialogVisible.value = true;
    };

    function showExportDiscordNamesDialog() {
        isExportDiscordNamesDialogVisible.value = true;
    }

    function showExportFriendsListDialog() {
        isExportFriendsListDialogVisible.value = true;
    }

    function showExportAvatarsListDialog() {
        isExportAvatarsListDialogVisible.value = true;
    }

    function openVrcPhotosFolder() {
        AppApi.OpenVrcPhotosFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error("Folder dosn't exist");
            }
        });
    }

    function openVrcScreenshotsFolder() {
        AppApi.OpenVrcScreenshotsFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error("Folder dosn't exist");
            }
        });
    }
</script>

<style scoped>
    .tool-categories {
        margin-top: 20px;
        padding: 0 20px;
    }

    .tool-category {
        margin-bottom: 24px;

        .category-header {
            cursor: pointer;
            display: flex;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            margin-bottom: 12px;
            transition: all 0.2s ease;

            &:hover {
                background-color: var(--el-color-primary-light-9);
            }

            .el-icon-arrow-right {
                font-size: 14px;
                margin-right: 8px;
                transition: transform 0.3s;
                color: var(--el-color-primary);
            }

            .category-title {
                margin-left: 5px;
                font-size: 16px;
                font-weight: 600;
            }
        }
    }

    .tools-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-left: 16px;
    }

    .tool-card {
        transition: all 0.3s ease;
        position: relative;
        overflow: visible;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;

        &:hover {
            transform: translateY(-2px);
            box-shadow: var(--el-box-shadow-light);
        }

        .tool-content {
            display: flex;
            align-items: center;
            padding: 20px 16px;

            .tool-icon {
                width: 56px;
                height: 56px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--el-color-primary-light-9);
                border-radius: 12px;
                margin-right: 20px;
                box-shadow: var(--el-box-shadow-lighter);

                i {
                    font-size: 28px;
                    color: var(--el-color-primary);
                }
            }

            .tool-info {
                flex: 1;

                .tool-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                    margin-bottom: 4px;
                }

                .tool-description {
                    font-size: 14px;
                    color: var(--el-text-color-secondary);
                    opacity: 0.8;
                }
            }
        }
    }

    .is-rotated {
        transform: rotate(90deg);
    }

    .rotation-transition {
        transition: transform 0.2s ease-in-out;
    }
</style>
