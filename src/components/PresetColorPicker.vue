<script setup>
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';

    const props = defineProps({
        modelValue: { type: String, default: '' },

        presets: {
            type: Array,
            default: () => []
        },

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

    function onInput(e) {
        if (props.disabled) return;
        const v = e?.target?.value;
        setColor(String(v || ''));
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
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="flex items-center gap-2 px-2" :disabled="disabled">
                <span class="h-4 w-4 rounded border" :style="{ backgroundColor: safeValue }" />
                <span class="font-mono text-xs opacity-80">
                    {{ displayText }}
                </span>

                <span v-if="clearable && modelValue" class="ml-1 opacity-60">✕</span>
            </Button>
        </PopoverTrigger>

        <PopoverContent class="w-56 p-3">
            <div class="mb-3 grid gap-2" :style="gridStyle">
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
                        safeValue === String(color).toLowerCase() ? 'ring-2 ring-offset-2' : ''
                    ]"
                    @click="setColor(color)" />
            </div>

            <input
                type="color"
                class="h-8 w-full cursor-pointer border-none bg-transparent p-0"
                :value="safeValue"
                :disabled="disabled"
                @input="onInput" />

            <div v-if="clearable" class="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" :disabled="disabled" @click="clear"> Clear </Button>
            </div>
        </PopoverContent>
    </Popover>
</template>
