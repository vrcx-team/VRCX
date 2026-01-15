<template>
    <Dialog v-model:open="pronounsDialog.visible">
        <DialogContent class="x-dialog sm:max-w-150">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.pronouns.header') }}</DialogTitle>
            </DialogHeader>

            <div v-loading="pronounsDialog.loading">
                <InputGroupTextareaField
                    v-model="pronounsDialog.pronouns"
                    :maxlength="32"
                    :rows="2"
                    :placeholder="t('dialog.pronouns.pronouns_placeholder')"
                    show-count />
            </div>

            <DialogFooter>
                <Button :disabled="pronounsDialog.loading" @click="savePronouns">
                    {{ t('dialog.pronouns.update') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
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
