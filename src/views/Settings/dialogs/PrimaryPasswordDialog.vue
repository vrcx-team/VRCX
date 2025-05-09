<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="enablePrimaryPasswordDialog.visible"
        :before-close="enablePrimaryPasswordDialog.beforeClose"
        :close-on-click-modal="false"
        :title="t('dialog.primary_password.header')"
        width="400px">
        <el-input
            v-model="enablePrimaryPasswordDialog.password"
            :placeholder="t('dialog.primary_password.password_placeholder')"
            type="password"
            size="mini"
            maxlength="32"
            show-password
            autofocus>
        </el-input>
        <el-input
            v-model="enablePrimaryPasswordDialog.rePassword"
            :placeholder="t('dialog.primary_password.re_input_placeholder')"
            type="password"
            style="margin-top: 5px"
            size="mini"
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
                @click="setPrimaryPassword">
                {{ t('dialog.primary_password.ok') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    const props = defineProps({
        enablePrimaryPasswordDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['setPrimaryPassword']);

    function setPrimaryPassword() {
        emit('setPrimaryPassword', props.enablePrimaryPasswordDialog.password);
        props.enablePrimaryPasswordDialog.visible = false;
    }
</script>
