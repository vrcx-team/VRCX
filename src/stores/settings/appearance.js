import { computed, ref, watch } from 'vue';
import { ElMessageBox } from 'element-plus';
import { defineStore } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
    HueToHex,
    changeAppDarkStyle,
    changeAppThemeStyle,
    changeHtmlLangAttribute,
    systemIsDarkMode,
    updateTrustColorClasses
} from '../../shared/utils/base/ui';
import { database } from '../../service/database';
import { getNameColour } from '../../shared/utils';
import { useFeedStore } from '../feed';
import { useFriendStore } from '../friend';
import { useGameLogStore } from '../gameLog';
import { useModerationStore } from '../moderation';
import { useNotificationStore } from '../notification';
import { useUiStore } from '../ui';
import { useUserStore } from '../user';
import { useVrStore } from '../vr';
import { useVrcxStore } from '../vrcx';
import { watchState } from '../../service/watchState';

import configRepository from '../../service/config';

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
        const router = useRouter();
        const uiStore = useUiStore();

        const { t, availableLocales, locale } = useI18n();

        const appLanguage = ref('en');
        const themeMode = ref('');
        const isDarkMode = ref(false);
        const displayVRCPlusIconsAsAvatar = ref(false);
        const hideNicknames = ref(false);
        const isAgeGatedInstancesVisible = ref(false);
        const sortFavorites = ref(true);
        const instanceUsersSortAlphabetical = ref(false);
        const tablePageSize = ref(15);
        const dtHour12 = ref(false);
        const dtIsoFormat = ref(false);
        const sidebarSortMethod1 = ref('Sort Private to Bottom');
        const sidebarSortMethod2 = ref('Sort by Time in Instance');
        const sidebarSortMethod3 = ref('Sort by Last Active');
        const sidebarSortMethods = ref([
            'Sort Private to Bottom',
            'Sort by Time in Instance',
            'Sort by Last Active'
        ]);
        const asideWidth = ref(300);
        const isSidebarGroupByInstance = ref(true);
        const isHideFriendsInSameInstance = ref(false);
        const isSidebarDivideByFriendGroup = ref(false);
        const hideUserNotes = ref(false);
        const hideUserMemos = ref(false);
        const hideUnfriends = ref(false);
        const randomUserColours = ref(false);
        const trustColor = ref({
            untrusted: '#CCCCCC',
            basic: '#1778FF',
            known: '#2BCF5C',
            trusted: '#FF7B42',
            veteran: '#B18FFF',
            vip: '#FF2626',
            troll: '#782F2F'
        });
        const currentCulture = ref('');
        const notificationIconDot = ref(false);
        const isSideBarTabShow = computed(() => {
            const currentRouteName = router.currentRoute.value?.name;
            return !(
                currentRouteName === 'friendLocation' ||
                currentRouteName === 'friendList' ||
                currentRouteName === 'charts'
            );
        });

        async function initAppearanceSettings() {
            const [
                appLanguageConfig,
                themeModeConfig,
                displayVRCPlusIconsAsAvatarConfig,
                hideNicknamesConfig,
                isAgeGatedInstancesVisibleConfig,
                sortFavoritesConfig,
                instanceUsersSortAlphabeticalConfig,
                tablePageSizeConfig,
                dtHour12Config,
                dtIsoFormatConfig,
                sidebarSortMethodsConfig,
                asideWidthConfig,
                isSidebarGroupByInstanceConfig,
                isHideFriendsInSameInstanceConfig,
                isSidebarDivideByFriendGroupConfig,
                hideUserNotesConfig,
                hideUserMemosConfig,
                hideUnfriendsConfig,
                randomUserColoursConfig,
                trustColorConfig,
                notificationIconDotConfig
            ] = await Promise.all([
                configRepository.getString('VRCX_appLanguage'),
                configRepository.getString('VRCX_ThemeMode', 'system'),
                configRepository.getBool('displayVRCPlusIconsAsAvatar', true),
                configRepository.getBool('VRCX_hideNicknames', false),
                configRepository.getBool(
                    'VRCX_isAgeGatedInstancesVisible',
                    true
                ),
                configRepository.getBool('VRCX_sortFavorites', true),
                configRepository.getBool(
                    'VRCX_instanceUsersSortAlphabetical',
                    false
                ),
                configRepository.getInt('VRCX_tablePageSize', 20),
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
                ),
                configRepository.getBool('VRCX_notificationIconDot', true)
            ]);

            if (!appLanguageConfig) {
                const result = await AppApi.CurrentLanguage();

                const lang = result.split('-')[0];
                availableLocales.forEach((ref) => {
                    const refLang = ref.split('_')[0];
                    if (refLang === lang) {
                        changeAppLanguage(ref);
                    }
                });
            } else {
                changeAppLanguage(appLanguageConfig);
            }

            themeMode.value = themeModeConfig;
            applyThemeMode();

            displayVRCPlusIconsAsAvatar.value =
                displayVRCPlusIconsAsAvatarConfig;
            hideNicknames.value = hideNicknamesConfig;
            isAgeGatedInstancesVisible.value = isAgeGatedInstancesVisibleConfig;
            sortFavorites.value = sortFavoritesConfig;
            instanceUsersSortAlphabetical.value =
                instanceUsersSortAlphabeticalConfig;

            setTablePageSize(tablePageSizeConfig);

            dtHour12.value = dtHour12Config;
            dtIsoFormat.value = dtIsoFormatConfig;

            currentCulture.value = await AppApi.CurrentCulture();

            sidebarSortMethods.value = JSON.parse(sidebarSortMethodsConfig);
            if (sidebarSortMethods.value?.length === 3) {
                sidebarSortMethod1.value = sidebarSortMethods.value[0];
                sidebarSortMethod2.value = sidebarSortMethods.value[1];
                sidebarSortMethod3.value = sidebarSortMethods.value[2];
            }

            trustColor.value = JSON.parse(trustColorConfig);
            asideWidth.value = asideWidthConfig;
            isSidebarGroupByInstance.value = isSidebarGroupByInstanceConfig;
            isHideFriendsInSameInstance.value =
                isHideFriendsInSameInstanceConfig;
            isSidebarDivideByFriendGroup.value =
                isSidebarDivideByFriendGroupConfig;
            hideUserNotes.value = hideUserNotesConfig;
            hideUserMemos.value = hideUserMemosConfig;
            hideUnfriends.value = hideUnfriendsConfig;
            randomUserColours.value = randomUserColoursConfig;
            notificationIconDot.value = notificationIconDotConfig;

            // Migrate old settings
            // Assume all exist if one does
            await mergeOldSortMethodsSettings();

            updateTrustColorClasses(trustColor.value);

            vrStore.updateVRConfigVars();
        }

        initAppearanceSettings();

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
            appLanguage.value = language;
            configRepository.setString('VRCX_appLanguage', language);
            locale.value = appLanguage.value;
            changeHtmlLangAttribute(language);
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
            await changeAppThemeStyle(themeMode.value);
            vrStore.updateVRConfigVars();
            await updateTrustColor(undefined, undefined);
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
                    ...trustColor.value,
                    [field]: color
                });
            }
            if (randomUserColours.value) {
                const colour = await getNameColour(userStore.currentUser.id);
                userStore.currentUser.$userColour = colour;
                userColourInit();
            } else {
                applyUserTrustLevel(userStore.currentUser);
                userStore.cachedUsers.forEach((ref) => {
                    applyUserTrustLevel(ref);
                });
            }
            updateTrustColorClasses(trustColor.value);
        }

        async function userColourInit() {
            let dictObject = await AppApi.GetColourBulk(
                Array.from(userStore.cachedUsers.keys())
            );
            if (LINUX) {
                // @ts-ignore
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
            let trustColorTemp = '';
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
                trustColorTemp = 'veteran';
                ref.$trustSortNum = 5;
            } else if (tags.includes('system_trust_trusted')) {
                ref.$trustLevel = 'Known User';
                ref.$trustClass = 'x-tag-trusted';
                trustColorTemp = 'trusted';
                ref.$trustSortNum = 4;
            } else if (tags.includes('system_trust_known')) {
                ref.$trustLevel = 'User';
                ref.$trustClass = 'x-tag-known';
                trustColorTemp = 'known';
                ref.$trustSortNum = 3;
            } else if (tags.includes('system_trust_basic')) {
                ref.$trustLevel = 'New User';
                ref.$trustClass = 'x-tag-basic';
                trustColorTemp = 'basic';
                ref.$trustSortNum = 2;
            } else {
                ref.$trustLevel = 'Visitor';
                ref.$trustClass = 'x-tag-untrusted';
                trustColorTemp = 'untrusted';
                ref.$trustSortNum = 1;
            }
            if (ref.$isTroll || ref.$isProbableTroll) {
                trustColorTemp = 'troll';
                ref.$trustSortNum += 0.1;
            }
            if (ref.$isModerator) {
                trustColorTemp = 'vip';
                ref.$trustSortNum += 0.3;
            }
            if (randomUserColours.value && watchState.isFriendsLoaded) {
                if (!ref.$userColour) {
                    getNameColour(ref.id).then((colour) => {
                        ref.$userColour = colour;
                    });
                }
            } else {
                ref.$userColour = trustColor.value[trustColorTemp];
            }
        }

        window
            .matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', async () => {
                if (themeMode.value === 'system') {
                    await changeThemeMode();
                }
            });

        /**
         * @param {string} mode
         */
        function setThemeMode(mode) {
            themeMode.value = mode;
            configRepository.setString('VRCX_ThemeMode', mode);
            applyThemeMode();
        }
        function applyThemeMode() {
            if (themeMode.value === 'light') {
                setIsDarkMode(false);
            } else if (themeMode.value === 'system') {
                setIsDarkMode(systemIsDarkMode());
            } else {
                setIsDarkMode(true);
            }
        }
        /**
         * @param {boolean} isDark
         */
        function setIsDarkMode(isDark) {
            isDarkMode.value = isDark;
            changeAppDarkStyle(isDark);
        }
        function setDisplayVRCPlusIconsAsAvatar() {
            displayVRCPlusIconsAsAvatar.value =
                !displayVRCPlusIconsAsAvatar.value;
            configRepository.setBool(
                'displayVRCPlusIconsAsAvatar',
                displayVRCPlusIconsAsAvatar.value
            );
        }
        function setNotificationIconDot() {
            notificationIconDot.value = !notificationIconDot.value;
            configRepository.setBool(
                'VRCX_notificationIconDot',
                notificationIconDot.value
            );
            uiStore.updateTrayIconNotify();
        }
        function setHideNicknames() {
            hideNicknames.value = !hideNicknames.value;
            configRepository.setBool('VRCX_hideNicknames', hideNicknames.value);
        }
        function setIsAgeGatedInstancesVisible() {
            isAgeGatedInstancesVisible.value =
                !isAgeGatedInstancesVisible.value;
            configRepository.setBool(
                'VRCX_isAgeGatedInstancesVisible',
                isAgeGatedInstancesVisible.value
            );
        }
        function setSortFavorites() {
            sortFavorites.value = !sortFavorites.value;
            configRepository.setBool('VRCX_sortFavorites', sortFavorites.value);
        }
        function setInstanceUsersSortAlphabetical() {
            instanceUsersSortAlphabetical.value =
                !instanceUsersSortAlphabetical.value;
            configRepository.setBool(
                'VRCX_instanceUsersSortAlphabetical',
                instanceUsersSortAlphabetical.value
            );
        }
        /**
         * @param {number} size
         */
        function setTablePageSize(size) {
            feedStore.feedTable.pageSize = size;
            gameLogStore.gameLogTable.pageSize = size;
            friendStore.friendLogTable.pageSize = size;
            moderationStore.playerModerationTable.pageSize = size;
            notificationStore.notificationTable.pageSize = size;

            tablePageSize.value = size;
            configRepository.setInt('VRCX_tablePageSize', size);
        }
        function setDtHour12() {
            dtHour12.value = !dtHour12.value;
            configRepository.setBool('VRCX_dtHour12', dtHour12.value);
        }
        function setDtIsoFormat() {
            dtIsoFormat.value = !dtIsoFormat.value;
            configRepository.setBool('VRCX_dtIsoFormat', dtIsoFormat.value);
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod1(method) {
            sidebarSortMethod1.value = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod2(method) {
            sidebarSortMethod2.value = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {string} method
         */
        function setSidebarSortMethod3(method) {
            sidebarSortMethod3.value = method;
            handleSaveSidebarSortOrder();
        }
        /**
         * @param {Array<string>} methods
         */
        function setSidebarSortMethods(methods) {
            sidebarSortMethods.value = methods;
            configRepository.setString(
                'VRCX_sidebarSortMethods',
                JSON.stringify(methods)
            );
        }
        /**
         * @param {number} panelNumber
         * @param {Array<number>} widthArray
         */
        function setAsideWidth(panelNumber, widthArray) {
            if (Array.isArray(widthArray) && widthArray[1]) {
                requestAnimationFrame(() => {
                    asideWidth.value = widthArray[1];
                    configRepository.setInt(
                        'VRCX_sidePanelWidth',
                        widthArray[1]
                    );
                });
            }
        }
        function setIsSidebarGroupByInstance() {
            isSidebarGroupByInstance.value = !isSidebarGroupByInstance.value;
            configRepository.setBool(
                'VRCX_sidebarGroupByInstance',
                isSidebarGroupByInstance.value
            );
        }
        function setIsHideFriendsInSameInstance() {
            isHideFriendsInSameInstance.value =
                !isHideFriendsInSameInstance.value;
            configRepository.setBool(
                'VRCX_hideFriendsInSameInstance',
                isHideFriendsInSameInstance.value
            );
        }
        function setIsSidebarDivideByFriendGroup() {
            isSidebarDivideByFriendGroup.value =
                !isSidebarDivideByFriendGroup.value;
            configRepository.setBool(
                'VRCX_sidebarDivideByFriendGroup',
                isSidebarDivideByFriendGroup.value
            );
        }
        function setHideUserNotes() {
            hideUserNotes.value = !hideUserNotes.value;
            configRepository.setBool('VRCX_hideUserNotes', hideUserNotes.value);
        }
        function setHideUserMemos() {
            hideUserMemos.value = !hideUserMemos.value;
            configRepository.setBool('VRCX_hideUserMemos', hideUserMemos.value);
        }
        function setHideUnfriends() {
            hideUnfriends.value = !hideUnfriends.value;
            configRepository.setBool('VRCX_hideUnfriends', hideUnfriends.value);
        }
        function setRandomUserColours() {
            randomUserColours.value = !randomUserColours.value;
            configRepository.setBool(
                'VRCX_randomUserColours',
                randomUserColours.value
            );
        }
        /**
         * @param {object} color
         */
        function setTrustColor(color) {
            trustColor.value = color;
            configRepository.setString(
                'VRCX_trustColor',
                JSON.stringify(color)
            );
        }

        function handleSaveSidebarSortOrder() {
            if (sidebarSortMethod1.value === sidebarSortMethod2.value) {
                sidebarSortMethod2.value = '';
            }
            if (sidebarSortMethod1.value === sidebarSortMethod3.value) {
                sidebarSortMethod3.value = '';
            }
            if (sidebarSortMethod2.value === sidebarSortMethod3.value) {
                sidebarSortMethod3.value = '';
            }
            if (!sidebarSortMethod1.value) {
                sidebarSortMethod2.value = '';
            }
            if (!sidebarSortMethod2.value) {
                sidebarSortMethod3.value = '';
            }
            const sidebarSortMethods = [
                sidebarSortMethod1.value,
                sidebarSortMethod2.value,
                sidebarSortMethod3.value
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
                    sidebarSortMethods.value = sortOrder;
                    sidebarSortMethod1.value = sortOrder[0];
                    sidebarSortMethod2.value = sortOrder[1];
                    sidebarSortMethod3.value = sortOrder[2];
                }
                setSidebarSortMethods(sortOrder);
            }
        }

        function promptMaxTableSizeDialog() {
            ElMessageBox.prompt(
                t('prompt.change_table_size.description'),
                t('prompt.change_table_size.header'),
                {
                    distinguishCancelAndClose: true,
                    confirmButtonText: t('prompt.change_table_size.save'),
                    cancelButtonText: t('prompt.change_table_size.cancel'),
                    inputValue: vrcxStore.maxTableSize.toString(),
                    inputPattern: /\d+$/,
                    inputErrorMessage: t('prompt.change_table_size.input_error')
                }
            )
                .then(async ({ value }) => {
                    if (value) {
                        let processedValue = Number(value);
                        if (processedValue > 10000) {
                            processedValue = 10000;
                        }
                        vrcxStore.maxTableSize = processedValue;
                        await configRepository.setString(
                            'VRCX_maxTableSize',
                            vrcxStore.maxTableSize.toString()
                        );
                        database.setMaxTableSize(vrcxStore.maxTableSize);
                        feedStore.feedTableLookup();
                        gameLogStore.gameLogTableLookup();
                    }
                })
                .catch(() => {});
        }

        async function tryInitUserColours() {
            if (!randomUserColours.value) {
                return;
            }
            const colour = await getNameColour(userStore.currentUser.id);
            userStore.currentUser.$userColour = colour;
            await userColourInit();
        }

        return {
            appLanguage,
            themeMode,
            isDarkMode,
            displayVRCPlusIconsAsAvatar,
            hideNicknames,
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
            isSideBarTabShow,
            notificationIconDot,

            setAppLanguage,
            setDisplayVRCPlusIconsAsAvatar,
            setHideNicknames,
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
            promptMaxTableSizeDialog,
            setNotificationIconDot
        };
    }
);
