<template>
    <el-alert
        v-if="lastStatus"
        :title="lastStatus"
        type="warning"
        show-icon
        center
        :closable="true"
        @close="onAlertClose"></el-alert>
</template>
<script setup>
    import { storeToRefs } from 'pinia';
    import { useVrcStatusStore } from '../stores';

    const { lastStatus, isAlertClosed } = storeToRefs(useVrcStatusStore());

    function onAlertClose() {
        isAlertClosed.value = true;
    }
</script>
