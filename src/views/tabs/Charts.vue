<template>
    <div class="x-container" id="chart">
        <div class="options-container" style="margin-top: 0">
            <span class="header">Charts</span>
        </div>
        <instance-activity
            :get-world-name="getWorldName"
            :is-dark-mode="isDarkMode"
            @open-previous-instance-info-dialog="$emit('open-previous-instance-info-dialog', $event)"
            id="instance-activity"
        ></instance-activity>
        <el-backtop target="#chart" :right="30" :bottom="30"></el-backtop>
    </div>
</template>

<script>
    import InstanceActivity from '../../components/charts/InstanceActivity.vue';
    export default {
        name: 'ChartsTab',
        inject: ['API'],
        props: {
            getWorldName: Function,
            isDarkMode: Boolean
        },
        components: {
            InstanceActivity
        }
    };
</script>
