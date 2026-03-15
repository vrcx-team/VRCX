import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';

import { instanceRequest, userRequest } from '../api';
import { groupRequest } from '../api/';
import { useAppearanceSettingsStore } from './settings/appearance';
import { showGroupDialog } from '../coordinators/groupCoordinator';
import { showWorldDialog } from '../coordinators/worldCoordinator';
import { showAvatarDialog } from '../coordinators/avatarCoordinator';
import { applyUser, showUserDialog } from '../coordinators/userCoordinator';
import { useModalStore } from './modal';
import { useUserStore } from './user';
import { watchState } from '../services/watchState';

export const useSearchStore = defineStore('Search', () => {
    const userStore = useUserStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const modalStore = useModalStore();
    const { t } = useI18n();

    const searchText = ref('');
    const searchUserResults = ref([]);
    const friendsListSearch = ref('');

    const directAccessPrompt = ref(null);

    const stringComparer = computed(() =>
        Intl.Collator(appearanceSettingsStore.appLanguage.replace('_', '-'), {
            usage: 'search',
            sensitivity: 'base'
        })
    );

    watch(
        () => watchState.isLoggedIn,
        () => {
            searchText.value = '';
            searchUserResults.value = [];
        },
        { flush: 'sync' }
    );

    function clearSearch() {
        searchText.value = '';
        searchUserResults.value = [];
    }

    /**
     * @param {string} value
     */
    function setSearchText(value) {
        searchText.value = value;
    }

    async function searchUserByDisplayName(displayName) {
        const params = {
            n: 10,
            offset: 0,
            fuzzy: false,
            search: displayName
        };
        await moreSearchUser(null, params);
    }

    async function moreSearchUser(go, params) {
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        await userRequest.getUsers(params).then((args) => {
            for (const json of args.json) {
                if (!json.displayName) {
                    console.error('getUsers gave us garbage', json);
                    continue;
                }
                applyUser(json);
            }

            const map = new Map();
            for (const json of args.json) {
                const ref = userStore.cachedUsers.get(json.id);
                if (typeof ref !== 'undefined') {
                    map.set(ref.id, ref);
                }
            }
            searchUserResults.value = Array.from(map.values());
            return args;
        });
    }

    async function directAccessPaste() {
        let cbText = '';
        if (LINUX) {
            cbText = await window.electron.getClipboardText();
        } else {
            cbText = await AppApi.GetClipboard().catch((e) => {
                console.log(e);
                return '';
            });
        }

        let trimemd = cbText.trim();
        if (!directAccessParse(trimemd)) {
            promptOmniDirectDialog();
        } else {
            toast.success(
                t('prompt.direct_access_omni.message.opened_from_clipboard')
            );
        }
    }

    function directAccessParse(input) {
        if (!input) {
            return false;
        }
        if (directAccessWorld(input)) {
            return true;
        }
        if (input.startsWith('https://vrchat.')) {
            const url = new URL(input);
            const urlPath = url.pathname;
            const urlPathSplit = urlPath.split('/');
            if (urlPathSplit.length < 4) {
                return false;
            }
            const type = urlPathSplit[2];
            if (type === 'user') {
                const userId = urlPathSplit[3];
                showUserDialog(userId);
                return true;
            } else if (type === 'avatar') {
                const avatarId = urlPathSplit[3];
                showAvatarDialog(avatarId);
                return true;
            } else if (type === 'group') {
                const groupId = urlPathSplit[3];
                showGroupDialog(groupId);
                return true;
            }
        } else if (input.startsWith('https://vrc.group/')) {
            const shortCode = input.substring(18);
            showGroupDialogShortCode(shortCode);
            return true;
        } else if (/^[A-Za-z0-9]{3,6}\.[0-9]{4}$/g.test(input)) {
            showGroupDialogShortCode(input);
            return true;
        } else if (
            input.substring(0, 4) === 'usr_' ||
            /^[A-Za-z0-9]{10}$/g.test(input)
        ) {
            showUserDialog(input);
            return true;
        } else if (
            input.substring(0, 5) === 'avtr_' ||
            input.substring(0, 2) === 'b_'
        ) {
            showAvatarDialog(input);
            return true;
        } else if (input.substring(0, 4) === 'grp_') {
            showGroupDialog(input);
            return true;
        }
        return false;
    }

    function directAccessWorld(textBoxInput) {
        let worldId;
        let shortName;
        let input = textBoxInput;
        if (input.startsWith('/home/')) {
            input = `https://vrchat.com${input}`;
        }
        if (input.length === 8) {
            return verifyShortName('', input);
        } else if (input.startsWith('https://vrch.at/')) {
            shortName = input.substring(16, 24);
            return verifyShortName('', shortName);
        } else if (
            input.startsWith('https://vrchat.') ||
            input.startsWith('/home/')
        ) {
            const url = new URL(input);
            const urlPath = url.pathname;
            const urlPathSplit = urlPath.split('/');
            if (urlPathSplit.length >= 4 && urlPathSplit[2] === 'world') {
                worldId = urlPathSplit[3];
                showWorldDialog(worldId);
                return true;
            } else if (urlPath.substring(5, 12) === '/launch') {
                const urlParams = new URLSearchParams(url.search);
                worldId = urlParams.get('worldId');
                const instanceId = urlParams.get('instanceId');
                if (instanceId) {
                    shortName = urlParams.get('shortName');
                    const location = `${worldId}:${instanceId}`;
                    if (shortName) {
                        return verifyShortName(location, shortName);
                    }
                    showWorldDialog(location);
                    return true;
                } else if (worldId) {
                    showWorldDialog(worldId);
                    return true;
                }
            }
        } else if (
            input.substring(0, 5) === 'wrld_' ||
            input.substring(0, 4) === 'wld_' ||
            input.substring(0, 2) === 'o_'
        ) {
            // a bit hacky, but supports weird malformed inputs cut out from url, why not
            if (input.indexOf('&instanceId=') >= 0) {
                input = `https://vrchat.com/home/launch?worldId=${input}`;
                return directAccessWorld(input);
            }
            showWorldDialog(input.trim());
            return true;
        }
        return false;
    }

    async function promptOmniDirectDialog() {
        if (directAccessPrompt.value) return;

        // Element Plus: prompt(message, title, options)
        directAccessPrompt.value = modalStore.prompt({
            title: t('prompt.direct_access_omni.header'),
            description: t('prompt.direct_access_omni.description'),
            confirmText: t('prompt.direct_access_omni.ok'),
            cancelText: t('prompt.direct_access_omni.cancel'),
            pattern: /\S+/,
            errorMessage: t('prompt.direct_access_omni.input_error')
        });

        try {
            const { ok, value } = await directAccessPrompt.value;

            if (ok && value) {
                const input = value.trim();
                if (!directAccessParse(input)) {
                    toast.error(t('prompt.direct_access_omni.message.error'));
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            directAccessPrompt.value = null;
        }
    }

    function showGroupDialogShortCode(shortCode) {
        groupRequest.groupStrictsearch({ query: shortCode }).then((args) => {
            for (const group of args.json) {
                if (`${group.shortCode}.${group.discriminator}` === shortCode) {
                    showGroupDialog(group.id);
                    break;
                }
            }
            return args;
        });
    }

    function verifyShortName(location, shortName) {
        return instanceRequest
            .getInstanceFromShortName({ shortName })
            .then((args) => {
                const newLocation = args.json.location;
                const newShortName = args.json.shortName;
                if (newShortName) {
                    showWorldDialog(newLocation, newShortName);
                } else if (newLocation) {
                    showWorldDialog(newLocation);
                } else {
                    showWorldDialog(location);
                }
                return args;
            });
    }

    return {
        searchText,
        searchUserResults,
        stringComparer,
        friendsListSearch,

        clearSearch,
        searchUserByDisplayName,
        moreSearchUser,
        directAccessParse,
        directAccessPaste,
        directAccessWorld,
        verifyShortName,
        setSearchText
    };
});
