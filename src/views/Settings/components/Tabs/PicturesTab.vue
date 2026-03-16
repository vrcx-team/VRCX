<template>
    <!--//- Pictures | Screenshot Helper-->
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.advanced.advanced.screenshot_helper.header')">
            <template #description>
                {{ t('view.settings.advanced.advanced.screenshot_helper.description') }}
            </template>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.screenshot_helper.enable')"
                :description="t('view.settings.advanced.advanced.screenshot_helper.description_tooltip')">
                <Switch :model-value="screenshotHelper" @update:modelValue="setScreenshotHelper()" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.screenshot_helper.modify_filename')"
                :description="t('view.settings.advanced.advanced.screenshot_helper.modify_filename_tooltip')">
                <Switch
                    :model-value="screenshotHelperModifyFilename"
                    :disabled="!screenshotHelper"
                    @update:modelValue="setScreenshotHelperModifyFilename()" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.screenshot_helper.copy_to_clipboard')">
                <Switch
                    :model-value="screenshotHelperCopyToClipboard"
                    @update:modelValue="setScreenshotHelperCopyToClipboard()" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.delete_all_screenshot_metadata.button')">
                <Button size="sm" variant="outline" @click="askDeleteAllScreenshotMetadata()">{{
                    t('view.settings.advanced.advanced.delete_all_screenshot_metadata.button')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.pictures.pictures.auto_delete_old_prints')">
            <SettingsItem :label="t('view.settings.pictures.pictures.auto_delete_prints_from_vrc')">
                <Switch :model-value="autoDeleteOldPrints" @update:modelValue="setAutoDeleteOldPrints()" />
            </SettingsItem>
        </SettingsGroup>

        <!-- //- Pictures | User Generated Content -->
        <SettingsGroup :title="t('view.settings.advanced.advanced.user_generated_content.header')">
            <template #description>
                {{ t('view.settings.advanced.advanced.user_generated_content.description') }}
            </template>

            <div class="flex gap-2">
                <Button size="sm" variant="outline" @click="openUGCFolder()">{{
                    t('view.settings.advanced.advanced.user_generated_content.folder')
                }}</Button>
                <Button size="sm" variant="outline" @click="openUGCFolderSelector()">{{
                    t('view.settings.advanced.advanced.user_generated_content.set_folder')
                }}</Button>
                <Button v-if="ugcFolderPath" size="sm" variant="outline" @click="resetUGCFolder()">{{
                    t('view.settings.advanced.advanced.user_generated_content.reset_override')
                }}</Button>
            </div>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.save_instance_prints_to_file.header')">
            <template #description>
                {{ t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip') }}
            </template>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.description')">
                <Switch :model-value="saveInstancePrints" @update:modelValue="setSaveInstancePrints()" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.crop')">
                <Switch :model-value="cropInstancePrints" @update:modelValue="setCropInstancePrints()" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup
            :title="t('view.settings.advanced.advanced.save_instance_stickers_to_file.header')">
            <SettingsItem
                :label="t('view.settings.advanced.advanced.save_instance_stickers_to_file.description')">
                <Switch :model-value="saveInstanceStickers" @update:modelValue="setSaveInstanceStickers()" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.advanced.advanced.save_instance_emoji_to_file.header')">
            <template #description>
                {{ t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip') }}
            </template>

            <SettingsItem
                :label="t('view.settings.advanced.advanced.save_instance_emoji_to_file.description')">
                <Switch :model-value="saveInstanceEmoji" @update:modelValue="setSaveInstanceEmoji()" />
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Switch } from '@/components/ui/switch';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore } from '@/stores';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

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
