<template>
    <div class="x-container">
        <div class="mt-0 mx-0 mb-2" style="display: flex; align-items: center">
            <InputGroupField
                :model-value="searchText"
                :placeholder="t('view.search.search_placeholder')"
                style="flex: 1"
                clearable
                @input="updateSearchText"
                @keyup.enter="search" />
            <TooltipWrapper side="bottom" :content="t('view.search.clear_results_tooltip')">
                <Button class="rounded-full ml-2" size="icon" variant="ghost" @click="handleClearSearch"
                    ><Trash2
                /></Button>
            </TooltipWrapper>
        </div>
        <TabsUnderline
            class="mt-4"
            v-model="activeSearchTab"
            :items="searchTabs"
            aria-label="Search tabs"
            :unmount-on-hide="false">
            <template #user>
                <div style="min-height: 60px">
                    <label class="inline-flex items-center gap-2 ml-2">
                        <Checkbox v-model="searchUserByBio" />
                        <span>{{ t('view.search.user.search_by_bio') }}</span>
                    </label>
                    <label class="inline-flex items-center gap-2 ml-2">
                        <Checkbox v-model="searchUserSortByLastLoggedIn" />
                        <span>{{ t('view.search.user.sort_by_last_logged_in') }}</span>
                    </label>
                    <div style="min-height: 500px">
                        <div
                            v-for="user in searchUserResults"
                            :key="user.id"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:bg-muted/50 hover:rounded-lg"
                            @click="showUserDialog(user.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                <img
                                    class="size-full rounded-full object-cover"
                                    :src="userImage(user, true)"
                                    loading="lazy" />
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <span
                                    class="block truncate font-medium leading-[18px]"
                                    v-text="user.displayName"></span>
                                <span
                                    v-if="randomUserColours"
                                    class="block truncate text-xs"
                                    :class="user.$trustClass"
                                    v-text="user.$trustLevel"></span>
                                <span
                                    v-else
                                    class="block truncate text-xs"
                                    :style="{ color: user.$userColour }"
                                    v-text="user.$trustLevel"></span>
                            </div>
                        </div>
                    </div>
                    <ButtonGroup class="mt-4" v-if="searchUserResults.length">
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!searchUserParams.offset"
                            @click="handleMoreSearchUser(-1)">
                            <ArrowLeft />
                            {{ t('view.search.prev_page') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="searchUserResults.length < 10"
                            @click="handleMoreSearchUser(1)">
                            <ArrowRight />
                            {{ t('view.search.next_page') }}
                        </Button>
                    </ButtonGroup>
                </div>
            </template>
            <template #world>
                <div style="min-height: 60px">
                    <div class="inline-flex justify-between mb-4 w-full">
                        <Select
                            :model-value="searchWorldCategoryIndex"
                            @update:modelValue="handleSearchWorldCategorySelect"
                            style="margin-bottom: 16px">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('view.search.world.category')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="row in cachedConfig.dynamicWorldRows"
                                        :key="row.index"
                                        :value="row.index">
                                        {{ row.name }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <label class="inline-flex items-center gap-2" style="margin-left: 8px">
                            <Checkbox v-model="searchWorldLabs" />
                            <span>{{ t('view.search.world.community_lab') }}</span>
                        </label>
                    </div>
                    <div style="min-height: 500px">
                        <div
                            v-for="world in searchWorldResults"
                            :key="world.id"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:bg-muted/50 hover:rounded-lg"
                            @click="showWorldDialog(world.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                <img
                                    class="size-full rounded-full object-cover"
                                    :src="world.thumbnailImageUrl"
                                    loading="lazy" />
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]" v-text="world.name"></span>
                                <span v-if="world.occupants" class="block truncate text-xs"
                                    >{{ world.authorName }} ({{ world.occupants }})</span
                                >
                                <span v-else class="block truncate text-xs" v-text="world.authorName"></span>
                            </div>
                        </div>
                    </div>
                    <ButtonGroup v-if="searchWorldResults.length" style="margin-top: 16px">
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!searchWorldParams.offset"
                            @click="moreSearchWorld(-1)">
                            <ArrowLeft />
                            {{ t('view.search.prev_page') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="searchWorldResults.length < 10"
                            @click="moreSearchWorld(1)">
                            <ArrowRight />
                            {{ t('view.search.next_page') }}
                        </Button>
                    </ButtonGroup>
                </div>
            </template>
            <template #avatar>
                <div style="min-height: 60px">
                    <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center">
                            <Select
                                v-if="avatarRemoteDatabaseProviderList.length > 1"
                                :model-value="avatarRemoteDatabaseProvider"
                                @update:modelValue="setAvatarProvider"
                                style="margin-right: 6px">
                                <SelectTrigger size="sm">
                                    <SelectValue :placeholder="t('view.search.avatar.search_provider')" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="provider in avatarRemoteDatabaseProviderList"
                                            :key="provider"
                                            :value="provider">
                                            {{ provider }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <TooltipWrapper side="bottom" :content="t('view.search.avatar.refresh_tooltip')">
                                <Button
                                    class="rounded-full ml-1"
                                    variant="ghost"
                                    size="icon-sm"
                                    :disabled="userDialog.isAvatarsLoading"
                                    @click="refreshUserDialogAvatars">
                                    <Spinner v-if="userDialog.isAvatarsLoading" />
                                    <RefreshCw v-else />
                                </Button>
                            </TooltipWrapper>
                            <span class="text-sm mx-1.5">{{
                                t('view.search.avatar.result_count', {
                                    count: searchAvatarResults.length
                                })
                            }}</span>
                        </div>
                        <div style="display: flex; align-items: center">
                            <RadioGroup
                                :model-value="searchAvatarFilter"
                                class="flex items-center gap-4"
                                style="margin: 6px"
                                @update:modelValue="handleSearchAvatarFilterChange">
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem id="searchAvatarFilter-all" value="all" />
                                    <label for="searchAvatarFilter-all">{{ t('view.search.avatar.all') }}</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem id="searchAvatarFilter-public" value="public" />
                                    <label for="searchAvatarFilter-public">{{ t('view.search.avatar.public') }}</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem id="searchAvatarFilter-private" value="private" />
                                    <label for="searchAvatarFilter-private">{{
                                        t('view.search.avatar.private')
                                    }}</label>
                                </div>
                            </RadioGroup>
                            <Separator orientation="vertical" class="mx-2 h-5" />
                            <RadioGroup
                                :model-value="searchAvatarFilterRemote"
                                class="flex items-center gap-4"
                                style="margin: 6px"
                                @update:modelValue="handleSearchAvatarFilterRemoteChange">
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem id="searchAvatarFilterRemote-all" value="all" />
                                    <label for="searchAvatarFilterRemote-all">{{ t('view.search.avatar.all') }}</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem id="searchAvatarFilterRemote-local" value="local" />
                                    <label for="searchAvatarFilterRemote-local">{{
                                        t('view.search.avatar.local')
                                    }}</label>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <RadioGroupItem
                                        id="searchAvatarFilterRemote-remote"
                                        value="remote"
                                        :disabled="!avatarRemoteDatabase" />
                                    <label for="searchAvatarFilterRemote-remote">{{
                                        t('view.search.avatar.remote')
                                    }}</label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: end" class="mt-2">
                        <Select
                            :model-value="searchAvatarSort"
                            :disabled="searchAvatarFilterRemote !== 'local'"
                            style="margin: 6px"
                            @update:modelValue="handleSearchAvatarSortChange">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('view.search.avatar.sort_name')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="name">
                                        {{ t('view.search.avatar.sort_name') }}
                                    </SelectItem>
                                    <SelectItem value="update">
                                        {{ t('view.search.avatar.sort_update') }}
                                    </SelectItem>
                                    <SelectItem value="created">
                                        {{ t('view.search.avatar.sort_created') }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div style="margin-top: 20px; min-height: 500px">
                        <div
                            v-for="avatar in searchAvatarPage"
                            :key="avatar.id"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:bg-muted/50 hover:rounded-lg"
                            @click="showAvatarDialog(avatar.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                <img
                                    v-if="avatar.thumbnailImageUrl"
                                    class="size-full rounded-full object-cover"
                                    :src="avatar.thumbnailImageUrl"
                                    loading="lazy" />
                                <img
                                    v-else-if="avatar.imageUrl"
                                    class="size-full rounded-full object-cover"
                                    :src="avatar.imageUrl"
                                    loading="lazy" />
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]" v-text="avatar.name"></span>
                                <span
                                    v-if="avatar.releaseStatus === 'public'"
                                    class="block truncate text-xs"
                                    v-text="avatar.releaseStatus"></span>
                                <span
                                    v-else-if="avatar.releaseStatus === 'private'"
                                    class="block truncate text-xs"
                                    v-text="avatar.releaseStatus"></span>
                                <span v-else class="block truncate text-xs" v-text="avatar.releaseStatus"></span>
                                <span class="block truncate text-xs" v-text="avatar.authorName"></span>
                            </div>
                        </div>
                    </div>
                    <ButtonGroup v-if="searchAvatarPage.length" style="margin-top: 16px">
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!searchAvatarPageNum"
                            @click="moreSearchAvatar(-1)">
                            <ArrowLeft />
                            {{ t('view.search.prev_page') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="
                                searchAvatarResults.length < 10 ||
                                (searchAvatarPageNum + 1) * 10 >= searchAvatarResults.length
                            "
                            @click="moreSearchAvatar(1)">
                            <ArrowRight />
                            {{ t('view.search.next_page') }}
                        </Button>
                    </ButtonGroup>
                </div>
            </template>
            <template #group>
                <div style="min-height: 60px">
                    <div style="min-height: 500px">
                        <div
                            v-for="group in searchGroupResults"
                            :key="group.id"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer hover:bg-muted/50 hover:rounded-lg"
                            @click="showGroupDialog(group.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                <img
                                    class="size-full rounded-full object-cover"
                                    :src="getSmallThumbnailUrl(group.iconUrl)"
                                    loading="lazy" />
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]">
                                    <span v-text="group.name"></span>
                                    <span style="margin-left: 6px; font-weight: normal">({{ group.memberCount }})</span>
                                    <span
                                        class="text-muted-foreground font-mono text-xs"
                                        style="margin-left: 6px; font-weight: normal"
                                        >{{ group.shortCode }}.{{ group.discriminator }}</span
                                    >
                                </span>
                                <span class="block truncate text-xs" v-text="group.description"></span>
                            </div>
                        </div>
                    </div>
                    <ButtonGroup v-if="searchGroupResults.length" style="margin-top: 16px">
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="!searchGroupParams.offset"
                            @click="moreSearchGroup(-1)">
                            <ArrowLeft />
                            {{ t('view.search.prev_page') }}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            :disabled="searchGroupResults.length < 10"
                            @click="moreSearchGroup(1)">
                            <ArrowRight />
                            {{ t('view.search.next_page') }}
                        </Button>
                    </ButtonGroup>
                </div>
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { ArrowLeft, ArrowRight, RefreshCw, Trash2 } from 'lucide-vue-next';
    import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { ButtonGroup } from '@/components/ui/button-group';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Separator } from '@/components/ui/separator';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
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
    import { convertFileUrlToImageUrl, replaceBioSymbols, userImage } from '../../shared/utils';
    import { refreshUserDialogAvatars, showUserDialog } from '../../coordinators/userCoordinator';
    import { groupRequest } from '../../api';
    import { useSearchAvatar } from './composables/useSearchAvatar';
    import { useSearchWorld } from './composables/useSearchWorld';

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { avatarRemoteDatabaseProviderList, avatarRemoteDatabaseProvider } = storeToRefs(useAvatarProviderStore());
    const { setAvatarProvider } = useAvatarProviderStore();
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());
    const { userDialog } = storeToRefs(useUserStore());

    const { showAvatarDialog } = useAvatarStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { searchText, searchUserResults } = storeToRefs(useSearchStore());
    const { clearSearch, moreSearchUser } = useSearchStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();

    const activeSearchTab = ref('user');
    const searchTabs = computed(() => [
        { value: 'user', label: t('view.search.user.header') },
        { value: 'world', label: t('view.search.world.header') },
        { value: 'avatar', label: t('view.search.avatar.header') },
        { value: 'group', label: t('view.search.group.header') }
    ]);

    const {
        searchAvatarFilter,
        searchAvatarSort,
        searchAvatarFilterRemote,
        searchAvatarPageNum,
        searchAvatarResults,
        searchAvatarPage,
        isSearchAvatarLoading,
        searchAvatar,
        moreSearchAvatar,
        handleSearchAvatarFilterChange,
        handleSearchAvatarFilterRemoteChange,
        handleSearchAvatarSortChange,
        clearAvatarSearch
    } = useSearchAvatar();

    const {
        searchWorldLabs,
        searchWorldParams,
        searchWorldCategoryIndex,
        searchWorldResults,
        isSearchWorldLoading,
        searchWorld,
        moreSearchWorld,
        handleSearchWorldCategorySelect,
        clearWorldSearch
    } = useSearchWorld();

    const searchUserParams = ref({});
    const searchUserByBio = ref(false);
    const searchUserSortByLastLoggedIn = ref(false);

    const isSearchUserLoading = ref(false);
    const isSearchGroupLoading = ref(false);

    const searchGroupParams = ref({});
    const searchGroupResults = ref([]);

    /**
     *
     * @param url
     */
    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    /**
     *
     */
    function handleClearSearch() {
        searchUserParams.value = {};
        clearWorldSearch();
        clearAvatarSearch();
        searchGroupParams.value = {};
        searchGroupResults.value = [];
        clearSearch();
    }

    /**
     *
     * @param text
     */
    function updateSearchText(text) {
        searchText.value = text;
    }

    /**
     *
     * @param tabName
     */
    function handleSearchTabChange(tabName) {
        searchText.value = '';
        activeSearchTab.value = tabName;
    }

    /**
     *
     */
    function search() {
        switch (activeSearchTab.value) {
            case 'user':
                searchUser();
                break;
            case 'world':
                searchWorld({});
                break;
            case 'avatar':
                searchAvatar();
                break;
            case 'group':
                searchGroup();
                break;
        }
    }

    /**
     *
     */
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

    /**
     *
     * @param go
     */
    async function handleMoreSearchUser(go = null) {
        isSearchUserLoading.value = true;
        await moreSearchUser(go, searchUserParams.value);
        isSearchUserLoading.value = false;
    }

    /**
     *
     */
    async function searchGroup() {
        searchGroupParams.value = {
            n: 10,
            offset: 0,
            query: replaceBioSymbols(searchText.value)
        };
        await moreSearchGroup();
    }
    /**
     *
     * @param go
     */
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
                    map.set(json.id, json);
                }
                searchGroupResults.value = Array.from(map.values());
                return args;
            });
    }
</script>
