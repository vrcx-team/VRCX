<template>
    <safe-dialog
        class="x-dialog"
        :visible="isCloudDataApiDialogVisible"
        :title="t('dialog.cloud_data_api.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">{{ t('dialog.cloud_data_api.description') }} <br /></div>

        <el-input
            v-model="data.cloudDataApiUrl"
            :placeholder="t('dialog.cloud_data_api.url_placeholder')"
            maxlength="128"
            show-word-limit
            style="display: block; margin-top: 10px">
        </el-input>

        <el-input
            v-model="data.cloudDataApiUsername"
            :placeholder="t('dialog.cloud_data_api.username_placeholder')"
            show-word-limit
            style="display: block; margin-top: 10px">
        </el-input>

        <el-input
            v-model="data.cloudDataApiPassword"
            type="password"
            show-password
            :placeholder="t('dialog.cloud_data_api.password_placeholder')"
            maxlength="128"
            show-word-limit
            style="display: block; margin-top: 10px">
        </el-input>

        <template #footer>
            <div style="display: flex">
                <el-button size="small" @click="openExternalLink('https://www.bilibili.com/')">
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
    import { createService } from '../../../utils/requests';
    import { login } from '../../../api/cloud/auth';
    import { setToken } from '../../../utils/auth';
    import { ref } from 'vue';
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
        },
        cloudDataApiUsername: {
            type: String,
            default: ''
        },
        cloudDataApiPassword: {
            type: String,
            default: ''
        }
    });

    const data = ref({
        cloudDataApiUrl: props.cloudDataApiUrl,
        cloudDataApiUsername: props.cloudDataApiUsername,
        cloudDataApiPassword: props.cloudDataApiPassword
    });
    const emit = defineEmits(['update:isCloudDataApiDialogVisible', 'update:youTubeApiKey']);

    async function saveCloudDataApiUrl() {
        if (!data.value.cloudDataApiUrl) {
            $message({
                message: 'Cloud Data API URL removed',
                type: 'success'
            });
            await configRepository.setString('VRCX_cloudDataApiUrl', '');
            closeDialog();
            return;
        } else {
            const pattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d+)?(\/[^\s]*)?$/;
            if (!pattern.test(data.value.cloudDataApiUrl)) {
                $message({
                    message: 'Invalid Cloud Data API URL',
                    type: 'error'
                });
                return;
            }
            try {
                createService(data.value.cloudDataApiUrl);
                const { data: respData } = await login({
                    username: data.value.cloudDataApiUsername,
                    password: data.value.cloudDataApiPassword
                });
                setToken(respData);
                await configRepository.setString('VRCX_cloudDataApiUrl', data.value.cloudDataApiUrl);
                await configRepository.setString('VRCX_cloudDataApiUsername', data.value.cloudDataApiUsername);
                $message({
                    message: 'Cloud Data API URL saved',
                    type: 'success'
                });
                closeDialog();
            } catch (error) {
                $message({
                    message: 'Failed to save Cloud Data API URL: ' + error.message,
                    type: 'error'
                });
                console.error('Failed to save Cloud Data API URL:', error);
            }
        }
    }

    function closeDialog() {
        emit('update:isCloudDataApiDialogVisible', false);
    }
</script>
