<template>
    <Dialog v-model:open="editProfileDialog.visible">
        <DialogContent class="x-dialog sm:max-w-150 max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>{{ t('dialog.user.actions.edit_profile') }}</DialogTitle>
            </DialogHeader>

            <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-2 space-y-6">
                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.social_status.header') }}</h3>

                    <div class="flex items-center gap-2 min-w-0">
                        <Select
                            :model-value="editProfileDialog.status"
                            :disabled="editProfileDialog.loading"
                            @update:modelValue="handleSocialStatusChange">
                            <SelectTrigger size="sm" class="w-42 shrink-0">
                                <SelectValue>
                                    <template v-if="selectedStatusOption">
                                        <span class="inline-flex items-center gap-2">
                                            <i class="x-user-status" :class="selectedStatusOption.statusClass"></i>
                                            <span>{{ selectedStatusOption.label }}</span>
                                        </span>
                                    </template>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="option in statusOptions"
                                        :key="option.value"
                                        :value="option.value"
                                        :text-value="option.label">
                                        <div class="flex items-center gap-2">
                                            <i class="x-user-status" :class="option.statusClass"></i>
                                            <span>{{ option.label }}</span>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <InputGroupField
                            class="min-w-0 flex-1"
                            v-model="editProfileDialog.statusDescription"
                            :placeholder="t('dialog.social_status.status_placeholder')"
                            :maxlength="32"
                            clearable>
                        </InputGroupField>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <InputGroupButton variant="outline" size="icon-lg">
                                    <History class="text-lg" />
                                </InputGroupButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem v-if="!historyItems.length" disabled>
                                    {{ t('dialog.social_status.history') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    v-for="item in historyItems"
                                    :key="item.no ?? item.status"
                                    @click="setSocialStatusFromHistory(item)">
                                    {{ item.status }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div v-if="presets.length" class="space-y-2">
                        <span class="text-xs text-muted-foreground block">
                            {{ t('dialog.social_status.presets') }}
                        </span>
                        <div class="flex flex-wrap gap-1.5">
                            <div
                                v-for="(preset, index) in presets"
                                :key="index"
                                class="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border bg-background text-xs cursor-pointer hover:bg-accent transition-colors max-w-50"
                                @click="applyPreset(preset)">
                                <i class="x-user-status flex-none" :class="getStatusClass(preset.status)"></i>
                                <span class="truncate">{{
                                    preset.statusDescription || getStatusLabel(preset.status)
                                }}</span>
                                <button
                                    class="flex-none size-4 inline-flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity cursor-pointer"
                                    @click.stop="handleDeletePreset(index)">
                                    <X class="size-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" :disabled="editProfileDialog.loading" @click="handleSavePreset">
                        <Bookmark class="size-4" />
                        {{ t('dialog.social_status.save_preset') }}
                    </Button>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.language.header') }}</h3>

                    <div class="my-2" v-for="item in currentLanguages" :key="item.key">
                        <Badge class="mr-1.5" variant="outline">
                            <span
                                class="flags mr-1.5"
                                :class="languageClass(item.key)"
                                style="display: inline-block"></span>
                            {{ item.value }} ({{ item.key.toUpperCase() }})
                            <button
                                class="ml-2 p-0"
                                type="button"
                                style="
                                    border: none;
                                    background: transparent;
                                    display: inline-flex;
                                    align-items: center;
                                    color: inherit;
                                    cursor: pointer;
                                "
                                @click="removeUserLanguage(item.key)">
                                <X class="h-3 w-3" />
                            </button>
                        </Badge>
                    </div>

                    <Select
                        :model-value="selectedLanguageToAdd"
                        :disabled="editProfileDialog.loading || currentLanguages.length === 3"
                        @update:modelValue="handleAddUserLanguage">
                        <SelectTrigger size="sm">
                            <SelectValue :placeholder="t('dialog.language.select_language')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="item in availableLanguages"
                                    :key="item.key"
                                    :value="item.key"
                                    :text-value="item.value">
                                    <span
                                        class="flags mr-1.5"
                                        :class="languageClass(item.key)"
                                        style="display: inline-block"></span>
                                    {{ item.value }} ({{ item.key.toUpperCase() }})
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.pronouns.header') }}</h3>
                    <InputGroupTextareaField
                        v-model="editProfileDialog.pronouns"
                        :maxlength="32"
                        :rows="2"
                        :placeholder="t('dialog.pronouns.pronouns_placeholder')"
                        show-count />
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.bio.header') }}</h3>

                    <InputGroupTextareaField
                        v-model="editProfileDialog.bio"
                        :maxlength="512"
                        :rows="5"
                        :placeholder="t('dialog.bio.bio_placeholder')"
                        show-count
                        autosize />

                    <InputGroupAction
                        v-for="(link, index) in editProfileDialog.bioLinks"
                        :key="index"
                        v-model="editProfileDialog.bioLinks[index]"
                        :maxlength="1000"
                        size="sm">
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
                                @click="editProfileDialog.bioLinks.splice(index, 1)"
                                :ariaLabel="t('common.actions.delete')">
                                <Trash2 class="size-4" />
                            </Button>
                        </template>
                    </InputGroupAction>

                    <Button
                        variant="outline"
                        :disabled="editProfileDialog.bioLinks.length >= 3 || editProfileDialog.loading"
                        size="sm"
                        @click="editProfileDialog.bioLinks.push('')">
                        {{ t('dialog.bio.add_link') }}
                    </Button>
                </section>
            </div>

            <DialogFooter class="px-6 py-4">
                <Button
                    variant="outline"
                    :disabled="editProfileDialog.loading"
                    @click="editProfileDialog.visible = false">
                    {{ t('dialog.user.note_memo.cancel') }}
                </Button>
                <Button :disabled="editProfileDialog.loading" @click="saveProfile">
                    {{ t('dialog.bio.update') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { Bookmark, History, Trash2, X } from 'lucide-vue-next';

    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import {
        InputGroupAction,
        InputGroupButton,
        InputGroupField,
        InputGroupTextareaField
    } from '@/components/ui/input-group';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';

    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import { Badge } from '../../ui/badge';

    import { userRequest } from '../../../api';
    import { languageClass, getFaviconUrl, arraysMatch } from '../../../shared/utils';
    import { useUserStore, useAuthStore } from '../../../stores';
    import { useStatusPresets } from './composables/useStatusPresets';

    const { t } = useI18n();
    const { currentUser } = storeToRefs(useUserStore());
    const authStore = useAuthStore();

    const props = defineProps({
        editProfileDialog: {
            type: Object,
            required: true
        }
    });

    const selectedLanguageToAdd = ref('');
    const { presets, addPreset, removePreset, getStatusClass, MAX_PRESETS } = useStatusPresets();

    const currentLanguages = computed(() => currentUser.value?.$languages ?? []);
    const availableLanguages = computed(() => {
        const options = authStore.cachedConfig?.['constants']?.['LANGUAGE']?.['SPOKEN_LANGUAGE_OPTIONS'] ?? {};
        return Object.entries(options).map(([key, value]) => ({ key, value }));
    });
    const historyItems = computed(() => props.editProfileDialog.socialStatusHistoryTable ?? []);

    const statusOptions = computed(() => {
        const options = [
            {
                value: 'join me',
                statusClass: 'joinme',
                label: t('dialog.user.status.join_me')
            },
            {
                value: 'active',
                statusClass: 'online',
                label: t('dialog.user.status.online')
            },
            {
                value: 'ask me',
                statusClass: 'askme',
                label: t('dialog.user.status.ask_me')
            },
            {
                value: 'busy',
                statusClass: 'busy',
                label: t('dialog.user.status.busy')
            }
        ];
        if (currentUser.value?.$isModerator) {
            options.push({
                value: 'offline',
                statusClass: 'offline',
                label: t('dialog.user.status.offline')
            });
        }
        return options;
    });

    const selectedStatusOption = computed(() =>
        statusOptions.value.find((option) => option.value === props.editProfileDialog.status)
    );

    function getStatusLabel(status) {
        const option = statusOptions.value.find((item) => item.value === status);
        return option?.label || status;
    }

    function applyPreset(preset) {
        props.editProfileDialog.status = preset.status;
        props.editProfileDialog.statusDescription = preset.statusDescription;
    }

    async function handleSavePreset() {
        const D = props.editProfileDialog;
        const result = await addPreset(D.status, D.statusDescription);
        if (result === 'ok') {
            toast.success(t('dialog.social_status.preset_saved'));
        } else if (result === 'exists') {
            toast.info(t('dialog.social_status.preset_exists'));
        } else if (result === 'limit') {
            toast.warning(t('dialog.social_status.preset_limit', { max: MAX_PRESETS }));
        }
    }

    async function handleDeletePreset(index) {
        await removePreset(index);
    }

    function handleSocialStatusChange(value) {
        props.editProfileDialog.status = String(value);
    }

    function setSocialStatusFromHistory(val) {
        if (val === null) {
            return;
        }
        props.editProfileDialog.statusDescription = val.status;
    }

    function handleAddUserLanguage(language) {
        addUserLanguage(language);
        selectedLanguageToAdd.value = '';
    }

    function removeUserLanguage(language) {
        if (language !== String(language)) {
            return;
        }
        const D = props.editProfileDialog;
        D.loading = true;
        userRequest
            .removeUserTags({
                tags: [`language_${language}`]
            })
            .finally(() => {
                D.loading = false;
            });
    }

    function addUserLanguage(language) {
        if (language !== String(language)) {
            return;
        }
        const D = props.editProfileDialog;
        D.loading = true;
        userRequest
            .addUserTags({
                tags: [`language_${language}`]
            })
            .finally(() => {
                D.loading = false;
            });
    }

    function saveProfile() {
        const D = props.editProfileDialog;
        if (D.loading) {
            return;
        }

        const payload = {};
        if (D.status !== currentUser.value.status) {
            payload.status = D.status;
        }
        if (D.statusDescription !== currentUser.value.statusDescription) {
            payload.statusDescription = D.statusDescription;
        }
        if (D.pronouns !== currentUser.value.pronouns) {
            payload.pronouns = D.pronouns;
        }
        if (D.bio !== currentUser.value.bio) {
            payload.bio = D.bio;
        }
        if (!arraysMatch(D.bioLinks, currentUser.value.bioLinks)) {
            payload.bioLinks = D.bioLinks;
        }
        if (!Object.keys(payload).length) {
            D.visible = false;
            return;
        }

        D.loading = true;
        userRequest
            .saveCurrentUser(payload)
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                toast.success('Profile updated');
                return args;
            });
    }
</script>
