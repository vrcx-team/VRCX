<template>
    <GroupCalendarDialog
        :visible="groupCalendar"
        @close="closeDialog('groupCalendar')" />
    <NoteExportDialog
        :isNoteExportDialogVisible="noteExport"
        @close="closeDialog('noteExport')" />
    <ExportDiscordNamesDialog
        v-model:discordNamesDialogVisible="exportDiscordNames"
        :friends="friends" />
    <ExportFriendsListDialog
        v-model:isExportFriendsListDialogVisible="exportFriendsList"
        :friends="friends" />
    <ExportAvatarsListDialog
        v-model:isExportAvatarsListDialogVisible="exportAvatarsList" />
    <EditInviteMessageDialog
        v-model:isEditInviteMessagesDialogVisible="editInviteMessages"
        @close="closeDialog('editInviteMessages')" />
    <RegistryBackupDialog />
    <AutoChangeStatusDialog
        :isAutoChangeStatusDialogVisible="autoChangeStatus"
        @close="closeDialog('autoChangeStatus')" />
</template>

<script setup>
    import { defineAsyncComponent } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useFriendStore, useToolsStore } from '../../../stores';

    import AutoChangeStatusDialog from '../dialogs/AutoChangeStatusDialog.vue';
    import RegistryBackupDialog from '../dialogs/RegistryBackupDialog.vue';

    const GroupCalendarDialog = defineAsyncComponent(
        () => import('../dialogs/GroupCalendarDialog.vue')
    );
    const NoteExportDialog = defineAsyncComponent(
        () => import('../dialogs/NoteExportDialog.vue')
    );
    const EditInviteMessageDialog = defineAsyncComponent(
        () => import('../dialogs/EditInviteMessagesDialog.vue')
    );
    const ExportDiscordNamesDialog = defineAsyncComponent(
        () => import('../dialogs/ExportDiscordNamesDialog.vue')
    );
    const ExportFriendsListDialog = defineAsyncComponent(
        () => import('../dialogs/ExportFriendsListDialog.vue')
    );
    const ExportAvatarsListDialog = defineAsyncComponent(
        () => import('../dialogs/ExportAvatarsListDialog.vue')
    );

    const { friends } = storeToRefs(useFriendStore());
    const toolsStore = useToolsStore();
    const {
        autoChangeStatus,
        editInviteMessages,
        exportAvatarsList,
        exportDiscordNames,
        exportFriendsList,
        groupCalendar,
        noteExport
    } = storeToRefs(toolsStore);

    const { closeDialog } = toolsStore;
</script>
