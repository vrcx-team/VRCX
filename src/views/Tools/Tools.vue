<template>
    <div id="chart" class="x-container" v-show="isShowToolsTab">
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
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showGroupCalendarDialog">
                                <div class="tool-icon">
                                    <i class="ri-calendar-event-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.group.calendar') }}</div>
                                    <div class="tool-description">{{ t('view.tools.group.calendar_description') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('image')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['image'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.image.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['image']">
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showScreenshotMetadataDialog">
                                <div class="tool-icon">
                                    <i class="ri-screenshot-2-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.image.screenshot') }}</div>
                                    <div class="tool-description">{{ t('view.tools.image.screenshot_description') }}</div>
                                </div>
                            </div>
                        </el-card>
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showGalleryDialog">
                                <div class="tool-icon">
                                    <i class="ri-multi-image-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.image.inventory') }}</div>
                                    <div class="tool-description">{{ t('view.tools.image.inventory_description') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('user')">
                        <el-icon class="rotation-transition" :class="{ 'is-rotated': !categoryCollapsed['user'] }"
                            ><ArrowRight
                        /></el-icon>
                        <span class="category-title">{{ t('view.tools.user.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['user']">
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showNoteExportDialog">
                                <div class="tool-icon">
                                    <i class="ri-user-shared-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.user.export_notes') }}</div>
                                    <div class="tool-description">{{ t('view.tools.user.export_notes_description') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>
            </div>
        </div>
        <template v-if="isShowToolsTab">
            <GroupCalendarDialog
                :visible="isGroupCalendarDialogVisible"
                @close="isGroupCalendarDialogVisible = false" />
            <ScreenshotMetadataDialog
                :isScreenshotMetadataDialogVisible="isScreenshotMetadataDialogVisible"
                @close="isScreenshotMetadataDialogVisible = false" />
            <NoteExportDialog
                :isNoteExportDialogVisible="isNoteExportDialogVisible"
                @close="isNoteExportDialogVisible = false" />
            <GalleryDialog />
        </template>
    </div>
</template>

<script setup>
    import { ArrowRight } from '@element-plus/icons-vue';
    import { ref, defineAsyncComponent, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { storeToRefs } from 'pinia';
    import { useUiStore, useGalleryStore } from '../../stores';

    const GroupCalendarDialog = defineAsyncComponent(() => import('./dialogs/GroupCalendarDialog.vue'));
    const ScreenshotMetadataDialog = defineAsyncComponent(() => import('./dialogs/ScreenshotMetadataDialog.vue'));
    const NoteExportDialog = defineAsyncComponent(() => import('./dialogs/NoteExportDialog.vue'));
    const GalleryDialog = defineAsyncComponent(() => import('./dialogs/GalleryDialog.vue'));

    const { t } = useI18n();

    const uiStore = useUiStore();
    const { showGalleryDialog } = useGalleryStore();
    const { menuActiveIndex } = storeToRefs(uiStore);

    const categoryCollapsed = ref({
        group: false,
        image: false,
        user: false
    });

    const isGroupCalendarDialogVisible = ref(false);
    const isScreenshotMetadataDialogVisible = ref(false);
    const isNoteExportDialogVisible = ref(false);

    const isShowToolsTab = computed(() => menuActiveIndex.value === 'tools');

    const showGroupCalendarDialog = () => {
        isGroupCalendarDialogVisible.value = true;
    };

    const showScreenshotMetadataDialog = () => {
        isScreenshotMetadataDialogVisible.value = true;
    };

    const showNoteExportDialog = () => {
        isNoteExportDialogVisible.value = true;
    };

    const toggleCategory = (category) => {
        categoryCollapsed.value[category] = !categoryCollapsed.value[category];
    };
</script>

<style lang="scss" scoped>
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
            background-color: var(--el-color-primary-light-9);
            transition: all 0.2s ease;

            &:hover {
                background-color: var(--el-color-primary-light-8);
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
                color: var(--el-color-primary);
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

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        :deep(.el-card__body) {
            overflow: visible;
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
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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

    :deep(.el-card) {
        border-radius: 8px;
        width: 100%;
        overflow: visible;
    }

    .is-rotated {
        transform: rotate(90deg);
    }

    .rotation-transition {
        transition: transform 0.2s ease-in-out;
    }
</style>
