<template>
    <Dialog
        :open="sendInviteResponseConfirmDialog.visible"
        @update:open="(open) => (open ? null : cancelInviteResponseConfirm())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.invite_response_message.header') }}</DialogTitle>
            </DialogHeader>
            <div style="font-size: 12px">
                <span>{{ t('dialog.invite_response_message.confirmation') }}</span>
            </div>

            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="cancelInviteResponseConfirm">{{
                    t('dialog.invite_response_message.cancel')
                }}</Button>
                <Button @click="sendInviteResponseConfirm">{{ t('dialog.invite_response_message.confirm') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { notificationRequest } from '../../../api';
    import { useGalleryStore } from '../../../stores';

    const { t } = useI18n();

    const galleryStore = useGalleryStore();
    const { uploadImage } = storeToRefs(galleryStore);

    const props = defineProps({
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        },
        sendInviteResponseConfirmDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['closeResponseConfirmDialog', 'closeInviteDialog']);

    function cancelInviteResponseConfirm() {
        emit('closeResponseConfirmDialog');
    }

    function sendInviteResponseConfirm() {
        const D = props.sendInviteResponseDialog;
        const params = {
            responseSlot: D.messageSlot.slot,
            rsvp: true
        };
        if (uploadImage.value) {
            notificationRequest
                .sendInviteResponsePhoto(params, D.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    toast.success('Invite response photo message sent');
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        } else {
            notificationRequest
                .sendInviteResponse(params, D.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    toast.success('Invite response message sent');
                    return args;
                })
                .finally(() => {
                    emit('closeInviteDialog');
                });
        }
        cancelInviteResponseConfirm();
    }
</script>
