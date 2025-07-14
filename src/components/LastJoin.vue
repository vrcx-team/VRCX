<template>
    <span v-if="lastJoin">
        <el-tooltip placement="top" style="margin-left: 5px">
            <template #content>
                <span>{{ $t('dialog.user.info.last_join') }} <Timer :epoch="lastJoin" /></span>
            </template>
            <i class="el-icon el-icon-location-outline" style="display: inline-block" />
        </el-tooltip>
    </span>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { useInstanceStore } from '../stores';

    const { instanceJoinHistory } = storeToRefs(useInstanceStore());

    const props = defineProps({
        location: String,
        currentlocation: String
    });

    const lastJoin = ref(null);

    function parse() {
        lastJoin.value = instanceJoinHistory.value.get(props.location);
    }

    watch(() => props.location, parse, { immediate: true });
    watch(() => props.currentlocation, parse);
</script>
