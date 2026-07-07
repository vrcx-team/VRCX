import { ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { router } from '../plugins/router';
import { useAdvancedSettingsStore } from './settings/advanced';
import { watchState } from '../services/watchState';

import configRepository from '../services/config';

export const useAvatarProviderStore = defineStore('AvatarProvider', () => {
    const advancedSettingsStore = useAdvancedSettingsStore();

    const isAvatarProviderDialogVisible = ref(false);

    const avatarRemoteDatabaseProvider = ref(null);

    const avatarRemoteDatabaseProviderList = ref([
        { url: 'https://api.avtrdb.com/v3/avatar/search/vrcx', apiKey: '' }
    ]);
    watch(
        () => watchState.isLoggedIn,
        () => {
            isAvatarProviderDialogVisible.value = false;
        },
        { flush: 'sync' }
    );

    async function initAvatarProviderState() {
        let list = JSON.parse(
            await configRepository.getString(
                'VRCX_avatarRemoteDatabaseProviderList',
                '[ { "url": "https://api.avtrdb.com/v3/avatar/search/vrcx", "apiKey": "" } ]'
            )
        );
        const deprecated = 'https://avtr.just-h.party/vrcx_search.php';
        const v1 = 'https://api.avtrdb.com/v1/avatar/search/vrcx';
        const v2 = 'https://api.avtrdb.com/v2/avatar/search/vrcx';
        const v3 = 'https://api.avtrdb.com/v3/avatar/search/vrcx';

        const newList = list
            .map((u) => (u.url ? u : { url: u, apiKey: '' }))
            .filter((u) => u.url !== deprecated)
            .map((u) => (u.url === v1 || u.url === v2 ? { ...u, url: v3 } : u));

        if (
            JSON.stringify(newList) !==
            JSON.stringify(avatarRemoteDatabaseProviderList.value)
        ) {
            avatarRemoteDatabaseProviderList.value = newList;
            await configRepository.setString(
                'VRCX_avatarRemoteDatabaseProviderList',
                JSON.stringify(newList)
            );
        }

        if (
            await configRepository.getString(
                'VRCX_avatarRemoteDatabaseProvider'
            )
        ) {
            // move existing provider to new list
            const legacyProvider =
                await configRepository.getString(
                    'VRCX_avatarRemoteDatabaseProvider'
                );
            if (
                !avatarRemoteDatabaseProviderList.value.find(p => p.url === legacyProvider)
            ) {
                avatarRemoteDatabaseProviderList.value.push(
                    { url: legacyProvider, apiKey: '' }
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
     * @param {string} apiKey
     */
    function addAvatarProvider(url, apiKey = '') {
        if (!url) {
            return;
        }
        showAvatarProviderDialog();
        const existing = avatarRemoteDatabaseProviderList.value.find(p => p.url === url);
        if (!existing) {
            avatarRemoteDatabaseProviderList.value.push({ url, apiKey });
        } else if (apiKey && !existing.apiKey) {
            existing.apiKey = apiKey;
        }
        saveAvatarProviderList();
    }

    /**
     * @param {string} url
     */
    function removeAvatarProvider(url) {
        const length = avatarRemoteDatabaseProviderList.value.length;
        for (let i = length - 1; i >= 0; --i) {
            if (avatarRemoteDatabaseProviderList.value[i].url === url) {
                avatarRemoteDatabaseProviderList.value.splice(i, 1);
            }
        }
        saveAvatarProviderList();
    }

    async function saveAvatarProviderList() {
        avatarRemoteDatabaseProviderList.value =
            avatarRemoteDatabaseProviderList.value.filter(p => p.url);
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify(avatarRemoteDatabaseProviderList.value)
        );
        if (avatarRemoteDatabaseProviderList.value.length > 0) {
            avatarRemoteDatabaseProvider.value =
                avatarRemoteDatabaseProviderList.value[0];
            advancedSettingsStore.setAvatarRemoteDatabase(true);
        } else {
            avatarRemoteDatabaseProvider.value = null;
            advancedSettingsStore.setAvatarRemoteDatabase(false);
        }
    }

    function showAvatarProviderDialog() {
        router.push({ name: 'settings' });
        isAvatarProviderDialogVisible.value = true;
    }

    /**
     * @param {object} provider
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
