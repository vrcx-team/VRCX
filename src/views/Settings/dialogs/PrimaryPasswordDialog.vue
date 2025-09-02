<template>
    <el-dialog
        class="x-dialog"
        v-model="enablePrimaryPasswordDialog.visible"
        :before-close="enablePrimaryPasswordDialog.beforeClose"
        :close-on-click-modal="false"
        :title="t('dialog.primary_password.header')"
        width="400px">
        <el-input
            v-model="enablePrimaryPasswordDialog.password"
            :placeholder="t('dialog.primary_password.password_placeholder')"
            type="password"
            size="small"
            maxlength="32"
            show-password
            autofocus>
        </el-input>
        <el-input
            v-model="enablePrimaryPasswordDialog.rePassword"
            :placeholder="t('dialog.primary_password.re_input_placeholder')"
            type="password"
            style="margin-top: 5px"
            size="small"
            maxlength="32"
            show-password>
        </el-input>
        <template #footer>
            <el-button
                type="primary"
                size="small"
                :disabled="
                    enablePrimaryPasswordDialog.password.length === 0 ||
                    enablePrimaryPasswordDialog.password !== enablePrimaryPasswordDialog.rePassword
                "
                @click="handleSetPrimaryPassword()">
                {{ t('dialog.primary_password.ok') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useAuthStore } from '../../../stores';

    const { t } = useI18n();

    const authStore = useAuthStore();
    const { enablePrimaryPasswordDialog } = storeToRefs(authStore);
    const { setPrimaryPassword } = authStore;

    function handleSetPrimaryPassword() {
        setPrimaryPassword(enablePrimaryPasswordDialog.value.password);
        enablePrimaryPasswordDialog.value.visible = false;
    }
</script>
