<template>
    <el-tooltip
        v-show="isVisible"
        placement="top"
        :content="t('dialog.user.info.launch_invite_tooltip')"
        :disabled="hideTooltips">
        <el-button @click="confirm" size="mini" :icon="SwitchButton" circle />
    </el-tooltip>
</template>

<script setup>
    import { SwitchButton } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { checkCanInviteSelf } from '../shared/utils';
    import { useLaunchStore } from '../stores';

    const launchStore = useLaunchStore();
    const { t } = useI18n();

    const props = defineProps({
        location: String,
        hideTooltips: Boolean
    });

    const isVisible = computed(() => {
        return checkCanInviteSelf(props.location);
    });

    function confirm() {
        launchStore.showLaunchDialog(props.location);
    }
</script>
