<template>
    <Dialog :open="isVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.friend_insight_api.header') }}</DialogTitle>
            </DialogHeader>

            <FieldGroup>
                <Field>
                    <FieldLabel>{{ t('dialog.friend_insight_api.endpoint') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            v-model="form.endpoint"
                            placeholder="https://api.openai.com/v1/chat/completions"
                            clearable />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('dialog.friend_insight_api.api_key') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            v-model="form.apiKey"
                            type="password"
                            show-password
                            placeholder="sk-..."
                            clearable />
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel>{{ t('dialog.friend_insight_api.model') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupField
                            v-model="form.model"
                            placeholder="gpt-4o-mini"
                            clearable />
                    </FieldContent>
                </Field>
            </FieldGroup>

            <DialogFooter>
                <Button variant="outline" @click="closeDialog">
                    {{ t('dialog.friend_insight_api.cancel') }}
                </Button>
                <Button @click="saveDialog">
                    {{ t('dialog.friend_insight_api.save') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { reactive, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import {
        Field,
        FieldContent,
        FieldGroup,
        FieldLabel
    } from '@/components/ui/field';
    import { InputGroupField } from '@/components/ui/input-group';
    import { useAdvancedSettingsStore } from '@/stores';

    const { t } = useI18n();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const props = defineProps({
        isVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:isVisible']);

    const form = reactive({
        endpoint: '',
        apiKey: '',
        model: ''
    });

    function loadFormFromStore() {
        form.endpoint = advancedSettingsStore.friendInsightEndpoint;
        form.apiKey = advancedSettingsStore.friendInsightApiKey;
        form.model = advancedSettingsStore.friendInsightModel;
    }

    function closeDialog() {
        emit('update:isVisible', false);
    }

    async function saveDialog() {
        await advancedSettingsStore.setFriendInsightEndpoint(form.endpoint);
        await advancedSettingsStore.setFriendInsightApiKey(form.apiKey);
        await advancedSettingsStore.setFriendInsightModel(form.model);
        emit('update:isVisible', false);
    }

    watch(
        () => props.isVisible,
        (visible) => {
            if (visible) {
                loadFormFromStore();
            }
        }
    );
</script>
