<template>
    <Dialog :open="groupEventEditDialog.visible" @update:open="handleOpenChange">
        <DialogContent class="x-dialog sm:max-w-180 max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>
                    {{
                        isEditMode
                            ? t('dialog.group_event_edit.edit_header')
                            : t('dialog.group_event_edit.create_header')
                    }}
                </DialogTitle>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2">
                <FieldGroup class="gap-4">
                    <Field>
                        <FieldLabel>{{ t('dialog.group_event_edit.title') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="groupEventEditDialog.title"
                                size="sm"
                                :maxlength="64"
                                :disabled="groupEventEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_event_edit.description') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupTextareaField
                                v-model="groupEventEditDialog.description"
                                :rows="4"
                                :maxlength="1024"
                                :disabled="groupEventEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.starts_at') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model="startsAtLocal"
                                    type="datetime-local"
                                    size="sm"
                                    :disabled="groupEventEditDialog.loading" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.ends_at') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model="endsAtLocal"
                                    type="datetime-local"
                                    size="sm"
                                    :disabled="groupEventEditDialog.loading" />
                                <p v-if="hasInvalidDateRange" class="mt-1 text-xs text-destructive">
                                    {{ t('dialog.group_event_edit.invalid_date_range') }}
                                </p>
                            </FieldContent>
                        </Field>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.access_type') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    v-model="groupEventEditDialog.accessType"
                                    :disabled="
                                        groupEventEditDialog.loading ||
                                        groupEventEditDialog.groupRef.privacy === 'private'
                                    ">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="group">
                                            {{ t('dialog.group_event_edit.access_group') }}
                                        </SelectItem>
                                        <SelectItem value="public">
                                            {{ t('dialog.group_event_edit.access_public') }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.category') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    v-model="groupEventEditDialog.category"
                                    :disabled="groupEventEditDialog.loading">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="category in categoryOptions"
                                            :key="category"
                                            :value="category">
                                            {{ t(`dialog.group_event_edit.categories.${category}`) }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_event_edit.tags') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField v-model="tagsText" size="sm" :disabled="groupEventEditDialog.loading" />
                            <p class="mt-1 text-xs text-muted-foreground">
                                {{ t('dialog.group_event_edit.tags_help') }}
                            </p>
                        </FieldContent>
                    </Field>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.languages') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    multiple
                                    :model-value="groupEventEditDialog.languages"
                                    :disabled="groupEventEditDialog.loading"
                                    @update:model-value="handleLanguagesChange">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue>
                                            <span class="truncate">
                                                {{
                                                    selectedLanguageSummary ||
                                                    t('dialog.group_event_edit.none_selected')
                                                }}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="language in languageOptions"
                                            :key="language.value"
                                            :value="language.value">
                                            {{ language.label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.platforms') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    multiple
                                    :model-value="groupEventEditDialog.platforms"
                                    :disabled="groupEventEditDialog.loading"
                                    @update:model-value="handlePlatformsChange">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue>
                                            <span class="truncate">
                                                {{
                                                    selectedPlatformSummary ||
                                                    t('dialog.group_event_edit.none_selected')
                                                }}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="platform in platformOptions"
                                            :key="platform"
                                            :value="platform">
                                            {{ t(`dialog.group_event_edit.platform_values.${platform}`) }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_event_edit.roles') }}</FieldLabel>
                        <FieldContent>
                            <Select
                                multiple
                                :model-value="groupEventEditDialog.roleIds"
                                :disabled="groupEventEditDialog.loading"
                                @update:model-value="handleRoleIdsChange">
                                <SelectTrigger size="sm" class="w-full">
                                    <SelectValue>
                                        <span class="truncate">
                                            {{ selectedRoleSummary || t('dialog.group_event_edit.all_members') }}
                                        </span>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        v-for="role in groupEventEditDialog.groupRef?.roles ?? []"
                                        :key="role.id"
                                        :value="role.id">
                                        {{ role.name }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_event_edit.image') }}</FieldLabel>
                        <FieldContent>
                            <div class="flex items-start gap-2">
                                <img
                                    v-if="groupEventEditDialog.imageUrl"
                                    :src="groupEventEditDialog.imageUrl"
                                    class="size-20 rounded-md object-cover"
                                    loading="lazy" />
                                <div class="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        :disabled="groupEventEditDialog.loading"
                                        @click="showGallerySelectDialog">
                                        {{ t('dialog.group_event_edit.select_image') }}
                                    </Button>
                                    <Button
                                        v-if="groupEventEditDialog.imageUrl"
                                        size="sm"
                                        variant="destructive"
                                        :disabled="groupEventEditDialog.loading"
                                        @click="clearImage">
                                        {{ t('dialog.group_event_edit.clear_image') }}
                                    </Button>
                                </div>
                            </div>
                        </FieldContent>
                    </Field>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.host_early_join') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model.number="groupEventEditDialog.hostEarlyJoinMinutes"
                                    type="number"
                                    min="0"
                                    max="60"
                                    step="1"
                                    size="sm"
                                    :disabled="groupEventEditDialog.loading || isEditMode" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.guest_early_join') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model.number="groupEventEditDialog.guestEarlyJoinMinutes"
                                    type="number"
                                    min="0"
                                    max="60"
                                    step="1"
                                    size="sm"
                                    :disabled="groupEventEditDialog.loading || isEditMode" />
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_event_edit.close_after_end') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupField
                                    v-model.number="groupEventEditDialog.closeInstanceAfterEndMinutes"
                                    type="number"
                                    min="0"
                                    max="60"
                                    step="1"
                                    size="sm"
                                    :disabled="groupEventEditDialog.loading || isEditMode" />
                            </FieldContent>
                        </Field>
                    </div>

                    <div class="flex items-center gap-2">
                        <label v-if="!isEditMode" class="inline-flex items-center gap-2">
                            <Checkbox
                                v-model="groupEventEditDialog.sendCreationNotification"
                                :disabled="groupEventEditDialog.loading" />
                            <span>{{ t('dialog.group_event_edit.send_notification') }}</span>
                        </label>
                    </div>
                </FieldGroup>
            </div>

            <DialogFooter class="px-6 py-4">
                <div v-if="isEditMode" class="mr-auto flex gap-2">
                    <Button variant="destructive" :disabled="groupEventEditDialog.loading" @click="deleteEvent">
                        <Trash2 />
                        {{ t('common.actions.delete') }}
                    </Button>
                    <Button
                        v-if="groupEventEditDialog.seriesId"
                        variant="outline"
                        :disabled="groupEventEditDialog.loading"
                        @click="editParentEvent">
                        <Repeat />
                        {{ t('dialog.group_event_edit.edit_parent') }}
                    </Button>
                </div>
                <Button variant="secondary" :disabled="groupEventEditDialog.loading" @click="closeDialog">
                    {{ t('common.actions.cancel') }}
                </Button>
                <Button :disabled="!canSubmit" @click="saveEvent">
                    {{
                        groupEventEditDialog.loading
                            ? t('dialog.group_event_edit.saving')
                            : isEditMode
                              ? t('dialog.group_event_edit.save')
                              : t('dialog.group_event_edit.create')
                    }}
                </Button>
            </DialogFooter>

            <GallerySelectDialog
                :gallery-select-dialog="gallerySelectDialog"
                @select-image="handleGalleryImageSelect" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Repeat, Trash2 } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

    import { groupRequest, queryRequest } from '../../../api';
    import { useGroupStore, useModalStore, useUserStore } from '../../../stores';
    import GallerySelectDialog from './GallerySelectDialog.vue';

    const categoryOptions = [
        'arts',
        'avatars',
        'dance',
        'education',
        'exploration',
        'film_media',
        'gaming',
        'hangout',
        'music',
        'other',
        'performance',
        'roleplaying',
        'wellness'
    ];
    const platformOptions = ['android', 'ios', 'standalonewindows'];

    const { t } = useI18n();
    const groupStore = useGroupStore();
    const { groupEventEditDialog } = storeToRefs(groupStore);
    const { subsetOfLanguages } = storeToRefs(useUserStore());
    const modalStore = useModalStore();

    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedImageUrl: '',
        isIconGallerySelectDialog: false
    });

    const isEditMode = computed(() => groupEventEditDialog.value.mode === 'edit');
    const startsAtLocal = computed({
        get: () => toLocalDateTime(groupEventEditDialog.value.startsAt),
        set: (value) => {
            groupEventEditDialog.value.startsAt = toIsoDateTime(value);
        }
    });
    const endsAtLocal = computed({
        get: () => toLocalDateTime(groupEventEditDialog.value.endsAt),
        set: (value) => {
            groupEventEditDialog.value.endsAt = toIsoDateTime(value);
        }
    });
    const tagsText = computed({
        get: () => groupEventEditDialog.value.tags.join(', '),
        set: (value) => {
            groupEventEditDialog.value.tags = value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .slice(0, 5);
        }
    });
    const languageOptions = computed(() =>
        Object.entries(subsetOfLanguages.value ?? {}).map(([value, label]) => ({
            value,
            label
        }))
    );
    const selectedLanguageSummary = computed(() =>
        groupEventEditDialog.value.languages
            .map((language) => subsetOfLanguages.value?.[language] ?? language)
            .join(', ')
    );
    const selectedPlatformSummary = computed(() =>
        groupEventEditDialog.value.platforms
            .map((platform) => t(`dialog.group_event_edit.platform_values.${platform}`))
            .join(', ')
    );
    const selectedRoleSummary = computed(() => {
        const roles = groupEventEditDialog.value.groupRef?.roles ?? [];
        return groupEventEditDialog.value.roleIds
            .map((roleId) => roles.find((role) => role.id === roleId)?.name ?? roleId)
            .join(', ');
    });
    const hasInvalidDateRange = computed(() => {
        const startsAt = Date.parse(groupEventEditDialog.value.startsAt);
        const endsAt = Date.parse(groupEventEditDialog.value.endsAt);
        return Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt;
    });
    const canSubmit = computed(() => {
        const D = groupEventEditDialog.value;
        return (
            !D.loading &&
            D.title.trim().length >= 1 &&
            D.description.trim().length >= 1 &&
            Number.isFinite(Date.parse(D.startsAt)) &&
            Number.isFinite(Date.parse(D.endsAt)) &&
            !hasInvalidDateRange.value &&
            [D.hostEarlyJoinMinutes, D.guestEarlyJoinMinutes, D.closeInstanceAfterEndMinutes].every(
                (value) => Number.isInteger(Number(value)) && Number(value) >= 0
            )
        );
    });

    function toLocalDateTime(value) {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) {
            return '';
        }
        const offset = date.getTimezoneOffset() * 60_000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    function toIsoDateTime(value) {
        if (!value) {
            return '';
        }
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date.toISOString() : '';
    }

    function handleLanguagesChange(value) {
        groupEventEditDialog.value.languages = Array.isArray(value) ? value.slice(0, 3) : [];
    }

    function handlePlatformsChange(value) {
        groupEventEditDialog.value.platforms = Array.isArray(value)
            ? value.filter((platform) => platformOptions.includes(platform))
            : [];
    }

    function handleRoleIdsChange(value) {
        groupEventEditDialog.value.roleIds = Array.isArray(value) ? value : [];
    }

    function showGallerySelectDialog() {
        const D = groupEventEditDialog.value;
        gallerySelectDialog.value = {
            visible: true,
            selectedFileId: D.imageId,
            selectedImageUrl: D.imageUrl,
            isIconGallerySelectDialog: false
        };
    }

    function handleGalleryImageSelect(image) {
        groupEventEditDialog.value.imageId = image.fileId;
        groupEventEditDialog.value.imageUrl = image.imageUrl;
    }

    function clearImage() {
        groupEventEditDialog.value.imageId = null;
        groupEventEditDialog.value.imageUrl = null;
    }

    function closeDialog() {
        if (!groupEventEditDialog.value.loading) {
            groupEventEditDialog.value.visible = false;
        }
    }

    function handleOpenChange(open) {
        if (!open) {
            closeDialog();
        }
    }

    async function editParentEvent() {
        const D = groupEventEditDialog.value;
        if (!isEditMode.value || !D.seriesId || D.loading) {
            return;
        }

        const groupRef = D.groupRef;
        D.loading = true;
        let args;
        try {
            args = await queryRequest.fetch('groupCalendarEvent', {
                groupId: D.groupId,
                eventId: D.seriesId
            });
        } catch (error) {
            D.loading = false;
            console.error('Failed to load parent group event for editing:', error);
            toast.error(t('dialog.group_event_edit.load_error'));
            return;
        }

        groupStore.showEditGroupEventDialog(args.json, groupRef);
    }

    async function saveEvent() {
        if (!canSubmit.value) {
            return;
        }
        const D = groupEventEditDialog.value;
        D.loading = true;
        const params = {
            // parentId: null,
            startsAt: D.startsAt,
            endsAt: D.endsAt,
            title: D.title.trim(),
            accessType: D.accessType,
            description: D.description.trim(),
            category: D.category,
            tags: D.tags.map((tag) => tag.trim()),
            imageId: D.imageId || null,
            roleIds: [...D.roleIds],
            platforms: [...D.platforms],
            languages: D.languages.slice(0, 3),
            sendCreationNotification: D.sendCreationNotification,
            hostEarlyJoinMinutes: Number(D.hostEarlyJoinMinutes),
            guestEarlyJoinMinutes: Number(D.guestEarlyJoinMinutes),
            closeInstanceAfterEndMinutes: Number(D.closeInstanceAfterEndMinutes),
            groupId: D.groupId
        };
        try {
            if (isEditMode.value) {
                await groupRequest.editGroupEvent({ ...params, eventId: D.eventId });
            } else {
                await groupRequest.createGroupEvent(params);
            }
            D.visible = false;
            groupStore.markGroupEventMutation();
            toast.success(
                t(isEditMode.value ? 'dialog.group_event_edit.edit_success' : 'dialog.group_event_edit.create_success')
            );
        } catch (error) {
            console.error('Failed to save group event:', error);
            toast.error(t('dialog.group_event_edit.save_error'));
        } finally {
            D.loading = false;
        }
    }

    async function deleteEvent() {
        if (!isEditMode.value || groupEventEditDialog.value.loading) {
            return;
        }
        const { ok } = await modalStore.confirm({
            title: t('confirm.title'),
            description: t('dialog.group_event_edit.delete_confirm'),
            destructive: true
        });
        if (!ok) {
            return;
        }

        const D = groupEventEditDialog.value;
        D.loading = true;
        try {
            await groupRequest.deleteGroupEvent({
                groupId: D.groupId,
                eventId: D.eventId
            });
            D.visible = false;
            groupStore.markGroupEventMutation();
            toast.success(t('dialog.group_event_edit.delete_success'));
        } catch (error) {
            console.error('Failed to delete group event:', error);
            toast.error(t('dialog.group_event_edit.delete_error'));
        } finally {
            D.loading = false;
        }
    }
</script>
