<template>
    <el-dialog
        class="x-dialog"
        v-model="bioDialog.visible"
        :title="t('dialog.bio.header')"
        width="600px"
        append-to-body>
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
                maxlength="64"
                show-count
                size="sm"
                style="margin-top: 5px">
                <template #leading>
                    <img :src="getFaviconUrl(link)" style="width: 16px; height: 16px; vertical-align: middle" />
                </template>
                <template #actions>
                    <Button variant="outline" @click="bioDialog.bioLinks.splice(index, 1)" />
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

        <template #footer>
            <Button :disabled="bioDialog.loading" @click="saveBio">
                {{ t('dialog.bio.update') }}
            </Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { InputGroupAction, InputGroupTextareaField } from '@/components/ui/input-group';
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
