<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="editAndSendInviteResponseDialog.visible"
        :title="t('dialog.edit_send_invite_response_message.header')"
        width="400px"
        append-to-body>
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_send_invite_response_message.description') }}</span>
        </div>
        <el-input
            v-model="editAndSendInviteResponseDialog.newMessage"
            type="textarea"
            size="mini"
            maxlength="64"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px">
        </el-input>
        <template #footer>
            <el-button type="small" @click="cancelEditAndSendInviteResponse">{{
                t('dialog.edit_send_invite_response_message.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="saveEditAndSendInviteResponse">{{
                t('dialog.edit_send_invite_response_message.send')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance, inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { inviteMessagesRequest, notificationRequest } from '../../../api';

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const API = inject('API');

    const props = defineProps({
        editAndSendInviteResponseDialog: {
            type: Object,
            required: true
        },
        uploadImage: {
            type: String
        },
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        }
    });

    const emit = defineEmits(['closeInviteDialog', 'update:editAndSendInviteResponseDialog']);

    function cancelEditAndSendInviteResponse() {
        emit('update:editAndSendInviteResponseDialog', { ...props.editAndSendInviteResponseDialog, visible: false });
    }

    async function saveEditAndSendInviteResponse() {
        const I = props.sendInviteResponseDialog;
        const D = props.editAndSendInviteResponseDialog;
        D.visible = false;
        const messageType = I.messageSlot.messageType;
        const slot = I.messageSlot.slot;
        if (I.messageSlot.message !== D.newMessage) {
            const params = {
                message: D.newMessage
            };
            await inviteMessagesRequest
                .editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                    if (args.json[slot].message === I.messageSlot.message) {
                        $message({
                            message: "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        $message('Invite message updated');
                    }
                    return args;
                });
        }
        const params = {
            responseSlot: slot,
            rsvp: true
        };
        if (props.uploadImage) {
            notificationRequest
                .sendInviteResponsePhoto(params, I.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: I.invite.id
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
        } else {
            notificationRequest
                .sendInviteResponse(params, I.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: I.invite.id
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
    }
</script>
