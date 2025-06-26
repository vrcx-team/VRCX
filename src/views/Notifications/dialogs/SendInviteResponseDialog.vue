<template>
    <safe-dialog
        class="x-dialog"
        :visible="sendInviteResponseDialogVisible"
        :title="t('dialog.invite_response_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteResponse">
        <template v-if="API.currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-bind="inviteResponseMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteResponseConfirmDialog">
            <el-table-column
                :label="t('table.profile.invite_messages.slot')"
                prop="slot"
                sortable="custom"
                width="70" />
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message" />
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                sortable="custom"
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
                        icon="el-icon-edit"
                        size="mini"
                        @click.stop="showEditAndSendInviteResponseDialog(scope.row)" />
                </template>
            </el-table-column>
        </data-tables>

        <template #footer>
            <el-button type="small" @click="cancelSendInviteResponse">{{
                t('dialog.invite_response_message.cancel')
            }}</el-button>
            <el-button type="small" @click="API.refreshInviteMessageTableData('response')">{{
                t('dialog.invite_response_message.refresh')
            }}</el-button>
        </template>
        <EditAndSendInviteResponseDialog
            :edit-and-send-invite-response-dialog.sync="editAndSendInviteResponseDialog"
            :upload-image="uploadImage"
            :send-invite-response-dialog.sync="sendInviteResponseDialog"
            @closeInviteDialog="closeInviteDialog" />
        <SendInviteResponseConfirmDialog
            :send-invite-response-dialog.sync="sendInviteResponseDialog"
            :upload-image="uploadImage"
            :send-invite-response-confirm-dialog="sendInviteResponseConfirmDialog"
            @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import EditAndSendInviteResponseDialog from './EditAndSendInviteResponseDialog.vue';
    import SendInviteResponseConfirmDialog from './SendInviteResponseConfirmDialog.vue';

    const { t } = useI18n();

    const API = inject('API');
    const inviteImageUpload = inject('inviteImageUpload');
    const props = defineProps({
        sendInviteResponseDialog: {
            type: Object,
            default: () => ({})
        },
        sendInviteResponseDialogVisible: {
            type: Boolean,
            default: false
        },
        inviteResponseMessageTable: {
            type: Object,
            default: () => ({})
        },
        uploadImage: {
            type: String
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
