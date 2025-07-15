<template>
    <safe-dialog
        class="x-dialog"
        :visible="visible"
        :title="t('dialog.invite_message.header')"
        width="400px"
        append-to-body
        @close="cancelInviteConfirm">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_message.confirmation') }}</span>
        </div>

        <template #footer>
            <el-button type="small" @click="cancelInviteConfirm">
                {{ t('dialog.invite_message.cancel') }}
            </el-button>
            <el-button type="primary" size="small" @click="sendInviteConfirm">
                {{ t('dialog.invite_message.confirm') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { instanceRequest, notificationRequest } from '../../../api';
    import { parseLocation } from '../../../shared/utils';
    import { useGalleryStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const { uploadImage } = storeToRefs(useGalleryStore());
    const { clearInviteImageUpload } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        visible: {
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

    const emit = defineEmits(['update:visible', 'closeInviteDialog']);

    function cancelInviteConfirm() {
        emit('update:visible', false);
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
                    $message({
                        message: 'Invite message sent',
                        type: 'success'
                    });
                }
            };
            inviteLoop();
        } else if (messageType === 'invite') {
            D.params.messageSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                notificationRequest
                    .sendInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Invite message sent',
                            type: 'success'
                        });
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
                        $message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                notificationRequest
                    .sendRequestInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        $message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        }
        cancelInviteConfirm();
        emit('closeInviteDialog');
    }
</script>
