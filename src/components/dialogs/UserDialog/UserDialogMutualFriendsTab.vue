<template>
    <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
            <Button
                class="rounded-full"
                variant="ghost"
                size="icon-sm"
                :disabled="userDialog.isMutualFriendsLoading"
                @click="getUserMutualFriends(userDialog.id)">
                <Spinner v-if="userDialog.isMutualFriendsLoading" />
                <RefreshCw v-else />
            </Button>
            <span class="inline-flex items-center gap-1 ml-1.5">
                <Users class="size-3.5 text-muted-foreground" />
                {{ t('dialog.user.groups.total_count', { count: userDialog.mutualFriends.length }) }}
            </span>
        </div>
        <div style="display: flex; align-items: center">
            <Input v-model="searchQuery" class="h-8 w-40 mr-2" placeholder="Search friends" @click.stop />
            <span style="margin-right: 6px">{{ t('dialog.user.groups.sort_by') }}</span>
            <Select
                :model-value="userDialogMutualFriendSortingKey"
                :disabled="userDialog.isMutualFriendsLoading"
                @update:modelValue="setUserDialogMutualFriendSortingByKey">
                <SelectTrigger size="sm" @click.stop>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="(item, key) in userDialogMutualFriendSortingOptions"
                        :key="String(key)"
                        :value="String(key)">
                        {{ t(item.name) }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
    <ul class="flex flex-wrap items-start" style="margin-top: 8px; overflow: auto; max-height: 250px; min-width: 130px">
        <li
            v-for="user in filteredMutualFriends"
            :key="user.id"
            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
            @click="showUserDialog(user.id)">
            <div class="relative inline-block flex-none size-9 mr-2.5">
                <Avatar class="size-9">
                    <AvatarImage :src="userImage(user)" class="object-cover" />
                    <AvatarFallback>
                        <User class="size-4 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            </div>
            <div class="flex-1 overflow-hidden">
                <span
                    class="block truncate font-medium leading-[18px]"
                    :style="{ color: user.$userColour }"
                    v-text="user.displayName"></span>
            </div>
        </li>
    </ul>
</template>

<script setup>
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { RefreshCw, User, Users } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { Input } from '@/components/ui/input';
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { compareByDisplayName, compareByFriendOrder, compareByLastActiveRef, userImage } from '../../../shared/utils';
    import { database } from '../../../services/database';
    import { processBulk } from '../../../services/request';
    import { useOptionKeySelect } from '../../../composables/useOptionKeySelect';
    import { useUserStore } from '../../../stores';
    import { userDialogMutualFriendSortingOptions } from '../../../shared/constants';
    import { userRequest } from '../../../api';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();

    const userStore = useUserStore();
    const { userDialog, currentUser } = storeToRefs(userStore);
    const { cachedUsers } = userStore;

    const { selectedKey: userDialogMutualFriendSortingKey, selectByKey: setUserDialogMutualFriendSortingByKey } =
        useOptionKeySelect(
            userDialogMutualFriendSortingOptions,
            () => userDialog.value.mutualFriendSorting,
            setUserDialogMutualFriendSorting
        );

    const searchQuery = ref('');
    const filteredMutualFriends = computed(() => {
        const friends = userDialog.value.mutualFriends;
        const query = searchQuery.value.trim().toLowerCase();
        if (!query) return friends;
        return friends.filter((u) => (u.displayName || '').toLowerCase().includes(query));
    });
    watch(() => userDialog.value.id, () => { searchQuery.value = ''; });

    /**
     *
     * @param sortOrder
     */
    async function setUserDialogMutualFriendSorting(sortOrder) {
        const D = userDialog.value;
        D.mutualFriendSorting = sortOrder;
        switch (sortOrder.value) {
            case 'alphabetical':
                D.mutualFriends.sort(compareByDisplayName);
                break;
            case 'lastActive':
                D.mutualFriends.sort(compareByLastActiveRef);
                break;
            case 'friendOrder':
                D.mutualFriends.sort(compareByFriendOrder);
                break;
        }
    }

    /**
     *
     * @param userId
     */
    async function getUserMutualFriends(userId) {
        userDialog.value.mutualFriends = [];
        if (currentUser.value.hasSharedConnectionsOptOut) {
            return;
        }
        userDialog.value.isMutualFriendsLoading = true;
        const params = {
            userId,
            n: 100,
            offset: 0
        };
        processBulk({
            fn: userRequest.getMutualFriends,
            N: -1,
            params,
            handle: (args) => {
                for (const json of args.json) {
                    if (userDialog.value.mutualFriends.some((u) => u.id === json.id)) {
                        continue;
                    }
                    const ref = cachedUsers.get(json.id);
                    if (typeof ref !== 'undefined') {
                        userDialog.value.mutualFriends.push(ref);
                    } else {
                        userDialog.value.mutualFriends.push(json);
                    }
                }
                setUserDialogMutualFriendSorting(userDialog.value.mutualFriendSorting);
            },
            done: (success) => {
                userDialog.value.isMutualFriendsLoading = false;
                if (success) {
                    const mutualIds = userDialog.value.mutualFriends.map((u) => u.id);
                    database.updateMutualsForFriend(userId, mutualIds);
                }
            }
        });
    }

    defineExpose({ getUserMutualFriends });
</script>
