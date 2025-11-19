<template>
    <el-dialog
        class="x-dialog"
        :model-value="editAndSendInviteDialog.visible"
        :title="t('dialog.edit_send_invite_message.header')"
        width="400px"
        append-to-body
        @close="cancelEditAndSendInvite">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_send_invite_message.description') }}</span>
        </div>

        <el-input
            v-model="editAndSendInviteDialog.newMessage"
            type="textarea"
            size="small"
            maxlength="64"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px"></el-input>

        <template #footer>
            <el-button @click="cancelEditAndSendInvite">
                {{ t('dialog.edit_send_invite_message.cancel') }}
            </el-button>
            <el-button type="primary" @click="saveEditAndSendInvite" :disabled="!editAndSendInviteDialog.newMessage">
                {{ t('dialog.edit_send_invite_message.send') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
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
                        ElMessage({
                            message: "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        ElMessage('Invite message updated');
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
                    ElMessage({
                        message: 'Invite sent',
                        type: 'success'
                    });
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
                        ElMessage({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                notificationRequest
                    .sendInvite(I.params, I.userId)
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
            I.params.requestSlot = slot;
            if (uploadImage.value) {
                notificationRequest
                    .sendRequestInvitePhoto(I.params, I.userId)
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
                    .sendRequestInvite(I.params, I.userId)
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

        emit('closeInviteDialog');
    }
</script>
