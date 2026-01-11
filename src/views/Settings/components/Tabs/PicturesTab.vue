<template>
    <!--//- Pictures | Screenshot Helper-->
    <div class="options-container" style="margin-top: 0">
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
        <Button size="sm" variant="outline" @click="askDeleteAllScreenshotMetadata()">{{
            t('view.settings.advanced.advanced.delete_all_screenshot_metadata.button')
        }}</Button>
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
        <Button size="sm" variant="outline" @click="openUGCFolder()">{{
            t('view.settings.advanced.advanced.user_generated_content.folder')
        }}</Button>
        <Button size="sm" variant="outline" @click="openUGCFolderSelector()">{{
            t('view.settings.advanced.advanced.user_generated_content.set_folder')
        }}</Button>
        <Button size="sm" variant="outline" @click="resetUGCFolder()" v-if="ugcFolderPath">{{
            t('view.settings.advanced.advanced.user_generated_content.reset_override')
        }}</Button>
        <br />
        <br />
        <br />
        <span class="sub-header" style="margin-right: 5px">{{
            t('view.settings.advanced.advanced.save_instance_prints_to_file.header')
        }}</span>
        <TooltipWrapper
            side="top"
            :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
            <el-icon><InfoFilled /></el-icon>
        </TooltipWrapper>
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
        <span class="sub-header" style="margin-right: 5px"
            >{{ t('view.settings.advanced.advanced.save_instance_emoji_to_file.header') }}
        </span>
        <TooltipWrapper
            side="top"
            :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
            <el-icon><InfoFilled /></el-icon>
        </TooltipWrapper>
        <simple-switch
            :label="t('view.settings.advanced.advanced.save_instance_emoji_to_file.description')"
            :value="saveInstanceEmoji"
            @change="setSaveInstanceEmoji()"
            :long-label="true" />
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { InfoFilled } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore } from '../../../../stores';

    import SimpleSwitch from '../SimpleSwitch.vue';

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
