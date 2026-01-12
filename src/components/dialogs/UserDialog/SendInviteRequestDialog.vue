<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteRequestDialogVisible"
        :title="t('dialog.invite_request_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInviteRequest">
        <template v-if="isLocalUserVrcPlusSupporter">
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <DataTable
            v-bind="inviteRequestMessageTable"
            style="margin-top: 10px; cursor: pointer"
            @row-click="showSendInviteConfirmDialog">
            <el-table-column
                :label="t('table.profile.invite_messages.slot')"
                prop="slot"
                :sortable="true"
                width="70"></el-table-column>
            <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
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
                    <Button size="icon-sm" variant="ghost" @click.stop="showEditAndSendInviteDialog(scope.row)">
                        <SquarePen
                    /></Button>
                </template>
            </el-table-column>
        </DataTable>

        <template #footer>
            <Button variant="secondary" class="mr-2" @click="cancelSendInviteRequest">{{
                t('dialog.invite_request_message.cancel')
            }}</Button>
            <Button @click="refreshInviteMessageTableData('request')">{{
                t('dialog.invite_request_message.refresh')
            }}</Button>
        </template>
        <SendInviteConfirmDialog
            v-model:isSendInviteConfirmDialogVisible="isSendInviteConfirmDialogVisible"
            :sendInviteDialog="sendInviteDialog"
            @update:sendInviteDialog="emit('update:sendInviteDialog', $event)"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <EditAndSendInviteDialog
            :edit-and-send-invite-dialog="editAndSendInviteDialog"
            :sendInviteDialog="sendInviteDialog"
            @update:sendInviteDialog="emit('update:sendInviteDialog', $event)"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { SquarePen } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';

    import EditAndSendInviteDialog from '../InviteDialog/EditAndSendInviteDialog.vue';
    import SendInviteConfirmDialog from '../InviteDialog/SendInviteConfirmDialog.vue';

    const { t } = useI18n();

    const inviteStore = useInviteStore();
    const { refreshInviteMessageTableData } = inviteStore;
    const { inviteRequestMessageTable } = storeToRefs(inviteStore);
    const galleryStore = useGalleryStore();
    const { inviteImageUpload } = galleryStore;
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

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

    const emit = defineEmits(['update:sendInviteRequestDialogVisible', 'closeInviteDialog', 'update:sendInviteDialog']);

    const isSendInviteConfirmDialogVisible = ref(false);

    const editAndSendInviteDialog = ref({
        visible: false,
        newMessage: ''
    });

    function showSendInviteConfirmDialog(row) {
        emit('update:sendInviteDialog', { ...props.sendInviteDialog, messageSlot: row });
        isSendInviteConfirmDialogVisible.value = true;
    }

    function showEditAndSendInviteDialog(row) {
        emit('update:sendInviteDialog', { ...props.sendInviteDialog, messageSlot: row });
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
