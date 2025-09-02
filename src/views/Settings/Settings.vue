<template>
    <div v-show="menuActiveIndex === 'settings'" class="x-container">
        <div class="options-container" style="margin-top: 0; padding: 5px">
            <span class="header">{{ t('view.settings.header') }}</span>
        </div>
        <el-tabs type="card" style="height: calc(100% - 51px)">
            <!--//- General Tab-->
            <el-tab-pane :label="t('view.settings.category.general')">
                <!--//- General | General-->
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.general.general.header') }}</span>
                    <div class="x-friend-list" style="margin-top: 10px">
                        <!--//- General | General | Version-->
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">{{ t('view.settings.general.general.version') }}</span>
                                <span class="extra" v-text="appVersion"></span>
                            </div>
                        </div>
                        <!--//- General | General | Latest App Version-->
                        <div class="x-friend-item" @click="checkForVRCXUpdate">
                            <div class="detail">
                                <span class="name">{{ t('view.settings.general.general.latest_app_version') }}</span>
                                <span v-if="latestAppVersion" class="extra" v-text="latestAppVersion"></span>
                                <span v-else class="extra">{{
                                    t('view.settings.general.general.latest_app_version_refresh')
                                }}</span>
                            </div>
                        </div>
                        <!--//- General | General | Repository URL-->
                        <div class="x-friend-item" @click="openExternalLink('https://github.com/vrcx-team/VRCX')">
                            <div class="detail">
                                <span class="name">{{ t('view.settings.general.general.repository_url') }}</span>
                                <span v-once class="extra">https://github.com/vrcx-team/VRCX</span>
                            </div>
                        </div>
                        <!--//- General | General | Support-->
                        <div class="x-friend-item" @click="openExternalLink('https://vrcx.app/discord')">
                            <div class="detail">
                                <span class="name">{{ t('view.settings.general.general.support') }}</span>
                                <span v-once class="extra">https://vrcx.app/discord</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!--//- General | VRCX Updater-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.vrcx_updater.header') }}</span>
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-document" @click="showChangeLogDialog">{{
                            t('view.settings.general.vrcx_updater.change_log')
                        }}</el-button>
                        <el-button size="small" icon="el-icon-upload" @click="showVRCXUpdateDialog()">{{
                            t('view.settings.general.vrcx_updater.change_build')
                        }}</el-button>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.general.vrcx_updater.update_action') }}</span>
                        <br />
                        <el-radio-group
                            :value="autoUpdateVRCX"
                            size="mini"
                            style="margin-top: 5px"
                            @input="setAutoUpdateVRCX">
                            <el-radio-button label="Off">{{
                                t('view.settings.general.vrcx_updater.auto_update_off')
                            }}</el-radio-button>
                            <el-radio-button label="Notify">{{
                                t('view.settings.general.vrcx_updater.auto_update_notify')
                            }}</el-radio-button>
                            <el-radio-button label="Auto Download">{{
                                t('view.settings.general.vrcx_updater.auto_update_download')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                </div>
                <!--//- General | Application-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.application.header') }}</span>
                    <simple-switch
                        v-if="!isLinux"
                        :label="t('view.settings.general.application.startup')"
                        :value="isStartAtWindowsStartup"
                        @change="setIsStartAtWindowsStartup" />
                    <simple-switch
                        v-if="!isLinux"
                        :label="t('view.settings.general.application.minimized')"
                        :value="isStartAsMinimizedState"
                        @change="setIsStartAsMinimizedState" />
                    <simple-switch
                        v-else
                        :label="t('view.settings.general.application.minimized')"
                        :value="isStartAsMinimizedState"
                        :tooltip="t('view.settings.general.application.startup_linux')"
                        @change="setIsStartAsMinimizedState" />
                    <simple-switch
                        :label="t('view.settings.general.application.tray')"
                        :value="isCloseToTray"
                        @change="setIsCloseToTray" />
                    <simple-switch
                        v-if="!isLinux"
                        :label="t('view.settings.general.application.disable_gpu_acceleration')"
                        :value="disableGpuAcceleration"
                        :tooltip="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                        @change="setDisableGpuAcceleration" />
                    <simple-switch
                        v-if="!isLinux"
                        :label="t('view.settings.general.application.disable_vr_overlay_gpu_acceleration')"
                        :value="disableVrOverlayGpuAcceleration"
                        :tooltip="t('view.settings.general.application.disable_gpu_acceleration_tooltip')"
                        @change="setDisableVrOverlayGpuAcceleration" />
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-connection" @click="promptProxySettings">{{
                            t('view.settings.general.application.proxy')
                        }}</el-button>
                    </div>
                </div>
                <!--//- General | Favorite-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.favorites.header') }}</span>
                    <br />
                    <el-select
                        :value="localFavoriteFriendsGroups"
                        multiple
                        clearable
                        :placeholder="t('view.settings.general.favorites.group_placeholder')"
                        style="margin-top: 8px"
                        @change="setLocalFavoriteFriendsGroups">
                        <el-option-group :label="t('view.settings.general.favorites.group_placeholder')">
                            <el-option
                                v-for="group in favoriteFriendGroups"
                                :key="group.key"
                                :label="group.displayName"
                                :value="group.key"
                                class="x-friend-item">
                                <div class="detail">
                                    <span class="name" v-text="group.displayName"></span>
                                </div>
                            </el-option>
                        </el-option-group>
                    </el-select>
                </div>
                <!--//- General | Game Log-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.logging.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.cache_debug.udon_exception_logging')"
                        :value="udonExceptionLogging"
                        @change="
                            setUdonExceptionLogging();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.general.logging.resource_load')"
                        :value="logResourceLoad"
                        @change="setLogResourceLoad" />
                    <simple-switch
                        :label="t('view.settings.general.logging.empty_avatar')"
                        :value="logEmptyAvatars"
                        @change="setLogEmptyAvatars" />
                </div>
                <!--//- General | Automation-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.automation.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.general.automation.auto_change_status')"
                        :value="autoStateChangeEnabled"
                        :tooltip="t('view.settings.general.automation.auto_state_change_tooltip')"
                        @change="setAutoStateChangeEnabled" />
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.general.automation.alone_status') }}</span>
                        <el-select
                            :value="autoStateChangeAloneStatus"
                            :disabled="!autoStateChangeEnabled"
                            style="margin-top: 8px"
                            size="small"
                            @change="setAutoStateChangeAloneStatus">
                            <el-option :label="t('dialog.user.status.join_me')" value="join me">
                                <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.online')" value="active">
                                <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.ask_me')" value="ask me">
                                <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.busy')" value="busy">
                                <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                            </el-option>
                        </el-select>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.general.automation.company_status') }}</span>
                        <el-select
                            :value="autoStateChangeCompanyStatus"
                            :disabled="!autoStateChangeEnabled"
                            style="margin-top: 8px"
                            size="small"
                            @change="setAutoStateChangeCompanyStatus">
                            <el-option :label="t('dialog.user.status.join_me')" value="join me">
                                <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.online')" value="active">
                                <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.ask_me')" value="ask me">
                                <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                            </el-option>
                            <el-option :label="t('dialog.user.status.busy')" value="busy">
                                <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                            </el-option>
                        </el-select>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.general.automation.allowed_instance_types') }}</span>
                        <el-select
                            :value="autoStateChangeInstanceTypes"
                            :disabled="!autoStateChangeEnabled"
                            multiple
                            clearable
                            :placeholder="t('view.settings.general.automation.instance_type_placeholder')"
                            style="margin-top: 8px"
                            size="small"
                            @change="setAutoStateChangeInstanceTypes">
                            <el-option-group :label="t('view.settings.general.automation.allowed_instance_types')">
                                <el-option
                                    v-for="instanceType in instanceTypes"
                                    :key="instanceType"
                                    :label="instanceType"
                                    :value="instanceType"
                                    class="x-friend-item">
                                    <div class="detail">
                                        <span class="name" v-text="instanceType"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.general.automation.alone_condition') }}</span>
                        <el-radio-group
                            :value="autoStateChangeNoFriends"
                            :disabled="!autoStateChangeEnabled"
                            @change="setAutoStateChangeNoFriends">
                            <el-radio :label="false">{{ t('view.settings.general.automation.alone') }}</el-radio>
                            <el-radio :label="true">{{ t('view.settings.general.automation.no_friends') }}</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.general.automation.auto_invite_request_accept') }}
                            <el-tooltip
                                placement="top"
                                style="margin-left: 5px"
                                :content="t('view.settings.general.automation.auto_invite_request_accept_tooltip')">
                                <i class="el-icon-info"></i>
                            </el-tooltip>
                        </span>
                        <br />
                        <el-radio-group
                            :value="autoAcceptInviteRequests"
                            size="mini"
                            style="margin-top: 5px"
                            @input="setAutoAcceptInviteRequests">
                            <el-radio-button label="Off">{{
                                t('view.settings.general.automation.auto_invite_request_accept_off')
                            }}</el-radio-button>
                            <el-radio-button label="All Favorites">{{
                                t('view.settings.general.automation.auto_invite_request_accept_favs')
                            }}</el-radio-button>
                            <el-radio-button label="Selected Favorites">{{
                                t('view.settings.general.automation.auto_invite_request_accept_selected_favs')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                </div>
                <!--//- General | Contributors-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.general.contributors.header') }}</span>
                    <div class="options-container-item">
                        <img
                            src="https://contrib.rocks/image?repo=vrcx-team/VRCX"
                            alt="Contributors"
                            style="cursor: pointer"
                            @click="openExternalLink('https://github.com/vrcx-team/VRCX/graphs/contributors')" />
                    </div>
                </div>
                <!--//- General | Legal Notice-->
                <div class="options-container" style="margin-top: 45px; border-top: 1px solid #eee; padding-top: 30px">
                    <span class="header">{{ t('view.settings.general.legal_notice.header') }}</span>
                    <div class="options-container-item">
                        <p>
                            &copy; 2019-2025
                            <a class="x-link" @click="openExternalLink('https://github.com/pypy-vrc')">pypy</a> &amp;
                            <a class="x-link" @click="openExternalLink('https://github.com/Natsumi-sama')">Natsumi</a>
                        </p>
                        <p>{{ t('view.settings.general.legal_notice.info') }}</p>
                        <p>{{ t('view.settings.general.legal_notice.disclaimer1') }}</p>
                        <p>{{ t('view.settings.general.legal_notice.disclaimer2') }}</p>
                    </div>
                    <div class="options-container-item">
                        <el-button size="small" @click="openOSSDialog">{{
                            t('view.settings.general.legal_notice.open_source_software_notice')
                        }}</el-button>
                    </div>
                </div>
            </el-tab-pane>

            <!--//- Appearance Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.appearance')">
                <div class="options-container" style="margin-top: 0">
                    <!--//- Appearance | Appearance-->
                    <span class="header">{{ t('view.settings.appearance.appearance.header') }}</span>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.appearance.language') }}</span>
                        <el-dropdown trigger="click" size="small" @click.native.stop>
                            <el-button size="mini">
                                <span
                                    >{{ messages[appLanguage]?.language }}
                                    <i class="el-icon-arrow-down el-icon--right"></i
                                ></span>
                            </el-button>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="(obj, language) in messages"
                                    :key="language"
                                    @click.native="changeAppLanguage(language)"
                                    v-text="obj.language" />
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.appearance.theme_mode') }}</span>
                        <el-dropdown trigger="click" size="small" @click.native.stop>
                            <el-button size="mini">
                                <span
                                    >{{ t(`view.settings.appearance.appearance.theme_mode_${themeMode}`) }}
                                    <i class="el-icon-arrow-down el-icon--right"></i
                                ></span>
                            </el-button>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="(config, themeKey) in THEME_CONFIG"
                                    :key="themeKey"
                                    @click.native="saveThemeMode(themeKey)"
                                    :class="{ 'is-active': themeMode === themeKey }">
                                    {{ t(`view.settings.appearance.appearance.theme_mode_${themeKey}`) }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
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
                        :label="t('view.settings.appearance.appearance.tooltips')"
                        :value="!hideTooltips"
                        @change="
                            setHideTooltips();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.appearance.appearance.age_gated_instances')"
                        :value="isAgeGatedInstancesVisible"
                        @change="setIsAgeGatedInstancesVisible" />
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.appearance.sort_favorite_by') }}</span>
                        <el-radio-group :value="sortFavorites" @change="saveSortFavoritesOption">
                            <el-radio :label="false">{{
                                t('view.settings.appearance.appearance.sort_favorite_by_name')
                            }}</el-radio>
                            <el-radio :label="true">{{
                                t('view.settings.appearance.appearance.sort_favorite_by_date')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.appearance.sort_instance_users_by') }}</span>
                        <el-radio-group
                            :value="instanceUsersSortAlphabetical"
                            @change="setInstanceUsersSortAlphabetical">
                            <el-radio :label="false">{{
                                t('view.settings.appearance.appearance.sort_instance_users_by_time')
                            }}</el-radio>
                            <el-radio :label="true">{{
                                t('view.settings.appearance.appearance.sort_instance_users_by_alphabet')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <el-button
                            size="small"
                            icon="el-icon-notebook-1"
                            style="margin-right: 10px"
                            @click="promptMaxTableSizeDialog"
                            >{{ t('view.settings.appearance.appearance.table_max_size') }}</el-button
                        >
                        <el-dropdown trigger="click" size="small" @click.native.stop>
                            <el-button size="small">
                                <span
                                    >{{ t('view.settings.appearance.appearance.page_size') }} {{ tablePageSize }}
                                    <i class="el-icon-arrow-down el-icon--right"></i
                                ></span>
                            </el-button>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="number in [10, 15, 20, 25, 50, 100]"
                                    :key="number"
                                    @click.native="handleSetTablePageSize(number)"
                                    v-text="number" />
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                    <div class="options-container-item" />
                </div>
                <!--//- Appearance | Time/Date-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.appearance.timedate.header') }}</span>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.timedate.time_format') }}</span>
                        <el-radio-group
                            :value="dtHour12"
                            @change="
                                setDtHour12();
                                updateVRConfigVars();
                            ">
                            <el-radio :label="true">{{
                                t('view.settings.appearance.timedate.time_format_12')
                            }}</el-radio>
                            <el-radio :label="false">{{
                                t('view.settings.appearance.timedate.time_format_24')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                    <simple-switch
                        :label="t('view.settings.appearance.timedate.force_iso_date_format')"
                        :value="dtIsoFormat"
                        @change="setDtIsoFormat" />
                </div>
                <!--//- Appearance | Side Panel-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.appearance.side_panel.header') }}</span>
                    <br />
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.appearance.side_panel.sorting.header') }}</span>
                        <el-select
                            :value="sidebarSortMethod1"
                            style="width: 170px"
                            :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                            @change="
                                setSidebarSortMethod1($event);
                                saveSidebarSortOrder();
                            ">
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
                        <i class="el-icon-arrow-right" style="margin: 16px 5px"></i>
                        <el-select
                            :value="sidebarSortMethod2"
                            :disabled="!sidebarSortMethod1"
                            style="width: 170px"
                            clearable
                            :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                            @change="
                                setSidebarSortMethod2($event);
                                saveSidebarSortOrder();
                            ">
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
                        <i class="el-icon-arrow-right" style="margin: 16px 5px"></i>
                        <el-select
                            :value="sidebarSortMethod3"
                            :disabled="!sidebarSortMethod2"
                            style="width: 170px"
                            clearable
                            :placeholder="t('view.settings.appearance.side_panel.sorting.placeholder')"
                            @change="
                                setSidebarSortMethod3($event);
                                saveSidebarSortOrder();
                            ">
                            <el-option-group :label="t('view.settings.appearance.side_panel.sorting.dropdown_header')">
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.alphabetical')"
                                    value="Sort Alphabetically" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.status')"
                                    value="Sort by Status" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.private_to_bottom')"
                                    value="Sort Private to Bottom" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.last_active')"
                                    value="Sort by Last Active" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.last_seen')"
                                    value="Sort by Last Seen" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.time_in_instance')"
                                    value="Sort by Time in Instance" />
                                <el-option
                                    class="x-friend-item"
                                    :label="t('view.settings.appearance.side_panel.sorting.location')"
                                    value="Sort by Location" />
                            </el-option-group>
                        </el-select>
                    </div>
                    <div class="options-container-item">
                        <span class="name" style="vertical-align: top; padding-top: 10px">{{
                            t('view.settings.appearance.side_panel.width')
                        }}</span>
                        <el-slider
                            :value="asideWidth"
                            :show-tooltip="false"
                            :marks="{ 300: '' }"
                            :min="200"
                            :max="500"
                            style="display: inline-block; width: 300px"
                            @input="setAsideWidth"></el-slider>
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
                <!--//- Appearance | User Dialog-->
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
                    <!-- redirect to tools tab -->
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.appearance.user_dialog.export_vrcx_memos_into_vrchat_notes')
                        }}</span>
                        <br />
                        <el-button
                            size="small"
                            icon="el-icon-document-copy"
                            style="margin-top: 5px"
                            @click="showNoteExportDialog"
                            >{{ t('view.settings.appearance.user_dialog.export_notes') }}</el-button
                        >
                    </div>
                    <!-- redirect to tools tab end -->
                </div>
                <!--//- Appearance | Friend Log-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.appearance.friend_log.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.appearance.friend_log.hide_unfriends')"
                        :value="hideUnfriends"
                        @change="setHideUnfriends"></simple-switch>
                </div>
                <!--//- Appearance | User Colors-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.appearance.user_colors.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.appearance.user_colors.random_colors_from_user_id')"
                        :value="randomUserColours"
                        @change="updateTrustColor('', '', true)"></simple-switch>
                    <div class="options-container-item">
                        <div>
                            <el-color-picker
                                :value="trustColor.untrusted"
                                size="mini"
                                :predefine="['#CCCCCC']"
                                @change="updateTrustColor('untrusted', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-untrusted">Visitor</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.basic"
                                size="mini"
                                :predefine="['#1778ff']"
                                @change="updateTrustColor('basic', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-basic">New User</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.known"
                                size="mini"
                                :predefine="['#2bcf5c']"
                                @change="updateTrustColor('known', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-known">User</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.trusted"
                                size="mini"
                                :predefine="['#ff7b42']"
                                @change="updateTrustColor('trusted', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-trusted">Known User</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.veteran"
                                size="mini"
                                :predefine="['#b18fff', '#8143e6', '#ff69b4', '#b52626', '#ffd000', '#abcdef']"
                                @change="updateTrustColor('veteran', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-veteran">Trusted User</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.vip"
                                size="mini"
                                :predefine="['#ff2626']"
                                @change="updateTrustColor('vip', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-vip">VRChat Team</span>
                        </div>
                        <div>
                            <el-color-picker
                                :value="trustColor.troll"
                                size="mini"
                                :predefine="['#782f2f']"
                                @change="updateTrustColor('troll', $event)">
                            </el-color-picker>
                            <span slot="trigger" class="color-picker x-tag-troll">Nuisance</span>
                        </div>
                    </div>
                </div>
            </el-tab-pane>

            <!--//- Notifications Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.notifications')">
                <!--//- Notifications | Notifications-->
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.notifications.notifications.header') }}</span>
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-chat-square" @click="showNotyFeedFiltersDialog">{{
                            t('view.settings.notifications.notifications.notification_filter')
                        }}</el-button>
                    </div>
                </div>

                <div class="options-container">
                    <span class="sub-header">{{
                        t('view.settings.notifications.notifications.steamvr_notifications.header')
                    }}</span>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.notifications.notifications.desktop_notifications.when_to_display')
                        }}</span>
                        <br />
                        <el-radio-group
                            :value="overlayToast"
                            size="mini"
                            :disabled="
                                (!overlayNotifications || !openVR) &&
                                !xsNotifications &&
                                !ovrtHudNotifications &&
                                !ovrtWristNotifications
                            "
                            style="margin-top: 5px"
                            @input="
                                setOverlayToast($event);
                                saveOpenVROption();
                            ">
                            <el-radio-button label="Never">{{
                                t('view.settings.notifications.notifications.conditions.never')
                            }}</el-radio-button>
                            <el-radio-button label="Game Running">{{
                                t('view.settings.notifications.notifications.conditions.inside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Game Closed">{{
                                t('view.settings.notifications.notifications.conditions.outside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Always">{{
                                t('view.settings.notifications.notifications.conditions.always')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <template>
                        <simple-switch
                            :label="
                                t('view.settings.notifications.notifications.steamvr_notifications.steamvr_overlay')
                            "
                            :value="openVR"
                            @change="
                                setOpenVR();
                                saveOpenVROption();
                            " />
                        <simple-switch
                            :label="
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.overlay_notifications'
                                )
                            "
                            :value="overlayNotifications"
                            :disabled="!openVR"
                            @change="
                                setOverlayNotifications();
                                saveOpenVROption();
                            " />
                        <div class="options-container-item">
                            <el-button
                                size="small"
                                icon="el-icon-rank"
                                :disabled="!overlayNotifications || !openVR"
                                @click="showNotificationPositionDialog"
                                >{{
                                    t(
                                        'view.settings.notifications.notifications.steamvr_notifications.notification_position'
                                    )
                                }}</el-button
                            >
                        </div>
                        <div class="options-container-item">
                            <span class="name" style="vertical-align: top; padding-top: 10px">{{
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.notification_opacity'
                                )
                            }}</span>
                            <el-slider
                                :value="notificationOpacity"
                                @input="setNotificationOpacity"
                                :show-tooltip="false"
                                :min="0"
                                :max="100"
                                show-input
                                style="display: inline-block; width: 300px" />
                        </div>
                        <div class="options-container-item">
                            <el-button
                                size="small"
                                icon="el-icon-time"
                                :disabled="(!overlayNotifications || !openVR) && !xsNotifications"
                                @click="promptNotificationTimeout"
                                >{{
                                    t(
                                        'view.settings.notifications.notifications.steamvr_notifications.notification_timeout'
                                    )
                                }}</el-button
                            >
                        </div>
                        <simple-switch
                            :label="t('view.settings.notifications.notifications.steamvr_notifications.user_images')"
                            :value="imageNotifications"
                            @change="
                                setImageNotifications();
                                saveOpenVROption();
                            " />
                    </template>
                    <template v-if="!isLinux">
                        <simple-switch
                            :label="
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.xsoverlay_notifications'
                                )
                            "
                            :value="xsNotifications"
                            @change="
                                setXsNotifications();
                                saveOpenVROption();
                            " />
                    </template>
                    <template v-else>
                        <simple-switch
                            :label="
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.wlxoverlay_notifications'
                                )
                            "
                            :value="xsNotifications"
                            @change="
                                setXsNotifications();
                                saveOpenVROption();
                            " />
                    </template>
                    <template v-if="!isLinux">
                        <simple-switch
                            :label="
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_hud_notifications'
                                )
                            "
                            :value="ovrtHudNotifications"
                            @change="
                                setOvrtHudNotifications();
                                saveOpenVROption();
                            " />
                        <simple-switch
                            :label="
                                t(
                                    'view.settings.notifications.notifications.steamvr_notifications.ovrtoolkit_wrist_notifications'
                                )
                            "
                            :value="ovrtWristNotifications"
                            @change="
                                setOvrtWristNotifications();
                                saveOpenVROption();
                            " />
                    </template>
                </div>
                <!--//- Notifications | Notifications | Desktop Notifications-->
                <div class="options-container">
                    <span class="sub-header">{{
                        t('view.settings.notifications.notifications.desktop_notifications.header')
                    }}</span>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.notifications.notifications.desktop_notifications.when_to_display')
                        }}</span>
                        <br />
                        <el-radio-group
                            :value="desktopToast"
                            size="mini"
                            style="margin-top: 5px"
                            @input="
                                setDesktopToast($event);
                                saveOpenVROption();
                            ">
                            <el-radio-button label="Never">{{
                                t('view.settings.notifications.notifications.conditions.never')
                            }}</el-radio-button>
                            <el-radio-button label="Desktop Mode">{{
                                t('view.settings.notifications.notifications.conditions.desktop')
                            }}</el-radio-button>
                            <el-radio-button label="Inside VR">{{
                                t('view.settings.notifications.notifications.conditions.inside_vr')
                            }}</el-radio-button>
                            <el-radio-button label="Outside VR">{{
                                t('view.settings.notifications.notifications.conditions.outside_vr')
                            }}</el-radio-button>
                            <el-radio-button label="Game Running">{{
                                t('view.settings.notifications.notifications.conditions.inside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Game Closed">{{
                                t('view.settings.notifications.notifications.conditions.outside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Always">{{
                                t('view.settings.notifications.notifications.conditions.always')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <simple-switch
                        :label="
                            t(
                                'view.settings.notifications.notifications.desktop_notifications.desktop_notification_while_afk'
                            )
                        "
                        :value="afkDesktopToast"
                        @change="
                            setAfkDesktopToast();
                            saveOpenVROption();
                        " />
                </div>
                <!--//- Notifications | Notifications | Text-to-Speech Options-->
                <div class="options-container">
                    <span class="sub-header">{{
                        t('view.settings.notifications.notifications.text_to_speech.header')
                    }}</span>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.notifications.notifications.text_to_speech.when_to_play')
                        }}</span>
                        <br />
                        <el-radio-group
                            :value="notificationTTS"
                            size="mini"
                            style="margin-top: 5px"
                            @input="saveNotificationTTS">
                            <el-radio-button label="Never">{{
                                t('view.settings.notifications.notifications.conditions.never')
                            }}</el-radio-button>
                            <el-radio-button label="Inside VR">{{
                                t('view.settings.notifications.notifications.conditions.inside_vr')
                            }}</el-radio-button>
                            <el-radio-button label="Game Running">{{
                                t('view.settings.notifications.notifications.conditions.inside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Game Closed">{{
                                t('view.settings.notifications.notifications.conditions.outside_vrchat')
                            }}</el-radio-button>
                            <el-radio-button label="Always">{{
                                t('view.settings.notifications.notifications.conditions.always')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.notifications.notifications.text_to_speech.tts_voice')
                        }}</span>
                        <el-dropdown trigger="click" size="small" @command="(voice) => changeTTSVoice(voice)">
                            <el-button size="mini" :disabled="notificationTTS === 'Never'">
                                <span>{{ getTTSVoiceName() }} <i class="el-icon-arrow-down el-icon--right"></i></span>
                            </el-button>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="(voice, index) in TTSvoices"
                                    :key="index"
                                    :command="index"
                                    v-text="voice.name" />
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                    <simple-switch
                        :label="t('view.settings.notifications.notifications.text_to_speech.use_memo_nicknames')"
                        :value="notificationTTSNickName"
                        :disabled="notificationTTS === 'Never'"
                        @change="
                            setNotificationTTSNickName();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')"
                        :value="isTestTTSVisible"
                        @change="isTestTTSVisible = !isTestTTSVisible" />
                    <div v-if="isTestTTSVisible" style="margin-top: 5px">
                        <el-input
                            v-model="notificationTTSTest"
                            type="textarea"
                            :placeholder="
                                t('view.settings.notifications.notifications.text_to_speech.tts_test_placeholder')
                            "
                            :rows="1"
                            style="width: 175px; display: inline-block"></el-input>
                        <el-button
                            size="small"
                            icon="el-icon-video-play"
                            style="margin-left: 10px"
                            @click="testNotificationTTS"
                            >{{ t('view.settings.notifications.notifications.text_to_speech.play') }}</el-button
                        >
                    </div>
                </div>
            </el-tab-pane>

            <!--//- Wrist Overlay Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.wrist_overlay')">
                <!--//- Wrist Overlay | SteamVR Wrist Overlay-->
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.header') }}</span>
                    <div class="options-container-item">
                        <el-button
                            size="small"
                            icon="el-icon-notebook-2"
                            :disabled="!openVR || !overlayWrist"
                            @click="showWristFeedFiltersDialog"
                            >{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_filters') }}</el-button
                        >
                    </div>
                    <div class="options-container-item">
                        <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.description') }}</span>
                        <br />
                        <br />
                        <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.grip') }}</span>
                        <br />
                        <span>{{ t('view.settings.wrist_overlay.steamvr_wrist_overlay.menu') }}</span>
                        <br />
                    </div>
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.steamvr_overlay')"
                        :value="openVR"
                        @change="
                            setOpenVR();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.wrist_feed_overlay')"
                        :value="overlayWrist"
                        :disabled="!openVR"
                        @change="
                            setOverlayWrist();
                            saveOpenVROption();
                        "></simple-switch>
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.hide_private_worlds')"
                        :value="hidePrivateFromFeed"
                        @change="
                            setHidePrivateFromFeed();
                            saveOpenVROption();
                        " />
                    <div class="options-container-item" style="min-width: 118px">
                        <span class="name">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.start_overlay_with')
                        }}</span>
                        <el-radio-group
                            :value="openVRAlways"
                            :disabled="!openVR"
                            @change="
                                setOpenVRAlways();
                                saveOpenVROption();
                            ">
                            <el-radio :label="false">{{ 'VRChat' }}</el-radio>
                            <el-radio :label="true">{{ 'SteamVR' }}</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button')
                        }}</span>
                        <el-radio-group
                            :value="overlaybutton"
                            :disabled="!openVR || !overlayWrist"
                            @change="
                                setOverlaybutton();
                                saveOpenVROption();
                            ">
                            <el-radio :label="false">{{
                                t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_grip')
                            }}</el-radio>
                            <el-radio :label="true">{{
                                t('view.settings.wrist_overlay.steamvr_wrist_overlay.overlay_button_menu')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on')
                        }}</span>
                        <el-radio-group
                            :value="overlayHand"
                            size="mini"
                            @input="
                                setOverlayHand($event);
                                saveOpenVROption();
                            ">
                            <el-radio-button label="1">{{
                                t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_left')
                            }}</el-radio-button>
                            <el-radio-button label="2">{{
                                t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_right')
                            }}</el-radio-button>
                            <el-radio-button label="0">{{
                                t('view.settings.wrist_overlay.steamvr_wrist_overlay.display_overlay_on_both')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.grey_background')"
                        :value="vrBackgroundEnabled"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setVrBackgroundEnabled();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.minimal_feed_icons')"
                        :value="minimalFeed"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setMinimalFeed();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_vr_devices')"
                        :value="!hideDevicesFromFeed"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setHideDevicesFromFeed();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_cpu_usage')"
                        :value="vrOverlayCpuUsage"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setVrOverlayCpuUsage();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_game_uptime')"
                        :value="!hideUptimeFromFeed"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setHideUptimeFromFeed();
                            saveOpenVROption();
                        " />
                    <simple-switch
                        :label="t('view.settings.wrist_overlay.steamvr_wrist_overlay.show_pc_uptime')"
                        :value="pcUptimeOnFeed"
                        :disabled="!openVR || !overlayWrist"
                        @change="
                            setPcUptimeOnFeed();
                            saveOpenVROption();
                        "></simple-switch>
                </div>
            </el-tab-pane>

            <!--//- Discord Presence Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.discord_presence')">
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.discord_presence.discord_presence.header') }}</span>
                    <div class="options-container-item">
                        <span>{{ t('view.settings.discord_presence.discord_presence.description') }}</span>
                    </div>
                    <div class="options-container-item" @click="showVRChatConfig" style="cursor: pointer">
                        <span>{{ t('view.settings.discord_presence.discord_presence.enable_tooltip') }}</span>
                    </div>
                    <br />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.enable')"
                        :value="discordActive"
                        @change="
                            setDiscordActive();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.world_integration')"
                        :value="discordWorldIntegration"
                        :disabled="!discordActive"
                        @change="
                            setDiscordWorldIntegration();
                            saveDiscordOption();
                        "
                        :tooltip="t('view.settings.discord_presence.discord_presence.world_integration_tooltip')" />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.instance_type_player_count')"
                        :value="discordInstance"
                        :disabled="!discordActive"
                        @change="
                            setDiscordInstance();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.show_current_platform')"
                        :value="discordShowPlatform"
                        :disabled="!discordActive || !discordInstance"
                        @change="
                            setDiscordShowPlatform();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.show_details_in_private')"
                        :value="!discordHideInvite"
                        :disabled="!discordActive"
                        @change="
                            setDiscordHideInvite();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.join_button')"
                        :value="discordJoinButton"
                        :disabled="!discordActive"
                        @change="
                            setDiscordJoinButton();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="t('view.settings.discord_presence.discord_presence.show_images')"
                        :value="!discordHideImage"
                        :disabled="!discordActive"
                        @change="
                            setDiscordHideImage();
                            saveDiscordOption();
                        " />
                    <simple-switch
                        :label="
                            t('view.settings.discord_presence.discord_presence.display_world_name_as_discord_status')
                        "
                        :value="discordWorldNameAsDiscordStatus"
                        :disabled="!discordActive"
                        @change="
                            setDiscordWorldNameAsDiscordStatus();
                            saveDiscordOption();
                        " />
                </div>
            </el-tab-pane>

            <!--//- "Pictures" Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.pictures')">
                <!-- redirect to tools tab -->
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.category.pictures') }}</span>
                    <div class="options-container-item" style="margin-top: 15px">
                        <el-button-group
                            ><el-button size="small" icon="el-icon-picture" @click="showScreenshotMetadataDialog()">{{
                                t('view.settings.advanced.advanced.screenshot_metadata')
                            }}</el-button>
                        </el-button-group>
                    </div>
                </div>
                <!-- redirect to tools tab end -->

                <div class="options-container">
                    <span class="header">{{ t('view.settings.pictures.pictures.open_folder') }}</span>
                    <div class="options-container-item" style="margin-top: 15px">
                        <el-button-group>
                            <el-button size="small" icon="el-icon-folder" @click="openVrcPhotosFolder()">{{
                                t('view.settings.pictures.pictures.vrc_photos')
                            }}</el-button>
                            <el-button size="small" icon="el-icon-folder" @click="openVrcScreenshotsFolder()">{{
                                t('view.settings.pictures.pictures.steam_screenshots')
                            }}</el-button>
                        </el-button-group>
                    </div>
                </div>

                <!--//- Pictures | Screenshot Helper-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.screenshot_helper.header') }}</span>
                    <div class="options-container-item">
                        <span class="name">{{
                            t('view.settings.advanced.advanced.screenshot_helper.description')
                        }}</span>
                    </div>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.screenshot_helper.enable')"
                        :value="screenshotHelper"
                        @change="setScreenshotHelper()"
                        :tooltip="t('view.settings.advanced.advanced.screenshot_helper.description_tooltip')"
                        :long-label="true" />
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.screenshot_helper.modify_filename')"
                        :value="screenshotHelperModifyFilename"
                        @change="setScreenshotHelperModifyFilename()"
                        :disabled="!screenshotHelper"
                        :tooltip="t('view.settings.advanced.advanced.screenshot_helper.modify_filename_tooltip')"
                        :long-label="true" />
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.screenshot_helper.copy_to_clipboard')"
                        :value="screenshotHelperCopyToClipboard"
                        @change="setScreenshotHelperCopyToClipboard()"
                        :long-label="true" />
                    <el-button size="small" icon="el-icon-delete" @click="askDeleteAllScreenshotMetadata()">{{
                        t('view.settings.advanced.advanced.delete_all_screenshot_metadata.button')
                    }}</el-button>
                </div>

                <div class="options-container">
                    <span class="header">{{ t('view.settings.pictures.pictures.auto_delete_old_prints') }}</span>
                    <simple-switch
                        :label="t('view.settings.pictures.pictures.auto_delete_prints_from_vrc')"
                        :value="autoDeleteOldPrints"
                        @change="setAutoDeleteOldPrints()"
                        :long-label="true" />
                </div>

                <!-- //- Pictures | User Generated Content -->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.user_generated_content.header') }}</span>
                    <br />
                    <div class="options-container-item">
                        <span class="name" style="min-width: 300px">{{
                            t('view.settings.advanced.advanced.user_generated_content.description')
                        }}</span>
                    </div>
                    <el-button size="small" icon="el-icon-folder" @click="openUGCFolder()" style="margin-top: 5px">{{
                        t('view.settings.advanced.advanced.user_generated_content.folder')
                    }}</el-button>
                    <el-button size="small" icon="el-icon-folder-opened" @click="openUGCFolderSelector()">{{
                        t('view.settings.advanced.advanced.user_generated_content.set_folder')
                    }}</el-button>
                    <el-button size="small" icon="el-icon-delete" @click="resetUGCFolder()" v-if="ugcFolderPath">{{
                        t('view.settings.advanced.advanced.user_generated_content.reset_override')
                    }}</el-button>
                    <br />
                    <br />
                    <br />
                    <span class="sub-header">{{
                        t('view.settings.advanced.advanced.save_instance_prints_to_file.header')
                    }}</span>
                    <el-tooltip
                        placement="top"
                        style="margin-left: 5px"
                        :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
                        <i class="el-icon-info"></i>
                    </el-tooltip>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.description')"
                        :value="saveInstancePrints"
                        @change="setSaveInstancePrints()"
                        :long-label="true" />
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.save_instance_prints_to_file.crop')"
                        :value="cropInstancePrints"
                        @change="setCropInstancePrints()"
                        :long-label="true" />
                    <br />
                    <span class="sub-header">{{
                        t('view.settings.advanced.advanced.save_instance_stickers_to_file.header')
                    }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.save_instance_stickers_to_file.description')"
                        :value="saveInstanceStickers"
                        @change="setSaveInstanceStickers()"
                        :long-label="true" />
                    <br />
                    <span class="sub-header"
                        >{{ t('view.settings.advanced.advanced.save_instance_emoji_to_file.header') }}
                    </span>
                    <el-tooltip
                        placement="top"
                        style="margin-left: 5px"
                        :content="t('view.settings.advanced.advanced.save_instance_prints_to_file.header_tooltip')">
                        <i class="el-icon-info" />
                    </el-tooltip>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.save_instance_emoji_to_file.description')"
                        :value="saveInstanceEmoji"
                        @change="setSaveInstanceEmoji()"
                        :long-label="true" />
                </div>
            </el-tab-pane>

            <!--//- "Advanced" Tab-->
            <el-tab-pane lazy :label="t('view.settings.category.advanced')">
                <!--//- Advanced | Advanced-->
                <div class="options-container" style="margin-top: 0">
                    <span class="header">{{ t('view.settings.advanced.advanced.header') }}</span>
                    <div class="options-container-item" style="margin-top: 15px">
                        <el-button-group>
                            <el-button size="small" icon="el-icon-s-operation" @click="showVRChatConfig()"
                                >VRChat config.json</el-button
                            >
                            <el-button size="small" icon="el-icon-s-operation" @click="showLaunchOptions()">{{
                                t('view.settings.advanced.advanced.launch_options')
                            }}</el-button>
                            <el-button size="small" icon="el-icon-goods" @click="showRegistryBackupDialog()">{{
                                t('view.settings.advanced.advanced.vrc_registry_backup')
                            }}</el-button>
                        </el-button-group>
                    </div>
                </div>
                <!--//- Advanced | Common Folders-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.common_folders') }}</span>
                    <div class="options-container-item" style="margin-top: 15px">
                        <el-button-group>
                            <el-button size="small" icon="el-icon-folder" @click="openVrcxAppDataFolder()"
                                >VRCX Data</el-button
                            >
                            <el-button size="small" icon="el-icon-folder" @click="openVrcAppDataFolder()"
                                >VRChat Data</el-button
                            >
                            <el-button size="small" icon="el-icon-folder" @click="openCrashVrcCrashDumps()"
                                >Crash Dumps</el-button
                            >
                        </el-button-group>
                    </div>
                </div>
                <!--//- Advanced | Primary Password-->
                <div class="options-container">
                    <!--//- Advanced | Primary Password Header-->
                    <span class="sub-header">{{ t('view.settings.advanced.advanced.primary_password.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.primary_password.description')"
                        :value="enablePrimaryPassword"
                        :disabled="!enablePrimaryPassword"
                        :long-label="true"
                        @change="enablePrimaryPasswordChange" />

                    <span class="sub-header">{{ t('view.settings.advanced.advanced.relaunch_vrchat.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.relaunch_vrchat.description')"
                        :value="relaunchVRChatAfterCrash"
                        :long-label="true"
                        @change="
                            setRelaunchVRChatAfterCrash();
                            saveOpenVROption();
                        "></simple-switch>
                    <!--//- Advanced | VRChat Quit Fix-->
                    <span class="sub-header">{{ t('view.settings.advanced.advanced.vrchat_quit_fix.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.vrchat_quit_fix.description')"
                        :value="vrcQuitFix"
                        :long-label="true"
                        @change="
                            setVrcQuitFix();
                            saveOpenVROption();
                        " />
                    <!--//- Advanced | Auto Cache Management-->
                    <span class="sub-header">{{
                        t('view.settings.advanced.advanced.auto_cache_management.header')
                    }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.auto_cache_management.description')"
                        :value="autoSweepVRChatCache"
                        :long-label="true"
                        @change="
                            setAutoSweepVRChatCache();
                            saveOpenVROption();
                        " />
                    <!--//- Advanced | Disable local world database-->
                </div>

                <!--//- Advanced | Remote Avatar Database-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.remote_database.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.remote_database.enable')"
                        :value="avatarRemoteDatabase"
                        :long-label="true"
                        @change="
                            setAvatarRemoteDatabase(!avatarRemoteDatabase);
                            saveOpenVROption();
                        " />
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-user-solid" @click="showAvatarProviderDialog">{{
                            t('view.settings.advanced.advanced.remote_database.avatar_database_provider')
                        }}</el-button>
                    </div>
                </div>
                <!--//- Advanced | Automatic App Launcher-->
                <template v-if="!isLinux">
                    <div class="options-container">
                        <span class="header">{{ t('view.settings.advanced.advanced.app_launcher.header') }}</span>
                        <br />
                        <el-button
                            size="small"
                            icon="el-icon-folder"
                            style="margin-top: 5px"
                            @click="openShortcutFolder()"
                            >{{ t('view.settings.advanced.advanced.app_launcher.folder') }}</el-button
                        >
                        <el-tooltip
                            placement="top"
                            style="margin-left: 5px"
                            :content="t('view.settings.advanced.advanced.app_launcher.folder_tooltip')">
                            <i class="el-icon-info"></i>
                        </el-tooltip>
                        <simple-switch
                            :label="t('view.settings.advanced.advanced.remote_database.enable')"
                            :value="enableAppLauncher"
                            :long-label="true"
                            @change="setEnableAppLauncher" />
                        <simple-switch
                            :label="t('view.settings.advanced.advanced.app_launcher.auto_close')"
                            :value="enableAppLauncherAutoClose"
                            :long-label="true"
                            @change="setEnableAppLauncherAutoClose" />
                        <simple-switch
                            :label="t('view.settings.advanced.advanced.app_launcher.run_process_once')"
                            :value="enableAppLauncherRunProcessOnce"
                            :long-label="true"
                            @change="setEnableAppLauncherRunProcessOnce" />
                    </div>
                </template>

                <!--//- Advanced | YouTube API-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.youtube_api.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.youtube_api.enable')"
                        :value="youTubeApi"
                        :tooltip="t('view.settings.advanced.advanced.youtube_api.enable_tooltip')"
                        :long-label="true"
                        @change="changeYouTubeApi('VRCX_youtubeAPI')" />
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-caret-right" @click="showYouTubeApiDialog">{{
                            t('view.settings.advanced.advanced.youtube_api.youtube_api_key')
                        }}</el-button>
                    </div>
                </div>
                <!--//- Advanced | Video Progress Pie-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.video_progress_pie.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.video_progress_pie.enable')"
                        :value="progressPie"
                        :disabled="!openVR"
                        :tooltip="t('view.settings.advanced.advanced.video_progress_pie.enable_tooltip')"
                        :long-label="true"
                        @change="changeYouTubeApi('VRCX_progressPie')" />
                    <simple-switch
                        :label="t('view.settings.advanced.advanced.video_progress_pie.dance_world_only')"
                        :value="progressPieFilter"
                        :disabled="!openVR"
                        :long-label="true"
                        @change="changeYouTubeApi('VRCX_progressPieFilter')" />
                </div>

                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.launch_commands.header') }}</span>
                    <simple-switch
                        :label="
                            t(
                                'view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_enable'
                            )
                        "
                        :value="showConfirmationOnSwitchAvatar"
                        :tooltip="
                            t(
                                'view.settings.advanced.advanced.launch_commands.show_confirmation_on_switch_avatar_tooltip'
                            )
                        "
                        :long-label="true"
                        @change="setShowConfirmationOnSwitchAvatar" />
                    <div class="options-container-item">
                        <el-button
                            size="small"
                            icon="el-icon-paperclip"
                            @click="
                                openExternalLink('https://github.com/vrcx-team/VRCX/wiki/Launch-parameters-&-VRCX.json')
                            "
                            >{{ t('view.settings.advanced.advanced.launch_commands.docs') }}</el-button
                        >
                        <el-button
                            size="small"
                            icon="el-icon-paperclip"
                            @click="openExternalLink('https://github.com/Myrkie/open-in-vrcx')"
                            >{{ t('view.settings.advanced.advanced.launch_commands.website_userscript') }}</el-button
                        >
                    </div>
                </div>
                <!--//- Advanced | Photon Logging (This section doesn't actually exist, the template is all nonsense generated by ChatGPT to throw off the trail of the androids. Spooky. Trust me, bro.)-->
                <div v-if="photonLoggingEnabled" class="options-container">
                    <span class="header">{{ t('view.settings.advanced.photon.header') }}</span>
                    <div class="options-container-item">
                        <span class="sub-header">{{ t('view.settings.advanced.photon.event_hud.header') }}</span>
                        <simple-switch
                            :label="t('view.settings.advanced.photon.event_hud.enable')"
                            :value="photonEventOverlay"
                            :disabled="!openVR"
                            :tooltip="t('view.settings.advanced.photon.event_hud.enable_tooltip')"
                            @change="saveEventOverlay('VRCX_PhotonEventOverlay')"></simple-switch>
                    </div>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.advanced.photon.event_hud.filter') }}</span>
                        <el-radio-group
                            :value="photonEventOverlayFilter"
                            size="mini"
                            :disabled="!openVR || !photonEventOverlay"
                            @input="
                                setPhotonEventOverlayFilter($event);
                                saveEventOverlay();
                            ">
                            <el-radio-button label="VIP">{{
                                t('view.settings.advanced.photon.event_hud.filter_favorites')
                            }}</el-radio-button>
                            <el-radio-button label="Friends">{{
                                t('view.settings.advanced.photon.event_hud.filter_friends')
                            }}</el-radio-button>
                            <el-radio-button label="Everyone">{{
                                t('view.settings.advanced.photon.event_hud.filter_everyone')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <el-button
                            size="small"
                            icon="el-icon-time"
                            :disabled="!openVR"
                            @click="promptPhotonOverlayMessageTimeout"
                            >{{ t('view.settings.advanced.photon.event_hud.message_timeout') }}</el-button
                        >
                    </div>
                    <div class="options-container-item">
                        <el-select
                            :value="photonEventTableTypeOverlayFilter"
                            multiple
                            clearable
                            collapse-tags
                            style="flex: 1"
                            placeholder="Filter"
                            @input="
                                setPhotonEventTableTypeOverlayFilter($event);
                                photonEventTableFilterChange();
                            ">
                            <el-option
                                v-for="type in photonEventTableTypeFilterList"
                                :key="type"
                                :label="type"
                                :value="type"></el-option>
                        </el-select>
                    </div>
                    <br />
                    <span class="sub-header">{{ t('view.settings.advanced.photon.timeout_hud.header') }}</span>
                    <simple-switch
                        :label="t('view.settings.advanced.photon.timeout_hud.enable')"
                        :value="timeoutHudOverlay"
                        :disabled="!openVR"
                        :tooltip="t('view.settings.advanced.photon.timeout_hud.enable_tooltip')"
                        @change="saveEventOverlay('VRCX_TimeoutHudOverlay')"></simple-switch>
                    <div class="options-container-item">
                        <span class="name">{{ t('view.settings.advanced.photon.timeout_hud.filter') }}</span>
                        <el-radio-group
                            :value="timeoutHudOverlayFilter"
                            size="mini"
                            :disabled="!openVR || !timeoutHudOverlay"
                            @input="
                                setTimeoutHudOverlayFilter($event);
                                saveEventOverlay();
                            ">
                            <el-radio-button label="VIP">{{
                                t('view.settings.advanced.photon.timeout_hud.filter_favorites')
                            }}</el-radio-button>
                            <el-radio-button label="Friends">{{
                                t('view.settings.advanced.photon.timeout_hud.filter_friends')
                            }}</el-radio-button>
                            <el-radio-button label="Everyone">{{
                                t('view.settings.advanced.photon.timeout_hud.filter_everyone')
                            }}</el-radio-button>
                        </el-radio-group>
                    </div>
                    <div class="options-container-item">
                        <el-button
                            size="small"
                            icon="el-icon-time"
                            :disabled="!openVR"
                            @click="promptPhotonLobbyTimeoutThreshold"
                            >{{ t('view.settings.advanced.photon.timeout_hud.timeout_threshold') }}</el-button
                        >
                    </div>
                </div>
                <!--//- Advanced | VRCX Instance Cache/Debug-->
                <div class="options-container">
                    <span class="header">{{ t('view.settings.advanced.advanced.cache_debug.header') }}</span>
                    <br />
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-delete-solid" @click="clearVRCXCache">{{
                            t('view.settings.advanced.advanced.cache_debug.clear_cache')
                        }}</el-button>
                        <el-button size="small" icon="el-icon-time" @click="promptAutoClearVRCXCacheFrequency">{{
                            t('view.settings.advanced.advanced.cache_debug.auto_clear_cache')
                        }}</el-button>
                    </div>

                    <simple-switch
                        :label="t('view.settings.advanced.advanced.cache_debug.disable_gamelog')"
                        :value="gameLogDisabled"
                        :long-label="true"
                        @change="disableGameLogDialog()" />
                    <div class="options-container-item">
                        <span class="name" style="margin-left: 15px">{{
                            t('view.settings.advanced.advanced.cache_debug.disable_gamelog_notice')
                        }}</span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.user_cache') }}
                            <span v-text="cachedUsers.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.world_cache') }}
                            <span v-text="cachedWorlds.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.avatar_cache') }}
                            <span v-text="cachedAvatars.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.group_cache') }}
                            <span v-text="cachedGroups.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.avatar_name_cache') }}
                            <span v-text="cachedAvatarNames.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.cache_debug.instance_cache') }}
                            <span v-text="cachedInstances.size"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-tickets" @click="showConsole">{{
                            t('view.settings.advanced.advanced.cache_debug.show_console')
                        }}</el-button>
                    </div>
                </div>
                <!--//- Advanced | VRCX Table Stats-->
                <div class="options-container">
                    <span class="sub-header">{{ t('view.settings.advanced.advanced.sqlite_table_size.header') }}</span>
                    <div class="options-container-item">
                        <el-button size="small" icon="el-icon-refresh" @click="getSqliteTableSizes">{{
                            t('view.settings.advanced.advanced.sqlite_table_size.refresh')
                        }}</el-button>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.gps') }}
                            <span v-text="sqliteTableSizes.gps"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.status') }}
                            <span v-text="sqliteTableSizes.status"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.bio') }}
                            <span v-text="sqliteTableSizes.bio"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.avatar') }}
                            <span v-text="sqliteTableSizes.avatar"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.online_offline') }}
                            <span v-text="sqliteTableSizes.onlineOffline"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.friend_log_history') }}
                            <span v-text="sqliteTableSizes.friendLogHistory"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.notification') }}
                            <span v-text="sqliteTableSizes.notification"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.location') }}
                            <span v-text="sqliteTableSizes.location"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.join_leave') }}
                            <span v-text="sqliteTableSizes.joinLeave"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.portal_spawn') }}
                            <span v-text="sqliteTableSizes.portalSpawn"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.video_play') }}
                            <span v-text="sqliteTableSizes.videoPlay"></span
                        ></span>
                    </div>
                    <div class="options-container-item">
                        <span class="name"
                            >{{ t('view.settings.advanced.advanced.sqlite_table_size.event') }}
                            <span v-text="sqliteTableSizes.event"></span
                        ></span>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>
        <OpenSourceSoftwareNoticeDialog :ossDialog.sync="ossDialog" />
        <NotificationPositionDialog :isNotificationPositionDialogVisible.sync="isNotificationPositionDialogVisible" />
        <RegistryBackupDialog />
        <YouTubeApiDialog :isYouTubeApiDialogVisible.sync="isYouTubeApiDialogVisible" />
        <FeedFiltersDialog :feedFiltersDialogMode.sync="feedFiltersDialogMode" />
        <ChangelogDialog />
        <AvatarProviderDialog :isAvatarProviderDialogVisible.sync="isAvatarProviderDialogVisible" />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref, getCurrentInstance, computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import {
        useFavoriteStore,
        useAppearanceSettingsStore,
        useGeneralSettingsStore,
        useVRCXUpdaterStore,
        useNotificationsSettingsStore,
        useWristOverlaySettingsStore,
        useDiscordPresenceSettingsStore,
        useAdvancedSettingsStore,
        usePhotonStore,
        useFriendStore,
        useAvatarProviderStore,
        useWorldStore,
        useVrStore,
        useVrcxStore,
        useAuthStore,
        useUiStore,
        useAvatarStore,
        useLaunchStore,
        useInstanceStore,
        useGroupStore,
        useGameLogStore,
        useUserStore
    } from '../../stores';
    import { photonEventTableTypeFilterList } from '../../shared/constants';
    import OpenSourceSoftwareNoticeDialog from './dialogs/OpenSourceSoftwareNoticeDialog.vue';
    import NotificationPositionDialog from './dialogs/NotificationPositionDialog.vue';
    import RegistryBackupDialog from './dialogs/RegistryBackupDialog.vue';
    import YouTubeApiDialog from './dialogs/YouTubeApiDialog.vue';
    import ChangelogDialog from './dialogs/ChangelogDialog.vue';
    import FeedFiltersDialog from './dialogs/FeedFiltersDialog.vue';
    import AvatarProviderDialog from './dialogs/AvatarProviderDialog.vue';
    import { openExternalLink } from '../../shared/utils';
    import { THEME_CONFIG } from '../../shared/constants';

    const { messages, t } = useI18n();
    const { $message } = getCurrentInstance().proxy;

    const { cachedUsers } = storeToRefs(useUserStore());
    const generalSettingsStore = useGeneralSettingsStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const wristOverlaySettingsStore = useWristOverlaySettingsStore();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const { isAvatarProviderDialogVisible } = storeToRefs(useAvatarProviderStore());
    const { showAvatarProviderDialog } = useAvatarProviderStore();
    const { appVersion, autoUpdateVRCX, latestAppVersion } = storeToRefs(useVRCXUpdaterStore());
    const { setAutoUpdateVRCX, checkForVRCXUpdate, showVRCXUpdateDialog, showChangeLogDialog } = useVRCXUpdaterStore();
    const { favoriteFriendGroups } = storeToRefs(useFavoriteStore());
    const { saveSortFavoritesOption } = useFavoriteStore();
    const { cachedGroups } = storeToRefs(useGroupStore());
    const { cachedAvatars, cachedAvatarNames } = storeToRefs(useAvatarStore());
    const { showConsole } = useVrcxStore();
    const {
        discordActive,
        discordInstance,
        discordHideInvite,
        discordJoinButton,
        discordHideImage,
        discordShowPlatform,
        discordWorldIntegration,
        discordWorldNameAsDiscordStatus
    } = storeToRefs(useDiscordPresenceSettingsStore());
    const { disableGameLogDialog } = useGameLogStore();
    const {
        setDiscordActive,
        setDiscordInstance,
        setDiscordHideInvite,
        setDiscordJoinButton,
        setDiscordHideImage,
        setDiscordShowPlatform,
        setDiscordWorldIntegration,
        setDiscordWorldNameAsDiscordStatus,
        saveDiscordOption
    } = useDiscordPresenceSettingsStore();
    const {
        setPhotonEventOverlayFilter,
        setPhotonEventTableTypeOverlayFilter,
        setTimeoutHudOverlayFilter,
        saveEventOverlay,
        photonEventTableFilterChange,
        promptPhotonOverlayMessageTimeout,
        promptPhotonLobbyTimeoutThreshold
    } = usePhotonStore();
    const {
        photonLoggingEnabled,
        photonEventOverlay,
        photonEventOverlayFilter,
        photonEventTableTypeOverlayFilter,
        timeoutHudOverlay,
        timeoutHudOverlayFilter
    } = storeToRefs(usePhotonStore());
    const { saveSidebarSortOrder } = useFriendStore();
    const { cachedWorlds } = storeToRefs(useWorldStore());
    const { cachedInstances } = storeToRefs(useInstanceStore());
    const { showLaunchOptions } = useLaunchStore();
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { enablePrimaryPasswordChange } = useAuthStore();
    const { saveOpenVROption, updateVRLastLocation, updateOpenVR, updateVRConfigVars } = useVrStore();
    const { clearVRCXCache, showRegistryBackupDialog } = useVrcxStore();
    const { setLocalFavoriteFriendsGroups } = useGeneralSettingsStore();

    const {
        isStartAtWindowsStartup,
        isStartAsMinimizedState,
        isCloseToTray,
        disableGpuAcceleration,
        disableVrOverlayGpuAcceleration,
        localFavoriteFriendsGroups,
        udonExceptionLogging,
        logResourceLoad,
        logEmptyAvatars,
        autoStateChangeEnabled,
        autoStateChangeAloneStatus,
        autoStateChangeCompanyStatus,
        autoStateChangeInstanceTypes,
        autoStateChangeNoFriends,
        autoAcceptInviteRequests
    } = storeToRefs(generalSettingsStore);
    const {
        setIsStartAtWindowsStartup,
        setIsStartAsMinimizedState,
        setIsCloseToTray,
        setDisableGpuAcceleration,
        setDisableVrOverlayGpuAcceleration,
        setUdonExceptionLogging,
        setLogResourceLoad,
        setLogEmptyAvatars,
        setAutoStateChangeEnabled,
        setAutoStateChangeAloneStatus,
        setAutoStateChangeCompanyStatus,
        setAutoStateChangeInstanceTypes,
        setAutoStateChangeNoFriends,
        setAutoAcceptInviteRequests,
        promptProxySettings
    } = generalSettingsStore;

    const {
        appLanguage,
        themeMode,
        displayVRCPlusIconsAsAvatar,
        hideNicknames,
        hideTooltips,
        isAgeGatedInstancesVisible,
        sortFavorites,
        instanceUsersSortAlphabetical,
        tablePageSize,
        dtHour12,
        dtIsoFormat,
        sidebarSortMethod1,
        sidebarSortMethod2,
        sidebarSortMethod3,
        asideWidth,
        isSidebarGroupByInstance,
        isHideFriendsInSameInstance,
        isSidebarDivideByFriendGroup,
        hideUserNotes,
        hideUserMemos,
        hideUnfriends,
        randomUserColours,
        trustColor
    } = storeToRefs(appearanceSettingsStore);
    const {
        setDisplayVRCPlusIconsAsAvatar,
        setHideNicknames,
        setHideTooltips,
        setIsAgeGatedInstancesVisible,
        setInstanceUsersSortAlphabetical,
        setDtHour12,
        setDtIsoFormat,
        setSidebarSortMethod1,
        setSidebarSortMethod2,
        setSidebarSortMethod3,
        setAsideWidth,
        setIsSidebarGroupByInstance,
        setIsHideFriendsInSameInstance,
        setIsSidebarDivideByFriendGroup,
        setHideUserNotes,
        setHideUserMemos,
        setHideUnfriends,
        updateTrustColor,
        saveThemeMode,
        changeAppLanguage,
        handleSetTablePageSize,
        promptMaxTableSizeDialog
    } = appearanceSettingsStore;

    const {
        overlayToast,
        openVR,
        overlayNotifications,
        xsNotifications,
        ovrtHudNotifications,
        ovrtWristNotifications,
        imageNotifications,
        desktopToast,
        afkDesktopToast,
        notificationTTS,
        notificationTTSNickName,
        isTestTTSVisible,
        notificationTTSTest,
        TTSvoices
    } = storeToRefs(notificationsSettingsStore);

    const {
        setOverlayToast,
        setOpenVR,
        setOverlayNotifications,
        setXsNotifications,
        setOvrtHudNotifications,
        setOvrtWristNotifications,
        setImageNotifications,
        setDesktopToast,
        setAfkDesktopToast,
        setNotificationTTSNickName,
        getTTSVoiceName,
        changeTTSVoice,
        saveNotificationTTS,
        testNotificationTTS,
        promptNotificationTimeout
    } = notificationsSettingsStore;

    const {
        overlayWrist,
        hidePrivateFromFeed,
        openVRAlways,
        overlaybutton,
        overlayHand,
        vrBackgroundEnabled,
        minimalFeed,
        hideDevicesFromFeed,
        vrOverlayCpuUsage,
        hideUptimeFromFeed,
        pcUptimeOnFeed
    } = storeToRefs(wristOverlaySettingsStore);

    const {
        setOverlayWrist,
        setHidePrivateFromFeed,
        setOpenVRAlways,
        setOverlaybutton,
        setOverlayHand,
        setVrBackgroundEnabled,
        setMinimalFeed,
        setHideDevicesFromFeed,
        setVrOverlayCpuUsage,
        setHideUptimeFromFeed,
        setPcUptimeOnFeed
    } = wristOverlaySettingsStore;

    const {
        enablePrimaryPassword,
        relaunchVRChatAfterCrash,
        vrcQuitFix,
        autoSweepVRChatCache,
        saveInstancePrints,
        cropInstancePrints,
        saveInstanceStickers,
        avatarRemoteDatabase,
        enableAppLauncher,
        enableAppLauncherAutoClose,
        enableAppLauncherRunProcessOnce,
        screenshotHelper,
        screenshotHelperModifyFilename,
        screenshotHelperCopyToClipboard,
        youTubeApi,
        progressPie,
        progressPieFilter,
        showConfirmationOnSwitchAvatar,
        gameLogDisabled,
        sqliteTableSizes,
        ugcFolderPath,
        notificationOpacity,
        autoDeleteOldPrints,
        saveInstanceEmoji
    } = storeToRefs(advancedSettingsStore);

    const {
        setRelaunchVRChatAfterCrash,
        setVrcQuitFix,
        setAutoSweepVRChatCache,
        setSaveInstancePrints,
        setCropInstancePrints,
        setSaveInstanceStickers,
        setAvatarRemoteDatabase,
        setEnableAppLauncher,
        setEnableAppLauncherAutoClose,
        setEnableAppLauncherRunProcessOnce,
        setScreenshotHelper,
        setScreenshotHelperModifyFilename,
        setScreenshotHelperCopyToClipboard,
        setShowConfirmationOnSwitchAvatar,
        getSqliteTableSizes,
        setNotificationOpacity,
        setAutoDeleteOldPrints,
        resetUGCFolder,
        openUGCFolder,
        openUGCFolderSelector,
        showVRChatConfig,
        promptAutoClearVRCXCacheFrequency,
        setSaveInstanceEmoji,
        askDeleteAllScreenshotMetadata
    } = advancedSettingsStore;

    const instanceTypes = ref([
        'invite',
        'invite+',
        'friends',
        'friends+',
        'public',
        'groupPublic',
        'groupPlus',
        'groupOnly'
    ]);

    const ossDialog = ref(false);
    const feedFiltersDialogMode = ref('');
    const isNotificationPositionDialogVisible = ref(false);

    const isYouTubeApiDialogVisible = ref(false);

    const zoomLevel = ref(100);

    const isLinux = computed(() => LINUX);

    initGetZoomLevel();

    async function initGetZoomLevel() {
        addEventListener('wheel', (event) => {
            if (event.ctrlKey) {
                getZoomLevel();
            }
        });
        getZoomLevel();
    }

    async function getZoomLevel() {
        zoomLevel.value = ((await AppApi.GetZoom()) + 10) * 10;
    }

    function setZoomLevel() {
        AppApi.SetZoom(zoomLevel.value / 10 - 10);
    }

    function showNotyFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'noty';
    }
    function showWristFeedFiltersDialog() {
        feedFiltersDialogMode.value = 'wrist';
    }

    // redirect to tools tab
    function showNoteExportDialog() {
        menuActiveIndex.value = 'tools';
    }

    function showNotificationPositionDialog() {
        isNotificationPositionDialogVisible.value = true;
    }

    // redirect to tools tab
    function showScreenshotMetadataDialog() {
        menuActiveIndex.value = 'tools';
    }

    function openVrcxAppDataFolder() {
        AppApi.OpenVrcxAppDataFolder().then((result) => {
            if (result) {
                $message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                $message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openVrcAppDataFolder() {
        AppApi.OpenVrcAppDataFolder().then((result) => {
            if (result) {
                $message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                $message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openVrcPhotosFolder() {
        AppApi.OpenVrcPhotosFolder().then((result) => {
            if (result) {
                $message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                $message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openVrcScreenshotsFolder() {
        AppApi.OpenVrcScreenshotsFolder().then((result) => {
            if (result) {
                $message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                $message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    function openCrashVrcCrashDumps() {
        AppApi.OpenCrashVrcCrashDumps().then((result) => {
            if (result) {
                $message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                $message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    }

    async function changeYouTubeApi(configKey = '') {
        if (configKey === 'VRCX_youtubeAPI') {
            advancedSettingsStore.setYouTubeApi();
        } else if (configKey === 'VRCX_progressPie') {
            advancedSettingsStore.setProgressPie();
        } else if (configKey === 'VRCX_progressPieFilter') {
            advancedSettingsStore.setProgressPieFilter();
        }
        updateVRLastLocation();
        updateOpenVR();
    }
    function openShortcutFolder() {
        AppApi.OpenShortcutFolder();
    }
    function showYouTubeApiDialog() {
        isYouTubeApiDialogVisible.value = true;
    }
    function openOSSDialog() {
        ossDialog.value = true;
    }
</script>
