import { computed, ref } from 'vue';
import { toast } from 'vue-sonner';

import { groupRequest, queryRequest } from '../../../api';
import { hasGroupPermission, removeFromArray } from '../../../shared/utils';

/**
 * Composable for managing group gallery loading and display state.
 *
 * @param {import('vue').Ref} groupDialog - Reactive ref to the group dialog state
 * @param {{ t?: Function; modalStore?: any; currentUser?: import('vue').Ref }} [deps]
 * @returns {{
 *     isGroupGalleryLoading: import('vue').Ref<boolean>;
 *     groupDialogGalleryCurrentName: import('vue').Ref<string>;
 *     groupGalleryTabs: import('vue').ComputedRef<Array>;
 *     groupGalleryStatus: (gallery: Object) => Object;
 *     getGroupGalleries: () => Promise<void>;
 *     getGroupGallery: (groupId: string, galleryId: string) => Promise<void>;
 *     canManageGroupGalleries: () => boolean;
 *     canManageGallery: (gallery: Object) => boolean;
 *     canSubmitToGallery: (gallery: Object) => boolean;
 *     canDeleteImage: (gallery: Object, image: Object) => boolean;
 *     createGallery: (fields: Object) => Promise<boolean>;
 *     deleteGallery: (gallery: Object) => Promise<void>;
 *     updateGallery: (galleryId: string, fields: Object) => Promise<boolean>;
 *     addGalleryImage: (galleryId: string, fileId: string) => Promise<void>;
 *     deleteGalleryImage: (image: Object) => Promise<void>;
 * }}
 */
export function useGroupGalleries(groupDialog, deps = {}) {
    const { t, modalStore, currentUser } = deps;
    const groupDialogGalleryCurrentName = ref('0');
    const isGroupGalleryLoading = ref(false);

    const groupGalleryTabs = computed(() =>
        (groupDialog.value?.ref?.galleries || []).map((gallery, index) => ({
            value: String(index),
            label: gallery?.name ?? ''
        }))
    );

    /**
     * @param {object} gallery
     */
    function groupGalleryStatus(gallery) {
        const style = {};
        if (!gallery.membersOnly) {
            style.blue = true;
        } else if (!gallery.roleIdsToView) {
            style.green = true;
        } else {
            style.red = true;
        }
        return style;
    }

    /**
     * @param obj
     */
    function updateGroupDialogData(obj) {
        groupDialog.value = {
            ...groupDialog.value,
            ...obj
        };
    }

    async function getGroupGalleries() {
        updateGroupDialogData({ ...groupDialog.value, galleries: {} });
        groupDialogGalleryCurrentName.value = '0';
        isGroupGalleryLoading.value = true;
        const groupId = groupDialog.value.id;
        const tasks = (groupDialog.value.ref.galleries || []).map((gallery) => getGroupGallery(groupId, gallery.id));
        await Promise.allSettled(tasks);
        isGroupGalleryLoading.value = false;
    }

    /**
     * @param {string} groupId
     * @param {string} galleryId
     */
    async function getGroupGallery(groupId, galleryId) {
        try {
            const params = {
                groupId,
                galleryId,
                n: 100,
                offset: 0
            };
            const count = 50; // 5000 max
            for (let i = 0; i < count; i++) {
                const args = await queryRequest.fetch('groupGallery', params);
                if (args) {
                    for (const json of args.json) {
                        if (groupDialog.value.id === json.groupId) {
                            if (!groupDialog.value.galleries[json.galleryId]) {
                                groupDialog.value.galleries[json.galleryId] = [];
                            }
                            groupDialog.value.galleries[json.galleryId].push(json);
                        }
                    }
                }
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * @param {string[] | null | undefined} roleIds
     */
    function hasAnyGroupRole(roleIds) {
        const myRoleIds = groupDialog.value?.ref?.myMember?.roleIds || [];
        return Boolean(roleIds?.some((roleId) => myRoleIds.includes(roleId)));
    }

    function canManageGroupGalleries() {
        return hasGroupPermission(groupDialog.value?.ref, 'group-galleries-manage');
    }

    /**
     * @param {object} gallery
     */
    function canManageGallery(gallery) {
        return canManageGroupGalleries() || hasAnyGroupRole(gallery?.roleIdsToManage);
    }

    /**
     * @param {object} gallery
     */
    function canSubmitToGallery(gallery) {
        return canManageGallery(gallery) || hasAnyGroupRole(gallery?.roleIdsToSubmit);
    }

    /**
     * @param {object} gallery
     * @param {object} image
     */
    function canDeleteImage(gallery, image) {
        return canManageGallery(gallery) || image?.submittedByUserId === currentUser?.value?.id;
    }

    /**
     * @param {{ name: string; description: string; membersOnly: boolean }} fields
     * @returns {Promise<boolean>}
     */
    async function createGallery(fields) {
        const args = await groupRequest.createGroupGallery({
            groupId: groupDialog.value.id,
            ...fields
        });
        if (groupDialog.value.id !== args.params.groupId) {
            return false;
        }
        if (!groupDialog.value.ref.galleries) {
            groupDialog.value.ref.galleries = [];
        }
        groupDialog.value.ref.galleries.push(args.json);
        groupDialog.value.galleries[args.json.id] = [];
        groupDialogGalleryCurrentName.value = String(groupDialog.value.ref.galleries.length - 1);
        toast.success(t('dialog.group.gallery.created'));
        return true;
    }

    /**
     * @param {object} gallery
     */
    async function deleteGallery(gallery) {
        const { ok } = await modalStore.confirm({
            description: t('confirm.delete_gallery', { name: gallery.name }),
            title: t('confirm.title'),
            destructive: true
        });
        if (!ok) {
            return;
        }
        const args = await groupRequest.deleteGroupGallery({
            groupId: groupDialog.value.id,
            galleryId: gallery.id
        });
        if (groupDialog.value.id !== args.params.groupId) {
            return;
        }
        removeFromArray(groupDialog.value.ref.galleries, gallery);
        delete groupDialog.value.galleries[gallery.id];
        groupDialogGalleryCurrentName.value = '0';
        toast.success(t('dialog.group.gallery.deleted'));
    }

    /**
     * @param {string} galleryId
     * @param {{ name: string; description: string; membersOnly: boolean }} fields
     * @returns {Promise<boolean>}
     */
    async function updateGallery(galleryId, fields) {
        const args = await groupRequest.editGroupGallery({
            groupId: groupDialog.value.id,
            galleryId,
            ...fields
        });
        if (groupDialog.value.id !== args.params.groupId) {
            return false;
        }
        const gallery = groupDialog.value.ref.galleries?.find((item) => item.id === galleryId);
        if (gallery) {
            Object.assign(gallery, args.json);
        }
        toast.success(t('dialog.group.gallery.saved'));
        return true;
    }

    /**
     * @param {string} galleryId
     * @param {string} fileId
     */
    async function addGalleryImage(galleryId, fileId) {
        const args = await groupRequest.addGroupGalleryImage({
            groupId: groupDialog.value.id,
            galleryId,
            fileId
        });
        if (groupDialog.value.id !== args.params.groupId) {
            return;
        }
        if (!args.json.approved) {
            toast.success(t('dialog.group.gallery.image_pending_approval'));
            return;
        }
        if (!groupDialog.value.galleries[galleryId]) {
            groupDialog.value.galleries[galleryId] = [];
        }
        groupDialog.value.galleries[galleryId].unshift(args.json);
        toast.success(t('dialog.group.gallery.image_added'));
    }

    /**
     * @param {object} image
     */
    async function deleteGalleryImage(image) {
        const { ok } = await modalStore.confirm({
            description: t('confirm.delete_gallery_image'),
            title: t('confirm.title'),
            destructive: true
        });
        if (!ok) {
            return;
        }
        const args = await groupRequest.deleteGroupGalleryImage({
            groupId: image.groupId,
            galleryId: image.galleryId,
            imageId: image.id
        });
        if (groupDialog.value.id !== args.params.groupId) {
            return;
        }
        const images = groupDialog.value.galleries[image.galleryId];
        if (images) {
            removeFromArray(images, image);
        }
        toast.success(t('dialog.group.gallery.image_deleted'));
    }

    return {
        isGroupGalleryLoading,
        groupDialogGalleryCurrentName,
        groupGalleryTabs,
        groupGalleryStatus,
        getGroupGalleries,
        getGroupGallery,
        canManageGroupGalleries,
        canManageGallery,
        canSubmitToGallery,
        canDeleteImage,
        createGallery,
        deleteGallery,
        updateGallery,
        addGalleryImage,
        deleteGalleryImage
    };
}
