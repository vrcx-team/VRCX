<template>
    <el-alert v-if="statusText" type="warning" show-icon center :closable="true" @close="onAlertClose">
        <template #title>
            <span @click="openStatusPage" class="status-text">
                {{ statusText }}
            </span>
        </template>
    </el-alert>
</template>
<script setup>
    import { storeToRefs } from 'pinia';
    import { useVrcStatusStore } from '../stores';
    import { openExternalLink } from '../shared/utils';

    const { statusText, isAlertClosed } = storeToRefs(useVrcStatusStore());

    isAlertClosed.value = false;

    function onAlertClose() {
        isAlertClosed.value = true;
    }

    function openStatusPage() {
        if (isAlertClosed.value) {
            return;
        }
        openExternalLink('https://status.vrchat.com');
    }
</script>

<style scoped>
    .status-text {
        cursor: pointer;
    }

    .status-text:hover {
        text-decoration: underline;
    }
</style>
