<template>
    <safe-dialog
        class="x-dialog"
        :visible="isYouTubeApiDialogVisible"
        :title="t('dialog.youtube_api.header')"
        width="400px"
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
            <div style="display: flex">
                <el-button
                    size="small"
                    @click="openExternalLink('https://rapidapi.com/blog/how-to-get-youtube-api-key/')">
                    {{ t('dialog.youtube_api.guide') }}
                </el-button>
                <el-button type="primary" size="small" style="margin-left: auto" @click="testYouTubeApiKey">
                    {{ t('dialog.youtube_api.save') }}
                </el-button>
            </div>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore } from '../../../stores';

    const advancedSettingsStore = useAdvancedSettingsStore();

    const { youTubeApiKey } = storeToRefs(advancedSettingsStore);

    const { lookupYouTubeVideo, setYouTubeApiKey } = advancedSettingsStore;

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const props = defineProps({
        isYouTubeApiDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isYouTubeApiDialogVisible']);

    async function testYouTubeApiKey() {
        const previousKey = youTubeApiKey.value;
        if (!youTubeApiKey.value) {
            $message({
                message: 'YouTube API key removed',
                type: 'success'
            });
            closeDialog();
            return;
        }
        const data = await lookupYouTubeVideo('dQw4w9WgXcQ');
        if (!data) {
            setYouTubeApiKey(previousKey);
            $message({
                message: 'Invalid YouTube API key',
                type: 'error'
            });
        } else {
            setYouTubeApiKey(youTubeApiKey.value);
            $message({
                message: 'YouTube API key valid!',
                type: 'success'
            });
            closeDialog();
        }
    }

    function closeDialog() {
        emit('update:isYouTubeApiDialogVisible', false);
    }
</script>
