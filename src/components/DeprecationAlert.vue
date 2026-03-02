<template>
    <Alert variant="warning" class="mb-4">
        <MessageSquareWarning class="text-lg" />
        <AlertTitle>{{ t('common.feature_relocated.title') }}</AlertTitle>
        <AlertDescription>
            <i18n-t keypath="common.feature_relocated.description" tag="span">
                <template #feature>
                    <strong>{{ featureName }}</strong>
                </template>
            </i18n-t>
        </AlertDescription>
    </Alert>
</template>

<script setup>
    import { MessageSquareWarning } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Alert, AlertDescription, AlertTitle } from './ui/alert';

    const { t } = useI18n();

    defineProps({
        featureName: {
            type: String,
            required: true
        }
    });
</script>
