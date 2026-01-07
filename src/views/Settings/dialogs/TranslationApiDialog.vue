<template>
    <el-dialog
        class="x-dialog"
        :model-value="isTranslationApiDialogVisible"
        :title="t('dialog.translation_api.header')"
        width="450px"
        @close="closeDialog">
        <div class="options-container-item">
            <span class="name">{{ t('view.settings.appearance.appearance.bio_language') }}</span>
            <el-dropdown trigger="click" size="small" style="float: right" @click.stop>
                <el-button size="small">
                    <span>
                        {{ getLanguageName(bioLanguage) || bioLanguage }}
                        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </span>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item
                            v-for="language in languageCodes"
                            :key="language"
                            @click="setBioLanguage(language)"
                            v-text="getLanguageName(language)" />
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <br />
        <el-form label-position="top" label-width="120px" size="small" style="margin-bottom: 12px">
            <el-form-item :label="t('dialog.translation_api.mode')">
                <el-select v-model="form.translationApiType" style="width: 100%">
                    <el-option value="google" :label="t('dialog.translation_api.mode_google')" />
                    <el-option value="openai" :label="t('dialog.translation_api.mode_openai')" />
                </el-select>
            </el-form-item>
        </el-form>

        <template v-if="form.translationApiType === 'google'">
            <el-form label-position="top" label-width="120px" size="small">
                <el-form-item :label="t('dialog.translation_api.description')">
                    <el-input
                        v-model="form.translationApiKey"
                        type="textarea"
                        :rows="4"
                        show-password
                        placeholder="AIzaSy..."
                        clearable />
                </el-form-item>
            </el-form>
        </template>

        <template v-if="form.translationApiType === 'openai'">
            <el-form label-position="top" label-width="120px" size="small">
                <el-form-item :label="t('dialog.translation_api.openai.endpoint')">
                    <el-input
                        v-model="form.translationApiEndpoint"
                        placeholder="https://api.openai.com/v1/chat/completions"
                        clearable
                        textarea />
                </el-form-item>

                <el-form-item :label="t('dialog.translation_api.openai.api_key')">
                    <el-input
                        v-model="form.translationApiKey"
                        type="textarea"
                        :rows="4"
                        show-password
                        placeholder="sk-..."
                        clearable />
                </el-form-item>

                <el-form-item :label="t('dialog.translation_api.openai.model')">
                    <el-input v-model="form.translationApiModel" clearable />
                </el-form-item>

                <el-form-item :label="t('dialog.translation_api.openai.prompt_optional')">
                    <el-input v-model="form.translationApiPrompt" type="textarea" :rows="3" clearable />
                </el-form-item>
            </el-form>
        </template>

        <template #footer>
            <div style="display: flex">
                <el-button v-if="form.translationApiType === 'openai'" @click="testOpenAiTranslation" plain>
                    {{ t('dialog.translation_api.test') }}
                </el-button>
                <el-button
                    v-if="form.translationApiType === 'google'"
                    @click="
                        openExternalLink(
                            'https://translatepress.com/docs/automatic-translation/generate-google-api-key/'
                        )
                    ">
                    {{ t('dialog.translation_api.guide') }}
                </el-button>
                <el-button type="primary" style="margin-left: auto" @click="saveTranslationApiConfig">
                    {{ t('dialog.translation_api.save') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { reactive, watch } from 'vue';
    import { ArrowDown } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { getLanguageName, languageCodes } from '../../../localization';
    import { openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore } from '../../../stores';

    const advancedSettingsStore = useAdvancedSettingsStore();

    const {
        bioLanguage,
        translationApiKey,
        translationApiType,
        translationApiEndpoint,
        translationApiModel,
        translationApiPrompt
    } = storeToRefs(advancedSettingsStore);

    const {
        setBioLanguage,
        translateText,
        setTranslationApiKey,
        setTranslationApiType,
        setTranslationApiEndpoint,
        setTranslationApiModel,
        setTranslationApiPrompt
    } = advancedSettingsStore;

    const { t } = useI18n();

    const props = defineProps({
        isTranslationApiDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isTranslationApiDialogVisible']);

    const form = reactive({
        translationApiType: 'google',
        translationApiEndpoint: 'https://api.openai.com/v1/chat/completions',
        translationApiModel: '',
        translationApiPrompt: '',
        translationApiKey: ''
    });

    const loadFormFromStore = () => {
        form.translationApiType = translationApiType.value || 'google';
        form.translationApiEndpoint = translationApiEndpoint.value || 'https://api.openai.com/v1/chat/completions';
        form.translationApiModel = translationApiModel.value || '';
        form.translationApiPrompt = translationApiPrompt.value || '';
        form.translationApiKey = translationApiKey.value || '';
    };

    watch(
        () => props.isTranslationApiDialogVisible,
        (visible) => {
            if (visible) {
                loadFormFromStore();
            }
        },
        { immediate: true }
    );

    async function saveTranslationApiConfig() {
        if (form.translationApiType === 'openai') {
            if (!form.translationApiEndpoint || !form.translationApiModel) {
                toast.warning(t('dialog.translation_api.msg_fill_endpoint_model'));
                return;
            }
        }

        await Promise.all([
            setTranslationApiType(form.translationApiType),
            setTranslationApiEndpoint(form.translationApiEndpoint),
            setTranslationApiModel(form.translationApiModel),
            setTranslationApiPrompt(form.translationApiPrompt),
            setTranslationApiKey(form.translationApiKey)
        ]);

        toast.success(t('dialog.translation_api.msg_settings_saved'));
        closeDialog();
    }

    async function testOpenAiTranslation() {
        if (form.translationApiType !== 'openai') {
            return;
        }
        if (!form.translationApiEndpoint || !form.translationApiModel) {
            toast.warning(t('dialog.translation_api.msg_fill_endpoint_model'));
            return;
        }

        try {
            const testText = 'Hello world';
            const data = await translateText(testText, 'fr', {
                type: form.translationApiType,
                endpoint: form.translationApiEndpoint,
                model: form.translationApiModel,
                prompt: form.translationApiPrompt,
                key: form.translationApiKey
            });
            if (data) {
                toast.success(t('dialog.translation_api.msg_test_success'));
            } else {
                console.error('[TranslationAPI] Test returned empty result');
                toast.error(t('dialog.translation_api.msg_test_failed'));
            }
        } catch (err) {
            console.error('[TranslationAPI] Test failed', err);
            toast.error(t('dialog.translation_api.msg_test_failed'));
        }
    }

    function closeDialog() {
        emit('update:isTranslationApiDialogVisible', false);
    }
</script>
