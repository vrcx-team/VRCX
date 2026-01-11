<template>
    <el-dialog
        class="x-dialog"
        :model-value="isYouTubeApiDialogVisible"
        :title="t('dialog.youtube_api.header')"
        width="450px"
        @close="closeDialog">
        <div style="font-size: 12px">{{ t('dialog.youtube_api.description') }} <br /></div>

        <el-input
            v-model="youTubeApiKey"
            type="textarea"
            :placeholder="t('dialog.youtube_api.placeholder')"
            maxlength="39"
            show-word-limit
            style="display: block; margin-top: 10px">
        </el-input>

        <template #footer>
            <div class="flex items-center justify-between">
                <Button variant="outline" @click="openExternalLink('https://smashballoon.com/doc/youtube-api-key/')">
                    {{ t('dialog.youtube_api.guide') }}
                </Button>
                <Button style="margin-left: auto" @click="testYouTubeApiKey">
                    {{ t('dialog.youtube_api.save') }}
                </Button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore } from '../../../stores';

    const advancedSettingsStore = useAdvancedSettingsStore();

    const { youTubeApiKey } = storeToRefs(advancedSettingsStore);

    const { lookupYouTubeVideo, setYouTubeApiKey } = advancedSettingsStore;

    const { t } = useI18n();

    defineProps({
        isYouTubeApiDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isYouTubeApiDialogVisible']);

    async function testYouTubeApiKey() {
        const previousKey = youTubeApiKey.value;
        if (!youTubeApiKey.value) {
            toast.success('YouTube API key removed');
            closeDialog();
            return;
        }
        const data = await lookupYouTubeVideo('dQw4w9WgXcQ');
        if (!data) {
            setYouTubeApiKey(previousKey);
            toast.error('Invalid YouTube API key');
        } else {
            setYouTubeApiKey(youTubeApiKey.value);
            toast.success('YouTube API key valid!');
            closeDialog();
        }
    }

    function closeDialog() {
        emit('update:isYouTubeApiDialogVisible', false);
    }
</script>
