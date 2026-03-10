<template>
    <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
            <Button
                class="rounded-full"
                variant="ghost"
                size="icon-sm"
                :disabled="userDialog.isGroupsLoading"
                @click="getUserGroups(userDialog.id)">
                <Spinner v-if="userDialog.isGroupsLoading" />
                <RefreshCw v-else />
            </Button>
            <span style="margin-left: 6px">{{
                t('dialog.user.groups.total_count', { count: userDialog.userGroups.groups.length })
            }}</span>
            <template v-if="userDialogGroupEditMode">
                <span class="text-[10px]" style="margin-left: 8px">{{ t('dialog.user.groups.hold_shift') }}</span>
            </template>
        </div>
        <div style="display: flex; align-items: center">
            <template v-if="!userDialogGroupEditMode">
                <span style="margin-right: 6px">{{ t('dialog.user.groups.sort_by') }}</span>
                <Select
                    :model-value="userDialogGroupSortingKey"
                    :disabled="userDialog.isGroupsLoading"
                    @update:modelValue="setUserDialogGroupSortingByKey">
                    <SelectTrigger size="sm" @click.stop>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="(item, key) in userDialogGroupSortingOptions"
                            :key="String(key)"
                            :value="String(key)"
                            :disabled="
                                item === userDialogGroupSortingOptions.inGame && userDialog.id !== currentUser.id
                            ">
                            {{ t(item.name) }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </template>
            <Button variant="outline" size="sm" v-if="userDialogGroupEditMode" @click="exitEditModeCurrentUserGroups">
                {{ t('dialog.user.groups.exit_edit_mode') }}
            </Button>
            <Button
                size="sm"
                variant="outline"
                v-else-if="currentUser.id === userDialog.id"
                class="ml-2"
                @click="editModeCurrentUserGroups">
                {{ t('dialog.user.groups.edit_mode') }}
            </Button>
        </div>
    </div>
    <div style="margin-top: 8px">
        <template v-if="userDialogGroupEditMode">
            <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px; max-height: unset">
                <!-- Bulk actions dropdown (shown only in edit mode) -->
                <Select :model-value="bulkGroupActionValue" @update:modelValue="handleBulkGroupAction">
                    <SelectTrigger size="sm" style="margin-right: 6px; margin-bottom: 6px" @click.stop>
                        <SelectValue :placeholder="t('dialog.group.actions.manage_selected')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="visibility:visible">
                            {{ t('dialog.group.actions.visibility_everyone') }}
                        </SelectItem>
                        <SelectItem value="visibility:friends">
                            {{ t('dialog.group.actions.visibility_friends') }}
                        </SelectItem>
                        <SelectItem value="visibility:hidden">
                            {{ t('dialog.group.actions.visibility_hidden') }}
                        </SelectItem>
                        <SelectItem value="leave">
                            {{ t('dialog.user.groups.leave_group_tooltip') }}
                        </SelectItem>
                    </SelectContent>
                </Select>

                <!-- Select All button -->
                <Button
                    size="sm"
                    variant="outline"
                    style="padding: 7px 16px; margin-bottom: 6px"
                    @click="selectAllGroups">
                    {{
                        userDialogGroupAllSelected
                            ? t('dialog.group.actions.deselect_all')
                            : t('dialog.group.actions.select_all')
                    }}
                </Button>

                <div
                    v-for="group in userDialogGroupEditGroups"
                    :key="group.id"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-full hover:rounded-[25px_5px_5px_25px]"
                    @click="showGroupDialog(group.id)">
                    <!-- Manual checkbox -->
                    <div
                        style="
                            margin-left: 6px;
                            margin-right: 6px;
                            transform: scale(0.8);
                            transform-origin: left center;
                        "
                        @click.stop>
                        <Checkbox
                            :model-value="userDialogGroupEditSelectedGroupIds.includes(group.id)"
                            @update:modelValue="() => toggleGroupSelection(group.id)" />
                    </div>

                    <div style="margin-right: 3px; margin-left: 6px" @click.stop>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0; rotate: 180deg"
                            @click="moveGroupTop(group.id)">
                            <DownloadIcon />
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                            @click="moveGroupBottom(group.id)">
                            <DownloadIcon />
                        </Button>
                    </div>
                    <div style="margin-right: 8px" @click.stop>
                        <Button
                            size="icon-sm"
                            variant="outline"
                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                            @click="moveGroupUp(group.id)">
                            <ArrowUp />
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="outline"
                            style="display: block; padding: 7px; font-size: 9px; margin-left: 0"
                            @click="moveGroupDown(group.id)">
                            <ArrowDown />
                        </Button>
                    </div>
                    <div class="relative inline-block flex-none size-9 mr-2.5">
                        <img class="size-full rounded-full object-cover" :src="group.iconUrl" loading="lazy" />
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <span class="block truncate font-medium leading-[18px]" v-text="group.name"></span>
                        <span class="block truncate text-xs">
                            <TooltipWrapper
                                v-if="group.isRepresenting"
                                side="top"
                                :content="t('dialog.group.members.representing')">
                                <Tag style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper v-if="group.myMember?.visibility !== 'visible'" side="top">
                                <template #content>
                                    <span
                                        >{{ t('dialog.group.members.visibility') }}
                                        {{ group.myMember.visibility }}</span
                                    >
                                </template>
                                <Eye style="margin-right: 6px" />
                            </TooltipWrapper>
                            <span>({{ group.memberCount }})</span>
                        </span>
                    </div>
                    <Select
                        v-if="group.myMember?.visibility"
                        :model-value="group.myMember.visibility"
                        :disabled="group.privacy !== 'default'"
                        @update:modelValue="(value) => setGroupVisibility(group.id, value)">
                        <SelectTrigger size="sm" @click.stop>
                            <SelectValue
                                :placeholder="
                                    group.myMember.visibility === 'visible'
                                        ? t('dialog.group.tags.visible')
                                        : group.myMember.visibility === 'friends'
                                          ? t('dialog.group.tags.friends')
                                          : group.myMember.visibility === 'hidden'
                                            ? t('dialog.group.tags.hidden')
                                            : group.myMember.visibility
                                " />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="visible">
                                {{ t('dialog.group.actions.visibility_everyone') }}
                            </SelectItem>
                            <SelectItem value="friends">
                                {{ t('dialog.group.actions.visibility_friends') }}
                            </SelectItem>
                            <SelectItem value="hidden">
                                {{ t('dialog.group.actions.visibility_hidden') }}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <!--//- JSON is missing isSubscribedToAnnouncements, can't be implemented-->
                    <!-- <Button size="sm" variant="outline"
                            @click.stop="
                                setGroupSubscription(group.id, !group.myMember.isSubscribedToAnnouncements)
                            ">
                            <span v-if="group.myMember.isSubscribedToAnnouncements"
                                ><BellOff style="margin-left: 6px" />
                                {{ t('dialog.group.tags.subscribed') }}</span
                            >
                            <span v-else
                                ><Bell style="margin-left: 6px" />
                                {{ t('dialog.group.tags.unsubscribed') }}</span
                            >
                        </Button> -->
                    <TooltipWrapper side="right" :content="t('dialog.user.groups.leave_group_tooltip')">
                        <Button
                            class="rounded-full h-6 w-6"
                            size="icon-sm"
                            variant="outline"
                            v-if="shiftHeld"
                            style="margin-left: 6px"
                            @click.stop="leaveGroup(group.id)">
                            <LogOut />
                        </Button>
                        <Button
                            class="rounded-full h-6 w-6 text-red-600"
                            size="icon-sm"
                            variant="outline"
                            v-else
                            style="margin-left: 6px"
                            @click.stop="leaveGroupPrompt(group.id)">
                            <LogOut />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
        </template>
        <template v-else>
            <template v-if="userDialog.userGroups.ownGroups.length > 0">
                <span class="text-base font-bold">{{ t('dialog.user.groups.own_groups') }}</span>
                <span class="text-xs ml-1.5"
                    >{{ userDialog.userGroups.ownGroups.length }}/{{
                        // @ts-ignore
                        cachedConfig?.constants?.GROUPS?.MAX_OWNED
                    }}</span
                >
                <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px; min-height: 60px">
                    <div
                        v-for="group in userDialog.userGroups.ownGroups"
                        :key="group.id"
                        class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                        @click="showGroupDialog(group.id)">
                        <div class="relative inline-block flex-none size-9 mr-2.5">
                            <img class="size-full rounded-full object-cover" :src="group.iconUrl" loading="lazy" />
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]" v-text="group.name"></span>
                            <span class="block truncate text-xs inline-flex! items-center">
                                <TooltipWrapper
                                    v-if="group.isRepresenting"
                                    side="top"
                                    :content="t('dialog.group.members.representing')">
                                    <Tag style="margin-right: 6px" />
                                </TooltipWrapper>
                                <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                    <template #content>
                                        <span
                                            >{{ t('dialog.group.members.visibility') }}
                                            {{ group.memberVisibility }}</span
                                        >
                                    </template>
                                    <Eye style="margin-right: 6px" />
                                </TooltipWrapper>
                                <span>({{ group.memberCount }})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </template>
            <template v-if="userDialog.userGroups.mutualGroups.length > 0">
                <span class="text-base font-bold">{{ t('dialog.user.groups.mutual_groups') }}</span>
                <span class="text-xs ml-1.5">{{ userDialog.userGroups.mutualGroups.length }}</span>
                <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px; min-height: 60px">
                    <div
                        v-for="group in userDialog.userGroups.mutualGroups"
                        :key="group.id"
                        class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                        @click="showGroupDialog(group.id)">
                        <div class="relative inline-block flex-none size-9 mr-2.5">
                            <img class="size-full rounded-full object-cover" :src="group.iconUrl" loading="lazy" />
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]" v-text="group.name"></span>
                            <span class="block truncate text-xs inline-flex! items-center">
                                <TooltipWrapper
                                    v-if="group.isRepresenting"
                                    side="top"
                                    :content="t('dialog.group.members.representing')">
                                    <Tag style="margin-right: 6px" />
                                </TooltipWrapper>
                                <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                    <template #content>
                                        <span
                                            >{{ t('dialog.group.members.visibility') }}
                                            {{ group.memberVisibility }}</span
                                        >
                                    </template>
                                    <Eye style="margin-right: 6px" />
                                </TooltipWrapper>
                                <span>({{ group.memberCount }})</span>
                            </span>
                        </div>
                    </div>
                </div>
            </template>
            <template v-if="userDialog.userGroups.remainingGroups.length > 0">
                <span class="text-base font-bold">{{ t('dialog.user.groups.groups') }}</span>
                <span class="text-xs ml-1.5">
                    {{ userDialog.userGroups.remainingGroups.length }}
                    <template v-if="currentUser.id === userDialog.id">
                        /
                        <template v-if="isLocalUserVrcPlusSupporter">
                            {{ cachedConfig?.constants?.GROUPS?.MAX_JOINED_PLUS }}
                        </template>
                        <template v-else>
                            {{ cachedConfig?.constants?.GROUPS?.MAX_JOINED }}
                        </template>
                    </template>
                </span>
                <div class="flex flex-wrap items-start" style="margin-top: 8px; margin-bottom: 16px; min-height: 60px">
                    <div
                        v-for="group in userDialog.userGroups.remainingGroups"
                        :key="group.id"
                        class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                        @click="showGroupDialog(group.id)">
                        <div class="relative inline-block flex-none size-9 mr-2.5">
                            <img class="size-full rounded-full object-cover" :src="group.iconUrl" loading="lazy" />
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span class="block truncate font-medium leading-[18px]" v-text="group.name"></span>
                            <div class="block truncate text-xs inline-flex! items-center">
                                <TooltipWrapper
                                    v-if="group.isRepresenting"
                                    side="top"
                                    :content="t('dialog.group.members.representing')">
                                    <Tag style="margin-right: 6px" />
                                </TooltipWrapper>
                                <TooltipWrapper v-if="group.memberVisibility !== 'visible'" side="top">
                                    <template #content>
                                        <span
                                            >{{ t('dialog.group.members.visibility') }}
                                            {{ group.memberVisibility }}</span
                                        >
                                    </template>
                                    <Eye style="margin-right: 6px" />
                                </TooltipWrapper>
                                <span>({{ group.memberCount }})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup>
    import { ArrowDown, ArrowUp, DownloadIcon, Eye, LogOut, RefreshCw, Tag } from 'lucide-vue-next';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { nextTick, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useAuthStore, useGroupStore, useUiStore, useUserStore } from '../../../stores';
    import {
        showGroupDialog,
        applyGroup,
        saveCurrentUserGroups,
        updateInGameGroupOrder,
        leaveGroup,
        leaveGroupPrompt,
        setGroupVisibility,
        handleGroupList
    } from '../../../coordinators/groupCoordinator';
    import { compareByMemberCount, compareByName } from '../../../shared/utils';
    import { groupRequest } from '../../../api';
    import { useOptionKeySelect } from '../../../composables/useOptionKeySelect';
    import { userDialogGroupSortingOptions } from '../../../shared/constants';

    const { t } = useI18n();

    const { userDialog, currentUser, isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { currentUserGroups, inGameGroupOrder } = storeToRefs(useGroupStore());
    const { cachedConfig } = storeToRefs(useAuthStore());
    const { shiftHeld } = storeToRefs(useUiStore());

    const userDialogGroupEditMode = ref(false);
    const userDialogGroupEditGroups = ref([]);
    const userDialogGroupAllSelected = ref(false);
    const userDialogGroupEditSelectedGroupIds = ref([]);

    const { selectedKey: userDialogGroupSortingKey, selectByKey: setUserDialogGroupSortingByKey } = useOptionKeySelect(
        userDialogGroupSortingOptions,
        () => userDialog.value.groupSorting,
        setUserDialogGroupSorting
    );

    /**
     *
     * @param sortOrder
     */
    async function setUserDialogGroupSorting(sortOrder) {
        const D = userDialog.value;
        if (D.groupSorting.value === sortOrder.value) {
            return;
        }
        D.groupSorting = sortOrder;
        await sortCurrentUserGroups();
    }

    /**
     *
     * @param userId
     */
    async function getUserGroups(userId) {
        exitEditModeCurrentUserGroups();
        userDialog.value.isGroupsLoading = true;
        userDialog.value.userGroups = {
            groups: [],
            ownGroups: [],
            mutualGroups: [],
            remainingGroups: []
        };
        const args = await groupRequest.getGroups({ userId });
        handleGroupList(args);
        if (userId !== userDialog.value.id) {
            userDialog.value.isGroupsLoading = false;
            return;
        }
        if (userId === currentUser.value.id) {
            // update current user groups
            currentUserGroups.value.clear();
            args.json.forEach((group) => {
                const ref = applyGroup(group);
                if (!currentUserGroups.value.has(group.id)) {
                    currentUserGroups.value.set(group.id, ref);
                }
            });

            saveCurrentUserGroups();
        }
        userDialog.value.userGroups.groups = args.json;
        for (let i = 0; i < args.json.length; ++i) {
            const group = args.json[i];
            if (!group?.id) {
                console.error('getUserGroups, group ID is missing', group);
                continue;
            }
            if (group.ownerId === userId) {
                userDialog.value.userGroups.ownGroups.unshift(group);
            }
            if (userId === currentUser.value.id) {
                // skip mutual groups for current user
                if (group.ownerId !== userId) {
                    userDialog.value.userGroups.remainingGroups.unshift(group);
                }
                continue;
            }
            if (group.mutualGroup) {
                userDialog.value.userGroups.mutualGroups.unshift(group);
            }
            if (!group.mutualGroup && group.ownerId !== userId) {
                userDialog.value.userGroups.remainingGroups.unshift(group);
            }
        }
        if (userId === currentUser.value.id) {
            userDialog.value.groupSorting = userDialogGroupSortingOptions.inGame;
        } else if (userDialog.value.groupSorting.value === userDialogGroupSortingOptions.inGame.value) {
            userDialog.value.groupSorting = userDialogGroupSortingOptions.alphabetical;
        }
        await sortCurrentUserGroups();
        userDialog.value.isGroupsLoading = false;
    }

    /**
     *
     * @param a
     * @param b
     */
    function sortGroupsByInGame(a, b) {
        const aIndex = inGameGroupOrder.value.indexOf(a?.id);
        const bIndex = inGameGroupOrder.value.indexOf(b?.id);
        if (aIndex === -1 && bIndex === -1) {
            return 0;
        }
        if (aIndex === -1) {
            return 1;
        }
        if (bIndex === -1) {
            return -1;
        }
        return aIndex - bIndex;
    }

    /**
     *
     */
    async function sortCurrentUserGroups() {
        const D = userDialog.value;
        let sortMethod = () => 0;

        switch (D.groupSorting.value) {
            case 'alphabetical':
                sortMethod = compareByName;
                break;
            case 'members':
                sortMethod = compareByMemberCount;
                break;
            case 'inGame':
                sortMethod = sortGroupsByInGame;
                await updateInGameGroupOrder();
                break;
        }

        userDialog.value.userGroups.ownGroups.sort(sortMethod);
        userDialog.value.userGroups.mutualGroups.sort(sortMethod);
        userDialog.value.userGroups.remainingGroups.sort(sortMethod);
    }

    /**
     *
     */
    async function exitEditModeCurrentUserGroups() {
        userDialogGroupEditMode.value = false;
        userDialogGroupEditGroups.value = [];
        userDialogGroupEditSelectedGroupIds.value = [];
        userDialogGroupAllSelected.value = false;
        await sortCurrentUserGroups();
    }

    /**
     *
     */
    async function editModeCurrentUserGroups() {
        await updateInGameGroupOrder();
        userDialogGroupEditGroups.value = Array.from(currentUserGroups.value.values());
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        userDialogGroupEditMode.value = true;
    }

    /**
     *
     */
    async function saveInGameGroupOrder() {
        userDialogGroupEditGroups.value.sort(sortGroupsByInGame);
        try {
            await AppApi.SetVRChatRegistryKey(
                `VRC_GROUP_ORDER_${currentUser.value.id}`,
                JSON.stringify(inGameGroupOrder.value),
                3
            );
        } catch (err) {
            console.error(err);
            toast.error('Failed to save in-game group order');
        }
    }

    // Select all groups currently in the editable list by collecting their IDs
    /**
     *
     */
    function selectAllGroups() {
        const allSelected = userDialogGroupEditSelectedGroupIds.value.length === userDialogGroupEditGroups.value.length;

        // First update selection state
        userDialogGroupEditSelectedGroupIds.value = allSelected ? [] : userDialogGroupEditGroups.value.map((g) => g.id);
        userDialogGroupAllSelected.value = !allSelected;

        // Toggle editMode off and back on to force checkbox UI update
        userDialogGroupEditMode.value = false;
        nextTick(() => {
            userDialogGroupEditMode.value = true;
        });
    }

    const bulkGroupActionValue = ref('');

    /**
     *
     * @param value
     */
    function handleBulkGroupAction(value) {
        bulkGroupActionValue.value = value;

        if (value === 'leave') {
            bulkLeaveGroups();
        } else if (typeof value === 'string' && value.startsWith('visibility:')) {
            const newVisibility = value.slice('visibility:'.length);
            bulkSetVisibility(newVisibility);
        }

        nextTick(() => {
            bulkGroupActionValue.value = '';
        });
    }

    // Apply the given visibility to all selected groups
    /**
     *
     * @param newVisibility
     */
    async function bulkSetVisibility(newVisibility) {
        for (const groupId of userDialogGroupEditSelectedGroupIds.value) {
            setGroupVisibility(groupId, newVisibility);
        }
    }

    // Leave (remove user from) all selected groups
    /**
     *
     */
    function bulkLeaveGroups() {
        for (const groupId of userDialogGroupEditSelectedGroupIds.value) {
            leaveGroup(groupId);
        }
    }

    // Toggle individual group selection for bulk actions
    /**
     *
     * @param groupId
     */
    function toggleGroupSelection(groupId) {
        const index = userDialogGroupEditSelectedGroupIds.value.indexOf(groupId);
        if (index === -1) {
            userDialogGroupEditSelectedGroupIds.value.push(groupId);
        } else {
            userDialogGroupEditSelectedGroupIds.value.splice(index, 1);
        }
    }

    /**
     *
     * @param groupId
     */
    function moveGroupUp(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index > 0) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.splice(index - 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    /**
     *
     * @param groupId
     */
    function moveGroupDown(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index < inGameGroupOrder.value.length - 1) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.splice(index + 1, 0, groupId);
            saveInGameGroupOrder();
        }
    }

    /**
     *
     * @param groupId
     */
    function moveGroupTop(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index > 0) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.unshift(groupId);
            saveInGameGroupOrder();
        }
    }

    /**
     *
     * @param groupId
     */
    function moveGroupBottom(groupId) {
        const index = inGameGroupOrder.value.indexOf(groupId);
        if (index < inGameGroupOrder.value.length - 1) {
            inGameGroupOrder.value.splice(index, 1);
            inGameGroupOrder.value.push(groupId);
            saveInGameGroupOrder();
        }
    }

    defineExpose({ getUserGroups });
</script>
