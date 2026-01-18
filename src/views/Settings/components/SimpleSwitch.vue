<template>
    <div class="simple-switch">
        <div class="name" :style="{ width: longLabel ? '300px' : undefined }">
            {{ label }}
            <TooltipWrapper v-if="tooltip" side="top" :content="tooltip">
                <Info class="tooltip" />
            </TooltipWrapper>
        </div>

        <Switch class="switch" :model-value="value" @update:modelValue="change" :disabled="disabled" />
    </div>
</template>

<script setup>
    import { Info } from 'lucide-vue-next';

    import { Switch } from '../../../components/ui/switch';
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
        align-items: center;
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
