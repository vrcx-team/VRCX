<template>
    <div class="x-container flex flex-col overflow-hidden">
        <Tabs
            v-model="activeSearchTab"
            :unmount-on-hide="false"
            aria-label="Search tabs"
            class="flex flex-col min-h-0 flex-1">
            <div class="mt-0 mx-0 mb-2 flex items-center gap-5">
                <TabsList>
                    <TabsTrigger value="user">{{ t('view.search.user.header') }}</TabsTrigger>
                    <TabsTrigger value="world">{{ t('view.search.world.header') }}</TabsTrigger>
                    <TabsTrigger value="avatar">{{ t('view.search.avatar.header') }}</TabsTrigger>
                    <TabsTrigger value="group">{{ t('view.search.group.header') }}</TabsTrigger>
                </TabsList>
                <div class="flex min-w-0 flex-1 items-center">
                    <InputGroupField
                        :model-value="searchText"
                        :placeholder="searchPlaceholder"
                        style="flex: 1"
                        clearable
                        @input="updateSearchText"
                        @keyup.enter="search" />
                    <TooltipWrapper side="bottom" :content="t('view.search.clear_results_tooltip')">
                        <Button class="rounded-full ml-2" size="icon" variant="ghost" @click="handleClearSearch">
                            <Trash2 />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
            <TabsContent value="user" class="flex flex-col min-h-0 flex-1">
                <div class="flex flex-col min-h-0" style="flex: 9">
                    <div class="shrink-0 mb-3 flex justify-end">
                        <label class="inline-flex items-center gap-2 ml-2">
                            <Checkbox v-model="searchUserByBio" />
                            <span>{{ t('view.search.user.search_by_bio') }}</span>
                        </label>
                        <label class="inline-flex items-center gap-2 ml-2">
                            <Checkbox v-model="searchUserSortByLastLoggedIn" />
                            <span>{{ t('view.search.user.sort_by_last_logged_in') }}</span>
                        </label>
                    </div>
                    <div class="flex-1 overflow-y-auto min-h-0">
                        <div v-if="isSearchUserLoading" class="flex items-center justify-center h-full">
                            <Spinner class="text-2xl" />
                        </div>
                        <template v-else-if="searchUserResults.length > 0">
                            <Item
                                v-for="user in searchUserResults"
                                :key="user.id"
                                class="cursor-pointer hover:bg-muted x-hover-list rounded-none"
                                @click="showUserDialog(user.id)">
                                <ItemMedia variant="image">
                                    <Avatar>
                                        <AvatarImage :src="userImage(user, true)" loading="lazy" />
                                        <AvatarFallback>
                                            <User class="size-5 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                </ItemMedia>
                                <ItemContent class="min-w-0">
                                    <ItemTitle class="flex items-center gap-1.5 max-w-full">
                                        <span class="truncate">{{ user.displayName }}</span>
                                        <span
                                            v-if="randomUserColours"
                                            class="shrink-0 text-xs font-normal"
                                            :class="user.$trustClass">
                                            {{ user.$trustLevel }}
                                        </span>
                                        <span
                                            v-else
                                            class="shrink-0 text-xs font-normal"
                                            :style="{ color: user.$userColour }">
                                            {{ user.$trustLevel }}
                                        </span>
                                        <span
                                            v-for="item in user.$languages"
                                            :key="item.key"
                                            class="flags shrink-0"
                                            :class="languageClass(item.key)"
                                            :title="item.value" />
                                    </ItemTitle>
                                    <ItemDescription v-if="user.bio" class="line-clamp-1 text-xs!">
                                        {{ user.bio }}
                                    </ItemDescription>
                                </ItemContent>
                            </Item>
                        </template>
                        <DataTableEmpty v-else type="nodata" />
                    </div>
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
            <TabsContent value="world" class="flex flex-col min-h-0 flex-1">
                <div class="flex flex-col min-h-0" style="flex: 9">
                    <div class="inline-flex justify-end mb-4 w-full shrink-0 gap-2">
                        <label class="inline-flex items-center gap-2">
                            <Checkbox v-model="searchWorldLabs" />
                            <span>{{ t('view.search.world.community_lab') }}</span>
                        </label>
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
                    </div>
                    <div class="flex-1 overflow-y-auto min-h-0">
                        <div v-if="isSearchWorldLoading" class="flex items-center justify-center h-full">
                            <Spinner class="text-2xl" />
                        </div>
                        <template v-else-if="searchWorldResults.length > 0">
                            <ItemGroup
                                class="grid gap-3"
                                style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
                                <Item
                                    v-for="world in searchWorldResults"
                                    :key="world.id"
                                    variant="outline"
                                    size="sm"
                                    class="cursor-pointer p-3"
                                    as-child>
                                    <div class="overflow-hidden" @click="showWorldDialog(world.id)">
                                        <ItemHeader>
                                            <img
                                                :src="world.thumbnailImageUrl"
                                                :alt="world.name"
                                                loading="lazy"
                                                class="aspect-[16/10] w-full rounded-lg object-cover" />
                                        </ItemHeader>
                                        <ItemContent class="min-w-0">
                                            <TooltipWrapper side="top" :content="world.name">
                                                <ItemTitle class="truncate w-auto">{{ world.name }}</ItemTitle>
                                            </TooltipWrapper>
                                            <ItemDescription v-if="world.occupants" class="line-clamp-1 text-xs">
                                                {{ world.authorName }} ({{ world.occupants }})
                                            </ItemDescription>
                                            <ItemDescription v-else class="line-clamp-1 text-xs">
                                                {{ world.authorName }}
                                            </ItemDescription>
                                        </ItemContent>
                                    </div>
                                </Item>
                            </ItemGroup>
                        </template>
                        <DataTableEmpty v-else type="nodata" />
                    </div>
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
            <TabsContent value="avatar" class="flex flex-col min-h-0 flex-1">
                <div class="flex flex-col min-h-0" style="flex: 9">
                    <div class="shrink-0 mb-3 flex items-center justify-end gap-2">
                        <Select
                            v-if="avatarRemoteDatabaseProviderList.length > 0"
                            :model-value="avatarRemoteDatabaseProvider"
                            @update:modelValue="setAvatarProvider">
                            <SelectTrigger size="sm">
                                <SelectValue :placeholder="t('view.search.avatar.search_provider')" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem
                                        v-for="provider in avatarRemoteDatabaseProviderList.filter(Boolean)"
                                        :key="provider"
                                        :value="provider">
                                        {{ provider }}
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <span v-else class="text-sm text-muted-foreground">
                            {{ t('view.search.avatar.no_provider') }}
                        </span>
                        <Button size="sm" variant="outline" @click="isAvatarProviderDialogVisible = true">
                            <Settings class="size-4" />
                        </Button>
                    </div>
                    <div class="flex-1 overflow-y-auto min-h-0 mt-2">
                        <div v-if="isSearchAvatarLoading" class="flex items-center justify-center h-full">
                            <Spinner class="text-2xl" />
                        </div>
                        <template v-else-if="searchAvatarPage.length > 0">
                            <ItemGroup
                                class="grid gap-3"
                                style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
                                <Item
                                    v-for="avatar in searchAvatarPage"
                                    :key="avatar.id"
                                    variant="outline"
                                    size="sm"
                                    class="cursor-pointer p-3"
                                    as-child>
                                    <div class="overflow-hidden" @click="showAvatarDialog(avatar.id)">
                                        <ItemHeader>
                                            <img
                                                v-if="avatar.thumbnailImageUrl"
                                                :src="avatar.thumbnailImageUrl"
                                                :alt="avatar.name"
                                                loading="lazy"
                                                class="aspect-[16/10] w-full rounded-lg object-cover" />
                                            <img
                                                v-else-if="avatar.imageUrl"
                                                :src="avatar.imageUrl"
                                                :alt="avatar.name"
                                                loading="lazy"
                                                class="aspect-[16/10] w-full rounded-sm object-cover" />
                                        </ItemHeader>
                                        <ItemContent class="min-w-0">
                                            <TooltipWrapper side="top" :content="avatar.name">
                                                <ItemTitle class="truncate w-auto">{{ avatar.name }}</ItemTitle>
                                            </TooltipWrapper>
                                            <ItemDescription class="line-clamp-1 text-xs">
                                                {{ avatar.authorName }}
                                            </ItemDescription>
                                        </ItemContent>
                                    </div>
                                </Item>
                            </ItemGroup>
                        </template>
                        <DataTableEmpty v-else type="nodata" />
                    </div>
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
            <TabsContent value="group" class="flex flex-col min-h-0 flex-1">
                <div class="flex-1 overflow-y-auto min-h-0" style="flex: 9">
                    <div v-if="isSearchGroupLoading" class="flex items-center justify-center h-full">
                        <Spinner class="text-2xl" />
                    </div>
                    <template v-else-if="searchGroupResults.length > 0">
                        <Item
                            v-for="group in searchGroupResults"
                            :key="group.id"
                            class="cursor-pointer hover:bg-muted x-hover-list rounded-none"
                            @click="showGroupDialog(group.id)">
                            <ItemMedia variant="image">
                                <Avatar class="rounded-sm">
                                    <AvatarImage :src="getSmallThumbnailUrl(group.iconUrl)" loading="lazy" />
                                    <AvatarFallback>
                                        <Users class="size-5 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                            </ItemMedia>
                            <ItemContent class="min-w-0">
                                <ItemTitle class="truncate max-w-full">
                                    {{ group.name }}
                                    <span class="font-normal">({{ group.memberCount }})</span>
                                    <span class="text-muted-foreground font-mono text-xs font-normal">
                                        {{ group.shortCode }}.{{ group.discriminator }}
                                    </span>
                                </ItemTitle>
                                <ItemDescription class="truncate text-xs!">
                                    {{ group.description }}
                                </ItemDescription>
                            </ItemContent>
                        </Item>
                    </template>
                    <DataTableEmpty v-else type="nodata" />
                </div>
                <SearchPagination
                    :show="paginationConfig.show"
                    :prev-disabled="paginationConfig.prevDisabled"
                    :next-disabled="paginationConfig.nextDisabled"
                    @prev="paginationConfig.onPrev"
                    @next="paginationConfig.onNext" />
            </TabsContent>
        </Tabs>
        <AvatarProviderDialog v-model:isAvatarProviderDialogVisible="isAvatarProviderDialogVisible" />
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Settings, Trash2, User, Users } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Spinner } from '@/components/ui/spinner';
    import AvatarProviderDialog from '../Settings/dialogs/AvatarProviderDialog.vue';
    import SearchPagination from './components/SearchPagination.vue';
    import { Item, ItemContent, ItemDescription, ItemGroup, ItemHeader, ItemMedia, ItemTitle } from '@/components/ui/item';

    import { computed, onUnmounted, ref } from 'vue';
    import { useMagicKeys, whenever } from '@vueuse/core';
    import { toast } from 'vue-sonner';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupField } from '@/components/ui/input-group';

    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useAuthStore,
        useAvatarProviderStore,
        useSearchStore
    } from '../../stores';
    import { convertFileUrlToImageUrl, languageClass, userImage } from '../../shared/utils';
    import { showAvatarDialog } from '../../coordinators/avatarCoordinator';
    import { showGroupDialog } from '../../coordinators/groupCoordinator';
    import { showUserDialog } from '../../coordinators/userCoordinator';
    import { showWorldDialog } from '../../coordinators/worldCoordinator';
    import { useSearchAvatar } from './composables/useSearchAvatar';
    import { useSearchWorld } from './composables/useSearchWorld';
    import { useSearchUser } from './composables/useSearchUser';
    import { useSearchGroup } from './composables/useSearchGroup';

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { avatarRemoteDatabaseProviderList, avatarRemoteDatabaseProvider, isAvatarProviderDialogVisible } =
        storeToRefs(useAvatarProviderStore());
    const { setAvatarProvider } = useAvatarProviderStore();
    const { avatarRemoteDatabase } = storeToRefs(useAdvancedSettingsStore());

    const { searchText, searchUserResults } = storeToRefs(useSearchStore());
    const { clearSearch } = useSearchStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();

    const activeSearchTab = ref('user');

    // Keyboard shortcuts: Alt+Left (prev page) / Alt+Right (next page)
    const keys = useMagicKeys();
    const stopPrevWatch = whenever(keys['Alt+ArrowLeft'], () => {
        if (!paginationConfig.value.prevDisabled) {
            paginationConfig.value.onPrev();
        }
    });
    const stopNextWatch = whenever(keys['Alt+ArrowRight'], () => {
        if (!paginationConfig.value.nextDisabled) {
            paginationConfig.value.onNext();
        }
    });
    onUnmounted(() => {
        stopPrevWatch();
        stopNextWatch();
    });

    const searchPlaceholder = computed(() => {
        if (activeSearchTab.value === 'avatar') {
            return t('view.search.avatar.search_placeholder_avatar');
        }
        return t('view.search.search_placeholder');
    });

    const {
        searchUserParams,
        searchUserByBio,
        searchUserSortByLastLoggedIn,
        isSearchUserLoading,
        searchUser,
        handleMoreSearchUser,
        clearUserSearch
    } = useSearchUser();

    const {
        searchAvatarPageNum,
        searchAvatarResults,
        searchAvatarPage,
        isSearchAvatarLoading,
        searchAvatar,
        moreSearchAvatar,
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

    const { searchGroupParams, searchGroupResults, isSearchGroupLoading, searchGroup, moreSearchGroup, clearGroupSearch } =
        useSearchGroup();

    const paginationConfig = computed(() => {
        switch (activeSearchTab.value) {
            case 'user':
                return {
                    show: searchUserResults.value.length > 0 && !isSearchUserLoading.value,
                    prevDisabled: !searchUserParams.value.offset,
                    nextDisabled: searchUserResults.value.length < 10,
                    onPrev: () => handleMoreSearchUser(-1),
                    onNext: () => handleMoreSearchUser(1)
                };
            case 'world':
                return {
                    show: searchWorldResults.value.length > 0 && !isSearchWorldLoading.value,
                    prevDisabled: !searchWorldParams.value.offset,
                    nextDisabled: searchWorldResults.value.length < 10,
                    onPrev: () => moreSearchWorld(-1),
                    onNext: () => moreSearchWorld(1)
                };
            case 'avatar':
                return {
                    show: searchAvatarPage.value.length > 0 && !isSearchAvatarLoading.value,
                    prevDisabled: !searchAvatarPageNum.value,
                    nextDisabled:
                        searchAvatarResults.value.length < 10 ||
                        (searchAvatarPageNum.value + 1) * 10 >= searchAvatarResults.value.length,
                    onPrev: () => moreSearchAvatar(-1),
                    onNext: () => moreSearchAvatar(1)
                };
            case 'group':
                return {
                    show: searchGroupResults.value.length > 0 && !isSearchGroupLoading.value,
                    prevDisabled: !searchGroupParams.value.offset,
                    nextDisabled: searchGroupResults.value.length < 10,
                    onPrev: () => moreSearchGroup(-1),
                    onNext: () => moreSearchGroup(1)
                };
            default:
                return { show: false, prevDisabled: true, nextDisabled: true, onPrev: () => {}, onNext: () => {} };
        }
    });

    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    /**
     *
     */
    function handleClearSearch() {
        clearUserSearch();
        clearWorldSearch();
        clearAvatarSearch();
        clearGroupSearch();
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
     */
    function search() {
        if (activeSearchTab.value === 'avatar' && (!searchText.value || searchText.value.length < 3)) {
            toast.warning(t('view.search.avatar.min_chars_warning'));
            return;
        }
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
</script>
