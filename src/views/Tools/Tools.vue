<template>
    <div id="chart" class="x-container">
        <div class="options-container">
            <span class="header">{{ t('view.tools.header') }}</span>

            <div class="mt-5 px-5">
                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('image')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['image'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.pictures.header') }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['image']">
                        <ToolItem
                            :icon="Camera"
                            :title="t('view.tools.pictures.screenshot')"
                            :description="t('view.tools.pictures.screenshot_description')"
                            @click="showScreenshotMetadataPage" />
                        <ToolItem
                            :icon="Images"
                            :title="t('view.tools.pictures.inventory')"
                            :description="t('view.tools.pictures.inventory_description')"
                            @click="showGalleryPage" />
                    </div>
                </div>

                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('shortcuts')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['shortcuts'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.shortcuts.header') }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['shortcuts']">
                        <ToolItem
                            :icon="Folder"
                            :title="t('view.tools.pictures.pictures.vrc_photos')"
                            :description="t('view.tools.pictures.pictures.vrc_photos_description')"
                            @click="openVrcPhotosFolder" />
                        <ToolItem
                            :icon="Folder"
                            :title="t('view.tools.pictures.pictures.steam_screenshots')"
                            :description="t('view.tools.pictures.pictures.steam_screenshots_description')"
                            @click="openVrcScreenshotsFolder" />
                        <ToolItem
                            :icon="Folder"
                            :title="t('view.tools.shortcuts.vrcx_data')"
                            :description="t('view.tools.shortcuts.vrcx_data_description')"
                            @click="openVrcxAppDataFolder" />
                        <ToolItem
                            :icon="Folder"
                            :title="t('view.tools.shortcuts.vrchat_data')"
                            :description="t('view.tools.shortcuts.vrchat_data_description')"
                            @click="openVrcAppDataFolder" />
                        <ToolItem
                            :icon="Folder"
                            :title="t('view.tools.shortcuts.crash_dumps')"
                            :description="t('view.tools.shortcuts.crash_dumps_description')"
                            @click="openCrashVrcCrashDumps" />
                    </div>
                </div>

                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('system')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['system'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.system_tools.header') }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['system']">
                        <ToolItem
                            :icon="Settings"
                            :title="t('view.tools.system_tools.vrchat_config')"
                            :description="t('view.tools.system_tools.vrchat_config_description')"
                            @click="showVRChatConfig" />
                        <ToolItem
                            :icon="Settings"
                            :title="t('view.settings.advanced.advanced.launch_options')"
                            :description="t('view.tools.system_tools.launch_options_description')"
                            @click="showLaunchOptions" />
                        <ToolItem
                            :icon="Settings"
                            :title="t('view.settings.advanced.advanced.vrc_registry_backup')"
                            :description="t('view.tools.system_tools.registry_backup_description')"
                            @click="showRegistryBackupDialog" />
                        <ToolItem
                            :icon="Settings"
                            :title="t('view.settings.general.automation.auto_change_status')"
                            :description="t('view.settings.general.automation.auto_state_change_tooltip')"
                            @click="showAutoChangeStatusDialog" />
                    </div>
                </div>

                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('group')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['group'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.group.header') }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['group']">
                        <ToolItem
                            :icon="CalendarDays"
                            :title="t('view.tools.group.calendar')"
                            :description="t('view.tools.group.calendar_description')"
                            @click="showGroupCalendarDialog" />
                    </div>
                </div>

                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('user')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['user'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.export.header') }}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['user']">
                        <ToolItem
                            :icon="FolderInput"
                            :title="t('view.tools.export.discord_names')"
                            :description="t('view.tools.user.discord_names_description')"
                            @click="showExportDiscordNamesDialog" />
                        <ToolItem
                            :icon="FolderInput"
                            :title="t('view.tools.export.export_notes')"
                            :description="t('view.tools.export.export_notes_description')"
                            @click="showNoteExportDialog" />
                        <ToolItem
                            :icon="FolderInput"
                            :title="t('view.tools.export.export_friend_list')"
                            :description="t('view.tools.user.export_friend_list_description')"
                            @click="showExportFriendsListDialog" />
                        <ToolItem
                            :icon="FolderInput"
                            :title="t('view.tools.export.export_own_avatars')"
                            :description="t('view.tools.user.export_own_avatars_description')"
                            @click="showExportAvatarsListDialog" />
                    </div>
                </div>

                <div class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory('other')">
                        <ChevronDown
                            class="text-sm mr-2 transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed['other'] }" />
                        <span class="ml-1.5 text-base font-semibold">{{ t('view.tools.other.header') }}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 ml-4" v-show="!categoryCollapsed['other']">
                        <ToolItem
                            :icon="SquarePen"
                            :title="t('view.tools.other.edit_invite_message')"
                            :description="t('view.tools.other.edit_invite_message_description')"
                            @click="showEditInviteMessageDialog" />
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
            <AutoChangeStatusDialog
                :isAutoChangeStatusDialogVisible="isAutoChangeStatusDialogVisible"
                @close="isAutoChangeStatusDialogVisible = false" />
        </template>
    </div>
</template>

<script setup>
    import { CalendarDays, Camera, ChevronDown, Folder, FolderInput, Images, Settings, SquarePen } from 'lucide-vue-next';
    import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import ToolItem from './components/ToolItem.vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFriendStore, useGalleryStore } from '../../stores';
    import { useAdvancedSettingsStore } from '../../stores/settings/advanced';
    import { useLaunchStore } from '../../stores/launch';
    import { useVrcxStore } from '../../stores/vrcx';

    import AutoChangeStatusDialog from './dialogs/AutoChangeStatusDialog.vue';
    import configRepository from '../../services/config.js';

    const GroupCalendarDialog = defineAsyncComponent(() => import('./dialogs/GroupCalendarDialog.vue'));
    const NoteExportDialog = defineAsyncComponent(() => import('./dialogs/NoteExportDialog.vue'));
    const EditInviteMessageDialog = defineAsyncComponent(() => import('./dialogs/EditInviteMessagesDialog.vue'));
    const ExportDiscordNamesDialog = defineAsyncComponent(() => import('./dialogs/ExportDiscordNamesDialog.vue'));
    const ExportFriendsListDialog = defineAsyncComponent(() => import('./dialogs/ExportFriendsListDialog.vue'));
    const ExportAvatarsListDialog = defineAsyncComponent(() => import('./dialogs/ExportAvatarsListDialog.vue'));
    import RegistryBackupDialog from './dialogs/RegistryBackupDialog.vue';

    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();

    const { showGalleryPage } = useGalleryStore();
    const { friends } = storeToRefs(useFriendStore());
    const { showVRChatConfig } = useAdvancedSettingsStore();
    const { showLaunchOptions } = useLaunchStore();
    const { showRegistryBackupDialog } = useVrcxStore();
    const toolsCategoryCollapsedConfigKey = 'VRCX_toolsCategoryCollapsed';

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
    const isAutoChangeStatusDialogVisible = ref(false);
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
        configRepository.setString(toolsCategoryCollapsedConfigKey, JSON.stringify(categoryCollapsed.value));
    };

    onMounted(async () => {
        const storedValue = await configRepository.getString(toolsCategoryCollapsedConfigKey, '{}');
        try {
            const parsed = JSON.parse(storedValue);
            categoryCollapsed.value = {
                ...categoryCollapsed.value,
                ...parsed
            };
        } catch {
            // ignore invalid stored value and keep defaults
        }
    });

    const showEditInviteMessageDialog = () => {
        isEditInviteMessagesDialogVisible.value = true;
    };

    const showAutoChangeStatusDialog = () => {
        isAutoChangeStatusDialogVisible.value = true;
    };

    /**
     *
     */
    function showExportDiscordNamesDialog() {
        isExportDiscordNamesDialogVisible.value = true;
    }

    /**
     *
     */
    function showExportFriendsListDialog() {
        isExportFriendsListDialogVisible.value = true;
    }

    /**
     *
     */
    function showExportAvatarsListDialog() {
        isExportAvatarsListDialogVisible.value = true;
    }

    /**
     *
     */
    function openVrcPhotosFolder() {
        AppApi.OpenVrcPhotosFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    /**
     *
     */
    function openVrcScreenshotsFolder() {
        AppApi.OpenVrcScreenshotsFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    /**
     *
     */
    function openVrcxAppDataFolder() {
        AppApi.OpenVrcxAppDataFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    /**
     *
     */
    function openVrcAppDataFolder() {
        AppApi.OpenVrcAppDataFolder().then((result) => {
            if (result) {
                toast.success('Folder opened');
            } else {
                toast.error(t('message.file.folder_missing'));
            }
        });
    }

    /**
     *
     */
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
