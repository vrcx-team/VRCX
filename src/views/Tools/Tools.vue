<template>
    <div id="chart" class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.tools.header') }}</span>

            <div class="tool-categories">
                <div class="tool-category">
                    <div class="category-header text-2xl" @click="toggleCategory('image')">
                        <ChevronDown
                            class="rotation-transition"
                            :class="{ 'is-rotated': categoryCollapsed['image'] }" />
                        <span class="category-title">{{ t('view.tools.pictures.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['image']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content text-2xl" @click="showScreenshotMetadataPage">
                                <div class="tool-icon">
                                    <Camera />
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
                                <div class="tool-icon text-2xl">
                                    <Images />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.pictures.inventory') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.pictures.inventory_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('shortcuts')">
                        <ChevronDown
                            class="rotation-transition"
                            :class="{ 'is-rotated': categoryCollapsed['shortcuts'] }" />
                        <span class="category-title">{{ t('view.tools.shortcuts.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['shortcuts']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openVrcPhotosFolder">
                                <div class="tool-icon text-2xl">
                                    <FolderOpen />
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
                                <div class="tool-icon text-2xl">
                                    <FolderOpen />
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
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openVrcxAppDataFolder">
                                <div class="tool-icon text-2xl">
                                    <Folder />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.shortcuts.vrcx_data') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.shortcuts.vrcx_data_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openVrcAppDataFolder">
                                <div class="tool-icon text-2xl">
                                    <Folder />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.shortcuts.vrchat_data') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.shortcuts.vrchat_data_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="openCrashVrcCrashDumps">
                                <div class="tool-icon text-2xl">
                                    <Folder />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.shortcuts.crash_dumps') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.shortcuts.crash_dumps_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('system')">
                        <ChevronDown
                            class="rotation-transition"
                            :class="{ 'is-rotated': categoryCollapsed['system'] }" />
                        <span class="category-title">{{ t('view.tools.system_tools.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['system']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showVRChatConfig">
                                <div class="tool-icon text-2xl">
                                    <Settings />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">{{ t('view.tools.system_tools.vrchat_config') }}</div>
                                    <div class="tool-description">
                                        {{ t('view.tools.system_tools.vrchat_config_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showLaunchOptions">
                                <div class="tool-icon text-2xl">
                                    <Settings />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">
                                        {{ t('view.settings.advanced.advanced.launch_options') }}
                                    </div>
                                    <div class="tool-description">
                                        {{ t('view.tools.system_tools.launch_options_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showRegistryBackupDialog">
                                <div class="tool-icon text-2xl">
                                    <Package />
                                </div>
                                <div class="tool-info">
                                    <div class="tool-name">
                                        {{ t('view.settings.advanced.advanced.vrc_registry_backup') }}
                                    </div>
                                    <div class="tool-description">
                                        {{ t('view.tools.system_tools.registry_backup_description') }}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div class="tool-category">
                    <div class="category-header" @click="toggleCategory('group')">
                        <ChevronDown
                            class="rotation-transition"
                            :class="{ 'is-rotated': categoryCollapsed['group'] }" />
                        <span class="category-title">{{ t('view.tools.group.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['group']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showGroupCalendarDialog">
                                <div class="tool-icon text-2xl">
                                    <CalendarDays />
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
                    <div class="category-header text-2xl" @click="toggleCategory('user')">
                        <ChevronDown class="rotation-transition" :class="{ 'is-rotated': categoryCollapsed['user'] }" />
                        <span class="category-title">{{ t('view.tools.export.header') }}</span>
                    </div>

                    <div class="tools-grid" v-show="!categoryCollapsed['user']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showExportDiscordNamesDialog">
                                <div class="tool-icon text-2xl">
                                    <MessageSquare />
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
                                <div class="tool-icon text-2xl">
                                    <UserCheck />
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
                                <div class="tool-icon text-2xl">
                                    <UserCheck />
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
                                <div class="tool-icon text-2xl">
                                    <UserCheck />
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
                        <ChevronDown
                            class="rotation-transition"
                            :class="{ 'is-rotated': categoryCollapsed['other'] }" />
                        <span class="category-title">{{ t('view.tools.other.header') }}</span>
                    </div>
                    <div class="tools-grid" v-show="!categoryCollapsed['other']">
                        <Card class="tool-card p-0 gap-0">
                            <div class="tool-content" @click="showEditInviteMessageDialog">
                                <div class="tool-icon text-2xl">
                                    <SquarePen />
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
            <RegistryBackupDialog />
        </template>
    </div>
</template>

<script setup>
    import {
        CalendarDays,
        Camera,
        ChevronDown,
        Folder,
        FolderOpen,
        Images,
        MessageSquare,
        Package,
        Settings,
        SquarePen,
        UserCheck
    } from 'lucide-vue-next';
    import { computed, defineAsyncComponent, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { Card } from '@/components/ui/card';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFriendStore, useGalleryStore } from '../../stores';
    import { useAdvancedSettingsStore } from '../../stores/settings/advanced';
    import { useLaunchStore } from '../../stores/launch';
    import { useVrcxStore } from '../../stores/vrcx';

    const GroupCalendarDialog = defineAsyncComponent(() => import('./dialogs/GroupCalendarDialog.vue'));
    const NoteExportDialog = defineAsyncComponent(() => import('./dialogs/NoteExportDialog.vue'));
    const EditInviteMessageDialog = defineAsyncComponent(() => import('./dialogs/EditInviteMessagesDialog.vue'));
    const ExportDiscordNamesDialog = defineAsyncComponent(() => import('./dialogs/ExportDiscordNamesDialog.vue'));
    const ExportFriendsListDialog = defineAsyncComponent(() => import('./dialogs/ExportFriendsListDialog.vue'));
    const ExportAvatarsListDialog = defineAsyncComponent(() => import('./dialogs/ExportAvatarsListDialog.vue'));
    const RegistryBackupDialog = defineAsyncComponent(() => import('../Settings/dialogs/RegistryBackupDialog.vue'));

    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();

    const { showGalleryPage } = useGalleryStore();
    const { friends } = storeToRefs(useFriendStore());
    const { showVRChatConfig } = useAdvancedSettingsStore();
    const { showLaunchOptions } = useLaunchStore();
    const { showRegistryBackupDialog } = useVrcxStore();

    const categoryCollapsed = ref({
        group: false,
        image: false,
        shortcuts: false,
        system: false,
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
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    function openVrcScreenshotsFolder() {
        AppApi.OpenVrcScreenshotsFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    function openVrcxAppDataFolder() {
        AppApi.OpenVrcxAppDataFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    function openVrcAppDataFolder() {
        AppApi.OpenVrcAppDataFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    function openCrashVrcCrashDumps() {
        AppApi.OpenCrashVrcCrashDumps().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
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
            }

            .rotation-transition {
                font-size: 14px;
                margin-right: 8px;
                transition: transform 0.3s;
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
                border-radius: 12px;
                margin-right: 20px;

                i {
                    font-size: 28px;
                }
            }

            .tool-info {
                flex: 1;

                .tool-name {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .tool-description {
                    font-size: 14px;
                    opacity: 0.8;
                }
            }
        }
    }

    .is-rotated {
        transform: rotate(-90deg);
    }

    .rotation-transition {
        transition: transform 0.2s ease-in-out;
    }
</style>
