<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteResponseDialogVisible"
        :title="t('dialog.invite_response_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteResponse">
        <template v-if="isLocalUserVrcPlusSupporter">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <DataTableLayout
            style="margin-top: 10px"
            :table="inviteResponseTable"
            :loading="false"
            :show-pagination="false"
            :on-row-click="handleInviteResponseRowClick" />

        <template #footer>
            <Button variant="secondary" class="mr-2" @click="cancelSendInviteResponse">{{
                t('dialog.invite_response_message.cancel')
            }}</Button>
            <Button @click="refreshInviteMessageTableData('response')">{{
                t('dialog.invite_response_message.refresh')
            }}</Button>
        </template>
        <EditAndSendInviteResponseDialog
            :edit-and-send-invite-response-dialog="editAndSendInviteResponseDialog"
            :send-invite-response-dialog="sendInviteResponseDialog"
            @closeResponseConfirmDialog="closeResponseConfirmDialog"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteResponseConfirmDialog
            :send-invite-response-dialog="sendInviteResponseDialog"
            :send-invite-response-confirm-dialog="sendInviteResponseConfirmDialog"
            @closeResponseConfirmDialog="closeResponseConfirmDialog"
            @closeInviteDialog="closeInviteDialog" />
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
    import { createColumns } from './sendInviteResponseColumns.jsx';

    import EditAndSendInviteResponseDialog from './EditAndSendInviteResponseDialog.vue';
    import SendInviteResponseConfirmDialog from './SendInviteResponseConfirmDialog.vue';

    const { t } = useI18n();

    const inviteStore = useInviteStore();
    const { refreshInviteMessageTableData } = inviteStore;
    const { inviteResponseMessageTable } = storeToRefs(inviteStore);
    const galleryStore = useGalleryStore();
    const { inviteImageUpload } = galleryStore;
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const props = defineProps({
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        },
        sendInviteResponseDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const editAndSendInviteResponseDialog = ref({
        visible: false,
        newMessage: ''
    });

    const emit = defineEmits(['update:sendInviteResponseDialogVisible', 'update:sendInviteResponseDialog']);

    const sendInviteResponseConfirmDialog = ref({
        visible: false
    });

    const inviteResponseRows = computed(() => inviteResponseMessageTable.value?.data ?? []);
    const inviteResponseColumns = computed(() =>
        createColumns({
            onEdit: showEditAndSendInviteResponseDialog
        })
    );

    const { table: inviteResponseTable } = useVrcxVueTable({
        persistKey: 'invite-response-message',
        data: inviteResponseRows,
        columns: inviteResponseColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    function handleInviteResponseRowClick(row) {
        showSendInviteResponseConfirmDialog(row?.original);
    }

    function closeInviteDialog() {
        cancelSendInviteResponse();
    }

    function cancelSendInviteResponse() {
        emit('update:sendInviteResponseDialogVisible', false);
    }

    function closeResponseConfirmDialog() {
        sendInviteResponseConfirmDialog.value.visible = false;
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
</script>
