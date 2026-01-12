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

        <DataTable
            v-bind="inviteRequestResponseMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteResponseConfirmDialog">
            <el-table-column :label="t('table.profile.invite_messages.slot')" prop="slot" :sortable="true" width="70">
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"> </el-table-column>
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                :sortable="true"
                width="110"
                align="right">
                <template #default="scope">
                    <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.action')" width="70" align="right">
                <template #default="scope">
                    <Button size="icon-sm" variant="ghost" @click.stop="showEditAndSendInviteResponseDialog(scope.row)">
                        <SquarePen
                    /></Button>
                </template>
            </el-table-column>
        </DataTable>

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
    import { Button } from '@/components/ui/button';
    import { SquarePen } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';

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
