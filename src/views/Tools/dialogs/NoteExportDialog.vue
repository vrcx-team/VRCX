<template>
    <Dialog :open="isNoteExportDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-5xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.note_export.header') }}</DialogTitle>
            </DialogHeader>
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

            <Button
                size="sm"
                class="mr-2"
                variant="outline"
                :disabled="loading"
                style="margin-top: 10px"
                @click="updateNoteExportDialog">
                {{ t('dialog.note_export.refresh') }}
            </Button>
            <Button
                size="sm"
                class="mr-2"
                variant="outline"
                :disabled="loading"
                style="margin-top: 10px"
                @click="exportNoteExport">
                {{ t('dialog.note_export.export') }}
            </Button>
            <Button v-if="loading" size="sm" variant="outline" style="margin-top: 10px" @click="cancelNoteExport">
                {{ t('dialog.note_export.cancel') }}
            </Button>
            <span v-if="loading" style="margin: 10px">
                <Loader2 style="margin-right: 5px" />
                {{ t('dialog.note_export.progress') }} {{ progress }}/{{ progressTotal }}
            </span>

            <template v-if="errors">
                <Button size="sm" variant="outline" @click="errors = ''">
                    {{ t('dialog.note_export.clear_errors') }}
                </Button>
                <h2 style="font-weight: bold; margin: 0">
                    {{ t('dialog.note_export.errors') }}
                </h2>
                <pre style="white-space: pre-wrap; font-size: 12px" v-text="errors"></pre>
            </template>

            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="loading"
                :table-style="tableStyle"
                :show-pagination="false"
                style="margin-top: 10px" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { Loader2 } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { removeFromArray, userImage, userImageFull } from '../../../shared/utils';
    import { useFriendStore, useGalleryStore, useUserStore } from '../../../stores';
    import { createColumns } from './noteExportColumns.jsx';
    import { miscRequest } from '../../../api';
    import { useVrcxVueTable } from '../../../lib/table/useVrcxVueTable';

    import * as workerTimers from 'worker-timers';

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
            size: 'small'
        },
        layout: 'table'
    });

    const tableStyle = { maxHeight: '500px' };

    const rows = computed(() => (Array.isArray(noteExportTable.value?.data) ? noteExportTable.value.data.slice() : []));

    const columns = computed(() =>
        createColumns({
            userImage,
            userImageFull,
            onShowFullscreenImage: showFullscreenImageDialog,
            onShowUser: showUserDialog,
            onRemove: removeFromNoteExportTable
        })
    );

    const { table } = useVrcxVueTable({
        persistKey: 'noteExportDialog',
        data: rows,
        columns: columns.value,
        getRowId: (row) => String(row?.id ?? ''),
        enablePagination: false,
        enableSorting: false
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
