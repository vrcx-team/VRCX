<template>
    <el-dialog
        class="x-dialog"
        :model-value="isGroupLogsExportDialogVisible"
        :title="t('dialog.group_member_moderation.export_logs')"
        width="650px"
        append-to-body
        @close="setIsGroupLogsExportDialogVisible">
        <el-checkbox-group
            v-model="checkedGroupLogsExportLogsOptions"
            style="margin-bottom: 10px"
            @change="updateGroupLogsExportContent">
            <template v-for="option in checkGroupsLogsExportLogsOptions" :key="option.label">
                <el-checkbox :label="option.label">
                    {{ t(option.text) }}
                </el-checkbox>
            </template>
        </el-checkbox-group>
        <br />
        <el-input
            v-model="groupLogsExportContent"
            type="textarea"
            size="small"
            :rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click="handleCopyGroupLogsExportContent" />
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
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
