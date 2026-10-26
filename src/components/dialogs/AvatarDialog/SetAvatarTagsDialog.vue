<template>
    <Dialog
        :open="setAvatarTagsDialog.visible"
        @update:open="
            (open) => {
                if (!open) closeSetAvatarTagsDialog();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-195 gap-1">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.set_avatar_tags.header') }}</DialogTitle>
            </DialogHeader>

            <template v-if="setAvatarTagsDialog.visible">
                <label class="inline-flex items-center gap-2 mt-2">
                    <Checkbox
                        v-model="setAvatarTagsDialog.contentHorror"
                        @update:modelValue="updateSelectedAvatarTags" />
                    <span>{{ t('dialog.set_avatar_tags.content_horror') }}</span>
                </label>
                <label class="inline-flex items-center gap-2">
                    <Checkbox v-model="setAvatarTagsDialog.contentGore" @update:modelValue="updateSelectedAvatarTags" />
                    <span>{{ t('dialog.set_avatar_tags.content_gore') }}</span>
                </label>
                <label class="inline-flex items-center gap-2">
                    <Checkbox
                        v-model="setAvatarTagsDialog.contentViolence"
                        @update:modelValue="updateSelectedAvatarTags" />
                    <span>{{ t('dialog.set_avatar_tags.content_violence') }}</span>
                </label>
                <label class="inline-flex items-center gap-2">
                    <Checkbox
                        v-model="setAvatarTagsDialog.contentAdult"
                        @update:modelValue="updateSelectedAvatarTags" />
                    <span>{{ t('dialog.set_avatar_tags.content_adult') }}</span>
                </label>
                <label class="inline-flex items-center gap-2">
                    <Checkbox v-model="setAvatarTagsDialog.contentSex" @update:modelValue="updateSelectedAvatarTags" />
                    <span>{{ t('dialog.set_avatar_tags.content_sex') }}</span>
                </label>
                <InputGroupTextareaField
                    v-model="setAvatarTagsDialog.selectedTagsCsv"
                    :rows="2"
                    :placeholder="t('dialog.set_avatar_tags.custom_tags_placeholder')"
                    class="mt-2"
                    input-class="resize-none"
                    @input="updateInputAvatarTags" />
                <template
                    v-if="setAvatarTagsDialog.ownAvatars.length === props.setAvatarTagsDialog.selectedAvatarIds.length">
                    <Button size="sm" variant="outline" @click="setAvatarTagsSelectToggle">{{
                        t('dialog.set_avatar_tags.select_none')
                    }}</Button>
                </template>
                <template v-else>
                    <Button size="sm" variant="outline" @click="setAvatarTagsSelectToggle">{{
                        t('dialog.set_avatar_tags.select_all')
                    }}</Button>
                </template>
                <span style="margin-left: 6px"
                    >{{ props.setAvatarTagsDialog.selectedAvatarIds.length }} /
                    {{ setAvatarTagsDialog.ownAvatars.length }}</span
                >
                <Spinner v-if="setAvatarTagsDialog.loading" class="inline-block ml-2" />
                <span v-if="setAvatarTagsDialog.loading && saveProgress" role="status" aria-live="polite">
                    {{
                        saveProgress.refreshing
                            ? t('dialog.set_avatar_tags.refreshing')
                            : t('dialog.set_avatar_tags.save_progress', {
                                  total: saveProgress.toUpdate,
                                  saved: saveProgress.saved,
                                  unchanged: saveProgress.unchanged,
                                  unavailable: saveProgress.unavailable,
                                  remaining:
                                      saveProgress.total -
                                      saveProgress.saved -
                                      saveProgress.unchanged -
                                      saveProgress.unavailable
                              })
                    }}
                </span>
                <div
                    class="flex flex-wrap items-start max-h-[300px] overflow-auto"
                    style="margin-top: 8px; min-height: 60px">
                    <div
                        v-for="avatar in setAvatarTagsDialog.ownAvatars"
                        :key="avatar.id"
                        :class="[
                            'w-[335px]',
                            'box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:rounded-[25px_5px_5px_25px]'
                        ]"
                        @click="showAvatarDialog(avatar.id)">
                        <div class="relative inline-block flex-none size-9 mr-2.5">
                            <img
                                v-if="avatar.thumbnailImageUrl"
                                class="size-full rounded-full object-cover"
                                :src="avatar.thumbnailImageUrl"
                                loading="lazy" />
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]" v-text="avatar.name"></span>
                            <span
                                v-if="avatar.releaseStatus === 'public'"
                                class="block truncate text-xs"
                                v-text="avatar.releaseStatus"></span>
                            <span
                                v-else-if="avatar.releaseStatus === 'private'"
                                class="block truncate text-xs"
                                v-text="avatar.releaseStatus"></span>
                            <span v-else class="block truncate text-xs" v-text="avatar.releaseStatus"></span>
                            <span class="block truncate text-xs" v-text="avatarTagStrings.get(avatar.id)"></span>
                        </div>
                        <Button size="sm" variant="ghost" style="margin-left: 6px" @click.stop>
                            <Checkbox
                                :model-value="props.setAvatarTagsDialog.selectedAvatarIds.includes(avatar.id)"
                                @update:modelValue="(val) => toggleAvatarSelection(avatar.id, val)" />
                        </Button>
                    </div>
                </div>
            </template>

            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="closeSetAvatarTagsDialog">{{
                    t('dialog.set_avatar_tags.cancel')
                }}</Button>
                <Button :disabled="setAvatarTagsDialog.loading" @click="saveSetAvatarTagsDialog">{{
                    t('dialog.set_avatar_tags.save')
                }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { useI18n } from 'vue-i18n';
    import { ref, watch } from 'vue';

    import { avatarRequest } from '../../../api';
    import { arraysMatch, removeFromArray } from '../../../shared/utils';
    import { useModalStore, useUserStore } from '../../../stores';
    import { showAvatarDialog, applyAvatar, preloadOwnAvatars } from '../../../coordinators/avatarCoordinator';

    const modalStore = useModalStore();
    const userStore = useUserStore();

    const { t } = useI18n();
    const props = defineProps({
        setAvatarTagsDialog: {
            type: Object,
            required: true
        }
    });
    const avatarTagStrings = new Map();
    const saveProgress = ref(null);

    const emit = defineEmits(['update:setAvatarTagsDialog']);

    watch(
        () => props.setAvatarTagsDialog.visible,
        (newVal) => {
            if (newVal) {
                saveProgress.value = null;
                updateAvatarTagsString();
                updateSelectedAvatarTags();
                updateInputAvatarTags();
            }
        }
    );

    function closeSetAvatarTagsDialog() {
        emit('update:setAvatarTagsDialog', {
            ...props.setAvatarTagsDialog,
            visible: false
        });
    }

    function updateSelectedAvatarTags() {
        const D = props.setAvatarTagsDialog;
        if (D.contentHorror) {
            if (!D.selectedTags.includes('content_horror')) {
                D.selectedTags.push('content_horror');
            }
        } else if (D.selectedTags.includes('content_horror')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_horror'), 1);
        }
        if (D.contentGore) {
            if (!D.selectedTags.includes('content_gore')) {
                D.selectedTags.push('content_gore');
            }
        } else if (D.selectedTags.includes('content_gore')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_gore'), 1);
        }
        if (D.contentViolence) {
            if (!D.selectedTags.includes('content_violence')) {
                D.selectedTags.push('content_violence');
            }
        } else if (D.selectedTags.includes('content_violence')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_violence'), 1);
        }
        if (D.contentAdult) {
            if (!D.selectedTags.includes('content_adult')) {
                D.selectedTags.push('content_adult');
            }
        } else if (D.selectedTags.includes('content_adult')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_adult'), 1);
        }
        if (D.contentSex) {
            if (!D.selectedTags.includes('content_sex')) {
                D.selectedTags.push('content_sex');
            }
        } else if (D.selectedTags.includes('content_sex')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_sex'), 1);
        }

        D.selectedTagsCsv = D.selectedTags.join(',').replace(/content_/g, '');
    }

    /**
     * @param avatarId
     * @param checked
     */
    function toggleAvatarSelection(avatarId, checked) {
        const D = props.setAvatarTagsDialog;
        const isSelected = D.selectedAvatarIds.includes(avatarId);
        const shouldSelect = typeof checked === 'boolean' ? checked : !isSelected;
        if (shouldSelect && !isSelected) {
            D.selectedAvatarIds.push(avatarId);
        } else if (!shouldSelect && isSelected) {
            removeFromArray(D.selectedAvatarIds, avatarId);
        }
    }

    function updateAvatarTagsString() {
        const D = props.setAvatarTagsDialog;
        for (const ref of D.ownAvatars) {
            if (!ref) {
                continue;
            }
            let tagString = '';
            const contentTags = [];
            ref.tags.forEach((tag) => {
                if (tag.startsWith('content_')) {
                    contentTags.push(tag.substring(8));
                }
            });
            for (let i = 0; i < contentTags.length; ++i) {
                const tag = contentTags[i];
                if (i < contentTags.length - 1) {
                    tagString += `${tag}, `;
                } else {
                    tagString += tag;
                }
            }
            avatarTagStrings.set(ref.id, tagString);
        }
    }

    function setAvatarTagsSelectToggle() {
        const D = props.setAvatarTagsDialog;
        const allSelected = D.ownAvatars.length === D.selectedAvatarIds.length;
        for (const ref of D.ownAvatars) {
            if (!allSelected) {
                if (!D.selectedAvatarIds.includes(ref.id)) {
                    D.selectedAvatarIds.push(ref.id);
                }
            } else {
                removeFromArray(D.selectedAvatarIds, ref.id);
            }
        }
    }

    async function saveSetAvatarTagsDialog() {
        const D = props.setAvatarTagsDialog;
        if (D.loading) {
            return;
        }
        const selectedAvatarIds = [...D.selectedAvatarIds];
        const selectedTags = [...D.selectedTags];
        const userId = userStore.currentUser.id;
        saveProgress.value = {
            saved: 0,
            unchanged: 0,
            unavailable: 0,
            total: selectedAvatarIds.length,
            toUpdate: 0,
            refreshing: true
        };
        const progress = saveProgress.value;
        let error = '';
        D.loading = true;
        try {
            const avatars = await preloadOwnAvatars();
            if (!avatars) {
                throw new Error('Failed to refresh own avatars');
            }
            const updates = [];
            for (const avatarId of selectedAvatarIds) {
                const ref = avatars.get(avatarId);
                if (!ref) {
                    progress.unavailable++;
                    continue;
                }
                const tags = [...selectedTags];
                for (const tag of ref.tags) {
                    if (!tag.startsWith('content_')) {
                        tags.push(tag);
                    }
                }
                if (arraysMatch([...ref.tags].sort(), [...tags].sort())) {
                    progress.unchanged++;
                } else {
                    updates.push({ id: ref.id, tags });
                }
            }
            progress.toUpdate = updates.length;
            progress.refreshing = false;
            for (const params of updates) {
                if (!D.visible || props.setAvatarTagsDialog !== D || userStore.currentUser.id !== userId) {
                    break;
                }
                try {
                    const args = await avatarRequest.saveAvatar(params);
                    applyAvatar(args.json);
                    progress.saved++;
                } catch (err) {
                    if (err.status !== 404) {
                        throw err;
                    }
                    progress.unavailable++;
                }
            }
        } catch (err) {
            console.error(err);
            error = t('dialog.set_avatar_tags.save_error');
        } finally {
            D.loading = false;
            D.visible = false;
            modalStore.alert({
                title: t('dialog.set_avatar_tags.header'),
                dismissible: false,
                description: [
                    error,
                    t('dialog.set_avatar_tags.save_result', {
                        saved: progress.saved,
                        unchanged: progress.unchanged,
                        unavailable: progress.unavailable,
                        remaining: progress.total - progress.saved - progress.unchanged - progress.unavailable
                    })
                ]
                    .filter(Boolean)
                    .join(' ')
            });
        }
    }

    function updateInputAvatarTags() {
        const D = props.setAvatarTagsDialog;
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const tags = D.selectedTagsCsv.split(',');
        D.selectedTags = [];
        for (const tag of tags) {
            switch (tag) {
                case 'horror':
                    D.contentHorror = true;
                    break;
                case 'gore':
                    D.contentGore = true;
                    break;
                case 'violence':
                    D.contentViolence = true;
                    break;
                case 'adult':
                    D.contentAdult = true;
                    break;
                case 'sex':
                    D.contentSex = true;
                    break;
            }
            if (tag && !D.selectedTags.includes(`content_${tag}`)) {
                D.selectedTags.push(`content_${tag}`);
            }
        }
    }
</script>
