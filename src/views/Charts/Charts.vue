<template>
    <div id="chart" class="x-container">
        <el-tabs v-model="activeTab" class="charts-tabs">
            <el-tab-pane :label="t('view.charts.instance_activity.header')" name="instance"></el-tab-pane>
            <el-tab-pane :label="t('view.charts.mutual_friend.tab_label')" name="mutual"></el-tab-pane>
        </el-tabs>
        <div v-show="activeTab === 'instance'">
            <InstanceActivity />
        </div>
        <div v-show="activeTab === 'mutual'">
            <MutualFriends />
        </div>
        <el-backtop target="#chart" :right="30" :bottom="30"></el-backtop>
    </div>
</template>

<script setup>
    import { defineAsyncComponent } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useChartsStore } from '../../stores';

    const InstanceActivity = defineAsyncComponent(() => import('./components/InstanceActivity.vue'));
    const MutualFriends = defineAsyncComponent(() => import('./components/MutualFriends.vue'));

    const { t } = useI18n();
    const chartsStore = useChartsStore();
    const { activeTab } = storeToRefs(chartsStore);
</script>

<style scoped>
    :deep(.el-tabs__header) {
        margin: 0;
    }
</style>
