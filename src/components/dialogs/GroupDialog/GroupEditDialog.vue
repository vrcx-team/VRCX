<template>
    <Dialog :open="groupEditDialog.visible" @update:open="handleOpenChange">
        <DialogContent class="x-dialog sm:max-w-180 max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>
                    {{ isEditMode ? t('dialog.group_edit.edit_header') : t('dialog.group_edit.create_header') }}
                </DialogTitle>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2">
                <FieldGroup class="gap-4">
                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.name') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                v-model="groupEditDialog.name"
                                size="sm"
                                :maxlength="64"
                                :disabled="groupEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.short_code') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupField
                                :model-value="groupEditDialog.shortCode"
                                size="sm"
                                :maxlength="6"
                                :disabled="groupEditDialog.loading"
                                @update:model-value="updateShortCode"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.description') }}</FieldLabel>
                        <FieldContent>
                            <InputGroupTextareaField
                                v-model="groupEditDialog.description"
                                :rows="4"
                                :maxlength="250"
                                :disabled="groupEditDialog.loading"
                                show-count />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>{{ t('dialog.group_edit.join_state') }}</FieldLabel>
                        <FieldContent>
                            <Select v-model="groupEditDialog.joinState" :disabled="groupEditDialog.loading">
                                <SelectTrigger size="sm" class="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="option in joinStateOptions"
                                            :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>

                    <template v-if="!isEditMode">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.privacy') }}</FieldLabel>
                            <FieldContent>
                                <Select v-model="groupEditDialog.privacy" :disabled="groupEditDialog.loading">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="public">
                                                {{ t('dialog.group.tags.public') }}
                                            </SelectItem>
                                            <SelectItem value="default">
                                                {{ t('dialog.group.tags.private') }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.role_template') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    v-model="groupEditDialog.roleTemplate"
                                    :disabled="groupEditDialog.loading || groupEditDialog.roleTemplatesLoading">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue
                                            :placeholder="
                                                groupEditDialog.roleTemplatesLoading
                                                    ? t('dialog.group_edit.loading_role_templates')
                                                    : t('dialog.group_edit.role_template')
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                v-for="template in roleTemplateOptions"
                                                :key="template.value"
                                                :value="template.value">
                                                {{ template.label }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    </template>

                    <template v-else>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.language') }}</FieldLabel>
                            <FieldContent>
                                <Select
                                    multiple
                                    :model-value="groupEditDialog.languages"
                                    :disabled="groupEditDialog.loading"
                                    @update:model-value="handleLanguagesChange">
                                    <SelectTrigger size="sm" class="w-full">
                                        <SelectValue>
                                            <span class="truncate">
                                                {{ selectedLanguageSummary || t('dialog.group_edit.no_language') }}
                                            </span>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                v-for="language in languageOptions"
                                                :key="language.value"
                                                :value="language.value">
                                                {{ language.label }}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.rules') }}</FieldLabel>
                            <FieldContent>
                                <InputGroupTextareaField
                                    v-model="groupEditDialog.rules"
                                    :rows="4"
                                    :maxlength="2048"
                                    :disabled="groupEditDialog.loading"
                                    show-count />
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.links') }}</FieldLabel>
                            <FieldContent class="space-y-2">
                                <InputGroupAction
                                    v-for="(link, index) in groupEditDialog.links"
                                    :key="index"
                                    v-model="groupEditDialog.links[index]"
                                    :maxlength="1000"
                                    size="sm"
                                    :disabled="groupEditDialog.loading">
                                    <template #leading>
                                        <img
                                            v-if="link"
                                            :src="getFaviconUrl(link)"
                                            style="width: 16px; height: 16px; vertical-align: middle" />
                                        <div v-else style="width: 16px; height: 16px" />
                                    </template>
                                    <template #actions>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            :disabled="groupEditDialog.loading"
                                            :ariaLabel="t('common.actions.delete')"
                                            @click="groupEditDialog.links.splice(index, 1)">
                                            <Trash2 class="size-4" />
                                        </Button>
                                    </template>
                                </InputGroupAction>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    :disabled="groupEditDialog.loading || groupEditDialog.links.length >= 3"
                                    @click="groupEditDialog.links.push('')">
                                    {{ t('dialog.group_edit.add_link') }}
                                </Button>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel class="sr-only">{{ t('dialog.group_edit.allow_join_prompt') }}</FieldLabel>
                            <FieldContent>
                                <label class="inline-flex items-start gap-2">
                                    <Checkbox
                                        v-model="groupEditDialog.allowGroupJoinPrompt"
                                        :disabled="groupEditDialog.loading || groupEditDialog.joinState !== 'open'" />
                                    <span class="space-y-1">
                                        <span class="block">{{ t('dialog.group_edit.allow_join_prompt') }}</span>
                                        <span class="block text-xs text-muted-foreground">
                                            {{ t('dialog.group_edit.allow_join_prompt_description') }}
                                        </span>
                                    </span>
                                </label>
                            </FieldContent>
                        </Field>
                    </template>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.banner') }}</FieldLabel>
                            <FieldContent class="space-y-2">
                                <img
                                    v-if="groupEditDialog.bannerUrl"
                                    :src="groupEditDialog.bannerUrl"
                                    :alt="t('dialog.group_edit.banner')"
                                    class="h-24 w-full rounded-md object-cover aspect-17/6" />
                                <div class="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        :disabled="groupEditDialog.loading"
                                        @click="showGallerySelectDialog('banner')">
                                        {{ t('dialog.group_edit.select_image') }}
                                    </Button>
                                    <Button
                                        v-if="groupEditDialog.bannerUrl"
                                        variant="outline"
                                        size="sm"
                                        :disabled="groupEditDialog.loading"
                                        @click="clearImage('banner')">
                                        {{ t('dialog.group_edit.clear_image') }}
                                    </Button>
                                </div>
                            </FieldContent>
                        </Field>
                        <Field>
                            <FieldLabel>{{ t('dialog.group_edit.icon') }}</FieldLabel>
                            <FieldContent class="space-y-2">
                                <img
                                    v-if="groupEditDialog.iconUrl"
                                    :src="groupEditDialog.iconUrl"
                                    :alt="t('dialog.group_edit.icon')"
                                    class="h-24 w-24 rounded-md object-cover aspect-square" />
                                <div class="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        :disabled="groupEditDialog.loading"
                                        @click="showGallerySelectDialog('icon')">
                                        {{ t('dialog.group_edit.select_image') }}
                                    </Button>
                                    <Button
                                        v-if="groupEditDialog.iconUrl"
                                        variant="outline"
                                        size="sm"
                                        :disabled="groupEditDialog.loading"
                                        @click="clearImage('icon')">
                                        {{ t('dialog.group_edit.clear_image') }}
                                    </Button>
                                </div>
                            </FieldContent>
                        </Field>
                    </div>
                </FieldGroup>
            </div>

            <DialogFooter class="px-6 py-4">
                <Button variant="secondary" :disabled="groupEditDialog.loading" @click="closeDialog">
                    {{ t('common.actions.cancel') }}
                </Button>
                <Button :disabled="!canSubmit" @click="saveGroup">
                    {{
                        groupEditDialog.loading
                            ? t('dialog.group_edit.saving')
                            : isEditMode
                              ? t('dialog.group_edit.save')
                              : t('dialog.group_edit.create')
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
    import { Trash2 } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { InputGroupAction, InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

    import { groupRequest } from '../../../api';
    import { applyGroup, showGroupDialog } from '../../../coordinators/groupCoordinator';
    import { getFaviconUrl } from '../../../shared/utils';
    import { useGroupStore, useUserStore } from '../../../stores';
    import GallerySelectDialog from './GallerySelectDialog.vue';

    const { t } = useI18n();
    const { groupEditDialog } = storeToRefs(useGroupStore());
    const { subsetOfLanguages } = storeToRefs(useUserStore());

    const galleryImages = {
        banner: { id: 'bannerId', url: 'bannerUrl', isIcon: false },
        icon: { id: 'iconId', url: 'iconUrl', isIcon: true }
    };
    let galleryTarget = 'banner';
    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedImageUrl: '',
        isIconGallerySelectDialog: false
    });

    const isEditMode = computed(() => groupEditDialog.value.mode === 'edit');
    const canSubmit = computed(() => {
        const D = groupEditDialog.value;
        return (
            !D.loading &&
            !D.roleTemplatesLoading &&
            D.name.trim().length >= 3 &&
            /^[A-Z0-9]{3,6}$/.test(D.shortCode) &&
            isJoinState(D.joinState) &&
            (isEditMode.value || (isPrivacy(D.privacy) && isRoleTemplate(D.roleTemplate)))
        );
    });

    const joinStateOptions = computed(() =>
        ['open', 'request', 'invite', 'closed'].map((value) => ({
            value,
            label: t(`dialog.group.tags.${value}`)
        }))
    );

    const roleTemplateOptions = computed(() =>
        groupEditDialog.value.roleTemplates.map((template) => {
            return {
                value: template.value,
                label: template.name
            };
        })
    );

    const languageOptions = computed(() =>
        Object.entries(subsetOfLanguages.value ?? {}).map(([value, label]) => ({
            value,
            label
        }))
    );

    const selectedLanguageSummary = computed(() =>
        groupEditDialog.value.languages.map((language) => subsetOfLanguages.value?.[language] ?? language).join(', ')
    );

    function updateShortCode(value) {
        groupEditDialog.value.shortCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    /**
     * @param {string} value
     * @returns {value is 'open' | 'request' | 'invite' | 'closed'}
     */
    function isJoinState(value) {
        return value === 'open' || value === 'request' || value === 'invite' || value === 'closed';
    }

    /**
     * @param {string} value
     * @returns {value is 'public' | 'default'}
     */
    function isPrivacy(value) {
        return value === 'public' || value === 'default';
    }

    /**
     * @param {string} value
     * @returns {value is 'default' | 'managedFree' | 'managedInvite' | 'managedRequest'}
     */
    function isRoleTemplate(value) {
        return (
            value === 'default' || value === 'managedFree' || value === 'managedInvite' || value === 'managedRequest'
        );
    }

    function handleLanguagesChange(value) {
        groupEditDialog.value.languages = Array.isArray(value) ? value.slice(0, 3) : [];
    }

    function showGallerySelectDialog(target) {
        galleryTarget = target;
        const image = galleryImages[target];
        const group = groupEditDialog.value;

        gallerySelectDialog.value = {
            selectedFileId: group[image.id],
            selectedImageUrl: group[image.url],
            isIconGallerySelectDialog: image.isIcon,
            visible: true
        };
    }

    function setGroupImage(target, { fileId, imageUrl }) {
        const image = galleryImages[target];
        const group = groupEditDialog.value;
        group[image.id] = fileId;
        group[image.url] = imageUrl;
    }

    function handleGalleryImageSelect(image) {
        setGroupImage(galleryTarget, image);
    }

    function clearImage(target) {
        setGroupImage(target, { fileId: '', imageUrl: '' });
    }

    function closeDialog() {
        if (!groupEditDialog.value.loading) {
            groupEditDialog.value.visible = false;
        }
    }

    function handleOpenChange(open) {
        if (!open) {
            closeDialog();
        }
    }

    async function saveGroup() {
        if (!canSubmit.value) {
            return;
        }

        const D = groupEditDialog.value;
        const joinState = D.joinState;
        if (!isJoinState(joinState)) {
            return;
        }
        D.loading = true;
        try {
            const commonParams = {
                name: D.name.trim(),
                shortCode: D.shortCode,
                description: D.description.trim(),
                joinState,
                bannerId: D.bannerId || undefined,
                iconId: D.iconId || undefined
            };
            let args;
            if (isEditMode.value) {
                args = await groupRequest.editGroup({
                    id: D.groupId,
                    ...commonParams,
                    languages: D.languages.slice(0, 3),
                    rules: D.rules.trim(),
                    links: D.links.map((link) => link.trim()).filter(Boolean),
                    allowGroupJoinPrompt: D.allowGroupJoinPrompt
                });
            } else {
                const privacy = D.privacy;
                const roleTemplate = D.roleTemplate;
                if (!isPrivacy(privacy) || !isRoleTemplate(roleTemplate)) {
                    return;
                }
                args = await groupRequest.createGroup({
                    ...commonParams,
                    privacy,
                    roleTemplate
                });
            }

            const group = applyGroup(args.json);
            D.visible = false;
            toast.success(t(isEditMode.value ? 'dialog.group_edit.edit_success' : 'dialog.group_edit.create_success'));
            showGroupDialog(group.id, { forceRefresh: true });
        } catch (error) {
            console.error('Failed to save group:', error);
        } finally {
            D.loading = false;
        }
    }
</script>
