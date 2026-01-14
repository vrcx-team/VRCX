<template>
    <el-dialog
        :model-value="!!feedFiltersDialogMode"
        :title="dialogTitle"
        width="600px"
        destroy-on-close
        @close="handleDialogClose">
        <div class="toggle-list" style="height: 75vh; overflow-y: auto">
            <div v-for="setting in currentOptions" :key="setting.key" class="toggle-item">
                <span class="toggle-name"
                    >{{ setting.name
                    }}<TooltipWrapper
                        v-if="setting.tooltip"
                        side="top"
                        style="margin-left: 5px"
                        :content="setting.tooltip">
                        <AlertTriangle v-if="setting.tooltipWarning" />
                        <Info v-else />
                    </TooltipWrapper>
                </span>

                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="currentSharedFeedFilters[setting.key]"
                    @update:model-value="
                        (value) => {
                            currentSharedFeedFilters[setting.key] = value;
                            saveSharedFeedFilters();
                        }
                    ">
                    <ToggleGroupItem v-for="option in setting.options" :key="option.label" :value="option.label">
                        {{ t(option.textKey) }}
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <template v-if="photonLoggingEnabled">
                <br />
                <div class="toggle-item">
                    <span class="toggle-name">Photon Event Logging</span>
                </div>
                <div v-for="setting in photonFeedFiltersOptions" :key="setting.key" class="toggle-item">
                    <span class="toggle-name">{{ setting.name }}</span>
                    <ToggleGroup
                        type="single"
                        required
                        variant="outline"
                        size="sm"
                        :model-value="currentSharedFeedFilters[setting.key]"
                        @update:model-value="
                            (value) => {
                                currentSharedFeedFilters[setting.key] = value;
                                saveSharedFeedFilters();
                            }
                        ">
                        <ToggleGroupItem v-for="option in setting.options" :key="option.label" :value="option.label">
                            {{ t(option.textKey) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </template>
        </div>

        <template #footer>
            <Button variant="secondary" @click="currentResetFunction">{{
                t('dialog.shared_feed_filters.reset')
            }}</Button>
            <Button style="margin-left: 10px" @click="handleDialogClose">{{
                t('dialog.shared_feed_filters.close')
            }}</Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { Info, AlertTriangle } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useNotificationsSettingsStore, usePhotonStore, useSharedFeedStore } from '../../../stores';
    import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
    import { feedFiltersOptions, sharedFeedFiltersDefaults } from '../../../shared/constants';

    import configRepository from '../../../service/config';

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

<style scoped>
    .toggle-list .toggle-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }
</style>
