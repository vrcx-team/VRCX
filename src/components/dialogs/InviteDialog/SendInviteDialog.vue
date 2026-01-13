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

        <DataTableLayout
            style="margin-top: 10px"
            :table="inviteMessageTanstackTable"
            :loading="false"
            :show-pagination="false"
            :on-row-click="handleInviteMessageRowClick" />

        <template #footer>
            <Button variant="secondary" @click="cancelSendInvite">
                {{ t('dialog.invite_message.cancel') }}
            </Button>
            <Button variant="outline" @click="refreshInviteMessageTableData('message')">
                {{ t('dialog.invite_message.refresh') }}
            </Button>
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
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    import { useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import { createColumns } from './sendInviteColumns.jsx';

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

    const inviteMessageRows = computed(() => inviteMessageTable.value?.data ?? []);
    const inviteMessageColumns = computed(() =>
        createColumns({
            onEdit: showEditAndSendInviteDialog
        })
    );

    const { table: inviteMessageTanstackTable } = useVrcxVueTable({
        persistKey: 'invite-message',
        data: inviteMessageRows,
        columns: inviteMessageColumns,
        getRowId: (row) => String(row?.slot ?? ''),
        enablePagination: false,
        initialSorting: [{ id: 'slot', desc: false }]
    });

    function handleInviteMessageRowClick(row) {
        showSendInviteConfirmDialog(row?.original);
    }

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
