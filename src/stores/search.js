import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { instanceRequest, userRequest } from '../api';
import { groupRequest } from '../api/';
import removeConfusables, { removeWhitespace } from '../service/confusables';
import { watchState } from '../service/watchState';
import { compareByName, localeIncludes } from '../shared/utils';
import { useAvatarStore } from './avatar';
import { useFriendStore } from './friend';
import { useGroupStore } from './group';
import { useAppearanceSettingsStore } from './settings/appearance';
import { useUiStore } from './ui';
import { useUserStore } from './user';
import { useWorldStore } from './world';
import { useI18n } from 'vue-i18n';

export const useSearchStore = defineStore('Search', () => {
    const userStore = useUserStore();
    const uiStore = useUiStore();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const friendStore = useFriendStore();
    const worldStore = useWorldStore();
    const avatarStore = useAvatarStore();
    const groupStore = useGroupStore();
    const { t } = useI18n();

    const state = reactive({
        searchText: '',
        searchUserResults: [],
        quickSearchItems: [],
        friendsListSearch: ''
    });

    const searchText = computed({
        get: () => state.searchText,
        set: (value) => {
            state.searchText = value;
        }
    });

    const searchUserResults = computed({
        get: () => state.searchUserResults,
        set: (value) => {
            state.searchUserResults = value;
        }
    });

    const quickSearchItems = computed({
        get: () => state.quickSearchItems,
        set: (value) => {
            state.quickSearchItems = value;
        }
    });

    const stringComparer = computed(() =>
        Intl.Collator(appearanceSettingsStore.appLanguage.replace('_', '-'), {
            usage: 'search',
            sensitivity: 'base'
        })
    );

    const friendsListSearch = computed({
        get: () => state.friendsListSearch,
        set: (value) => {
            state.friendsListSearch = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        () => {
            state.searchText = '';
            state.searchUserResults = [];
        },
        { flush: 'sync' }
    );

    function clearSearch() {
        state.searchText = '';
        state.searchUserResults = [];
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
                userStore.applyUser(json);
            }

            const map = new Map();
            for (const json of args.json) {
                const ref = userStore.cachedUsers.get(json.id);
                if (typeof ref !== 'undefined') {
                    map.set(ref.id, ref);
                }
            }
            state.searchUserResults = Array.from(map.values());
            return args;
        });
    }

    function quickSearchRemoteMethod(query) {
        if (!query) {
            state.quickSearchItems = quickSearchUserHistory();
            return;
        }

        const results = [];
        const cleanQuery = removeWhitespace(query);

        for (const ctx of friendStore.friends.values()) {
            if (typeof ctx.ref === 'undefined') {
                continue;
            }

            const cleanName = removeConfusables(ctx.name);
            let match = localeIncludes(
                cleanName,
                cleanQuery,
                stringComparer.value
            );
            if (!match) {
                // Also check regular name in case search is with special characters
                match = localeIncludes(
                    ctx.name,
                    cleanQuery,
                    stringComparer.value
                );
            }
            // Use query with whitespace for notes and memos as people are more
            // likely to include spaces in memos and notes
            if (!match && ctx.memo) {
                match = localeIncludes(ctx.memo, query, stringComparer.value);
            }
            if (!match && ctx.ref.note) {
                match = localeIncludes(
                    ctx.ref.note,
                    query,
                    stringComparer.value
                );
            }

            if (match) {
                results.push({
                    value: ctx.id,
                    label: ctx.name,
                    ref: ctx.ref,
                    name: ctx.name
                });
            }
        }

        results.sort(function (a, b) {
            const A =
                stringComparer.value.compare(
                    a.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            const B =
                stringComparer.value.compare(
                    b.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            if (A && !B) {
                return -1;
            } else if (B && !A) {
                return 1;
            }
            return compareByName(a, b);
        });
        if (results.length > 4) {
            results.length = 4;
        }
        results.push({
            value: `search:${query}`,
            label: query
        });

        state.quickSearchItems = results;
    }

    function quickSearchChange(value) {
        if (value) {
            if (value.startsWith('search:')) {
                const searchText = value.substr(7);
                if (state.quickSearchItems.length > 1 && searchText.length) {
                    state.friendsListSearch = searchText;
                    uiStore.menuActiveIndex = 'friendList';
                } else {
                    uiStore.menuActiveIndex = 'search';
                    state.searchText = searchText;
                    userStore.lookupUser({ displayName: searchText });
                }
            } else {
                userStore.showUserDialog(value);
            }
        }
    }

    function quickSearchUserHistory() {
        const userHistory = Array.from(userStore.showUserDialogHistory.values())
            .reverse()
            .slice(0, 5);
        const results = [];
        userHistory.forEach((userId) => {
            const ref = userStore.cachedUsers.get(userId);
            if (typeof ref !== 'undefined') {
                results.push({
                    value: ref.id,
                    label: ref.name,
                    ref
                });
            }
        });
        return results;
    }

    function directAccessPaste() {
        AppApi.GetClipboard().then((clipboard) => {
            if (!directAccessParse(clipboard.trim())) {
                promptOmniDirectDialog();
            }
        });
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
                userStore.showUserDialog(userId);
                return true;
            } else if (type === 'avatar') {
                const avatarId = urlPathSplit[3];
                avatarStore.showAvatarDialog(avatarId);
                return true;
            } else if (type === 'group') {
                const groupId = urlPathSplit[3];
                groupStore.showGroupDialog(groupId);
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
            userStore.showUserDialog(input);
            return true;
        } else if (input.substring(0, 5) === 'avtr_') {
            avatarStore.showAvatarDialog(input);
            return true;
        } else if (input.substring(0, 4) === 'grp_') {
            groupStore.showGroupDialog(input);
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
                worldStore.showWorldDialog(worldId);
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
                    worldStore.showWorldDialog(location);
                    return true;
                } else if (worldId) {
                    worldStore.showWorldDialog(worldId);
                    return true;
                }
            }
        } else if (input.substring(0, 5) === 'wrld_') {
            // a bit hacky, but supports weird malformed inputs cut out from url, why not
            if (input.indexOf('&instanceId=') >= 0) {
                input = `https://vrchat.com/home/launch?worldId=${input}`;
                return directAccessWorld(input);
            }
            worldStore.showWorldDialog(input.trim());
            return true;
        }
        return false;
    }

    function promptOmniDirectDialog() {
        ElMessageBox.prompt(
            t('prompt.direct_access_omni.description'),
            t('prompt.direct_access_omni.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.direct_access_omni.ok'),
                cancelButtonText: t('prompt.direct_access_omni.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.direct_access_omni.input_error'),
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue) {
                        const input = instance.inputValue.trim();
                        if (!directAccessParse(input)) {
                            ElMessage({
                                message: t(
                                    'prompt.direct_access_omni.message.error'
                                ),
                                type: 'error'
                            });
                        }
                    }
                }
            }
        );
    }

    function showGroupDialogShortCode(shortCode) {
        groupRequest.groupStrictsearch({ query: shortCode }).then((args) => {
            for (const group of args.json) {
                if (`${group.shortCode}.${group.discriminator}` === shortCode) {
                    groupStore.showGroupDialog(group.id);
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
                    worldStore.showWorldDialog(newLocation, newShortName);
                } else if (newLocation) {
                    worldStore.showWorldDialog(newLocation);
                } else {
                    worldStore.showWorldDialog(location);
                }
                return args;
            });
    }

    return {
        state,

        searchText,
        searchUserResults,
        stringComparer,
        quickSearchItems,
        friendsListSearch,

        clearSearch,
        searchUserByDisplayName,
        moreSearchUser,
        quickSearchUserHistory,
        quickSearchRemoteMethod,
        quickSearchChange,
        directAccessParse,
        directAccessPaste,
        directAccessWorld,
        verifyShortName
    };
});
