<template>
    <div v-if="menuActiveIndex === 'search'" class="x-container">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <el-input
                :value="searchText"
                :placeholder="t('view.search.search_placeholder')"
                style="flex: 1"
                @input="updateSearchText"
                @keyup.native.13="search"></el-input>
            <el-tooltip placement="bottom" :content="t('view.search.clear_results_tooltip')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    icon="el-icon-delete"
                    circle
                    style="flex: none; margin-left: 10px"
                    @click="clearSearch"></el-button>
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
                        <template>
                            <div class="avatar">
                                <img v-lazy="userImage(user, true)" />
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
                        </template>
                    </div>
                </div>
                <el-button-group v-if="searchUserResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchUserParams.offset"
                        icon="el-icon-back"
                        size="small"
                        @click="moreSearchUser(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchUserResults.length < 10"
                        icon="el-icon-right"
                        size="small"
                        @click="moreSearchUser(1)"
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
                        >{{ t('view.search.world.category') }} <i class="el-icon-arrow-down el-icon--right"></i
                    ></el-button>
                    <el-dropdown-menu v-slot="dropdown">
                        <el-dropdown-item
                            v-for="row in API.cachedConfig.dynamicWorldRows"
                            :key="row.index"
                            :command="row"
                            v-text="row.name"></el-dropdown-item>
                    </el-dropdown-menu>
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
                        <template>
                            <div class="avatar">
                                <img v-lazy="world.thumbnailImageUrl" />
                            </div>
                            <div class="detail">
                                <span class="name" v-text="world.name"></span>
                                <span v-if="world.occupants" class="extra"
                                    >{{ world.authorName }} ({{ world.occupants }})</span
                                >
                                <span v-else class="extra" v-text="world.authorName"></span>
                            </div>
                        </template>
                    </div>
                </div>
                <el-button-group v-if="searchWorldResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchWorldParams.offset"
                        icon="el-icon-back"
                        size="small"
                        @click="moreSearchWorld(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchWorldResults.length < 10"
                        icon="el-icon-right"
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
                            size="mini"
                            style="margin-right: 5px"
                            @click.native.stop>
                            <el-button size="small"
                                >{{ t('view.search.avatar.search_provider') }}
                                <i class="el-icon-arrow-down el-icon--right"></i
                            ></el-button>
                            <el-dropdown-menu v-slot="dropdown">
                                <el-dropdown-item
                                    v-for="provider in avatarRemoteDatabaseProviderList"
                                    :key="provider"
                                    @click.native="setAvatarProvider(provider)">
                                    <i
                                        v-if="provider === avatarRemoteDatabaseProvider"
                                        class="el-icon-check el-icon--left"></i>
                                    {{ provider }}
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                        <el-tooltip
                            placement="bottom"
                            :content="t('view.search.avatar.refresh_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                type="default"
                                :loading="userDialog.isAvatarsLoading"
                                size="mini"
                                icon="el-icon-refresh"
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
                            size="mini"
                            style="margin: 5px; display: block"
                            @change="searchAvatar">
                            <el-radio label="all">{{ t('view.search.avatar.all') }}</el-radio>
                            <el-radio label="public">{{ t('view.search.avatar.public') }}</el-radio>
                            <el-radio label="private">{{ t('view.search.avatar.private') }}</el-radio>
                        </el-radio-group>
                        <el-divider direction="vertical"></el-divider>
                        <el-radio-group
                            v-model="searchAvatarFilterRemote"
                            size="mini"
                            style="margin: 5px; display: block"
                            @change="searchAvatar">
                            <el-radio label="all">{{ t('view.search.avatar.all') }}</el-radio>
                            <el-radio label="local">{{ t('view.search.avatar.local') }}</el-radio>
                            <el-radio label="remote" :disabled="!avatarRemoteDatabase">{{
                                t('view.search.avatar.remote')
                            }}</el-radio>
                        </el-radio-group>
                    </div>
                </div>
                <div style="display: flex; justify-content: end">
                    <el-radio-group
                        v-model="searchAvatarSort"
                        :disabled="searchAvatarFilterRemote !== 'local'"
                        size="mini"
                        style="margin: 5px; display: block"
                        @change="searchAvatar">
                        <el-radio label="name">{{ t('view.search.avatar.sort_name') }}</el-radio>
                        <el-radio label="update">{{ t('view.search.avatar.sort_update') }}</el-radio>
                        <el-radio label="created">{{ t('view.search.avatar.sort_created') }}</el-radio>
                    </el-radio-group>
                </div>
                <div class="x-friend-list" style="margin-top: 20px; min-height: 500px">
                    <div
                        v-for="avatar in searchAvatarPage"
                        :key="avatar.id"
                        class="x-friend-item"
                        @click="showAvatarDialog(avatar.id)">
                        <template>
                            <div class="avatar">
                                <img v-if="avatar.thumbnailImageUrl" v-lazy="avatar.thumbnailImageUrl" />
                                <img v-else-if="avatar.imageUrl" v-lazy="avatar.imageUrl" />
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
                        </template>
                    </div>
                </div>
                <el-button-group v-if="searchAvatarPage.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchAvatarPageNum"
                        icon="el-icon-back"
                        size="small"
                        @click="moreSearchAvatar(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="
                            searchAvatarResults.length < 10 ||
                            (searchAvatarPageNum + 1) * 10 >= searchAvatarResults.length
                        "
                        icon="el-icon-right"
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
                        <template>
                            <div class="avatar">
                                <img v-lazy="getSmallThumbnailUrl(group.iconUrl)" />
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
                        </template>
                    </div>
                </div>
                <el-button-group v-if="searchGroupResults.length" style="margin-top: 15px">
                    <el-button
                        :disabled="!searchGroupParams.offset"
                        icon="el-icon-back"
                        size="small"
                        @click="moreSearchGroup(-1)"
                        >{{ t('view.search.prev_page') }}</el-button
                    >
                    <el-button
                        :disabled="searchGroupResults.length < 10"
                        icon="el-icon-right"
                        size="small"
                        @click="moreSearchGroup(1)"
                        >{{ t('view.search.next_page') }}</el-button
                    >
                </el-button-group>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    export default {
        name: 'SearchTab'
    };
</script>

<script setup>
    import { inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { groupRequest, worldRequest } from '../../api';
    import utils from '../../classes/utils';
    import { convertFileUrlToImageUrl } from '../../composables/shared/utils';

    const { t } = useI18n();

    const API = inject('API');
    const showUserDialog = inject('showUserDialog');
    const userImage = inject('userImage');
    const showWorldDialog = inject('showWorldDialog');
    const showAvatarDialog = inject('showAvatarDialog');
    const showGroupDialog = inject('showGroupDialog');

    const props = defineProps({
        menuActiveIndex: {
            type: String,
            default: ''
        },
        searchText: {
            type: String,
            default: ''
        },
        searchUserResults: {
            type: Array,
            default: () => []
        },
        randomUserColours: {
            type: Boolean,
            default: false
        },
        avatarRemoteDatabaseProviderList: {
            type: Array,
            default: () => []
        },
        avatarRemoteDatabaseProvider: {
            type: String,
            default: ''
        },
        hideTooltips: {
            type: Boolean,
            default: false
        },
        userDialog: {
            type: Object,
            default: () => ({})
        },
        lookupAvatars: {
            type: Function,
            default: () => () => {}
        },
        avatarRemoteDatabase: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits([
        'clearSearch',
        'setAvatarProvider',
        'refreshUserDialogAvatars',
        'moreSearchUser',
        'update:searchText'
    ]);

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
        convertFileUrlToImageUrl(url);
    }

    function clearSearch() {
        searchUserParams.value = {};
        searchWorldParams.value = {};
        searchWorldResults.value = [];
        searchAvatarResults.value = [];
        searchAvatarPage.value = [];
        searchAvatarPageNum.value = 0;
        searchGroupParams.value = {};
        searchGroupResults.value = [];
        emit('clearSearch');
    }

    function updateSearchText(text) {
        emit('update:searchText', text);
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
            search: props.searchText,
            customFields: searchUserByBio.value ? 'bio' : 'displayName',
            sort: searchUserSortByLastLoggedIn.value ? 'last_login' : 'relevance'
        };
        await moreSearchUser();
    }

    async function moreSearchUser(go = null) {
        emit('moreSearchUser', go, searchUserParams.value);
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
                params.search = utils.replaceBioSymbols(props.searchText);
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
                    const ref = API.cachedWorlds.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                searchWorldResults.value = Array.from(map.values());
                return args;
            });
    }

    function setAvatarProvider(provider) {
        emit('setAvatarProvider', provider);
    }
    function refreshUserDialogAvatars(fileId) {
        emit('refreshUserDialogAvatars', fileId);
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
        const query = props.searchText.toUpperCase();
        if (!query) {
            for (ref of API.cachedAvatars.values()) {
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
                for (ref of API.cachedAvatars.values()) {
                    let match = ref.name.toUpperCase().includes(query);
                    if (!match && ref.description) {
                        match = ref.description.toUpperCase().includes(query);
                    }
                    if (!match && ref.authorName) {
                        match = ref.authorName.toUpperCase().includes(query);
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
                props.avatarRemoteDatabase &&
                query.length >= 3
            ) {
                const data = await props.lookupAvatars('search', query);
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
                    avatarsArray.sort(utils.compareByUpdatedAt);
                    break;
                case 'created':
                    avatarsArray.sort(utils.compareByCreatedAt);
                    break;
                case 'name':
                    avatarsArray.sort(utils.compareByName);
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
            query: utils.replaceBioSymbols(props.searchText)
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
                // API.$on('GROUP:SEARCH', function (args) {
                for (const json of args.json) {
                    API.$emit('GROUP', {
                        json,
                        params: {
                            groupId: json.id
                        }
                    });
                }
                // });
                const map = new Map();
                for (const json of args.json) {
                    const ref = API.cachedGroups.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                searchGroupResults.value = Array.from(map.values());
                return args;
            });
    }
</script>
