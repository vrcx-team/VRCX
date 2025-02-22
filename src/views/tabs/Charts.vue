<template>
    <div id="chart" class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ $t('view.charts.header') }}</span>
        </div>
        <instance-activity
            :get-world-name="getWorldName"
            :is-dark-mode="isDarkMode"
            :dt-hour12="dtHour12"
            :friends-map="friendsMap"
            :localFavoriteFriends="localFavoriteFriends"
            @open-previous-instance-info-dialog="$emit('open-previous-instance-info-dialog', $event)"
        ></instance-activity>
        <el-backtop target="#chart" :right="30" :bottom="30"></el-backtop>
    </div>
</template>

<script>
    import InstanceActivity from '../../components/charts/InstanceActivity.vue';
    export default {
        name: 'ChartsTab',
        components: {
            InstanceActivity
        },
        props: {
            getWorldName: Function,
            isDarkMode: Boolean,
            dtHour12: Boolean,
            friendsMap: Map,
            localFavoriteFriends: Set
        }
    };
</script>
