<template>
    <el-dialog
        class="x-dialog"
        :model-value="visible"
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
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { instanceRequest, notificationRequest } from '../../../api';
    import { parseLocation } from '../../../shared/utils';
    import { useGalleryStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

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

    const emit = defineEmits(['update:model-value', 'closeInviteDialog']);

    function cancelInviteConfirm() {
        emit('update:model-value', false);
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
                    ElMessage({
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
                        ElMessage({
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
                        ElMessage({
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
                        ElMessage({
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
                        ElMessage({
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
