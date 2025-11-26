<template>
    <el-dialog
        class="x-dialog"
        :model-value="isEditInviteMessagesDialogVisible"
        :title="t('dialog.edit_invite_messages.header')"
        width="1000px"
        @close="closeDialog">
        <el-tabs v-model="activeTab" style="margin-top: 10px">
            <el-tab-pane :label="t('dialog.edit_invite_messages.invite_message_tab')" name="message">
                <DataTable
                    v-bind="inviteMessageTable"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="showEditInviteMessageDialog">
                    <el-table-column
                        :label="t('table.profile.invite_messages.slot')"
                        prop="slot"
                        :sortable="true"
                        width="70"></el-table-column>
                    <el-table-column
                        :label="t('table.profile.invite_messages.message')"
                        prop="message"></el-table-column>
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
                </DataTable>
            </el-tab-pane>
            <el-tab-pane :label="t('dialog.edit_invite_messages.invite_request_tab')" name="request">
                <DataTable
                    v-bind="inviteRequestMessageTable"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="showEditInviteMessageDialog">
                    <el-table-column
                        :label="t('table.profile.invite_messages.slot')"
                        prop="slot"
                        :sortable="true"
                        width="70"></el-table-column>
                    <el-table-column
                        :label="t('table.profile.invite_messages.message')"
                        prop="message"></el-table-column>
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
                </DataTable>
            </el-tab-pane>
            <el-tab-pane :label="t('dialog.edit_invite_messages.invite_request_response_tab')" name="requestResponse">
                <DataTable
                    v-bind="inviteRequestResponseMessageTable"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="showEditInviteMessageDialog">
                    <el-table-column
                        :label="t('table.profile.invite_messages.slot')"
                        prop="slot"
                        :sortable="true"
                        width="70"></el-table-column>
                    <el-table-column
                        :label="t('table.profile.invite_messages.message')"
                        prop="message"></el-table-column>
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
                </DataTable>
            </el-tab-pane>
            <el-tab-pane :label="t('dialog.edit_invite_messages.invite_response_tab')" name="response">
                <DataTable
                    v-bind="inviteResponseMessageTable"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="showEditInviteMessageDialog">
                    <el-table-column
                        :label="t('table.profile.invite_messages.slot')"
                        prop="slot"
                        :sortable="true"
                        width="70"></el-table-column>
                    <el-table-column
                        :label="t('table.profile.invite_messages.message')"
                        prop="message"></el-table-column>
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
                </DataTable>
            </el-tab-pane>
        </el-tabs>
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
    import { ref, watch } from 'vue';
    import { ElMessage } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useInviteStore } from '../../../stores';

    import DataTable from '../../../components/DataTable.vue';
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

    function showEditInviteMessageDialog(row) {
        if (row.updatedAt) {
            const cooldownEnd = new Date(row.updatedAt);
            cooldownEnd.setHours(cooldownEnd.getHours() + 1);
            const now = new Date();
            if (now < cooldownEnd) {
                ElMessage({
                    message: 'This invite message is on cooldown and cannot be edited yet.',
                    type: 'warning'
                });
                return;
            }
        }
        inviteMessage.value = row;
        isEditInviteMessageDialogVisible.value = true;
    }
</script>
