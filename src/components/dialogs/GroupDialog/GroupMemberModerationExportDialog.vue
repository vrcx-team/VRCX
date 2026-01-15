<template>
    <Dialog
        :open="isGroupLogsExportDialogVisible"
        @update:open="
            (open) => {
                if (!open) setIsGroupLogsExportDialogVisible();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-162.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group_member_moderation.export_logs') }}</DialogTitle>
            </DialogHeader>

            <div style="margin-bottom: 10px" class="flex flex-col gap-2">
                <label
                    v-for="option in checkGroupsLogsExportLogsOptions"
                    :key="option.label"
                    class="inline-flex items-center gap-2">
                    <Checkbox
                        :model-value="checkedGroupLogsExportLogsOptions.includes(option.label)"
                        @update:modelValue="(val) => toggleGroupLogsExportOption(option.label, val)" />
                    <span>{{ t(option.text) }}</span>
                </label>
            </div>
            <br />
            <InputGroupTextareaField
                v-model="groupLogsExportContent"
                :rows="15"
                readonly
                style="margin-top: 15px"
                input-class="resize-none"
                @click="handleCopyGroupLogsExportContent" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { useI18n } from 'vue-i18n';

    import { copyToClipboard } from '../../../shared/utils';

    const { t } = useI18n();

    const props = defineProps({
        isGroupLogsExportDialogVisible: {
            type: Boolean,
            default: false
        },
        groupLogsModerationTable: {
            type: Object,
            default: () => {}
        }
    });

    const emit = defineEmits(['update:isGroupLogsExportDialogVisible']);
    watch(
        () => props.isGroupLogsExportDialogVisible,
        (newVal) => {
            if (newVal) {
                updateGroupLogsExportContent();
            }
        }
    );

    const groupLogsExportContent = ref('');

    const checkGroupsLogsExportLogsOptions = [
        { label: 'created_at', text: 'dialog.group_member_moderation.created_at' },
        { label: 'eventType', text: 'dialog.group_member_moderation.type' },
        { label: 'actorDisplayName', text: 'dialog.group_member_moderation.display_name' },
        { label: 'description', text: 'dialog.group_member_moderation.description' },
        { label: 'data', text: 'dialog.group_member_moderation.data' }
    ];
    const checkedGroupLogsExportLogsOptions = ref([
        'created_at',
        'eventType',
        'actorDisplayName',
        'description',
        'data'
    ]);

    function toggleGroupLogsExportOption(label, checked) {
        const selection = checkedGroupLogsExportLogsOptions.value;
        const index = selection.indexOf(label);
        if (checked && index === -1) {
            selection.push(label);
        } else if (!checked && index !== -1) {
            selection.splice(index, 1);
        }
        updateGroupLogsExportContent();
    }

    function updateGroupLogsExportContent() {
        const formatter = (str) => (/[\x00-\x1f,"]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str);

        const sortedCheckedOptions = checkGroupsLogsExportLogsOptions
            .filter((option) => checkedGroupLogsExportLogsOptions.value.includes(option.label))
            .map((option) => option.label);

        const header = `${sortedCheckedOptions.join(',')}\n`;

        const content = props.groupLogsModerationTable.data
            .map((item) =>
                sortedCheckedOptions
                    .map((key) => formatter(key === 'data' ? JSON.stringify(item[key]) : item[key]))
                    .join(',')
            )
            .join('\n');

        groupLogsExportContent.value = header + content; // Update ref
    }

    function handleCopyGroupLogsExportContent() {
        copyToClipboard(groupLogsExportContent.value);
    }

    function setIsGroupLogsExportDialogVisible() {
        emit('update:isGroupLogsExportDialogVisible', false);
    }
</script>
