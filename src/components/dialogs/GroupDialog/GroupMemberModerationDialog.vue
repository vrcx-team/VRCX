<template>
    <Dialog v-model:open="groupMemberModeration.visible">
        <DialogContent class="x-dialog max-w-none sm:min-w-[90vw] sm:max-w-[90vw] sm:min-h-[90vh] sm:max-h-[90vh]">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group_member_moderation.header') }}</DialogTitle>
            </DialogHeader>

            <div>
                <h3>{{ groupMemberModeration.groupRef.name }}</h3>
                <TabsUnderline default-value="members" :items="groupModerationTabs" :unmount-on-hide="false">
                    <template #members>
                        <div class="mt-2">
                            <Button
                                class="rounded-full"
                                variant="outline"
                                size="icon-sm"
                                :disabled="isGroupMembersLoading"
                                @click="loadAllGroupMembers">
                                <Spinner v-if="isGroupMembersLoading" />
                                <RefreshCw v-else />
                            </Button>
                            <span class="ml-1.5 mr-1.5" style="font-size: 14px">
                                {{ groupMemberModerationTable.data.length }}/{{
                                    groupMemberModeration.groupRef.memberCount
                                }}
                            </span>
                            <div class="mt-1.5" style="float: right">
                                <span class="mr-1.5">{{ t('dialog.group.members.sort_by') }}</span>
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
                                                    !hasGroupPermission(
                                                        groupMemberModeration.groupRef,
                                                        'group-bans-manage'
                                                    )
                                                )
                                            "
                                            @click.stop>
                                            {{ t(memberSortOrder.name) }}
                                            <ArrowDown class="ml-1.5" />
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
                                <span class="ml-2 mr-1.5">{{ t('dialog.group.members.filter') }}</span>
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
                                                    !hasGroupPermission(
                                                        groupMemberModeration.groupRef,
                                                        'group-bans-manage'
                                                    )
                                                )
                                            "
                                            @click.stop>
                                            {{ t(memberFilter.name) }}
                                            <ArrowDown class="ml-1.5" />
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
                                            <DropdownMenuItem
                                                v-if="!role.defaultRole"
                                                @click="setGroupMemberFilter(role)">
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
                                style="margin-top: 8px; margin-bottom: 8px"
                                @input="groupMembersSearch" />
                            <Button size="sm" variant="outline" @click="selectAll(groupMemberModerationTable.data)">{{
                                t('dialog.group_member_moderation.select_all')
                            }}</Button>
                            <DataTableLayout
                                v-if="groupMemberModerationTable.data.length"
                                style="margin-top: 8px"
                                :table="groupMemberModerationTanstackTable"
                                :loading="isGroupMembersLoading"
                                :page-sizes="pageSizes"
                                :total-items="groupMemberModerationTotalItems" />
                        </div>
                    </template>

                    <template #bans>
                        <div style="margin-top: 8px">
                            <div class="flex justify-between">
                                <div class="flex gap-2 items-center">
                                    <Button
                                        class="rounded-full"
                                        variant="outline"
                                        size="icon-sm"
                                        :disabled="isGroupMembersLoading"
                                        @click="getAllGroupBans(groupMemberModeration.id)">
                                        <Spinner v-if="isGroupMembersLoading" />
                                        <RefreshCw v-else />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        @click="selectAll(groupBansModerationTable.data)"
                                        >{{ t('dialog.group_member_moderation.select_all') }}</Button
                                    >
                                    <span style="font-size: 14px; margin-left: 6px; margin-right: 6px">{{
                                        groupBansModerationTable.data.length
                                    }}</span>
                                </div>

                                <div class="flex gap-2 items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        :disabled="!groupBansModerationTable.data.length"
                                        @click="showGroupBansExportDialog"
                                        >{{ t('dialog.group_member_moderation.export_bans') }}</Button
                                    >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        :disabled="
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                        "
                                        @click="showGroupBansImportDialog"
                                        >{{ t('dialog.group_member_moderation.import_bans') }}</Button
                                    >
                                    <InputGroupField
                                        v-model="groupBansModerationTable.filters[0].value"
                                        clearable
                                        size="sm"
                                        class="w-80"
                                        :placeholder="t('dialog.group.members.search')" />
                                </div>
                            </div>

                            <DataTableLayout
                                style="margin-top: 8px"
                                :table="groupBansModerationTanstackTable"
                                :loading="isGroupMembersLoading"
                                :page-sizes="pageSizes"
                                :total-items="groupBansModerationTotalItems" />
                        </div>
                    </template>

                    <template #invites>
                        <div style="margin-top: 8px">
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
                                    <span class="text-muted-foreground" style="font-size: 12px; margin-left: 6px">{{
                                        groupInvitesModerationTable.data.length
                                    }}</span>
                                </template>
                                <template #label-join>
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        t('dialog.group_member_moderation.join_requests')
                                    }}</span>
                                    <span class="text-muted-foreground" style="font-size: 12px; margin-left: 6px">{{
                                        groupJoinRequestsModerationTable.data.length
                                    }}</span>
                                </template>
                                <template #label-blocked>
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        t('dialog.group_member_moderation.blocked_requests')
                                    }}</span>
                                    <span class="text-muted-foreground" style="font-size: 12px; margin-left: 6px">{{
                                        groupBlockedModerationTable.data.length
                                    }}</span>
                                </template>
                                <template #sent>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        @click="selectAll(groupInvitesModerationTable.data)"
                                        >{{ t('dialog.group_member_moderation.select_all') }}</Button
                                    >
                                    <DataTableLayout
                                        style="margin-top: 8px"
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
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                            )
                                        "
                                        @click="handleDeleteSentInvite"
                                        >{{ t('dialog.group_member_moderation.delete_sent_invite') }}</Button
                                    >
                                </template>

                                <template #join>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        @click="selectAll(groupJoinRequestsModerationTable.data)"
                                        >{{ t('dialog.group_member_moderation.select_all') }}</Button
                                    >
                                    <DataTableLayout
                                        style="margin-top: 8px"
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
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                            )
                                        "
                                        class="mr-2"
                                        @click="handleAcceptInviteRequest"
                                        >{{ t('dialog.group_member_moderation.accept_join_requests') }}</Button
                                    >
                                    <Button
                                        variant="outline"
                                        :disabled="
                                            Boolean(
                                                progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                            )
                                        "
                                        class="mr-2"
                                        @click="handleRejectInviteRequest"
                                        >{{ t('dialog.group_member_moderation.reject_join_requests') }}</Button
                                    >
                                    <Button
                                        variant="outline"
                                        :disabled="
                                            Boolean(
                                                progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                            )
                                        "
                                        @click="handleBlockJoinRequest"
                                        >{{ t('dialog.group_member_moderation.block_join_requests') }}</Button
                                    >
                                </template>

                                <template #blocked>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        @click="selectAll(groupBlockedModerationTable.data)"
                                        >{{ t('dialog.group_member_moderation.select_all') }}</Button
                                    >
                                    <DataTableLayout
                                        style="margin-top: 8px"
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
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                            )
                                        "
                                        @click="handleDeleteBlockedRequest"
                                        >{{ t('dialog.group_member_moderation.delete_blocked_requests') }}</Button
                                    >
                                </template>
                            </TabsUnderline>
                        </div>
                    </template>

                    <template #logs>
                        <div style="margin-top: 8px">
                            <Button
                                class="rounded-full"
                                variant="outline"
                                size="icon-sm"
                                :disabled="isGroupMembersLoading"
                                @click="getAllGroupLogs(groupMemberModeration.id)">
                                <Spinner v-if="isGroupMembersLoading" />
                                <RefreshCw v-else />
                            </Button>
                            <span style="font-size: 14px; margin-left: 6px; margin-right: 6px">{{
                                groupLogsModerationTable.data.length
                            }}</span>
                            <br />
                            <div style="display: flex; justify-content: space-between; align-items: center">
                                <div>
                                    <Select v-model="selectedAuditLogTypes" multiple>
                                        <SelectTrigger style="margin: 8px 0; width: 250px">
                                            <SelectValue
                                                :placeholder="t('dialog.group_member_moderation.filter_type')" />
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
                                style="margin-top: 8px; margin-bottom: 8px" />
                            <br />
                            <DataTableLayout
                                style="margin-top: 8px"
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
                    style="margin-top: 6px"
                    :placeholder="t('dialog.group_member_moderation.user_id_placeholder')"
                    clearable />
                <Button
                    size="sm"
                    variant="outline"
                    style="margin-top: 8px"
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
                    style="margin-left: 6px"
                    @click="clearAllSelected">
                    <Trash2
                /></Button>
                <br />
                <Badge
                    v-for="user in selectedUsersArray"
                    :key="user.id"
                    variant="outline"
                    style="margin-right: 6px; margin-top: 6px">
                    <TooltipWrapper v-if="user.membershipStatus !== 'member'" side="top">
                        <template #content>
                            <span>{{ t('dialog.group_member_moderation.user_isnt_in_group') }}</span>
                        </template>
                        <AlertTriangle style="margin-left: 3px; display: inline-block" />
                    </TooltipWrapper>
                    <span
                        v-text="user.user?.displayName || user.userId"
                        style="font-weight: bold; margin-left: 6px"></span>
                    <button
                        type="button"
                        style="
                            margin-left: 8px;
                            border: none;
                            background: transparent;
                            padding: 0;
                            display: inline-flex;
                            align-items: center;
                            color: inherit;
                            cursor: pointer;
                        "
                        @click="deleteSelectedUser(user)">
                        <X class="h-3 w-3" />
                    </button>
                </Badge>
                <br />
                <br />
                <span class="name">{{ t('dialog.group_member_moderation.notes') }}</span>
                <InputGroupTextareaField
                    v-model="note"
                    class="text-xs"
                    :rows="2"
                    :placeholder="t('dialog.group_member_moderation.note_placeholder')"
                    style="margin-top: 6px"
                    input-class="resize-none min-h-0" />
                <br />
                <br />
                <span class="name">{{ t('dialog.group_member_moderation.selected_roles') }}</span>
                <br />
                <Select v-model="selectedRoles" multiple>
                    <SelectTrigger style="margin-top: 6px">
                        <SelectValue :placeholder="t('dialog.group_member_moderation.choose_roles_placeholder')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="role in groupMemberModeration.groupRef.roles"
                            :key="role.id"
                            :value="role.id">
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
                        @click="handleAddRoles"
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
                        @click="handleRemoveRoles"
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
                        @click="handleSaveNote"
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
                        @click="handleKick"
                        >{{ t('dialog.group_member_moderation.kick') }}</Button
                    >
                    <Button
                        variant="outline"
                        :disabled="
                            Boolean(
                                progressCurrent ||
                                !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                            )
                        "
                        @click="handleBan"
                        >{{ t('dialog.group_member_moderation.ban') }}</Button
                    >
                    <Button
                        variant="outline"
                        :disabled="
                            Boolean(
                                progressCurrent ||
                                !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                            )
                        "
                        @click="handleUnban"
                        >{{ t('dialog.group_member_moderation.unban') }}</Button
                    >
                    <span v-if="progressCurrent" style="margin-top: 8px">
                        <Spinner class="inline-block ml-2 mr-2" />
                        {{ t('dialog.group_member_moderation.progress') }} {{ progressCurrent }}/{{ progressTotal }}
                    </span>
                    <Button
                        variant="secondary"
                        v-if="progressCurrent"
                        style="margin-left: 6px"
                        @click="progressTotal = 0"
                        >{{ t('dialog.group_member_moderation.cancel') }}</Button
                    >
                </div>
            </div>

            <group-member-moderation-export-dialog
                v-model:isGroupLogsExportDialogVisible="isGroupLogsExportDialogVisible"
                :group-logs-moderation-table="groupLogsModerationTable" />

            <group-member-moderation-ban-export-dialog
                v-model:isGroupBansExportDialogVisible="isGroupBansExportDialogVisible"
                :group-bans-moderation-table="groupBansModerationTable" />

            <group-member-moderation-ban-import-dialog
                v-model:isGroupBansImportDialogVisible="isGroupBansImportDialogVisible"
                :group-id="groupMemberModeration.id"
                @imported="getAllGroupBans(groupMemberModeration.id)" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { AlertTriangle, ArrowDown, RefreshCw, Trash2, X } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    import { getAuditLogTypeName, resolveRoleNames } from './groupModerationUtils';
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
    import { useGroupBatchOperations } from './useGroupBatchOperations';
    import { useGroupModerationSelection } from './useGroupModerationSelection';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    import GroupMemberModerationBanExportDialog from './GroupMemberModerationBanExportDialog.vue';
    import GroupMemberModerationBanImportDialog from './GroupMemberModerationBanImportDialog.vue';
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

    const groupMemberModerationTable = reactive({
        data: [],
        pageSize: 15
    });
    const groupBansModerationTable = reactive({
        data: [],
        filters: [{ prop: ['$displayName'], value: '' }],
        pageSize: 15
    });
    const groupInvitesModerationTable = reactive({
        data: [],
        pageSize: 15
    });
    const groupJoinRequestsModerationTable = reactive({
        data: [],
        pageSize: 15
    });
    const groupBlockedModerationTable = reactive({
        data: [],
        pageSize: 15
    });
    const groupLogsModerationTable = reactive({
        data: [],
        filters: [{ prop: ['description'], value: '' }],
        pageSize: 15
    });

    const {
        selectedUsers,
        selectedUsersArray,
        setSelectedUsers,
        deselectedUsers,
        onSelectionChange,
        deselectInTables,
        deleteSelectedUser,
        clearAllSelected,
        selectAll
    } = useGroupModerationSelection({
        members: groupMemberModerationTable,
        bans: groupBansModerationTable,
        invites: groupInvitesModerationTable,
        joinRequests: groupJoinRequestsModerationTable,
        blocked: groupBlockedModerationTable
    });

    const rolesText = (roleIds) => resolveRoleNames(roleIds, groupMemberModeration.value?.groupRef?.roles ?? []);

    const groupMemberModerationColumns = computed(() =>
        createMembersColumns({
            randomUserColours,
            rolesText,
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onSelectionChange
        })
    );

    const { table: groupMemberModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:members',
        get data() {
            return computed(() => groupMemberModerationTable.data).value;
        },
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
            onSelectionChange
        })
    );

    const { table: groupBansModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:bans',
        get data() {
            return groupBansFilteredRows.value;
        },
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
            onSelectionChange
        })
    );

    const { table: groupInvitesModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:invites',
        get data() {
            return computed(() => groupInvitesModerationTable.data).value;
        },
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
            onSelectionChange
        })
    );

    const { table: groupJoinRequestsModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:join-requests',
        get data() {
            return computed(() => groupJoinRequestsModerationTable.data).value;
        },
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
            onSelectionChange
        })
    );

    const { table: groupBlockedModerationTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:blocked',
        get data() {
            return computed(() => groupBlockedModerationTable.data).value;
        },
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
        get data() {
            return groupLogsFilteredRows.value;
        },
        columns: groupLogsModerationColumns,
        getRowId: (row) => String(row?.id ?? `${row?.created_at ?? ''}:${row?.eventType ?? ''}`),
        initialPagination: { pageIndex: 0, pageSize: groupLogsModerationTable.pageSize ?? 15 }
    });

    const groupLogsModerationTotalItems = computed(
        () => groupLogsModerationTanstackTable.getFilteredRowModel().rows.length
    );

    const selectUserId = ref('');
    const selectedRoles = ref([]);
    const selectedAuditLogTypes = ref([]);
    const note = ref('');
    const isGroupLogsExportDialogVisible = ref(false);
    const isGroupBansExportDialogVisible = ref(false);
    const isGroupBansImportDialogVisible = ref(false);

    /**
     *
     * @param args
     */
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

    const {
        progressCurrent,
        progressTotal,
        groupMembersBan,
        groupMembersUnban,
        groupMembersKick,
        groupMembersSaveNote,
        groupMembersRemoveRoles,
        groupMembersAddRoles,
        groupMembersDeleteSentInvite,
        groupMembersAcceptInviteRequest,
        groupMembersRejectInviteRequest,
        groupMembersBlockJoinRequest,
        groupMembersDeleteBlockedRequest
    } = useGroupBatchOperations({
        selectedUsersArray,
        currentUser,
        groupMemberModeration,
        deselectedUsers,
        groupRequest,
        handleGroupMemberRoleChange,
        handleGroupMemberProps
    });

    // Thin wrappers for template event handlers that require arguments
    /**
     *
     */
    function handleBan() {
        groupMembersBan({ onComplete: () => getAllGroupBans(groupMemberModeration.value.id) });
    }
    /**
     *
     */
    function handleUnban() {
        groupMembersUnban({ onComplete: () => getAllGroupBans(groupMemberModeration.value.id) });
    }
    /**
     *
     */
    function handleKick() {
        groupMembersKick({ onComplete: () => loadAllGroupMembers() });
    }
    /**
     *
     */
    function handleSaveNote() {
        groupMembersSaveNote(note.value);
    }
    /**
     *
     */
    function handleAddRoles() {
        groupMembersAddRoles(selectedRoles.value);
    }
    /**
     *
     */
    function handleRemoveRoles() {
        groupMembersRemoveRoles(selectedRoles.value);
    }
    /**
     *
     */
    function handleDeleteSentInvite() {
        groupMembersDeleteSentInvite({ onComplete: () => getAllGroupInvites(groupMemberModeration.value.id) });
    }
    /**
     *
     */
    function handleAcceptInviteRequest() {
        groupMembersAcceptInviteRequest({
            onComplete: () => getAllGroupInvitesAndJoinRequests(groupMemberModeration.value.id)
        });
    }
    /**
     *
     */
    function handleRejectInviteRequest() {
        groupMembersRejectInviteRequest({
            onComplete: () => getAllGroupInvitesAndJoinRequests(groupMemberModeration.value.id)
        });
    }
    /**
     *
     */
    function handleBlockJoinRequest() {
        groupMembersBlockJoinRequest({
            onComplete: () => getAllGroupInvitesAndJoinRequests(groupMemberModeration.value.id)
        });
    }
    /**
     *
     */
    function handleDeleteBlockedRequest() {
        groupMembersDeleteBlockedRequest({
            onComplete: () => getAllGroupInvitesAndJoinRequests(groupMemberModeration.value.id)
        });
    }

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
                clearAllSelected();
                selectUserId.value = '';
                selectedRoles.value = [];
                note.value = '';

                if (groupMemberModeration.value.openWithUserId) {
                    addGroupMemberToSelection(groupMemberModeration.value.openWithUserId);
                }
            }
        }
    );

    /**
     *
     * @param groupId
     */
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

    /**
     *
     */
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

    /**
     *
     * @param userId
     */
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

    /**
     *
     * @param groupId
     */
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

    /**
     *
     * @param groupId
     */
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

    /**
     *
     * @param groupId
     */
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

    /**
     *
     * @param groupId
     */
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

    /**
     *
     * @param groupId
     */
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

    /**
     *
     */
    function showGroupLogsExportDialog() {
        isGroupLogsExportDialogVisible.value = true;
    }

    /**
     *
     */
    function showGroupBansExportDialog() {
        isGroupBansExportDialogVisible.value = true;
    }

    /**
     *
     */
    function showGroupBansImportDialog() {
        isGroupBansImportDialogVisible.value = true;
    }

    /**
     *
     */
    function groupMembersSearch() {
        if (memberSearch.value.length < 3) {
            groupMemberModerationTable.data = [];
            isGroupMembersLoading.value = false;
            return;
        }
        isGroupMembersLoading.value = true;
        debounce(groupMembersSearchDebounced, 200)();
    }

    /**
     *
     */
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

    /**
     *
     */
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

    /**
     *
     */
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

    /**
     *
     * @param sortOrder
     */
    async function setGroupMemberSortOrder(sortOrder) {
        if (memberSortOrder.value === sortOrder) {
            return;
        }
        memberSortOrder.value = sortOrder;
        await getGroupMembers();
    }

    /**
     *
     */
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

    /**
     *
     * @param filter
     */
    async function setGroupMemberFilter(filter) {
        if (memberFilter.value === filter) {
            return;
        }
        memberFilter.value = filter;
        await getGroupMembers();
    }
</script>
