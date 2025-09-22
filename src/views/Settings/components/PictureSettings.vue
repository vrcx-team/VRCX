<template>
    <!-- redirect to tools tab -->
    <div class="options-container" style="margin-top: 0">
        <span class="header">{{ t('view.settings.category.pictures') }}</span>
        <div class="options-container-item" style="margin-top: 15px">
            <el-button-group
                ><el-button size="small" :icon="Picture" @click="redirectToToolsTab">{{
                    t('view.settings.advanced.advanced.screenshot_metadata')
                }}</el-button>
            </el-button-group>
        </div>
    </div>
    <!-- redirect to tools tab end -->

    <div class="options-container">
        <span class="header">{{ t('view.tools.pictures.pictures.open_folder') }}</span>
        <div class="options-container-item" style="margin-top: 15px">
            <el-button-group>
                <el-button size="small" :icon="Folder" @click="redirectToToolsTab">{{
                    t('view.tools.pictures.pictures.vrc_photos')
                }}</el-button>
                <el-button size="small" :icon="Folder" @click="redirectToToolsTab">{{
                    t('view.tools.pictures.pictures.steam_screenshots')
                }}</el-button>
            </el-button-group>
        </div>
    </div>

    <!--//- Pictures | Screenshot Helper-->
    <div class="options-container">
        <span class="header">{{ t('view.settings.advanced.advanced.screenshot_helper.header') }}</span>
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.advanced.advanced.screenshot_helper.description') }}</span>
        </div>
        <simple-switch
            :label="t('view.settings.advanced.advanced.screenshot_helper.enable')"
            :value="screenshotHelper"
            @change="setScreenshotHelper()"
            :tooltip="t('view.settings.advanced.advanced.screenshot_helper.description_tooltip')"
            :long-label="true" />
        <simple-switch
            :label="t('view.settings.advanced.advanced.screenshot_helper.modify_filename')"
            :value="screenshotHelperModifyFilename"
            @change="setScreenshotHelperModifyFilename()"
            :disabled="!screenshotHelper"
            :tooltip="t('view.settings.advanced.advanced.screenshot_helper.modify_filename_tooltip')"
            :long-label="true" />
        <simple-switch
            :label="t('view.settings.advanced.advanced.screenshot_helper.copy_to_clipboard')"
            :value="screenshotHelperCopyToClipboard"
            @change="setScreenshotHelperCopyToClipboard()"
            :long-label="true" />
        <el-button size="small" :icon="Delete" @click="askDeleteAllScreenshotMetadata()">{{
            t('view.settings.advanced.advanced.delete_all_screenshot_metadata.button')
        }}</el-button>
    </div>

    <div class="options-container">
        <span class="header">{{ t('view.settings.pictures.pictures.auto_delete_old_prints') }}</span>
        <simple-switch
            :label="t('view.settings.pictures.pictures.auto_delete_prints_from_vrc')"
            :value="autoDeleteOldPrints"
            @change="setAutoDeleteOldPrints()"
            :long-label="true" />
    </div>

    <!-- //- Pictures | User Generated Content -->
    <div class="options-container">
        <span class="header">{{ t('view.settings.advanced.advanced.user_generated_content.header') }}</span>
        <br />
        <div class="options-container-item" style="margin-bottom: 5px">
            <span class="name" style="min-width: 300px">{{
                t('view.settings.advanced.advanced.user_generated_content.description')
            }}</span>
        </div>
        <el-button size="small" :icon="Folder" @click="openUGCFolder()">{{
            t('view.settings.advanced.advanced.user_generated_content.folder')
        }}</el-button>
        <el-button size="small" :icon="FolderOpened" @click="openUGCFolderSelector()">{{
            t('view.settings.advanced.advanced.user_generated_content.set_folder')
        }}</el-button>
        <el-button size="small" :icon="Delete" @click="resetUGCFolder()" v-if="ugcFolderPath">{{
            t('view.settings.advanced.advanced.user_generated_content.reset_override')
        }}</el-button>
        <br />
        <br />
        <br />
        <span class="sub-header">{{ t('view.settings.advanced.advanced.save_instance_prints_to_file.header') }}</span>
        <el-tooltip
            placement="top"
            style="margin-left: 5px"
            :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
            <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
        <simple-switch
            :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.description')"
            :value="saveInstancePrints"
            @change="setSaveInstancePrints()"
            :long-label="true" />
        <simple-switch
            :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.crop')"
            :value="cropInstancePrints"
            @change="setCropInstancePrints()"
            :long-label="true" />
        <br />
        <span class="sub-header">{{ t('view.settings.advanced.advanced.save_instance_stickers_to_file.header') }}</span>
        <simple-switch
            :label="t('view.settings.advanced.advanced.save_instance_stickers_to_file.description')"
            :value="saveInstanceStickers"
            @change="setSaveInstanceStickers()"
            :long-label="true" />
        <br />
        <span class="sub-header">{{ t('view.settings.advanced.advanced.save_instance_emoji_to_file.header') }} </span>
        <el-tooltip
            placement="top"
            style="margin-left: 5px"
            :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
            <el-icon><InfoFilled /></el-icon>
        </el-tooltip>
        <simple-switch
            :label="t('view.settings.advanced.advanced.save_instance_emoji_to_file.description')"
            :value="saveInstanceEmoji"
            @change="setSaveInstanceEmoji()"
            :long-label="true" />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { Picture, Folder, FolderOpened, Delete, InfoFilled } from '@element-plus/icons-vue';
    import { useAdvancedSettingsStore } from '../../../stores';
    import { redirectToToolsTab } from '../../../shared/utils/base/ui';
    import SimpleSwitch from './SimpleSwitch.vue';

    const { t } = useI18n();

    const advancedSettingsStore = useAdvancedSettingsStore();

    const {
        screenshotHelper,
        screenshotHelperModifyFilename,
        screenshotHelperCopyToClipboard,
        autoDeleteOldPrints,
        saveInstancePrints,
        cropInstancePrints,
        saveInstanceStickers,
        saveInstanceEmoji,
        ugcFolderPath
    } = storeToRefs(advancedSettingsStore);

    const {
        setScreenshotHelper,
        setScreenshotHelperModifyFilename,
        setScreenshotHelperCopyToClipboard,
        setAutoDeleteOldPrints,
        setSaveInstancePrints,
        setCropInstancePrints,
        setSaveInstanceStickers,
        setSaveInstanceEmoji,
        askDeleteAllScreenshotMetadata,
        openUGCFolder,
        openUGCFolderSelector,
        resetUGCFolder
    } = advancedSettingsStore;
</script>
