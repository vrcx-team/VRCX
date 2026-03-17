<template>
    <div class="flex flex-col gap-10 py-2">
        <SettingsGroup :title="t('view.settings.appearance.appearance.header')">
            <SettingsItem :label="t('view.settings.appearance.appearance.language')">
                <Select :model-value="appLanguage" @update:modelValue="changeAppLanguage">
                    <SelectTrigger size="sm">
                        <SelectValue :placeholder="appLanguageDisplayName" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="language in languageCodes" :key="language" :value="language">
                                {{ getLanguageName(language) }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.font_family')">
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <Button variant="outline" size="sm" class="min-w-[180px] justify-between font-normal">
                            <span class="truncate">{{ fontDropdownDisplayText }}</span>
                            <ChevronDown class="ml-2 size-4 shrink-0 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem
                            v-for="option in westernFontItems"
                            :key="option.key"
                            :model-value="appFontFamily === option.key"
                            @select="handleSelectWesternFont(option.key)">
                            {{ option.label }}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            v-for="option in cjkFontItems"
                            :key="option.key"
                            :model-value="appCjkFontPack === option.key && appFontFamily !== 'custom'"
                            @select="handleSelectCjkFont(option.key)">
                            {{ option.label }}
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            :model-value="appFontFamily === 'custom'"
                            @select="handleSelectCustomFont">
                            {{ t('view.settings.appearance.appearance.font_family_custom') }}
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Dialog v-model:open="customFontDialogOpen">
                    <DialogContent class="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{{
                                t('view.settings.appearance.appearance.font_family_custom_dialog_title')
                            }}</DialogTitle>
                            <DialogDescription>{{
                                t('view.settings.appearance.appearance.font_family_custom_dialog_description')
                            }}</DialogDescription>
                        </DialogHeader>
                        <Input v-model="customFontInput" placeholder="'My Font', Arial, sans-serif" />
                        <DialogFooter>
                            <Button variant="outline" @click="customFontDialogOpen = false">
                                {{ t('dialog.alertdialog.cancel') }}
                            </Button>
                            <Button @click="saveCustomFont">
                                {{ t('dialog.alertdialog.ok') }}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SettingsItem>

            <SettingsItem v-if="!isLinux" :label="t('view.settings.appearance.appearance.zoom')">
                <NumberField
                    v-model="zoomLevel"
                    :step="1"
                    :format-options="{ maximumFractionDigits: 0 }"
                    class="w-32"
                    @update:modelValue="setZoomLevel">
                    <NumberFieldContent>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                    </NumberFieldContent>
                </NumberField>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.show_notification_icon_dot')">
                <Switch
                    :model-value="notificationIconDot"
                    @update:modelValue="
                        setNotificationIconDot();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.vrcplus_profile_icons')">
                <Switch
                    :model-value="displayVRCPlusIconsAsAvatar"
                    @update:modelValue="
                        setDisplayVRCPlusIconsAsAvatar();
                        saveOpenVROption();
                    " />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.appearance.display.header')">
            <SettingsItem :label="t('view.settings.appearance.appearance.show_instance_id')">
                <Switch :model-value="showInstanceIdInLocation" @update:modelValue="setShowInstanceIdInLocation" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.nicknames')">
                <Switch
                    :model-value="!hideNicknames"
                    @update:modelValue="
                        setHideNicknames();
                        saveOpenVROption();
                    " />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.age_gated_instances')">
                <Switch
                    :model-value="isAgeGatedInstancesVisible"
                    @update:modelValue="setIsAgeGatedInstancesVisible" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.striped_data_table_mode')">
                <Switch :model-value="isDataTableStriped" @update:modelValue="toggleStripedDataTable" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.toggle_pointer_on_hover')">
                <Switch :model-value="showPointerOnHover" @update:modelValue="togglePointerOnHover" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.appearance.appearance.accessible_status_indicators')"
                :description="t('view.settings.appearance.appearance.accessible_status_indicators_description')">
                <Switch :model-value="accessibleStatusIndicators" @update:modelValue="toggleAccessibleStatusIndicators" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.appearance.appearance.use_official_status_colors')"
                :description="t('view.settings.appearance.appearance.use_official_status_colors_description')">
                <Switch :model-value="useOfficialStatusColors" @update:modelValue="toggleOfficialStatusColors" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.interface.navigation.header')">
            <SettingsItem :label="t('view.settings.interface.navigation.show_new_dashboard_button')">
                <Switch :model-value="showNewDashboardButton" @update:modelValue="setShowNewDashboardButton" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.interface.lists_tables.header')">
            <SettingsItem :label="t('view.settings.appearance.appearance.sort_favorite_by')">
                <RadioGroup
                    :model-value="sortFavorites ? 'true' : 'false'"
                    class="gap-2 flex"
                    @update:modelValue="handleSortFavoritesRadio">
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="sortFavorites-false" value="false" />
                        <label for="sortFavorites-false">
                            {{ t('view.settings.appearance.appearance.sort_favorite_by_name') }}
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="sortFavorites-true" value="true" />
                        <label for="sortFavorites-true">
                            {{ t('view.settings.appearance.appearance.sort_favorite_by_date') }}
                        </label>
                    </div>
                </RadioGroup>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.sort_instance_users_by')">
                <RadioGroup
                    :model-value="instanceUsersSortAlphabetical ? 'true' : 'false'"
                    class="gap-2 flex"
                    @update:modelValue="handleInstanceUsersSortAlphabeticalRadio">
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="instanceUsersSortAlphabetical-false" value="false" />
                        <label for="instanceUsersSortAlphabetical-false">
                            {{ t('view.settings.appearance.appearance.sort_instance_users_by_time') }}
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="instanceUsersSortAlphabetical-true" value="true" />
                        <label for="instanceUsersSortAlphabetical-true">
                            {{ t('view.settings.appearance.appearance.sort_instance_users_by_alphabet') }}
                        </label>
                    </div>
                </RadioGroup>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.appearance.table_page_sizes')">
                <Popover v-model:open="tablePageSizesOpen">
                    <ListboxRoot v-model="tablePageSizesModel" highlight-on-hover multiple>
                        <PopoverAnchor class="inline-flex w-75">
                            <TagsInput v-slot="{ modelValue: tags }" v-model="tablePageSizesModel" class="w-full">
                                <TagsInputItem v-for="item in tags" :key="item.toString()" :value="item.toString()">
                                    <TagsInputItemText />
                                    <TagsInputItemDelete />
                                </TagsInputItem>

                                <ListboxFilter v-model="tablePageSizesSearchTerm" as-child>
                                    <TagsInputInput
                                        :placeholder="t('view.settings.appearance.appearance.table_page_sizes')"
                                        @keydown.enter.prevent="addTablePageSizeFromInput"
                                        @keydown.down="tablePageSizesOpen = true" />
                                </ListboxFilter>

                                <PopoverTrigger as-child>
                                    <Button size="icon-sm" variant="ghost" class="order-last self-start ml-auto">
                                        <ChevronDown class="size-3.5" />
                                    </Button>
                                </PopoverTrigger>
                            </TagsInput>
                        </PopoverAnchor>

                        <PopoverContent class="p-1" @open-auto-focus.prevent>
                            <ListboxContent
                                class="max-h-75 scroll-py-1 overflow-x-hidden overflow-y-auto empty:after:content-['No_options'] empty:p-1 empty:after:block"
                                tabindex="0">
                                <ListboxItem
                                    v-for="size in filteredTablePageSizeOptions"
                                    :key="size"
                                    class="data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                                    :value="size"
                                    @select="tablePageSizesSearchTerm = ''">
                                    <span>{{ size }}</span>

                                    <ListboxItemIndicator class="ml-auto inline-flex items-center justify-center">
                                        <CheckIcon />
                                    </ListboxItemIndicator>
                                </ListboxItem>
                            </ListboxContent>
                        </PopoverContent>
                    </ListboxRoot>
                </Popover>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.appearance.appearance.table_entries_settings')"
                :description="t('view.settings.appearance.appearance.table_entries_settings_description')">
                <Button size="sm" variant="outline" @click="showTableLimitsDialog">{{
                    t('view.settings.appearance.appearance.table_entries_settings')
                }}</Button>
            </SettingsItem>
        </SettingsGroup>
        <TableLimitsDialog />

        <SettingsGroup :title="t('view.settings.appearance.timedate.header')">
            <SettingsItem :label="t('view.settings.appearance.timedate.time_format')">
                <RadioGroup
                    :model-value="dtHour12 ? 'true' : 'false'"
                    class="gap-2 flex"
                    @update:modelValue="handleDtHour12Radio">
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="dtHour12-true" value="true" />
                        <label for="dtHour12-true">
                            {{ t('view.settings.appearance.timedate.time_format_12') }}
                        </label>
                    </div>
                    <div class="flex items-center space-x-2">
                        <RadioGroupItem id="dtHour12-false" value="false" />
                        <label for="dtHour12-false">
                            {{ t('view.settings.appearance.timedate.time_format_24') }}
                        </label>
                    </div>
                </RadioGroup>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.appearance.timedate.force_iso_date_format')">
                <Switch :model-value="dtIsoFormat" @update:modelValue="setDtIsoFormat" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.appearance.user_dialog.header')">
            <SettingsItem
                :label="t('view.settings.appearance.user_dialog.vrchat_notes')"
                :description="t('view.settings.appearance.user_dialog.vrchat_notes_description')">
                <Switch :model-value="!hideUserNotes" @update:modelValue="setHideUserNotes" />
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.appearance.user_dialog.vrcx_memos')"
                :description="t('view.settings.appearance.user_dialog.vrcx_memos_description')">
                <Switch :model-value="!hideUserMemos" @update:modelValue="setHideUserMemos" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.appearance.friend_log.header')">
            <SettingsItem :label="t('view.settings.appearance.friend_log.hide_unfriends')">
                <Switch :model-value="hideUnfriends" @update:modelValue="setHideUnfriends" />
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.appearance.user_colors.header')">
            <SettingsItem :label="t('view.settings.appearance.user_colors.random_colors_from_user_id')">
                <Switch :model-value="randomUserColours" @update:modelValue="updateTrustColor('', '', true)" />
            </SettingsItem>
            <div class="settings-item">
                <div class="flex flex-col gap-2 py-2">
                    <div v-for="colorEntry in trustColorEntries" :key="colorEntry.key" class="flex items-center gap-3">
                        <span :class="colorEntry.tagClass">{{ t(colorEntry.labelKey) }}</span>
                        <PresetColorPicker
                            :model-value="trustColor[colorEntry.key]"
                            :presets="colorEntry.presets"
                            @change="updateTrustColor(colorEntry.key, $event)" />
                    </div>
                </div>
            </div>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectSeparator,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { ListboxContent, ListboxFilter, ListboxItem, ListboxItemIndicator, ListboxRoot, useFilter } from 'reka-ui';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import {
        TagsInput,
        TagsInputInput,
        TagsInputItem,
        TagsInputItemDelete,
        TagsInputItemText
    } from '@/components/ui/tags-input';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { CheckIcon, ChevronDown } from 'lucide-vue-next';
    import { useAppearanceSettingsStore, useFavoriteStore, useVrStore } from '@/stores';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { Switch } from '@/components/ui/switch';
    import { getLanguageName, languageCodes } from '@/localization';
    import { APP_CJK_FONT_PACKS, APP_FONT_CONFIG, APP_FONT_DEFAULT_KEY, APP_FONT_FAMILIES } from '@/shared/constants';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import PresetColorPicker from '@/components/PresetColorPicker.vue';
    import TableLimitsDialog from '@/components/dialogs/TableLimitsDialog.vue';
    import { saveSortFavoritesOption } from '@/coordinators/favoriteCoordinator';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';

    const { t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { saveOpenVROption, updateVRConfigVars } = useVrStore();

    const {
        appLanguage,
        displayVRCPlusIconsAsAvatar,
        appFontFamily,
        customFontFamily,
        appCjkFontPack,
        hideNicknames,
        showInstanceIdInLocation,
        isAgeGatedInstancesVisible,
        sortFavorites,
        instanceUsersSortAlphabetical,
        dtHour12,
        dtIsoFormat,
        hideUserNotes,
        hideUserMemos,
        hideUnfriends,
        randomUserColours,
        trustColor,
        notificationIconDot,
        tablePageSizes,
        isDataTableStriped,
        showPointerOnHover,
        accessibleStatusIndicators,
        useOfficialStatusColors,
        showNewDashboardButton
    } = storeToRefs(appearanceSettingsStore);

    const appLanguageDisplayName = computed(() => getLanguageName(String(appLanguage.value)));

    const {
        setDisplayVRCPlusIconsAsAvatar,
        setHideNicknames,
        setShowInstanceIdInLocation,
        setIsAgeGatedInstancesVisible,
        setInstanceUsersSortAlphabetical,
        setDtHour12,
        setDtIsoFormat,
        setHideUserNotes,
        setHideUserMemos,
        setHideUnfriends,
        updateTrustColor,
        changeAppLanguage,
        showTableLimitsDialog,
        setNotificationIconDot,
        setTablePageSizes,
        toggleStripedDataTable,
        togglePointerOnHover,
        toggleAccessibleStatusIndicators,
        toggleOfficialStatusColors,
        setShowNewDashboardButton,
        setAppFontFamily,
        setCustomFontFamily,
        setAppCjkFontPack
    } = appearanceSettingsStore;



    const trustColorEntries = [
        {
            key: 'untrusted',
            tagClass: 'x-tag-untrusted',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.visitor',
            presets: ['#CCCCCC']
        },
        {
            key: 'basic',
            tagClass: 'x-tag-basic',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.new_user',
            presets: ['#1778ff']
        },
        {
            key: 'known',
            tagClass: 'x-tag-known',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.user',
            presets: ['#2bcf5c']
        },
        {
            key: 'trusted',
            tagClass: 'x-tag-trusted',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.known_user',
            presets: ['#ff7b42']
        },
        {
            key: 'veteran',
            tagClass: 'x-tag-veteran',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.trusted_user',
            presets: ['#b18fff', '#8143e6', '#ff69b4', '#b52626', '#ffd000', '#abcdef']
        },
        {
            key: 'vip',
            tagClass: 'x-tag-vip',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.vrchat_team',
            presets: ['#ff2626']
        },
        {
            key: 'troll',
            tagClass: 'x-tag-troll',
            labelKey: 'view.settings.appearance.user_colors.trust_levels.nuisance',
            presets: ['#782f2f']
        }
    ];

    const fontDropdownDisplayText = computed(() => {
        if (appFontFamily.value === 'custom') {
            return t('view.settings.appearance.appearance.font_family_custom');
        }
        const western = t(`view.settings.appearance.appearance.font_family_${appFontFamily.value}`);
        const cjk =
            appCjkFontPack.value === 'system'
                ? t('view.settings.appearance.appearance.font_family_system_ui')
                : t(`view.settings.appearance.appearance.cjk_font_pack_${appCjkFontPack.value}`);
        return `${western} / ${cjk}`;
    });

    const westernFontItems = computed(() => {
        return APP_FONT_FAMILIES.filter((key) => key !== 'custom' && key !== 'system_ui').map((key) => ({
            key,
            label: t(`view.settings.appearance.appearance.font_family_${key}`)
        }));
    });

    const cjkFontItems = computed(() => {
        return APP_CJK_FONT_PACKS.map((key) => ({
            key,
            label:
                key === 'system'
                    ? t('view.settings.appearance.appearance.font_family_system_ui')
                    : t(`view.settings.appearance.appearance.cjk_font_pack_${key}`)
        }));
    });

    const FONT_FAMILY_REGEX =
        /^\s*(([-_\p{L}][\p{L}\p{N}_\s-]*)|'[^']+'|"[^"]+")\s*(,\s*(([-_\p{L}][\p{L}\p{N}_\s-]*)|'[^']+'|"[^"]+")\s*)*$/u;

    const customFontDialogOpen = ref(false);
    const customFontInput = ref('');

    function handleSelectWesternFont(key) {
        setAppFontFamily(key);
    }

    function handleSelectCjkFont(key) {
        if (appFontFamily.value === 'custom') {
            setAppFontFamily(APP_FONT_DEFAULT_KEY);
        }
        setAppCjkFontPack(key);
    }

    function handleSelectCustomFont() {
        const cssVarValue = getComputedStyle(document.documentElement).getPropertyValue('--font-western-primary').trim();
        const currentKey = String(appFontFamily.value || APP_FONT_DEFAULT_KEY)
            .trim()
            .toLowerCase();
        const fallbackFont = APP_FONT_CONFIG[currentKey]?.cssName || APP_FONT_CONFIG[APP_FONT_DEFAULT_KEY].cssName;
        customFontInput.value = customFontFamily.value?.trim() || cssVarValue || fallbackFont;
        customFontDialogOpen.value = true;
    }

    function saveCustomFont() {
        const trimmed = customFontInput.value.trim();
        if (!trimmed || !FONT_FAMILY_REGEX.test(trimmed)) {
            toast.error(t('view.settings.appearance.appearance.font_family_custom_invalid'));
            return;
        }
        setCustomFontFamily(trimmed);
        setAppFontFamily('custom');
        customFontDialogOpen.value = false;
    }

    const zoomLevel = ref(100);
    const isLinux = computed(() => LINUX);
    let cleanupWheel = null;

    onBeforeUnmount(() => {
        if (cleanupWheel) {
            cleanupWheel();
        }
    });

    initGetZoomLevel();

    /**
     *
     * @param value
     */
    function handleSortFavoritesRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== sortFavorites.value) {
            saveSortFavoritesOption();
        }
    }

    /**
     *
     * @param value
     */
    function handleInstanceUsersSortAlphabeticalRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== instanceUsersSortAlphabetical.value) {
            setInstanceUsersSortAlphabetical();
        }
    }

    /**
     *
     * @param value
     */
    function handleDtHour12Radio(value) {
        const nextValue = value === 'true';
        if (nextValue !== dtHour12.value) {
            setDtHour12();
            updateVRConfigVars();
        }
    }

    const tablePageSizesModel = computed({
        get: () => tablePageSizes.value.map(String),
        set: (values) => {
            const rawLength = Array.isArray(values) ? values.length : 0;
            setTablePageSizes(values);
            if (rawLength && rawLength !== tablePageSizes.value.length) {
                toast.error(t('view.settings.appearance.appearance.table_page_sizes_error'));
            }
        }
    });

    const TABLE_PAGE_SIZE_SUGGESTIONS = Object.freeze([5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 250, 500, 1000]);

    const tablePageSizesOpen = ref(false);
    const tablePageSizesSearchTerm = ref('');

    const { contains } = useFilter({ sensitivity: 'base' });

    const tablePageSizeOptions = computed(() => {
        const current = Array.isArray(tablePageSizes.value) ? tablePageSizes.value : [];
        const merged = new Set([...TABLE_PAGE_SIZE_SUGGESTIONS, ...current].map((v) => String(v)));
        return Array.from(merged).sort((a, b) => Number(a) - Number(b));
    });

    const filteredTablePageSizeOptions = computed(() => {
        if (tablePageSizesSearchTerm.value === '') {
            return tablePageSizeOptions.value;
        }
        return tablePageSizeOptions.value.filter((option) => contains(option, tablePageSizesSearchTerm.value));
    });

    watch(tablePageSizesSearchTerm, (value) => {
        if (value) {
            tablePageSizesOpen.value = true;
        }
    });

    /**
     *
     */
    function addTablePageSizeFromInput() {
        const raw = String(tablePageSizesSearchTerm.value ?? '').trim();
        if (!raw) {
            return;
        }
        if (!Array.isArray(tablePageSizesModel.value)) {
            tablePageSizesModel.value = [raw];
        } else if (!tablePageSizesModel.value.includes(raw)) {
            tablePageSizesModel.value = [...tablePageSizesModel.value, raw];
        }
        tablePageSizesSearchTerm.value = '';
    }

    /**
     *
     */
    async function initGetZoomLevel() {
        const handleWheel = (event) => {
            if (event.ctrlKey) {
                getZoomLevel();
            }
        };
        window.addEventListener('wheel', handleWheel);
        cleanupWheel = () => {
            window.removeEventListener('wheel', handleWheel);
        };
        getZoomLevel();
    }

    /**
     *
     */
    async function getZoomLevel() {
        zoomLevel.value = ((await AppApi.GetZoom()) + 10) * 10;
    }

    /**
     *
     */
    function setZoomLevel() {
        AppApi.SetZoom(zoomLevel.value / 10 - 10);
    }
</script>
