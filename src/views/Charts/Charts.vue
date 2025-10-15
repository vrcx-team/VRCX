<template>
    <div id="chart" class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.charts.header') }}</span>
        </div>
        <keep-alive>
            <InstanceActivity />
        </keep-alive>
        <el-backtop target="#chart" :right="30" :bottom="30"></el-backtop>
    </div>
</template>

<script setup>
    import { defineAsyncComponent } from 'vue';
    import { useI18n } from 'vue-i18n';

    const InstanceActivity = defineAsyncComponent(() => import('./components/InstanceActivity.vue'));

    const { t } = useI18n();
</script>
