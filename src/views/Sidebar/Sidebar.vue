<template>
    <div class="x-aside-container">
        <div style="display: flex; align-items: baseline">
            <div style="flex: 1; padding: 10px; padding-left: 0">
                <Popover v-model:open="isQuickSearchOpen">
                    <PopoverTrigger as-child>
                        <Input v-model="quickSearchQuery" :placeholder="t('side_panel.search_placeholder')" />
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
                                            <span v-if="!item.ref.isFriend" class="extra"></span>
                                            <span v-else-if="item.ref.state === 'offline'" class="extra">{{
                                                t('side_panel.search_result_active')
                                            }}</span>
                                            <span v-else-if="item.ref.state === 'active'" class="extra">{{
                                                t('side_panel.search_result_offline')
                                            }}</span>
                                            <Location
                                                v-else
                                                class="extra"
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
                                No results
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div>
                <TooltipWrapper side="bottom" :content="t('side_panel.refresh_tooltip')">
                    <Button
                        class="rounded-full"
                        variant="outline"
                        size="icon-sm"
                        :disabled="isRefreshFriendsLoading"
                        style="margin-right: 10px"
                        @click="refreshFriendsList">
                        <Spinner v-if="isRefreshFriendsLoading" />
                        <RefreshCw v-else />
                    </Button>
                </TooltipWrapper>
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
                    <ScrollArea ref="friendsScrollAreaRef" class="h-full">
                        <FriendsSidebar @confirm-delete-friend="confirmDeleteFriend" />
                    </ScrollArea>
                    <BackToTop :target="friendsScrollTarget" :bottom="20" :right="20" :teleport="false" />
                </div>
            </template>
            <template #groups>
                <div class="h-full overflow-hidden">
                    <ScrollArea ref="groupsScrollAreaRef" class="h-full">
                        <GroupsSidebar :group-instances="groupInstances" :group-order="inGameGroupOrder" />
                    </ScrollArea>
                    <BackToTop :target="groupsScrollTarget" :bottom="20" :right="20" :teleport="false" />
                </div>
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { RefreshCw } from 'lucide-vue-next';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';

    import { useFriendStore, useGroupStore, useSearchStore } from '../../stores';
    import { userImage } from '../../shared/utils';

    import FriendsSidebar from './components/FriendsSidebar.vue';
    import GroupsSidebar from './components/GroupsSidebar.vue';

    const { friends, isRefreshFriendsLoading, onlineFriendCount } = storeToRefs(useFriendStore());
    const { refreshFriendsList, confirmDeleteFriend } = useFriendStore();
    const { quickSearchRemoteMethod, quickSearchChange } = useSearchStore();
    const { quickSearchItems } = storeToRefs(useSearchStore());
    const { inGameGroupOrder, groupInstances } = storeToRefs(useGroupStore());
    const { t } = useI18n();
    const sidebarTabs = computed(() => [
        { value: 'friends', label: t('side_panel.friends') },
        { value: 'groups', label: t('side_panel.groups') }
    ]);

    const quickSearchQuery = ref('');
    const isQuickSearchOpen = ref(false);

    const friendsScrollAreaRef = ref(null);
    const groupsScrollAreaRef = ref(null);
    const friendsScrollTarget = ref(null);
    const groupsScrollTarget = ref(null);

    function resolveScrollViewport(scrollAreaComponentRef) {
        // Our ScrollArea renders a DOM element root; the viewport is marked by data-slot.
        const rootEl = scrollAreaComponentRef?.$el ?? null;
        if (!rootEl || typeof rootEl.querySelector !== 'function') return null;
        return rootEl.querySelector('[data-slot="scroll-area-viewport"]');
    }

    onMounted(async () => {
        // Ensure child components are mounted before querying their DOM.
        await nextTick();
        friendsScrollTarget.value = resolveScrollViewport(friendsScrollAreaRef.value);
        groupsScrollTarget.value = resolveScrollViewport(groupsScrollAreaRef.value);
    });

    watch(
        quickSearchQuery,
        (value) => {
            quickSearchRemoteMethod(String(value ?? ''));
        },
        { immediate: true }
    );

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
    .sidebar-tab-count {
        color: var(--el-text-color-secondary);
        font-size: 12px;
        margin-left: 10px;
    }
</style>
