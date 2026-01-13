<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteRequestResponseDialogVisible"
        :title="t('dialog.invite_request_response_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteRequestResponse">
        <template v-if="isLocalUserVrcPlusSupporter">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <DataTableLayout
            style="margin-top: 10px"
            :table="inviteRequestResponseTable"
            :loading="false"
            :show-pagination="false"
            :on-row-click="handleInviteRequestResponseRowClick" />

        <template #footer>
            <Button variant="secondary" class="mr-2" @click="cancelSendInviteRequestResponse">
                {{ t('dialog.invite_request_response_message.cancel') }}
            </Button>
            <Button @click="refreshInviteMessageTableData('requestResponse')">
                {{ t('dialog.invite_request_response_message.refresh') }}
            </Button>
        </template>
        <EditAndSendInviteResponseDialog
            :edit-and-send-invite-response-dialog="editAndSendInviteResponseDialog"
            :send-invite-response-dialog="sendInviteResponseDialog"
            @closeInviteDialog="closeInviteDialog"
            @closeResponseConfirmDialog="closeResponseConfirmDialog" />
        <SendInviteResponseConfirmDialog
            :send-invite-response-dialog="sendInviteResponseDialog"
            :send-invite-response-confirm-dialog="sendInviteResponseConfirmDialog"
            @closeInviteDialog="closeInviteDialog"
            @closeResponseConfirmDialog="closeResponseConfirmDialog" />
    </el-dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import { createColumns } from './sendInviteRequestResponseColumns.jsx';

    import EditAndSendInviteResponseDialog from './EditAndSendInviteResponseDialog.vue';
    import SendInviteResponseConfirmDialog from './SendInviteResponseConfirmDialog.vue';

    const { t } = useI18n();
    const inviteStore = useInviteStore();
    const { refreshInviteMessageTableData } = inviteStore;
    const { inviteRequestResponseMessageTable } = storeToRefs(inviteStore);
    const galleryStore = useGalleryStore();
    const { inviteImageUpload } = galleryStore;
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const props = defineProps({
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        },
        sendInviteRequestResponseDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:sendInviteRequestResponseDialogVisible', 'update:sendInviteResponseDialog']);

    const editAndSendInviteResponseDialog = ref({
        visible: false,
        newMessage: ''
    });

    const sendInviteResponseConfirmDialog = ref({
        visible: false
    });

    const inviteRequestResponseRows = computed(() => inviteRequestResponseMessageTable.value?.data ?? []);
    const inviteRequestResponseColumns = computed(() =>
        createColumns({
            onEdit: showEditAndSendInviteResponseDialog
        })
    );

    const { table: inviteRequestResponseTable } = useVrcxVueTable({
        persistKey: 'invite-request-response-message',
        data: inviteRequestResponseRows,
        columns: inviteRequestResponseColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    function handleInviteRequestResponseRowClick(row) {
        showSendInviteResponseConfirmDialog(row?.original);
    }

    function showEditAndSendInviteResponseDialog(row) {
        emit('update:sendInviteResponseDialog', { ...props.sendInviteResponseDialog, messageSlot: row });
        editAndSendInviteResponseDialog.value = {
            newMessage: row.message,
            visible: true
        };
    }

    function showSendInviteResponseConfirmDialog(row) {
        emit('update:sendInviteResponseDialog', { ...props.sendInviteResponseDialog, messageSlot: row });
        sendInviteResponseConfirmDialog.value.visible = true;
    }

    function closeInviteDialog() {
        cancelSendInviteRequestResponse();
    }

    function closeResponseConfirmDialog() {
        sendInviteResponseConfirmDialog.value.visible = false;
    }

    // function refreshInviteMessageTableData(...arg) {
    //     inviteMessagesRequest.refreshInviteMessageTableData(arg);
    // }

    function cancelSendInviteRequestResponse() {
        emit('update:sendInviteRequestResponseDialogVisible', false);
    }
</script>
