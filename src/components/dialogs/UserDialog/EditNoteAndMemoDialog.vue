<template>
    <el-dialog
        class="x-dialog"
        :model-value="props.visible"
        title="Edit Note And Memo"
        :show-close="false"
        top="30vh"
        width="500px"
        append-to-body
        @close="cancel">
        <template v-if="!hideUserNotes || (hideUserNotes && hideUserMemos)">
            <span class="name">{{ t('dialog.user.info.note') }}</span>
            <br />
            <InputGroupCharCount
                v-model="note"
                :maxlength="256"
                multiline
                rows="6"
                :placeholder="t('dialog.user.info.note_placeholder')"
                input-class="extra resize-none" />
        </template>
        <template v-if="!hideUserMemos || (hideUserNotes && hideUserMemos)">
            <span class="name">{{ t('dialog.user.info.memo') }}</span>
            <br />
            <el-input
                v-model="memo"
                class="extra"
                type="textarea"
                :rows="6"
                :autosize="{ minRows: 2, maxRows: 20 }"
                :placeholder="t('dialog.user.info.memo_placeholder')"
                size="small"
                resize="none"></el-input>
        </template>
        <template #footer>
            <div class="dialog-footer">
                <Button variant="secondary" @click="cancel">Cancel</Button>
                <Button @click="saveChanges"> Confirm </Button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupCharCount } from '@/components/ui/input-group';
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
