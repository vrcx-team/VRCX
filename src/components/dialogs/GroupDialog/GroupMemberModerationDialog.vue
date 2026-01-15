<template>
    <el-dialog
        class="x-dialog"
        v-model="groupMemberModeration.visible"
        :title="t('dialog.group_member_moderation.header')"
        append-to-body
        width="90vw">
        <div>
            <h3>{{ groupMemberModeration.groupRef.name }}</h3>
            <TabsUnderline
                default-value="members"
                :items="groupModerationTabs"
                :unmount-on-hide="false"
                style="height: 100%">
                <template #members>
                    <div style="margin-top: 10px">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="isGroupMembersLoading"
                            @click="loadAllGroupMembers">
                            <Spinner v-if="isGroupMembersLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">
                            {{ groupMemberModerationTable.data.length }}/{{
                                groupMemberModeration.groupRef.memberCount
                            }}
                        </span>
                        <div style="float: right; margin-top: 5px">
                            <span style="margin-right: 5px">{{ t('dialog.group.members.sort_by') }}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    as-child
                                    :disabled="
                                        Boolean(
                                            isGroupMembersLoading ||
                                            memberSearch.length ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                        )
                                    ">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        :disabled="
                                            Boolean(
                                                isGroupMembersLoading ||
                                                memberSearch.length ||
                                                !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                            )
                                        "
                                        @click.stop>
                                        <span>
                                            {{ t(memberSortOrder.name) }}
                                            <ArrowDown style="margin-left: 5px" />
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        v-for="item in groupDialogSortingOptions"
                                        :key="item.name"
                                        @click="setGroupMemberSortOrder(item)">
                                        {{ t(item.name) }}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <span class="ml-2" style="margin-right: 5px">{{ t('dialog.group.members.filter') }}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    as-child
                                    :disabled="
                                        Boolean(
                                            isGroupMembersLoading ||
                                            memberSearch.length ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                        )
                                    ">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        :disabled="
                                            Boolean(
                                                isGroupMembersLoading ||
                                                memberSearch.length ||
                                                !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                            )
                                        "
                                        @click.stop>
                                        <span>
                                            {{ t(memberFilter.name) }}
                                            <ArrowDown style="margin-left: 5px" />
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem
                                        v-for="item in groupDialogFilterOptions"
                                        :key="item.name"
                                        @click="setGroupMemberFilter(item)">
                                        {{ t(item.name) }}
                                    </DropdownMenuItem>
                                    <template v-for="role in groupMemberModeration.groupRef.roles" :key="role.name">
                                        <DropdownMenuItem v-if="!role.defaultRole" @click="setGroupMemberFilter(role)">
                                            {{ t(role.name) }}
                                        </DropdownMenuItem>
                                    </template>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <InputGroupField
                            v-model="memberSearch"
                            :disabled="!hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')"
                            clearable
                            size="sm"
                            :placeholder="t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px"
                            @input="groupMembersSearch" />
                        <Button size="sm" variant="outline" @click="selectAllGroupMembers">{{
                            t('dialog.group_member_moderation.select_all')
                        }}</Button>
                        <DataTableLayout
                            v-if="groupMemberModerationTable.data.length"
                            style="margin-top: 10px"
                            :table="groupMemberModerationTanstackTable"
                            :loading="isGroupMembersLoading"
                            :page-sizes="pageSizes"
                            :total-items="groupMemberModerationTotalItems" />
                    </div>
                </template>

                <template #bans>
                    <div style="margin-top: 10px">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="isGroupMembersLoading"
                            @click="getAllGroupBans(groupMemberModeration.id)">
                            <Spinner v-if="isGroupMembersLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupBansModerationTable.data.length
                        }}</span>
                        <br />
                        <InputGroupField
                            v-model="groupBansModerationTable.filters[0].value"
                            clearable
                            size="sm"
                            :placeholder="t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px" />
                        <Button size="sm" variant="outline" @click="selectAllGroupBans">{{
                            t('dialog.group_member_moderation.select_all')
                        }}</Button>
                        <DataTableLayout
                            style="margin-top: 10px"
                            :table="groupBansModerationTanstackTable"
                            :loading="isGroupMembersLoading"
                            :page-sizes="pageSizes"
                            :total-items="groupBansModerationTotalItems" />
                    </div>
                </template>

                <template #invites>
                    <div style="margin-top: 10px">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="isGroupMembersLoading"
                            @click="getAllGroupInvitesAndJoinRequests(groupMemberModeration.id)">
                            <Spinner v-if="isGroupMembersLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <br />
                        <TabsUnderline default-value="sent" :items="groupInvitesTabs" :unmount-on-hide="false">
                            <template #label-sent>
                                <span style="font-weight: bold; font-size: 16px">{{
                                    t('dialog.group_member_moderation.sent_invites')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                    groupInvitesModerationTable.data.length
                                }}</span>
                            </template>
                            <template #label-join>
                                <span style="font-weight: bold; font-size: 16px">{{
                                    t('dialog.group_member_moderation.join_requests')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                    groupJoinRequestsModerationTable.data.length
                                }}</span>
                            </template>
                            <template #label-blocked>
                                <span style="font-weight: bold; font-size: 16px">{{
                                    t('dialog.group_member_moderation.blocked_requests')
                                }}</span>
                                <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                    groupBlockedModerationTable.data.length
                                }}</span>
                            </template>
                            <template #sent>
                                <Button size="sm" variant="outline" @click="selectAllGroupInvites">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</Button>
                                <DataTableLayout
                                    style="margin-top: 10px"
                                    :table="groupInvitesModerationTanstackTable"
                                    :loading="isGroupMembersLoading"
                                    :page-sizes="pageSizes"
                                    :total-items="groupInvitesModerationTotalItems" />
                                <br />
                                <Button
                                    variant="outline"
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')
                                        )
                                    "
                                    @click="groupMembersDeleteSentInvite"
                                    >{{ t('dialog.group_member_moderation.delete_sent_invite') }}</Button
                                >
                            </template>

                            <template #join>
                                <Button size="sm" variant="outline" @click="selectAllGroupJoinRequests">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</Button>
                                <DataTableLayout
                                    style="margin-top: 10px"
                                    :table="groupJoinRequestsModerationTanstackTable"
                                    :loading="isGroupMembersLoading"
                                    :page-sizes="pageSizes"
                                    :total-items="groupJoinRequestsModerationTotalItems" />
                                <br />
                                <Button
                                    variant="outline"
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')
                                        )
                                    "
                                    class="mr-2"
                                    @click="groupMembersAcceptInviteRequest"
                                    >{{ t('dialog.group_member_moderation.accept_join_requests') }}</Button
                                >
                                <Button
                                    variant="outline"
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')
                                        )
                                    "
                                    class="mr-2"
                                    @click="groupMembersRejectInviteRequest"
                                    >{{ t('dialog.group_member_moderation.reject_join_requests') }}</Button
                                >
                                <Button
                                    variant="outline"
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')
                                        )
                                    "
                                    @click="groupMembersBlockJoinRequest"
                                    >{{ t('dialog.group_member_moderation.block_join_requests') }}</Button
                                >
                            </template>

                            <template #blocked>
                                <Button size="sm" variant="outline" @click="selectAllGroupBlocked">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</Button>
                                <DataTableLayout
                                    style="margin-top: 10px"
                                    :table="groupBlockedModerationTanstackTable"
                                    :loading="isGroupMembersLoading"
                                    :page-sizes="pageSizes"
                                    :total-items="groupBlockedModerationTotalItems" />
                                <br />
                                <Button
                                    variant="outline"
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')
                                        )
                                    "
                                    @click="groupMembersDeleteBlockedRequest"
                                    >{{ t('dialog.group_member_moderation.delete_blocked_requests') }}</Button
                                >
                            </template>
                        </TabsUnderline>
                    </div>
                </template>

                <template #logs>
                    <div style="margin-top: 10px">
                        <Button
                            class="rounded-full"
                            variant="outline"
                            size="icon-sm"
                            :disabled="isGroupMembersLoading"
                            @click="getAllGroupLogs(groupMemberModeration.id)">
                            <Spinner v-if="isGroupMembersLoading" />
                            <RefreshCw v-else />
                        </Button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupLogsModerationTable.data.length
                        }}</span>
                        <br />
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <div>
                                <Select v-model="selectedAuditLogTypes" multiple>
                                    <SelectTrigger style="margin: 10px 0; width: 250px">
                                        <SelectValue :placeholder="t('dialog.group_member_moderation.filter_type')" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            v-for="type in groupMemberModeration.auditLogTypes"
                                            :key="type"
                                            :value="type">
                                            {{ getAuditLogTypeName(type) }}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Button variant="outline" @click="showGroupLogsExportDialog">{{
                                    t('dialog.group_member_moderation.export_logs')
                                }}</Button>
                            </div>
                        </div>
                        <InputGroupField
                            v-model="groupLogsModerationTable.filters[0].value"
                            clearable
                            size="sm"
                            :placeholder="t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px" />
                        <br />
                        <DataTableLayout
                            style="margin-top: 10px"
                            :table="groupLogsModerationTanstackTable"
                            :loading="isGroupMembersLoading"
                            :page-sizes="pageSizes"
                            :total-items="groupLogsModerationTotalItems" />
                    </div>
                </template>
            </TabsUnderline>

            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.user_id') }}</span>
            <br />
            <InputGroupField
                v-model="selectUserId"
                size="sm"
                style="margin-top: 5px"
                :placeholder="t('dialog.group_member_moderation.user_id_placeholder')"
                clearable />
            <Button
                size="sm"
                variant="outline"
                style="margin-top: 10px"
                :disabled="!selectUserId"
                @click="selectGroupMemberUserId"
                >{{ t('dialog.group_member_moderation.select_user') }}</Button
            >
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.selected_users') }}</span>
            <Button
                class="rounded-full"
                size="icon-sm"
                variant="outline"
                style="margin-left: 5px"
                @click="clearSelectedGroupMembers">
                <Trash2
            /></Button>
            <br />
            <Badge
                v-for="user in selectedUsersArray"
                :key="user.id"
                variant="outline"
                style="margin-right: 5px; margin-top: 5px">
                <TooltipWrapper v-if="user.membershipStatus !== 'member'" side="top">
                    <template #content>
                        <span>{{ t('dialog.group_member_moderation.user_isnt_in_group') }}</span>
                    </template>
                    <AlertTriangle style="margin-left: 3px; display: inline-block" />
                </TooltipWrapper>
                <span v-text="user.user?.displayName || user.userId" style="font-weight: bold; margin-left: 5px"></span>
                <button
                    type="button"
                    style="
                        margin-left: 6px;
                        border: none;
                        background: transparent;
                        padding: 0;
                        display: inline-flex;
                        align-items: center;
                        color: inherit;
                        cursor: pointer;
                    "
                    @click="deleteSelectedGroupMember(user)">
                    <X class="h-3 w-3" />
                </button>
            </Badge>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.notes') }}</span>
            <InputGroupTextareaField
                v-model="note"
                class="extra"
                :rows="2"
                :placeholder="t('dialog.group_member_moderation.note_placeholder')"
                style="margin-top: 5px"
                input-class="resize-none min-h-0" />
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.selected_roles') }}</span>
            <br />
            <Select v-model="selectedRoles" multiple>
                <SelectTrigger style="margin-top: 5px">
                    <SelectValue :placeholder="t('dialog.group_member_moderation.choose_roles_placeholder')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="role in groupMemberModeration.groupRef.roles" :key="role.id" :value="role.id">
                        {{ role.name }}
                    </SelectItem>
                </SelectContent>
            </Select>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.actions') }}</span>
            <br />
            <div class="flex gap-2">
                <Button
                    variant="outline"
                    :disabled="
                        Boolean(
                            !selectedRoles.length ||
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-roles-assign')
                        )
                    "
                    @click="groupMembersAddRoles"
                    >{{ t('dialog.group_member_moderation.add_roles') }}</Button
                >
                <Button
                    variant="secondary"
                    :disabled="
                        Boolean(
                            !selectedRoles.length ||
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-roles-assign')
                        )
                    "
                    @click="groupMembersRemoveRoles"
                    >{{ t('dialog.group_member_moderation.remove_roles') }}</Button
                >
                <Button
                    variant="outline"
                    :disabled="
                        Boolean(
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-members-manage')
                        )
                    "
                    @click="groupMembersSaveNote"
                    >{{ t('dialog.group_member_moderation.save_note') }}</Button
                >
                <Button
                    variant="outline"
                    :disabled="
                        Boolean(
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-members-remove')
                        )
                    "
                    @click="groupMembersKick"
                    >{{ t('dialog.group_member_moderation.kick') }}</Button
                >
                <Button
                    variant="outline"
                    :disabled="
                        Boolean(
                            progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                        )
                    "
                    @click="groupMembersBan"
                    >{{ t('dialog.group_member_moderation.ban') }}</Button
                >
                <Button
                    variant="outline"
                    :disabled="
                        Boolean(
                            progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                        )
                    "
                    @click="groupMembersUnban"
                    >{{ t('dialog.group_member_moderation.unban') }}</Button
                >
                <span v-if="progressCurrent" style="margin-top: 10px">
                    <Loader2 class="is-loading" style="margin-left: 5px; margin-right: 5px" />
                    {{ t('dialog.group_member_moderation.progress') }} {{ progressCurrent }}/{{ progressTotal }}
                </span>
                <Button
                    variant="secondary"
                    v-if="progressCurrent"
                    style="margin-left: 5px"
                    @click="progressTotal = 0"
                    >{{ t('dialog.group_member_moderation.cancel') }}</Button
                >
            </div>
        </div>
        <group-member-moderation-export-dialog
            v-model:isGroupLogsExportDialogVisible="isGroupLogsExportDialogVisible"
            :group-logs-moderation-table="groupLogsModerationTable" />
    </el-dialog>
</template>

<script setup>
    import { AlertTriangle, ArrowDown, Loader2, RefreshCw, Trash2, X } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { InputGroupField, InputGroupTextareaField } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
    import { debounce, hasGroupPermission, userImage, userImageFull } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useGalleryStore, useGroupStore, useUserStore } from '../../../stores';
    import { groupDialogFilterOptions, groupDialogSortingOptions } from '../../../shared/constants';
    import { groupRequest, userRequest } from '../../../api';
    import { Badge } from '../../ui/badge';
    import { DataTableLayout } from '../../ui/data-table';
    import { createColumns as createMembersColumns } from './groupMemberModerationMembersColumns.jsx';
    import { createColumns as createBansColumns } from './groupMemberModerationBansColumns.jsx';
    import { createColumns as createInvitesColumns } from './groupMemberModerationInvitesColumns.jsx';
    import { createColumns as createJoinRequestsColumns } from './groupMemberModerationJoinRequestsColumns.jsx';
    import { createColumns as createBlockedColumns } from './groupMemberModerationBlockedColumns.jsx';
    import { createColumns as createLogsColumns } from './groupMemberModerationLogsColumns.jsx';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    import GroupMemberModerationExportDialog from './GroupMemberModerationExportDialog.vue';

    import * as workerTimers from 'worker-timers';

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { randomUserColours } = storeToRefs(appearanceSettingsStore);
    const { showUserDialog } = useUserStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog, groupMemberModeration } = storeToRefs(useGroupStore());
    const { applyGroupMember, handleGroupMember, handleGroupMemberProps } = useGroupStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { t } = useI18n();
    const groupModerationTabs = computed(() => [
        { value: 'members', label: t('dialog.group_member_moderation.members') },
        {
            value: 'bans',
            label: t('dialog.group_member_moderation.bans'),
            disabled: !hasGroupPermission(groupMemberModeration.value?.groupRef, 'group-bans-manage')
        },
        {
            value: 'invites',
            label: t('dialog.group_member_moderation.invites'),
            disabled: !hasGroupPermission(groupMemberModeration.value?.groupRef, 'group-invites-manage')
        },
        {
            value: 'logs',
            label: t('dialog.group_member_moderation.logs'),
            disabled: !hasGroupPermission(groupMemberModeration.value?.groupRef, 'group-audit-view')
        }
    ]);
    const groupInvitesTabs = computed(() => [
        { value: 'sent', label: t('dialog.group_member_moderation.sent_invites') },
        { value: 'join', label: t('dialog.group_member_moderation.join_requests') },
        { value: 'blocked', label: t('dialog.group_member_moderation.blocked_requests') }
    ]);
    const selectedUsers = reactive({});
    const selectedUsersArray = ref([]);
    const isGroupMembersLoading = ref(false);
    const isGroupMembersDone = ref(false);
    const memberFilter = ref({
        id: null,
        name: 'dialog.group.members.filters.everyone'
    });
    const memberSortOrder = ref({
        id: '',
        name: 'dialog.group.members.sorting.joined_at_desc',
        value: 'joinedAt:desc'
    });
    const members = ref([]);
    const memberSearch = ref('');

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    let loadMoreGroupMembersParams = ref({
        n: 100,
        offset: 0,
        groupId: '',
        sort: 'joinedAt:desc',
        roleId: ''
    });

    function setSelectedUsers(usersId, user) {
        if (!user) {
            return;
        }
        selectedUsers[usersId] = user;
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    function deselectedUsers(userId, isAll = false) {
        if (isAll) {
            for (const id in selectedUsers) {
                if (Object.prototype.hasOwnProperty.call(selectedUsers, id)) {
                    delete selectedUsers[id];
                }
            }
        } else {
            if (Object.prototype.hasOwnProperty.call(selectedUsers, userId)) {
                delete selectedUsers[userId];
            }
        }
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    function groupMemberModerationTableSelectionChange(row) {
        if (row.$selected && !selectedUsers[row.userId]) {
            setSelectedUsers(row.userId, row);
        } else if (!row.$selected && selectedUsers[row.userId]) {
            deselectedUsers(row.userId);
        }
    }

    const groupInvitesModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });
    const groupJoinRequestsModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });
    const groupBlockedModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total'
        }
    });
    const groupLogsModerationTable = reactive({
        data: [],
        filters: [{ prop: ['description'], value: '' }],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });
    const groupBansModerationTable = reactive({
        data: [],
        filters: [{ prop: ['$displayName'], value: '' }],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });
    const groupMemberModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'small' },
        pageSize: 15,
        paginationProps: {
            layout: 'sizes,prev,pager,next,total'
        }
    });

    const rolesText = (roleIds) => {
        const ids = Array.isArray(roleIds) ? roleIds : [];
        const roles = groupMemberModeration.value?.groupRef?.roles ?? [];
        const names = [];
        for (const id of ids) {
            const role = roles.find((r) => r?.id === id);
            if (role?.name) {
                names.push(role.name);
            }
        }
        return names.join(', ');
    };

    const groupMemberModerationColumns = computed(() =>
        createMembersColumns({
            randomUserColours,
            rolesText,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange: groupMemberModerationTableSelectionChange
        })
    );

    const { table: groupMemberModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:members',
        data: computed(() => groupMemberModerationTable.data ?? []),
        columns: groupMemberModerationColumns,
        getRowId: (row) => String(row?.userId ?? ''),
        initialPagination: { pageIndex: 0, pageSize: groupMemberModerationTable.pageSize ?? 15 }
    });

    const groupMemberModerationTotalItems = computed(
        () => groupMemberModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const bansSearch = computed(() =>
        String(groupBansModerationTable.filters?.[0]?.value ?? '')
            .trim()
            .toLowerCase()
    );
    const groupBansFilteredRows = computed(() => {
        const rows = Array.isArray(groupBansModerationTable.data) ? groupBansModerationTable.data : [];
        const q = bansSearch.value;
        if (!q) {
            return rows;
        }
        return rows.filter((r) => {
            const name = (r?.$displayName ?? r?.user?.displayName ?? '').toString().toLowerCase();
            return name.includes(q);
        });
    });

    const groupBansModerationColumns = computed(() =>
        createBansColumns({
            randomUserColours,
            rolesText,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange: groupMemberModerationTableSelectionChange
        })
    );

    const { table: groupBansModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:bans',
        data: groupBansFilteredRows,
        columns: groupBansModerationColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: groupBansModerationTable.pageSize ?? 15 }
    });

    const groupBansModerationTotalItems = computed(
        () => groupBansModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const groupInvitesModerationColumns = computed(() =>
        createInvitesColumns({
            randomUserColours,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange: groupMemberModerationTableSelectionChange
        })
    );

    const { table: groupInvitesModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:invites',
        data: computed(() => groupInvitesModerationTable.data ?? []),
        columns: groupInvitesModerationColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: groupInvitesModerationTable.pageSize ?? 15 }
    });

    const groupInvitesModerationTotalItems = computed(
        () => groupInvitesModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const groupJoinRequestsModerationColumns = computed(() =>
        createJoinRequestsColumns({
            randomUserColours,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange: groupMemberModerationTableSelectionChange
        })
    );

    const { table: groupJoinRequestsModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:join-requests',
        data: computed(() => groupJoinRequestsModerationTable.data ?? []),
        columns: groupJoinRequestsModerationColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: groupJoinRequestsModerationTable.pageSize ?? 15 }
    });

    const groupJoinRequestsModerationTotalItems = computed(
        () => groupJoinRequestsModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const groupBlockedModerationColumns = computed(() =>
        createBlockedColumns({
            randomUserColours,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange: groupMemberModerationTableSelectionChange
        })
    );

    const { table: groupBlockedModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:blocked',
        data: computed(() => groupBlockedModerationTable.data ?? []),
        columns: groupBlockedModerationColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: groupBlockedModerationTable.pageSize ?? 15 }
    });

    const groupBlockedModerationTotalItems = computed(
        () => groupBlockedModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const logsSearch = computed(() =>
        String(groupLogsModerationTable.filters?.[0]?.value ?? '')
            .trim()
            .toLowerCase()
    );
    const groupLogsFilteredRows = computed(() => {
        const rows = Array.isArray(groupLogsModerationTable.data) ? groupLogsModerationTable.data : [];
        const q = logsSearch.value;
        if (!q) {
            return rows;
        }
        return rows.filter((r) => {
            const desc = (r?.description ?? '').toString().toLowerCase();
            return desc.includes(q);
        });
    });

    const groupLogsModerationColumns = computed(() =>
        createLogsColumns({
            onShowUser: showUserDialog
        })
    );

    const { table: groupLogsModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:logs',
        data: groupLogsFilteredRows,
        columns: groupLogsModerationColumns,
        getRowId: (row) => String(row?.id ?? `${row?.created_at ?? ''}:${row?.eventType ?? ''}`),
        initialPagination: { pageIndex: 0, pageSize: groupLogsModerationTable.pageSize ?? 15 }
    });

    const groupLogsModerationTotalItems = computed(
        () => groupLogsModerationTanstackTable.getFilteredRowModel().rows.length
    );

    function deselectGroupMember(userId) {
        const deselectInTable = (tableData) => {
            if (userId) {
                const row = tableData.find((item) => item.userId === userId);
                if (row) {
                    row.$selected = false;
                }
            } else {
                tableData.forEach((row) => {
                    if (row.$selected) {
                        row.$selected = false;
                    }
                });
            }
        };

        deselectInTable(groupMemberModerationTable.data);
        deselectInTable(groupBansModerationTable.data);
        deselectInTable(groupInvitesModerationTable.data);
        deselectInTable(groupJoinRequestsModerationTable.data);
        deselectInTable(groupBlockedModerationTable.data);
    }

    const selectUserId = ref('');
    const progressCurrent = ref(0);
    const progressTotal = ref(0);
    const selectedRoles = ref([]);
    const selectedAuditLogTypes = ref([]);
    const note = ref('');
    const isGroupLogsExportDialogVisible = ref(false);

    watch(
        () => groupMemberModeration.value.visible,
        (newVal) => {
            if (newVal) {
                groupMemberModerationTable.data = [];
                groupBansModerationTable.data = [];
                groupInvitesModerationTable.data = [];
                groupJoinRequestsModerationTable.data = [];
                groupBlockedModerationTable.data = [];
                groupLogsModerationTable.data = [];
                Object.assign(selectedUsers, {});
                selectedUsersArray.value = [];
                selectUserId.value = '';
                selectedRoles.value = [];
                note.value = '';

                if (groupMemberModeration.value.openWithUserId) {
                    addGroupMemberToSelection(groupMemberModeration.value.openWithUserId);
                }
            }
        }
    );

    function handleGroupMemberRoleChange(args) {
        if (groupDialog.value.id === args.params.groupId) {
            groupDialog.value.members.forEach((member) => {
                if (member.userId === args.params.userId) {
                    member.roleIds = args.json;
                    return true;
                }
            });
        }
    }

    async function groupMembersDeleteSentInvite() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) {
                break;
            }
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) {
                continue;
            }
            console.log(`Deleting group invite ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.deleteSentGroupInvite({
                    groupId: D.id,
                    userId: user.userId
                });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to delete group invites: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Deleted ${memberCount} group invites`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvites(D.id);
    }

    function selectAllGroupMembers() {
        groupMemberModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    async function getAllGroupBans(groupId) {
        groupBansModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        const fetchedBans = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupBans(params);
                if (args && args.json) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        continue;
                    }
                    args.json.forEach((json) => {
                        const ref = applyGroupMember(json);
                        fetchedBans.push(ref);
                    });
                    if (args.json.length < params.n) {
                        break;
                    }
                    params.offset += params.n;
                } else {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            groupBansModerationTable.data = fetchedBans;
        } catch {
            toast.error('Failed to get group bans');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    function selectAllGroupBans() {
        groupBansModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    async function groupMembersBan() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;
            console.log(`Banning ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.banGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to ban group member: ${err}`);
            }
        }
        toast.success(`Banned ${memberCount} group members`);
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupBans(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersUnban() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;
            console.log(`Unbanning ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.unbanGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to unban group member: ${err}`);
                allSuccess = false;
            }
        }

        if (allSuccess) {
            toast.success(`Unbanned ${memberCount} group members`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupBans(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersKick() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Kicking ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.kickGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to kick group member: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Kicked ${memberCount} group members`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
        loadAllGroupMembers();
    }

    async function groupMembersSaveNote() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        const noteToSave = note.value;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.managerNotes === noteToSave) {
                continue;
            }
            console.log(`Setting note ${noteToSave} for ${user.userId} ${i + 1}/${memberCount}`);
            try {
                const args = await groupRequest.setGroupMemberProps(user.userId, D.id, { managerNotes: noteToSave });
                handleGroupMemberProps(args);
            } catch (err) {
                console.error(err);
                toast.error(`Failed to set group member note for ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Saved notes for ${memberCount} group members`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    async function groupMembersRemoveRoles() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const rolesToRemoveSet = new Set(selectedRoles.value);
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            const currentRoles = new Set(user.roleIds || []);
            const rolesToRemoveForUser = [];
            rolesToRemoveSet.forEach((roleId) => {
                if (currentRoles.has(roleId)) {
                    rolesToRemoveForUser.push(roleId);
                }
            });

            if (!rolesToRemoveForUser.length) continue;

            for (const roleId of rolesToRemoveForUser) {
                console.log(`Removing role ${roleId} from ${user.userId} ${i + 1}/${memberCount}`);

                try {
                    const args = await groupRequest.removeGroupMemberRole({
                        groupId: D.id,
                        userId: user.userId,
                        roleId
                    });
                    handleGroupMemberRoleChange(args);
                } catch (err) {
                    console.error(err);
                    toast.error(`Failed to remove group member roles: ${err}`);
                    allSuccess = false;
                }
            }
            if (!groupMemberModeration.value.visible) {
                break;
            }
        }
        if (allSuccess) {
            toast.success(`Roles removed`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    async function groupMembersAddRoles() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const rolesToAddSet = new Set(selectedRoles.value);
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;

            const currentRoles = new Set(user.roleIds || []);
            const rolesToAddForUser = [];
            rolesToAddSet.forEach((roleId) => {
                if (!currentRoles.has(roleId)) {
                    rolesToAddForUser.push(roleId);
                }
            });

            if (!rolesToAddForUser.length) continue;

            for (const roleId of rolesToAddForUser) {
                console.log(`Adding role: ${roleId} to ${user.userId} ${i + 1}/${memberCount}`);
                try {
                    const args = await groupRequest.addGroupMemberRole({ groupId: D.id, userId: user.userId, roleId });
                    handleGroupMemberRoleChange(args);
                } catch (err) {
                    console.error(err);
                    toast.error(`Failed to add group member roles: ${err}`);
                    allSuccess = false;
                }
            }
            if (!groupMemberModeration.value.visible) {
                break;
            }
        }
        if (allSuccess) {
            toast.success(`Added group member roles`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    function deleteSelectedGroupMember(user) {
        deselectedUsers(user.userId);
        deselectGroupMember(user.userId);
    }

    function clearSelectedGroupMembers() {
        deselectedUsers(null, true);
        deselectGroupMember();
    }

    async function selectGroupMemberUserId() {
        const userIdInput = selectUserId.value;
        if (!userIdInput) return;

        const regexUserId = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match;
        const userIdList = new Set();
        while ((match = regexUserId.exec(userIdInput)) !== null) {
            userIdList.add(match[0]);
        }

        if (userIdList.size === 0) {
            // for those users missing the usr_ prefix
            userIdList.add(userIdInput);
        }
        const promises = [];
        userIdList.forEach((userId) => {
            promises.push(addGroupMemberToSelection(userId));
        });
        await Promise.allSettled(promises);
        selectUserId.value = '';
    }

    async function addGroupMemberToSelection(userId) {
        const D = groupMemberModeration.value;
        // fetch member if there is one
        // banned members don't have a user object
        let member = {};
        const memberArgs = await groupRequest.getGroupMember({ groupId: D.id, userId });
        if (memberArgs && memberArgs.json) {
            member = applyGroupMember(memberArgs.json);
        }
        if (member && member.user) {
            setSelectedUsers(member.userId, member);
            return;
        }
        const userArgs = await userRequest.getCachedUser({
            userId
        });
        member.userId = userArgs.json.id;
        member.user = userArgs.json;
        member.displayName = userArgs.json.displayName;
        setSelectedUsers(member.userId, member);
    }

    async function getAllGroupLogs(groupId) {
        groupLogsModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        if (selectedAuditLogTypes.value.length) {
            params.eventTypes = selectedAuditLogTypes.value;
        }
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupLogs(params);
                if (args) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        continue;
                    }

                    for (const json of args.json.results) {
                        const existsInData = newData.some((dataItem) => dataItem.id === json.id);
                        if (!existsInData) {
                            newData.push(json);
                        }
                    }
                }
                params.offset += params.n;
                if (!args.json.hasNext) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            groupLogsModerationTable.data = newData;
        } catch {
            toast.error('Failed to get group logs');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function groupMembersDeleteBlockedRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;

        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;

            if (user.userId === currentUser.value.id) {
                continue;
            }

            console.log(`Deleting blocked group request for ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.deleteBlockedGroupRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to delete blocked group requests: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Deleted ${memberCount} blocked group requests`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersBlockJoinRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Blocking group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.blockGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to block group join requests: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Blocked ${memberCount} group join requests`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersRejectInviteRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;

        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Rejecting group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.rejectGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to reject group join requests: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Rejected ${memberCount} group join requests`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersAcceptInviteRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Accepting group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.acceptGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                toast.error(`Failed to accept group join requests: ${err}`);
                allSuccess = false;
            }
        }
        if (allSuccess) {
            toast.success(`Accepted ${memberCount} group join requests`);
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function getAllGroupInvitesAndJoinRequests(groupId) {
        try {
            await Promise.all([
                getAllGroupInvites(groupId),
                getAllGroupJoinRequests(groupId),
                getAllGroupBlockedRequests(groupId)
            ]);
        } catch (error) {
            console.error('Error fetching group invites/requests:', error);
        }
    }

    async function getAllGroupBlockedRequests(groupId) {
        groupBlockedModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: true };
        const count = 50; // 5000
        isGroupMembersLoading.value = true;
        let newData = [];

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    newData.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            groupBlockedModerationTable.data = newData;
        } catch {
            toast.error('Failed to get group join requests');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function getAllGroupJoinRequests(groupId) {
        groupJoinRequestsModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: false };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    newData.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            groupJoinRequestsModerationTable.data = newData;
        } catch {
            toast.error('Failed to get group join requests');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function getAllGroupInvites(groupId) {
        groupInvitesModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        let newData = [];

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupInvites(params);
                if (args) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        return;
                    }
                    for (const json of args.json) {
                        const ref = applyGroupMember(json);
                        newData.push(ref);
                    }
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
            groupInvitesModerationTable.data = newData;
        } catch {
            toast.error('Failed to get group invites');
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    function selectAllGroupInvites() {
        groupInvitesModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function selectAllGroupJoinRequests() {
        groupJoinRequestsModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function selectAllGroupBlocked() {
        groupBlockedModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function showGroupLogsExportDialog() {
        isGroupLogsExportDialogVisible.value = true;
    }

    function getAuditLogTypeName(auditLogType) {
        if (!auditLogType) return '';
        return auditLogType
            .replace('group.', '')
            .replace(/\./g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    function groupMembersSearch() {
        if (memberSearch.value.length < 3) {
            groupMemberModerationTable.data = [];
            isGroupMembersLoading.value = false;
            return;
        }
        isGroupMembersLoading.value = true;
        debounce(groupMembersSearchDebounced, 200)();
    }

    function groupMembersSearchDebounced() {
        const groupId = groupMemberModeration.value.id;
        const search = memberSearch.value;
        groupMemberModerationTable.data = [];
        if (memberSearch.value.length < 3) {
            return;
        }
        isGroupMembersLoading.value = true;
        groupRequest
            .getGroupMembersSearch({
                groupId,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                for (const json of args.json.results) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                if (groupId === args.params.groupId) {
                    groupMemberModerationTable.data = args.json.results.map((member) => ({
                        ...member,
                        $selected: Boolean(selectedUsers[member.userId])
                    }));
                }
            })
            .finally(() => {
                isGroupMembersLoading.value = false;
            });
    }

    async function getGroupMembers() {
        members.value = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams.value = {
            sort: 'joinedAt:desc',
            roleId: '',
            n: 100,
            offset: 0,
            groupId: groupMemberModeration.value.id
        };
        if (memberSortOrder.value.value) {
            loadMoreGroupMembersParams.value.sort = memberSortOrder.value.value;
        }
        if (memberFilter.value.id !== null) {
            loadMoreGroupMembersParams.value.roleId = memberFilter.value.id;
        }
        await groupRequest
            .getGroupMember({
                groupId: groupMemberModeration.value.id,
                userId: currentUser.value.id
            })
            .then((args) => {
                args.ref = applyGroupMember(args.json);
                if (args.json) {
                    args.json.user = currentUser.value;
                    if (memberFilter.value.id === null) {
                        // when filtered by role don't include self
                        members.value.push(args.json);
                    }
                }
                return args;
            });
        await loadMoreGroupMembers();
    }

    async function loadMoreGroupMembers() {
        if (isGroupMembersDone.value || isGroupMembersLoading.value) {
            return;
        }
        const params = loadMoreGroupMembersParams.value;
        if (params.roleId === '') {
            delete params.roleId;
        }
        memberSearch.value = '';
        isGroupMembersLoading.value = true;
        await groupRequest
            .getGroupMembers(params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (const json of args.json) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === currentUser.value.id) {
                        if (members.value.length > 0 && members.value[0].userId === currentUser.value.id) {
                            // remove duplicate and keep sort order
                            members.value.splice(0, 1);
                        }
                        break;
                    }
                }
                if (args.json.length < params.n) {
                    isGroupMembersDone.value = true;
                }
                members.value = [...members.value, ...args.json];
                groupMemberModerationTable.data = members.value.map((member) => ({
                    ...member,
                    $selected: Boolean(selectedUsers[member.userId])
                }));

                params.offset += params.n;
                return args;
            })
            .catch((err) => {
                isGroupMembersDone.value = true;
                throw err;
            });
    }

    async function setGroupMemberSortOrder(sortOrder) {
        if (memberSortOrder.value === sortOrder) {
            return;
        }
        memberSortOrder.value = sortOrder;
        await getGroupMembers();
    }

    async function loadAllGroupMembers() {
        if (isGroupMembersLoading.value) {
            return;
        }
        await getGroupMembers();
        while (groupMemberModeration.value.visible && !isGroupMembersDone.value) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await loadMoreGroupMembers();
        }
    }

    async function setGroupMemberFilter(filter) {
        if (memberFilter.value === filter) {
            return;
        }
        memberFilter.value = filter;
        await getGroupMembers();
    }
</script>
