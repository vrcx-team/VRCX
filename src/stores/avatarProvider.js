import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import configRepository from '../service/config';
import { watchState } from '../service/watchState';
import { useAdvancedSettingsStore } from './settings/advanced';

export const useAvatarProviderStore = defineStore('AvatarProvider', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();
    const state = reactive({
        isAvatarProviderDialogVisible: false,

        avatarRemoteDatabaseProvider: '',
        avatarRemoteDatabaseProviderList: [
            'https://api.avtrdb.com/v2/avatar/search/vrcx',
            'https://avtr.just-h.party/vrcx_search.php'
        ]
    });

    async function initAvatarProviderState() {
        state.avatarRemoteDatabaseProviderList = JSON.parse(
            await configRepository.getString(
                'VRCX_avatarRemoteDatabaseProviderList',
                '[ "https://api.avtrdb.com/v2/avatar/search/vrcx", "https://avtr.just-h.party/vrcx_search.php" ]'
            )
        );
        if (
            state.avatarRemoteDatabaseProviderList.length === 1 &&
            state.avatarRemoteDatabaseProviderList[0] ===
                'https://avtr.just-h.party/vrcx_search.php'
        ) {
            state.avatarRemoteDatabaseProviderList.unshift(
                'https://api.avtrdb.com/v2/avatar/search/vrcx'
            );
            await configRepository.setString(
                'VRCX_avatarRemoteDatabaseProviderList',
                JSON.stringify(state.avatarRemoteDatabaseProviderList)
            );
        }

        if (
            await configRepository.getString(
                'VRCX_avatarRemoteDatabaseProvider'
            )
        ) {
            // move existing provider to new list
            const avatarRemoteDatabaseProvider =
                await configRepository.getString(
                    'VRCX_avatarRemoteDatabaseProvider'
                );
            if (
                !state.avatarRemoteDatabaseProviderList.includes(
                    avatarRemoteDatabaseProvider
                )
            ) {
                state.avatarRemoteDatabaseProviderList.push(
                    avatarRemoteDatabaseProvider
                );
            }
            await configRepository.remove('VRCX_avatarRemoteDatabaseProvider');
            await configRepository.setString(
                'VRCX_avatarRemoteDatabaseProviderList',
                JSON.stringify(state.avatarRemoteDatabaseProviderList)
            );
        }
        if (state.avatarRemoteDatabaseProviderList.length > 0) {
            state.avatarRemoteDatabaseProvider =
                state.avatarRemoteDatabaseProviderList[0];
        }
    }

    const isAvatarProviderDialogVisible = computed({
        get() {
            return state.isAvatarProviderDialogVisible;
        },
        set(value) {
            state.isAvatarProviderDialogVisible = value;
        }
    });

    const avatarRemoteDatabaseProvider = computed({
        get() {
            return state.avatarRemoteDatabaseProvider;
        },
        set(value) {
            state.avatarRemoteDatabaseProvider = value;
        }
    });

    const avatarRemoteDatabaseProviderList = computed({
        get() {
            return state.avatarRemoteDatabaseProviderList;
        },
        set(value) {
            state.avatarRemoteDatabaseProviderList = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.isAvatarProviderDialogVisible = false;
        },
        { flush: 'sync' }
    );

    /**
     * @param {string} url
     */
    function addAvatarProvider(url) {
        if (!url) {
            return;
        }
        showAvatarProviderDialog();
        if (!state.avatarRemoteDatabaseProviderList.includes(url)) {
            state.avatarRemoteDatabaseProviderList.push(url);
        }
        saveAvatarProviderList();
    }

    /**
     * @param {string} url
     */
    function removeAvatarProvider(url) {
        const length = state.avatarRemoteDatabaseProviderList.length;
        for (let i = 0; i < length; ++i) {
            if (state.avatarRemoteDatabaseProviderList[i] === url) {
                state.avatarRemoteDatabaseProviderList.splice(i, 1);
            }
        }
        saveAvatarProviderList();
    }

    async function saveAvatarProviderList() {
        const length = state.avatarRemoteDatabaseProviderList.length;
        for (let i = 0; i < length; ++i) {
            if (!state.avatarRemoteDatabaseProviderList[i]) {
                state.avatarRemoteDatabaseProviderList.splice(i, 1);
            }
        }
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify(state.avatarRemoteDatabaseProviderList)
        );
        if (state.avatarRemoteDatabaseProviderList.length > 0) {
            state.avatarRemoteDatabaseProvider =
                state.avatarRemoteDatabaseProviderList[0];
            advancedSettingsStore.setAvatarRemoteDatabase(true);
        } else {
            state.avatarRemoteDatabaseProvider = '';
            advancedSettingsStore.setAvatarRemoteDatabase(false);
        }
    }

    function showAvatarProviderDialog() {
        state.isAvatarProviderDialogVisible = true;
    }

    /**
     * @param {string} provider
     */
    function setAvatarProvider(provider) {
        state.avatarRemoteDatabaseProvider = provider;
    }

    initAvatarProviderState();

    return {
        state,

        isAvatarProviderDialogVisible,
        avatarRemoteDatabaseProvider,
        avatarRemoteDatabaseProviderList,

        addAvatarProvider,
        removeAvatarProvider,
        saveAvatarProviderList,
        showAvatarProviderDialog,
        setAvatarProvider
    };
});
