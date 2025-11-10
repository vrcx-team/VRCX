<template>
    <div class="x-container">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <el-input
                :model-value="searchText"
                :placeholder="t('view.search.search_placeholder')"
                style="flex: 1"
                @input="updateSearchText"
                @keyup.enter="search"></el-input>
            <el-tooltip placement="bottom" :content="t('view.search.clear_results_tooltip')">
                <el-button
                    type="default"
                    :icon="Delete"
                    circle
                    style="flex: none; margin-left: 10px"
                    @click="handleClearSearch"></el-button>
            </el-tooltip>
        </div>
        <el-tabs ref="searchTabRef" type="card" style="margin-top: 15px" @tab-click="searchText = ''">
            <el-tab-pane v-loading="isSearchUserLoading" :label="t('view.search.user.header')" style="min-height: 60px">
                <el-checkbox v-model="searchUserByBio" style="margin-left: 10px">{{
                    t('view.search.user.search_by_bio')
                }}</el-checkbox>
                <el-checkbox v-model="searchUserSortByLastLoggedIn" style="margin-left: 10px">{{
                    t('view.search.user.sort_by_last_logged_in')
                }}</el-checkbox>
                <div class="x-friend-list" style="min-height: 500px">
                    <div
                        v-for="user in searchUserResults"
                        :key="user.id"
                        class="x-friend-item"
                        @click="showUserDialog(user.id)">
                        <div class="avatar">
                            <img :src="userImage(user, true)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="user.displayName"></span>
                            <span
                                v-if="randomUserColours"
                                class="extra"
                                :class="user.$trustClass"
                                v-text="user.$trustLevel"></span>
                            <span
                                v-else
                                class="extra"
                                :style="{ color: user.$userColour }"
                                v-text="user.$trustLevel"></span>
                        </div>
                    </div>
                </div>
                <el-button-group v-if="searchUserResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchUserParams.offset"
                        :icon="Back"
                        size="small"
                        @click="handleMoreSearchUser(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchUserResults.length < 10"
                        :icon="Right"
                        size="small"
                        @click="handleMoreSearchUser(1)"
                        >{{ t('view.search.next_page') }}</el-button
                    >
                </el-button-group>
            </el-tab-pane>
            <el-tab-pane
                v-loading="isSearchWorldLoading"
                :label="t('view.search.world.header')"
                style="min-height: 60px">
                <el-dropdown
                    size="small"
                    trigger="click"
                    style="margin-bottom: 15px"
                    @command="(row) => searchWorld(row)">
                    <el-button size="small"
                        >{{ t('view.search.world.category') }} <el-icon class="el-icon--right"><ArrowDown /></el-icon
                    ></el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="row in cachedConfig.dynamicWorldRows"
                                :key="row.index"
                                :command="row"
                                v-text="row.name"></el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
                <el-checkbox v-model="searchWorldLabs" style="margin-left: 10px">{{
                    t('view.search.world.community_lab')
                }}</el-checkbox>
                <div class="x-friend-list" style="min-height: 500px">
                    <div
                        v-for="world in searchWorldResults"
                        :key="world.id"
                        class="x-friend-item"
                        @click="showWorldDialog(world.id)">
                        <div class="avatar">
                            <img :src="world.thumbnailImageUrl" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="world.name"></span>
                            <span v-if="world.occupants" class="extra"
                                >{{ world.authorName }} ({{ world.occupants }})</span
                            >
                            <span v-else class="extra" v-text="world.authorName"></span>
                        </div>
                    </div>
                </div>
                <el-button-group v-if="searchWorldResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchWorldParams.offset"
                        :icon="Back"
                        size="small"
                        @click="moreSearchWorld(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchWorldResults.length < 10"
                        :icon="Right"
                        size="small"
                        @click="moreSearchWorld(1)"
                        >{{ t('view.search.next_page') }}</el-button
                    >
                </el-button-group>
            </el-tab-pane>
            <el-tab-pane
                v-loading="isSearchAvatarLoading"
                :label="t('view.search.avatar.header')"
                style="min-height: 60px">
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div style="display: flex; align-items: center">
                        <el-dropdown
                            v-if="avatarRemoteDatabaseProviderList.length > 1"
                            trigger="click"
                            size="small"
                            style="margin-right: 5px"
                            @click.stop>
                            <el-button size="small"
                                >{{ t('view.search.avatar.search_provider') }}
                                <el-icon class="el-icon--right"><ArrowDown /></el-icon
                            ></el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-for="provider in avatarRemoteDatabaseProviderList"
                                        :key="provider"
                                        @click="setAvatarProvider(provider)">
                                        <el-icon v-if="provider === avatarRemoteDatabaseProvider" class="el-icon--left"
                                            ><Check
                                        /></el-icon>
                                        {{ provider }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                        <el-tooltip placement="bottom" :content="t('view.search.avatar.refresh_tooltip')">
                            <el-button
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="small"
                                :icon="Refresh"
                                circle
                                @click="refreshUserDialogAvatars"></el-button>
                        </el-tooltip>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            t('view.search.avatar.result_count', {
                                count: searchAvatarResults.length
                            })
                        }}</span>
                    </div>
                    <div style="display: flex; align-items: center">
                        <el-radio-group
                            v-model="searchAvatarFilter"
                            size="small"
                            style="margin: 5px; display: block"
                            @change="searchAvatar">
                            <el-radio value="all">{{ t('view.search.avatar.all') }}</el-radio>
                            <el-radio value="public">{{ t('view.search.avatar.public') }}</el-radio>
                            <el-radio value="private">{{ t('view.search.avatar.private') }}</el-radio>
                        </el-radio-group>
                        <el-divider direction="vertical"></el-divider>
                        <el-radio-group
                            v-model="searchAvatarFilterRemote"
                            size="small"
                            style="margin: 5px; display: block"
                            @change="searchAvatar">
                            <el-radio value="all">{{ t('view.search.avatar.all') }}</el-radio>
                            <el-radio value="local">{{ t('view.search.avatar.local') }}</el-radio>
                            <el-radio value="remote" :disabled="!avatarRemoteDatabase">{{
                                t('view.search.avatar.remote')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                </div>
                <div style="display: flex; justify-content: end">
                    <el-radio-group
                        v-model="searchAvatarSort"
                        :disabled="searchAvatarFilterRemote !== 'local'"
                        size="small"
                        style="margin: 5px; display: block"
                        @change="searchAvatar">
                        <el-radio value="name">{{ t('view.search.avatar.sort_name') }}</el-radio>
                        <el-radio value="update">{{ t('view.search.avatar.sort_update') }}</el-radio>
                        <el-radio value="created">{{ t('view.search.avatar.sort_created') }}</el-radio>
                    </el-radio-group>
                </div>
                <div class="x-friend-list" style="margin-top: 20px; min-height: 500px">
                    <div
                        v-for="avatar in searchAvatarPage"
                        :key="avatar.id"
                        class="x-friend-item"
                        @click="showAvatarDialog(avatar.id)">
                        <div class="avatar">
                            <img v-if="avatar.thumbnailImageUrl" :src="avatar.thumbnailImageUrl" loading="lazy" />
                            <img v-else-if="avatar.imageUrl" :src="avatar.imageUrl" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="avatar.name"></span>
                            <span
                                v-if="avatar.releaseStatus === 'public'"
                                class="extra"
                                style="color: #67c23a"
                                v-text="avatar.releaseStatus"></span>
                            <span
                                v-else-if="avatar.releaseStatus === 'private'"
                                class="extra"
                                style="color: #f56c6c"
                                v-text="avatar.releaseStatus"></span>
                            <span v-else class="extra" v-text="avatar.releaseStatus"></span>
                            <span class="extra" v-text="avatar.authorName"></span>
                        </div>
                    </div>
                </div>
                <el-button-group v-if="searchAvatarPage.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchAvatarPageNum"
                        :icon="Back"
                        size="small"
                        @click="moreSearchAvatar(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="
                            searchAvatarResults.length < 10 ||
                            (searchAvatarPageNum + 1) * 10 >= searchAvatarResults.length
                        "
                        :icon="Right"
                        size="small"
                        @click="moreSearchAvatar(1)"
                        >{{ t('view.search.next_page') }}</el-button
                    >
                </el-button-group>
            </el-tab-pane>
            <el-tab-pane
                v-loading="isSearchGroupLoading"
                :label="t('view.search.group.header')"
                style="min-height: 60px">
                <div class="x-friend-list" style="min-height: 500px">
                    <div
                        v-for="group in searchGroupResults"
                        :key="group.id"
                        class="x-friend-item"
                        @click="showGroupDialog(group.id)">
                        <div class="avatar">
                            <img :src="getSmallThumbnailUrl(group.iconUrl)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name">
                                <span v-text="group.name"></span>
                                <span style="margin-left: 5px; font-weight: normal">({{ group.memberCount }})</span>
                                <span
                                    style="
                                        margin-left: 5px;
                                        color: #909399;
                                        font-weight: normal;
                                        font-family: monospace;
                                        font-size: 12px;
                                    "
                                    >{{ group.shortCode }}.{{ group.discriminator }}</span
                                >
                            </span>
                            <span class="extra" v-text="group.description"></span>
                        </div>
                    </div>
                </div>
                <el-button-group v-if="searchGroupResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchGroupParams.offset"
                        :icon="Back"
                        size="small"
                        @click="moreSearchGroup(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchGroupResults.length < 10"
                        :icon="Right"
                        size="small"
                        @click="moreSearchGroup(1)"
                        >{{ t('view.search.next_page') }}</el-button
                    >
                </el-button-group>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup>
    import { ArrowDown, Back, Check, Delete, Refresh, Right } from '@element-plus/icons-vue';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useAvatarProviderStore,
        useAvatarStore,
        useGroupStore,
        useSearchStore,
        useUserStore,
        useWorldStore
    } from '../../stores';
    import {
        compareByCreatedAt,
        compareByName,
        compareByUpdatedAt,
        convertFileUrlToImageUrl,
        replaceBioSymbols,
        userImage
    } from '../../shared/utils';
    import { groupRequest, worldRequest } from '../../api';

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());
    const { avatarRemoteDatabaseProviderList, avatarRemoteDatabaseProvider } = storeToRefs(useAvatarProviderStore());
    const { setAvatarProvider } = useAvatarProviderStore();
    const { userDialog } = storeToRefs(useUserStore());
    const { showUserDialog, refreshUserDialogAvatars } = useUserStore();
    const { showAvatarDialog, lookupAvatars, cachedAvatars } = useAvatarStore();
    const { cachedWorlds, showWorldDialog } = useWorldStore();
    const { showGroupDialog, applyGroup } = useGroupStore();
    const { searchText, searchUserResults } = storeToRefs(useSearchStore());
    const { clearSearch, moreSearchUser } = useSearchStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();

    const searchTabRef = ref(null);

    const searchUserParams = ref({});
    const searchUserByBio = ref(false);
    const searchUserSortByLastLoggedIn = ref(false);

    const isSearchUserLoading = ref(false);
    const isSearchWorldLoading = ref(false);
    const isSearchAvatarLoading = ref(false);
    const isSearchGroupLoading = ref(false);

    const searchWorldOption = ref('');
    const searchWorldLabs = ref(false);
    const searchWorldParams = ref({});
    const searchWorldResults = ref([]);

    const searchAvatarFilter = ref('');
    const searchAvatarSort = ref('');
    const searchAvatarFilterRemote = ref('');
    const searchAvatarPageNum = ref(0);
    const searchAvatarResults = ref([]);
    const searchAvatarPage = ref([]);

    const searchGroupParams = ref({});
    const searchGroupResults = ref([]);

    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function handleClearSearch() {
        searchUserParams.value = {};
        searchWorldParams.value = {};
        searchWorldResults.value = [];
        searchAvatarResults.value = [];
        searchAvatarPage.value = [];
        searchAvatarPageNum.value = 0;
        searchGroupParams.value = {};
        searchGroupResults.value = [];
        clearSearch();
    }

    function updateSearchText(text) {
        searchText.value = text;
    }

    function search() {
        switch (searchTabRef.value.currentName) {
            case '0':
                searchUser();
                break;
            case '1':
                searchWorld({});
                break;
            case '2':
                searchAvatar();
                break;
            case '3':
                searchGroup();
                break;
        }
    }

    async function searchUser() {
        searchUserParams.value = {
            n: 10,
            offset: 0,
            search: searchText.value,
            customFields: searchUserByBio.value ? 'bio' : 'displayName',
            sort: searchUserSortByLastLoggedIn.value ? 'last_login' : 'relevance'
        };
        await handleMoreSearchUser();
    }

    async function handleMoreSearchUser(go = null) {
        isSearchUserLoading.value = true;
        await moreSearchUser(go, searchUserParams.value);
        isSearchUserLoading.value = false;
    }

    function searchWorld(ref) {
        searchWorldOption.value = '';
        const params = {
            n: 10,
            offset: 0
        };
        switch (ref.sortHeading) {
            case 'featured':
                params.sort = 'order';
                params.featured = 'true';
                break;
            case 'trending':
                params.sort = 'popularity';
                params.featured = 'false';
                break;
            case 'updated':
                params.sort = 'updated';
                break;
            case 'created':
                params.sort = 'created';
                break;
            case 'publication':
                params.sort = 'publicationDate';
                break;
            case 'shuffle':
                params.sort = 'shuffle';
                break;
            case 'active':
                searchWorldOption.value = 'active';
                break;
            case 'recent':
                searchWorldOption.value = 'recent';
                break;
            case 'favorite':
                searchWorldOption.value = 'favorites';
                break;
            case 'labs':
                params.sort = 'labsPublicationDate';
                break;
            case 'heat':
                params.sort = 'heat';
                params.featured = 'false';
                break;
            default:
                params.sort = 'relevance';
                params.search = replaceBioSymbols(searchText.value);
                break;
        }
        params.order = ref.sortOrder || 'descending';
        if (ref.sortOwnership === 'mine') {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        if (ref.tag) {
            params.tag = ref.tag;
        }
        if (!searchWorldLabs.value) {
            if (params.tag) {
                params.tag += ',system_approved';
            } else {
                params.tag = 'system_approved';
            }
        }
        // TODO: option.platform
        searchWorldParams.value = params;
        moreSearchWorld();
    }

    function moreSearchWorld(go) {
        const params = searchWorldParams.value;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        isSearchWorldLoading.value = true;
        worldRequest
            .getWorlds(params, searchWorldOption.value)
            .finally(() => {
                isSearchWorldLoading.value = false;
            })
            .then((args) => {
                const map = new Map();
                for (const json of args.json) {
                    const ref = cachedWorlds.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                searchWorldResults.value = Array.from(map.values());
                return args;
            });
    }

    async function searchAvatar() {
        let ref;
        isSearchAvatarLoading.value = true;
        if (!searchAvatarFilter.value) {
            searchAvatarFilter.value = 'all';
        }
        if (!searchAvatarSort.value) {
            searchAvatarSort.value = 'name';
        }
        if (!searchAvatarFilterRemote.value) {
            searchAvatarFilterRemote.value = 'all';
        }
        if (searchAvatarFilterRemote.value !== 'local') {
            searchAvatarSort.value = 'name';
        }
        const avatars = new Map();
        const query = searchText.value;
        const queryUpper = query.toUpperCase();
        if (!query) {
            for (ref of cachedAvatars.values()) {
                switch (searchAvatarFilter.value) {
                    case 'all':
                        avatars.set(ref.id, ref);
                        break;
                    case 'public':
                        if (ref.releaseStatus === 'public') {
                            avatars.set(ref.id, ref);
                        }
                        break;
                    case 'private':
                        if (ref.releaseStatus === 'private') {
                            avatars.set(ref.id, ref);
                        }
                        break;
                }
            }
            isSearchAvatarLoading.value = false;
        } else {
            if (searchAvatarFilterRemote.value === 'all' || searchAvatarFilterRemote.value === 'local') {
                for (ref of cachedAvatars.values()) {
                    let match = ref.name.toUpperCase().includes(queryUpper);
                    if (!match && ref.description) {
                        match = ref.description.toUpperCase().includes(queryUpper);
                    }
                    if (!match && ref.authorName) {
                        match = ref.authorName.toUpperCase().includes(queryUpper);
                    }
                    if (match) {
                        switch (searchAvatarFilter.value) {
                            case 'all':
                                avatars.set(ref.id, ref);
                                break;
                            case 'public':
                                if (ref.releaseStatus === 'public') {
                                    avatars.set(ref.id, ref);
                                }
                                break;
                            case 'private':
                                if (ref.releaseStatus === 'private') {
                                    avatars.set(ref.id, ref);
                                }
                                break;
                        }
                    }
                }
            }
            if (
                (searchAvatarFilterRemote.value === 'all' || searchAvatarFilterRemote.value === 'remote') &&
                avatarRemoteDatabase.value &&
                query.length >= 3
            ) {
                const data = await lookupAvatars('search', query);
                if (data && typeof data === 'object') {
                    data.forEach((avatar) => {
                        avatars.set(avatar.id, avatar);
                    });
                }
            }
            isSearchAvatarLoading.value = false;
        }
        const avatarsArray = Array.from(avatars.values());
        if (searchAvatarFilterRemote.value === 'local') {
            switch (searchAvatarSort.value) {
                case 'updated':
                    avatarsArray.sort(compareByUpdatedAt);
                    break;
                case 'created':
                    avatarsArray.sort(compareByCreatedAt);
                    break;
                case 'name':
                    avatarsArray.sort(compareByName);
                    break;
            }
        }
        searchAvatarPageNum.value = 0;
        searchAvatarResults.value = avatarsArray;
        searchAvatarPage.value = avatarsArray.slice(0, 10);
    }
    function moreSearchAvatar(n) {
        let offset;
        if (n === -1) {
            searchAvatarPageNum.value--;
            offset = searchAvatarPageNum.value * 10;
        }
        if (n === 1) {
            searchAvatarPageNum.value++;
            offset = searchAvatarPageNum.value * 10;
        }
        searchAvatarPage.value = searchAvatarResults.value.slice(offset, offset + 10);
    }
    async function searchGroup() {
        searchGroupParams.value = {
            n: 10,
            offset: 0,
            query: replaceBioSymbols(searchText.value)
        };
        await moreSearchGroup();
    }
    async function moreSearchGroup(go) {
        const params = searchGroupParams.value;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        isSearchGroupLoading.value = true;
        await groupRequest
            .groupSearch(params)
            .finally(() => {
                isSearchGroupLoading.value = false;
            })
            .then((args) => {
                const map = new Map();
                for (const json of args.json) {
                    const ref = applyGroup(json);
                    map.set(ref.id, ref);
                }
                searchGroupResults.value = Array.from(map.values());
                return args;
            });
    }
</script>
