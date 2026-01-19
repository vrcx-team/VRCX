<template>
    <Dialog
        :open="editAndSendInviteDialog.visible"
        @update:open="
            (open) => {
                if (!open) cancelEditAndSendInvite();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-100">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.edit_send_invite_message.header') }}</DialogTitle>
            </DialogHeader>

            <div style="font-size: 12px">
                <span>{{ t('dialog.edit_send_invite_message.description') }}</span>
            </div>

            <InputGroupTextareaField
                v-model="editAndSendInviteDialog.newMessage"
                :maxlength="64"
                :rows="2"
                class="mt-2.5"
                placeholder=""
                show-count />

            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="cancelEditAndSendInvite">
                    {{ t('dialog.edit_send_invite_message.cancel') }}
                </Button>
                <Button @click="saveEditAndSendInvite" :disabled="!editAndSendInviteDialog.newMessage">
                    {{ t('dialog.edit_send_invite_message.send') }}
                </Button>
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

    import { instanceRequest, inviteMessagesRequest, notificationRequest } from '../../../api';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { parseLocation } from '../../../shared/utils';

    const { t } = useI18n();
    const { uploadImage } = storeToRefs(useGalleryStore());
    const { clearInviteImageUpload } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        editAndSendInviteDialog: {
            type: Object,
            required: true
        },
        sendInviteDialog: {
            type: Object,
            required: true
        },
        inviteDialog: {
            type: Object,
            required: false,
            default: () => ({})
        }
    });

    const emit = defineEmits(['update:editAndSendInviteDialog', 'closeInviteDialog']);

    function cancelEditAndSendInvite() {
        emit('update:editAndSendInviteDialog', { ...props.editAndSendInviteDialog, visible: false });
    }

    async function saveEditAndSendInvite() {
        const D = props.editAndSendInviteDialog;
        const I = props.sendInviteDialog;
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
                        const errorMessage = t('message.invite.message_update_failed');
                        toast.error(errorMessage);
                        throw new Error(errorMessage);
                    } else {
                        toast('Invite message updated');
                    }
                    return args;
                });
        }
        const J = props.inviteDialog;
        if (J?.visible) {
            const inviteLoop = () => {
                if (J.userIds.length > 0) {
                    const receiverUserId = J.userIds.shift();
                    if (receiverUserId === currentUser.value.id) {
                        // can't invite self!?
                        const L = parseLocation(J.worldId);
                        instanceRequest
                            .selfInvite({
                                instanceId: L.instanceId,
                                worldId: L.worldId
                            })
                            .finally(inviteLoop);
                    } else if (uploadImage.value) {
                        notificationRequest
                            .sendInvitePhoto(
                                {
                                    instanceId: J.worldId,
                                    worldId: J.worldId,
                                    worldName: J.worldName,
                                    messageSlot: slot
                                },
                                receiverUserId
                            )
                            .finally(inviteLoop);
                    } else {
                        notificationRequest
                            .sendInvite(
                                {
                                    instanceId: J.worldId,
                                    worldId: J.worldId,
                                    worldName: J.worldName,
                                    messageSlot: slot
                                },
                                receiverUserId
                            )
                            .finally(inviteLoop);
                    }
                } else {
                    J.loading = false;
                    J.visible = false;
                    toast.success(t('message.invite.sent'));
                }
            };
            inviteLoop();
        } else if (messageType === 'invite') {
            I.params.messageSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendInvitePhoto(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Invite photo message sent');
                        return args;
                    });
            } else {
                notificationRequest
                    .sendInvite(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Invite message sent');
                        return args;
                    });
            }
        } else if (messageType === 'request') {
            I.params.requestSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendRequestInvitePhoto(I.params, I.userId)
                    .catch((err) => {
                        clearInviteImageUpload();
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Request invite photo message sent');
                        return args;
                    });
            } else {
                notificationRequest
                    .sendRequestInvite(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Request invite message sent');
                        return args;
                    });
            }
        }

        emit('closeInviteDialog');
    }
</script>
