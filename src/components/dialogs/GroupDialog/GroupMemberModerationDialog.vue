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
                        <GroupModerationMembersTab
                            :loading="isGroupMembersLoading"
                            :table-data="tables.members"
                            :group-ref="groupMemberModeration.groupRef"
                            :member-sort-order="memberSortOrder"
                            :member-filter="memberFilter"
                            :member-search="memberSearch"
                            :sorting-options="groupDialogSortingOptions"
                            :filter-options="groupDialogFilterOptions"
                            :page-sizes="pageSizes"
                            :column-context="membersColumnContext"
                            @refresh="loadAllGroupMembers"
                            @update:member-search="memberSearch = $event"
                            @search="groupMembersSearch"
                            @sort-change="setGroupMemberSortOrder"
                            @filter-change="setGroupMemberFilter"
                            @select-all="selectAll" />
                    </template>

                    <template #bans>
                        <GroupModerationBansTab
                            :loading="isGroupMembersLoading"
                            :table-data="tables.bans"
                            :group-ref="groupMemberModeration.groupRef"
                            :page-sizes="pageSizes"
                            :column-context="bansColumnContext"
                            @refresh="getAllGroupBans(groupMemberModeration.id)"
                            @select-all="selectAll"
                            @export="isGroupBansExportDialogVisible = true"
                            @import="isGroupBansImportDialogVisible = true" />
                    </template>

                    <template #invites>
                        <GroupModerationInvitesTab
                            :loading="isGroupMembersLoading"
                            :invites-table="tables.invites"
                            :join-requests-table="tables.joinRequests"
                            :blocked-table="tables.blocked"
                            :group-ref="groupMemberModeration.groupRef"
                            :progress-current="progressCurrent"
                            :page-sizes="pageSizes"
                            :column-context="invitesColumnContext"
                            @refresh="getAllGroupInvitesAndJoinRequests(groupMemberModeration.id)"
                            @select-all="selectAll"
                            @delete-sent-invite="handleDeleteSentInvite"
                            @accept-invite-request="handleAcceptInviteRequest"
                            @reject-invite-request="handleRejectInviteRequest"
                            @block-join-request="handleBlockJoinRequest"
                            @delete-blocked-request="handleDeleteBlockedRequest" />
                    </template>

                    <template #logs>
                        <GroupModerationLogsTab
                            ref="logsTabRef"
                            :loading="isGroupMembersLoading"
                            :table-data="tables.logs"
                            :audit-log-types="groupMemberModeration.auditLogTypes"
                            :page-sizes="pageSizes"
                            :column-context="logsColumnContext"
                            @refresh="handleLogsRefresh"
                            @export="isGroupLogsExportDialogVisible = true" />
                    </template>
                </TabsUnderline>

                <br />
                <br />
                <GroupModerationBulkActions
                    :select-user-id="selectUserId"
                    :selected-users-array="selectedUsersArray"
                    :selected-roles="selectedRoles"
                    :note="note"
                    :progress-current="progressCurrent"
                    :progress-total="progressTotal"
                    :group-ref="groupMemberModeration.groupRef"
                    @update:select-user-id="selectUserId = $event"
                    @update:note="note = $event"
                    @update:selected-roles="selectedRoles = $event"
                    @select-user="handleSelectUser"
                    @clear-all="clearAllSelected"
                    @delete-user="deleteSelectedUser"
                    @add-roles="handleAddRoles"
                    @remove-roles="handleRemoveRoles"
                    @save-note="handleSaveNote"
                    @kick="handleKick"
                    @ban="handleBan"
                    @unban="handleUnban"
                    @cancel-progress="progressTotal = 0" />
            </div>

            <group-member-moderation-export-dialog
                v-model:isGroupLogsExportDialogVisible="isGroupLogsExportDialogVisible"
                :group-logs-moderation-table="tables.logs" />

            <group-member-moderation-ban-export-dialog
                v-model:isGroupBansExportDialogVisible="isGroupBansExportDialogVisible"
                :group-bans-moderation-table="tables.bans" />

            <group-member-moderation-ban-import-dialog
                v-model:isGroupBansImportDialogVisible="isGroupBansImportDialogVisible"
                :group-id="groupMemberModeration.id"
                @imported="getAllGroupBans(groupMemberModeration.id)" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, reactive, ref, watch } from 'vue';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useGalleryStore, useGroupStore, useUserStore } from '../../../stores';
    import {
        applyGroupMember,
        handleGroupMember,
        handleGroupMemberProps
    } from '../../../coordinators/groupCoordinator';
    import { hasGroupPermission } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { groupDialogFilterOptions, groupDialogSortingOptions } from '../../../shared/constants';
    import { groupRequest, userRequest } from '../../../api';
    import { resolveRoleNames } from './groupModerationUtils';
    import { useGroupBatchOperations } from './useGroupBatchOperations';
    import { useGroupModerationData } from './useGroupModerationData';
    import { useGroupModerationSelection } from './useGroupModerationSelection';

    import GroupMemberModerationBanExportDialog from './GroupMemberModerationBanExportDialog.vue';
    import GroupMemberModerationBanImportDialog from './GroupMemberModerationBanImportDialog.vue';
    import GroupMemberModerationExportDialog from './GroupMemberModerationExportDialog.vue';
    import GroupModerationBansTab from './GroupModerationBansTab.vue';
    import GroupModerationBulkActions from './GroupModerationBulkActions.vue';
    import GroupModerationInvitesTab from './GroupModerationInvitesTab.vue';
    import GroupModerationLogsTab from './GroupModerationLogsTab.vue';
    import GroupModerationMembersTab from './GroupModerationMembersTab.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    // ── Stores ───────────────────────────────────────────────────
    const { userImage, userImageFull } = useUserDisplay();
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { randomUserColours } = storeToRefs(appearanceSettingsStore);

    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog, groupMemberModeration } = storeToRefs(useGroupStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { t } = useI18n();

    // ── Tab definitions ──────────────────────────────────────────
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

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);

    // ── Table data ───────────────────────────────────────────────
    const tables = {
        members: reactive({ data: [], pageSize: 15 }),
        bans: reactive({ data: [], filters: [{ prop: ['$displayName'], value: '' }], pageSize: 15 }),
        invites: reactive({ data: [], pageSize: 15 }),
        joinRequests: reactive({ data: [], pageSize: 15 }),
        blocked: reactive({ data: [], pageSize: 15 }),
        logs: reactive({ data: [], filters: [{ prop: ['description'], value: '' }], pageSize: 15 })
    };

    // ── Selection ────────────────────────────────────────────────
    const {
        selectedUsers,
        selectedUsersArray,
        setSelectedUsers,
        deselectedUsers,
        onSelectionChange,
        deleteSelectedUser,
        clearAllSelected,
        selectAll
    } = useGroupModerationSelection({
        members: tables.members,
        bans: tables.bans,
        invites: tables.invites,
        joinRequests: tables.joinRequests,
        blocked: tables.blocked
    });

    // ── Column contexts ──────────────────────────────────────────
    const rolesText = (roleIds) => resolveRoleNames(roleIds, groupMemberModeration.value?.groupRef?.roles ?? []);

    const membersColumnContext = computed(() => ({
        randomUserColours,
        rolesText,
        userImage,
        userImageFull,
        onShowFullscreenImage: showFullscreenImageDialog,
        onShowUser: showUserDialog,
        onSelectionChange
    }));

    const bansColumnContext = computed(() => ({
        randomUserColours,
        rolesText,
        userImage,
        userImageFull,
        onShowFullscreenImage: showFullscreenImageDialog,
        onShowUser: showUserDialog,
        onSelectionChange
    }));

    const invitesColumnContext = computed(() => ({
        randomUserColours,
        userImage,
        userImageFull,
        onShowFullscreenImage: showFullscreenImageDialog,
        onShowUser: showUserDialog,
        onSelectionChange
    }));

    const logsColumnContext = computed(() => ({
        onShowUser: showUserDialog
    }));

    // ── Data fetching ────────────────────────────────────────────
    const {
        isGroupMembersLoading,
        memberFilter,
        memberSortOrder,
        memberSearch,
        loadAllGroupMembers,
        setGroupMemberSortOrder,
        setGroupMemberFilter,
        groupMembersSearch,
        selectGroupMemberUserId,
        addGroupMemberToSelection,
        getAllGroupBans,
        getAllGroupLogs,
        getAllGroupInvitesAndJoinRequests,
        resetData
    } = useGroupModerationData({
        groupMemberModeration,
        currentUser,
        applyGroupMember,
        handleGroupMember,
        tables,
        selection: { selectedUsers, setSelectedUsers },
        groupRequest,
        userRequest
    });

    // ── Batch operations ─────────────────────────────────────────
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

    // ── Local state ──────────────────────────────────────────────
    const selectUserId = ref('');
    const selectedRoles = ref([]);
    const note = ref('');
    const isGroupLogsExportDialogVisible = ref(false);
    const isGroupBansExportDialogVisible = ref(false);
    const isGroupBansImportDialogVisible = ref(false);
    const logsTabRef = ref(null);

    // ── Event handlers ───────────────────────────────────────────
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
        groupMembersDeleteSentInvite({
            onComplete: () => getAllGroupInvitesAndJoinRequests(groupMemberModeration.value.id)
        });
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
    /**
     *
     */
    async function handleSelectUser() {
        await selectGroupMemberUserId(selectUserId.value);
        selectUserId.value = '';
    }
    /**
     *
     */
    function handleLogsRefresh() {
        const eventTypes = logsTabRef.value?.selectedAuditLogTypes ?? [];
        getAllGroupLogs(groupMemberModeration.value.id, eventTypes);
    }

    // ── Dialog open watcher ──────────────────────────────────────
    watch(
        () => groupMemberModeration.value.visible,
        (newVal) => {
            if (newVal) {
                resetData();
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
</script>
