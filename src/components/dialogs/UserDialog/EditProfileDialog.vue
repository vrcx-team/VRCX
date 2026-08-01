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
                    <h3 class="text-sm font-semibold">{{ t('dialog.edit_profile.icon') }}</h3>

                    <div class="flex items-center gap-2">
                        <img
                            :src="editProfileDialog.userIcon || currentUser.currentAvatarThumbnailImageUrl"
                            class="inline-block h-16 aspect-square rounded-md object-cover"
                            :alt="t('dialog.edit_profile.icon')"
                            loading="lazy" />
                        <Button
                            v-if="editProfileDialog.userIcon"
                            size="sm"
                            variant="outline"
                            :disabled="editProfileDialog.loading"
                            @click="clearUserIcon"
                            :ariaLabel="t('common.actions.delete')">
                            <X class="size-4" />
                        </Button>
                        <Button size="sm" variant="outline" @click="showIconSelectDialog">
                            {{ t('dialog.invite_message.select_image') }}
                        </Button>
                    </div>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.edit_profile.banner') }}</h3>

                    <Select
                        :model-value="selectedBannerType"
                        :disabled="editProfileDialog.loading"
                        @update:modelValue="handleBannerTypeChange">
                        <SelectTrigger size="sm" class="w-42">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="option in bannerTypeOptions"
                                    :key="option.value"
                                    :value="option.value"
                                    :text-value="option.label">
                                    {{ option.label }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div v-if="selectedBannerType === 'color'" class="flex items-center gap-1">
                        <input
                            type="color"
                            class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                            :value="bannerColorValue"
                            :disabled="editProfileDialog.loading"
                            @input="handleBannerColorInput" />
                        <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                            {{ bannerColorValue }}
                        </span>
                    </div>
                    <div v-else-if="selectedBannerType === 'avatarBanner'">
                        <img
                            :src="currentUser.currentAvatarThumbnailImageUrl"
                            class="inline-block h-16 aspect-17/6 rounded-md object-cover"
                            :alt="t('dialog.edit_profile.banner_type_avatar_banner')" />
                    </div>
                    <div v-else-if="selectedBannerType === 'customImage'">
                        <div class="flex items-center gap-2 mt-2">
                            <img
                                v-if="props.editProfileDialog.bannerUrl"
                                :src="props.editProfileDialog.bannerUrl"
                                class="inline-block h-16 aspect-17/6 rounded-md object-cover"
                                :alt="t('dialog.edit_profile.banner_type_custom_image')" />
                            <Button size="sm" variant="outline" @click="showGallerySelectDialog">
                                {{ t('dialog.invite_message.select_image') }}
                            </Button>
                        </div>
                    </div>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.pronouns.header') }}</h3>
                    <InputGroupTextareaField
                        v-model="editProfileDialog.pronouns"
                        :maxlength="32"
                        :rows="1"
                        input-class="min-h-0 py-2"
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
                    <h3 class="text-sm font-semibold">{{ t('dialog.edit_profile.profile_theme') }}</h3>
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="editProfileDialog.themeId"
                            :disabled="editProfileDialog.loading"
                            @update:modelValue="handleThemeChange">
                            <SelectTrigger size="sm" class="w-42">
                                <SelectValue :placeholder="t('dialog.edit_profile.theme_name_placeholder')">
                                    {{ editProfileDialog.themeName }}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="option in editProfileDialog.themes"
                                        :key="option.id"
                                        :value="option.id"
                                        :text-value="option.name">
                                        <div class="flex w-full items-center justify-between gap-3">
                                            <span class="inline-flex shrink-0 items-center gap-1">
                                                <span
                                                    class="size-3 rounded-sm border"
                                                    :style="{ backgroundColor: getThemeHexColor(option.buttonColor) }"
                                                    title="Button color"></span>
                                                <span
                                                    class="size-3 rounded-sm border"
                                                    :style="{ backgroundColor: getThemeHexColor(option.iconColor) }"
                                                    title="Icon color"></span>
                                                <span
                                                    class="size-3 rounded-sm border"
                                                    :style="{ backgroundColor: getThemeHexColor(option.subtextColor) }"
                                                    title="Subtext color"></span>
                                            </span>
                                            <span class="truncate">{{ option.name }}</span>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Button
                            size="sm"
                            variant="outline"
                            :disabled="editProfileDialog.loading"
                            @click="handleCreateNewTheme">
                            {{ t('dialog.edit_profile.create_theme') }}
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            :disabled="editProfileDialog.loading || !editProfileDialog.themeId"
                            @click="deleteTheme">
                            {{ t('dialog.edit_profile.delete_theme') }}
                        </Button>
                    </div>

                    <InputGroupField
                        class="min-w-0 flex-1 mb-1"
                        v-model="editProfileDialog.themeName"
                        @input="handleThemeInput"
                        :maxlength="12"
                        :placeholder="t('dialog.edit_profile.theme_name_placeholder')">
                    </InputGroupField>
                    <div class="grid gap-2 sm:grid-cols-3">
                        <label class="space-y-1">
                            <span class="text-xs text-muted-foreground">Button</span>
                            <div class="flex items-center gap-1">
                                <input
                                    type="color"
                                    class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                                    :value="themeButtonColorValue"
                                    :disabled="editProfileDialog.loading"
                                    @input="handleThemeButtonColorInput" />
                                <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                                    {{ themeButtonColorValue }}
                                </span>
                            </div>
                        </label>

                        <label class="space-y-1">
                            <span class="text-xs text-muted-foreground">Icon</span>
                            <div class="flex items-center gap-1">
                                <input
                                    type="color"
                                    class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                                    :value="themeIconColorValue"
                                    :disabled="editProfileDialog.loading"
                                    @input="handleThemeIconColorInput" />
                                <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                                    {{ themeIconColorValue }}
                                </span>
                            </div>
                        </label>

                        <label class="space-y-1">
                            <span class="text-xs text-muted-foreground">Subtext</span>
                            <div class="flex items-center gap-1">
                                <input
                                    type="color"
                                    class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                                    :value="themeSubtextColorValue"
                                    :disabled="editProfileDialog.loading"
                                    @input="handleThemeSubtextColorInput" />
                                <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                                    {{ themeSubtextColorValue }}
                                </span>
                            </div>
                        </label>
                    </div>
                </section>

                <section class="space-y-3">
                    <h3 class="text-sm font-semibold">{{ t('dialog.edit_profile.profile_background') }}</h3>
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="props.editProfileDialog.backgroundType"
                            :disabled="editProfileDialog.loading"
                            @update:modelValue="handleProfileBackgroundTypeChange">
                            <SelectTrigger size="sm" class="w-42">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="option in profileBackgroundTypeOptions"
                                        :key="option.value"
                                        :value="option.value"
                                        :text-value="option.label">
                                        {{ option.label }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div v-if="editProfileDialog.backgroundType === 'gradient'" class="grid gap-2 sm:grid-cols-3">
                        <label class="space-y-1">
                            <span class="text-xs text-muted-foreground">{{
                                t('dialog.edit_profile.gradient_top')
                            }}</span>
                            <div class="flex items-center gap-1">
                                <input
                                    type="color"
                                    class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                                    :value="backgroundGradientTopColorValue"
                                    :disabled="editProfileDialog.loading"
                                    @input="handleBackgroundGradientTopColorInput" />
                                <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                                    {{ backgroundGradientTopColorValue }}
                                </span>
                            </div>
                        </label>

                        <label class="space-y-1">
                            <span class="text-xs text-muted-foreground">{{
                                t('dialog.edit_profile.gradient_bottom')
                            }}</span>
                            <div class="flex items-center gap-1">
                                <input
                                    type="color"
                                    class="h-8 w-12 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
                                    :value="backgroundGradientBottomColorValue"
                                    :disabled="editProfileDialog.loading"
                                    @input="handleBackgroundGradientBottomColorInput" />
                                <span class="w-20 text-xs font-mono text-muted-foreground uppercase">
                                    {{ backgroundGradientBottomColorValue }}
                                </span>
                            </div>
                        </label>
                    </div>

                    <div v-if="editProfileDialog.backgroundType === 'texture'" class="space-y-2">
                        <Select
                            :model-value="props.editProfileDialog.backgroundTextureId"
                            :disabled="editProfileDialog.loading"
                            @update:modelValue="handleBackgroundTextureChange">
                            <SelectTrigger size="sm" class="h-14! w-80">
                                <SelectValue :placeholder="t('dialog.edit_profile.profile_background_type_image')">
                                    <template v-if="selectedProfileBackgroundTextureOption">
                                        <span class="inline-flex min-w-0 items-center gap-2">
                                            <img
                                                :src="selectedProfileBackgroundTextureOption.thumbnail"
                                                class="h-9 w-16 shrink-0 rounded-sm object-cover"
                                                :alt="selectedProfileBackgroundTextureOption.label"
                                                loading="lazy" />
                                            <span class="truncate">{{
                                                selectedProfileBackgroundTextureOption.label
                                            }}</span>
                                        </span>
                                    </template>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent class="w-80">
                                <SelectGroup>
                                    <SelectItem
                                        v-for="option in profileBackgrounds"
                                        :key="option.id"
                                        :value="option.id"
                                        :text-value="option.label"
                                        :disabled="!isLocalUserVrcPlusSupporter && option.isVRCPlus">
                                        <div class="flex items-center gap-2">
                                            <img
                                                :src="option.thumbnail"
                                                class="h-9 w-16 shrink-0 rounded-sm object-cover"
                                                :alt="option.label"
                                                loading="lazy" />
                                            <span>{{ option.label }}</span>
                                        </div>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
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

            <GallerySelectDialog
                :gallery-select-dialog="gallerySelectDialog"
                @select-image="handleGalleryImageSelect" />
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
    import { languageClass, getFaviconUrl, arraysMatch, debounce } from '../../../shared/utils';
    import { useUserStore, useAuthStore, useGalleryStore, useModalStore } from '../../../stores';
    import { useStatusPresets } from './composables/useStatusPresets';
    import GallerySelectDialog from '../GroupDialog/GallerySelectDialog.vue';
    import { updateUserDialogProfile } from '@/coordinators/userCoordinator';
    import { profileBackgrounds } from '@/shared/constants/backgrounds';

    const { t } = useI18n();
    const { currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const authStore = useAuthStore();
    const modalStore = useModalStore();
    const { refreshGalleryTable } = useGalleryStore();
    const { presets, addPreset, removePreset, getStatusClass, MAX_PRESETS } = useStatusPresets();

    const props = defineProps({
        editProfileDialog: {
            type: Object,
            required: true
        }
    });

    const selectedLanguageToAdd = ref('');
    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedImageUrl: '',
        isIconGallerySelectDialog: false
    });

    const currentLanguages = computed(() => currentUser.value?.$languages ?? []);
    const availableLanguages = computed(() => {
        const options = authStore.cachedConfig?.['constants']?.['LANGUAGE']?.['SPOKEN_LANGUAGE_OPTIONS'] ?? {};
        return Object.entries(options).map(([key, value]) => ({ key, value }));
    });
    const historyItems = computed(() => props.editProfileDialog.socialStatusHistoryTable ?? []);

    const bannerTypeOptions = [
        { value: 'color', label: t('dialog.edit_profile.banner_type_color') },
        { value: 'avatarBanner', label: t('dialog.edit_profile.banner_type_avatar_banner') },
        { value: 'customImage', label: t('dialog.edit_profile.banner_type_custom_image') }
    ];
    const profileBackgroundTypeOptions = [
        { value: 'default', label: t('dialog.edit_profile.profile_background_type_none') },
        { value: 'texture', label: t('dialog.edit_profile.profile_background_type_image') },
        { value: 'gradient', label: t('dialog.edit_profile.profile_background_type_gradient') }
    ];
    const selectedProfileBackgroundTextureOption = computed(() =>
        profileBackgrounds.find((option) => option.id === props.editProfileDialog.backgroundTextureId)
    );

    const selectedBannerType = computed(() => {
        const type = props.editProfileDialog.bannerType;
        return bannerTypeOptions.some((option) => option.value === type) ? type : 'color';
    });
    const bannerColorValue = computed(() => getThemeHexColor(props.editProfileDialog.bannerColor));
    const themeButtonColorValue = computed(() => getThemeHexColor(props.editProfileDialog.themeButtonColor));
    const themeIconColorValue = computed(() => getThemeHexColor(props.editProfileDialog.themeIconColor));
    const themeSubtextColorValue = computed(() => getThemeHexColor(props.editProfileDialog.themeSubtextColor));
    const backgroundGradientBottomColorValue = computed(() =>
        getThemeHexColor(props.editProfileDialog.backgroundGradientBottom)
    );
    const backgroundGradientTopColorValue = computed(() =>
        getThemeHexColor(props.editProfileDialog.backgroundGradientTop)
    );

    const saveThemeDebounced = debounce(saveTheme, 300);

    function normalizeColor(value) {
        const hex = String(value ?? '')
            .trim()
            .replace(/^#/, '')
            .toLowerCase();
        return /^[0-9a-f]{6}$/.test(hex) ? hex : '';
    }

    function getThemeHexColor(value) {
        const normalized = normalizeColor(value);
        return normalized ? `#${normalized}` : '#ffffff';
    }

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

    function handleBannerColorInput(event) {
        const normalized = normalizeColor(event?.target?.value);
        if (!normalized) {
            return;
        }
        const D = props.editProfileDialog;
        D.bannerColor = normalized;
        D.bannerType = 'color';
    }

    function handleBannerTypeChange(value) {
        if (!bannerTypeOptions.some((option) => option.value === value)) {
            return;
        }
        const D = props.editProfileDialog;
        D.bannerType = value;
    }

    function handleProfileBackgroundTypeChange(value) {
        if (!profileBackgroundTypeOptions.some((option) => option.value === value)) {
            return;
        }
        const D = props.editProfileDialog;
        D.backgroundType = value;
        if (value === 'texture' && !profileBackgrounds.some((option) => option.id === D.backgroundTextureId)) {
            D.backgroundTextureId = profileBackgrounds[0]?.id ?? '';
        }
        if (value === 'gradient') {
            const profileDefaults = authStore.cachedConfig?.profileDefaults;
            D.backgroundGradientTop = profileDefaults?.backgroundGradientTop ?? '000000';
            D.backgroundGradientBottom = profileDefaults?.backgroundGradientBottom ?? '000000';
        }
    }

    function handleBackgroundTextureChange(value) {
        if (!profileBackgrounds.some((option) => option.id === value)) {
            return;
        }
        const D = props.editProfileDialog;
        D.backgroundTextureId = value;
        D.backgroundType = 'texture';
    }

    function handleBackgroundGradientTopColorInput(event) {
        const normalized = normalizeColor(event?.target?.value);
        if (!normalized) {
            return;
        }
        const D = props.editProfileDialog;
        D.backgroundGradientTop = normalized;
        D.backgroundType = 'gradient';
    }

    function handleBackgroundGradientBottomColorInput(event) {
        const normalized = normalizeColor(event?.target?.value);
        if (!normalized) {
            return;
        }
        const D = props.editProfileDialog;
        D.backgroundGradientBottom = normalized;
        D.backgroundType = 'gradient';
    }

    function handleThemeChange(value) {
        const D = props.editProfileDialog;
        D.themeId = value;
        const selectedTheme = D.themes.find((option) => option.id === D.themeId);
        if (!selectedTheme) {
            return;
        }
        D.themeName = selectedTheme.name;
        D.themeButtonColor = normalizeColor(selectedTheme.buttonColor);
        D.themeIconColor = normalizeColor(selectedTheme.iconColor);
        D.themeSubtextColor = normalizeColor(selectedTheme.subtextColor);
    }

    function handleThemeButtonColorInput(event) {
        const D = props.editProfileDialog;
        D.themeButtonColor = normalizeColor(event?.target?.value);
        handleThemeInput();
    }

    function handleThemeIconColorInput(event) {
        const D = props.editProfileDialog;
        D.themeIconColor = normalizeColor(event?.target?.value);
        handleThemeInput();
    }

    function handleThemeSubtextColorInput(event) {
        const D = props.editProfileDialog;
        D.themeSubtextColor = normalizeColor(event?.target?.value);
        handleThemeInput();
    }

    function handleThemeInput() {
        const D = props.editProfileDialog;
        if (D.themeId) {
            const selectedTheme = D.themes.find((option) => option.id === D.themeId);
            if (selectedTheme) {
                selectedTheme.name = D.themeName;
            }
            saveThemeDebounced();
        }
    }

    function createTheme() {
        const profileDefaults = authStore.cachedConfig?.profileDefaults;
        const D = props.editProfileDialog;
        const payload = {
            name: D.themeName,
            buttonColor: profileDefaults?.themeButtonColor ?? '064b5c',
            iconColor: profileDefaults?.themeIconColor ?? '6ae3f9',
            subtextColor: profileDefaults?.themeSubtextColor ?? 'a9a9a9'
        };
        userRequest
            .createProfileTheme(payload)
            .then((args) => {
                const newTheme = args.json;
                if (newTheme?.id) {
                    D.themes.push(newTheme);
                    D.themeId = newTheme.id;
                    D.themeName = newTheme.name;
                    D.themeButtonColor = newTheme.buttonColor;
                    D.themeIconColor = newTheme.iconColor;
                    D.themeSubtextColor = newTheme.subtextColor;
                }
            })
            .catch((error) => {
                console.error('Failed to create profile theme:', error);
            });
    }

    function saveTheme() {
        const D = props.editProfileDialog;
        const payload = {
            themeId: D.themeId,
            name: D.themeName,
            buttonColor: D.themeButtonColor,
            iconColor: D.themeIconColor,
            subtextColor: D.themeSubtextColor
        };
        userRequest
            .saveProfileTheme(payload)
            .then(() => {
                // useless response
                const index = D.themes.findIndex((option) => option.id === payload.themeId);
                if (index !== -1) {
                    D.themes[index] = {
                        id: payload.themeId, // why are you like this
                        name: payload.name,
                        buttonColor: payload.buttonColor,
                        iconColor: payload.iconColor,
                        subtextColor: payload.subtextColor
                    };
                }
            })
            .catch((error) => {
                console.error('Failed to update profile theme:', error);
            });
    }

    function deleteTheme() {
        const D = props.editProfileDialog;
        userRequest
            .deleteProfileTheme({ id: D.themeId })
            .then(() => {
                const index = D.themes.findIndex((option) => option.id === D.themeId);
                if (index !== -1) {
                    D.themes.splice(index, 1);
                    if (D.themeId === D.themeId) {
                        D.themeId = '';
                        D.themeName = '';
                        D.themeButtonColor = '';
                        D.themeIconColor = '';
                        D.themeSubtextColor = '';
                        if (D.themes.length) {
                            handleThemeChange(D.themes[D.themes.length - 1].id);
                        }
                    }
                }
            })
            .catch((error) => {
                console.error('Failed to delete profile theme:', error);
            });
    }

    function handleCreateNewTheme() {
        const D = props.editProfileDialog;

        modalStore
            .prompt({
                title: t('dialog.edit_profile.profile_theme'),
                description: 'Enter a theme name (1-12 characters).',
                confirmText: 'Create',
                cancelText: t('dialog.alertdialog.cancel'),
                pattern: /^.{1,12}$/,
                errorMessage: 'Theme name must be between 1 and 12 characters.'
            })
            .then(({ ok, value }) => {
                if (!ok) {
                    return;
                }

                D.themeId = '';
                D.themeName = value;
                D.themeButtonColor = '';
                D.themeIconColor = '';
                D.themeSubtextColor = '';
                createTheme();
            })
            .catch(() => {});
    }

    function showGallerySelectDialog() {
        const D = gallerySelectDialog.value;
        D.visible = true;
        D.isIconGallerySelectDialog = false;
        refreshGalleryTable();
    }

    function showIconSelectDialog() {
        const D = gallerySelectDialog.value;
        D.visible = true;
        D.isIconGallerySelectDialog = true;
        refreshGalleryTable();
    }

    function handleGalleryImageSelect({ imageUrl }) {
        const D = props.editProfileDialog;
        if (gallerySelectDialog.value.isIconGallerySelectDialog) {
            D.userIcon = imageUrl;
        } else {
            if (!imageUrl) {
                D.bannerType = 'color';
                D.bannerUrl = '';
                return;
            }
            D.bannerUrl = imageUrl;
        }
    }

    function clearUserIcon() {
        const D = props.editProfileDialog;
        D.userIcon = '';
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

    async function saveProfile() {
        const D = props.editProfileDialog;
        if (D.loading) {
            return;
        }

        /** @type {Partial<import("../../../types/api/user").GetCurrentUserResponse>} */
        const userPayload = {};
        if (D.status !== currentUser.value.status) {
            userPayload.status = D.status;
        }
        if (D.statusDescription !== currentUser.value.statusDescription) {
            userPayload.statusDescription = D.statusDescription;
        }
        if (D.pronouns !== currentUser.value.pronouns) {
            userPayload.pronouns = D.pronouns;
        }

        /** @type {Partial<import("../../../types/api/profile").selfProfile>} */
        const profilePayload = {};
        if (D.bio !== D.selfProfileRef.bio) {
            profilePayload.bio = D.bio;
        }
        if (!arraysMatch(D.bioLinks, D.selfProfileRef.bioLinks)) {
            profilePayload.bioLinks = D.bioLinks;
        }
        if (D.bannerColor !== D.selfProfileRef.bannerColor) {
            profilePayload.bannerColor = D.bannerColor;
        }
        if (D.bannerUrl !== D.selfProfileRef.bannerUrl) {
            profilePayload.bannerCustomUrl = D.bannerUrl;
        }
        if (D.bannerType !== D.selfProfileRef.bannerType) {
            profilePayload.bannerType = D.bannerType;
            if (D.bannerType === 'avatarBanner') {
                profilePayload.bannerCustomUrl = undefined;
                profilePayload.bannerColor = undefined;
            }
            if (D.bannerType === 'color') {
                profilePayload.bannerCustomUrl = undefined;
            }
            if (D.bannerType === 'customImage') {
                profilePayload.bannerColor = undefined;
            }
        }
        if (D.userIcon !== D.selfProfileRef.userIcon) {
            profilePayload.userIcon = D.userIcon;
        }
        if (D.themeId !== D.selfProfileRef.themeId) {
            profilePayload.themeId = D.themeId;
        }
        if (D.backgroundType !== D.selfProfileRef.backgroundType) {
            profilePayload.backgroundType = D.backgroundType;
        }
        if (D.backgroundTextureId !== D.selfProfileRef.backgroundTextureId) {
            profilePayload.backgroundTextureId = D.backgroundTextureId;
        }
        if (D.backgroundGradientBottom !== D.selfProfileRef.backgroundGradientBottom) {
            profilePayload.backgroundGradientBottom = D.backgroundGradientBottom;
        }
        if (D.backgroundGradientTop !== D.selfProfileRef.backgroundGradientTop) {
            profilePayload.backgroundGradientTop = D.backgroundGradientTop;
        }
        if (!Object.keys(userPayload).length && !Object.keys(profilePayload).length) {
            D.visible = false;
            return;
        }

        D.loading = true;
        try {
            if (Object.keys(profilePayload).length) {
                console.log('Saving profile with payload:', profilePayload);
                await userRequest.saveProfile(profilePayload);
            }
            if (Object.keys(userPayload).length) {
                console.log('Saving user with payload:', userPayload);
                await userRequest.saveCurrentUser(userPayload);
            }
            D.visible = false;
            updateUserDialogProfile();
            toast.success('Profile updated');
        } finally {
            D.loading = false;
        }
    }
</script>
