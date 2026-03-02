<template>
    <Dialog
        :open="editAndSendInviteResponseDialog.visible"
        @update:open="(open) => (open ? null : cancelEditAndSendInviteResponse())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.edit_send_invite_response_message.header') }}</DialogTitle>
            </DialogHeader>
            <div style="font-size: 12px">
                <span>{{ t('dialog.edit_send_invite_response_message.description') }}</span>
            </div>
            <InputGroupTextareaField
                v-model="editAndSendInviteResponseDialog.newMessage"
                :maxlength="64"
                :rows="2"
                class="mt-2.5"
                placeholder=""
                show-count />
            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="cancelEditAndSendInviteResponse">{{
                    t('dialog.edit_send_invite_response_message.cancel')
                }}</Button>
                <Button
                    @click="saveEditAndSendInviteResponse"
                    :disabled="!editAndSendInviteResponseDialog.newMessage"
                    >{{ t('dialog.edit_send_invite_response_message.send') }}</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
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
                    console.error('Invite response message update failed', err);
                    toast.error(t('message.error'));
                })
                .then((args) => {
                    if (args.json[slot].message === I.messageSlot.message) {
                        const errorMessage = t('message.invite.message_update_failed');
                        toast.error(errorMessage);
                        throw new Error(errorMessage);
                    } else {
                        toast(t('message.invite.message_updated'));
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
                    console.error('Invite response photo failed', err);
                    toast.error(t('message.error'));
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: I.invite.id
                    });
                    toast.success(t('message.invite.response_sent'));
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        } else {
            notificationRequest
                .sendInviteResponse(params, I.invite.id)
                .catch((err) => {
                    console.error('Invite response failed', err);
                    toast.error(t('message.error'));
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: I.invite.id
                    });
                    toast.success(t('message.invite.response_sent'));
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        }
    }
</script>
