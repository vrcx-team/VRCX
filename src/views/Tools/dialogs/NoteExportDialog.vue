<template>
    <safe-dialog
        class="x-dialog"
        :visible="isNoteExportDialogVisible"
        :title="t('dialog.note_export.header')"
        width="1000px"
        @close="closeDialog">
        <div style="font-size: 12px">
            {{ t('dialog.note_export.description1') }} <br />
            {{ t('dialog.note_export.description2') }} <br />
            {{ t('dialog.note_export.description3') }} <br />
            {{ t('dialog.note_export.description4') }} <br />
            {{ t('dialog.note_export.description5') }} <br />
            {{ t('dialog.note_export.description6') }} <br />
            {{ t('dialog.note_export.description7') }} <br />
            {{ t('dialog.note_export.description8') }} <br />
        </div>

        <el-button size="small" :disabled="loading" style="margin-top: 10px" @click="updateNoteExportDialog">
            {{ t('dialog.note_export.refresh') }}
        </el-button>
        <el-button size="small" :disabled="loading" style="margin-top: 10px" @click="exportNoteExport">
            {{ t('dialog.note_export.export') }}
        </el-button>
        <el-button v-if="loading" size="small" style="margin-top: 10px" @click="cancelNoteExport">
            {{ t('dialog.note_export.cancel') }}
        </el-button>
        <span v-if="loading" style="margin: 10px">
            <i class="el-icon-loading" style="margin-right: 5px"></i>
            {{ t('dialog.note_export.progress') }} {{ progress }}/{{ progressTotal }}
        </span>

        <template v-if="errors">
            <el-button size="small" @click="errors = ''">
                {{ t('dialog.note_export.clear_errors') }}
            </el-button>
            <h2 style="font-weight: bold; margin: 0">
                {{ t('dialog.note_export.errors') }}
            </h2>
            <pre style="white-space: pre-wrap; font-size: 12px" v-text="errors"></pre>
        </template>

        <data-tables v-loading="loading" v-bind="noteExportTable" style="margin-top: 10px">
            <el-table-column :label="t('table.import.image')" width="70" prop="currentAvatarThumbnailImageUrl">
                <template slot-scope="scope">
                    <el-popover placement="right" height="500px" trigger="hover">
                        <img slot="reference" v-lazy="userImage(scope.row.ref)" class="friends-list-avatar" />
                        <img
                            v-lazy="userImageFull(scope.row.ref)"
                            class="friends-list-avatar"
                            style="height: 500px; cursor: pointer"
                            @click="showFullscreenImageDialog(userImageFull(scope.row.ref))" />
                    </el-popover>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.import.name')" width="170" prop="name">
                <template slot-scope="scope">
                    <span class="x-link" @click="showUserDialog(scope.row.id)" v-text="scope.row.name"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.import.note')" prop="memo">
                <template slot-scope="scope">
                    <el-input
                        v-model="scope.row.memo"
                        type="textarea"
                        maxlength="256"
                        show-word-limit
                        :rows="2"
                        :autosize="{ minRows: 1, maxRows: 10 }"
                        size="mini"
                        resize="none"></el-input>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.import.skip_export')" width="90" align="right">
                <template slot-scope="scope">
                    <el-button
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        @click="removeFromNoteExportTable(scope.row)"></el-button>
                </template>
            </el-table-column>
        </data-tables>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import * as workerTimers from 'worker-timers';
    import { miscRequest } from '../../../api';
    import { removeFromArray, userImage, userImageFull } from '../../../shared/utils';
    import { useFriendStore, useGalleryStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { friends } = storeToRefs(useFriendStore());
    const { showUserDialog } = useUserStore();
    const { showFullscreenImageDialog } = useGalleryStore();

    const props = defineProps({
        isNoteExportDialogVisible: {
            type: Boolean
        }
    });

    const noteExportTable = ref({
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    });

    const progress = ref(0);
    const progressTotal = ref(0);
    const loading = ref(false);
    const errors = ref('');

    watch(
        () => props.isNoteExportDialogVisible,
        (newVal) => {
            if (newVal) {
                initData();
            }
        }
    );

    function initData() {
        noteExportTable.value.data = [];
        progress.value = 0;
        progressTotal.value = 0;
        loading.value = false;
        errors.value = '';
    }

    const emit = defineEmits(['close']);

    function updateNoteExportDialog() {
        const data = [];
        friends.value.forEach((ctx) => {
            const newMemo = ctx.memo.replace(/[\r\n]/g, ' ');
            if (ctx.memo && ctx.ref && ctx.ref.note !== newMemo.slice(0, 256)) {
                data.push({
                    id: ctx.id,
                    name: ctx.name,
                    memo: newMemo,
                    ref: ctx.ref
                });
            }
        });
        noteExportTable.value.data = data;
    }

    async function exportNoteExport() {
        let ctx;

        loading.value = true;
        const data = [...noteExportTable.value.data].reverse();
        progressTotal.value = data.length;
        try {
            for (let i = data.length - 1; i >= 0; i--) {
                if (props.isNoteExportDialogVisible && loading.value) {
                    ctx = data[i];
                    await miscRequest.saveNote({
                        targetUserId: ctx.id,
                        note: ctx.memo.slice(0, 256)
                    });
                    removeFromArray(noteExportTable.value.data, ctx);
                    progress.value++;
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 5000);
                    });
                }
            }
        } catch (err) {
            errors.value = `Name: ${ctx?.name}\n${err}\n\n`;
        } finally {
            progress.value = 0;
            progressTotal.value = 0;
            loading.value = false;
        }
    }

    function cancelNoteExport() {
        loading.value = false;
    }

    function removeFromNoteExportTable(ref) {
        removeFromArray(noteExportTable.value.data, ref);
    }

    function closeDialog() {
        emit('close');
    }
</script>
