<template>
    <el-dialog
        class="x-dialog"
        :model-value="isSendInviteConfirmDialogVisible"
        :title="t('dialog.invite_message.header')"
        width="400px"
        append-to-body
        @close="cancelInviteConfirm">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_message.confirmation') }}</span>
        </div>

        <template #footer>
            <Button variant="secondary" @click="cancelInviteConfirm">
                {{ t('dialog.invite_message.cancel') }}
            </Button>
            <Button @click="sendInviteConfirm">
                {{ t('dialog.invite_message.confirm') }}
            </Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { instanceRequest, notificationRequest } from '../../../api';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { parseLocation } from '../../../shared/utils';

    const { t } = useI18n();

    const { uploadImage } = storeToRefs(useGalleryStore());
    const { clearInviteImageUpload } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        isSendInviteConfirmDialogVisible: {
            type: Boolean,
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

    const emit = defineEmits(['update:isSendInviteConfirmDialogVisible', 'closeInviteDialog']);

    function cancelInviteConfirm() {
        emit('update:isSendInviteConfirmDialogVisible', false);
    }

    function sendInviteConfirm() {
        const D = props.sendInviteDialog;
        const J = props.inviteDialog;
        const messageType = D.messageSlot.messageType;
        const slot = D.messageSlot.slot;
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
                    toast.success('Invite message sent');
                }
            };
            inviteLoop();
        } else if (messageType === 'message') {
            // invite message
            D.params.messageSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Invite photo message sent');
                        return args;
                    });
            } else {
                notificationRequest
                    .sendInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Invite message sent');
                        return args;
                    });
            }
        } else if (messageType === 'request') {
            D.params.requestSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendRequestInvitePhoto(D.params, D.userId)
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
                    .sendRequestInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        toast.success('Request invite message sent');
                        return args;
                    });
            }
        }
        cancelInviteConfirm();
        emit('closeInviteDialog');
    }
</script>
