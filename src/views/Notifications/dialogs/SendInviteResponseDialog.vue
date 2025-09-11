<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteResponseDialogVisible"
        :title="t('dialog.invite_response_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteResponse">
        <template v-if="currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <DataTable
            v-bind="inviteResponseMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteResponseConfirmDialog">
            <el-table-column :label="t('table.profile.invite_messages.slot')" prop="slot" :sortable="true" width="70" />
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message" />
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                :sortable="true"
                width="110"
                align="right">
                <template #default="scope">
                    <countdown-timer :datetime="scope.row.updatedAt" :hours="1" />
                </template>
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.action')" width="70" align="right">
                <template #default="scope">
                    <el-button
                        type="text"
                        :icon="Edit"
                        size="small"
                        @click.stop="showEditAndSendInviteResponseDialog(scope.row)" />
                </template>
            </el-table-column>
        </DataTable>

        <template #footer>
            <el-button @click="cancelSendInviteResponse">{{ t('dialog.invite_response_message.cancel') }}</el-button>
            <el-button @click="refreshInviteMessageTableData('response')">{{
                t('dialog.invite_response_message.refresh')
            }}</el-button>
        </template>
        <EditAndSendInviteResponseDialog
            :edit-and-send-invite-response-dialog="editAndSendInviteResponseDialog"
            :send-invite-response-dialog="sendInviteResponseDialog"
            @update:edit-and-send-invite-response-dialog="editAndSendInviteResponseDialog = $event"
            @update:send-invite-response-dialog="sendInviteResponseDialog = $event"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteResponseConfirmDialog
            :send-invite-response-dialog="sendInviteResponseDialog"
            :send-invite-response-confirm-dialog="sendInviteResponseConfirmDialog"
            @update:send-invite-response-dialog="sendInviteResponseDialog = $event"
            @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { Edit } from '@element-plus/icons-vue';

    import { storeToRefs } from 'pinia';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import EditAndSendInviteResponseDialog from './EditAndSendInviteResponseDialog.vue';
    import SendInviteResponseConfirmDialog from './SendInviteResponseConfirmDialog.vue';

    const { t } = useI18n();

    const inviteStore = useInviteStore();
    const { refreshInviteMessageTableData } = inviteStore;
    const { inviteResponseMessageTable } = storeToRefs(inviteStore);
    const galleryStore = useGalleryStore();
    const { inviteImageUpload } = galleryStore;
    const { currentUser } = storeToRefs(useUserStore());

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

    const emit = defineEmits(['update:sendInviteResponseDialogVisible']);

    const sendInviteResponseConfirmDialog = ref({
        visible: false
    });

    function closeInviteDialog() {
        cancelSendInviteResponse();
    }

    function cancelSendInviteResponse() {
        emit('update:sendInviteResponseDialogVisible', false);
    }

    function showEditAndSendInviteResponseDialog(row) {
        props.sendInviteResponseDialog.messageSlot = row;
        editAndSendInviteResponseDialog.value = {
            newMessage: row.message,
            visible: true
        };
    }
    function showSendInviteResponseConfirmDialog(row) {
        props.sendInviteResponseDialog.messageSlot = row;
        sendInviteResponseConfirmDialog.value.visible = true;
    }
</script>
