<template>
    <el-dialog
        class="x-dialog"
        :model-value="editAndSendInviteResponseDialog.visible"
        @close="cancelEditAndSendInviteResponse"
        :title="t('dialog.edit_send_invite_response_message.header')"
        width="400px"
        append-to-body>
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_send_invite_response_message.description') }}</span>
        </div>
        <el-input
            v-model="editAndSendInviteResponseDialog.newMessage"
            type="textarea"
            size="small"
            maxlength="64"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px">
        </el-input>
        <template #footer>
            <el-button @click="cancelEditAndSendInviteResponse">{{
                t('dialog.edit_send_invite_response_message.cancel')
            }}</el-button>
            <el-button
                type="primary"
                @click="saveEditAndSendInviteResponse"
                :disabled="!editAndSendInviteResponseDialog.newMessage"
                >{{ t('dialog.edit_send_invite_response_message.send') }}</el-button
            >
        </template>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { inviteMessagesRequest, notificationRequest } from '../../../api';
    import { useGalleryStore } from '../../../stores';

    const { t } = useI18n();
    const galleryStore = useGalleryStore();
    const { uploadImage } = storeToRefs(galleryStore);

    const props = defineProps({
        editAndSendInviteResponseDialog: {
            type: Object,
            required: true
        },
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        }
    });

    const emit = defineEmits(['closeInviteDialog', 'closeResponseConfirmDialog']);

    function cancelEditAndSendInviteResponse() {
        emit('closeResponseConfirmDialog');
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
                    if (args.json[slot].message === I.messageSlot.message) {
                        toast.error("VRChat API didn't update message, try again");
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        toast('Invite message updated');
                    }
                    return args;
                });
        }
        const params = {
            responseSlot: slot,
            rsvp: true
        };
        if (uploadImage.value) {
            notificationRequest
                .sendInviteResponsePhoto(params, I.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: I.invite.id
                    });
                    toast.success('Invite response message sent');
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
                    toast.success('Invite response message sent');
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        }
    }
</script>
