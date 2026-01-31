<template>
    <Dialog :open="isYouTubeApiDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.youtube_api.header') }}</DialogTitle>
            </DialogHeader>
            <div style="font-size: 12px">{{ t('dialog.youtube_api.description') }} <br /></div>

            <InputGroupTextareaField
                v-model="youTubeApiKey"
                :placeholder="t('dialog.youtube_api.placeholder')"
                :maxlength="39"
                :rows="2"
                class="mt-2.5"
                show-count />

            <DialogFooter>
                <Button
                    variant="outline"
                    @click="openExternalLink('https://smashballoon.com/doc/youtube-api-key/')">
                    {{ t('dialog.youtube_api.guide') }}
                </Button>
                <Button @click="testYouTubeApiKey">
                    {{ t('dialog.youtube_api.save') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore } from '../../../stores';

    const advancedSettingsStore = useAdvancedSettingsStore();

    const { youTubeApiKey } = storeToRefs(advancedSettingsStore);

    const { lookupYouTubeVideo, setYouTubeApiKey } = advancedSettingsStore;

    const { t } = useI18n();

    defineProps({
        isYouTubeApiDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isYouTubeApiDialogVisible']);

    async function testYouTubeApiKey() {
        const previousKey = youTubeApiKey.value;
        if (!youTubeApiKey.value) {
            toast.success('YouTube API key removed');
            closeDialog();
            return;
        }
        const data = await lookupYouTubeVideo('dQw4w9WgXcQ');
        if (!data) {
            setYouTubeApiKey(previousKey);
            toast.error('Invalid YouTube API key');
        } else {
            setYouTubeApiKey(youTubeApiKey.value);
            toast.success('YouTube API key valid!');
            closeDialog();
        }
    }

    function closeDialog() {
        emit('update:isYouTubeApiDialogVisible', false);
    }
</script>
