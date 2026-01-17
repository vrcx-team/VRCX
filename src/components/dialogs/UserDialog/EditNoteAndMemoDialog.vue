<template>
    <Dialog
        :open="props.visible"
        @update:open="
            (open) => {
                if (!open) cancel();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-125 translate-y-0" style="top: 30vh" :show-close-button="false">
            <DialogHeader>
                <DialogTitle>Edit Note And Memo</DialogTitle>
            </DialogHeader>

            <template v-if="!hideUserNotes || (hideUserNotes && hideUserMemos)">
                <span class="name my-2">{{ t('dialog.user.info.note') }}</span>
                <br />
                <InputGroupTextareaField
                    v-model="note"
                    :autosize="{ minRows: 6, maxRows: 20 }"
                    :maxlength="256"
                    :rows="6"
                    :placeholder="t('dialog.user.info.note_placeholder')"
                    input-class="text-xs resize-none"
                    class="my-2"
                    show-count />
            </template>
            <template v-if="!hideUserMemos || (hideUserNotes && hideUserMemos)">
                <span class="name">{{ t('dialog.user.info.memo') }}</span>
                <InputGroupTextareaField
                    v-model="memo"
                    class="text-xs mt-2"
                    :rows="6"
                    :placeholder="t('dialog.user.info.memo_placeholder')"
                    input-class="resize-none min-h-0" />
            </template>

            <DialogFooter>
                <Button variant="secondary" @click="cancel" class="mr-2">Cancel</Button>
                <Button @click="saveChanges">Confirm</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { miscRequest, userRequest } from '../../../api';
    import { replaceBioSymbols, saveUserMemo } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useUserStore } from '../../../stores';

    const { userDialog } = storeToRefs(useUserStore());
    const { cachedUsers } = useUserStore();
    const { hideUserNotes, hideUserMemos } = storeToRefs(useAppearanceSettingsStore());

    const { t } = useI18n();

    const props = defineProps({
        visible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:visible']);

    const note = ref('');
    const memo = ref('');

    watch(
        () => props.visible,
        (val) => {
            if (!val) return;
            note.value = userDialog.value.note;
            memo.value = userDialog.value.memo;
        }
    );

    function saveChanges() {
        cleanNote(note.value);
        checkNote(userDialog.value.ref, note.value);
        onUserMemoChange();
        emit('update:visible', false);
    }

    function cancel() {
        emit('update:visible', false);
    }

    function checkNote(ref, note) {
        if (ref.note !== note) {
            addNote(ref.id, note);
        }
    }

    async function addNote(userId, note) {
        const args = await miscRequest.saveNote({
            targetUserId: userId,
            note
        });
        handleNoteChange(args);
    }

    function handleNoteChange(args) {
        let _note = '';
        let targetUserId = '';
        if (typeof args.json !== 'undefined') {
            _note = replaceBioSymbols(args.json.note);
        }
        if (typeof args.params !== 'undefined') {
            targetUserId = args.params.targetUserId;
        }
        if (targetUserId === userDialog.value.id) {
            if (_note === args.params.note) {
                userDialog.value.note = _note;
            } else {
                // response is cached sadge :<
                userRequest.getUser({ userId: targetUserId });
            }
        }
        const ref = cachedUsers.get(targetUserId);
        if (typeof ref !== 'undefined') {
            ref.note = _note;
        }
    }

    function onUserMemoChange() {
        const D = userDialog.value;
        saveUserMemo(D.id, memo.value);
    }

    function cleanNote(note) {
        if (!note.value) return;
        // remove newlines because they aren't supported
        note.value = note.value?.replace(/[\r\n]/g, '');
    }
</script>
