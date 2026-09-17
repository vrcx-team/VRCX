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

                    <template v-if="!groupEventEditDialog.seriesId">
                        <div class="rounded-md border p-4 space-y-4">
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel>{{ t('dialog.group_event_edit.repeat') }}</FieldLabel>
                                    <FieldContent>
                                        <Select
                                            :model-value="repeatFrequencySelection"
                                            :disabled="groupEventEditDialog.loading"
                                            @update:model-value="handleRepeatFrequencyChange">
                                            <SelectTrigger size="sm" class="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" :disabled="!canReturnToNever">
                                                    {{ t('dialog.group_event_edit.repeat_values.none') }}
                                                </SelectItem>
                                                <SelectItem value="weekly">
                                                    {{ t('dialog.group_event_edit.repeat_values.weekly') }}
                                                </SelectItem>
                                                <SelectItem value="monthly">
                                                    {{ t('dialog.group_event_edit.repeat_values.monthly') }}
                                                </SelectItem>
                                                <SelectItem value="yearly">
                                                    {{ t('dialog.group_event_edit.repeat_values.yearly') }}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FieldContent>
                                </Field>
                                <Field v-if="groupEventEditDialog.recurrence">
                                    <FieldLabel>{{ t('dialog.group_event_edit.repeat_every') }}</FieldLabel>
                                    <FieldContent>
                                        <InputGroupField
                                            v-model.number="groupEventEditDialog.recurrence.interval"
                                            type="number"
                                            min="1"
                                            step="1"
                                            size="sm"
                                            :disabled="groupEventEditDialog.loading" />
                                    </FieldContent>
                                </Field>
                            </div>

                            <template v-if="groupEventEditDialog.recurrence">
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field v-if="groupEventEditDialog.recurrence.frequency === 'weekly'">
                                        <FieldLabel>{{ t('dialog.group_event_edit.weekly_pattern') }}</FieldLabel>
                                        <FieldContent>
                                            <Select
                                                :model-value="weeklyPatternSelection"
                                                :disabled="groupEventEditDialog.loading"
                                                @update:model-value="handleWeeklyPatternChange">
                                                <SelectTrigger size="sm" class="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="everyWeek">
                                                        {{
                                                            t(
                                                                'dialog.group_event_edit.weekly_pattern_values.every_week'
                                                            )
                                                        }}
                                                    </SelectItem>
                                                    <SelectItem value="weekdays">
                                                        {{
                                                            t('dialog.group_event_edit.weekly_pattern_values.weekdays')
                                                        }}
                                                    </SelectItem>
                                                    <SelectItem value="weekend">
                                                        {{ t('dialog.group_event_edit.weekly_pattern_values.weekend') }}
                                                    </SelectItem>
                                                    <SelectItem value="custom">
                                                        {{ t('dialog.group_event_edit.weekly_pattern_values.custom') }}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                    <Field
                                        v-if="
                                            groupEventEditDialog.recurrence.frequency === 'weekly' &&
                                            weeklyPatternSelection === 'custom'
                                        ">
                                        <FieldLabel>{{ t('dialog.group_event_edit.custom_days') }}</FieldLabel>
                                        <FieldContent>
                                            <Select
                                                multiple
                                                :model-value="groupEventEditDialog.recurrence.daysOfWeek"
                                                :disabled="groupEventEditDialog.loading"
                                                @update:model-value="handleCustomDaysChange">
                                                <SelectTrigger size="sm" class="w-full">
                                                    <SelectValue>
                                                        <span class="truncate">
                                                            {{
                                                                selectedCustomDaysSummary ||
                                                                t('dialog.group_event_edit.none_selected')
                                                            }}
                                                        </span>
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem
                                                        v-for="day in weekDayOptions"
                                                        :key="day.value"
                                                        :value="day.value">
                                                        {{ day.label }}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                </div>

                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field>
                                        <FieldLabel>{{ t('dialog.group_event_edit.ends') }}</FieldLabel>
                                        <FieldContent>
                                            <Select
                                                v-model="recurrenceEndType"
                                                :disabled="groupEventEditDialog.loading">
                                                <SelectTrigger size="sm" class="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="never">
                                                        {{ t('dialog.group_event_edit.ends_values.never') }}
                                                    </SelectItem>
                                                    <SelectItem value="afterOccurrences">
                                                        {{ t('dialog.group_event_edit.ends_values.after_occurrences') }}
                                                    </SelectItem>
                                                    <SelectItem value="afterDate">
                                                        {{ t('dialog.group_event_edit.ends_values.after_date') }}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FieldContent>
                                    </Field>
                                    <Field v-if="recurrenceEndType === 'afterOccurrences'">
                                        <FieldLabel>{{ t('dialog.group_event_edit.occurrence_count') }}</FieldLabel>
                                        <FieldContent>
                                            <InputGroupField
                                                v-model.number="groupEventEditDialog.recurrence.end.count"
                                                type="number"
                                                min="1"
                                                step="1"
                                                size="sm"
                                                :disabled="groupEventEditDialog.loading" />
                                        </FieldContent>
                                    </Field>

                                    <Field v-if="recurrenceEndType === 'afterDate'">
                                        <FieldLabel>{{ t('dialog.group_event_edit.end_date') }}</FieldLabel>
                                        <FieldContent>
                                            <InputGroupField
                                                v-model="groupEventEditDialog.recurrence.end.date"
                                                type="datetime-local"
                                                size="sm"
                                                :disabled="groupEventEditDialog.loading" />
                                        </FieldContent>
                                    </Field>
                                </div>
                            </template>
                        </div>
                    </template>

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
    import { computed, ref, watch } from 'vue';
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
    const canReturnToNever = ref(true);

    watch(
        () => groupEventEditDialog.value,
        (dialog) => {
            if (dialog.visible) {
                canReturnToNever.value = !dialog.recurrence;
            }
        },
        { immediate: true }
    );

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
    const weekDayOptions = [
        { value: 'MO', label: t('dialog.group_event_edit.weekday_values.MO') },
        { value: 'TU', label: t('dialog.group_event_edit.weekday_values.TU') },
        { value: 'WE', label: t('dialog.group_event_edit.weekday_values.WE') },
        { value: 'TH', label: t('dialog.group_event_edit.weekday_values.TH') },
        { value: 'FR', label: t('dialog.group_event_edit.weekday_values.FR') },
        { value: 'SA', label: t('dialog.group_event_edit.weekday_values.SA') },
        { value: 'SU', label: t('dialog.group_event_edit.weekday_values.SU') }
    ];
    const hasInvalidDateRange = computed(() => {
        const startsAt = Date.parse(groupEventEditDialog.value.startsAt);
        const endsAt = Date.parse(groupEventEditDialog.value.endsAt);
        return Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt;
    });
    const repeatFrequencySelection = computed(() => groupEventEditDialog.value.recurrence?.frequency ?? 'none');
    const recurrenceEndType = computed({
        get: () => groupEventEditDialog.value.recurrence?.end?.type ?? 'never',
        set: (value) => {
            const recurrence = groupEventEditDialog.value.recurrence;
            if (!recurrence) {
                return;
            }
            if (value === 'never') {
                recurrence.end = null;
            } else if (value === 'afterOccurrences') {
                recurrence.end = {
                    type: value,
                    count: recurrence.end?.type === value ? recurrence.end.count : 1
                };
            } else if (value === 'afterDate') {
                recurrence.end = {
                    type: value,
                    date: recurrence.end?.type === value ? recurrence.end.date : ''
                };
            }
        }
    });
    const weeklyPatternSelection = computed(() => {
        const days = groupEventEditDialog.value.recurrence?.daysOfWeek ?? [];
        if (days.length === 5 && ['MO', 'TU', 'WE', 'TH', 'FR'].every((day) => days.includes(day))) {
            return 'weekdays';
        }
        if (days.length === 2 && ['SA', 'SU'].every((day) => days.includes(day))) {
            return 'weekend';
        }
        if (days.length > 0) {
            return 'custom';
        }
        return 'everyWeek';
    });
    const selectedCustomDaysSummary = computed(() =>
        (groupEventEditDialog.value.recurrence?.daysOfWeek ?? [])
            .map((day) => weekDayOptions.find((option) => option.value === day)?.label ?? day)
            .join(', ')
    );
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

    function handleRepeatFrequencyChange(value) {
        if (value === 'none') {
            if (!canReturnToNever.value) {
                return;
            }
            groupEventEditDialog.value.recurrence = null;
            return;
        }
        if (!groupEventEditDialog.value.recurrence) {
            groupEventEditDialog.value.recurrence = {
                interval: 1
            };
        }
        const recurrence = groupEventEditDialog.value.recurrence;
        recurrence.frequency = value;
        if (value !== 'weekly') {
            recurrence.daysOfWeek = [];
        }
    }

    function handleWeeklyPatternChange(value) {
        if (value === 'weekdays') {
            groupEventEditDialog.value.recurrence.daysOfWeek = ['MO', 'TU', 'WE', 'TH', 'FR'];
            return;
        }
        if (value === 'weekend') {
            groupEventEditDialog.value.recurrence.daysOfWeek = ['SA', 'SU'];
            return;
        }
        if (value === 'custom') {
            groupEventEditDialog.value.recurrence.daysOfWeek = ['SA'];
            return;
        }
        groupEventEditDialog.value.recurrence.daysOfWeek = [];
    }

    function handleCustomDaysChange(value) {
        const validDays = weekDayOptions.map((option) => option.value);
        groupEventEditDialog.value.recurrence.daysOfWeek = Array.isArray(value)
            ? value.filter((day) => validDays.includes(day))
            : [];
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
        if (!D.seriesId && D.recurrence) {
            params.occurrenceKind = 'series';
            params.recurrence = {
                frequency: D.recurrence.frequency,
                interval: Number(D.recurrence.interval) || 1,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            if (D.recurrence.frequency === 'weekly' && D.recurrence.daysOfWeek.length) {
                params.recurrence.daysOfWeek = [...D.recurrence.daysOfWeek];
            }
            if (D.recurrence.end?.type === 'afterOccurrences') {
                params.recurrence.end = {
                    type: 'afterOccurrences',
                    count: Number(D.recurrence.end.count) || 1
                };
            } else if (D.recurrence.end?.type === 'afterDate') {
                params.recurrence.end = {
                    type: 'afterDate',
                    date: toLocalDateTime(D.recurrence.end?.date)
                };
            }
        }
        console.log('Saving group event with params:', params);
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
