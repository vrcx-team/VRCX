import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { $app } from '../../app';
import { i18n, t } from '../../plugin';
import configRepository from '../../service/config';
import { database } from '../../service/database';
import { watchState } from '../../service/watchState';
import {
    changeAppDarkStyle,
    changeAppThemeStyle,
    changeCJKFontsOrder,
    getNameColour,
    HueToHex,
    systemIsDarkMode,
    updateTrustColorClasses
} from '../../shared/utils';
import { useFeedStore } from '../feed';
import { useFriendStore } from '../friend';
import { useGameLogStore } from '../gameLog';
import { useModerationStore } from '../moderation';
import { useNotificationStore } from '../notification';
import { useUserStore } from '../user';
import { useVrStore } from '../vr';
import { useVrcxStore } from '../vrcx';

export const useAppearanceSettingsStore = defineStore(
    'AppearanceSettings',

    () => {
        const friendStore = useFriendStore();
        const vrStore = useVrStore();
        const notificationStore = useNotificationStore();
        const feedStore = useFeedStore();
        const moderationStore = useModerationStore();
        const gameLogStore = useGameLogStore();
        const vrcxStore = useVrcxStore();
        const userStore = useUserStore();

        const state = reactive({
            appLanguage: 'en',
            themeMode: '',
            isDarkMode: false,
            displayVRCPlusIconsAsAvatar: false,
            hideNicknames: false,
            hideTooltips: false,
            isAgeGatedInstancesVisible: false,
            sortFavorites: true,
            instanceUsersSortAlphabetical: false,
            tablePageSize: 15,
            dtHour12: false,
            dtIsoFormat: false,
            sidebarSortMethod1: 'Sort Private to Bottom',
            sidebarSortMethod2: 'Sort by Time in Instance',
            sidebarSortMethod3: 'Sort by Last Active',
            sidebarSortMethods: [
                'Sort Private to Bottom',
                'Sort by Time in Instance',
                'Sort by Last Active'
            ],
            asideWidth: 300,
            isSidebarGroupByInstance: true,
            isHideFriendsInSameInstance: false,
            isSidebarDivideByFriendGroup: false,
            hideUserNotes: false,
            hideUserMemos: false,
            hideUnfriends: false,
            randomUserColours: false,
            trustColor: {
                untrusted: '#CCCCCC',
                basic: '#1778FF',
                known: '#2BCF5C',
                trusted: '#FF7B42',
                veteran: '#B18FFF',
                vip: '#FF2626',
                troll: '#782F2F'
            },
            currentCulture: ''
        });

        async function initAppearanceSettings() {
            const [
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
                sidebarSortMethods,
                asideWidth,
                isSidebarGroupByInstance,
                isHideFriendsInSameInstance,
                isSidebarDivideByFriendGroup,
                hideUserNotes,
                hideUserMemos,
                hideUnfriends,
                randomUserColours,
                trustColor
            ] = await Promise.all([
                configRepository.getString('VRCX_appLanguage'),
                configRepository.getString('VRCX_ThemeMode', 'system'),
                configRepository.getBool('displayVRCPlusIconsAsAvatar', true),
                configRepository.getBool('VRCX_hideNicknames', false),
                configRepository.getBool('VRCX_hideTooltips', false),
                configRepository.getBool(
                    'VRCX_isAgeGatedInstancesVisible',
                    true
                ),
                configRepository.getBool('VRCX_sortFavorites', true),
                configRepository.getBool(
                    'VRCX_instanceUsersSortAlphabetical',
                    false
                ),
                configRepository.getInt('VRCX_tablePageSize', 15),
                configRepository.getBool('VRCX_dtHour12', false),
                configRepository.getBool('VRCX_dtIsoFormat', false),
                configRepository.getString(
                    'VRCX_sidebarSortMethods',
                    JSON.stringify([
                        'Sort Private to Bottom',
                        'Sort by Time in Instance',
                        'Sort by Last Active'
                    ])
                ),
                configRepository.getInt('VRCX_sidePanelWidth', 300),
                configRepository.getBool('VRCX_sidebarGroupByInstance', true),
                configRepository.getBool(
                    'VRCX_hideFriendsInSameInstance',
                    false
                ),
                configRepository.getBool(
                    'VRCX_sidebarDivideByFriendGroup',
                    true
                ),
                configRepository.getBool('VRCX_hideUserNotes', false),
                configRepository.getBool('VRCX_hideUserMemos', false),
                configRepository.getBool('VRCX_hideUnfriends', false),
                configRepository.getBool('VRCX_randomUserColours', false),
                configRepository.getString(
                    'VRCX_trustColor',
                    JSON.stringify({
                        untrusted: '#CCCCCC',
                        basic: '#1778FF',
                        known: '#2BCF5C',
                        trusted: '#FF7B42',
                        veteran: '#B18FFF',
                        vip: '#FF2626',
                        troll: '#782F2F'
                    })
                )
            ]);

            if (!appLanguage) {
                const result = await AppApi.CurrentLanguage();

                const lang = result.split('-')[0];
                i18n.availableLocales.forEach((ref) => {
                    const refLang = ref.split('_')[0];
                    if (refLang === lang) {
                        changeAppLanguage(ref);
                    }
                });
            } else {
                state.appLanguage = appLanguage;
            }
            changeCJKFontsOrder(state.appLanguage);

            state.themeMode = themeMode;
            applyThemeMode(themeMode);

            state.displayVRCPlusIconsAsAvatar = displayVRCPlusIconsAsAvatar;
            state.hideNicknames = hideNicknames;
            state.hideTooltips = hideTooltips;
            state.isAgeGatedInstancesVisible = isAgeGatedInstancesVisible;
            state.sortFavorites = sortFavorites;
            state.instanceUsersSortAlphabetical = instanceUsersSortAlphabetical;

            setTablePageSize(tablePageSize);
            handleSetTablePageSize(state.tablePageSize);

            state.dtHour12 = dtHour12;
            state.dtIsoFormat = dtIsoFormat;

            state.currentCulture = await AppApi.CurrentCulture();

            state.sidebarSortMethods = JSON.parse(sidebarSortMethods);
            if (state.sidebarSortMethods?.length === 3) {
                state.sidebarSortMethod1 = state.sidebarSortMethods[0];
                state.sidebarSortMethod2 = state.sidebarSortMethods[1];
                state.sidebarSortMethod3 = state.sidebarSortMethods[2];
            }

            state.trustColor = JSON.parse(trustColor);
            state.asideWidth = asideWidth;
            state.isSidebarGroupByInstance = isSidebarGroupByInstance;
            state.isHideFriendsInSameInstance = isHideFriendsInSameInstance;
            state.isSidebarDivideByFriendGroup = isSidebarDivideByFriendGroup;
            state.hideUserNotes = hideUserNotes;
            state.hideUserMemos = hideUserMemos;
            state.hideUnfriends = hideUnfriends;
            state.randomUserColours = randomUserColours;

            // Migrate old settings
            // Assume all exist if one does
            await mergeOldSortMethodsSettings();

            updateTrustColorClasses(state.trustColor);

            vrStore.updateVRConfigVars();
        }

        initAppearanceSettings();

        const appLanguage = computed(() => state.appLanguage);
        const themeMode = computed(() => state.themeMode);
        const isDarkMode = computed(() => state.isDarkMode);
        const displayVRCPlusIconsAsAvatar = computed(
            () => state.displayVRCPlusIconsAsAvatar
        );
        const hideNicknames = computed(() => state.hideNicknames);
        const hideTooltips = computed(() => state.hideTooltips);
        const isAgeGatedInstancesVisible = computed(
            () => state.isAgeGatedInstancesVisible
        );
        const sortFavorites = computed(() => state.sortFavorites);
        const instanceUsersSortAlphabetical = computed(
            () => state.instanceUsersSortAlphabetical
        );
        const tablePageSize = computed(() => state.tablePageSize);
        const dtHour12 = computed(() => state.dtHour12);
        const dtIsoFormat = computed(() => state.dtIsoFormat);
        const sidebarSortMethod1 = computed(() => state.sidebarSortMethod1);
        const sidebarSortMethod2 = computed(() => state.sidebarSortMethod2);
        const sidebarSortMethod3 = computed(() => state.sidebarSortMethod3);
        const sidebarSortMethods = computed(() => state.sidebarSortMethods);
        const asideWidth = computed(() => state.asideWidth);
        const isSidebarGroupByInstance = computed(
            () => state.isSidebarGroupByInstance
        );
        const isHideFriendsInSameInstance = computed(
            () => state.isHideFriendsInSameInstance
        );
        const isSidebarDivideByFriendGroup = computed(
            () => state.isSidebarDivideByFriendGroup
        );
        const hideUserNotes = computed(() => state.hideUserNotes);
        const hideUserMemos = computed(() => state.hideUserMemos);
        const hideUnfriends = computed(() => state.hideUnfriends);
        const randomUserColours = computed(() => state.randomUserColours);
        const trustColor = computed(() => state.trustColor);
        const currentCulture = computed(() => state.currentCulture);

        watch(
            () => watchState.isFriendsLoaded,
            (isFriendsLoaded) => {
                if (isFriendsLoaded) {
                    tryInitUserColours();
                }
            },
            { flush: 'sync' }
        );

        /**
         *
         * @param {string} language
         */
        function changeAppLanguage(language) {
            setAppLanguage(language);
            vrStore.updateVRConfigVars();
        }

        /**
         * @param {string} language
         */
        function setAppLanguage(language) {
            console.log('Language changed:', language);
            state.appLanguage = language;
            configRepository.setString('VRCX_appLanguage', language);
            changeCJKFontsOrder(state.appLanguage);
            i18n.locale = state.appLanguage;
        }

        /**
         * @param {string} newThemeMode
         * @returns {Promise<void>}
         */
        async function saveThemeMode(newThemeMode) {
            setThemeMode(newThemeMode);
            await changeThemeMode();
        }

        async function changeThemeMode() {
            await changeAppThemeStyle(state.themeMode);
            vrStore.updateVRConfigVars();
            await updateTrustColor();
        }

        /**
         *
         * @param {string} field
         * @param {string} color
         * @param {boolean} setRandomColor
         * @returns {Promise<void>}
         */
        async function updateTrustColor(field, color, setRandomColor = false) {
            if (setRandomColor) {
                setRandomUserColours();
            }
            if (typeof userStore.currentUser?.id === 'undefined') {
                return;
            }
            if (field && color) {
                setTrustColor({
                    ...state.trustColor,
                    [field]: color
                });
            }
            if (state.randomUserColours) {
                const colour = await getNameColour(userStore.currentUser.id);
                userStore.currentUser.$userColour = colour;
                userColourInit();
            } else {
                applyUserTrustLevel(userStore.currentUser);
                userStore.cachedUsers.forEach((ref) => {
                    applyUserTrustLevel(ref);
                });
            }
            updateTrustColorClasses(state.trustColor);
        }

        async function userColourInit() {
            let dictObject = await AppApi.GetColourBulk(
                Array.from(userStore.cachedUsers.keys())
            );
            if (LINUX) {
                dictObject = Object.fromEntries(dictObject);
            }
            for (const [userId, hue] of Object.entries(dictObject)) {
                const ref = userStore.cachedUsers.get(userId);
                if (typeof ref !== 'undefined') {
                    ref.$userColour = HueToHex(hue);
                }
            }
        }

        /**
         *
         * @param {object} ref
         */
        function applyUserTrustLevel(ref) {
            ref.$isModerator =
                ref.developerType && ref.developerType !== 'none';
            ref.$isTroll = false;
            ref.$isProbableTroll = false;
            let trustColor = '';
            const { tags } = ref;
            if (tags.includes('admin_moderator')) {
                ref.$isModerator = true;
            }
            if (tags.includes('system_troll')) {
                ref.$isTroll = true;
            }
            if (tags.includes('system_probable_troll') && !ref.$isTroll) {
                ref.$isProbableTroll = true;
            }
            if (tags.includes('system_trust_veteran')) {
                ref.$trustLevel = 'Trusted User';
                ref.$trustClass = 'x-tag-veteran';
                trustColor = 'veteran';
                ref.$trustSortNum = 5;
            } else if (tags.includes('system_trust_trusted')) {
                ref.$trustLevel = 'Known User';
                ref.$trustClass = 'x-tag-trusted';
                trustColor = 'trusted';
                ref.$trustSortNum = 4;
            } else if (tags.includes('system_trust_known')) {
                ref.$trustLevel = 'User';
                ref.$trustClass = 'x-tag-known';
                trustColor = 'known';
                ref.$trustSortNum = 3;
            } else if (tags.includes('system_trust_basic')) {
                ref.$trustLevel = 'New User';
                ref.$trustClass = 'x-tag-basic';
                trustColor = 'basic';
                ref.$trustSortNum = 2;
            } else {
                ref.$trustLevel = 'Visitor';
                ref.$trustClass = 'x-tag-untrusted';
                trustColor = 'untrusted';
                ref.$trustSortNum = 1;
            }
            if (ref.$isTroll || ref.$isProbableTroll) {
                trustColor = 'troll';
                ref.$trustSortNum += 0.1;
            }
            if (ref.$isModerator) {
                trustColor = 'vip';
                ref.$trustSortNum += 0.3;
            }
            if (state.randomUserColours && watchState.isFriendsLoaded) {
                if (!ref.$userColour) {
                    getNameColour(ref.id).then((colour) => {
                        ref.$userColour = colour;
                    });
                }
            } else {
                ref.$userColour = state.trustColor[trustColor];
            }
        }

        window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', async () => {
                if (state.themeMode === 'system') {
                    await changeThemeMode();
                }
            });

        /**
         * @param {string} mode
         */
        function setThemeMode(mode) {
            state.themeMode = mode;
            configRepository.setString('VRCX_ThemeMode', mode);
            applyThemeMode();
        }
        function applyThemeMode() {
            if (state.themeMode === 'light') {
                setIsDarkMode(false);
            } else if (state.themeMode === 'system') {
                setIsDarkMode(systemIsDarkMode());
            } else {
                setIsDarkMode(true);
            }
        }
        /**
         * @param {boolean} isDark
         */
        function setIsDarkMode(isDark) {
            state.isDarkMode = isDark;
            changeAppDarkStyle(isDark);
        }
        function setDisplayVRCPlusIconsAsAvatar() {
            state.displayVRCPlusIconsAsAvatar =
                !state.displayVRCPlusIconsAsAvatar;
            configRepository.setBool(
                'displayVRCPlusIconsAsAvatar',
                state.displayVRCPlusIconsAsAvatar
            );
        }
        function setHideNicknames() {
            state.hideNicknames = !state.hideNicknames;
            configRepository.setBool('VRCX_hideNicknames', state.hideNicknames);
        }
        function setHideTooltips() {
            state.hideTooltips = !state.hideTooltips;
            configRepository.setBool('VRCX_hideTooltips', state.hideTooltips);
        }
        function setIsAgeGatedInstancesVisible() {
            state.isAgeGatedInstancesVisible =
                !state.isAgeGatedInstancesVisible;
            configRepository.setBool(
                'VRCX_isAgeGatedInstancesVisible',
                state.isAgeGatedInstancesVisible
            );
        }
        function setSortFavorites() {
            state.sortFavorites = !state.sortFavorites;
            configRepository.setBool('VRCX_sortFavorites', state.sortFavorites);
        }
        function setInstanceUsersSortAlphabetical() {
            state.instanceUsersSortAlphabetical =
                !state.instanceUsersSortAlphabetical;
            configRepository.setBool(
                'VRCX_instanceUsersSortAlphabetical',
                state.instanceUsersSortAlphabetical
            );
        }
        /**
         * @param {number} size
         */
        function setTablePageSize(size) {
            state.tablePageSize = size;
            configRepository.setInt('VRCX_tablePageSize', size);
        }
        function setDtHour12() {
            state.dtHour12 = !state.dtHour12;
            configRepository.setBool('VRCX_dtHour12', state.dtHour12);
        }
        function setDtIsoFormat() {
            state.dtIsoFormat = !state.dtIsoFormat;
            configRepository.setBool('VRCX_dtIsoFormat', state.dtIsoFormat);
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod1(method) {
            state.sidebarSortMethod1 = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod2(method) {
            state.sidebarSortMethod2 = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod3(method) {
            state.sidebarSortMethod3 = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {Array<string>} methods
         */
        function setSidebarSortMethods(methods) {
            state.sidebarSortMethods = methods;
            configRepository.setString(
                'VRCX_sidebarSortMethods',
                JSON.stringify(methods)
            );
        }
        /**
         * @param {number} width
         */
        function setAsideWidth(width) {
            requestAnimationFrame(() => {
                state.asideWidth = width;
                configRepository.setInt('VRCX_sidePanelWidth', width);
            });
        }
        function setIsSidebarGroupByInstance() {
            state.isSidebarGroupByInstance = !state.isSidebarGroupByInstance;
            configRepository.setBool(
                'VRCX_sidebarGroupByInstance',
                state.isSidebarGroupByInstance
            );
        }
        function setIsHideFriendsInSameInstance() {
            state.isHideFriendsInSameInstance =
                !state.isHideFriendsInSameInstance;
            configRepository.setBool(
                'VRCX_hideFriendsInSameInstance',
                state.isHideFriendsInSameInstance
            );
        }
        function setIsSidebarDivideByFriendGroup() {
            state.isSidebarDivideByFriendGroup =
                !state.isSidebarDivideByFriendGroup;
            configRepository.setBool(
                'VRCX_sidebarDivideByFriendGroup',
                state.isSidebarDivideByFriendGroup
            );
        }
        function setHideUserNotes() {
            state.hideUserNotes = !state.hideUserNotes;
            configRepository.setBool('VRCX_hideUserNotes', state.hideUserNotes);
        }
        function setHideUserMemos() {
            state.hideUserMemos = !state.hideUserMemos;
            configRepository.setBool('VRCX_hideUserMemos', state.hideUserMemos);
        }
        function setHideUnfriends() {
            state.hideUnfriends = !state.hideUnfriends;
            configRepository.setBool('VRCX_hideUnfriends', state.hideUnfriends);
        }
        function setRandomUserColours() {
            state.randomUserColours = !state.randomUserColours;
            configRepository.setBool(
                'VRCX_randomUserColours',
                state.randomUserColours
            );
        }
        /**
         * @param {object} color
         */
        function setTrustColor(color) {
            state.trustColor = color;
            configRepository.setString(
                'VRCX_trustColor',
                JSON.stringify(color)
            );
        }

        function handleSaveSidebarSortOrder() {
            if (state.sidebarSortMethod1 === state.sidebarSortMethod2) {
                state.sidebarSortMethod2 = '';
            }
            if (state.sidebarSortMethod1 === state.sidebarSortMethod3) {
                state.sidebarSortMethod3 = '';
            }
            if (state.sidebarSortMethod2 === state.sidebarSortMethod3) {
                state.sidebarSortMethod3 = '';
            }
            if (!state.sidebarSortMethod1) {
                state.sidebarSortMethod2 = '';
            }
            if (!state.sidebarSortMethod2) {
                state.sidebarSortMethod3 = '';
            }
            const sidebarSortMethods = [
                state.sidebarSortMethod1,
                state.sidebarSortMethod2,
                state.sidebarSortMethod3
            ];
            setSidebarSortMethods(sidebarSortMethods);
        }

        async function mergeOldSortMethodsSettings() {
            const orderFriendsGroupPrivate = await configRepository.getBool(
                'orderFriendGroupPrivate'
            );
            if (orderFriendsGroupPrivate !== null) {
                await configRepository.remove('orderFriendGroupPrivate');

                const orderFriendsGroupStatus = await configRepository.getBool(
                    'orderFriendsGroupStatus'
                );
                await configRepository.remove('orderFriendsGroupStatus');

                const orderFriendsGroupGPS = await configRepository.getBool(
                    'orderFriendGroupGPS'
                );
                await configRepository.remove('orderFriendGroupGPS');

                const orderOnlineFor =
                    await configRepository.getBool('orderFriendGroup0');
                await configRepository.remove('orderFriendGroup0');
                await configRepository.remove('orderFriendGroup1');
                await configRepository.remove('orderFriendGroup2');
                await configRepository.remove('orderFriendGroup3');

                const sortOrder = [];
                if (orderFriendsGroupPrivate) {
                    sortOrder.push('Sort Private to Bottom');
                }
                if (orderFriendsGroupStatus) {
                    sortOrder.push('Sort by Status');
                }
                if (orderOnlineFor && orderFriendsGroupGPS) {
                    sortOrder.push('Sort by Time in Instance');
                }
                if (!orderOnlineFor) {
                    sortOrder.push('Sort Alphabetically');
                }

                if (sortOrder.length > 0) {
                    while (sortOrder.length < 3) {
                        sortOrder.push('');
                    }
                    state.sidebarSortMethods = sortOrder;
                    state.sidebarSortMethod1 = sortOrder[0];
                    state.sidebarSortMethod2 = sortOrder[1];
                    state.sidebarSortMethod3 = sortOrder[2];
                }
                setSidebarSortMethods(sortOrder);
            }
        }

        async function handleSetTablePageSize(pageSize) {
            feedStore.feedTable.pageSize = pageSize;
            gameLogStore.gameLogTable.pageSize = pageSize;
            friendStore.friendLogTable.pageSize = pageSize;
            moderationStore.playerModerationTable.pageSize = pageSize;
            notificationStore.notificationTable.pageSize = pageSize;
            setTablePageSize(pageSize);
        }

        function promptMaxTableSizeDialog() {
            $app.$prompt(
                t('prompt.change_table_size.description'),
                t('prompt.change_table_size.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_table_size.save'),
                    cancelButtonText: t('prompt.change_table_size.cancel'),
                    inputValue: vrcxStore.maxTableSize,
                    inputPattern: /\d+$/,
                    inputErrorMessage: t(
                        'prompt.change_table_size.input_error'
                    ),
                    callback: async (action, instance) => {
                        if (action === 'confirm' && instance.inputValue) {
                            if (instance.inputValue > 10000) {
                                instance.inputValue = 10000;
                            }
                            vrcxStore.maxTableSize = instance.inputValue;
                            await configRepository.setString(
                                'VRCX_maxTableSize',
                                vrcxStore.maxTableSize
                            );
                            database.setMaxTableSize(vrcxStore.maxTableSize);
                            feedStore.feedTableLookup();
                            gameLogStore.gameLogTableLookup();
                        }
                    }
                }
            );
        }

        async function tryInitUserColours() {
            if (!state.randomUserColours) {
                return;
            }
            const colour = await getNameColour(userStore.currentUser.id);
            userStore.currentUser.$userColour = colour;
            await userColourInit();
        }

        return {
            state,

            appLanguage,
            themeMode,
            isDarkMode,
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
            sidebarSortMethods,
            asideWidth,
            isSidebarGroupByInstance,
            isHideFriendsInSameInstance,
            isSidebarDivideByFriendGroup,
            hideUserNotes,
            hideUserMemos,
            hideUnfriends,
            randomUserColours,
            trustColor,
            currentCulture,

            setAppLanguage,
            setDisplayVRCPlusIconsAsAvatar,
            setHideNicknames,
            setHideTooltips,
            setIsAgeGatedInstancesVisible,
            setSortFavorites,
            setInstanceUsersSortAlphabetical,
            setTablePageSize,
            setDtHour12,
            setDtIsoFormat,
            setSidebarSortMethod1,
            setSidebarSortMethod2,
            setSidebarSortMethod3,
            setSidebarSortMethods,
            setAsideWidth,
            setIsSidebarGroupByInstance,
            setIsHideFriendsInSameInstance,
            setIsSidebarDivideByFriendGroup,
            setHideUserNotes,
            setHideUserMemos,
            setHideUnfriends,
            setRandomUserColours,
            setTrustColor,
            saveThemeMode,
            tryInitUserColours,
            updateTrustColor,
            changeThemeMode,
            userColourInit,
            applyUserTrustLevel,
            changeAppLanguage,
            handleSetTablePageSize,
            promptMaxTableSizeDialog
        };
    }
);
