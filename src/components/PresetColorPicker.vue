<script setup>
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import ColorPickerButton from '@/components/ColorPickerButton.vue';

    const { t } = useI18n();

    const props = defineProps({
        modelValue: { type: String, default: '' },
        presets: { type: Array, default: () => [] },
        disabled: { type: Boolean, default: false },
        clearable: { type: Boolean, default: false },
        emptyValue: { type: String, default: '' },
        cols: { type: Number, default: 6 }
    });

    const emit = defineEmits(['update:modelValue', 'change']);

    function normalizeHex(v) {
        const s = String(v || '')
            .trim()
            .toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(s)) return s;
        return '#ffffff';
    }

    const safeValue = computed(() => normalizeHex(props.modelValue));
    const displayText = computed(() => (props.modelValue ? String(props.modelValue) : props.emptyValue));

    function setColor(color) {
        if (props.disabled) return;
        emit('update:modelValue', color);
        emit('change', color);
    }

    function onInput(val) {
        if (props.disabled) return;
        setColor(String(val || ''));
    }

    function clear() {
        if (props.disabled || !props.clearable) return;
        emit('update:modelValue', props.emptyValue);
        emit('change', props.emptyValue);
    }

    const gridStyle = computed(() => ({
        gridTemplateColumns: `repeat(${Math.max(1, props.cols)}, minmax(0, 1fr))`
    }));
</script>

<template>
    <ColorPickerButton :model-value="safeValue" :label="displayText" :disabled="disabled" @update:model-value="onInput">
        <template #trigger-suffix>
            <span v-if="clearable && modelValue" class="ml-1 opacity-60">✕</span>
        </template>

        <template #presets>
            <div class="mt-3 pl-3 pb-3 grid gap-2 border-b" :style="gridStyle">
                <button
                    v-for="color in presets"
                    :key="color"
                    type="button"
                    class="h-6 w-6 rounded border"
                    :style="{ backgroundColor: color }"
                    :disabled="disabled"
                    :aria-disabled="disabled ? 'true' : 'false'"
                    :class="[
                        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        safeValue === String(color).toLowerCase() ? 'ring-[1.5px] ring-offset-[1.5px]' : ''
                    ]"
                    @click="setColor(color)" />
            </div>
        </template>

        <template #footer>
            <div v-if="clearable" class="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" :disabled="disabled" @click="clear">
                    {{ t('view.favorite.clear') }}
                </Button>
            </div>
        </template>
    </ColorPickerButton>
</template>
