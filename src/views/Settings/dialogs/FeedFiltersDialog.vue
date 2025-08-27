<template>
    <safe-dialog
        :visible="!!feedFiltersDialogMode"
        :title="dialogTitle"
        width="550px"
        destroy-on-close
        @close="handleDialogClose">
        <div class="toggle-list" style="height: 75vh; overflow-y: auto">
            <div v-for="setting in currentOptions" :key="setting.key" class="toggle-item">
                <span class="toggle-name"
                    >{{ setting.name
                    }}<el-tooltip
                        v-if="setting.tooltip"
                        placement="top"
                        style="margin-left: 5px"
                        :content="setting.tooltip">
                        <i :class="setting.tooltipIcon || 'el-icon-info'"></i> </el-tooltip
                ></span>

                <el-radio-group
                    v-model="currentSharedFeedFilters[setting.key]"
                    size="mini"
                    @change="saveSharedFeedFilters">
                    <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                        {{ t(option.textKey) }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <template v-if="photonLoggingEnabled">
                <br />
                <div class="toggle-item">
                    <span class="toggle-name">Photon Event Logging</span>
                </div>
                <div v-for="setting in photonFeedFiltersOptions" :key="setting.key" class="toggle-item">
                    <span class="toggle-name">{{ setting.name }}</span>
                    <el-radio-group
                        v-model="currentSharedFeedFilters[setting.key]"
                        size="mini"
                        @change="saveSharedFeedFilters">
                        <el-radio-button v-for="option in setting.options" :key="option.label" :label="option.label">
                            {{ t(option.textKey) }}
                        </el-radio-button>
                    </el-radio-group>
                </div>
            </template>
        </div>

        <template #footer>
            <el-button size="small" @click="currentResetFunction">{{
                t('dialog.shared_feed_filters.reset')
            }}</el-button>
            <el-button size="small" type="primary" style="margin-left: 10px" @click="handleDialogClose">{{
                t('dialog.shared_feed_filters.close')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../service/config';
    import { feedFiltersOptions, sharedFeedFiltersDefaults } from '../../../shared/constants';
    import { useNotificationsSettingsStore, usePhotonStore, useSharedFeedStore } from '../../../stores';

    const { t } = useI18n();

    const { photonLoggingEnabled } = storeToRefs(usePhotonStore());
    const { notyFeedFiltersOptions, wristFeedFiltersOptions, photonFeedFiltersOptions } = feedFiltersOptions();
    const { sharedFeedFilters } = storeToRefs(useNotificationsSettingsStore());
    const { updateSharedFeed } = useSharedFeedStore();

    const props = defineProps({
        feedFiltersDialogMode: {
            type: String,
            required: true,
            default: ''
        }
    });

    const currentOptions = computed(() => {
        return props.feedFiltersDialogMode === 'noty' ? notyFeedFiltersOptions : wristFeedFiltersOptions;
    });

    const currentSharedFeedFilters = computed(() => {
        return props.feedFiltersDialogMode === 'noty'
            ? sharedFeedFilters.value['noty']
            : sharedFeedFilters.value['wrist'];
    });

    const dialogTitle = computed(() => {
        const key =
            props.feedFiltersDialogMode === 'noty'
                ? 'dialog.shared_feed_filters.notification'
                : 'dialog.shared_feed_filters.wrist';
        return t(key);
    });

    const currentResetFunction = computed(() => {
        return props.feedFiltersDialogMode === 'noty' ? resetNotyFeedFilters : resetWristFeedFilters;
    });

    const emit = defineEmits(['update:feedFiltersDialogMode']);

    function saveSharedFeedFilters() {
        configRepository.setString('sharedFeedFilters', JSON.stringify(sharedFeedFilters.value));
        updateSharedFeed(true);
    }

    function resetNotyFeedFilters() {
        sharedFeedFilters.value.noty = {
            ...sharedFeedFiltersDefaults.noty
        };
        saveSharedFeedFilters();
    }

    async function resetWristFeedFilters() {
        sharedFeedFilters.value.wrist = {
            ...sharedFeedFiltersDefaults.wrist
        };
        saveSharedFeedFilters();
    }

    function handleDialogClose() {
        emit('update:feedFiltersDialogMode', '');
    }
</script>
