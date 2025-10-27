<template>
    <span v-if="lastJoin" :class="['inline-block', 'ml-5']">
        <el-tooltip placement="top" class="ml-5">
            <template #content>
                <span>{{ t('dialog.user.info.last_join') }} <Timer :epoch="lastJoin" /></span>
            </template>
            <el-icon style="display: inline-block"><Location /></el-icon>
        </el-tooltip>
    </span>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { Location } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
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

<style scoped>
    .ml-5 {
        margin-left: 5px;
    }
    .inline-block {
        display: inline-block;
    }
</style>
