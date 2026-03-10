<template>
    <template v-if="groupDialog.visible">
        <span v-if="hasGroupPermission(groupDialog.ref, 'group-members-viewall')" class="text-base font-bold">{{
            t('dialog.group.members.all_members')
        }}</span>
        <span v-else class="text-base font-bold">{{ t('dialog.group.members.friends_only') }}</span>
        <div style="margin-top: 8px">
            <Button
                class="rounded-full h-6 w-6"
                variant="ghost"
                size="icon-sm"
                :loading="isGroupMembersLoading"
                circle
                @click="loadAllGroupMembers">
                <Spinner v-if="isGroupMembersLoading" /><RefreshCcw v-else
            /></Button>
            <Button
                class="rounded-full h-6 w-6 ml-2"
                size="icon-sm"
                variant="ghost"
                style="margin-left: 6px"
                @click="downloadAndSaveJson(`${groupDialog.id}_members`, groupDialog.members)">
                <Download class="h-4 w-4" />
            </Button>
            <span v-if="groupDialog.memberSearch.length" class="text-sm mx-1.5"
                >{{ groupDialog.memberSearchResults.length }}/{{ groupDialog.ref.memberCount }}</span
            >
            <span v-else class="text-sm mx-1.5"
                >{{ groupDialog.members.length }}/{{ groupDialog.ref.memberCount }}</span
            >
            <div
                v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')"
                style="float: right"
                class="flex items-center">
                <span style="margin-right: 6px">{{ t('dialog.group.members.sort_by') }}</span>
                <Select
                    v-model="groupDialogMemberSortValue"
                    :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0">
                    <SelectTrigger class="h-8 w-45 mr-1">
                        <SelectValue :placeholder="t('dialog.group.members.sort_by')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="item in groupDialogSortingOptions" :key="item.value" :value="item.value">
                            {{ t(item.name) }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <span class="ml-2 mr-1">{{ t('dialog.group.members.filter') }}</span>
                <div style="display: inline-block; width: 220px">
                    <VirtualCombobox
                        v-model="groupDialogMemberFilterKey"
                        :groups="groupDialogMemberFilterGroups"
                        :disabled="isGroupMembersLoading || groupDialog.memberSearch.length > 0"
                        :placeholder="t('dialog.group.members.filter')"
                        :search-placeholder="t('dialog.group.members.search')"
                        :clearable="false"
                        :close-on-select="true">
                        <template #trigger="{ text }">
                            <span class="truncate">
                                {{ text || t('dialog.group.members.filter') }}
                            </span>
                        </template>
                    </VirtualCombobox>
                </div>
            </div>
            <InputGroupField
                v-model="groupDialog.memberSearch"
                :disabled="!hasGroupPermission(groupDialog.ref, 'group-members-manage')"
                clearable
                size="sm"
                :placeholder="t('dialog.group.members.search')"
                style="margin-top: 8px; margin-bottom: 8px"
                @input="groupMembersSearch" />
        </div>
        <div
            v-if="groupDialog.memberSearch.length"
            class="flex flex-wrap items-start"
            style="margin-top: 8px; overflow: auto; max-height: 250px; min-width: 130px">
            <div
                v-for="user in groupDialog.memberSearchResults"
                :key="user.id"
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                @click="showUserDialog(user.userId)">
                <div class="relative inline-block flex-none size-9 mr-2.5">
                    <img class="size-full rounded-full object-cover" :src="userImage(user.user)" loading="lazy" />
                </div>
                <div class="flex-1 overflow-hidden">
                    <span
                        class="block truncate font-medium leading-[18px]"
                        :style="{ color: user.user?.$userColour }"
                        v-text="user.user?.displayName" />
                    <span class="block truncate text-xs">
                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                            <TooltipWrapper
                                v-if="user.isRepresenting"
                                side="top"
                                :content="t('dialog.group.members.representing')">
                                <Tag style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                <template #content>
                                    <span>{{ t('dialog.group.members.visibility') }} {{ user.visibility }}</span>
                                </template>
                                <Eye style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="!user.isSubscribedToAnnouncements"
                                side="top"
                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                <MessageSquare style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                <template #content>
                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                    <br />
                                    <span>{{ user.managerNotes }}</span>
                                </template>
                                <Pencil style="margin-right: 6px" />
                            </TooltipWrapper>
                        </template>
                        <template v-for="roleId in user.roleIds" :key="roleId">
                            <template v-for="role in groupDialog.ref.roles" :key="role.id + roleId"
                                ><span v-if="role.id === roleId" v-text="role.name" /></template
                            ><template v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                ><span>,&nbsp;</span></template
                            >
                        </template>
                    </span>
                </div>
            </div>
        </div>
        <ul
            v-else-if="groupDialog.members.length > 0"
            class="infinite-list flex flex-wrap items-start"
            style="margin-top: 8px; overflow: auto; max-height: 250px; min-width: 130px">
            <li
                v-for="user in groupDialog.members"
                :key="user.id"
                class="infinite-list-item box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                @click="showUserDialog(user.userId)">
                <div class="relative inline-block flex-none size-9 mr-2.5">
                    <img class="size-full rounded-full object-cover" :src="userImage(user.user)" loading="lazy" />
                </div>
                <div class="flex-1 overflow-hidden">
                    <span
                        class="block truncate font-medium leading-[18px]"
                        :style="{ color: user.user?.$userColour }"
                        v-text="user.user?.displayName" />
                    <span class="block truncate text-xs">
                        <template v-if="hasGroupPermission(groupDialog.ref, 'group-members-manage')">
                            <TooltipWrapper
                                v-if="user.isRepresenting"
                                side="top"
                                :content="t('dialog.group.members.representing')">
                                <Tag style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper v-if="user.visibility !== 'visible'" side="top">
                                <template #content>
                                    <span>{{ t('dialog.group.members.visibility') }} {{ user.visibility }}</span>
                                </template>
                                <Eye style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="!user.isSubscribedToAnnouncements"
                                side="top"
                                :content="t('dialog.group.members.unsubscribed_announcements')">
                                <MessageSquare style="margin-right: 6px" />
                            </TooltipWrapper>
                            <TooltipWrapper v-if="user.managerNotes" side="top">
                                <template #content>
                                    <span>{{ t('dialog.group.members.manager_notes') }}</span>
                                    <br />
                                    <span>{{ user.managerNotes }}</span>
                                </template>
                                <Pencil style="margin-right: 6px" />
                            </TooltipWrapper>
                        </template>
                        <template v-for="roleId in user.roleIds" :key="roleId">
                            <template v-for="role in groupDialog.ref.roles" :key="roleId + role.id"
                                ><span v-if="role.id === roleId" v-text="role.name" /></template
                            ><template v-if="user.roleIds.indexOf(roleId) < user.roleIds.length - 1"
                                ><span>&nbsp;</span></template
                            >
                        </template>
                    </span>
                </div>
            </li>
            <div
                v-if="!isGroupMembersDone"
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer"
                style="width: 100%; height: 45px; text-align: center"
                @click="loadMoreGroupMembers">
                <div v-if="!isGroupMembersLoading" class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.group.members.load_more')
                    }}</span>
                </div>
            </div>
        </ul>
    </template>
</template>

<script setup>
    import { Download, Eye, MessageSquare, Pencil, RefreshCcw, Tag } from 'lucide-vue-next';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { downloadAndSaveJson, hasGroupPermission } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { useGroupStore, useUserStore } from '../../../stores';
    import { applyGroupMember, handleGroupMember } from '../../../coordinators/groupCoordinator';
    import { groupDialogSortingOptions } from '../../../shared/constants';
    import { useGroupMembers } from './useGroupMembers';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    const { userImage } = useUserDisplay();
    const { t } = useI18n();

    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog } = storeToRefs(useGroupStore());

    const {
        isGroupMembersDone,
        isGroupMembersLoading,
        groupDialogMemberSortValue,
        groupDialogMemberFilterKey,
        groupDialogMemberFilterGroups,
        groupMembersSearch,
        getGroupDialogGroupMembers,
        loadMoreGroupMembers,
        loadAllGroupMembers
    } = useGroupMembers(groupDialog, { currentUser, applyGroupMember, handleGroupMember, t });

    defineExpose({
        getGroupDialogGroupMembers
    });
</script>
