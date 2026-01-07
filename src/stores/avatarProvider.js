import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { removeFromArray } from '../shared/utils';
import { useAdvancedSettingsStore } from './settings/advanced';
import { watchState } from '../service/watchState';

import configRepository from '../service/config';

export const useAvatarProviderStore = defineStore('AvatarProvider', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();

    const isAvatarProviderDialogVisible = ref(false);

    const avatarRemoteDatabaseProvider = ref('');

    const avatarRemoteDatabaseProviderList = ref([
        'https://api.avtrdb.com/v2/avatar/search/vrcx'
    ]);
    watch(
        () => watchState.isLoggedIn,
        () => {
            isAvatarProviderDialogVisible.value = false;
        },
        { flush: 'sync' }
    );

    async function initAvatarProviderState() {
        avatarRemoteDatabaseProviderList.value = JSON.parse(
            await configRepository.getString(
                'VRCX_avatarRemoteDatabaseProviderList',
                '[ "https://api.avtrdb.com/v2/avatar/search/vrcx" ]'
            )
        );
        if (
            avatarRemoteDatabaseProviderList.value.includes(
                'https://avtr.just-h.party/vrcx_search.php'
            )
        ) {
            removeFromArray(
                avatarRemoteDatabaseProviderList.value,
                'https://avtr.just-h.party/vrcx_search.php'
            );
            await configRepository.setString(
                'VRCX_avatarRemoteDatabaseProviderList',
                JSON.stringify(avatarRemoteDatabaseProviderList.value)
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
                !avatarRemoteDatabaseProviderList.value.includes(
                    avatarRemoteDatabaseProvider
                )
            ) {
                avatarRemoteDatabaseProviderList.value.push(
                    avatarRemoteDatabaseProvider
                );
            }
            await configRepository.remove('VRCX_avatarRemoteDatabaseProvider');
            await configRepository.setString(
                'VRCX_avatarRemoteDatabaseProviderList',
                JSON.stringify(avatarRemoteDatabaseProviderList.value)
            );
        }
        if (avatarRemoteDatabaseProviderList.value.length > 0) {
            avatarRemoteDatabaseProvider.value =
                avatarRemoteDatabaseProviderList.value[0];
        }
    }

    /**
     * @param {string} url
     */
    function addAvatarProvider(url) {
        if (!url) {
            return;
        }
        showAvatarProviderDialog();
        if (!avatarRemoteDatabaseProviderList.value.includes(url)) {
            avatarRemoteDatabaseProviderList.value.push(url);
        }
        saveAvatarProviderList();
    }

    /**
     * @param {string} url
     */
    function removeAvatarProvider(url) {
        const length = avatarRemoteDatabaseProviderList.value.length;
        for (let i = 0; i < length; ++i) {
            if (avatarRemoteDatabaseProviderList.value[i] === url) {
                avatarRemoteDatabaseProviderList.value.splice(i, 1);
            }
        }
        saveAvatarProviderList();
    }

    async function saveAvatarProviderList() {
        const length = avatarRemoteDatabaseProviderList.value.length;
        for (let i = 0; i < length; ++i) {
            if (!avatarRemoteDatabaseProviderList.value[i]) {
                avatarRemoteDatabaseProviderList.value.splice(i, 1);
            }
        }
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify(avatarRemoteDatabaseProviderList.value)
        );
        if (avatarRemoteDatabaseProviderList.value.length > 0) {
            avatarRemoteDatabaseProvider.value =
                avatarRemoteDatabaseProviderList.value[0];
            advancedSettingsStore.setAvatarRemoteDatabase(true);
        } else {
            avatarRemoteDatabaseProvider.value = '';
            advancedSettingsStore.setAvatarRemoteDatabase(false);
        }
    }

    function showAvatarProviderDialog() {
        isAvatarProviderDialogVisible.value = true;
    }

    /**
     * @param {string} provider
     */
    function setAvatarProvider(provider) {
        avatarRemoteDatabaseProvider.value = provider;
    }

    initAvatarProviderState();

    return {
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
