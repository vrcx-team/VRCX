<template>
    <div style="display: flex; align-items: center">
        <div :style="{ width: '10px', height: '55px', backgroundColor: color, marginRight: '6px' }"></div>
        <div>
            <div>{{ displayName }} {{ icon }}</div>
            <div>{{ joinTime }} - {{ leaveTime }}</div>
            <div>{{ duration }}</div>
        </div>
    </div>
</template>

<script setup>
    defineProps(['color', 'displayName', 'icon', 'joinTime', 'leaveTime', 'duration']);
</script>
