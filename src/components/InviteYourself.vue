<template>
    <el-button v-show="isVisible" @click="confirmInvite" size="mini" icon="el-icon-message" circle />
</template>

<script setup>
    import { computed, getCurrentInstance } from 'vue';
    import { instanceRequest } from '../api';
    import { checkCanInviteSelf, parseLocation } from '../shared/utils';

    const props = defineProps({
        location: String,
        shortname: String
    });

    const { proxy } = getCurrentInstance();

    const isVisible = computed(() => checkCanInviteSelf(props.location));

    function confirmInvite() {
        const L = parseLocation(props.location);
        if (!L.isRealInstance) return;

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
</script>
