<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="sendInviteRequestDialogVisible"
        :title="t('dialog.invite_request_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteRequest">
        <template v-if="currentUser.$isVRCPlus">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-bind="inviteRequestMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteConfirmDialog">
            <el-table-column
                :label="t('table.profile.invite_messages.slot')"
                prop="slot"
                sortable="custom"
                width="70"></el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
            <el-table-column
                :label="t('table.profile.invite_messages.cool_down')"
                prop="updatedAt"
                sortable="custom"
                width="110"
                align="right">
                <template #default="scope">
                    <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                </template>
            </el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.action')" width="70" align="right">
                <template #default="scope">
                    <el-button
                        type="text"
                        icon="el-icon-edit"
                        size="mini"
                        @click.stop="showEditAndSendInviteDialog(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>

        <template #footer>
            <el-button type="small" @click="cancelSendInviteRequest">{{
                t('dialog.invite_request_message.cancel')
            }}</el-button>
            <el-button type="small" @click="refreshInviteMessageTableData('request')">{{
                t('dialog.invite_request_message.refresh')
            }}</el-button>
        </template>
        <SendInviteConfirmDialog
            :visible.sync="isSendInviteConfirmDialogVisible"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <EditAndSendInviteDialog
            :edit-and-send-invite-dialog.sync="editAndSendInviteDialog"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import EditAndSendInviteDialog from '../InviteDialog/EditAndSendInviteDialog.vue';
    import SendInviteConfirmDialog from '../InviteDialog/SendInviteConfirmDialog.vue';

    const { t } = useI18n();

    const inviteStore = useInviteStore();
    const { refreshInviteMessageTableData } = inviteStore;
    const { inviteRequestMessageTable } = storeToRefs(inviteStore);
    const galleryStore = useGalleryStore();
    const { inviteImageUpload } = galleryStore;
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        sendInviteRequestDialogVisible: {
            type: Boolean,
            default: false
        },
        sendInviteDialog: {
            type: Object,
            default: () => ({})
        },
        inviteDialog: {
            type: Object,
            require: false,
            default: () => ({})
        }
    });

    const emit = defineEmits(['update:sendInviteRequestDialogVisible', 'closeInviteDialog']);

    const isSendInviteConfirmDialogVisible = ref(false);

    const editAndSendInviteDialog = ref({
        visible: false,
        newMessage: ''
    });

    function showSendInviteConfirmDialog(row) {
        props.sendInviteDialog.messageSlot = row;
        isSendInviteConfirmDialogVisible.value = true;
    }

    function showEditAndSendInviteDialog(row) {
        props.sendInviteDialog.messageSlot = row;
        editAndSendInviteDialog.value = {
            newMessage: row.message,
            visible: true
        };
    }
    function cancelSendInviteRequest() {
        emit('update:sendInviteRequestDialogVisible', false);
    }

    function closeInviteDialog() {
        cancelSendInviteRequest();
    }
</script>
