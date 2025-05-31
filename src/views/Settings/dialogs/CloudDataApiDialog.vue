<template>
    <safe-dialog
        class="x-dialog"
        :visible="isCloudDataApiDialogVisible"
        :title="t('dialog.cloud_data_api.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">{{ t('dialog.cloud_data_api.description') }} <br /></div>

        <el-input
            :value="cloudDataApiUrl"
            type="textarea"
            :placeholder="t('dialog.cloud_data_api.placeholder')"
            maxlength="128"
            show-word-limit
            @input="updateCloudDataApiUrl"
            style="display: block; margin-top: 10px">
        </el-input>

        <template #footer>
            <div style="display: flex">
                <el-button
                    size="small"
                    @click="openExternalLink('https://www.bilibili.com/')">
                    {{ t('dialog.cloud_data_api.docs') }}
                </el-button>
                <el-button type="primary" size="small" style="margin-left: auto" @click="saveCloudDataApiUrl">
                    {{ t('dialog.cloud_data_api.save') }}
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
        isCloudDataApiDialogVisible: {
            type: Boolean,
            default: false
        },
        cloudDataApiUrl: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['update:isCloudDataApiDialogVisible', 'update:youTubeApiKey']);

    async function saveCloudDataApiUrl() {
        if (!props.cloudDataApiUrl) {
            $message({
                message: 'YouTube API key removed',
                type: 'success'
            });
            await configRepository.setString('VRCX_cloudDataApiUrl', '');
            closeDialog();
            return;
        } else {
            const pattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d+)?(\/[^\s]*)?$/;
            if (!pattern.test(props.cloudDataApiUrl)) {
                $message({
                    message: 'Invalid Cloud Data API URL',
                    type: 'error'
                });
                return;
            }
            await configRepository.setString('VRCX_cloudDataApiUrl', props.cloudDataApiUrl);
            $message({
                message: 'Cloud Data API URL saved',
                type: 'success'
            });
            updateCloudDataApiUrl(props.cloudDataApiUrl);
            closeDialog();
        }
    }

    function updateCloudDataApiUrl(value) {
        emit('update:cloudDataApiUrl', value);
    }

    function closeDialog() {
        emit('update:isCloudDataApiDialogVisible', false);
    }
</script>
