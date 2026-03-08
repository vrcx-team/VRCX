<template>
    <Dialog
        :open="isGroupBansExportDialogVisible"
        @update:open="
            (open) => {
                if (!open) setIsGroupBansExportDialogVisible();
            }
        ">
        <DialogContent class="x-dialog sm:max-w-162.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group_member_moderation.export_bans') }}</DialogTitle>
            </DialogHeader>

            <div class="flex flex-col gap-2 mb-2">
                <label v-for="option in exportBansOptions" :key="option.label" class="inline-flex items-center gap-2">
                    <Checkbox
                        :model-value="checkedExportBansOptions.includes(option.label)"
                        @update:modelValue="(val) => toggleExportOption(option.label, val)" />
                    <span>{{ t(option.text) }}</span>
                </label>
            </div>
            <br />
            <InputGroupTextareaField
                v-model="exportContent"
                :rows="15"
                readonly
                input-class="resize-none mt-4"
                @click="handleCopyExportContent" />
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { ref, watch } from 'vue';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { useI18n } from 'vue-i18n';

    import { copyToClipboard, formatCsvField } from '../../../shared/utils';

    const { t } = useI18n();

    const props = defineProps({
        isGroupBansExportDialogVisible: {
            type: Boolean,
            default: false
        },
        groupBansModerationTable: {
            type: Object,
            default: () => {}
        }
    });

    const emit = defineEmits(['update:isGroupBansExportDialogVisible']);

    watch(
        () => props.isGroupBansExportDialogVisible,
        (newVal) => {
            if (newVal) {
                updateExportContent();
            }
        }
    );

    const exportContent = ref('');

    const exportBansOptions = [
        { label: 'userId', text: 'dialog.group_member_moderation.user_id' },
        { label: 'displayName', text: 'dialog.group_member_moderation.display_name' },
        { label: 'roles', text: 'dialog.group_member_moderation.roles' },
        { label: 'managerNotes', text: 'dialog.group_member_moderation.notes' },
        { label: 'joinedAt', text: 'dialog.group_member_moderation.joined_at' },
        { label: 'bannedAt', text: 'dialog.group_member_moderation.banned_at' }
    ];

    const checkedExportBansOptions = ref(['userId', 'displayName', 'roles', 'managerNotes', 'joinedAt', 'bannedAt']);

    /**
     *
     * @param label
     * @param checked
     */
    function toggleExportOption(label, checked) {
        const selection = checkedExportBansOptions.value;
        const index = selection.indexOf(label);
        if (checked && index === -1) {
            selection.push(label);
        } else if (!checked && index !== -1) {
            selection.splice(index, 1);
        }
        updateExportContent();
    }

    /**
     *
     * @param item
     * @param key
     */
    function getRowValue(item, key) {
        switch (key) {
            case 'displayName':
                return item?.user?.displayName ?? item?.$displayName ?? '';
            case 'roles': {
                const ids = Array.isArray(item?.roleIds) ? item.roleIds : [];
                return ids.join(';');
            }
            default:
                return item?.[key] ?? '';
        }
    }

    /**
     *
     */
    function updateExportContent() {
        const sortedCheckedOptions = exportBansOptions
            .filter((option) => checkedExportBansOptions.value.includes(option.label))
            .map((option) => option.label);

        const header = `${sortedCheckedOptions.join(',')}\n`;

        const content = props.groupBansModerationTable.data
            .map((item) => sortedCheckedOptions.map((key) => formatCsvField(String(getRowValue(item, key)))).join(','))
            .join('\n');

        exportContent.value = header + content;
    }

    /**
     *
     */
    function handleCopyExportContent() {
        copyToClipboard(exportContent.value);
    }

    /**
     *
     */
    function setIsGroupBansExportDialogVisible() {
        emit('update:isGroupBansExportDialogVisible', false);
    }
</script>
