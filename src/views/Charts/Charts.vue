<template>
    <div id="chart" class="x-container">
        <TabsUnderline v-model="activeTab" :items="chartTabs" :unmount-on-hide="false" class="charts-tabs">
            <template #instance>
                <InstanceActivity />
            </template>
            <template #mutual>
                <MutualFriends />
            </template>
        </TabsUnderline>
        <BackToTop target="#chart" :right="30" :bottom="30" />
    </div>
</template>

<script setup>
    import { computed, defineAsyncComponent } from 'vue';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';

    import { useChartsStore } from '../../stores';

    const InstanceActivity = defineAsyncComponent(() => import('./components/InstanceActivity.vue'));
    const MutualFriends = defineAsyncComponent(() => import('./components/MutualFriends.vue'));

    const { t } = useI18n();
    const chartsStore = useChartsStore();
    const { activeTab } = storeToRefs(chartsStore);
    const chartTabs = computed(() => [
        { value: 'instance', label: t('view.charts.instance_activity.header') },
        { value: 'mutual', label: t('view.charts.mutual_friend.tab_label') }
    ]);
</script>

<style scoped>
    :deep(.charts-tabs [data-slot='tabs-list']) {
        margin: 0;
    }
</style>
