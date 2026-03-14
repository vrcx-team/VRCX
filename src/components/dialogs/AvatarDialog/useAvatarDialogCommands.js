import { ref } from 'vue';

import {
    avatarModerationRequest,
    avatarRequest,
    favoriteRequest
} from '../../../api';
import { removeAvatarFromCache } from '../../../coordinators/avatarCoordinator';
import {
    copyToClipboard,
    openExternalLink,
    replaceVrcPackageUrl
} from '../../../shared/utils';
import {
    handleImageUploadInput,
    resizeImageToFitLimits,
    uploadImageLegacy
} from '../../../coordinators/imageUploadCoordinator';
import {
    readFileAsBase64,
    withUploadTimeout
} from '../../../shared/utils/imageUpload';

/**
 * Composable for AvatarDialog command dispatch.
 * Uses a command map pattern instead of nested switch-case chains.
 * @param {import('vue').Ref} avatarDialog - reactive ref to the avatar dialog state
 * @param {object} deps - external dependencies
 * @param deps.t
 * @param deps.toast
 * @param deps.modalStore
 * @param deps.userDialog
 * @param deps.currentUser
 * @param deps.cachedAvatars
 * @param deps.cachedAvatarModerations
 * @param deps.showAvatarDialog
 * @param deps.showFavoriteDialog
 * @param deps.applyAvatarModeration
 * @param deps.applyAvatar
 * @param deps.sortUserDialogAvatars
 * @param deps.uiStore
 * @returns {object} command composable API
 */
export function useAvatarDialogCommands(
    avatarDialog,
    {
        t,
        toast,
        modalStore,
        userDialog,
        currentUser,
        cachedAvatars,
        cachedAvatarModerations,
        showAvatarDialog,
        showFavoriteDialog,
        applyAvatarModeration,
        applyAvatar,
        sortUserDialogAvatars,
        uiStore
    }
) {
    // --- Image crop dialog state ---
    const cropDialogOpen = ref(false);
    const cropDialogFile = ref(null);
    const changeAvatarImageLoading = ref(false);

    // --- Image upload ---

    /**
     *
     */
    function showChangeAvatarImageDialog() {
        document.getElementById('AvatarImageUploadButton').click();
    }

    /**
     * @param {Event} e
     */
    function onFileChangeAvatarImage(e) {
        const { file, clearInput } = handleImageUploadInput(e, {
            inputSelector: '#AvatarImageUploadButton',
            tooLargeMessage: () => t('message.file.too_large'),
            invalidTypeMessage: () => t('message.file.not_image')
        });
        if (!file) {
            return;
        }
        if (!avatarDialog.value.visible || avatarDialog.value.loading) {
            clearInput();
            return;
        }
        clearInput();
        cropDialogFile.value = file;
        cropDialogOpen.value = true;
    }

    /**
     * @param {Blob} blob
     */
    async function onCropConfirmAvatar(blob) {
        changeAvatarImageLoading.value = true;
        try {
            await withUploadTimeout(
                (async () => {
                    const base64Body = await readFileAsBase64(blob);
                    const base64File = await resizeImageToFitLimits(base64Body);
                    if (LINUX) {
                        const args =
                            await avatarRequest.uploadAvatarImage(base64File);
                        const fileUrl =
                            args.json.versions[args.json.versions.length - 1]
                                .file.url;
                        await avatarRequest.saveAvatar({
                            id: avatarDialog.value.id,
                            imageUrl: fileUrl
                        });
                    } else {
                        await uploadImageLegacy('avatar', {
                            entityId: avatarDialog.value.id,
                            imageUrl: avatarDialog.value.ref.imageUrl,
                            base64File,
                            blob
                        });
                    }
                })()
            );
            toast.success(t('message.upload.success'));
            // force refresh cover image
            const avatarId = avatarDialog.value.id;
            showAvatarDialog(avatarId, { forceRefresh: true });
        } catch (error) {
            console.error('avatar image upload process failed:', error);
            toast.error(t('message.upload.error'));
        } finally {
            changeAvatarImageLoading.value = false;
            cropDialogOpen.value = false;
        }
    }

    // --- Prompt dialogs ---

    /**
     * @param {object} avatar
     */
    function promptRenameAvatar(avatar) {
        modalStore
            .prompt({
                title: t('prompt.rename_avatar.header'),
                description: t('prompt.rename_avatar.description'),
                confirmText: t('prompt.rename_avatar.ok'),
                cancelText: t('prompt.rename_avatar.cancel'),
                inputValue: avatar.ref.name,
                errorMessage: t('prompt.rename_avatar.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== avatar.ref.name) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            name: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(
                                t('prompt.rename_avatar.message.success')
                            );
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    /**
     * @param {object} avatar
     */
    function promptChangeAvatarDescription(avatar) {
        modalStore
            .prompt({
                title: t('prompt.change_avatar_description.header'),
                description: t('prompt.change_avatar_description.description'),
                confirmText: t('prompt.change_avatar_description.ok'),
                cancelText: t('prompt.change_avatar_description.cancel'),
                inputValue: avatar.ref.description,
                errorMessage: t('prompt.change_avatar_description.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== avatar.ref.description) {
                    avatarRequest
                        .saveAvatar({
                            id: avatar.id,
                            description: value
                        })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(
                                t(
                                    'prompt.change_avatar_description.message.success'
                                )
                            );
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    // --- Internal helper ---

    /**
     * @param {string} id
     */
    function copyAvatarUrl(id) {
        copyToClipboard(`https://vrchat.com/home/avatar/${id}`);
    }

    // --- Command map ---
    // Direct commands: function
    // String commands: delegate to component callback
    // Confirmed commands: { confirm: () => ({title, description, ...}), handler: fn }

    /**
     *
     */
    function buildCommandMap() {
        const D = () => avatarDialog.value;

        return {
            // --- Direct commands ---
            Refresh: () => {
                showAvatarDialog(D().id, { forceRefresh: true });
            },
            Share: () => {
                copyAvatarUrl(D().id);
            },
            Rename: () => {
                promptRenameAvatar(D());
            },
            'Change Image': () => {
                showChangeAvatarImageDialog();
            },
            'Change Description': () => {
                promptChangeAvatarDescription(D());
            },
            'Download Unity Package': () => {
                openExternalLink(replaceVrcPackageUrl(D().ref.unityPackageUrl));
            },
            'Add Favorite': () => {
                showFavoriteDialog('avatar', D().id);
            },

            // --- Delegated to component ---
            'Change Content Tags': 'showSetAvatarTagsDialog',
            'Change Styles and Author Tags': 'showSetAvatarStylesDialog',

            // --- Confirmed commands ---
            'Delete Favorite': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.favorite_tooltip')
                    })
                }),
                handler: (id) => {
                    favoriteRequest.deleteFavorite({ objectId: id });
                }
            },
            'Select Fallback Avatar': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.select_fallback')
                    })
                }),
                handler: (id) => {
                    avatarRequest
                        .selectFallbackAvatar({ avatarId: id })
                        .then((args) => {
                            toast.success(t('message.avatar.fallback_changed'));
                            return args;
                        });
                }
            },
            'Block Avatar': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.block')
                    }),
                    destructive: true
                }),
                handler: (id) => {
                    avatarModerationRequest
                        .sendAvatarModeration({
                            avatarModerationType: 'block',
                            targetAvatarId: id
                        })
                        .then((args) => {
                            // 'AVATAR-MODERATION';
                            applyAvatarModeration(args.json);
                            toast.success(t('message.avatar.blocked'));
                            return args;
                        });
                }
            },
            'Unblock Avatar': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.unblock')
                    })
                }),
                handler: (id) => {
                    avatarModerationRequest
                        .deleteAvatarModeration({
                            avatarModerationType: 'block',
                            targetAvatarId: id
                        })
                        .then((args) => {
                            cachedAvatarModerations.delete(
                                args.params.targetAvatarId
                            );
                            const D = avatarDialog.value;
                            if (
                                args.params.avatarModerationType === 'block' &&
                                D.id === args.params.targetAvatarId
                            ) {
                                D.isBlocked = false;
                            }
                        });
                }
            },
            'Make Public': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.make_public')
                    })
                }),
                handler: (id) => {
                    avatarRequest
                        .saveAvatar({ id, releaseStatus: 'public' })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(t('message.avatar.updated_public'));
                            return args;
                        });
                }
            },
            'Make Private': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.make_private')
                    })
                }),
                handler: (id) => {
                    avatarRequest
                        .saveAvatar({ id, releaseStatus: 'private' })
                        .then((args) => {
                            applyAvatar(args.json);
                            toast.success(t('message.avatar.updated_private'));
                            return args;
                        });
                }
            },
            Delete: {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.delete')
                    }),
                    destructive: true
                }),
                handler: (id) => {
                    avatarRequest
                        .deleteAvatar({ avatarId: id })
                        .then((args) => {
                            const { json } = args;
                            removeAvatarFromCache(json._id);
                            if (userDialog.value.id === json.authorId) {
                                const map = new Map();
                                for (const ref of cachedAvatars.values()) {
                                    if (ref.authorId === json.authorId) {
                                        map.set(ref.id, ref);
                                    }
                                }
                                const array = Array.from(map.values());
                                sortUserDialogAvatars(array);
                            }

                            toast.success(t('message.avatar.deleted'));
                            uiStore.jumpBackDialogCrumb();
                            return args;
                        });
                }
            },
            'Delete Imposter': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.delete_impostor')
                    }),
                    destructive: true
                }),
                handler: (id) => {
                    avatarRequest
                        .deleteImposter({ avatarId: id })
                        .then((args) => {
                            toast.success(t('message.avatar.impostor_deleted'));
                            showAvatarDialog(id);
                            return args;
                        });
                }
            },
            'Create Imposter': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.create_impostor')
                    })
                }),
                handler: (id) => {
                    avatarRequest
                        .createImposter({ avatarId: id })
                        .then((args) => {
                            toast.success(t('message.avatar.impostor_queued'));
                            return args;
                        });
                }
            },
            'Regenerate Imposter': {
                confirm: () => ({
                    title: t('confirm.title'),
                    description: t('confirm.command_question', {
                        command: t('dialog.avatar.actions.regenerate_impostor')
                    }),
                    destructive: true
                }),
                handler: (id) => {
                    avatarRequest
                        .deleteImposter({ avatarId: id })
                        .then((args) => {
                            showAvatarDialog(id);
                            return args;
                        })
                        .finally(() => {
                            avatarRequest
                                .createImposter({ avatarId: id })
                                .then((args) => {
                                    toast.success(
                                        t('message.avatar.impostor_regenerated')
                                    );
                                    return args;
                                });
                        });
                }
            }
        };
    }

    const commandMap = buildCommandMap();

    // Callbacks for string-type commands (delegated to component)
    let componentCallbacks = {};

    /**
     * Register component-level callbacks for string-type commands.
     * @param {object} callbacks
     */
    function registerCallbacks(callbacks) {
        componentCallbacks = callbacks;
    }

    /**
     * Dispatch an avatar dialog command.
     * @param {string} command
     */
    function avatarDialogCommand(command) {
        const D = avatarDialog.value;
        const entry = commandMap[command];

        if (!entry) {
            return;
        }

        // String entry => delegate to component callback
        if (typeof entry === 'string') {
            const cb = componentCallbacks[entry];
            if (cb) {
                cb();
            }
            return;
        }

        // Direct function
        if (typeof entry === 'function') {
            entry();
            return;
        }

        // Confirmed command
        if (entry.confirm) {
            modalStore.confirm(entry.confirm()).then(({ ok }) => {
                if (ok) {
                    entry.handler(D.id);
                }
            });
        }
    }

    return {
        cropDialogOpen,
        cropDialogFile,
        changeAvatarImageLoading,
        avatarDialogCommand,
        onFileChangeAvatarImage,
        onCropConfirmAvatar,
        registerCallbacks
    };
}
