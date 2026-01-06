<template>
    <div v-if="isVisible" class="inline-block">
        <TooltipWrapper side="top" :content="t('dialog.user.info.launch_invite_tooltip')"
            ><el-button @click="confirm" size="small" :icon="SwitchButton" circle />
        </TooltipWrapper>
    </div>
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
        location: String
    });

    const isVisible = computed(() => {
        return checkCanInviteSelf(props.location);
    });

    function confirm() {
        launchStore.showLaunchDialog(props.location);
    }
</script>

<style scoped>
    .inline-block {
        display: inline-block;
    }
</style>
