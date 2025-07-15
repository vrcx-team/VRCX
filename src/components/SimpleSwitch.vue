<template>
    <div class="simple-switch">
        <div class="name" :style="{ width: longLabel ? '300px' : undefined }">
            {{ label }}
            <el-tooltip v-if="tooltip" placement="top" class="tooltip" :content="tooltip"
                ><i class="el-icon-info"
            /></el-tooltip>
        </div>

        <el-switch class="switch" :value="value" @change="change" :disabled="disabled"></el-switch>
    </div>
</template>

<script setup>
    defineProps({
        label: String,
        value: Boolean,
        tooltip: String,
        disabled: Boolean,
        longLabel: Boolean
    });

    const emit = defineEmits(['change']);

    function change(event) {
        emit('change', event);
    }
</script>

<style scoped>
    .simple-switch {
        font-size: 12px;
        margin-top: 5px;
        display: flex;
    }
    .simple-switch > .name {
        width: 225px;
        min-width: 225px;
        word-wrap: break-word;
    }
    .simple-switch > .switch {
        margin-left: 10px;
    }
    .simple-switch .tooltip {
        margin-left: 5px;
    }
</style>
