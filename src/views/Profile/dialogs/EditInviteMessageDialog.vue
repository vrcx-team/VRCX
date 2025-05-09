<template>
    <safe-dialog
        class="x-dialog"
        :visible="editInviteMessageDialog.visible"
        :title="t('dialog.edit_invite_message.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_invite_message.description') }}</span>
            <el-input
                v-model="message"
                type="textarea"
                size="mini"
                maxlength="64"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder=""
                style="margin-top: 10px"></el-input>
        </div>
        <template #footer>
            <el-button type="small" @click="closeDialog">{{ $t('dialog.edit_invite_message.cancel') }}</el-button>
            <el-button type="primary" size="small" @click="saveEditInviteMessage">{{
                t('dialog.edit_invite_message.save')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, inject, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { inviteMessagesRequest } from '../../../api';

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;
    const API = inject('API');

    const props = defineProps({
        editInviteMessageDialog: {
            type: Object,
            default: () => ({
                visible: false,
                newMessage: ''
            })
        }
    });

    const message = ref('');

    watch(
        () => props.editInviteMessageDialog,
        (newVal) => {
            if (newVal && newVal.visible) {
                message.value = newVal.newMessage;
            }
        },
        { deep: true }
    );

    const emit = defineEmits(['update:editInviteMessageDialog']);

    function saveEditInviteMessage() {
        const D = props.editInviteMessageDialog;
        D.visible = false;
        if (D.inviteMessage.message !== message.value) {
            const slot = D.inviteMessage.slot;
            const messageType = D.messageType;
            const params = {
                message: message.value
            };
            inviteMessagesRequest
                .editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                    if (args.json[slot].message === D.inviteMessage.message) {
                        $message({
                            message: "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        $message.success('Invite message updated');
                    }
                    return args;
                });
        }
    }

    function closeDialog() {
        emit('update:editInviteMessageDialog', { ...props.editInviteMessageDialog, visible: false });
    }
</script>
