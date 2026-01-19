<template>
    <Dialog :open="isEditInviteMessageDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-sm">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.edit_invite_message.header') }}</DialogTitle>
            </DialogHeader>
            <div style="font-size: 12px">
                <span>{{ t('dialog.edit_invite_message.description') }}</span>
                <InputGroupTextareaField
                    v-model="message"
                    :maxlength="64"
                    :rows="2"
                    class="mt-2.5"
                    placeholder=""
                    show-count />
            </div>
            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="closeDialog">{{
                    t('dialog.edit_invite_message.cancel')
                }}</Button>
                <Button @click="saveEditInviteMessage">{{ t('dialog.edit_invite_message.save') }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
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
                        const errorMessage = t('message.invite.message_update_failed');
                        toast.error(errorMessage);
                        throw new Error(errorMessage);
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
