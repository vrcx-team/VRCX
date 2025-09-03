<template>
    <el-dialog
        class="x-dialog"
        :model-value="isNotificationPositionDialogVisible"
        :title="t('dialog.notification_position.header')"
        width="400px"
        @close="closeDialog">
        <div style="font-size: 12px">
            {{ t('dialog.notification_position.description') }}
        </div>
        <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 300 200"
            style="margin-top: 15px"
            xml:space="preserve"
            class="notification-position">
            <path
                style="fill: black"
                d="M291.89,5A3.11,3.11,0,0,1,295,8.11V160.64a3.11,3.11,0,0,1-3.11,3.11H8.11A3.11,3.11,0,0,1,5,160.64V8.11A3.11,3.11,0,0,1,8.11,5H291.89m0-5H8.11A8.11,8.11,0,0,0,0,8.11V160.64a8.11,8.11,0,0,0,8.11,8.11H291.89a8.11,8.11,0,0,0,8.11-8.11V8.11A8.11,8.11,0,0,0,291.89,0Z" />
            <rect style="fill: #c4c4c4" x="5" y="5" width="290" height="158.75" rx="2.5" />
        </svg>
        <el-radio-group :model-value="notificationPosition" size="small" @change="changeNotificationPosition">
            <el-radio label="topLeft" style="margin: 0; position: absolute; left: 35px; top: 120px">‎</el-radio>
            <el-radio label="top" style="margin: 0; position: absolute; left: 195px; top: 120px">‎</el-radio>
            <el-radio label="topRight" style="margin: 0; position: absolute; right: 25px; top: 120px">‎</el-radio>
            <el-radio label="centerLeft" style="margin: 0; position: absolute; left: 35px; top: 200px">‎</el-radio>
            <el-radio label="center" style="margin: 0; position: absolute; left: 195px; top: 200px">‎</el-radio>
            <el-radio label="centerRight" style="margin: 0; position: absolute; right: 25px; top: 200px">‎</el-radio>
            <el-radio label="bottomLeft" style="margin: 0; position: absolute; left: 35px; top: 280px">‎</el-radio>
            <el-radio label="bottom" style="margin: 0; position: absolute; left: 195px; top: 280px">‎</el-radio>
            <el-radio label="bottomRight" style="margin: 0; position: absolute; right: 25px; top: 280px">‎</el-radio>
        </el-radio-group>

        <template #footer>
            <div style="display: flex">
                <el-button type="primary" size="small" style="margin-left: auto" @click="closeDialog">
                    {{ t('dialog.notification_position.ok') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { useNotificationsSettingsStore } from '../../../stores';

    const { t } = useI18n();
    const notificationsSettingsStore = useNotificationsSettingsStore();
    const { notificationPosition } = storeToRefs(notificationsSettingsStore);
    const { changeNotificationPosition } = notificationsSettingsStore;

    defineProps({
        isNotificationPositionDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isNotificationPositionDialogVisible']);

    function closeDialog() {
        emit('update:isNotificationPositionDialogVisible', false);
    }
</script>
