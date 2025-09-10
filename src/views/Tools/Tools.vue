<template>
    <div id="chart" class="x-container" v-show="menuActiveIndex === 'tools'">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.tools.header') }}</span>

            <div class="tool-categories">
                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('group')">
                        <i class="el-icon-arrow-right" :class="{ rotate: !categoryCollapsed['group'] }"></i>
                        <span class="category-title">{{ t('view.tools.group.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['group']">
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showGroupCalendarDialog">
                                <div class="tool-icon">
                                    <i class="ri-calendar-event-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.group.calendar.title') }}</div>
                                    <div class="tool-description">{{ t('view.tools.group.calendar.info') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('image')">
                        <i class="el-icon-arrow-right" :class="{ rotate: !categoryCollapsed['image'] }"></i>
                        <span class="category-title">{{ t('view.tools.image.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['image']">
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showScreenshotMetadataDialog">
                                <div class="tool-icon">
                                    <i class="ri-screenshot-2-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.image.screenshot.title') }}</div>
                                    <div class="tool-description">{{ t('view.tools.image.screenshot.info') }}</div>
                                </div>
                            </div>
                        </el-card>
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showGalleryDialog">
                                <div class="tool-icon">
                                    <i class="ri-multi-image-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.image.vrchat_inventory.title') }}</div>
                                    <div class="tool-description">{{ t('view.tools.image.vrchat_inventory.info') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('user')">
                        <i class="el-icon-arrow-right" :class="{ rotate: !categoryCollapsed['user'] }"></i>
                        <span class="category-title">{{ t('view.tools.user.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['user']">
                        <el-card :body-style="{ padding: '0px' }" class="tool-card">
                            <div class="tool-content" @click="showNoteExportDialog">
                                <div class="tool-icon">
                                    <i class="ri-user-shared-line"></i>
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.user.export_notes.title') }}</div>
                                    <div class="tool-description">{{ t('view.tools.user.export_notes.info') }}</div>
                                </div>
                            </div>
                        </el-card>
                    </div>
                </div>
            </div>
        </div>
        <GroupCalendarDialog :visible="isGroupCalendarDialogVisible" @close="isGroupCalendarDialogVisible = false" />
        <ScreenshotMetadataDialog
            :isScreenshotMetadataDialogVisible="isScreenshotMetadataDialogVisible"
            @close="isScreenshotMetadataDialogVisible = false" />
        <NoteExportDialog
            :isNoteExportDialogVisible="isNoteExportDialogVisible"
            @close="isNoteExportDialogVisible = false" />
    </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { useUiStore, useGalleryStore } from '../../stores';
    import GroupCalendarDialog from './dialogs/GroupCalendarDialog.vue';
    import ScreenshotMetadataDialog from './dialogs/ScreenshotMetadataDialog.vue';
    import NoteExportDialog from './dialogs/NoteExportDialog.vue';

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

        ::v-deep .el-card__body {
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

    ::v-deep .el-card {
        border-radius: 8px;
        width: 100%;
        overflow: visible;
    }

    .rotate {
        transform: rotate(90deg);
    }
</style>