<template>
    <safe-dialog
        class="x-dialog"
        :visible="sendInviteResponseConfirmDialog.visible"
        :title="t('dialog.invite_response_message.header')"
        width="400px"
        append-to-body
        @close="cancelInviteResponseConfirm">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_response_message.confirmation') }}</span>
        </div>

        <template #footer>
            <el-button type="small" @click="cancelInviteResponseConfirm">{{
                t('dialog.invite_response_message.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="sendInviteResponseConfirm">{{
                t('dialog.invite_response_message.confirm')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { notificationRequest } from '../../../api';
    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const props = defineProps({
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        },
        uploadImage: {
            type: String
        },
        sendInviteResponseConfirmDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['update:sendInviteResponseConfirmDialog', 'closeInviteDialog']);

    function cancelInviteResponseConfirm() {
        emit('update:sendInviteResponseConfirmDialog', { visible: false });
        // TODO: temp fix to close dialog
        props.sendInviteResponseConfirmDialog.visible = false;
    }

    function sendInviteResponseConfirm() {
        const D = props.sendInviteResponseDialog;
        const params = {
            responseSlot: D.messageSlot.slot,
            rsvp: true
        };
        if (props.uploadImage) {
            notificationRequest
                .sendInviteResponsePhoto(params, D.invite.id, D.messageSlot.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    $message({
                        message: 'Invite response photo message sent',
                        type: 'success'
                    });
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        } else {
            notificationRequest
                .sendInviteResponse(params, D.invite.id, D.messageSlot.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    $message({
                        message: 'Invite response message sent',
                        type: 'success'
                    });
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        }
        cancelInviteResponseConfirm();
    }
</script>
