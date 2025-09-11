import { ref, nextTick } from 'vue';
import configRepository from '../../../service/config';

export function useInstanceActivitySettings() {
    const barWidth = ref(25);
    const isDetailVisible = ref(true);
    const isSoloInstanceVisible = ref(true);
    const isNoFriendInstanceVisible = ref(true);

    async function initializeSettings() {
        try {
            const [
                barWidthValue,
                isDetailVisibleValue,
                isSoloInstanceVisibleValue,
                isNoFriendInstanceVisibleValue
            ] = await Promise.all([
                configRepository.getInt('VRCX_InstanceActivityBarWidth', 25),
                configRepository.getBool(
                    'VRCX_InstanceActivityDetailVisible',
                    true
                ),
                configRepository.getBool(
                    'VRCX_InstanceActivitySoloInstanceVisible',
                    true
                ),
                configRepository.getBool(
                    'VRCX_InstanceActivityNoFriendInstanceVisible',
                    true
                )
            ]);

            barWidth.value = barWidthValue;
            isDetailVisible.value = isDetailVisibleValue;
            isSoloInstanceVisible.value = isSoloInstanceVisibleValue;
            isNoFriendInstanceVisible.value = isNoFriendInstanceVisibleValue;
        } catch (error) {
            console.error('Failed to initialize settings:', error);
        }
    }

    function changeBarWidth(value, onSettingsChange) {
        barWidth.value = value;
        configRepository
            .setInt('VRCX_InstanceActivityBarWidth', value)
            .finally(() => {
                if (onSettingsChange) onSettingsChange();
            });
    }

    function changeIsDetailInstanceVisible(value, onSettingsChange) {
        isDetailVisible.value = value;
        configRepository
            .setBool('VRCX_InstanceActivityDetailVisible', value)
            .finally(() => {
                if (onSettingsChange) onSettingsChange();
            });
    }

    function changeIsSoloInstanceVisible(value, onSettingsChange) {
        isSoloInstanceVisible.value = value;
        configRepository
            .setBool('VRCX_InstanceActivitySoloInstanceVisible', value)
            .finally(() => {
                if (onSettingsChange) onSettingsChange();
            });
    }

    function changeIsNoFriendInstanceVisible(value, onSettingsChange) {
        isNoFriendInstanceVisible.value = value;
        configRepository
            .setBool('VRCX_InstanceActivityNoFriendInstanceVisible', value)
            .finally(() => {
                if (onSettingsChange) onSettingsChange();
            });
    }

    function handleChangeSettings(activityDetailChartRef) {
        nextTick(() => {
            if (activityDetailChartRef.value) {
                activityDetailChartRef.value.forEach((child) => {
                    requestAnimationFrame(() => {
                        if (child.echartsInstance) {
                            child.initEcharts();
                        }
                    });
                });
            }
        });
    }

    return {
        barWidth,
        isDetailVisible,
        isSoloInstanceVisible,
        isNoFriendInstanceVisible,

        initializeSettings,
        changeBarWidth,
        changeIsDetailInstanceVisible,
        changeIsSoloInstanceVisible,
        changeIsNoFriendInstanceVisible,
        handleChangeSettings
    };
}
