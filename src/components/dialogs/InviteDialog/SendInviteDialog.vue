<template>
    <el-dialog
        class="x-dialog"
        :model-value="sendInviteDialogVisible"
        :title="t('dialog.invite_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInvite">
        <template v-if="isLocalUserVrcPlusSupporter">
            <!--            <template v-if="gallerySelectDialog.selectedFileId">-->
            <!--                <div style="display: inline-block; flex: none; margin-right: 5px">-->
            <!--                    <el-popover placement="right" :width="500px" trigger="click">-->
            <!--                        <template #reference>-->
            <!--                            <img-->
            <!--                                class="x-link"-->
            <!--                                :src="gallerySelectDialog.selectedImageUrl"-->
            <!--                                style="flex: none; width: 60px; height: 60px; border-radius: 4px; object-fit: cover" />-->
            <!--                        </template>-->
            <!--                        <img-->
            <!--                            class="x-link"-->
            <!--                            :src="gallerySelectDialog.selectedImageUrl"-->
            <!--                            style="height: 500px"-->
            <!--                            @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)" />-->
            <!--                    </el-popover>-->
            <!--                </div>-->
            <!--                <el-button size="small" @click="clearImageGallerySelect" style="vertical-align: top">-->
            <!--                    {{ t('dialog.invite_message.clear_selected_image') }}-->
            <!--                </el-button>-->
            <!--            </template>-->
            <!--            <template v-else>-->
            <!--                <el-button size="small" @click="showGallerySelectDialog" style="margin-right: 5px">-->
            <!--                    {{ t('dialog.invite_message.select_image') }}-->
            <!--                </el-button>-->
            <!--            </template>-->
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <DataTable
            v-bind="inviteMessageTable"
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
                    <el-button
                        type="text"
                        :icon="Edit"
                        size="small"
                        @click.stop="showEditAndSendInviteDialog(scope.row)"></el-button>
                </template>
            </el-table-column>
        </DataTable>

        <template #footer>
            <el-button @click="cancelSendInvite">
                {{ t('dialog.invite_message.cancel') }}
            </el-button>
            <el-button @click="refreshInviteMessageTableData('message')">
                {{ t('dialog.invite_message.refresh') }}
            </el-button>
        </template>
        <SendInviteConfirmDialog
            v-model:isSendInviteConfirmDialogVisible="isSendInviteConfirmDialogVisible"
            :sendInviteDialog="sendInviteDialog"
            @update:sendInviteDialog="emit('update:sendInviteDialog', $event)"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
        <EditAndSendInviteDialog
            v-model:edit-and-send-invite-dialog="editAndSendInviteDialog"
            :sendInviteDialog="sendInviteDialog"
            @update:sendInviteDialog="emit('update:sendInviteDialog', $event)"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { Edit } from '@element-plus/icons-vue';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';

    import EditAndSendInviteDialog from './EditAndSendInviteDialog.vue';
    import SendInviteConfirmDialog from './SendInviteConfirmDialog.vue';

    const { t } = useI18n();

    const { refreshInviteMessageTableData } = useInviteStore();
    const { inviteMessageTable } = storeToRefs(useInviteStore());
    const { inviteImageUpload } = useGalleryStore();
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const props = defineProps({
        sendInviteDialogVisible: {
            type: Boolean,
            default: false
        },
        sendInviteDialog: {
            type: Object,
            required: true
        },
        inviteDialog: {
            type: Object,
            required: false,
            default: () => ({})
        }
    });

    const emit = defineEmits(['closeInviteDialog', 'update:sendInviteDialogVisible', 'update:sendInviteDialog']);

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

    function cancelSendInvite() {
        emit('update:sendInviteDialogVisible', false);
    }

    function closeInviteDialog() {
        cancelSendInvite();
        emit('closeInviteDialog');
    }
</script>
