<template>
    <safe-dialog
        :visible="!!feedFiltersDialogMode"
        :title="dialogTitle"
        width="550px"
        top="5vh"
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

            <template v-if="props.photonLoggingEnabled">
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
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../service/config';
    import { feedFiltersOptions } from '../../../composables/setting/constants/feedFiltersOptions';

    const { t } = useI18n();

    const { notyFeedFiltersOptions, wristFeedFiltersOptions, photonFeedFiltersOptions } = feedFiltersOptions();

    const props = defineProps({
        feedFiltersDialogMode: {
            type: String,
            required: true,
            default: ''
        },
        photonLoggingEnabled: {
            type: Boolean,
            default: false
        },
        sharedFeedFilters: {
            type: Object,
            default: () => ({
                noty: {},
                wrist: {}
            })
        },
        sharedFeedFiltersDefaults: {
            type: Object,
            default: () => ({
                noty: {},
                wrist: {}
            })
        }
    });

    const currentOptions = computed(() => {
        return props.feedFiltersDialogMode === 'noty' ? notyFeedFiltersOptions : wristFeedFiltersOptions;
    });

    const currentSharedFeedFilters = computed(() => {
        return props.feedFiltersDialogMode === 'noty'
            ? props.sharedFeedFilters['noty']
            : props.sharedFeedFilters['wrist'];
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

    const emit = defineEmits(['update:feedFiltersDialogMode', 'updateSharedFeed']);

    function saveSharedFeedFilters() {
        configRepository.setString('sharedFeedFilters', JSON.stringify(props.sharedFeedFilters));
        emit('updateSharedFeed', true);
    }

    function resetNotyFeedFilters() {
        props.sharedFeedFilters.noty = {
            ...props.sharedFeedFiltersDefaults.noty
        };
        saveSharedFeedFilters();
    }

    async function resetWristFeedFilters() {
        props.sharedFeedFilters.wrist = {
            ...props.sharedFeedFiltersDefaults.wrist
        };
        saveSharedFeedFilters();
    }

    function handleDialogClose() {
        emit('update:feedFiltersDialogMode', '');
    }
</script>
