<template>
    <el-dialog
        class="x-dialog"
        :model-value="isEditInviteMessageDialogVisible"
        :title="t('dialog.edit_invite_message.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">
            <span>{{ t('dialog.edit_invite_message.description') }}</span>
            <InputGroupCharCount v-model="message" :maxlength="64" multiline rows="2" class="mt-2.5" placeholder="" />
        </div>
        <template #footer>
            <Button variant="secondary" class="mr-2" @click="closeDialog">{{
                t('dialog.edit_invite_message.cancel')
            }}</Button>
            <Button @click="saveEditInviteMessage">{{ t('dialog.edit_invite_message.save') }}</Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupCharCount } from '@/components/ui/input-group';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { inviteMessagesRequest } from '../../../api';

    const { t } = useI18n();

    const props = defineProps({
        isEditInviteMessageDialogVisible: { type: Boolean, default: false },
        inviteMessage: { type: Object, required: true }
    });

    const emit = defineEmits(['update:isEditInviteMessageDialogVisible', 'updateInviteMessages']);

    const message = ref('');

    watch(
        () => props.inviteMessage,
        (inviteMessage) => {
            if (inviteMessage) {
                message.value = inviteMessage.message;
            }
        },
        { deep: true }
    );

    function saveEditInviteMessage() {
        closeDialog();
        if (props.inviteMessage.message !== message.value) {
            const slot = props.inviteMessage.slot;
            const messageType = props.inviteMessage.messageType;
            const params = {
                message: message.value
            };
            inviteMessagesRequest
                .editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    if (args.json[slot].message === props.inviteMessage.message) {
                        toast.error("VRChat API didn't update message, try again");
                        throw new Error("VRChat API didn't update message, try again");
                    } else {
                        toast.success('Invite message updated');
                        emit('updateInviteMessages', messageType);
                    }
                    return args;
                });
        }
    }

    function closeDialog() {
        emit('update:isEditInviteMessageDialogVisible', false);
    }
</script>
