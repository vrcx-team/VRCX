<template>
    <div class="h-full min-h-0 flex flex-col p-2 rounded-xl bg-(--profile-card)">
        <div class="flex items-center gap-1">
            <Button
                class="rounded-full"
                variant="ghost"
                size="icon-sm"
                :disabled="isGroupGalleryLoading"
                @click="getGroupGalleries">
                <Spinner v-if="isGroupGalleryLoading" />
                <RefreshCw v-else />
            </Button>
            <TooltipWrapper
                v-if="canManageGroupGalleries()"
                side="top"
                :content="t('dialog.group.gallery.create_tooltip')">
                <Button
                    class="rounded-full"
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="t('dialog.group.gallery.create_tooltip')"
                    :disabled="isCreatingGallery"
                    @click="startCreateGallery">
                    <Plus />
                </Button>
            </TooltipWrapper>
        </div>
        <GroupGalleryForm
            v-if="isCreatingGallery"
            :form="galleryForm"
            :saving="isSavingGallery"
            :submit-label="t('dialog.group.gallery.create')"
            @save="saveGallery"
            @cancel="closeGalleryForm" />
        <TabsUnderline
            v-if="groupDialog.ref.galleries?.length"
            v-model="groupDialogGalleryCurrentName"
            :items="groupGalleryTabs"
            :unmount-on-hide="false"
            fill
            class="mt-2.5 min-h-0">
            <template
                v-for="(gallery, index) in groupDialog.ref.galleries"
                :key="`label-${index}`"
                v-slot:[`label-${index}`]>
                <span class="text-base font-bold" v-text="gallery.name" />
                <TooltipWrapper side="top" :content="groupGalleryStatusText(gallery)">
                    <i class="x-status-icon" style="margin-left: 6px" :class="groupGalleryStatus(gallery)" />
                </TooltipWrapper>
                <span class="text-muted-foreground text-xs ml-1.5">{{
                    groupDialog.galleries[gallery.id] ? groupDialog.galleries[gallery.id].length : 0
                }}</span>
            </template>
            <template
                v-for="(gallery, index) in groupDialog.ref.galleries"
                :key="`content-${index}`"
                v-slot:[String(index)]>
                <GroupGalleryForm
                    v-if="editingGalleryId === gallery.id"
                    :form="galleryForm"
                    :saving="isSavingGallery"
                    :submit-label="t('dialog.group.gallery.save')"
                    @save="saveGallery"
                    @cancel="closeGalleryForm" />
                <div v-else class="flex items-center gap-2 p-2">
                    <span class="flex-1 text-xs text-muted-foreground" v-text="gallery.description" />
                    <TooltipWrapper
                        v-if="canSubmitToGallery(gallery)"
                        side="top"
                        :content="t('dialog.group.gallery.add_image_tooltip')">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="text-muted-foreground hover:text-foreground"
                            :aria-label="t('dialog.group.gallery.add_image_tooltip')"
                            @click="showAddImageDialog(gallery)">
                            <ImagePlus />
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper
                        v-if="canManageGallery(gallery)"
                        side="top"
                        :content="t('dialog.group.gallery.edit_tooltip')">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="text-muted-foreground hover:text-foreground"
                            :aria-label="t('dialog.group.gallery.edit_tooltip')"
                            @click="startEditGallery(gallery)">
                            <Pencil />
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper
                        v-if="canManageGroupGalleries()"
                        side="top"
                        :content="t('dialog.group.gallery.delete_tooltip')">
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="text-muted-foreground hover:text-foreground"
                            :aria-label="t('dialog.group.gallery.delete_tooltip')"
                            @click="deleteGallery(gallery)">
                            <Trash2 />
                        </Button>
                    </TooltipWrapper>
                </div>
                <div
                    style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 16px;
                        margin-top: 8px;
                    ">
                    <Card
                        v-for="image in groupDialog.galleries[gallery.id]"
                        :key="image.id"
                        class="group relative p-0 overflow-hidden transition-shadow hover:shadow-md">
                        <TooltipWrapper
                            v-if="canDeleteImage(gallery, image)"
                            side="top"
                            :content="t('dialog.group.gallery.delete_image_tooltip')">
                            <Button
                                size="icon-sm"
                                variant="secondary"
                                class="absolute top-1.5 right-1.5 z-10 opacity-0 transition-opacity group-hover:opacity-100"
                                :aria-label="t('dialog.group.gallery.delete_image_tooltip')"
                                @click.stop="deleteGalleryImage(image)">
                                <Trash2 />
                            </Button>
                        </TooltipWrapper>
                        <div class="cursor-pointer" @click="showFullscreenImageDialog(image.imageUrl)">
                            <img
                                :src="image.imageUrl"
                                :class="['max-w-full', 'max-h-full']"
                                @error="onImageError"
                                loading="lazy" />
                            <div
                                class="hidden h-[200px] w-full items-center justify-center bg-muted"
                                style="display: none">
                                <Image class="size-8 text-muted-foreground" />
                            </div>
                        </div>
                    </Card>
                </div>
            </template>
        </TabsUnderline>
        <GallerySelectDialog :gallery-select-dialog="gallerySelectDialog" @select-image="handleGalleryImageSelect" />
    </div>
</template>

<script setup>
    import { Image, ImagePlus, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useGroupStore, useModalStore, useUserStore } from '../../../stores';
    import { useGroupGalleries } from './useGroupGalleries';
    import GallerySelectDialog from './GallerySelectDialog.vue';
    import GroupGalleryForm from './GroupGalleryForm.vue';

    const { t } = useI18n();
    const { groupDialog } = storeToRefs(useGroupStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const {
        isGroupGalleryLoading,
        groupDialogGalleryCurrentName,
        groupGalleryTabs,
        groupGalleryStatus,
        getGroupGalleries,
        canManageGroupGalleries,
        canManageGallery,
        canSubmitToGallery,
        canDeleteImage,
        createGallery,
        deleteGallery,
        updateGallery,
        addGalleryImage,
        deleteGalleryImage
    } = useGroupGalleries(groupDialog, { t, modalStore: useModalStore(), currentUser });

    const isCreatingGallery = ref(false);
    const editingGalleryId = ref('');
    const isSavingGallery = ref(false);
    const galleryForm = ref({ name: '', description: '', membersOnly: false });

    let addImageGalleryId = '';
    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedImageUrl: '',
        isIconGallerySelectDialog: false
    });

    function groupGalleryStatusText(gallery) {
        if (!gallery.membersOnly) {
            return t('dialog.group.gallery.visibility_public');
        }
        if (!gallery.roleIdsToView) {
            return t('dialog.group.gallery.visibility_members');
        }
        return t('dialog.group.gallery.visibility_roles');
    }

    function startCreateGallery() {
        editingGalleryId.value = '';
        isCreatingGallery.value = true;
        galleryForm.value = { name: '', description: '', membersOnly: false };
    }

    function startEditGallery(gallery) {
        isCreatingGallery.value = false;
        editingGalleryId.value = gallery.id;
        galleryForm.value = {
            name: gallery.name ?? '',
            description: gallery.description ?? '',
            membersOnly: Boolean(gallery.membersOnly)
        };
    }

    function closeGalleryForm() {
        isCreatingGallery.value = false;
        editingGalleryId.value = '';
    }

    async function saveGallery() {
        const form = galleryForm.value;
        const fields = {
            name: form.name.trim(),
            description: form.description.trim(),
            membersOnly: form.membersOnly
        };
        isSavingGallery.value = true;
        try {
            const saved = isCreatingGallery.value
                ? await createGallery(fields)
                : await updateGallery(editingGalleryId.value, fields);
            if (saved) {
                closeGalleryForm();
            }
        } finally {
            isSavingGallery.value = false;
        }
    }

    function showAddImageDialog(gallery) {
        addImageGalleryId = gallery.id;
        gallerySelectDialog.value = {
            visible: true,
            selectedFileId: '',
            selectedImageUrl: '',
            isIconGallerySelectDialog: false
        };
    }

    function handleGalleryImageSelect({ fileId }) {
        if (!fileId || !addImageGalleryId) {
            return;
        }
        addGalleryImage(addImageGalleryId, fileId);
    }

    /**
     * @param {Event} event
     */
    function onImageError(event) {
        const img = /** @type {HTMLElement} */ (event.target);
        img.style.display = 'none';
        /** @type {HTMLElement} */ (img.nextElementSibling).style.display = 'flex';
    }

    defineExpose({
        getGroupGalleries
    });
</script>
