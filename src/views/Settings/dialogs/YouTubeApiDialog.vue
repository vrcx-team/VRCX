<template>
    <safe-dialog
        class="x-dialog"
        :visible="isYouTubeApiDialogVisible"
        :title="t('dialog.youtube_api.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">{{ t('dialog.youtube_api.description') }} <br /></div>

        <el-input
            :value="youTubeApiKey"
            type="textarea"
            :placeholder="t('dialog.youtube_api.placeholder')"
            maxlength="39"
            show-word-limit
            style="display: block; margin-top: 10px"
            @input="updateYouTubeApiKey">
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
    import { inject, getCurrentInstance } from 'vue';
    import configRepository from '../../../service/config';
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const openExternalLink = inject('openExternalLink');

    const props = defineProps({
        isYouTubeApiDialogVisible: {
            type: Boolean,
            default: false
        },
        lookupYouTubeVideo: {
            type: Function,
            default: () => {}
        },
        youTubeApiKey: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['update:isYouTubeApiDialogVisible', 'update:youTubeApiKey']);

    async function testYouTubeApiKey() {
        if (!props.youTubeApiKey) {
            $message({
                message: 'YouTube API key removed',
                type: 'success'
            });
            await configRepository.setString('VRCX_youtubeAPIKey', '');
            closeDialog();
            return;
        }
        const data = await props.lookupYouTubeVideo('dQw4w9WgXcQ');
        if (!data) {
            updateYouTubeApiKey('');
            $message({
                message: 'Invalid YouTube API key',
                type: 'error'
            });
        } else {
            await configRepository.setString('VRCX_youtubeAPIKey', props.youTubeApiKey);
            $message({
                message: 'YouTube API key valid!',
                type: 'success'
            });
            closeDialog();
        }
    }

    function updateYouTubeApiKey(value) {
        emit('update:youTubeApiKey', value);
    }

    function closeDialog() {
        emit('update:isYouTubeApiDialogVisible', false);
    }
</script>
