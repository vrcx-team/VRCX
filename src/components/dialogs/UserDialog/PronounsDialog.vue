<template>
    <el-dialog
        class="x-dialog"
        v-model="pronounsDialog.visible"
        :title="t('dialog.pronouns.header')"
        width="600px"
        append-to-body>
        <div v-loading="pronounsDialog.loading">
            <InputGroupCharCount
                v-model="pronounsDialog.pronouns"
                :maxlength="32"
                multiline
                rows="2"
                :placeholder="t('dialog.pronouns.pronouns_placeholder')" />
        </div>
        <template #footer>
            <Button :disabled="pronounsDialog.loading" @click="savePronouns">
                {{ t('dialog.pronouns.update') }}
            </Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { InputGroupCharCount } from '@/components/ui/input-group';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { userRequest } from '../../../api';

    const { t } = useI18n();
    const props = defineProps({
        pronounsDialog: {
            type: Object,
            required: true
        }
    });

    function savePronouns() {
        const D = props.pronounsDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                pronouns: D.pronouns
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                toast.success('Pronouns updated');
                return args;
            });
    }
</script>
