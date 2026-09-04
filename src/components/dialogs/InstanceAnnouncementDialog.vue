<template>
    <Dialog :open="open" @update:open="handleOpenChange">
        <DialogContent class="sm:max-w-162.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.instance_announcement.header') }}</DialogTitle>
            </DialogHeader>

            <FieldGroup class="gap-4">
                <Field>
                    <FieldLabel>{{ t('dialog.instance_announcement.message') }}</FieldLabel>
                    <FieldContent>
                        <InputGroupTextareaField
                            v-model="message"
                            :rows="4"
                            input-class="resize-none"
                            :disabled="loading" />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel>{{ t('dialog.instance_announcement.image') }}</FieldLabel>
                    <FieldContent>
                        <div v-if="gallerySelectDialog.selectedFileId" class="flex items-start gap-2">
                            <img
                                :src="gallerySelectDialog.selectedImageUrl"
                                class="h-16 w-16 cursor-pointer rounded-md object-cover"
                                loading="lazy"
                                @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)" />
                            <Button size="sm" variant="outline" :disabled="loading" @click="clearImage">
                                {{ t('dialog.instance_announcement.clear_image') }}
                            </Button>
                        </div>
                        <Button v-else size="sm" variant="outline" :disabled="loading" @click="showGallerySelectDialog">
                            {{ t('dialog.instance_announcement.select_image') }}
                        </Button>
                    </FieldContent>
                </Field>
            </FieldGroup>

            <DialogFooter>
                <Button variant="secondary" :disabled="loading" @click="closeDialog">
                    {{ t('common.actions.cancel') }}
                </Button>
                <Button :disabled="!canSubmit" @click="sendAnnouncement">
                    {{ loading ? t('dialog.instance_announcement.sending') : t('dialog.instance_announcement.send') }}
                </Button>
            </DialogFooter>

            <GallerySelectDialog
                :gallery-select-dialog="gallerySelectDialog"
                @select-image="handleGalleryImageSelect" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupTextareaField } from '@/components/ui/input-group';

    import { instanceRequest } from '../../api';
    import { useGalleryStore, useGroupStore } from '../../stores';
    import GallerySelectDialog from './GroupDialog/GallerySelectDialog.vue';
    import { extractFileId, extractFileVersion, parseLocation } from '@/shared/utils';
    import { storeToRefs } from 'pinia';

    const props = defineProps({
        open: {
            type: Boolean,
            default: false
        },
        location: {
            type: String,
            required: true
        }
    });

    const emit = defineEmits(['update:open']);
    const { t } = useI18n();
    const { showFullscreenImageDialog } = useGalleryStore();
    const groupStore = useGroupStore();

    const message = ref('');
    const loading = ref(false);
    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedFileVersion: undefined,
        selectedImageUrl: '',
        isIconGallerySelectDialog: false
    });

    const canSubmit = computed(() => {
        return !loading.value && message.value.trim().length > 0;
    });

    watch(
        () => props.open,
        (open) => {
            if (open) {
                message.value = '';
                clearImage();
            }
        }
    );

    function showGallerySelectDialog() {
        gallerySelectDialog.value.visible = true;
    }

    function handleGalleryImageSelect({ imageUrl, fileId, fileVersion }) {
        gallerySelectDialog.value.selectedImageUrl = imageUrl;
        gallerySelectDialog.value.selectedFileId = fileId;
        gallerySelectDialog.value.selectedFileVersion = fileVersion;
    }

    function clearImage() {
        gallerySelectDialog.value.selectedImageUrl = '';
        gallerySelectDialog.value.selectedFileId = '';
        gallerySelectDialog.value.selectedFileVersion = undefined;
    }

    function closeDialog() {
        if (!loading.value) {
            emit('update:open', false);
        }
    }

    function handleOpenChange(open) {
        if (!open) {
            closeDialog();
        }
    }

    async function sendAnnouncement() {
        if (!canSubmit.value) {
            return;
        }

        const L = parseLocation(props.location);
        const group = groupStore.cachedGroups.get(L.groupId);
        const fileId = extractFileId(group?.bannerUrl);
        const fileVersion = extractFileVersion(group?.bannerUrl);

        const params = {
            location: props.location,
            title: 'Instance Announcement',
            message: message.value.trim(),
            imageId: fileId ?? undefined,
            imageVersion: fileVersion ?? undefined
        };
        if (gallerySelectDialog.value.selectedFileId) {
            params.imageId = gallerySelectDialog.value.selectedFileId;
            params.imageVersion = gallerySelectDialog.value.selectedFileVersion;
        }

        loading.value = true;
        try {
            await instanceRequest.instanceAnnouncement(params);
            toast.success(t('message.instance.announcement_sent'));
            emit('update:open', false);
        } finally {
            loading.value = false;
        }
    }
</script>
