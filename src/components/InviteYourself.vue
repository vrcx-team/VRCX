<template>
    <el-tooltip
        v-if="!canOpenInstanceInGame()"
        placement="top"
        :content="t('dialog.user.info.self_invite_tooltip')"
        :disabled="hideTooltips">
        <el-button v-show="isVisible" @click="confirmInvite" size="mini" :icon="Message" circle />
    </el-tooltip>
    <el-tooltip v-else placement="top" :content="t('dialog.user.info.open_in_vrchat_tooltip')" :disabled="hideTooltips">
        <el-button @click="openInstance" size="mini" :icon="Message" circle />
    </el-tooltip>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { Message } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { instanceRequest } from '../api';
    import { checkCanInviteSelf, parseLocation } from '../shared/utils';
    import { useAppearanceSettingsStore } from '../stores/settings/appearance';
    import { useLaunchStore } from '../stores/launch';
    import { useInviteStore } from '../stores/invite';

    const props = defineProps({
        location: String,
        shortname: String
    });

    const { t } = useI18n();

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());

    const { canOpenInstanceInGame } = useInviteStore();
    const { tryOpenInstanceInVrc } = useLaunchStore();

    const isVisible = computed(() => checkCanInviteSelf(props.location));

    function confirmInvite() {
        const L = parseLocation(props.location);
        if (!L.isRealInstance) {
            return;
        }

        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId,
                shortName: props.shortname
            })
            .then((args) => {
                ElMessage({ message: 'Self invite sent', type: 'success' });
                return args;
            });
    }

    function openInstance() {
        const L = parseLocation(props.location);
        if (!L.isRealInstance) {
            return;
        }

        tryOpenInstanceInVrc(L.tag, props.shortname);
    }
</script>
