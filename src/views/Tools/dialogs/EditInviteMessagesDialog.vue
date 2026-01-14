<template>
    <el-dialog
        class="x-dialog"
        :model-value="isEditInviteMessagesDialogVisible"
        :title="t('dialog.edit_invite_messages.header')"
        width="1000px"
        @close="closeDialog">
        <TabsUnderline v-model="activeTab" :items="editInviteTabs" :unmount-on-hide="false" class="mt-2.5">
            <template #message>
                <DataTableLayout
                    style="margin-top: 10px; cursor: pointer"
                    :table="inviteMessageTanstackTable"
                    :loading="false"
                    :show-pagination="false"
                    :on-row-click="handleEditInviteMessageRowClick" />
            </template>
            <template #request>
                <DataTableLayout
                    style="margin-top: 10px; cursor: pointer"
                    :table="inviteRequestTanstackTable"
                    :loading="false"
                    :show-pagination="false"
                    :on-row-click="handleEditInviteMessageRowClick" />
            </template>
            <template #requestResponse>
                <DataTableLayout
                    style="margin-top: 10px; cursor: pointer"
                    :table="inviteRequestResponseTanstackTable"
                    :loading="false"
                    :show-pagination="false"
                    :on-row-click="handleEditInviteMessageRowClick" />
            </template>
            <template #response>
                <DataTableLayout
                    style="margin-top: 10px; cursor: pointer"
                    :table="inviteResponseTanstackTable"
                    :loading="false"
                    :show-pagination="false"
                    :on-row-click="handleEditInviteMessageRowClick" />
            </template>
        </TabsUnderline>
    </el-dialog>
    <template v-if="isEditInviteMessagesDialogVisible">
        <EditInviteMessageDialog
            v-model:isEditInviteMessageDialogVisible="isEditInviteMessageDialogVisible"
            :inviteMessage="inviteMessage"
            @close="isEditInviteMessageDialogVisible = false"
            @updateInviteMessages="refreshInviteMessageTableData" />
    </template>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    import { columns as inviteMessageColumns } from './editInviteMessagesMessageColumns.jsx';
    import { columns as inviteRequestColumns } from './editInviteMessagesRequestColumns.jsx';
    import { columns as inviteRequestResponseColumns } from './editInviteMessagesRequestResponseColumns.jsx';
    import { columns as inviteResponseColumns } from './editInviteMessagesResponseColumns.jsx';
    import { useInviteStore } from '../../../stores';

    import EditInviteMessageDialog from './EditInviteMessageDialog.vue';

    const {
        inviteMessageTable,
        inviteRequestMessageTable,
        inviteRequestResponseMessageTable,
        inviteResponseMessageTable
    } = storeToRefs(useInviteStore());
    const { refreshInviteMessageTableData } = useInviteStore();

    const { t } = useI18n();

    const props = defineProps({
        isEditInviteMessagesDialogVisible: {
            type: Boolean
        }
    });

    const activeTab = ref('message');
    const editInviteTabs = computed(() => [
        { value: 'message', label: t('dialog.edit_invite_messages.invite_message_tab') },
        { value: 'request', label: t('dialog.edit_invite_messages.invite_request_tab') },
        { value: 'requestResponse', label: t('dialog.edit_invite_messages.invite_request_response_tab') },
        { value: 'response', label: t('dialog.edit_invite_messages.invite_response_tab') }
    ]);

    const isEditInviteMessageDialogVisible = ref(false);
    const inviteMessage = ref({});

    watch(
        () => props.isEditInviteMessagesDialogVisible,
        (newVal) => {
            if (newVal) {
                refreshInviteMessageTableData('message');
                refreshInviteMessageTableData('request');
                refreshInviteMessageTableData('requestResponse');
                refreshInviteMessageTableData('response');
            }
        }
    );

    const emit = defineEmits(['close']);

    function closeDialog() {
        emit('close');
    }

    const inviteMessageRows = computed(() => inviteMessageTable.value?.data ?? []);
    const inviteRequestRows = computed(() => inviteRequestMessageTable.value?.data ?? []);
    const inviteRequestResponseRows = computed(() => inviteRequestResponseMessageTable.value?.data ?? []);
    const inviteResponseRows = computed(() => inviteResponseMessageTable.value?.data ?? []);

    const { table: inviteMessageTanstackTable } = useVrcxVueTable({
        persistKey: 'edit-invite-messages:message',
        data: inviteMessageRows,
        columns: inviteMessageColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    const { table: inviteRequestTanstackTable } = useVrcxVueTable({
        persistKey: 'edit-invite-messages:request',
        data: inviteRequestRows,
        columns: inviteRequestColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    const { table: inviteRequestResponseTanstackTable } = useVrcxVueTable({
        persistKey: 'edit-invite-messages:request-response',
        data: inviteRequestResponseRows,
        columns: inviteRequestResponseColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    const { table: inviteResponseTanstackTable } = useVrcxVueTable({
        persistKey: 'edit-invite-messages:response',
        data: inviteResponseRows,
        columns: inviteResponseColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    function handleEditInviteMessageRowClick(row) {
        showEditInviteMessageDialog(row?.original);
    }

    function showEditInviteMessageDialog(row) {
        if (row.updatedAt) {
            const cooldownEnd = new Date(row.updatedAt);
            cooldownEnd.setHours(cooldownEnd.getHours() + 1);
            const now = new Date();
            if (now < cooldownEnd) {
                toast.warning('This invite message is on cooldown and cannot be edited yet.');
                return;
            }
        }
        inviteMessage.value = row;
        isEditInviteMessageDialogVisible.value = true;
    }
</script>
