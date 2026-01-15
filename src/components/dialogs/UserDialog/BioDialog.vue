<template>
    <Dialog v-model:open="bioDialog.visible">
        <DialogContent class="x-dialog sm:max-w-150">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.bio.header') }}</DialogTitle>
            </DialogHeader>

            <div v-loading="bioDialog.loading">
                <InputGroupTextareaField
                    v-model="bioDialog.bio"
                    :maxlength="512"
                    :rows="5"
                    :placeholder="t('dialog.bio.bio_placeholder')"
                    class="mb-2.5"
                    show-count />

                <InputGroupAction
                    v-for="(link, index) in bioDialog.bioLinks"
                    :key="index"
                    v-model="bioDialog.bioLinks[index]"
                    :maxlength="64"
                    show-count
                    size="sm"
                    style="margin-top: 5px">
                    <template #leading>
                        <img :src="getFaviconUrl(link)" style="width: 16px; height: 16px; vertical-align: middle" />
                    </template>
                    <template #actions>
                        <Button variant="ghost" size="icon-sm" @click="bioDialog.bioLinks.splice(index, 1)"
                            ><Trash2 class="size-4"
                        /></Button>
                    </template>
                </InputGroupAction>

                <Button
                    variant="outline"
                    :disabled="bioDialog.bioLinks.length >= 3"
                    size="sm"
                    class="mt-2"
                    @click="bioDialog.bioLinks.push('')">
                    {{ t('dialog.bio.add_link') }}
                </Button>
            </div>

            <DialogFooter>
                <Button :disabled="bioDialog.loading" @click="saveBio">
                    {{ t('dialog.bio.update') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { InputGroupAction, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { Trash2 } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { getFaviconUrl } from '../../../shared/utils';
    import { userRequest } from '../../../api';

    const { t } = useI18n();
    const props = defineProps({
        bioDialog: {
            type: Object,
            required: true
        }
    });

    function saveBio() {
        const D = props.bioDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                bio: D.bio,
                bioLinks: D.bioLinks
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                toast.success('Bio updated');
                return args;
            });
    }
</script>
