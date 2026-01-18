<template>
    <Dialog :open="isTranslationApiDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.translation_api.header') }}</DialogTitle>
            </DialogHeader>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.bio_language') }}</span>
                <Select :model-value="bioLanguage" @update:modelValue="setBioLanguage">
                    <SelectTrigger size="sm" style="float: right">
                        <SelectValue :placeholder="String(getLanguageName(bioLanguage) || bioLanguage || '')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="language in languageCodes" :key="language" :value="language">
                                {{ getLanguageName(language) }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <br />
            <FieldGroup class="mb-3">
                <Field>
                    <FieldLabel>{{ t('dialog.translation_api.mode') }}</FieldLabel>
                    <FieldContent>
                        <Select
                            :model-value="form.translationApiType"
                            @update:modelValue="handleTranslationApiTypeChange">
                            <SelectTrigger size="sm" style="width: 100%">
                                <SelectValue :placeholder="t('dialog.translation_api.mode')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="google" :text-value="t('dialog.translation_api.mode_google')">
                                        {{ t('dialog.translation_api.mode_google') }}
                                    </SelectItem>
                                    <SelectItem value="openai" :text-value="t('dialog.translation_api.mode_openai')">
                                        {{ t('dialog.translation_api.mode_openai') }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </FieldContent>
                </Field>
            </FieldGroup>

            <template v-if="form.translationApiType === 'google'">
                <FieldGroup>
                    <Field>
                        <FieldLabel>{{ t('dialog.translation_api.description') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="form.translationApiKey"
                                type="password"
                                show-password
                                placeholder="AIzaSy..."
                                clearable />
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </template>

            <template v-if="form.translationApiType === 'openai'">
                <FieldGroup>
                    <Field>
                        <FieldLabel>{{ t('dialog.translation_api.openai.endpoint') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="form.translationApiEndpoint"
                                placeholder="https://api.openai.com/v1/chat/completions"
                                clearable />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.translation_api.openai.api_key') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="form.translationApiKey"
                                type="password"
                                show-password
                                placeholder="sk-..."
                                clearable />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.translation_api.openai.model') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField v-model="form.translationApiModel" clearable />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.translation_api.openai.prompt_optional') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupTextareaField v-model="form.translationApiPrompt" :rows="3" clearable />
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </template>

            <DialogFooter>
                <div class="flex items-center justify-between">
                    <Button
                        variant="outline"
                        v-if="form.translationApiType === 'google'"
                        @click="
                            openExternalLink(
                                'https://translatepress.com/docs/automatic-translation/generate-google-api-key/'
                            )
                        ">
                        {{ t('dialog.translation_api.guide') }}
                    </Button>
                    <Button
                        variant="outline"
                        class="mr-2"
                        v-if="form.translationApiType === 'openai'"
                        @click="testOpenAiTranslation">
                        {{ t('dialog.translation_api.test') }}
                    </Button>
                    <div>
                        <Button style="margin-left: auto" @click="saveTranslationApiConfig">
                            {{ t('dialog.translation_api.save') }}
                        </Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { reactive, watch } from 'vue';
    import { Button } from '@/components/ui/button';
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

    function handleTranslationApiTypeChange(value) {
        form.translationApiType = String(value);
    }

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
