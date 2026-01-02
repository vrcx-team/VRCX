<template>
    <div class="simple-switch">
        <div class="name" :style="{ width: longLabel ? '300px' : undefined }">
            {{ label }}
            <el-tooltip v-if="tooltip" placement="top" :content="tooltip"
                ><el-icon size="small" class="tooltip"><InfoFilled /></el-icon
            ></el-tooltip>
        </div>

        <el-switch class="switch" :model-value="value" @change="change" :disabled="disabled"></el-switch>
    </div>
</template>

<script setup>
    import { InfoFilled } from '@element-plus/icons-vue';
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
        display: flex;
    }
    .simple-switch > .name {
        width: 225px;
        min-width: 225px;
        word-wrap: break-word;
        padding-top: 7px;
        display: flex;
        align-items: center;
    }
    .simple-switch > .switch {
        margin-left: 10px;
    }
    .simple-switch .tooltip {
        margin-left: 3px;
    }
</style>
