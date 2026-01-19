<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.appearance.appearance.header') }}</span>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.language') }}</span>
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
            </div>

            <div class="options-container-item">
                <span class="name flex! items-center!">
                    {{ t('view.settings.appearance.appearance.font_family') }}

                    <TooltipWrapper
                        side="top"
                        style="margin-left: 5px"
                        :content="t('view.settings.appearance.appearance.font_family_tooltip')">
                        <Info />
                    </TooltipWrapper>
                </span>
                <Select :model-value="appFontFamily" @update:modelValue="setAppFontFamily">
                    <SelectTrigger size="sm">
                        <SelectValue
                            :placeholder="t(`view.settings.appearance.appearance.font_family_${appFontFamily}`)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <template v-for="option in appFontFamilyOptions" :key="option.key">
                                <SelectSeparator v-if="option.type === 'separator'" />
                                <SelectItem v-else :value="option.key">
                                    {{ t(`view.settings.appearance.appearance.font_family_${option.key}`) }}
                                </SelectItem>
                            </template>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div v-if="!isLinux" class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.zoom') }}</span>
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
            </div>
            <simple-switch
                :label="t('view.settings.appearance.appearance.show_notification_icon_dot')"
                :value="notificationIconDot"
                @change="
                    setNotificationIconDot();
                    saveOpenVROption();
                " />
            <simple-switch
                :label="t('view.settings.appearance.appearance.vrcplus_profile_icons')"
                :value="displayVRCPlusIconsAsAvatar"
                @change="
                    setDisplayVRCPlusIconsAsAvatar();
                    saveOpenVROption();
                " />
            <simple-switch
                :label="t('view.settings.appearance.appearance.show_instance_id')"
                :value="showInstanceIdInLocation"
                @change="setShowInstanceIdInLocation" />
            <simple-switch
                :label="t('view.settings.appearance.appearance.nicknames')"
                :value="!hideNicknames"
                @change="
                    setHideNicknames();
                    saveOpenVROption();
                " />
            <simple-switch
                :label="t('view.settings.appearance.appearance.striped_data_table_mode')"
                :value="isDataTableStriped"
                @change="toggleStripedDataTable" />
            <simple-switch
                :label="t('view.settings.appearance.appearance.toggle_pointer_on_hover')"
                :value="showPointerOnHover"
                @change="togglePointerOnHover" />
            <simple-switch
                :label="t('view.settings.appearance.appearance.age_gated_instances')"
                :value="isAgeGatedInstancesVisible"
                @change="setIsAgeGatedInstancesVisible" />
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.sort_favorite_by') }}</span>
                <RadioGroup
                    :model-value="sortFavorites ? 'true' : 'false'"
                    class="gap-2 flex"
                    style="margin-top: 8px"
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
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.sort_instance_users_by') }}</span>
                <RadioGroup
                    :model-value="instanceUsersSortAlphabetical ? 'true' : 'false'"
                    class="gap-2 flex"
                    style="margin-top: 8px"
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
            </div>

            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.table_page_sizes') }}</span>
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
            </div>

            <div class="options-container-item">
                <Button size="sm" variant="outline" @click="promptMaxTableSizeDialog">{{
                    t('view.settings.appearance.appearance.table_max_size')
                }}</Button>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.timedate.header') }}</span>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.timedate.time_format') }}</span>
                <RadioGroup
                    :model-value="dtHour12 ? 'true' : 'false'"
                    class="gap-2 flex"
                    style="margin-top: 8px"
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
            </div>
            <simple-switch
                :label="t('view.settings.appearance.timedate.force_iso_date_format')"
                :value="dtIsoFormat"
                @change="setDtIsoFormat" />
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.side_panel.header') }}</span>
            <br />
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.side_panel.sorting.header') }}</span>
                <Select :model-value="sidebarSortMethod1" @update:modelValue="setSidebarSortMethod1">
                    <SelectTrigger style="width: 170px" size="sm">
                        <SelectValue :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Sort Alphabetically">{{
                            t('view.settings.appearance.side_panel.sorting.alphabetical')
                        }}</SelectItem>
                        <SelectItem value="Sort by Status">{{
                            t('view.settings.appearance.side_panel.sorting.status')
                        }}</SelectItem>
                        <SelectItem value="Sort Private to ArrowDown">{{
                            t('view.settings.appearance.side_panel.sorting.private_to_bottom')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Active">{{
                            t('view.settings.appearance.side_panel.sorting.last_active')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Seen">{{
                            t('view.settings.appearance.side_panel.sorting.last_seen')
                        }}</SelectItem>
                        <SelectItem value="Sort by Time in Instance">{{
                            t('view.settings.appearance.side_panel.sorting.time_in_instance')
                        }}</SelectItem>
                        <SelectItem value="Sort by Location">{{
                            t('view.settings.appearance.side_panel.sorting.location')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
                <ArrowRight style="margin: 5px" />
                <Select
                    :model-value="sidebarSortMethod2"
                    :disabled="!sidebarSortMethod1"
                    @update:modelValue="(v) => setSidebarSortMethod2(v === SELECT_CLEAR_VALUE ? '' : v)">
                    <SelectTrigger style="width: 170px" size="sm">
                        <SelectValue :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem :value="SELECT_CLEAR_VALUE">{{ t('dialog.gallery_select.none') }}</SelectItem>
                        <SelectItem value="Sort Alphabetically">{{
                            t('view.settings.appearance.side_panel.sorting.alphabetical')
                        }}</SelectItem>
                        <SelectItem value="Sort by Status">{{
                            t('view.settings.appearance.side_panel.sorting.status')
                        }}</SelectItem>
                        <SelectItem value="Sort Private to ArrowDown">{{
                            t('view.settings.appearance.side_panel.sorting.private_to_bottom')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Active">{{
                            t('view.settings.appearance.side_panel.sorting.last_active')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Seen">{{
                            t('view.settings.appearance.side_panel.sorting.last_seen')
                        }}</SelectItem>
                        <SelectItem value="Sort by Time in Instance">{{
                            t('view.settings.appearance.side_panel.sorting.time_in_instance')
                        }}</SelectItem>
                        <SelectItem value="Sort by Location">{{
                            t('view.settings.appearance.side_panel.sorting.location')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
                <ArrowRight style="margin: 5px" />
                <Select
                    :model-value="sidebarSortMethod3"
                    :disabled="!sidebarSortMethod2"
                    @update:modelValue="(v) => setSidebarSortMethod3(v === SELECT_CLEAR_VALUE ? '' : v)">
                    <SelectTrigger style="width: 170px" size="sm">
                        <SelectValue :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem :value="SELECT_CLEAR_VALUE">{{ t('dialog.gallery_select.none') }}</SelectItem>
                        <SelectItem value="Sort Alphabetically">{{
                            t('view.settings.appearance.side_panel.sorting.alphabetical')
                        }}</SelectItem>
                        <SelectItem value="Sort by Status">{{
                            t('view.settings.appearance.side_panel.sorting.status')
                        }}</SelectItem>
                        <SelectItem value="Sort Private to ArrowDown">{{
                            t('view.settings.appearance.side_panel.sorting.private_to_bottom')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Active">{{
                            t('view.settings.appearance.side_panel.sorting.last_active')
                        }}</SelectItem>
                        <SelectItem value="Sort by Last Seen">{{
                            t('view.settings.appearance.side_panel.sorting.last_seen')
                        }}</SelectItem>
                        <SelectItem value="Sort by Time in Instance">{{
                            t('view.settings.appearance.side_panel.sorting.time_in_instance')
                        }}</SelectItem>
                        <SelectItem value="Sort by Location">{{
                            t('view.settings.appearance.side_panel.sorting.location')
                        }}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <simple-switch
                :label="t('view.settings.appearance.side_panel.group_by_instance')"
                :value="isSidebarGroupByInstance"
                :tooltip="t('view.settings.appearance.side_panel.group_by_instance_tooltip')"
                @change="setIsSidebarGroupByInstance"></simple-switch>
            <simple-switch
                v-if="isSidebarGroupByInstance"
                :label="t('view.settings.appearance.side_panel.hide_friends_in_same_instance')"
                :value="isHideFriendsInSameInstance"
                :tooltip="t('view.settings.appearance.side_panel.hide_friends_in_same_instance_tooltip')"
                @change="setIsHideFriendsInSameInstance"></simple-switch>
            <simple-switch
                :label="t('view.settings.appearance.side_panel.split_favorite_friends')"
                :value="isSidebarDivideByFriendGroup"
                :tooltip="t('view.settings.appearance.side_panel.split_favorite_friends_tooltip')"
                @change="setIsSidebarDivideByFriendGroup"></simple-switch>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.user_dialog.header') }}</span>
            <simple-switch
                :label="t('view.settings.appearance.user_dialog.vrchat_notes')"
                :value="!hideUserNotes"
                @change="setHideUserNotes" />
            <simple-switch
                :label="t('view.settings.appearance.user_dialog.vrcx_memos')"
                :value="!hideUserMemos"
                @change="setHideUserMemos" />
            <div class="options-container-item">
                <span class="name">{{
                    t('view.settings.appearance.user_dialog.export_vrcx_memos_into_vrchat_notes')
                }}</span>
            </div>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.friend_log.header') }}</span>
            <simple-switch
                :label="t('view.settings.appearance.friend_log.hide_unfriends')"
                :value="hideUnfriends"
                @change="setHideUnfriends"></simple-switch>
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.user_colors.header') }}</span>
            <simple-switch
                :label="t('view.settings.appearance.user_colors.random_colors_from_user_id')"
                :value="randomUserColours"
                @change="updateTrustColor('', '', true)"></simple-switch>
            <div>
                <div>
                    <span class="text-[18px] align-top x-tag-untrusted">Visitor</span>
                    <PresetColorPicker
                        :model-value="trustColor.untrusted"
                        :presets="['#CCCCCC']"
                        @change="updateTrustColor('untrusted', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-basic">New User</span>
                    <PresetColorPicker
                        :model-value="trustColor.basic"
                        :presets="['#1778ff']"
                        @change="updateTrustColor('basic', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-known">User</span>
                    <PresetColorPicker
                        :model-value="trustColor.known"
                        :presets="['#2bcf5c']"
                        @change="updateTrustColor('known', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-trusted">Known User</span>
                    <PresetColorPicker
                        :model-value="trustColor.trusted"
                        :presets="['#ff7b42']"
                        @change="updateTrustColor('trusted', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-veteran">Trusted User</span>
                    <PresetColorPicker
                        :model-value="trustColor.veteran"
                        :presets="['#b18fff', '#8143e6', '#ff69b4', '#b52626', '#ffd000', '#abcdef']"
                        @change="updateTrustColor('veteran', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-vip">VRChat Team</span>
                    <PresetColorPicker
                        :model-value="trustColor.vip"
                        :presets="['#ff2626']"
                        @change="updateTrustColor('vip', $event)" />
                </div>
                <div>
                    <span class="text-[18px] align-top x-tag-troll">Nuisance</span>
                    <PresetColorPicker
                        :model-value="trustColor.troll"
                        :presets="['#782f2f']"
                        @change="updateTrustColor('troll', $event)" />
                </div>
            </div>
        </div>
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
    import { ArrowRight, CheckIcon, ChevronDown, Info } from 'lucide-vue-next';
    import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { useAppearanceSettingsStore, useFavoriteStore, useVrStore } from '@/stores';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { getLanguageName, languageCodes } from '@/localization';
    import { APP_FONT_FAMILIES } from '@/shared/constants';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import PresetColorPicker from '@/components/PresetColorPicker.vue';

    import SimpleSwitch from '../SimpleSwitch.vue';

    const { t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { saveOpenVROption, updateVRConfigVars } = useVrStore();

    const {
        appLanguage,
        displayVRCPlusIconsAsAvatar,
        appFontFamily,
        hideNicknames,
        showInstanceIdInLocation,
        isAgeGatedInstancesVisible,
        sortFavorites,
        instanceUsersSortAlphabetical,
        dtHour12,
        dtIsoFormat,
        sidebarSortMethod1,
        sidebarSortMethod2,
        sidebarSortMethod3,
        isSidebarGroupByInstance,
        isHideFriendsInSameInstance,
        isSidebarDivideByFriendGroup,
        hideUserNotes,
        hideUserMemos,
        hideUnfriends,
        randomUserColours,
        trustColor,
        notificationIconDot,
        tablePageSizes,
        isDataTableStriped,
        showPointerOnHover
    } = storeToRefs(appearanceSettingsStore);

    const appLanguageDisplayName = computed(() => getLanguageName(String(appLanguage.value)));

    const { saveSortFavoritesOption } = useFavoriteStore();

    const {
        setDisplayVRCPlusIconsAsAvatar,
        setHideNicknames,
        setShowInstanceIdInLocation,
        setIsAgeGatedInstancesVisible,
        setInstanceUsersSortAlphabetical,
        setDtHour12,
        setDtIsoFormat,
        setSidebarSortMethod1,
        setSidebarSortMethod2,
        setSidebarSortMethod3,
        setIsSidebarGroupByInstance,
        setIsHideFriendsInSameInstance,
        setIsSidebarDivideByFriendGroup,
        setHideUserNotes,
        setHideUserMemos,
        setHideUnfriends,
        updateTrustColor,
        changeAppLanguage,
        promptMaxTableSizeDialog,
        setNotificationIconDot,
        setTablePageSizes,
        toggleStripedDataTable,
        togglePointerOnHover,
        setAppFontFamily
    } = appearanceSettingsStore;

    const appFontFamilyOptions = computed(() => {
        const fontKeys = APP_FONT_FAMILIES.filter((key) => key !== 'system_ui');
        return [
            ...fontKeys.map((key) => ({ type: 'item', key })),
            { type: 'separator', key: 'separator-system-ui' },
            { type: 'item', key: 'system_ui' }
        ];
    });

    const zoomLevel = ref(100);
    const isLinux = computed(() => LINUX);
    let cleanupWheel = null;

    onBeforeUnmount(() => {
        if (cleanupWheel) {
            cleanupWheel();
        }
    });

    initGetZoomLevel();

    function handleSortFavoritesRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== sortFavorites.value) {
            saveSortFavoritesOption();
        }
    }

    function handleInstanceUsersSortAlphabeticalRadio(value) {
        const nextValue = value === 'true';
        if (nextValue !== instanceUsersSortAlphabetical.value) {
            setInstanceUsersSortAlphabetical();
        }
    }

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

    const SELECT_CLEAR_VALUE = '__clear__';

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

    async function getZoomLevel() {
        zoomLevel.value = ((await AppApi.GetZoom()) + 10) * 10;
    }

    function setZoomLevel() {
        AppApi.SetZoom(zoomLevel.value / 10 - 10);
    }
</script>
