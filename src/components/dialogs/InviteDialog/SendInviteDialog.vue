<template>
    <safe-dialog
        class="x-dialog"
        :visible="sendInviteDialogVisible"
        :title="t('dialog.invite_message.header')"
        width="800px"
        append-to-body
        @close="cancelSendInvite">
        <template v-if="API.currentUser.$isVRCPlus">
            <!--            <template v-if="gallerySelectDialog.selectedFileId">-->
            <!--                <div style="display: inline-block; flex: none; margin-right: 5px">-->
            <!--                    <el-popover placement="right" width="500px" trigger="click">-->
            <!--                        <template #reference>-->
            <!--                            <img-->
            <!--                                class="x-link"-->
            <!--                                v-lazy="gallerySelectDialog.selectedImageUrl"-->
            <!--                                style="flex: none; width: 60px; height: 60px; border-radius: 4px; object-fit: cover" />-->
            <!--                        </template>-->
            <!--                        <img-->
            <!--                            class="x-link"-->
            <!--                            v-lazy="gallerySelectDialog.selectedImageUrl"-->
            <!--                            style="height: 500px"-->
            <!--                            @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)" />-->
            <!--                    </el-popover>-->
            <!--                </div>-->
            <!--                <el-button size="mini" @click="clearImageGallerySelect" style="vertical-align: top">-->
            <!--                    {{ t('dialog.invite_message.clear_selected_image') }}-->
            <!--                </el-button>-->
            <!--            </template>-->
            <!--            <template v-else>-->
            <!--                <el-button size="mini" @click="showGallerySelectDialog" style="margin-right: 5px">-->
            <!--                    {{ t('dialog.invite_message.select_image') }}-->
            <!--                </el-button>-->
            <!--            </template>-->
            <input class="inviteImageUploadButton" type="file" accept="image/*" @change="inviteImageUpload" />
        </template>

        <data-tables
            v-bind="inviteMessageTable"
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
            <el-button type="small" @click="cancelSendInvite">
                {{ t('dialog.invite_message.cancel') }}
            </el-button>
            <el-button type="small" @click="API.refreshInviteMessageTableData('message')">
                {{ t('dialog.invite_message.refresh') }}
            </el-button>
        </template>
        <SendInviteConfirmDialog
            :visible.sync="isSendInviteConfirmDialogVisible"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            :upload-image="uploadImage"
            @closeInviteDialog="closeInviteDialog" />
        <EditAndSendInviteDialog
            :edit-and-send-invite-dialog.sync="editAndSendInviteDialog"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            :upload-image="uploadImage"
            @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import EditAndSendInviteDialog from './EditAndSendInviteDialog.vue';
    import SendInviteConfirmDialog from './SendInviteConfirmDialog.vue';

    const { t } = useI18n();

    const API = inject('API');
    const inviteImageUpload = inject('inviteImageUpload');

    const props = defineProps({
        sendInviteDialogVisible: {
            type: Boolean,
            default: false
        },
        inviteMessageTable: {
            type: Object,
            default: () => ({})
        },
        sendInviteDialog: {
            type: Object,
            required: true
        },
        inviteDialog: {
            type: Object,
            required: false,
            default: () => ({})
        },
        uploadImage: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['closeInviteDialog', 'update:sendInviteDialogVisible']);

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

    function cancelSendInvite() {
        emit('update:sendInviteDialogVisible', false);
    }

    function closeInviteDialog() {
        cancelSendInvite();
        emit('closeInviteDialog');
    }
</script>
