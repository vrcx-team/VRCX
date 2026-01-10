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
        <div class="relative mx-auto mt-4 size-75">
            <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="80 80 80 100"
                style="margin-top: 24px"
                xml:space="preserve"
                class="absolute inset-0 size-full">
                <path
                    style="fill: black"
                    d="M291.89,5A3.11,3.11,0,0,1,295,8.11V160.64a3.11,3.11,0,0,1-3.11,3.11H8.11A3.11,3.11,0,0,1,5,160.64V8.11A3.11,3.11,0,0,1,8.11,5H291.89m0-5H8.11A8.11,8.11,0,0,0,0,8.11V160.64a8.11,8.11,0,0,0,8.11,8.11H291.89a8.11,8.11,0,0,0,8.11-8.11V8.11A8.11,8.11,0,0,0,291.89,0Z" />
                <rect style="fill: #c4c4c4" x="5" y="5" width="290" height="158.75" rx="2.5" />
            </svg>
            <RadioGroup
                :model-value="notificationPosition"
                class="absolute inset-0"
                @update:modelValue="changeNotificationPosition">
                <RadioGroupItem
                    id="notificationPosition-topLeft"
                    aria-label="topLeft"
                    value="topLeft"
                    class="absolute top-[20%] left-[10%] -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-top"
                    aria-label="top"
                    value="top"
                    class="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-topRight"
                    aria-label="topRight"
                    value="topRight"
                    class="absolute top-[20%] left-[90%] -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-centerLeft"
                    aria-label="centerLeft"
                    value="centerLeft"
                    class="absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-center"
                    aria-label="center"
                    value="center"
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-centerRight"
                    aria-label="centerRight"
                    value="centerRight"
                    class="absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-bottomLeft"
                    aria-label="bottomLeft"
                    value="bottomLeft"
                    class="absolute top-[80%] left-[10%] -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-bottom"
                    aria-label="bottom"
                    value="bottom"
                    class="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2" />
                <RadioGroupItem
                    id="notificationPosition-bottomRight"
                    aria-label="bottomRight"
                    value="bottomRight"
                    class="absolute top-[80%] left-[90%] -translate-x-1/2 -translate-y-1/2" />
            </RadioGroup>
        </div>

        <template #footer>
            <div style="display: flex">
                <el-button type="primary" style="margin-left: auto" @click="closeDialog">
                    {{ t('dialog.notification_position.ok') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
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
