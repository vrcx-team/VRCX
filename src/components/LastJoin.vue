<template>
    <span v-if="lastJoin">
        <el-tooltip placement="top" style="margin-left: 5px">
            <template #content>
                <span>{{ t('dialog.user.info.last_join') }} <Timer :epoch="lastJoin" /></span>
            </template>
            <el-icon style="display: inline-block"><Location /></el-icon>
        </el-tooltip>
    </span>
</template>

<script setup>
    import { Location } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useInstanceStore } from '../stores';

    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
    const { t } = useI18n();

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
