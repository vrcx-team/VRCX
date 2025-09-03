<template>
    <el-tooltip
        v-if="!canOpenInstanceInGame()"
        placement="top"
        :content="t('dialog.user.info.self_invite_tooltip')"
        :disabled="hideTooltips">
        <el-button v-show="isVisible" @click="confirmInvite" size="mini" icon="el-icon-message" circle />
    </el-tooltip>
    <el-tooltip v-else placement="top" :content="t('dialog.user.info.open_in_vrchat_tooltip')" :disabled="hideTooltips">
        <el-button @click="openInstance" size="mini" icon="el-icon-message" circle />
    </el-tooltip>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
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

    const { proxy } = getCurrentInstance();

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
                proxy.$message({ message: 'Self invite sent', type: 'success' });
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
