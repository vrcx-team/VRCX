<template>
    <el-dialog
        class="x-dialog"
        :model-value="isTranslationApiDialogVisible"
        :title="t('dialog.translation_api.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">{{ t('dialog.translation_api.description') }} <br /></div>

        <el-input
            v-model="translationApiKey"
            type="textarea"
            :placeholder="t('dialog.translation_api.placeholder')"
            maxlength="39"
            show-word-limit
            style="display: block; margin-top: 10px">
        </el-input>

        <template #footer>
            <div style="display: flex">
                <el-button @click="openExternalLink('https://translatepress.com/docs/automatic-translation/generate-google-api-key/')">
                    {{ t('dialog.translation_api.guide') }}
                </el-button>
                <el-button type="primary" style="margin-left: auto" @click="testTranslationApiKey">
                    {{ t('dialog.translation_api.save') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore } from '../../../stores';

    const advancedSettingsStore = useAdvancedSettingsStore();

    const { translationApiKey } = storeToRefs(advancedSettingsStore);

    const { translateText, setTranslationApiKey } = advancedSettingsStore;

    const { t } = useI18n();

    defineProps({
        isTranslationApiDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isTranslationApiDialogVisible']);

async function testTranslationApiKey() {
    const previousKey = translationApiKey.value;
    if (!translationApiKey.value) {
        ElMessage({
            message: 'Translation API key removed',
            type: 'success'
        });
        closeDialog();
        return;
    }

    const testText = 'Hello world';
    const data = await translateText(testText, 'fr');
    if (!data) {
        setTranslationApiKey(previousKey);
        ElMessage({
            message: 'Invalid Translation API key',
            type: 'error'
        });
    } else {
        setTranslationApiKey(translationApiKey.value);
        ElMessage({
            message: 'Translation API key valid!',
            type: 'success'
        });
        closeDialog();
    }
}

    function closeDialog() {
        emit('update:isTranslationApiDialogVisible', false);
    }
</script>
