<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteResponseConfirmDialog.visible"
        :title="t('dialog.invite_response_message.header')"
        width="400px"
        append-to-body
        @close="cancelInviteResponseConfirm">
        <div style="font-size: 12px">
            <span>{{ t('dialog.invite_response_message.confirmation') }}</span>
        </div>

        <template #footer>
            <el-button @click="cancelInviteResponseConfirm">{{ t('dialog.invite_response_message.cancel') }}</el-button>
            <el-button type="primary" @click="sendInviteResponseConfirm">{{
                t('dialog.invite_response_message.confirm')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
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
                    ElMessage({
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
                .sendInviteResponse(params, D.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    notificationRequest.hideNotification({
                        notificationId: D.invite.id
                    });
                    ElMessage({
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
