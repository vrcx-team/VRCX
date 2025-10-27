<template>
    <el-dialog
        class="x-dialog"
        :model-value="editInviteMessageDialog.visible"
        :title="t('dialog.edit_invite_message.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_invite_message.description') }}</span>
            <el-input
                v-model="message"
                type="textarea"
                size="small"
                maxlength="64"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder=""
                style="margin-top: 10px"></el-input>
        </div>
        <template #footer>
            <el-button @click="closeDialog">{{ t('dialog.edit_invite_message.cancel') }}</el-button>
            <el-button type="primary" @click="saveEditInviteMessage">{{
                t('dialog.edit_invite_message.save')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { inviteMessagesRequest } from '../../../api';
    import { useInviteStore } from '../../../stores';

    const { t } = useI18n();
    const inviteStore = useInviteStore();
    const { editInviteMessageDialog } = storeToRefs(inviteStore);

    const message = ref('');

    watch(
        () => editInviteMessageDialog.value,
        (newVal) => {
            if (newVal && newVal.visible) {
                message.value = newVal.newMessage;
            }
        },
        { deep: true }
    );

    function saveEditInviteMessage() {
        const D = editInviteMessageDialog.value;
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
                    if (args.json[slot].message === D.inviteMessage.message) {
                        ElMessage({
                            message: "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        ElMessage({ message: 'Invite message updated', type: 'success' });
                    }
                    return args;
                });
        }
    }

    function closeDialog() {
        editInviteMessageDialog.value.visible = false;
    }
</script>
