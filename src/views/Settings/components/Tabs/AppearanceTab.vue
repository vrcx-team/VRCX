<template>
    <div>
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.settings.appearance.appearance.header') }}</span>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.language') }}</span>
                <el-dropdown trigger="click" size="small" @click.stop>
                    <el-button size="small">
                        <span
                            >{{ messages[appLanguage]?.language }}
                            <el-icon class="el-icon--right"><ArrowDown /></el-icon
                        ></span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="(obj, language) in messages"
                                :key="language"
                                :class="{ 'is-active': appLanguage === language }"
                                @click="changeAppLanguage(language)"
                                v-text="obj.language" />
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.theme_mode') }}</span>
                <el-dropdown trigger="click" size="small" @click.stop>
                    <el-button size="small">
                        <span
                            >{{ t(`view.settings.appearance.appearance.theme_mode_${themeMode}`) }}
                            <el-icon class="el-icon--right"><ArrowDown /></el-icon
                        ></span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="(config, themeKey) in THEME_CONFIG"
                                :key="themeKey"
                                @click="saveThemeMode(themeKey)"
                                :class="{ 'is-active': themeMode === themeKey }">
                                {{ t(`view.settings.appearance.appearance.theme_mode_${themeKey}`) }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <div v-if="!isLinux" class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.zoom') }}</span>
                <el-input-number
                    v-model="zoomLevel"
                    size="small"
                    :precision="0"
                    style="width: 128px"
                    @change="setZoomLevel" />
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
                :label="t('view.settings.appearance.appearance.nicknames')"
                :value="!hideNicknames"
                @change="
                    setHideNicknames();
                    saveOpenVROption();
                " />
            <simple-switch
                :label="t('view.settings.appearance.appearance.age_gated_instances')"
                :value="isAgeGatedInstancesVisible"
                @change="setIsAgeGatedInstancesVisible" />
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.sort_favorite_by') }}</span>
                <el-radio-group :model-value="sortFavorites" @change="saveSortFavoritesOption">
                    <el-radio :value="false">{{
                        t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :value="true">{{
                        t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
            </div>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.appearance.sort_instance_users_by') }}</span>
                <el-radio-group :model-value="instanceUsersSortAlphabetical" @change="setInstanceUsersSortAlphabetical">
                    <el-radio :value="false">{{
                        t('view.settings.appearance.appearance.sort_instance_users_by_time')
                    }}</el-radio>
                    <el-radio :value="true">{{
                        t('view.settings.appearance.appearance.sort_instance_users_by_alphabet')
                    }}</el-radio>
                </el-radio-group>
            </div>
            <div class="options-container-item">
                <el-button size="small" :icon="Notebook" style="margin-right: 10px" @click="promptMaxTableSizeDialog">{{
                    t('view.settings.appearance.appearance.table_max_size')
                }}</el-button>
            </div>
            <div class="options-container-item" />
        </div>
        <div class="options-container">
            <span class="header">{{ t('view.settings.appearance.timedate.header') }}</span>
            <div class="options-container-item">
                <span class="name">{{ t('view.settings.appearance.timedate.time_format') }}</span>
                <el-radio-group
                    :model-value="dtHour12"
                    @change="
                        setDtHour12();
                        updateVRConfigVars();
                    ">
                    <el-radio :value="true">{{ t('view.settings.appearance.timedate.time_format_12') }}</el-radio>
                    <el-radio :value="false">{{ t('view.settings.appearance.timedate.time_format_24') }}</el-radio>
                </el-radio-group>
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
                <el-select
                    :model-value="sidebarSortMethod1"
                    style="width: 170px"
                    :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                    @change="setSidebarSortMethod1($event)">
                    <el-option-group :label="t('view.settings.appearance.side_panel.sorting.dropdown_header')">
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.alphabetical')"
                            value="Sort Alphabetically"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.status')"
                            value="Sort by Status"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.private_to_bottom')"
                            value="Sort Private to Bottom"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_active')"
                            value="Sort by Last Active"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_seen')"
                            value="Sort by Last Seen"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.time_in_instance')"
                            value="Sort by Time in Instance"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.location')"
                            value="Sort by Location"></el-option>
                    </el-option-group>
                </el-select>
                <el-icon style="padding: 5px"><ArrowRight /></el-icon>
                <el-select
                    :model-value="sidebarSortMethod2"
                    :disabled="!sidebarSortMethod1"
                    style="width: 170px"
                    clearable
                    :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                    @change="setSidebarSortMethod2($event)">
                    <el-option-group :label="t('view.settings.appearance.side_panel.sorting.dropdown_header')">
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.alphabetical')"
                            value="Sort Alphabetically"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.status')"
                            value="Sort by Status"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.private_to_bottom')"
                            value="Sort Private to Bottom"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_active')"
                            value="Sort by Last Active"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_seen')"
                            value="Sort by Last Seen"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.time_in_instance')"
                            value="Sort by Time in Instance"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.location')"
                            value="Sort by Location"></el-option>
                    </el-option-group>
                </el-select>
                <el-icon style="padding: 5px"><ArrowRight /></el-icon>
                <el-select
                    :model-value="sidebarSortMethod3"
                    :disabled="!sidebarSortMethod2"
                    style="width: 170px"
                    clearable
                    :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                    @change="setSidebarSortMethod3($event)">
                    <el-option-group :label="t('view.settings.appearance.side_panel.sorting.dropdown_header')">
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.alphabetical')"
                            value="Sort Alphabetically"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.status')"
                            value="Sort by Status"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.private_to_bottom')"
                            value="Sort Private to Bottom"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_active')"
                            value="Sort by Last Active"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.last_seen')"
                            value="Sort by Last Seen"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.time_in_instance')"
                            value="Sort by Time in Instance"></el-option>
                        <el-option
                            class="x-friend-item"
                            :label="t('view.settings.appearance.side_panel.sorting.location')"
                            value="Sort by Location"></el-option>
                    </el-option-group>
                </el-select>
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
            <div class="options-container-item">
                <div>
                    <el-color-picker
                        :model-value="trustColor.untrusted"
                        size="small"
                        :predefine="['#CCCCCC']"
                        @change="updateTrustColor('untrusted', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-untrusted">Visitor</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.basic"
                        size="small"
                        :predefine="['#1778ff']"
                        @change="updateTrustColor('basic', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-basic">New User</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.known"
                        size="small"
                        :predefine="['#2bcf5c']"
                        @change="updateTrustColor('known', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-known">User</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.trusted"
                        size="small"
                        :predefine="['#ff7b42']"
                        @change="updateTrustColor('trusted', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-trusted">Known User</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.veteran"
                        size="small"
                        :predefine="['#b18fff', '#8143e6', '#ff69b4', '#b52626', '#ffd000', '#abcdef']"
                        @change="updateTrustColor('veteran', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-veteran">Trusted User</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.vip"
                        size="small"
                        :predefine="['#ff2626']"
                        @change="updateTrustColor('vip', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-vip">VRChat Team</span>
                </div>
                <div>
                    <el-color-picker
                        :model-value="trustColor.troll"
                        size="small"
                        :predefine="['#782f2f']"
                        @change="updateTrustColor('troll', $event)">
                    </el-color-picker>
                    <span class="color-picker x-tag-troll">Nuisance</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ArrowDown, ArrowRight, Notebook } from '@element-plus/icons-vue';
    import { computed, onBeforeUnmount, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFavoriteStore, useVrStore } from '../../../../stores';
    import { THEME_CONFIG } from '../../../../shared/constants';

    import SimpleSwitch from '../SimpleSwitch.vue';

    const { messages, t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { saveOpenVROption, updateVRConfigVars } = useVrStore();

    const {
        appLanguage,
        themeMode,
        displayVRCPlusIconsAsAvatar,
        hideNicknames,
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
        notificationIconDot
    } = storeToRefs(appearanceSettingsStore);

    const { saveSortFavoritesOption } = useFavoriteStore();

    const {
        setDisplayVRCPlusIconsAsAvatar,
        setHideNicknames,
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
        saveThemeMode,
        changeAppLanguage,
        promptMaxTableSizeDialog,
        setNotificationIconDot
    } = appearanceSettingsStore;

    const zoomLevel = ref(100);
    const isLinux = computed(() => LINUX);
    let cleanupWheel = null;

    onBeforeUnmount(() => {
        if (cleanupWheel) {
            cleanupWheel();
        }
    });

    initGetZoomLevel();

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
