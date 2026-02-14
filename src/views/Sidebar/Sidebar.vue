<template>
    <div class="x-aside-container">
        <div style="display: flex; align-items: baseline">
            <div style="flex: 1; padding: 10px; padding-left: 0">
                <Popover v-model:open="isQuickSearchOpen">
                    <PopoverTrigger as-child>
                        <Input
                            v-model="quickSearchQuery"
                            :placeholder="t('side_panel.search_placeholder')"
                            autocomplete="off" />
                    </PopoverTrigger>
                    <PopoverContent
                        side="bottom"
                        align="start"
                        class="x-quick-search-popover w-(--reka-popover-trigger-width) p-2"
                        @open-auto-focus.prevent
                        @close-auto-focus.prevent>
                        <div class="max-h-80 overflow-auto">
                            <button
                                v-for="item in quickSearchItems"
                                :key="item.value"
                                type="button"
                                class="w-full bg-transparent p-0 text-left"
                                @mousedown.prevent
                                @click="handleQuickSearchSelect(item.value)">
                                <div class="x-friend-item">
                                    <template v-if="item.ref">
                                        <div class="detail">
                                            <span class="name" :style="{ color: item.ref.$userColour }">{{
                                                item.ref.displayName
                                            }}</span>
                                            <span v-if="!item.ref.isFriend" class="block truncate text-xs"></span>
                                            <span
                                                v-else-if="item.ref.state === 'offline'"
                                                class="block truncate text-xs"
                                                >{{ t('side_panel.search_result_active') }}</span
                                            >
                                            <span
                                                v-else-if="item.ref.state === 'active'"
                                                class="block truncate text-xs"
                                                >{{ t('side_panel.search_result_offline') }}</span
                                            >
                                            <Location
                                                v-else
                                                class="text-xs"
                                                :location="item.ref.location"
                                                :traveling="item.ref.travelingToLocation"
                                                :link="false" />
                                        </div>
                                        <img :src="userImage(item.ref)" class="avatar" loading="lazy" />
                                    </template>
                                    <span v-else>
                                        {{ t('side_panel.search_result_more') }}
                                        <span style="font-weight: bold">{{ item.label }}</span>
                                    </span>
                                </div>
                            </button>
                            <div v-if="quickSearchItems.length === 0" class="px-2 py-2 text-xs opacity-70">
                                <DataTableEmpty type="nomatch" />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div class="flex items-center mx-1 gap-1">
                <TooltipWrapper side="bottom" :content="t('side_panel.refresh_tooltip')">
                    <Button
                        class="rounded-full"
                        variant="ghost"
                        size="icon-sm"
                        :disabled="isRefreshFriendsLoading"
                        @click="refreshFriendsList">
                        <Spinner v-if="isRefreshFriendsLoading" />
                        <RefreshCw v-else />
                    </Button>
                </TooltipWrapper>
                <Popover>
                    <PopoverTrigger as-child>
                        <Button class="rounded-full" variant="ghost" size="icon-sm">
                            <Settings />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="end" class="w-64 p-3" @open-auto-focus.prevent>
                        <div class="flex flex-col gap-2.5 text-xs">
                            <div class="flex items-center justify-between">
                                <span>{{ t('side_panel.settings.group_by_instance') }}</span>
                                <Switch
                                    :model-value="isSidebarGroupByInstance"
                                    @update:modelValue="setIsSidebarGroupByInstance" />
                            </div>
                            <div v-if="isSidebarGroupByInstance" class="flex items-center justify-between">
                                <span>{{ t('side_panel.settings.hide_friends_in_same_instance') }}</span>
                                <Switch
                                    :model-value="isHideFriendsInSameInstance"
                                    @update:modelValue="setIsHideFriendsInSameInstance" />
                            </div>
                            <div class="flex items-center justify-between">
                                <span>{{ t('side_panel.settings.split_favorite_friends') }}</span>
                                <Switch
                                    :model-value="isSidebarDivideByFriendGroup"
                                    @update:modelValue="setIsSidebarDivideByFriendGroup" />
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <span>{{ t('side_panel.settings.favorite_groups') }}</span>
                                <Select
                                    :model-value="resolvedSidebarFavoriteGroups"
                                    multiple
                                    @update:modelValue="handleFavoriteGroupsChange">
                                    <SelectTrigger size="sm" class="w-full overflow-hidden">
                                        <SelectValue
                                            :placeholder="t('side_panel.settings.favorite_groups_placeholder')">
                                            <template v-if="resolvedSidebarFavoriteGroups.length">
                                                <span class="truncate">{{ selectedFavGroupLabel }}</span>
                                                <span
                                                    v-if="resolvedSidebarFavoriteGroups.length > 1"
                                                    class="bg-primary text-primary-foreground shrink-0 rounded px-1 text-xs">
                                                    +{{ resolvedSidebarFavoriteGroups.length - 1 }}
                                                </span>
                                            </template>
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem
                                                v-for="group in favoriteFriendGroups"
                                                :key="group.key"
                                                :value="group.key">
                                                {{ group.displayName }}
                                            </SelectItem>
                                        </SelectGroup>
                                        <template v-if="localFriendFavoriteGroups.length">
                                            <SelectSeparator />
                                            <SelectGroup>
                                                <SelectItem
                                                    v-for="group in localFriendFavoriteGroups"
                                                    :key="'local:' + group"
                                                    :value="'local:' + group">
                                                    {{ group }}
                                                </SelectItem>
                                            </SelectGroup>
                                        </template>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <div class="flex flex-col gap-1.5">
                                <span>{{ t('side_panel.settings.sort_primary') }}</span>
                                <Select :model-value="sidebarSortMethod1" @update:modelValue="setSidebarSortMethod1">
                                    <SelectTrigger size="sm">
                                        <SelectValue
                                            :placeholder="
                                                t('view.settings.appearance.side_panel.sorting.placeholder')
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <span>{{ t('side_panel.settings.sort_secondary') }}</span>
                                <Select
                                    :model-value="sidebarSortMethod2"
                                    :disabled="!sidebarSortMethod1"
                                    @update:modelValue="(v) => setSidebarSortMethod2(v === CLEAR_VALUE ? '' : v)">
                                    <SelectTrigger size="sm">
                                        <SelectValue
                                            :placeholder="
                                                t('view.settings.appearance.side_panel.sorting.placeholder')
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem :value="CLEAR_VALUE">{{
                                            t('dialog.gallery_select.none')
                                        }}</SelectItem>
                                        <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="flex flex-col gap-1.5">
                                <span>{{ t('side_panel.settings.sort_tertiary') }}</span>
                                <Select
                                    :model-value="sidebarSortMethod3"
                                    :disabled="!sidebarSortMethod2"
                                    @update:modelValue="(v) => setSidebarSortMethod3(v === CLEAR_VALUE ? '' : v)">
                                    <SelectTrigger size="sm">
                                        <SelectValue
                                            :placeholder="
                                                t('view.settings.appearance.side_panel.sorting.placeholder')
                                            " />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem :value="CLEAR_VALUE">{{
                                            t('dialog.gallery_select.none')
                                        }}</SelectItem>
                                        <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                                            {{ opt.label }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <TabsUnderline
            default-value="friends"
            :items="sidebarTabs"
            :unmount-on-hide="false"
            variant="equal"
            fill
            class="zero-margin-tabs"
            style="height: calc(100% - 70px); margin-top: 5px">
            <template #label-friends>
                <span>{{ t('side_panel.friends') }}</span>
                <span class="sidebar-tab-count"> ({{ onlineFriendCount }}/{{ friends.size }}) </span>
            </template>
            <template #label-groups>
                <span>{{ t('side_panel.groups') }}</span>
                <span class="sidebar-tab-count"> ({{ groupInstances.length }}) </span>
            </template>
            <template #friends>
                <div class="h-full overflow-hidden">
                    <FriendsSidebar />
                </div>
            </template>
            <template #groups>
                <div class="h-full overflow-hidden">
                    <GroupsSidebar />
                </div>
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectSeparator,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, ref, watch } from 'vue';
    import { RefreshCw, Settings } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Input } from '@/components/ui/input';
    import { Separator } from '@/components/ui/separator';
    import { Spinner } from '@/components/ui/spinner';
    import { Switch } from '@/components/ui/switch';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAppearanceSettingsStore,
        useFavoriteStore,
        useFriendStore,
        useGroupStore,
        useSearchStore
    } from '../../stores';
    import { debounce, userImage } from '../../shared/utils';

    import FriendsSidebar from './components/FriendsSidebar.vue';
    import GroupsSidebar from './components/GroupsSidebar.vue';

    const { friends, isRefreshFriendsLoading, onlineFriendCount } = storeToRefs(useFriendStore());
    const { refreshFriendsList } = useFriendStore();
    const { quickSearchRemoteMethod, quickSearchChange } = useSearchStore();
    const { quickSearchItems } = storeToRefs(useSearchStore());
    const { groupInstances } = storeToRefs(useGroupStore());
    const { t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const {
        sidebarSortMethod1,
        sidebarSortMethod2,
        sidebarSortMethod3,
        isSidebarGroupByInstance,
        isHideFriendsInSameInstance,
        isSidebarDivideByFriendGroup,
        sidebarFavoriteGroups
    } = storeToRefs(appearanceSettingsStore);
    const {
        setSidebarSortMethod1,
        setSidebarSortMethod2,
        setSidebarSortMethod3,
        setIsSidebarGroupByInstance,
        setIsHideFriendsInSameInstance,
        setIsSidebarDivideByFriendGroup,
        setSidebarFavoriteGroups
    } = appearanceSettingsStore;

    const favoriteStore = useFavoriteStore();
    const { favoriteFriendGroups, localFriendFavoriteGroups } = storeToRefs(favoriteStore);

    const allFavoriteGroupKeys = computed(() => {
        const keys = favoriteFriendGroups.value.map((g) => g.key);
        for (const group of localFriendFavoriteGroups.value) {
            keys.push('local:' + group);
        }
        return keys;
    });

    const resolvedSidebarFavoriteGroups = computed(() => {
        if (sidebarFavoriteGroups.value.length === 0) {
            return allFavoriteGroupKeys.value;
        }
        return sidebarFavoriteGroups.value;
    });

    function handleFavoriteGroupsChange(value) {
        if (!value || value.length === 0) {
            // Deselected all → reset to all (store as empty)
            setSidebarFavoriteGroups([]);
            return;
        }
        // If all groups are selected, store as empty (= all)
        const allKeys = allFavoriteGroupKeys.value;
        if (value.length >= allKeys.length && allKeys.every((k) => value.includes(k))) {
            setSidebarFavoriteGroups([]);
            return;
        }
        setSidebarFavoriteGroups(value);
    }

    const selectedFavGroupLabel = computed(() => {
        const key = resolvedSidebarFavoriteGroups.value[0];
        if (!key) return '';
        if (key.startsWith('local:')) return key.slice(6);
        return favoriteFriendGroups.value.find((g) => g.key === key)?.displayName || key;
    });

    const CLEAR_VALUE = '__clear__';

    const sortOptions = computed(() => [
        { value: 'Sort Alphabetically', label: t('view.settings.appearance.side_panel.sorting.alphabetical') },
        { value: 'Sort by Status', label: t('view.settings.appearance.side_panel.sorting.status') },
        { value: 'Sort Private to Bottom', label: t('view.settings.appearance.side_panel.sorting.private_to_bottom') },
        { value: 'Sort by Last Active', label: t('view.settings.appearance.side_panel.sorting.last_active') },
        { value: 'Sort by Last Seen', label: t('view.settings.appearance.side_panel.sorting.last_seen') },
        { value: 'Sort by Time in Instance', label: t('view.settings.appearance.side_panel.sorting.time_in_instance') },
        { value: 'Sort by Location', label: t('view.settings.appearance.side_panel.sorting.location') }
    ]);

    const sidebarTabs = computed(() => [
        { value: 'friends', label: t('side_panel.friends') },
        { value: 'groups', label: t('side_panel.groups') }
    ]);

    const quickSearchQuery = ref('');
    const isQuickSearchOpen = ref(false);

    const runQuickSearch = debounce((value) => {
        quickSearchRemoteMethod(value);
    }, 200);

    watch(quickSearchQuery, (value) => {
        const query = String(value ?? '').trim();
        if (!query) {
            quickSearchRemoteMethod('');
            return;
        }
        runQuickSearch(query);
    });

    function handleQuickSearchSelect(value) {
        if (!value) {
            return;
        }
        isQuickSearchOpen.value = false;
        quickSearchQuery.value = '';
        quickSearchChange(String(value));
    }
</script>

<style scoped>
    .x-aside-container {
        display: flex;
        flex: none;
        flex-direction: column;
        padding: 10px 5px 5px 5px;
        order: 99;
        height: 100%;
        box-sizing: border-box;
        padding-left: 10px;
    }

    .sidebar-tab-count {
        font-size: 12px;
        margin-left: 10px;
    }
</style>
